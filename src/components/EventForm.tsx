"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { apiFetch } from "@/lib/api-client";
import { MAX_UPLOAD_FILE_SIZE } from "@/lib/uploads";
import { fromDateTimeLocalValue } from "@/lib/format";
import { EVENT_STATUSES, eventSchema } from "@/lib/validation";

export type EventFormValues = {
  title: string;
  description: string;
  date: string;
  location: string;
  status: (typeof EVENT_STATUSES)[number];
  imageUrl?: string | null;
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
  imageUrl: null,
};

export function EventForm({ mode, initialData, eventId }: EventFormProps) {
  const router = useRouter();
  const [values, setValues] = useState<EventFormValues>(
    initialData ?? EMPTY_VALUES,
  );
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  function update<K extends keyof EventFormValues>(
    key: K,
    value: EventFormValues[K],
  ) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadError(null);

    if (file.size > MAX_UPLOAD_FILE_SIZE) {
      setUploadError("File size exceeds 2 MB limit");
      event.target.value = "";
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const result = await apiFetch<{ url: string }>("/api/uploads", {
        method: "POST",
        body: formData,
      });

      if (!result.ok) {
        setUploadError(result.error.message);
        return;
      }

      update("imageUrl", result.data.url);
    } finally {
      setIsUploading(false);
      event.target.value = "";
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    setFieldErrors({});

    // Input datetime-local mengirim string naif. Ia diubah menjadi ISO
    // beroffset WIB lebih dulu supaya yang divalidasi sama persis dengan
    // yang dikirim ke server.
    const isoDate = values.date ? fromDateTimeLocalValue(values.date) : "";
    const payload = {
      ...values,
      date: isoDate,
      imageUrl: values.imageUrl || null,
    };
    const parsed = eventSchema.safeParse(payload);

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
          body: JSON.stringify(payload),
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

      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium text-gray-800">
          Image <span className="font-normal text-gray-500">(optional)</span>
        </span>

        {values.imageUrl ? (
          <div className="flex items-start gap-3">
            <Image
              src={values.imageUrl}
              alt="Selected event image"
              width={160}
              height={120}
              className="h-24 w-32 rounded border border-gray-200 object-cover"
            />
            <button
              type="button"
              onClick={() => update("imageUrl", null)}
              disabled={isUploading}
              className="rounded border border-gray-300 px-3 py-1.5 text-sm font-medium hover:bg-gray-50 disabled:opacity-60"
            >
              Remove image
            </button>
          </div>
        ) : null}

        <input
          type="file"
          name="image"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFileChange}
          disabled={isUploading}
          className="text-sm file:mr-3 file:rounded file:border file:border-gray-300 file:bg-white file:px-3 file:py-1.5 file:text-sm file:font-medium hover:file:bg-gray-50"
        />

        <span className="text-xs text-gray-500">
          {isUploading
            ? "Uploading..."
            : "JPEG, PNG or WebP, up to 2 MB."}
        </span>

        {uploadError ? (
          <span role="alert" className="text-sm text-red-700">
            {uploadError}
          </span>
        ) : null}
      </div>

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
          disabled={isPending || isUploading}
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
