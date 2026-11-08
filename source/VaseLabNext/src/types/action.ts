/** What a delete Server Action hands back to the modal that called it. */
export type ActionResult = { ok: true } | { ok: false; message: string };
