"use client";

import { useActionState, useState } from "react";
import { Upload } from "lucide-react";
import { uploadAttachment, type ActionState } from "@/app/(main)/request/[requestId]/actions";

const INITIAL_STATE: ActionState = {};
const MAX_BYTES = 10 * 1024 * 1024;
// Same types Flask allows; the server checks again
const ACCEPTED_TYPES = ".pdf,.jpg,.jpeg,.png,.zip,.rar";

/** Owner and managers only: pick one file and add it to the request. */
export default function AttachmentUpload({ requestId }: { requestId: string }) {
  const [state, formAction, pending] = useActionState(uploadAttachment, INITIAL_STATE);
  const [tooBig, setTooBig] = useState(false);
  const message = tooBig ? "Files must be 10 MB or smaller." : state.message;

  return (
    <form action={formAction} className="flex flex-col gap-1.5 pt-3">
      <input type="hidden" name="requestId" value={requestId} />
      <div className="flex items-center gap-2">
        <input
          type="file"
          name="file"
          required
          accept={ACCEPTED_TYPES}
          aria-label="File to upload"
          // Catch big files here so the user doesn't wait for a 10 MB upload to fail
          onChange={(event) => setTooBig((event.target.files?.[0]?.size ?? 0) > MAX_BYTES)}
          className="min-w-0 flex-1 text-sm text-muted-foreground file:mr-3 file:rounded-md file:border-0 file:bg-muted file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-foreground"
        />
        <button
          type="submit"
          disabled={pending || tooBig}
          className="inline-flex items-center gap-1.5 rounded-md bg-brand px-3 py-1.5 text-xs font-semibold text-brand-foreground transition-colors hover:bg-brand/85 disabled:opacity-50"
        >
          <Upload className="size-3.5" />
          {pending ? "Uploading…" : "Upload"}
        </button>
      </div>
      {message && (
        <p role="alert" className="text-xs font-medium text-red-600">
          {message}
        </p>
      )}
    </form>
  );
}
