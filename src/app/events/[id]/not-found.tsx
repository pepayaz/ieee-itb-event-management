import Link from "next/link";

import { SiteFooter, SiteHeader } from "@/components/SiteChrome";
import { Card, buttonStyles } from "@/components/ui";

export default function EventNotFound() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto flex min-h-[70vh] w-full max-w-3xl items-center px-4 py-8">
      <Card className="flex w-full flex-col items-center gap-4 px-6 py-16 text-center">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-ieee">404</p>
        <h1 className="text-2xl font-bold text-gray-950">Event not found</h1>
        <p className="max-w-md text-sm leading-6 text-gray-600">
          This event does not exist, or it is not published yet.
        </p>
        <Link
          href="/"
          className={buttonStyles()}
        >
          Back to all events
        </Link>
      </Card>
      </main>
      <SiteFooter />
    </>
  );
}
