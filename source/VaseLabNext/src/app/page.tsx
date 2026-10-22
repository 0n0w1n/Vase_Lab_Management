import { redirect } from "next/navigation";

// No landing page: the (main) layout sends anyone not signed in on to /login.
export default function Page() {
  redirect("/request");
}
