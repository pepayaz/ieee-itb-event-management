import Image from "next/image";
import Link from "next/link";

import { Card } from "@/components/ui";
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
    <Card className="h-full overflow-hidden transition duration-150 hover:-translate-y-0.5 hover:border-sky-300 hover:shadow-floating">
      <Link href={`/events/${event.id}`} className="group flex h-full flex-col">
        {event.imageUrl ? (
          <Image
            src={event.imageUrl}
            alt={`Poster for ${event.title}`}
            width={640}
            height={360}
            className="h-44 w-full object-cover"
          />
        ) : (
          <div
            aria-hidden="true"
            className="flex h-44 w-full items-center justify-center bg-gradient-to-br from-ieee-light to-sky-100 text-sm font-semibold text-ieee-dark"
          >
            IEEE ITB SB
          </div>
        )}

        <div className="flex flex-1 flex-col p-5">
          <p className="text-xs font-bold uppercase tracking-wider text-ieee">
            {formatEventDate(event.date)}
          </p>
          <h2 className="mt-2 text-xl font-bold leading-snug text-gray-950 group-hover:text-ieee-dark">
            {event.title}
          </h2>
          <p className="mt-1 text-sm font-medium text-gray-600">{event.location}</p>
          <p className="mt-3 line-clamp-2 text-sm leading-6 text-gray-600">
            {event.description}
          </p>
          <span className="mt-5 text-sm font-bold text-ieee">View event &rarr;</span>
        </div>
      </Link>
    </Card>
  );
}
