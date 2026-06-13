import Link from "next/link";

import { SignOutButton } from "@/components/auth/sign-out-button";
import { Button } from "@/components/ui/button";
import { getProfileRole } from "@/lib/auth/require-user";
import { createClient } from "@/lib/supabase/server";

export async function SiteHeader() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const role = user ? await getProfileRole(user.id) : null;
  const dashboardHref =
    role === "owner"
      ? "/admin/workshops"
      : role === "teacher"
        ? "/dashboard/sessions"
        : "/dashboard";
  const dashboardLabel =
    role === "owner" ? "Catalogus" : role === "teacher" ? "Mijn sessies" : "Overzicht";

  return (
    <nav className="border-outline-variant/10 fixed top-0 right-0 left-0 z-[60] border-b bg-white/95 backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-[1920px] items-center justify-between px-8 py-6">
        <Link href="/" className="font-headline text-on-surface text-2xl font-extrabold tracking-tight">
          Makerslabo
        </Link>
        <div className="hidden items-center space-x-12 md:flex">
          <div className="group relative">
            <Link
              className="font-label border-marketing-primary text-marketing-primary border-b-2 py-2 text-[10px] font-bold tracking-widest uppercase"
              href="/workshops"
            >
              Workshops
            </Link>
            <div className="border-outline-variant invisible absolute top-full left-0 mt-4 w-48 border bg-white/95 p-4 opacity-0 shadow-xl backdrop-blur-xl transition-all duration-300 group-hover:visible group-hover:opacity-100">
              <div className="space-y-3">
                <Link
                  className="text-on-surface block transition-transform hover:translate-x-1"
                  href="/workshops"
                >
                  Keramiek
                </Link>
                <Link
                  className="text-on-surface block transition-transform hover:translate-x-1"
                  href="/workshops"
                >
                  Houtbewerking
                </Link>
                <Link
                  className="text-on-surface block transition-transform hover:translate-x-1"
                  href="/workshops"
                >
                  Textiel
                </Link>
              </div>
            </div>
          </div>
          <Link
            className="font-label text-on-surface text-[10px] tracking-widest uppercase transition-colors hover:text-japandi-blue"
            href="/#studio"
          >
            Studio
          </Link>
          <Link
            className="font-label text-on-surface text-[10px] tracking-widest uppercase transition-colors hover:text-japandi-blue"
            href="/#artists"
          >
            Artists
          </Link>
          <Link
            className="font-label text-on-surface text-[10px] tracking-widest uppercase transition-colors hover:text-japandi-blue"
            href="/#shop"
          >
            Shop
          </Link>
          <Link
            className="font-label text-on-surface text-[10px] tracking-widest uppercase transition-colors hover:text-japandi-blue"
            href="/#about"
          >
            About
          </Link>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          {user ? (
            <>
              <Button variant="outline" size="sm" className="rounded-none font-label text-[10px] tracking-widest uppercase" asChild>
                <Link href={dashboardHref}>{dashboardLabel}</Link>
              </Button>
              <SignOutButton />
            </>
          ) : (
            <Button variant="outline" size="sm" className="rounded-none font-label text-[10px] tracking-widest uppercase" asChild>
              <Link href="/login">Inloggen</Link>
            </Button>
          )}
          <Link
            href="/contact"
            className="font-label bg-japandi-blue inline-block rounded-none px-6 py-2 text-[10px] font-bold tracking-widest text-white uppercase transition-opacity hover:opacity-90"
          >
            Contact
          </Link>
        </div>
      </div>
    </nav>
  );
}
