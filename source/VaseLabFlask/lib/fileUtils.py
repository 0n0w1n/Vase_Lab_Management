"""Check attachment names and sizes, then store their bytes on disk.

File contents are not inspected. This module does not manage SQL or permissions.
A successful save returns metadata; a failed save cleans up its own files.
"""

from dataclasses import dataclass
from pathlib import Path, PurePosixPath, PureWindowsPath
from tempfile import NamedTemporaryFile
import unicodedata
from uuid import uuid4

from flask import current_app
from werkzeug.datastructures import FileStorage


MAX_FILENAME_LENGTH = 100
COPY_CHUNK_BYTES = 64 * 1024
# Allowed extensions and their declared MIME types, without content detection.
ALLOWED_FILE_TYPES = {
    "pdf": "application/pdf",
    "jpg": "image/jpeg",
    "jpeg": "image/jpeg",
    "png": "image/png",
    "rar": "application/vnd.rar",
    "zip": "application/zip",
}


class UploadValidationError(ValueError):
    """A rejected upload; the route maps its code to an HTTP status."""

    def __init__(self, code: str, message: str):
        super().__init__(message)
        self.code = code


@dataclass(frozen=True)
class StoredUpload:
    original_name: str
    relative_path: str
    size_bytes: int
    mime_type: str


def resolve_file_path(relative_path: str) -> Path:
    """Resolve a storage key without allowing absolute paths or root escapes.

    Check both Windows and POSIX syntax so a key has the same meaning in local
    Windows development and in the Linux Docker container. Resolving symlinks
    also prevents an existing directory link from escaping the storage root.
    """
    if (
        not isinstance(relative_path, str)
        or not relative_path
        or "\\" in relative_path
        or ":" in relative_path
        or any(unicodedata.category(char).startswith("C") for char in relative_path)
        or PurePosixPath(relative_path).is_absolute()
        or PureWindowsPath(relative_path).drive
        or ".." in PurePosixPath(relative_path).parts
    ):
        raise ValueError("Invalid storage path")

    root = Path(current_app.config["UPLOAD_ROOT"]).resolve()
    candidate = (root / relative_path).resolve()
    if candidate == root or not candidate.is_relative_to(root):
        raise ValueError("Storage path is outside the upload directory")
    return candidate


def validate_and_save_upload(upload: FileStorage, request_id: int) -> StoredUpload:
    """Check name, extension and byte count, then save under a UUID key."""
    if not isinstance(request_id, int) or isinstance(request_id, bool) or request_id <= 0:
        raise ValueError("Request ID must be a positive integer")

    original_name = unicodedata.normalize("NFC", upload.filename or "")
    if any(unicodedata.category(char).startswith("C") for char in original_name):
        raise UploadValidationError("30", "Invalid file name")
    original_name = original_name.strip()
    if (
        not original_name
        or len(original_name) > MAX_FILENAME_LENGTH
        or any(char in original_name for char in "/\\:")
    ):
        raise UploadValidationError("30", "Invalid file name")

    extension = PurePosixPath(original_name).suffix.lstrip(".").lower()
    if extension not in ALLOWED_FILE_TYPES:
        raise UploadValidationError("31", "File extension is not allowed")

    max_bytes = current_app.config["MAX_FILE_BYTES"]
    if not isinstance(max_bytes, int) or isinstance(max_bytes, bool) or max_bytes <= 0:
        raise ValueError("MAX_FILE_BYTES must be a positive integer")

    temporary_directory = resolve_file_path(".tmp")
    temporary_directory.mkdir(parents=True, exist_ok=True, mode=0o700)
    storage_key = f"requests/{request_id}/{uuid4().hex}.{extension}"
    destination = resolve_file_path(storage_key)
    temporary_path = None
    published = False

    try:
        size_bytes = 0
        # NamedTemporaryFile creates a unique file exclusively, with private
        # permissions. Close it before renaming for Windows support.
        with NamedTemporaryFile(
            mode="wb", prefix="upload-", suffix=".part",
            dir=temporary_directory, delete=False,
        ) as temporary:
            temporary_path = Path(temporary.name)
            while chunk := upload.stream.read(COPY_CHUNK_BYTES):
                size_bytes += len(chunk)
                if size_bytes > max_bytes:
                    raise UploadValidationError("32", "File size limit exceeded")
                temporary.write(chunk)

        if size_bytes == 0:
            raise UploadValidationError("34", "Empty files are not allowed")

        mime_type = ALLOWED_FILE_TYPES[extension]
        destination.parent.mkdir(parents=True, exist_ok=True, mode=0o700)
        if destination.exists():
            raise FileExistsError("Generated storage key already exists")
        temporary_path.replace(destination)
        published = True
        return StoredUpload(original_name, storage_key, size_bytes, mime_type)
    except Exception:
        # Never hide the original failure when compensating cleanup also fails.
        for cleanup_path in (temporary_path, destination if published else None):
            if cleanup_path is not None:
                try:
                    cleanup_path.unlink(missing_ok=True)
                except OSError:
                    current_app.logger.exception("Could not clean up upload %s", cleanup_path)
        raise


def remove_stored_file(relative_path: str) -> None:
    """Remove bytes after a known failed SQL write; a missing file is harmless."""
    resolve_file_path(relative_path).unlink(missing_ok=True)
