import { type NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";
import { env } from "@/env";
import { stripe } from "../stripe";
import { workos } from "../workos";

export const POST = async (req: NextRequest) => {
  let body;
  try {
    body = await req.json();
  } catch (error) {
    console.error("Error parsing request body:", error);
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }

  const { userId, orgName, subscriptionLevel } = body;

  if (!userId || !subscriptionLevel) {
    return NextResponse.json(
      { error: "Missing required fields: userId, subscriptionLevel" },
      { status: 400 }
    );
  }

  // Get user info first to generate org name if not provided
  let user;
  try {
    console.log("Getting WorkOS user:", userId);
    user = await workos.userManagement.getUser(userId);
    console.log("User retrieved:", user.email);
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : "Unknown error";
    console.error("Failed to get WorkOS user:", errorMsg, error);
    return NextResponse.json(
      {
        error: `Failed to retrieve user information: ${errorMsg}`,
      },
      { status: 500 }
    );
  }

  // Generate organization name if not provided
  const organizationName = orgName || 
    (user.firstName 
      ? `${user.firstName}'s Organization`
      : `${user.email.split("@")[0]}'s Organization`);

  // Validate environment variables
  if (!env.WORKOS_API_KEY) {
    console.error("WORKOS_API_KEY is not set");
    return NextResponse.json(
      { error: "WorkOS API key is not configured" },
      { status: 500 }
    );
  }

  if (!env.STRIPE_API_KEY) {
    console.error("STRIPE_API_KEY is not set");
    return NextResponse.json(
      { error: "Stripe API key is not configured" },
      { status: 500 }
    );
  }

  let organization;
  try {
    console.log("Creating WorkOS organization:", organizationName);
    console.log("WorkOS API Key configured:", env.WORKOS_API_KEY ? "Yes" : "No");
    console.log("WorkOS Client ID configured:", env.WORKOS_CLIENT_ID ? "Yes" : "No");
    
    organization = await workos.organizations.createOrganization({
      name: organizationName,
    });
    console.log("Organization created:", organization.id);
  } catch (error: unknown) {
    let errorMsg = "Unknown error";
    let statusCode = 500;
    
    if (error instanceof Error) {
      errorMsg = error.message;
      
      // Handle network/fetch errors
      if (
        errorMsg.includes("fetch failed") ||
        errorMsg.includes("NetworkError") ||
        errorMsg.includes("ECONNREFUSED") ||
        errorMsg.includes("ETIMEDOUT")
      ) {
        errorMsg = `Network error connecting to WorkOS API: ${errorMsg}. Please check your internet connection and WorkOS API key.`;
      } else if (errorMsg.includes("401") || errorMsg.includes("Unauthorized")) {
        errorMsg = `WorkOS API authentication failed. Please check your WORKOS_API_KEY in environment variables.`;
        statusCode = 401;
      } else if (errorMsg.includes("403") || errorMsg.includes("Forbidden")) {
        errorMsg = `WorkOS API access forbidden. Please check your API key permissions.`;
        statusCode = 403;
      }
    }
    
    // Log full error details for debugging
    console.error("Failed to create WorkOS organization:", errorMsg);
    console.error("Error details:", error);
    
    // Check if error object has additional properties
    if (error && typeof error === "object") {
      if ("status" in error) {
        console.error("WorkOS API status:", error.status);
      }
      if ("code" in error) {
        console.error("WorkOS API code:", error.code);
      }
      if ("requestId" in error) {
        console.error("WorkOS request ID:", error.requestId);
      }
    }
    
    return NextResponse.json(
      {
        error: `Failed to create organization: ${errorMsg}. Please check your WorkOS API configuration and network connection.`,
      },
      { status: statusCode }
    );
  }

  // Try to create membership with admin role, fallback to no role if it fails
  try {
    console.log("Creating organization membership with admin role");
    await workos.userManagement.createOrganizationMembership({
      organizationId: organization.id,
      userId,
      roleSlug: "admin",
    });
    console.log("Organization membership created with admin role");
  } catch (roleError: unknown) {
    // If admin role doesn't exist (invalid_role error), try without roleSlug
    const isRoleError =
      roleError &&
      typeof roleError === "object" &&
      ("code" in roleError
        ? roleError.code === "invalid_role"
        : roleError instanceof Error &&
          (roleError.message.includes("invalid") ||
            roleError.message.includes("role") ||
            roleError.message.includes("The role is invalid")));

    if (isRoleError) {
      console.warn(
        "Admin role not found in WorkOS, creating membership without roleSlug (will use default role)"
      );
      try {
        await workos.userManagement.createOrganizationMembership({
          organizationId: organization.id,
          userId,
        });
        console.log("Organization membership created without role");
      } catch (membershipError: unknown) {
        const membershipErrorMsg =
          membershipError instanceof Error
            ? membershipError.message
            : "Unknown error";
        console.error(
          "Failed to create organization membership:",
          membershipErrorMsg,
          membershipError
        );
        return NextResponse.json(
          {
            error: `Failed to create organization membership: ${membershipErrorMsg}`,
          },
          { status: 500 }
        );
      }
    } else {
      const roleErrorMsg =
        roleError instanceof Error ? roleError.message : "Unknown error";
      console.error("Failed to create organization membership:", roleErrorMsg, roleError);
      return NextResponse.json(
        {
          error: `Failed to create organization membership: ${roleErrorMsg}`,
        },
        { status: 500 }
      );
    }
  }

  // Retrieve price ID from Stripe
  // The Stripe look up key for the price *must* be the same as the subscription level string
  let price: Stripe.ApiList<Stripe.Price>;

  try {
    console.log("Retrieving Stripe price for:", subscriptionLevel);
    price = await stripe.prices.list({
      lookup_keys: [subscriptionLevel],
    });
    console.log("Stripe price retrieved:", price.data.length, "prices found");
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : "Unknown error";
    console.error(
      "Error retrieving price from Stripe. This is likely because the products and prices have not been created yet. Run the setup script `pnpm run setup` to automatically create them.",
      errorMsg,
      error
    );
    return NextResponse.json(
      {
        error: `Error retrieving price from Stripe: ${errorMsg}. Please ensure Stripe products and prices are configured.`,
      },
      { status: 500 }
    );
  }

  if (!price.data[0]) {
    console.error(
      "No price found for subscription level:",
      subscriptionLevel
    );
    return NextResponse.json(
      {
        error: `Price not found for subscription level: ${subscriptionLevel}. Please create a Stripe price with lookup key "${subscriptionLevel}". See STRIPE_SETUP.md for instructions.`,
      },
      { status: 404 }
    );
  }

  // Create Stripe customer
  let customer;
  try {
    console.log("Creating Stripe customer for:", user.email);
    customer = await stripe.customers.create({
      email: user.email,
      metadata: {
        workOSOrganizationId: organization.id,
      },
    });
    console.log("Stripe customer created:", customer.id);
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : "Unknown error";
    console.error("Failed to create Stripe customer:", errorMsg, error);
    return NextResponse.json(
      {
        error: `Failed to create Stripe customer: ${errorMsg}. Please check your Stripe API configuration.`,
      },
      { status: 500 }
    );
  }

  // Update WorkOS organization with Stripe customer ID
  // This will allow WorkOS to automatically add entitlements to the access token
  try {
    console.log("Updating WorkOS organization with Stripe customer ID");
    await workos.organizations.updateOrganization({
      organization: organization.id,
      stripeCustomerId: customer.id,
    });
    console.log("WorkOS organization updated");
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : "Unknown error";
    console.error(
      "Failed to update WorkOS organization:",
      errorMsg,
      error
    );
    // Don't fail the whole request if this fails, just log it
    console.warn(
      "Continuing despite WorkOS organization update failure. Customer ID may not be linked."
    );
  }

  let session;
  try {
    console.log("Creating Stripe checkout session");
    session = await stripe.checkout.sessions.create({
      customer: customer.id,
      billing_address_collection: "auto",
      line_items: [
        {
          price: price.data[0].id,
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${env.NEXT_PUBLIC_BASE_URL}/dashboard`,
      cancel_url: `${env.NEXT_PUBLIC_BASE_URL}/pricing`,
      metadata: {
        workOSOrganizationId: organization.id,
        userId: userId,
        subscriptionLevel: subscriptionLevel,
      },
    });
    console.log("Stripe checkout session created:", session.id);
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : "Unknown error";
    console.error("Failed to create Stripe checkout session:", errorMsg, error);
    return NextResponse.json(
      {
        error: `Failed to create checkout session: ${errorMsg}. Please check your Stripe API configuration.`,
      },
      { status: 500 }
    );
  }

  if (!session.url) {
    console.error("Stripe checkout session created but no URL returned");
    return NextResponse.json(
      { error: "Checkout session created but no URL was returned" },
      { status: 500 }
    );
  }

  return NextResponse.json({ url: session.url });
};
