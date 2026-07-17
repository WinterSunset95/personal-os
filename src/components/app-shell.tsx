import Link from "next/link";
import { Archive, FileText, LayoutDashboard, Layers3 } from "lucide-react";

const links = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/projects", label: "Projects", icon: Layers3 },
  { href: "/documents", label: "Documents", icon: FileText },
  { href: "/archive", label: "Archive", icon: Archive },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-muted/30">
    <header className="border-b bg-background"><div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
      <Link href="/" className="font-semibold tracking-tight">Personal OS</Link>
      <nav className="flex items-center gap-1">{links.map(({ href, label, icon: Icon }) => <Link key={href} href={href} className="inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground transition hover:bg-muted hover:text-foreground"><Icon className="size-4" />{label}</Link>)}</nav>
    </div></header>
    <main className="mx-auto max-w-6xl px-5 py-10">{children}</main>
  </div>;
}
