"use server";

import { refreshSession } from "@workos-inc/authkit-nextjs";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { workos } from "@/app/api/workos";
import { env } from "@/env";

export const switchToOrganization = async ({
  organizationId,
  pathname,
}: {
  organizationId: string;
  pathname: string;
}) => {
  try {
    await refreshSession({ organizationId, ensureSignedIn: true });
  } catch (err: unknown) {
    const error = err as {
      rawData?: { authkit_redirect_url?: string };
      error?: string;
    };

    if (error.rawData?.authkit_redirect_url) {
      redirect(error.rawData.authkit_redirect_url);
    } else {
      const args = {
        organizationId,
        clientId: env.WORKOS_CLIENT_ID,
        provider: "authkit" as const,
        redirectUri: `${env.NEXT_PUBLIC_BASE_URL}/callback`,
      };

      if (error.error === "sso_required" || error.error === "mfa_enrollment") {
        const url = workos.userManagement.getAuthorizationUrl({
          ...args,
        });
        redirect(url);
      }
      throw err;
    }
  }

  /**
   * Ensures the widget auth token is refreshed based on the updated
   * organization id.
   */
  revalidatePath(pathname);
  redirect(pathname);
};
