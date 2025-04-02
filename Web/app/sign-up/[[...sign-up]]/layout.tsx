import type { Metadata } from "next";
import localFont from "next/font/local";
import "../../../styles/globals.css";
import { ClerkProvider } from "@clerk/nextjs";

const geistSans = localFont({
  src: "../../../fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "../../../fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: 'EduAssist - AI-Powered Academic Platform',
  description: 'Transforming education with AI-powered integration. One platform for all your academic needs.',
};

export default function RootLayout({children,}: Readonly<{children: React.ReactNode;}>) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
