import Link from "next/link";

import { EventForm } from "@/components/EventForm";

export default function NewEventPage() {
  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-8">
      <Link
        href="/admin/dashboard"
        className="text-sm text-gray-600 hover:underline"
      >
        &larr; Back to dashboard
      </Link>
      <h1 className="mt-4 mb-6 text-xl font-semibold text-gray-900">
        New event
      </h1>
      <EventForm mode="create" />
    </main>
  );
}
