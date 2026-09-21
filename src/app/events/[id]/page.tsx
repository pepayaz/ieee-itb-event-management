import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";

import { SiteFooter, SiteHeader } from "@/components/SiteChrome";
import { Badge, Card, PageHeader, buttonStyles } from "@/components/ui";
import { getEventById } from "@/lib/events";
import { formatEventDate } from "@/lib/format";

const getEvent = cache(getEventById);

type EventDetailProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({
  params,
}: EventDetailProps): Promise<Metadata> {
  const { id } = await params;
  const event = await getEvent(id);

  if (!event || event.status === "DRAFT") {
    return { title: "Event not found" };
  }

  const description =
    event.description.length > 160
      ? `${event.description.slice(0, 157)}...`
      : event.description;

  return {
    title: event.title,
    description,
    openGraph: {
      type: "article",
      title: `${event.title} | IEEE ITB Student Branch`,
      description,
    },
  };
}

export default async function EventDetailPage({
  params,
}: EventDetailProps) {
  const { id } = await params;
  const event = await getEvent(id);

  // Event DRAFT diperlakukan seolah tidak ada, supaya tidak dapat dibuka
  // lewat URL langsung meskipun id-nya diketahui.
  if (!event || event.status === "DRAFT") {
    notFound();
  }

  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
      <Link href="/" className={buttonStyles({ variant: "ghost", size: "sm", className: "-ml-3" })}>
        &larr; Back to all events
      </Link>

      <div className="mt-6">
        <PageHeader
          eyebrow="IEEE ITB Student Branch event"
          title={event.title}
          description={`${formatEventDate(event.date)} · ${event.location}`}
          actions={<Badge status={event.status} />}
        />
      </div>

      {event.imageUrl ? (
        <Card className="mt-8 overflow-hidden">
          <Image
            src={event.imageUrl}
            alt={`Poster for ${event.title}`}
            width={1200}
            height={675}
            priority
            className="max-h-[32rem] w-full object-cover"
          />
        </Card>
      ) : null}

      <div className="mt-8 grid gap-6 md:grid-cols-[15rem_1fr]">
        <Card className="h-fit p-5">
          <dl className="space-y-4 text-sm">
            <div>
              <dt className="font-semibold text-gray-500">Date and time</dt>
              <dd className="mt-1 font-medium text-gray-900">{formatEventDate(event.date)}</dd>
            </div>
            <div>
              <dt className="font-semibold text-gray-500">Location</dt>
              <dd className="mt-1 font-medium text-gray-900">{event.location}</dd>
            </div>
          </dl>
        </Card>
        <article>
          <h2 className="text-xl font-bold text-gray-950">About this event</h2>
          <p className="mt-3 whitespace-pre-line text-base leading-8 text-gray-700">
            {event.description}
          </p>
        </article>
      </div>
      </main>
      <SiteFooter />
    </>
  );
}
