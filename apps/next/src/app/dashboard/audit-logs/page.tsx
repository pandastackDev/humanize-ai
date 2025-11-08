"use client";

import { InfoCircledIcon } from "@radix-ui/react-icons";
import {
  Box,
  Button,
  Callout,
  Flex,
  Heading,
  Skeleton,
} from "@radix-ui/themes";
import Link from "next/link";
import { useEffect, useState } from "react";
import { getAuditLogPortalLink } from "@/actions/getAuditLogPortalLink";
import { refreshAuthkitSession } from "@/actions/refreshAuthkitSession";
import { DashboardContainer } from "@/app/components/layout/dashboard-container";
import { UpgradeButton } from "@/app/components/upgrade-button";

export default function AuditLogs() {
  const [entitlements, setEntitlements] = useState<string[]>([]);
  const [workOSAdminPortalLink, setWorkOSAdminPortalLink] = useState<
    string | null
  >("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Refresh the session to ensure we have the latest entitlements
    const fetchEntitlements = async () => {
      const response = await refreshAuthkitSession();
      const session = JSON.parse(response);

      if (session.entitlements?.includes("audit-logs")) {
        const link = await getAuditLogPortalLink(session.organizationId);
        setWorkOSAdminPortalLink(link);
      }

      setEntitlements(session.entitlements);
      setLoading(false);
    };

    fetchEntitlements();
  }, []);

  return (
    <Flex direction="column" gap="3" width="100%">
      <Box>
        <Heading>Audit Logs</Heading>
      </Box>
      <DashboardContainer>
        <Skeleton loading={loading}>
          {entitlements?.includes("audit-logs") ? (
            <Box>
              <Button style={{ cursor: "pointer" }} variant="soft">
                <Link href={workOSAdminPortalLink as string}>
                  View Audit Logs
                </Link>
              </Button>
            </Box>
          ) : (
            <Callout.Root color="blue" style={{ width: "100%" }}>
              <Flex align="center" gap="3" justify="between">
                <Callout.Icon>
                  <InfoCircledIcon />
                </Callout.Icon>
                <Callout.Text>
                  This feature is only available on the Enterprise level plan.
                </Callout.Text>
                <UpgradeButton path="audit-logs">
                  Upgrade to Enterprise
                </UpgradeButton>
              </Flex>
            </Callout.Root>
          )}
        </Skeleton>
      </DashboardContainer>
    </Flex>
  );
}
