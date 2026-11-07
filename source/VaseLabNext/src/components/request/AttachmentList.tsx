"use client";

import { useState, useTransition } from "react";
import { Download, FileText, Paperclip } from "lucide-react";
import { downloadAttachment } from "@/app/(main)/request/[requestId]/actions";
import AttachmentUpload from "@/components/request/AttachmentUpload";
import { formatDate, formatFileSize } from "@/lib/format";
import type { Attachment } from "@/types/request";

type Props = {
  requestId: string;
  attachments: Attachment[];
  canUpload: boolean;
};

export default function AttachmentList({ requestId, attachments, canUpload }: Props) {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState("");

  function download(file: Attachment) {
    setMessage("");
    startTransition(async () => {
      const result = await downloadAttachment(file.id);
      if ("message" in result) {
        setMessage(result.message);
        return;
      }
      const url = URL.createObjectURL(new Blob([result.data], { type: result.type }));
      const link = document.createElement("a");
      link.href = url;
      link.download = file.name;
      document.body.appendChild(link);
      link.click();
      link.remove();
      // Leave time for the browser to start reading the download.
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    });
  }

  return (
    <section className="rounded-xl bg-background p-5 ring-1 ring-surface-border">
      <header className="flex items-center justify-between pb-3">
        <h2 className="font-heading font-semibold">Attached Files</h2>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
          <Paperclip className="size-3.5" />
          {attachments.length} {attachments.length === 1 ? "file" : "files"}
        </span>
      </header>

      {attachments.length === 0 ? (
        <p className="py-3 text-sm text-muted-foreground">
          No files were attached to this request.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {attachments.map((file) => {
            const details = [
              file.bytes === "Unknown" ? "Unknown size" : formatFileSize(file.bytes),
              file.uploadedAt && `Uploaded ${formatDate(file.uploadedAt)}`,
            ].filter(Boolean);
            return (
              <li
                key={file.id}
                className="flex items-center gap-3 rounded-lg bg-surface px-4 py-3"
              >
                <FileText className="size-5 shrink-0 text-brand" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {details.join(" · ")}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => download(file)}
                  disabled={pending}
                  aria-label={`Download ${file.name}`}
                  className="grid size-8 shrink-0 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  <Download className="size-4" />
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {message && <p role="alert" className="text-xs text-red-600">{message}</p>}
      {canUpload && <AttachmentUpload requestId={requestId} />}
    </section>
  );
}
