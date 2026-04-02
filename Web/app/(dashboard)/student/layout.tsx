import Sidebar from "@/components/Sidebar";
import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import "@/styles/globals.css";
import Aichat from "@/components/Aichat";
import { QueryProvider } from "@/app/providers/QueryProvider";

export const metadata: Metadata = {
  title: "EduAssist - AI-Powered Academic Platform",
  description:
    "Transforming education with AI-powered integration. One platform for all your academic needs.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body>
          <Sidebar userType="student">
            <QueryProvider>{children}</QueryProvider>
          </Sidebar>
          <Aichat />
        </body>
      </html>
    </ClerkProvider>
  );
}
