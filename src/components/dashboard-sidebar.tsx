'use client';

import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, LogOut, ParkingSquare, ShieldAlert } from 'lucide-react';
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from '@/components/ui/sidebar';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/hooks/use-toast';
import { Button } from './ui/button';

export function DashboardSidebar() {
  const pathname = usePathname();
  const { user: userProfile, logout } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  
  const handleLogout = async () => {
    await logout();
    router.push('/login');
    toast({
      title: "Logged Out",
      description: "You have been successfully logged out."
    });
  }

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center gap-2">
          <ParkingSquare className="size-8 text-primary" />
          <span className="text-xl font-headline font-semibold">ParkSmart</span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              href="/dashboard"
              isActive={pathname === '/dashboard'}
              tooltip="Dashboard"
            >
              <LayoutDashboard />
              Dashboard
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              href="/dashboard/anomaly-detection"
              isActive={pathname === '/dashboard/anomaly-detection'}
              tooltip="Anomaly Detection"
            >
              <ShieldAlert />
              Anomaly Detection
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter>
         {userProfile ? (
            <div className="flex items-center gap-3 rounded-md p-2 hover:bg-sidebar-accent">
                <Avatar className="h-10 w-10">
                    <AvatarFallback>{userProfile.displayName?.[0]}</AvatarFallback>
                </Avatar>
                <div className="overflow-hidden group-data-[collapsible=icon]:hidden">
                    <p className="font-medium text-sm truncate">{userProfile.displayName}</p>
                    <p className="text-xs text-sidebar-foreground/70 truncate">{userProfile.email}</p>
                </div>
                <Button variant="ghost" size="icon" onClick={handleLogout} className="ml-auto group-data-[collapsible=icon]:hidden">
                    <LogOut className="size-5 text-sidebar-foreground/70" />
                </Button>
            </div>
         ) : (
            <div className="flex items-center gap-3 rounded-md p-2">
                <Avatar className="h-10 w-10 bg-muted" />
                <div className="overflow-hidden group-data-[collapsible=icon]:hidden">
                    <p className="font-medium text-sm truncate">Loading...</p>
                </div>
            </div>
         )}
      </SidebarFooter>
    </Sidebar>
  );
}
