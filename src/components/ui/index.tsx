import type {
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";

type ButtonVariant = "primary" | "secondary" | "danger" | "ghost";
type ButtonSize = "sm" | "md";

const buttonVariants: Record<ButtonVariant, string> = {
  primary: "bg-ieee text-white hover:bg-ieee-dark border-ieee",
  secondary:
    "border-gray-300 bg-white text-gray-800 hover:border-ieee hover:bg-ieee-light hover:text-ieee-dark",
  danger: "border-danger bg-danger text-white hover:bg-red-800",
  ghost: "border-transparent bg-transparent text-gray-700 hover:bg-gray-100",
};

const buttonSizes: Record<ButtonSize, string> = {
  sm: "min-h-9 px-3 py-1.5 text-sm",
  md: "min-h-10 px-4 py-2 text-sm",
};

export function buttonStyles({
  variant = "primary",
  size = "md",
  className = "",
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
} = {}) {
  return `inline-flex items-center justify-center gap-2 rounded-control border font-semibold transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-55 ${buttonVariants[variant]} ${buttonSizes[size]} ${className}`;
}

export function Button({
  variant = "primary",
  size = "md",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
}) {
  return (
    <button
      className={buttonStyles({ variant, size, className })}
      {...props}
    />
  );
}

const controlStyles =
  "w-full rounded-control border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 shadow-sm transition-colors duration-150 placeholder:text-gray-400 hover:border-gray-400 focus:border-ieee focus:outline-none disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500 aria-[invalid=true]:border-danger aria-[invalid=true]:focus:border-danger";

export function Input({ className = "", ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={`${controlStyles} ${className}`} {...props} />;
}

export function Textarea({
  className = "",
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={`${controlStyles} resize-y ${className}`} {...props} />;
}

export function Select({ className = "", ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={`${controlStyles} ${className}`} {...props} />;
}

export function FormField({
  id,
  label,
  hint,
  error,
  children,
}: {
  id: string;
  label: ReactNode;
  hint?: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-semibold text-gray-800">
        {label}
      </label>
      {children}
      {hint ? <p className="text-xs leading-5 text-gray-500">{hint}</p> : null}
      {error ? (
        <p id={`${id}-error`} role="alert" className="text-sm text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}

const statusStyles: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-700 ring-gray-200",
  PUBLISHED: "bg-success-soft text-success ring-green-200",
  CANCELLED: "bg-danger-soft text-danger ring-red-200",
  COMPLETED: "bg-ieee-light text-ieee-dark ring-sky-200",
};

export function Badge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex w-fit items-center rounded-full px-2.5 py-1 text-xs font-bold tracking-wide ring-1 ring-inset ${statusStyles[status] ?? "bg-warning-soft text-warning ring-amber-200"}`}
    >
      {status}
    </span>
  );
}

export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-card border border-gray-200 bg-white shadow-card ${className}`}
    >
      {children}
    </div>
  );
}

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="max-w-2xl">
        {eyebrow ? (
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-ieee">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="text-3xl font-bold tracking-tight text-gray-950 sm:text-4xl">
          {title}
        </h1>
        {description ? (
          <p className="mt-2 text-base leading-7 text-gray-600">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </header>
  );
}
