import Link from "next/link";

export default function EventNotFound() {
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-8">
      <div className="flex flex-col items-center gap-3 rounded border border-gray-200 bg-white px-6 py-12 text-center">
        <h1 className="text-lg font-semibold text-gray-900">Event not found</h1>
        <p className="text-sm text-gray-600">
          This event does not exist, or it is not published yet.
        </p>
        <Link
          href="/"
          className="rounded border border-gray-300 px-3 py-1.5 text-sm font-medium hover:bg-gray-50"
        >
          Back to all events
        </Link>
      </div>
    </main>
  );
}
