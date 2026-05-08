import { redirect } from "next/navigation";
import { isPortalAuthed } from "@/app/lib/portalAuth";
import PortalShell from "@/app/portal/(protected)/portalShell";

export default function ProtectedPortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!isPortalAuthed()) {
    redirect("/portal/login");
  }

  return <PortalShell>{children}</PortalShell>;
}

