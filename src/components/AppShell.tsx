
"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarTrigger,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
    LayoutDashboard,
    ListChecks,
    TerminalSquare,
    Presentation,
    Moon,
    Sun,
    Coffee,
    Youtube,
    LogOut,
    Loader2
} from "lucide-react";
import { Badge } from "./ui/badge";

// Simple theme toggle (conceptual, full implementation requires theme context)
const ThemeToggle = () => {
  const [isDarkMode, setIsDarkMode] = React.useState(false);
  React.useEffect(() => {
    // Check for saved theme or system preference
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "dark" || (!savedTheme && prefersDark)) {
      document.documentElement.classList.add("dark");
      setIsDarkMode(true);
    } else {
      document.documentElement.classList.remove("dark");
      setIsDarkMode(false);
    }
  }, []);

  const toggleTheme = () => {
    if (document.documentElement.classList.contains("dark")) {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
      setIsDarkMode(false);
    } else {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
      setIsDarkMode(true);
    }
  };

  return (
    <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label="Toggle theme">
      {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
    </Button>
  );
};


const NavItem = ({ href, icon: Icon, label }: { href: string; icon: React.ElementType; label: string }) => {
  const pathname = usePathname();
  const isActive = pathname === href;
  return (
    <SidebarMenuItem>
      <Link href={href} passHref legacyBehavior>
        <SidebarMenuButton isActive={isActive} tooltip={label}>
          <Icon className="h-5 w-5" />
          <span>{label}</span>
        </SidebarMenuButton>
      </Link>
    </SidebarMenuItem>
  );
};

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { user, userData, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const navItems = [
    { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { href: "/editor", icon: TerminalSquare, label: "Java Editor" },
    { href: "/files", icon: Youtube, label: "Video Hub" },
    { href: "/exercises", icon: ListChecks, label: "Exercises" },
    { href: "/html-presenter", icon: Presentation, label: "HTML Presenter" },
  ];

  const publicPaths = ['/login', '/signup', '/'];
  const isPublicPath = publicPaths.includes(pathname);

  React.useEffect(() => {
    if (loading) return; // Wait until loading is finished

    if (!user && !isPublicPath) {
      router.push('/login');
    } else if (user && isPublicPath) {
      router.push('/dashboard');
    }
  }, [user, loading, isPublicPath, router, pathname]);

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  // If we are on a public path and not logged in, just render the content
  if (!user && isPublicPath) {
    return <>{children}</>;
  }
  
  // If we are on a protected path and not logged in, show a loader while redirecting
  if (!user) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  // If user is authenticated, render the full shell
  return (
    <SidebarProvider defaultOpen>
      <div className="flex min-h-screen bg-background">
        <Sidebar collapsible="icon" variant="sidebar" className="border-r">
          <SidebarHeader className="flex items-center justify-between p-3">
            <Link href="/dashboard" className="flex items-center gap-2">
              <Coffee className="h-7 w-7 text-primary" />
              <span className="font-headline text-base font-semibold text-foreground group-data-[collapsible=icon]:hidden">
                My Logic App
              </span>
            </Link>
            <SidebarTrigger />
          </SidebarHeader>
          <SidebarContent className="flex-1 overflow-y-auto p-2">
            <SidebarMenu>
              {navItems.map((item) => (
                <NavItem key={item.href} {...item} />
              ))}
            </SidebarMenu>
          </SidebarContent>
          <SidebarFooter className="p-2">
            <Separator className="my-2" />
             <div className="flex items-center justify-between p-2 group-data-[collapsible=icon]:justify-center">
              <div className="flex items-center gap-3 group-data-[collapsible=icon]:hidden">
                <Avatar className="h-8 w-8">
                  <AvatarFallback>{user.email ? user.email.charAt(0).toUpperCase() : 'U'}</AvatarFallback>
                </Avatar>
                <div className="text-sm flex flex-col">
                  <p className="font-medium text-foreground truncate max-w-[120px]" title={user.email ?? ''}>{user.email}</p>
                  {userData?.role && (
                    <Badge variant="secondary" className="capitalize w-fit text-xs px-1.5 py-0">
                      {userData.role}
                    </Badge>
                  )}
                </div>
              </div>
              <div className="flex items-center">
                 <ThemeToggle />
                 <Button variant="ghost" size="icon" onClick={logout} aria-label="Logout">
                    <LogOut className="h-5 w-5" />
                 </Button>
              </div>
            </div>
          </SidebarFooter>
        </Sidebar>
        <SidebarInset className="flex-1">
          <main className="h-full overflow-y-auto p-4 md:p-6">
            {children}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
