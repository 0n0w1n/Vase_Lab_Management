"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import InitialsAvatar from "@/components/request/InitialsAvatar";
import { formatDateTime } from "@/lib/format";
import type { LogMessage, Person } from "@/types/request";

type Props = {
  messages: LogMessage[];
  /** Whoever is signed in; their messages are the ones the composer sends. */
  author: Person;
};

export default function MessageLog({ messages, author }: Props) {
  const [thread, setThread] = useState(messages);
  const [draft, setDraft] = useState("");

  function send() {
    const body = draft.trim();
    if (!body) return;

    // TODO: POST to the Flask message endpoint and reconcile with its response.
    setThread((current) => [
      ...current,
      {
        id: `local-${current.length + 1}`,
        author,
        at: new Date().toISOString(),
        body,
      },
    ]);
    setDraft("");
  }

  return (
    <section>
      <header className="flex items-center justify-between pb-4">
        <h2 className="font-heading text-lg font-bold">Message Log</h2>
        <span className="text-sm text-muted-foreground">
          {thread.length} {thread.length === 1 ? "message" : "messages"}
        </span>
      </header>

      <ol className="flex flex-col gap-4">
        {thread.map((message) => (
          <li key={message.id} className="flex gap-3">
            <InitialsAvatar initials={message.author.initials} />
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-bold">{message.author.name}</p>
                <time
                  dateTime={message.at}
                  className="text-sm text-muted-foreground"
                >
                  {formatDateTime(message.at, ", ")}
                </time>
              </div>
              <p className="pt-0.5 text-sm">{message.body}</p>
            </div>
          </li>
        ))}
      </ol>

      {thread.length === 0 && (
        <p className="text-sm text-muted-foreground">
          No messages yet — start the conversation below.
        </p>
      )}

      <form
        onSubmit={(event) => {
          event.preventDefault();
          send();
        }}
        className="mt-6 flex items-center gap-3 rounded-xl bg-background p-3 ring-1 ring-surface-border"
      >
        <input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Type a message..."
          aria-label="Message"
          className="h-10 min-w-0 flex-1 rounded-lg bg-background px-4 text-sm ring-1 ring-surface-border outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-brand"
        />
        <Button
          type="submit"
          size="lg"
          disabled={draft.trim().length === 0}
          className="bg-brand px-6 text-brand-foreground hover:bg-brand/85"
        >
          Send
        </Button>
      </form>
    </section>
  );
}
