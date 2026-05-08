export const metadata = {
  title: "Portal",
  robots: { index: false, follow: false },
};

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  // Protected layout lives under /portal/(protected).
  return <>{children}</>;
}

