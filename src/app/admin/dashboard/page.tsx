import Link from "next/link";

import { DeleteEventButton } from "@/components/DeleteEventButton";
import { LogoutButton } from "@/components/LogoutButton";
import { EmptyState, ErrorState } from "@/components/StateViews";
import { formatEventDate } from "@/lib/format";
import { prisma } from "@/lib/prisma";

// Sama seperti halaman publik: tanpa ini Next.js mem-prerender dashboard
// saat build, sehingga event yang baru dibuat tidak muncul.
export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  let events;

  try {
    events = await prisma.event.findMany({ orderBy: { createdAt: "desc" } });
  } catch (error) {
    console.error("Failed to load events for the dashboard:", error);

    return (
      <Shell>
        <ErrorState message="We could not load the events. Please try again later." />
      </Shell>
    );
  }

  return (
    <Shell>
      {events.length === 0 ? (
        <EmptyState message="No events yet. Create your first event to get started." />
      ) : (
        // Tabel tidak dapat dipersempit tanpa merusak keterbacaan, jadi pada
        // layar sempit ia digeser mendatar, bukan dimampatkan.
        <div className="overflow-x-auto rounded border border-gray-200 bg-white">
          <table className="w-full min-w-[40rem] text-left text-sm">
            <thead className="border-b border-gray-200 text-gray-600">
              <tr>
                <th className="px-3 py-2 font-medium">Title</th>
                <th className="px-3 py-2 font-medium">Date</th>
                <th className="px-3 py-2 font-medium">Location</th>
                <th className="px-3 py-2 font-medium">Status</th>
                <th className="px-3 py-2 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {events.map((event) => (
                <tr key={event.id} className="border-b border-gray-100 last:border-0">
                  <td className="px-3 py-2 font-medium text-gray-900">
                    {event.title}
                  </td>
                  <td className="px-3 py-2 text-gray-700">
                    {formatEventDate(event.date)}
                  </td>
                  <td className="px-3 py-2 text-gray-700">{event.location}</td>
                  <td className="px-3 py-2 text-gray-700">{event.status}</td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-3">
                      <Link
                        href={`/admin/events/${event.id}/edit`}
                        className="text-gray-700 underline hover:text-gray-900"
                      >
                        Edit
                      </Link>
                      <DeleteEventButton
                        eventId={event.id}
                        eventTitle={event.title}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-8">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Event dashboard</h1>
          <p className="text-sm text-gray-600">
            All events, including drafts, newest first.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/"
            className="rounded border border-gray-300 px-3 py-1.5 text-sm font-medium hover:bg-gray-50"
          >
            View public site
          </Link>
          <Link
            href="/admin/events/new"
            className="rounded bg-gray-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-gray-800"
          >
            New event
          </Link>
          <LogoutButton />
        </div>
      </header>
      {children}
    </main>
  );
}
