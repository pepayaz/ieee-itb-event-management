import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { EventForm } from "@/components/EventForm";
import { Card, PageHeader, buttonStyles } from "@/components/ui";
import { getEventById } from "@/lib/events";
import { toDateTimeLocalValue } from "@/lib/format";

export const metadata: Metadata = {
  title: "Edit event",
  description: "Update an IEEE ITB Student Branch event.",
};

export default async function EditEventPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const event = await getEventById(id);

  if (!event) {
    notFound();
  }

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
      <Link
        href="/admin/dashboard"
        className={buttonStyles({ variant: "ghost", size: "sm", className: "-ml-3" })}
      >
        &larr; Back to dashboard
      </Link>
      <div className="mt-6">
        <PageHeader title="Edit event" description="Update event details, publication status, or the event image." />
      </div>
      <Card className="mt-8 p-5 sm:p-8">
      <EventForm
        mode="edit"
        eventId={event.id}
        initialData={{
          title: event.title,
          description: event.description,
          // Konversi ke waktu dinding WIB dilakukan di server supaya nilai
          // yang tampil tidak bergantung pada zona waktu browser admin.
          date: toDateTimeLocalValue(event.date),
          location: event.location,
          status: event.status,
          imageUrl: event.imageUrl,
        }}
      />
      </Card>
    </main>
  );
}
