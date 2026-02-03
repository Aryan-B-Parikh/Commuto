import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { ToastProvider } from "@/context/ToastContext";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Commuto - Smart Ride Sharing",
  description: "Share your ride, share the journey. Connect with fellow commuters, split costs, reduce emissions, and make your daily commute more enjoyable.",
  keywords: ["ride sharing", "carpool", "commute", "travel", "eco-friendly"],
  authors: [{ name: "Commuto" }],
  openGraph: {
    title: "Commuto - Smart Ride Sharing",
    description: "Share your ride, share the journey.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className={`${inter.variable} font-sans antialiased`}>
        <AuthProvider>
          <ToastProvider>
            {children}
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
