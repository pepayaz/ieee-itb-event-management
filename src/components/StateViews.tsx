"use client";

import { Button, Card } from "@/components/ui";

type StateProps = {
  message?: string;
};

function Panel({ children }: { children: React.ReactNode }) {
  return (
    <Card className="flex flex-col items-center gap-4 px-6 py-16 text-center">
      {children}
    </Card>
  );
}

export function LoadingState({ message = "Loading..." }: StateProps) {
  return (
    <Panel>
      <div
        className="h-8 w-8 animate-spin rounded-full border-2 border-sky-100 border-t-ieee"
        role="status"
        aria-label={message}
      />
      <p className="text-sm font-medium text-gray-600">{message}</p>
    </Panel>
  );
}

export function EmptyState({ message = "Nothing here yet." }: StateProps) {
  return (
    <Panel>
      <div aria-hidden="true" className="flex h-12 w-12 items-center justify-center rounded-full bg-ieee-light text-xl text-ieee">—</div>
      <p className="max-w-md text-sm leading-6 text-gray-600">{message}</p>
    </Panel>
  );
}

export function ErrorState({
  message = "Something went wrong.",
  onRetry,
}: StateProps & { onRetry?: () => void }) {
  return (
    <Panel>
      <div aria-hidden="true" className="flex h-12 w-12 items-center justify-center rounded-full bg-danger-soft text-xl font-bold text-danger">!</div>
      <p className="max-w-md text-sm leading-6 text-danger">{message}</p>
      {onRetry ? (
        <Button
          type="button"
          onClick={onRetry}
          variant="secondary"
          size="sm"
        >
          Try again
        </Button>
      ) : null}
    </Panel>
  );
}
