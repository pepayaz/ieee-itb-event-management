import Link from "next/link";
import { notFound } from "next/navigation";

import { getEventById } from "@/lib/events";
import { formatEventDate } from "@/lib/format";

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const event = await getEventById(id);

  // Event DRAFT diperlakukan seolah tidak ada, supaya tidak dapat dibuka
  // lewat URL langsung meskipun id-nya diketahui.
  if (!event || event.status === "DRAFT") {
    notFound();
  }

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-8">
      <Link href="/" className="text-sm text-gray-600 hover:underline">
        &larr; Back to all events
      </Link>

      <h1 className="mt-4 text-2xl font-semibold text-gray-900">
        {event.title}
      </h1>

      <dl className="mt-4 flex flex-col gap-1 text-sm text-gray-700">
        <div className="flex gap-2">
          <dt className="font-medium">Date</dt>
          <dd>{formatEventDate(event.date)}</dd>
        </div>
        <div className="flex gap-2">
          <dt className="font-medium">Location</dt>
          <dd>{event.location}</dd>
        </div>
        <div className="flex gap-2">
          <dt className="font-medium">Status</dt>
          <dd>{event.status}</dd>
        </div>
      </dl>

      <p className="mt-6 whitespace-pre-line text-gray-800">
        {event.description}
      </p>
    </main>
  );
}
