import Link from "next/link";
import { notFound } from "next/navigation";

import { EventForm } from "@/components/EventForm";
import { toDateTimeLocalValue } from "@/lib/format";
import { prisma } from "@/lib/prisma";

export default async function EditEventPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const event = await prisma.event.findUnique({ where: { id } });

  if (!event) {
    notFound();
  }

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-8">
      <Link
        href="/admin/dashboard"
        className="text-sm text-gray-600 hover:underline"
      >
        &larr; Back to dashboard
      </Link>
      <h1 className="mt-4 mb-6 text-xl font-semibold text-gray-900">
        Edit event
      </h1>
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
        }}
      />
    </main>
  );
}
