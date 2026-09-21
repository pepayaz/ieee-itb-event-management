"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import {
  Button,
  FormField,
  Input,
  Select,
  Textarea,
  buttonStyles,
} from "@/components/ui";
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
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-6">
      <FormField id="title" label="Title" error={fieldErrors.title}>
        <Input
          id="title"
          name="title"
          value={values.title}
          onChange={(event) => update("title", event.target.value)}
          aria-invalid={Boolean(fieldErrors.title)}
          aria-describedby={fieldErrors.title ? "title-error" : undefined}
        />
      </FormField>

      <FormField id="description" label="Description" error={fieldErrors.description}>
        <Textarea
          id="description"
          name="description"
          rows={7}
          value={values.description}
          onChange={(event) => update("description", event.target.value)}
          aria-invalid={Boolean(fieldErrors.description)}
          aria-describedby={fieldErrors.description ? "description-error" : undefined}
        />
      </FormField>

      <div className="grid gap-6 sm:grid-cols-2">
      <FormField id="date" label="Date and time (WIB)" error={fieldErrors.date}>
        <Input
          id="date"
          name="date"
          type="datetime-local"
          value={values.date}
          onChange={(event) => update("date", event.target.value)}
          aria-invalid={Boolean(fieldErrors.date)}
          aria-describedby={fieldErrors.date ? "date-error" : undefined}
        />
      </FormField>

      <FormField id="location" label="Location" error={fieldErrors.location}>
        <Input
          id="location"
          name="location"
          value={values.location}
          onChange={(event) => update("location", event.target.value)}
          aria-invalid={Boolean(fieldErrors.location)}
          aria-describedby={fieldErrors.location ? "location-error" : undefined}
        />
      </FormField>
      </div>

      <div className="flex flex-col gap-2 rounded-card border border-dashed border-gray-300 bg-gray-50 p-4">
        <label htmlFor="image" className="text-sm font-semibold text-gray-800">
          Image <span className="font-normal text-gray-500">(optional)</span>
        </label>

        {values.imageUrl ? (
          <div className="flex items-start gap-3">
            <Image
              src={values.imageUrl}
              alt="Selected event image"
              width={160}
              height={120}
              className="h-28 w-40 rounded-control border border-gray-200 object-cover shadow-sm"
            />
            <Button
              type="button"
              onClick={() => update("imageUrl", null)}
              disabled={isUploading}
              variant="secondary"
              size="sm"
            >
              Remove image
            </Button>
          </div>
        ) : null}

        <Input
          id="image"
          type="file"
          name="image"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFileChange}
          disabled={isUploading}
          className="file:mr-3 file:rounded-control file:border-0 file:bg-ieee-light file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-ieee-dark hover:file:bg-sky-100"
        />

        <span className="text-xs text-gray-500">
          {isUploading
            ? "Uploading..."
            : "JPEG, PNG or WebP, up to 2 MB."}
        </span>

        {uploadError ? (
          <span role="alert" className="text-sm text-danger">
            {uploadError}
          </span>
        ) : null}
      </div>

      <FormField id="status" label="Status" error={fieldErrors.status}>
        <Select
          id="status"
          name="status"
          value={values.status}
          onChange={(event) =>
            update("status", event.target.value as EventFormValues["status"])
          }
          aria-invalid={Boolean(fieldErrors.status)}
          aria-describedby={fieldErrors.status ? "status-error" : undefined}
        >
          {EVENT_STATUSES.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </Select>
      </FormField>

      {formError ? (
        <p role="alert" className="rounded-control bg-danger-soft px-3 py-2 text-sm text-danger">
          {formError}
        </p>
      ) : null}

      <div className="flex flex-col-reverse gap-2 border-t border-gray-200 pt-5 sm:flex-row sm:items-center sm:justify-end">
        <Link
          href="/admin/dashboard"
          className={buttonStyles({ variant: "secondary" })}
        >
          Cancel
        </Link>
        <Button
          type="submit"
          disabled={isPending || isUploading}
        >
          {isPending
            ? "Saving..."
            : mode === "create"
              ? "Create event"
              : "Save changes"}
        </Button>
      </div>
    </form>
  );
}
