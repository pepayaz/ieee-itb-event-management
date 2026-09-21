"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState } from "react";

import { apiFetch } from "@/lib/api-client";
import { fromDateTimeLocalValue } from "@/lib/format";
import { EVENT_STATUSES, eventSchema } from "@/lib/validation";

export type EventFormValues = {
  title: string;
  description: string;
  date: string;
  location: string;
  status: (typeof EVENT_STATUSES)[number];
};

type EventFormProps = {
  mode: "create" | "edit";
  initialData?: EventFormValues;
  eventId?: string;
};

const EMPTY_VALUES: EventFormValues = {
  title: "",
  description: "",
  date: "",
  location: "",
  status: "DRAFT",
};

export function EventForm({ mode, initialData, eventId }: EventFormProps) {
  const router = useRouter();
  const [values, setValues] = useState<EventFormValues>(
    initialData ?? EMPTY_VALUES,
  );
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  function update<K extends keyof EventFormValues>(
    key: K,
    value: EventFormValues[K],
  ) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    setFieldErrors({});

    // Input datetime-local mengirim string naif. Ia diubah menjadi ISO
    // beroffset WIB lebih dulu supaya yang divalidasi sama persis dengan
    // yang dikirim ke server.
    const isoDate = values.date ? fromDateTimeLocalValue(values.date) : "";
    const parsed = eventSchema.safeParse({ ...values, date: isoDate });

    if (!parsed.success) {
      const errors: Record<string, string> = {};

      for (const issue of parsed.error.issues) {
        const field = issue.path[0]?.toString();

        if (field && !errors[field]) {
          errors[field] = issue.message;
        }
      }

      setFieldErrors(errors);
      return;
    }

    setIsPending(true);

    try {
      const result = await apiFetch(
        mode === "create" ? "/api/events" : `/api/events/${eventId}`,
        {
          method: mode === "create" ? "POST" : "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...values, date: isoDate }),
        },
      );

      if (!result.ok) {
        if (result.error.field) {
          setFieldErrors({ [result.error.field]: result.error.message });
        } else {
          setFormError(result.error.message);
        }

        return;
      }

      router.push("/admin/dashboard");
      router.refresh();
    } finally {
      setIsPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
      <Field label="Title" error={fieldErrors.title}>
        <input
          name="title"
          value={values.title}
          onChange={(event) => update("title", event.target.value)}
          className="rounded border border-gray-300 px-3 py-2 text-sm"
        />
      </Field>

      <Field label="Description" error={fieldErrors.description}>
        <textarea
          name="description"
          rows={5}
          value={values.description}
          onChange={(event) => update("description", event.target.value)}
          className="rounded border border-gray-300 px-3 py-2 text-sm"
        />
      </Field>

      <Field label="Date and time (WIB)" error={fieldErrors.date}>
        <input
          name="date"
          type="datetime-local"
          value={values.date}
          onChange={(event) => update("date", event.target.value)}
          className="rounded border border-gray-300 px-3 py-2 text-sm"
        />
      </Field>

      <Field label="Location" error={fieldErrors.location}>
        <input
          name="location"
          value={values.location}
          onChange={(event) => update("location", event.target.value)}
          className="rounded border border-gray-300 px-3 py-2 text-sm"
        />
      </Field>

      <Field label="Status" error={fieldErrors.status}>
        <select
          name="status"
          value={values.status}
          onChange={(event) =>
            update("status", event.target.value as EventFormValues["status"])
          }
          className="rounded border border-gray-300 px-3 py-2 text-sm"
        >
          {EVENT_STATUSES.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
      </Field>

      {formError ? (
        <p role="alert" className="text-sm text-red-700">
          {formError}
        </p>
      ) : null}

      <div className="flex items-center gap-2">
        <button
          type="submit"
          disabled={isPending}
          className="rounded bg-gray-900 px-3 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-60"
        >
          {isPending
            ? "Saving..."
            : mode === "create"
              ? "Create event"
              : "Save changes"}
        </button>
        <Link
          href="/admin/dashboard"
          className="rounded border border-gray-300 px-3 py-2 text-sm font-medium hover:bg-gray-50"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-sm font-medium text-gray-800">{label}</span>
      {children}
      {error ? <span className="text-sm text-red-700">{error}</span> : null}
    </label>
  );
}
