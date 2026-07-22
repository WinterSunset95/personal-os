import Link from "next/link";
import { Archive, FileText, LayoutDashboard, Layers3, LogIn } from "lucide-react";
import { GlobalSearch } from "@/features/tasks/global-search";
import { ThemeToggle } from "@/components/theme-toggle";
import { UserMenu } from "@/components/user-menu";
import { auth } from "@/auth";

const links = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/projects", label: "Projects", icon: Layers3 },
  { href: "/documents", label: "Documents", icon: FileText },
  { href: "/archive", label: "Archive", icon: Archive },
];

export async function AppShell({ children }: { children: React.ReactNode }) {
  const session = await auth();

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-border/80 bg-background/85 backdrop-blur-xl">
        <div className="mx-auto flex min-h-16 max-w-7xl flex-wrap items-center gap-3 px-4 sm:px-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 font-semibold tracking-tight"
          >
            <span className="grid size-7 place-items-center rounded-lg bg-primary text-xs font-bold text-primary-foreground">
              P
            </span>
            Personal OS
          </Link>
          <nav className="order-3 flex w-full gap-1 overflow-x-auto sm:order-2 sm:w-auto sm:flex-1">
            {links.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className="inline-flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              >
                <Icon className="size-4" />
                {label}
              </Link>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-2 sm:order-3">
            <GlobalSearch />
            <ThemeToggle />
            {session?.user ? (
              <UserMenu user={session.user} />
            ) : (
              <Link
                href="/auth/signin"
                className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground shadow-xs hover:bg-primary/90 transition-colors"
              >
                <LogIn className="size-3.5" />
                Sign In
              </Link>
            )}
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
        {children}
      </main>
    </div>
  );
}
