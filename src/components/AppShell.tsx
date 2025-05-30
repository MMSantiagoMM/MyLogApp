
"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  LayoutDashboard,
  Archive,
  ListChecks,
  TerminalSquare,
  Presentation,
  Moon,
  Sun,
} from "lucide-react";

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
  const navItems = [
    { href: "/", icon: LayoutDashboard, label: "Home" },
    { href: "/editor", icon: TerminalSquare, label: "Java Editor" },
    { href: "/files", icon: Archive, label: "File Repository" },
    { href: "/exercises", icon: ListChecks, label: "Exercises" },
    { href: "/html-presenter", icon: Presentation, label: "HTML Presenter" },
  ];

  return (
    <SidebarProvider defaultOpen>
      <div className="flex min-h-screen bg-background">
        <Sidebar collapsible="icon" variant="sidebar" className="border-r">
          <SidebarHeader className="flex items-center justify-between p-3">
            <Link href="/" className="flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7 text-primary">
                <path d="M12.378 1.602a.75.75 0 00-.756 0L3.366 6.086A.75.75 0 003 6.723V21.75a.75.75 0 00.75.75h16.5a.75.75 0 00.75-.75V6.723a.75.75 0 00-.366-.637L12.378 1.602zM12 7.5a.75.75 0 01.75.75v3.75a.75.75 0 01-1.5 0V8.25A.75.75 0 0112 7.5zM11.25 15a.75.75 0 000 1.5h1.5a.75.75 0 000-1.5h-1.5z" />
              </svg>
              <span className="font-headline text-base font-semibold text-foreground group-data-[collapsible=icon]:hidden">
                Mi Cesde Java Compiler
              </span>
            </Link>
            <SidebarTrigger className="group-data-[collapsible=icon]:hidden" />
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
              <div className="flex items-center gap-2 group-data-[collapsible=icon]:hidden">
                <Avatar className="h-8 w-8">
                  <AvatarImage src="https://placehold.co/40x40.png" alt="User Avatar" data-ai-hint="user avatar" />
                  <AvatarFallback>MC</AvatarFallback>
                </Avatar>
                <div className="text-sm">
                  <p className="font-medium text-foreground">User</p>
                  <p className="text-xs text-muted-foreground">student@example.com</p>
                </div>
              </div>
              <ThemeToggle />
            </div>
          </SidebarFooter>
        </Sidebar>
        <SidebarInset className="flex-1">
          <main className="h-full overflow-y-auto py-2 md:py-4 lg:py-6">
            {children}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
