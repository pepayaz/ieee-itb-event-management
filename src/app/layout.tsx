import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "IEEE ITB Student Branch Events",
    template: "%s | IEEE ITB Student Branch",
  },
  description:
    "Discover technical, professional, and community events from IEEE ITB Student Branch.",
  applicationName: "IEEE ITB Student Branch Events",
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "IEEE ITB Student Branch Events",
    title: "IEEE ITB Student Branch Events",
    description:
      "Discover technical, professional, and community events from IEEE ITB Student Branch.",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-gray-50 text-gray-900">{children}</body>
    </html>
  );
}
