import Link from "next/link";

import { requireOwner } from "@/lib/auth/require-user";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireOwner("/admin");

  return (
    <div className="flex min-h-full flex-col">
      <header className="border-b border-border bg-background/80 px-4 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center gap-4">
          <nav className="text-sm font-medium">
            <Link href="/admin" className="text-foreground">
              Platformbeheer
            </Link>
          </nav>
        </div>
      </header>
      <div className="flex-1">{children}</div>
    </div>
  );
}
