"use client";

import { useSidebar } from "./SidebarContext";
import { ReactNode } from "react";

export default function MainContent({ children }: { children: ReactNode }) {
  const { collapsed } = useSidebar();

  return (
    <main
      className={`pt-16 min-h-screen transition-all duration-300 ease-in-out
        ${collapsed ? "md:ml-16" : "md:ml-60"}
      `}
    >
      {children}
    </main>
  );
}