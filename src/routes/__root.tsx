import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
  useRouterState,
} from "@tanstack/react-router";

import appCss from "../styles.css?url";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import {
  Bell,
  Search,
  LayoutDashboard,
  ArrowLeftRight,
  Plus,
  PieChart,
  Target,
  User,
} from "lucide-react";
import { Input } from "@/components/ui/input";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4" style={{ background: "var(--background)" }}>
      <div className="max-w-md text-center">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl" style={{ background: "var(--accent)" }}>
          <span style={{ fontSize: 36 }}>🔍</span>
        </div>
        <h1 className="text-7xl font-bold" style={{ color: "var(--foreground)" }}>404</h1>
        <h2 className="mt-4 text-xl font-semibold" style={{ color: "var(--foreground)" }}>Page not found</h2>
        <p className="mt-2 text-sm" style={{ color: "var(--muted-foreground)" }}>
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-lg px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 active:scale-95"
            style={{ background: "var(--primary)" }}
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();

  return (
    <div className="flex min-h-screen items-center justify-center px-4" style={{ background: "var(--background)" }}>
      <div className="max-w-md text-center">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl" style={{ background: "#FEF2F2" }}>
          <span style={{ fontSize: 36 }}>⚠️</span>
        </div>
        <h1 className="text-xl font-semibold tracking-tight" style={{ color: "var(--foreground)" }}>
          This page didn't load
        </h1>
        <p className="mt-2 text-sm" style={{ color: "var(--muted-foreground)" }}>
          Something went wrong. Try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => { router.invalidate(); reset(); }}
            className="inline-flex items-center justify-center rounded-lg px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
            style={{ background: "var(--primary)" }}
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-lg border px-5 py-2.5 text-sm font-medium transition hover:opacity-80"
            style={{ borderColor: "var(--border)", color: "var(--foreground)", background: "var(--card)" }}
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "FinWise — Personal finance dashboard" },
      { name: "description", content: "Track expenses, budgets and savings goals with FinWise." },
      { name: "theme-color", content: "#4F46E5" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      {
        rel: "preconnect",
        href: "https://fonts.googleapis.com",
      },
      {
        rel: "preconnect",
        href: "https://fonts.gstatic.com",
        crossOrigin: "anonymous",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

const themeInitScript = `
(function(){
  try {
    var t = localStorage.getItem('fw-theme');
    if (t === 'dark') document.documentElement.setAttribute('data-theme', 'dark');
  } catch(e) {}
})();
`;

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
        {/* eslint-disable-next-line react/no-danger */}
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

const mobileNavItems = [
  { title: "Home", url: "/", icon: LayoutDashboard },
  { title: "Analytics", url: "/analytics", icon: PieChart },
  { title: "Add", url: "#", icon: Plus, fab: true },
  { title: "Budgets", url: "/budgets", icon: Target },
  { title: "Profile", url: "/profile", icon: User },
];

function MobileBottomNav() {
  const currentPath = useRouterState({ select: (r) => r.location.pathname });
  const isActive = (url: string) =>
    url === "/" ? currentPath === "/" : currentPath.startsWith(url);

  return (
    <nav className="bottom-nav md:hidden">
      {mobileNavItems.map((item) =>
        item.fab ? (
          <button key={item.title} className="bottom-nav-item fab" aria-label="Add transaction">
            <item.icon size={22} strokeWidth={2.5} />
          </button>
        ) : (
          <a
            key={item.title}
            href={item.url}
            className={`bottom-nav-item ${isActive(item.url) ? "active" : ""}`}
          >
            <item.icon size={20} />
            <span>{item.title}</span>
          </a>
        )
      )}
    </nav>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <SidebarProvider>
        <div className="flex min-h-screen w-full" style={{ background: "var(--background)" }}>
          <AppSidebar />
          <div className="flex flex-1 flex-col min-w-0">
            {/* Top header */}
            <header
              className="sticky top-0 z-30 flex h-16 items-center gap-3 px-4 md:px-6"
              style={{
                background: "rgba(var(--background), 0.85)",
                backdropFilter: "blur(12px)",
                borderBottom: "1px solid var(--border)",
              }}
            >
              <SidebarTrigger className="hidden md:flex" />
              <div className="relative hidden max-w-sm flex-1 md:block">
                <Search
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2"
                  size={16}
                  style={{ color: "var(--muted-foreground)" }}
                />
                <Input
                  placeholder="Search transactions, budgets…"
                  className="h-10 rounded-full pl-9 border-0 text-sm"
                  style={{ background: "var(--surface-alt)", color: "var(--foreground)" }}
                />
              </div>
              {/* Mobile logo */}
              <Link to="/" className="flex items-center gap-2 md:hidden">
                <div
                  className="flex h-9 w-9 items-center justify-center rounded-xl"
                  style={{ background: "var(--primary)" }}
                >
                  <img src="/src/assets/logo.svg" alt="FinWise" className="h-5 w-5" />
                </div>
                <span className="text-base font-bold" style={{ color: "var(--foreground)" }}>FinWise</span>
              </Link>
              <div className="ml-auto flex items-center gap-3">
                <button
                  className="relative flex h-9 w-9 items-center justify-center rounded-full transition hover:opacity-80"
                  style={{ background: "var(--surface-alt)", color: "var(--foreground)" }}
                  aria-label="Notifications"
                >
                  <Bell size={18} />
                  <span
                    className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full"
                    style={{ background: "var(--danger)" }}
                  />
                </button>
                <div className="flex items-center gap-2.5">
                  <div
                    className="flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold text-white"
                    style={{ background: "var(--gradient-primary)" }}
                  >
                    AM
                  </div>
                  <div className="hidden leading-tight md:block">
                    <div className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>Alex Morgan</div>
                    <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>Premium plan</div>
                  </div>
                </div>
              </div>
            </header>

            {/* Page content */}
            <main className="flex-1 px-4 py-6 pb-24 md:px-8 md:py-8 md:pb-8">
              <Outlet />
            </main>
          </div>
        </div>
        <MobileBottomNav />
      </SidebarProvider>
    </QueryClientProvider>
  );
}
