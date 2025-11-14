"use client";

import {
  Activity,
  Archive,
  ArrowRight,
  CheckCircle2,
  Key,
  Layers,
  LayoutDashboard,
  Link2,
  Lock,
  Settings,
  User,
  Users,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./page.module.css";

const navItems = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    label: "Dashboard",
  },
  {
    title: "Users",
    href: "/dashboard/users",
    icon: Users,
    label: "Users",
  },
  {
    title: "Team",
    href: "/dashboard/team",
    icon: Users,
    label: "Team",
  },
  {
    title: "User Profile",
    href: "/dashboard/profile",
    icon: User,
    label: "User Profile",
  },
  {
    title: "User Sessions",
    href: "/dashboard/sessions",
    icon: Activity,
    label: "User Sessions",
  },
  {
    title: "User Security",
    href: "/dashboard/security",
    icon: Lock,
    label: "User Security",
  },
  {
    title: "API Keys",
    href: "/dashboard/api-keys",
    icon: Key,
    label: "API Keys",
  },
  {
    title: "Organization Switcher",
    href: "/dashboard/organization-switcher",
    icon: Layers,
    label: "Organization Switcher",
  },
  {
    title: "Domain Verification",
    href: "/dashboard/domain-verification",
    icon: CheckCircle2,
    label: "Domain Verification",
  },
  {
    title: "SSO Connection",
    href: "/dashboard/sso-connection",
    icon: Link2,
    label: "SSO Connection",
  },
  {
    title: "Audit Logs",
    href: "/dashboard/audit-logs",
    icon: Archive,
    label: "Audit Logs",
  },
  {
    title: "Settings",
    href: "/dashboard/settings",
    icon: Settings,
    label: "Settings",
  },
];

export function DashboardNav() {
  const pathname = usePathname();

  return (
    <div className="w-[300px]">
      <div className="flex flex-1 flex-col items-stretch gap-1 overflow-hidden">
        {navItems.map((item) => {
          const Icon = item.icon ?? ArrowRight;
          const selected = pathname === item.href ? styles.selected : null;
          return (
            item.href && (
              <div className="flex flex-col gap-1 p-1" key={item.href}>
                <Link href={item.href}>
                  <div
                    className={[
                      styles["dashboard-nav-button"],
                      selected,
                      "flex items-center gap-2 p-2",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                  >
                    <Icon className="h-5 w-5" />
                    {item.title}
                  </div>
                </Link>
              </div>
            )
          );
        })}
      </div>
    </div>
  );
}
