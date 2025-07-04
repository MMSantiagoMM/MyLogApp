"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
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
    Power,
    Loader2,
    Users,
    BookCheck,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { Link, useRouter } from "@/navigation";

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
    <Button variant="outline" size="icon" onClick={toggleTheme} aria-label="Toggle theme">
      {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
    </Button>
  );
};


const NavItem = ({ href, icon: Icon, label }: { href: string; icon: React.ElementType; label: string }) => {
  const pathname = usePathname();
  const isActive = pathname.endsWith(href);
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
  const t = useTranslations("AppShell");
  const isProfesor = userData?.role === 'profesor';

  const navItems = [
    { href: "/dashboard", icon: LayoutDashboard, label: t('dashboard') },
    { href: "/editor", icon: TerminalSquare, label: t('editor') },
    { href: "/files", icon: Youtube, label: t('files') },
    { href: "/exercises", icon: ListChecks, label: t('exercises') },
    { href: "/evaluations", icon: BookCheck, label: t('evaluations') },
    { href: "/html-presenter", icon: Presentation, label: t('presenter') },
  ];

  if (isProfesor) {
    navItems.push({ href: "/groups", icon: Users, label: t('groups') });
  }

  const publicPaths = ['/login', '/signup', '/'];
  // Check if the current pathname is one of the public paths, ignoring locale
  const isPublicPath = publicPaths.some(p => pathname.endsWith(p));
  const isRootPath = pathname === '/' || pathname === '/en' || pathname === '/es';


  React.useEffect(() => {
    if (loading) return; // Wait until loading is finished

    if (!user && !isPublicPath && !isRootPath) {
      router.push('/login');
    } else if (user && (isPublicPath || isRootPath)) {
      router.push('/dashboard');
    }
  }, [user, loading, isPublicPath, isRootPath, router, pathname]);

  if (loading || (!user && !isPublicPath && !isRootPath)) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  // If we are on a public path and not logged in, just render the content
  if (!user && (isPublicPath || isRootPath)) {
    return <>{children}</>;
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
                <Avatar className="h-9 w-9 group-data-[collapsible=icon]:h-8 group-data-[collapsible=icon]:w-8">
                  <AvatarFallback>{user?.email ? user.email.charAt(0).toUpperCase() : 'U'}</AvatarFallback>
                </Avatar>
              <div className="flex items-center gap-1">
                 <ThemeToggle />
                 <LanguageSwitcher />
                 <Button variant="outline" size="icon" onClick={logout} aria-label="Logout">
                    <Power className="h-5 w-5" />
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
