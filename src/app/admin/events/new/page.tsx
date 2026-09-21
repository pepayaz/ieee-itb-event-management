import type { Metadata } from "next";
import Link from "next/link";

import { EventForm } from "@/components/EventForm";
import { Card, PageHeader, buttonStyles } from "@/components/ui";

export const metadata: Metadata = {
  title: "Create event",
  description: "Create a new IEEE ITB Student Branch event.",
};

export default function NewEventPage() {
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
      <Link
        href="/admin/dashboard"
        className={buttonStyles({ variant: "ghost", size: "sm", className: "-ml-3" })}
      >
        &larr; Back to dashboard
      </Link>
      <div className="mt-6">
        <PageHeader title="Create an event" description="Add the information visitors need, then choose whether the event is ready to publish." />
      </div>
      <Card className="mt-8 p-5 sm:p-8">
        <EventForm mode="create" />
      </Card>
    </main>
  );
}
