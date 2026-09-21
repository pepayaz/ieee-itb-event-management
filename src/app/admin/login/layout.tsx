import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin sign in",
  description: "Sign in to manage IEEE ITB Student Branch events.",
};

export default function AdminLoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
