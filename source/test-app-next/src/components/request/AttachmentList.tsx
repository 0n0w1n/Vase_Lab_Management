import { Download, FileText, FileVideo, Paperclip } from "lucide-react";
import { formatDate, formatFileSize } from "@/lib/format";
import type { Attachment } from "@/types/request";

type Props = {
  attachments: Attachment[];
};

export default function AttachmentList({ attachments }: Props) {
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
            const Icon = file.kind === "media" ? FileVideo : FileText;
            return (
              <li
                key={file.id}
                className="flex items-center gap-3 rounded-lg bg-surface px-4 py-3"
              >
                <Icon className="size-5 shrink-0 text-brand" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(file.bytes)} · Uploaded{" "}
                    {formatDate(file.uploadedAt)}
                  </p>
                </div>
                <a
                  href={`/api/attachments/${file.id}`}
                  download={file.name}
                  aria-label={`Download ${file.name}`}
                  className="grid size-8 shrink-0 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  <Download className="size-4" />
                </a>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
