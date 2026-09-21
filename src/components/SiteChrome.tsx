import Link from "next/link";

import { buttonStyles } from "@/components/ui";

export function SiteHeader() {
  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
        <Link href="/" className="flex min-w-0 items-center gap-3">
          <span
            aria-hidden="true"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-control bg-ieee text-sm font-black tracking-tight text-white"
          >
            IEEE
          </span>
          <span className="truncate text-sm font-bold text-gray-950 sm:text-base">
            IEEE ITB Student Branch
          </span>
        </Link>
        <nav aria-label="Primary navigation" className="flex items-center gap-1">
          <Link
            href="/?timeframe=upcoming"
            className={buttonStyles({ variant: "ghost", size: "sm" })}
          >
            Events
          </Link>
          <Link
            href="/admin/login"
            className={buttonStyles({ variant: "secondary", size: "sm" })}
          >
            Admin
          </Link>
        </nav>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-gray-200 bg-gray-950 text-gray-300">
      <div className="mx-auto grid w-full max-w-6xl gap-6 px-4 py-10 sm:grid-cols-[1fr_auto] sm:px-6">
        <div className="max-w-xl">
          <p className="font-bold text-white">IEEE ITB Student Branch</p>
          <p className="mt-2 text-sm leading-6 text-gray-400">
            A student community advancing technology through learning,
            collaboration, and professional development at Institut Teknologi
            Bandung.
          </p>
        </div>
        <nav aria-label="Footer navigation" className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
          <Link href="/?timeframe=upcoming" className="hover:text-white">
            Upcoming events
          </Link>
          <Link href="/?timeframe=past" className="hover:text-white">
            Past events
          </Link>
          <Link href="/admin/login" className="hover:text-white">
            Admin sign in
          </Link>
        </nav>
      </div>
    </footer>
  );
}
