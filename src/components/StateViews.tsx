"use client";

type StateProps = {
  message?: string;
};

function Panel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded border border-gray-200 bg-white px-6 py-12 text-center">
      {children}
    </div>
  );
}

export function LoadingState({ message = "Loading..." }: StateProps) {
  return (
    <Panel>
      <div
        className="h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-gray-700"
        role="status"
        aria-label={message}
      />
      <p className="text-sm text-gray-600">{message}</p>
    </Panel>
  );
}

export function EmptyState({ message = "Nothing here yet." }: StateProps) {
  return (
    <Panel>
      <p className="text-sm text-gray-600">{message}</p>
    </Panel>
  );
}

export function ErrorState({
  message = "Something went wrong.",
  onRetry,
}: StateProps & { onRetry?: () => void }) {
  return (
    <Panel>
      <p className="text-sm text-red-700">{message}</p>
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="rounded border border-gray-300 px-3 py-1.5 text-sm font-medium hover:bg-gray-50"
        >
          Try again
        </button>
      ) : null}
    </Panel>
  );
}
