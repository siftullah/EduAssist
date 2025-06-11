import Sidebar from "@/components/Sidebar";
import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import "@/styles/globals.css";
import { QueryProvider } from "@/app/providers/QueryProvider";
import Aichat from "@/components/Aichat"

export const metadata: Metadata = {
  title: "EduAssist - Faculty Portal",
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
          <Sidebar userType="faculty">
            <QueryProvider>{children}</QueryProvider>
          </Sidebar>
          <Aichat/>
        </body>
      </html>
    </ClerkProvider>
  );
}
