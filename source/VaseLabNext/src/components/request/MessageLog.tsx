"use client";

import { useActionState, useState } from "react";
import { postComment, type ActionState } from "@/app/(main)/request/[requestId]/actions";
import { Button } from "@/components/ui/button";
import InitialsAvatar from "@/components/request/InitialsAvatar";
import { formatDateTime } from "@/lib/format";
import type { LogMessage } from "@/types/request";

type Props = {
  requestId: string;
  messages: LogMessage[];
};

export default function MessageLog({ requestId, messages }: Props) {
  const [draft, setDraft] = useState("");
  const [state, send, pending] = useActionState(
    async (_previous: ActionState, formData: FormData) => {
      const result = await postComment(requestId, formData);
      if (!result.message) setDraft("");
      return result;
    },
    {},
  );

  return (
    <section>
      <header className="flex items-center justify-between pb-4">
        <h2 className="font-heading text-lg font-bold">Message Log</h2>
        <span className="text-sm text-muted-foreground">
          {messages.length} {messages.length === 1 ? "message" : "messages"}
        </span>
      </header>

      <ol className="flex flex-col gap-4">
        {messages.map((message) => (
          <li key={message.id} className="flex gap-3">
            <InitialsAvatar initials={message.author.initials} />
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-bold">{message.author.name}</p>
                {message.at && (
                  <time dateTime={message.at} className="text-sm text-muted-foreground">
                    {formatDateTime(message.at, ", ")}
                  </time>
                )}
              </div>
              <p className="pt-0.5 text-sm whitespace-pre-wrap wrap-anywhere">{message.body}</p>
            </div>
          </li>
        ))}
      </ol>

      {messages.length === 0 && (
        <p className="text-sm text-muted-foreground">
          No messages yet — start the conversation below.
        </p>
      )}

      <form
        action={send}
        className="mt-6 flex items-center gap-3 rounded-xl bg-background p-3 ring-1 ring-surface-border"
      >
        <input
          name="body"
          required
          maxLength={1000}
          readOnly={pending}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Type a message..."
          aria-label="Message"
          className="h-10 min-w-0 flex-1 rounded-lg bg-background px-4 text-sm ring-1 ring-surface-border outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-brand"
        />
        <Button
          type="submit"
          size="lg"
          disabled={pending || draft.trim().length === 0}
          className="bg-brand px-6 text-brand-foreground hover:bg-brand/85"
        >
          {pending ? "Sending…" : "Send"}
        </Button>
      </form>
      {state.message && (
        <p role="alert" className="mt-2 text-sm text-red-600">{state.message}</p>
      )}
    </section>
  );
}
