"use server";

import { withAuth } from "@workos-inc/authkit-nextjs";
import { redirect } from "next/navigation";
import { workos } from "@/app/api/workos";
import { env } from "@/env";
import { stripe } from "../app/api/stripe";

export default async function redirectToBillingPortal(path: string) {
  const { organizationId } = await withAuth();

  const response = await fetch(
    `${workos.baseURL}/organizations/${organizationId}`,
    {
      headers: {
        Authorization: `Bearer ${env.WORKOS_API_KEY}`,
        "content-type": "application/json",
      },
    }
  );
  const workosOrg = await response.json();

  const billingPortalSession = await stripe.billingPortal.sessions.create({
    customer: workosOrg?.stripe_customer_id,
    return_url: `${env.NEXT_PUBLIC_BASE_URL}/dashboard/${path}`,
  });

  redirect(billingPortalSession?.url);
}
