"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, CalendarPlus, Users, LogOut, Video, Image as ImageIcon } from "lucide-react";
import { useEffect, useState } from "react";

export default function FloatingMenu() {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Show menu only in dashboard, admin, and feed routes
  if (!pathname || (!pathname.startsWith("/admin") && !pathname.startsWith("/dashboard") && !pathname.startsWith("/feed"))) {
    return null;
  }

  const isAdmin = pathname.startsWith("/admin");

  const adminLinks = [
    { href: "/admin/dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { href: "/feed", icon: ImageIcon, label: "Feed" },
    { href: "/admin/meetings/new", icon: CalendarPlus, label: "Agendar" },
    { href: "/", icon: LogOut, label: "Sair" },
  ];

  const userLinks = [
    { href: "/dashboard", icon: LayoutDashboard, label: "Meu Progresso" },
    { href: "/feed", icon: ImageIcon, label: "Feed" },
    { href: "/", icon: LogOut, label: "Sair" },
  ];

  const links = isAdmin ? adminLinks : userLinks;

  const handleLogout = async (e: React.MouseEvent) => {
    e.preventDefault();
    try {
      await fetch('/api/users/logout', { method: 'POST' });
      window.location.href = '/';
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
      <nav className="glass-panel flex items-center gap-2 px-4 py-3 rounded-full">
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = mounted && pathname === link.href;
          
          if (link.label === "Sair") {
            return (
              <button
                key={link.label}
                onClick={handleLogout}
                className="flex items-center justify-center p-3 rounded-full transition-all duration-300 text-acro-silver hover:text-white hover:bg-white/10"
                title={link.label}
              >
                <Icon size={20} />
              </button>
            );
          }
          
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center justify-center p-3 rounded-full transition-all duration-300 ${
                isActive 
                  ? "bg-acro-blue text-white shadow-lg shadow-acro-blue/30 scale-110" 
                  : "text-acro-silver hover:text-white hover:bg-white/10"
              }`}
              title={link.label}
            >
              <Icon size={20} />
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
