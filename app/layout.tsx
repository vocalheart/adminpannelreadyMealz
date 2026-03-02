import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AdminAuthProvider } from "./context/AdminAuthContext";
import AdminSidebar from "./components/AdminSidebar";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ReadyMealz Admin",
  description: "Admin Panel - ReadyMealz",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gray-50`}
      >
        <AdminAuthProvider>
          {/*
            AdminSidebar renders BOTH:
            - The top navbar (fixed, full-width, z-50)
            - The left sidebar (fixed, desktop only, z-30)
            - The mobile drawer (z-50) + overlay (z-40)
          */}
          <AdminSidebar />

          {/*
            Main content area:
            - pt-16  → clears the fixed top navbar (h-16)
            - md:ml-60 → clears the expanded desktop sidebar (w-60)

            NOTE: When sidebar is collapsed (w-16), the ml won't auto-shrink
            because collapsed state lives in AdminSidebar. If you want the
            content to shift on collapse too, move `collapsed` state into a
            SidebarContext and conditionally apply md:ml-16 / md:ml-60 here.
          */}
          <main className="pt-16 md:ml-60 min-h-screen transition-all duration-300">
            {children}
          </main>
        </AdminAuthProvider>
      </body>
    </html>
  );
}