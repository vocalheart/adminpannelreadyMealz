import { AdminAuthProvider } from "../context/AdminAuthContext";
import { SidebarProvider } from "../components/SidebarContext";
import AdminLayoutWrapper from "../components/AdminLayoutWrapper";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminAuthProvider>
      <SidebarProvider>
        <AdminLayoutWrapper>{children}</AdminLayoutWrapper>
      </SidebarProvider>
    </AdminAuthProvider>
  );
}