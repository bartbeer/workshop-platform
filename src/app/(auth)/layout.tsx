import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-full flex-col">
      <header className="border-border bg-background/90 supports-[backdrop-filter]:bg-background/75 border-b px-4 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3">
          <Link href="/" className="text-foreground text-lg font-semibold tracking-tight">
            Makerslabo
          </Link>
          <nav className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm font-medium">
            <Link href="/workshops" className="text-muted-foreground hover:text-foreground">
              Workshops
            </Link>
            <Link href="/" className="text-muted-foreground hover:text-foreground">
              Home
            </Link>
          </nav>
        </div>
      </header>
      <div className="flex-1">{children}</div>
    </div>
  );
}
