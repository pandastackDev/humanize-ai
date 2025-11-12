import { Flex } from "@radix-ui/themes";
import type { Metadata } from "next";
import { DashboardNav } from "../components/layout/DashboardNav/dashboard-nav";

export const metadata: Metadata = {
  title: "Humanize app",
  description: "Humanize app",
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Flex
      gap="3"
      ml="9"
      mr="9"
      pt="5"
      style={{
        borderTop: "1px solid lightgray",
        backgroundColor: "var(--gray-2)",
      }}
    >
      <DashboardNav />
      {children}
    </Flex>
  );
}
