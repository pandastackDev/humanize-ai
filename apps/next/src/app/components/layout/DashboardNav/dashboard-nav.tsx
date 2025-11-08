"use client";

import {
  ActivityLogIcon,
  ArchiveIcon,
  ArrowRightIcon,
  AvatarIcon,
  CheckCircledIcon,
  ComponentInstanceIcon,
  DashboardIcon,
  GearIcon,
  Link2Icon,
  LockClosedIcon,
  PersonIcon,
  TokensIcon,
} from "@radix-ui/react-icons";
import { Box, Flex } from "@radix-ui/themes";
import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./page.module.css";

const navItems = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: DashboardIcon,
    label: "Dashboard",
  },
  {
    title: "Users",
    href: "/dashboard/users",
    icon: PersonIcon,
    label: "Users",
  },
  {
    title: "User Profile",
    href: "/dashboard/profile",
    icon: AvatarIcon,
    label: "User Profile",
  },
  {
    title: "User Sessions",
    href: "/dashboard/sessions",
    icon: ActivityLogIcon,
    label: "User Sessions",
  },
  {
    title: "User Security",
    href: "/dashboard/security",
    icon: LockClosedIcon,
    label: "User Security",
  },
  {
    title: "API Keys",
    href: "/dashboard/api-keys",
    icon: TokensIcon,
    label: "API Keys",
  },
  {
    title: "Organization Switcher",
    href: "/dashboard/organization-switcher",
    icon: ComponentInstanceIcon,
    label: "Organization Switcher",
  },
  {
    title: "Domain Verification",
    href: "/dashboard/domain-verification",
    icon: CheckCircledIcon,
    label: "Domain Verification",
  },
  {
    title: "SSO Connection",
    href: "/dashboard/sso-connection",
    icon: Link2Icon,
    label: "SSO Connection",
  },
  {
    title: "Audit Logs",
    href: "/dashboard/audit-logs",
    icon: ArchiveIcon,
    label: "Audit Logs",
  },
  {
    title: "Settings",
    href: "/dashboard/settings",
    icon: GearIcon,
    label: "Settings",
  },
];

export function DashboardNav() {
  const pathname = usePathname();

  return (
    <Box width="300px">
      <Flex
        align="stretch"
        direction="column"
        flexGrow="1"
        gap="1"
        overflow="hidden"
      >
        {navItems.map((item) => {
          const Icon = item.icon ?? ArrowRightIcon;
          const selected = pathname === item.href ? styles.selected : null;
          return (
            item.href && (
              <Flex direction="column" gap="1" key={item.href} p="1">
                <Link href={item.href}>
                  <Flex
                    align="center"
                    className={[styles["dashboard-nav-button"], selected].join(
                      " "
                    )}
                    gap="2"
                    p="2"
                  >
                    <Icon height="20px" width="20px" />
                    {item.title}
                  </Flex>
                </Link>
              </Flex>
            )
          );
        })}
      </Flex>
    </Box>
  );
}
