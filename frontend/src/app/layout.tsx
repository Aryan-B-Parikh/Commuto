import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { ToastProvider } from "@/context/ToastContext";
import { WebSocketProvider } from "@/context/WebSocketContext";
import { ThemeProvider } from "@/context/ThemeContext";

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

import { GoogleOAuthProvider } from '@react-oauth/google';
import Script from 'next/script';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';

  return (
    <html lang="en" className="scroll-smooth">
      <body className={`${inter.variable} font-sans antialiased transition-colors duration-300`}>
        <ThemeProvider>
          <GoogleOAuthProvider clientId={googleClientId}>
            {/* Load MapLibre GL globally for performance */}
            <Script
              src="https://unpkg.com/maplibre-gl@latest/dist/maplibre-gl.js"
              strategy="beforeInteractive"
            />
            <link
              rel="stylesheet"
              href="https://unpkg.com/maplibre-gl@latest/dist/maplibre-gl.css"
            />
            <AuthProvider>
              <WebSocketProvider>
                <ToastProvider>
                  {children}
                </ToastProvider>
              </WebSocketProvider>
            </AuthProvider>
          </GoogleOAuthProvider>
        </ThemeProvider>
        <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
      </body>
    </html>
  );
}
