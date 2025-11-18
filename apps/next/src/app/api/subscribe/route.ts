import type { User } from "@workos-inc/node";
import { type NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";
import { env } from "@/env";
import { stripe } from "../stripe";
import { workos } from "../workos";

type RequestBody = {
  userId: string;
  orgName?: string;
  subscriptionLevel: string;
};

async function parseAndValidateRequest(
  req: NextRequest
): Promise<RequestBody | NextResponse> {
  let body: RequestBody;
  try {
    body = await req.json();
  } catch (error) {
    console.error("Error parsing request body:", error);
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }

  const { userId, subscriptionLevel } = body;

  if (!(userId && subscriptionLevel)) {
    return NextResponse.json(
      { error: "Missing required fields: userId, subscriptionLevel" },
      { status: 400 }
    );
  }

  return body;
}

function validateEnvironment(): NextResponse | null {
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

  return null;
}

async function getWorkOSUser(userId: string): Promise<User | NextResponse> {
  try {
    console.log("Getting WorkOS user:", userId);
    const user = await workos.userManagement.getUser(userId);
    console.log("User retrieved:", user.email);
    return user;
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : "Unknown error";
    console.error("Failed to get WorkOS user:", errorMsg, error);
    return NextResponse.json(
      { error: `Failed to retrieve user information: ${errorMsg}` },
      { status: 500 }
    );
  }
}

function generateOrganizationName(user: User, orgName?: string): string {
  if (orgName) {
    return orgName;
  }
  if (user.firstName) {
    return `${user.firstName}'s Organization`;
  }
  return `${user.email.split("@")[0]}'s Organization`;
}

type WorkOSOrganization = Awaited<
  ReturnType<typeof workos.organizations.createOrganization>
>;

function parseWorkOSError(error: unknown): {
  message: string;
  statusCode: number;
} {
  let errorMsg = "Unknown error";
  let statusCode = 500;

  if (error instanceof Error) {
    errorMsg = error.message;

    if (
      errorMsg.includes("fetch failed") ||
      errorMsg.includes("NetworkError") ||
      errorMsg.includes("ECONNREFUSED") ||
      errorMsg.includes("ETIMEDOUT")
    ) {
      errorMsg = `Network error connecting to WorkOS API: ${errorMsg}. Please check your internet connection and WorkOS API key.`;
    } else if (errorMsg.includes("401") || errorMsg.includes("Unauthorized")) {
      errorMsg =
        "WorkOS API authentication failed. Please check your WORKOS_API_KEY in environment variables.";
      statusCode = 401;
    } else if (errorMsg.includes("403") || errorMsg.includes("Forbidden")) {
      errorMsg =
        "WorkOS API access forbidden. Please check your API key permissions.";
      statusCode = 403;
    }
  }

  return { message: errorMsg, statusCode };
}

function logWorkOSError(error: unknown, errorMsg: string): void {
  console.error("Failed to create WorkOS organization:", errorMsg);
  console.error("Error details:", error);

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
}

async function createWorkOSOrganization(
  organizationName: string
): Promise<WorkOSOrganization | NextResponse> {
  try {
    console.log("Creating WorkOS organization:", organizationName);
    console.log(
      "WorkOS API Key configured:",
      env.WORKOS_API_KEY ? "Yes" : "No"
    );
    console.log(
      "WorkOS Client ID configured:",
      env.WORKOS_CLIENT_ID ? "Yes" : "No"
    );

    const organization = await workos.organizations.createOrganization({
      name: organizationName,
    });
    console.log("Organization created:", organization.id);
    return organization;
  } catch (error: unknown) {
    const { message, statusCode } = parseWorkOSError(error);
    logWorkOSError(error, message);

    return NextResponse.json(
      {
        error: `Failed to create organization: ${message}. Please check your WorkOS API configuration and network connection.`,
      },
      { status: statusCode }
    );
  }
}

function isRoleError(error: unknown): boolean {
  if (!error || typeof error !== "object") {
    return false;
  }
  if ("code" in error) {
    return error.code === "invalid_role";
  }
  if (error instanceof Error) {
    return (
      error.message.includes("invalid") ||
      error.message.includes("role") ||
      error.message.includes("The role is invalid")
    );
  }
  return false;
}

async function createOrganizationMembership(
  organizationId: string,
  userId: string
): Promise<NextResponse | null> {
  try {
    console.log("Creating organization membership with admin role");
    await workos.userManagement.createOrganizationMembership({
      organizationId,
      userId,
      roleSlug: "admin",
    });
    console.log("Organization membership created with admin role");
    return null;
  } catch (roleError: unknown) {
    if (isRoleError(roleError)) {
      console.warn(
        "Admin role not found in WorkOS, creating membership without roleSlug (will use default role)"
      );
      try {
        await workos.userManagement.createOrganizationMembership({
          organizationId,
          userId,
        });
        console.log("Organization membership created without role");
        return null;
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
    }

    const roleErrorMsg =
      roleError instanceof Error ? roleError.message : "Unknown error";
    console.error(
      "Failed to create organization membership:",
      roleErrorMsg,
      roleError
    );
    return NextResponse.json(
      { error: `Failed to create organization membership: ${roleErrorMsg}` },
      { status: 500 }
    );
  }
}

async function getStripePrice(
  subscriptionLevel: string
): Promise<Stripe.Price | NextResponse> {
  try {
    console.log("Retrieving Stripe price for:", subscriptionLevel);
    const priceList = await stripe.prices.list({
      lookup_keys: [subscriptionLevel],
    });
    console.log(
      "Stripe price retrieved:",
      priceList.data.length,
      "prices found"
    );

    if (!priceList.data[0]) {
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

    return priceList.data[0];
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
}

async function createStripeCustomer(
  user: User,
  organizationId: string
): Promise<Stripe.Customer | NextResponse> {
  try {
    console.log("Creating Stripe customer for:", user.email);
    const customer = await stripe.customers.create({
      email: user.email,
      metadata: {
        workOSOrganizationId: organizationId,
      },
    });
    console.log("Stripe customer created:", customer.id);
    return customer;
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
}

async function updateOrganizationWithCustomer(
  organizationId: string,
  customerId: string
): Promise<void> {
  try {
    console.log("Updating WorkOS organization with Stripe customer ID");
    await workos.organizations.updateOrganization({
      organization: organizationId,
      stripeCustomerId: customerId,
    });
    console.log("WorkOS organization updated");
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : "Unknown error";
    console.error("Failed to update WorkOS organization:", errorMsg, error);
    console.warn(
      "Continuing despite WorkOS organization update failure. Customer ID may not be linked."
    );
  }
}

async function createStripeCheckoutSession(params: {
  customerId: string;
  priceId: string;
  organizationId: string;
  userId: string;
  subscriptionLevel: string;
}): Promise<Stripe.Checkout.Session | NextResponse> {
  const { customerId, priceId, organizationId, userId, subscriptionLevel } =
    params;
  try {
    console.log("Creating Stripe checkout session");
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      billing_address_collection: "auto",
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${env.NEXT_PUBLIC_BASE_URL}/dashboard`,
      cancel_url: `${env.NEXT_PUBLIC_BASE_URL}/pricing`,
      metadata: {
        workOSOrganizationId: organizationId,
        userId,
        subscriptionLevel,
      },
    });
    console.log("Stripe checkout session created:", session.id);
    return session;
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
}

export const POST = async (req: NextRequest) => {
  const bodyOrError = await parseAndValidateRequest(req);
  if (bodyOrError instanceof NextResponse) {
    return bodyOrError;
  }

  const envError = validateEnvironment();
  if (envError) {
    return envError;
  }

  const { userId, orgName, subscriptionLevel } = bodyOrError;

  const userOrError = await getWorkOSUser(userId);
  if (userOrError instanceof NextResponse) {
    return userOrError;
  }

  const organizationName = generateOrganizationName(userOrError, orgName);

  const organizationOrError = await createWorkOSOrganization(organizationName);
  if (organizationOrError instanceof NextResponse) {
    return organizationOrError;
  }

  const membershipError = await createOrganizationMembership(
    organizationOrError.id,
    userId
  );
  if (membershipError) {
    return membershipError;
  }

  const priceOrError = await getStripePrice(subscriptionLevel);
  if (priceOrError instanceof NextResponse) {
    return priceOrError;
  }

  const customerOrError = await createStripeCustomer(
    userOrError,
    organizationOrError.id
  );
  if (customerOrError instanceof NextResponse) {
    return customerOrError;
  }

  await updateOrganizationWithCustomer(
    organizationOrError.id,
    customerOrError.id
  );

  const sessionOrError = await createStripeCheckoutSession({
    customerId: customerOrError.id,
    priceId: priceOrError.id,
    organizationId: organizationOrError.id,
    userId,
    subscriptionLevel,
  });
  if (sessionOrError instanceof NextResponse) {
    return sessionOrError;
  }

  if (!sessionOrError.url) {
    console.error("Stripe checkout session created but no URL returned");
    return NextResponse.json(
      { error: "Checkout session created but no URL was returned" },
      { status: 500 }
    );
  }

  return NextResponse.json({ url: sessionOrError.url });
};
