import { DashboardSidebar } from '@/components/dashboard-sidebar';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <DashboardSidebar />
      <SidebarInset className="p-4 md:p-6 lg:p-8">
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
}
