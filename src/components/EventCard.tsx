import Image from "next/image";
import Link from "next/link";

import { formatEventDate } from "@/lib/format";

type EventCardProps = {
  event: {
    id: string;
    title: string;
    description: string;
    date: Date;
    location: string;
    imageUrl: string | null;
  };
};

export function EventCard({ event }: EventCardProps) {
  return (
    <Link
      href={`/events/${event.id}`}
      className="flex gap-4 rounded border border-gray-200 bg-white p-4 hover:border-gray-400"
    >
      {/* Ukuran placeholder dan gambar sengaja sama supaya tinggi kartu tidak
          berubah antara event yang bergambar dan yang tidak. */}
      {event.imageUrl ? (
        <Image
          src={event.imageUrl}
          alt={`Poster for ${event.title}`}
          width={192}
          height={144}
          className="h-24 w-32 shrink-0 rounded object-cover"
        />
      ) : (
        <div
          aria-hidden="true"
          className="flex h-24 w-32 shrink-0 items-center justify-center rounded bg-gray-100 text-xs text-gray-400"
        >
          No image
        </div>
      )}

      <div className="min-w-0">
        <h2 className="font-semibold text-gray-900">{event.title}</h2>
        <p className="mt-1 text-sm text-gray-600">
          {formatEventDate(event.date)}
        </p>
        <p className="text-sm text-gray-600">{event.location}</p>
        <p className="mt-2 line-clamp-2 text-sm text-gray-700">
          {event.description}
        </p>
      </div>
    </Link>
  );
}
