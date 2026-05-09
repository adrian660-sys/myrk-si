import { redirect } from "next/navigation";

export default function PortalComposeRedirectPage() {
  redirect("/portal/inbox?compose=1");
}
