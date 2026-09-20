import Link from "next/link";

import { formatEventDate } from "@/lib/format";

type EventCardProps = {
  event: {
    id: string;
    title: string;
    description: string;
    date: Date;
    location: string;
  };
};

export function EventCard({ event }: EventCardProps) {
  return (
    <Link
      href={`/events/${event.id}`}
      className="block rounded border border-gray-200 bg-white p-4 hover:border-gray-400"
    >
      <h2 className="font-semibold text-gray-900">{event.title}</h2>
      <p className="mt-1 text-sm text-gray-600">{formatEventDate(event.date)}</p>
      <p className="text-sm text-gray-600">{event.location}</p>
      <p className="mt-2 line-clamp-2 text-sm text-gray-700">
        {event.description}
      </p>
    </Link>
  );
}
