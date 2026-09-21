"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui";
import { apiFetch } from "@/lib/api-client";

type DeleteEventButtonProps = {
  eventId: string;
  eventTitle: string;
};

export function DeleteEventButton({
  eventId,
  eventTitle,
}: DeleteEventButtonProps) {
  const router = useRouter();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // showModal() tidak dapat dipanggil saat render, dan hanya lewat method itu
  // dialog mendapat backdrop serta jebakan fokus bawaan browser.
  useEffect(() => {
    const dialog = dialogRef.current;

    if (!dialog) return;

    if (isOpen && !dialog.open) {
      dialog.showModal();
    } else if (!isOpen && dialog.open) {
      dialog.close();
    }
  }, [isOpen]);

  async function handleDelete() {
    setError(null);
    setIsPending(true);

    try {
      const result = await apiFetch(`/api/events/${eventId}`, {
        method: "DELETE",
      });

      if (!result.ok) {
        setError(result.error.message);
        return;
      }

      setIsOpen(false);
      router.refresh();
    } finally {
      setIsPending(false);
    }
  }

  return (
    <>
      <Button
        type="button"
        onClick={() => setIsOpen(true)}
        variant="ghost"
        size="sm"
        className="text-danger hover:bg-danger-soft"
      >
        Delete
      </Button>

      <dialog
        ref={dialogRef}
        // Tombol Escape menutup dialog tanpa melewati tombol Cancel, jadi
        // state ikut disinkronkan di sini.
        onClose={() => setIsOpen(false)}
        className="m-auto w-[calc(100vw-2rem)] max-w-[26rem] overflow-hidden rounded-card border border-gray-200 bg-white p-0 shadow-floating backdrop:bg-gray-950/50"
      >
        <div className="flex w-full flex-col gap-4 p-6">
          <div aria-hidden="true" className="flex h-11 w-11 items-center justify-center rounded-full bg-danger-soft text-lg font-bold text-danger">!</div>
          <h2 className="text-xl font-bold text-gray-950">
            Delete this event?
          </h2>
          <p className="text-sm text-gray-700">
            <span className="font-medium">{eventTitle}</span> will be removed
            permanently. This cannot be undone.
          </p>

          {error ? (
            <p role="alert" className="rounded-control bg-danger-soft px-3 py-2 text-sm text-danger">
              {error}
            </p>
          ) : null}

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button
              type="button"
              onClick={() => setIsOpen(false)}
              disabled={isPending}
              variant="secondary"
              size="sm"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleDelete}
              disabled={isPending}
              variant="danger"
              size="sm"
            >
              {isPending ? "Deleting..." : "Delete"}
            </Button>
          </div>
        </div>
      </dialog>
    </>
  );
}
