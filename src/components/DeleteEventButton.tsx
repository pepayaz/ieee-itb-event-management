"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

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
      const response = await fetch(`/api/events/${eventId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const body = await response.json().catch(() => null);

        setError(body?.error?.message ?? "Could not delete the event.");
        return;
      }

      setIsOpen(false);
      router.refresh();
    } catch {
      setError("Could not reach the server. Check your connection.");
    } finally {
      setIsPending(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="text-red-700 underline hover:text-red-800"
      >
        Delete
      </button>

      <dialog
        ref={dialogRef}
        // Tombol Escape menutup dialog tanpa melewati tombol Cancel, jadi
        // state ikut disinkronkan di sini.
        onClose={() => setIsOpen(false)}
        className="m-auto rounded border border-gray-300 p-0 backdrop:bg-black/40"
      >
        <div className="flex w-[min(90vw,24rem)] flex-col gap-3 p-4">
          <h2 className="text-base font-semibold text-gray-900">
            Delete this event?
          </h2>
          <p className="text-sm text-gray-700">
            <span className="font-medium">{eventTitle}</span> will be removed
            permanently. This cannot be undone.
          </p>

          {error ? (
            <p role="alert" className="text-sm text-red-700">
              {error}
            </p>
          ) : null}

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              disabled={isPending}
              className="rounded border border-gray-300 px-3 py-1.5 text-sm font-medium hover:bg-gray-50 disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={isPending}
              className="rounded bg-red-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-800 disabled:opacity-60"
            >
              {isPending ? "Deleting..." : "Delete"}
            </button>
          </div>
        </div>
      </dialog>
    </>
  );
}
