"use client";

import {
<<<<<<< HEAD
  ActivityLogIcon,
  ArchiveIcon,
  ArrowRightIcon,
  AvatarIcon,
  CheckCircledIcon,
  DashboardIcon,
  GearIcon,
  GroupIcon,
  Link2Icon,
  LockClosedIcon,
  PersonIcon,
  TokensIcon,
} from "@radix-ui/react-icons";
import { Box, Flex } from "@radix-ui/themes";
=======
  Activity,
  Archive,
  ArrowRight,
  User,
  CheckCircle2,
  Layers,
  LayoutDashboard,
  Settings,
  Link2,
  Lock,
  Users,
  Key,
} from "lucide-react";
>>>>>>> f5ce883 (feat: setup the initial UI of project)
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
    icon: GroupIcon,
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
<<<<<<< HEAD
=======
    title: "Organization Switcher",
    href: "/dashboard/organization-switcher",
    icon: Layers,
    label: "Organization Switcher",
  },
  {
>>>>>>> f5ce883 (feat: setup the initial UI of project)
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
