import { Link, useLocation } from "wouter";
import { BarChart3, TrendingUp, Clock, Sun, Moon } from "lucide-react";
import { useState, useEffect } from "react";

const navItems = [
  { href: "/", label: "대시보드", icon: BarChart3 },
  { href: "/backtest", label: "백테스트", icon: TrendingUp },
  { href: "/history", label: "히스토리", icon: Clock },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [dark, setDark] = useState(() =>
    typeof window !== "undefined"
      ? window.matchMedia("(prefers-color-scheme: dark)").matches
      : true
  );

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="flex h-14 items-center justify-between">
            {/* Logo */}
            <Link href="/">
              <div className="flex items-center gap-2.5 cursor-pointer" data-testid="logo">
                <svg width="28" height="28" viewBox="0 0 32 32" fill="none" aria-label="순매수 시그널">
                  <rect x="2" y="18" width="6" height="12" rx="1" fill="currentColor" opacity="0.3" />
                  <rect x="10" y="12" width="6" height="18" rx="1" fill="currentColor" opacity="0.5" />
                  <rect x="18" y="6" width="6" height="24" rx="1" fill="currentColor" opacity="0.7" />
                  <rect x="26" y="2" width="6" height="28" rx="1" fill="hsl(var(--primary))" />
                  <path d="M4 16 L12 10 L20 5 L28 2" stroke="hsl(var(--primary))" strokeWidth="2" strokeLinecap="round" fill="none" />
                </svg>
                <span className="text-base font-semibold tracking-tight">순매수 시그널</span>
              </div>
            </Link>

            {/* Nav */}
            <nav className="flex items-center gap-1">
              {navItems.map((item) => {
                const active = location === item.href || (item.href !== "/" && location.startsWith(item.href));
                return (
                  <Link key={item.href} href={item.href}>
                    <button
                      data-testid={`nav-${item.label}`}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors
                        ${active ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-muted/50"}`}
                    >
                      <item.icon className="w-4 h-4" />
                      <span className="hidden sm:inline">{item.label}</span>
                    </button>
                  </Link>
                );
              })}
              <button
                data-testid="theme-toggle"
                onClick={() => setDark(!dark)}
                className="ml-2 p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                aria-label={dark ? "라이트 모드" : "다크 모드"}
              >
                {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>
            </nav>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="mx-auto max-w-7xl px-4 sm:px-6 py-6">
        {children}
      </main>
    </div>
  );
}
