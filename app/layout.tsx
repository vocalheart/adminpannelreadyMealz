
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AdminAuthProvider } from "./context/AdminAuthContext";
import { SidebarProvider } from "./components/SidebarContext";
import AdminSidebar from "./components/AdminSidebar";
import MainContent from "./components/MainContent";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "ReadyMealz Admin",
  description: "Admin Panel - ReadyMealz",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gray-50`}>
        <AdminAuthProvider>
          <SidebarProvider>
            <AdminSidebar />
            <MainContent>{children}</MainContent>
          </SidebarProvider>
        </AdminAuthProvider>
      </body>
    </html>
  );
}