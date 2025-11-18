import { type NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";
import { env } from "@/env";
import { stripe } from "../stripe";
import { workos } from "../workos";

const PRICE_PER_PACKAGE = 1.99; // $1.99 per 1000 words
const WORDS_PER_PACKAGE = 1000;

type RequestBody = {
  userId: string;
  organizationId?: string;
  wordAmount: number;
  packages: number;
};

async function findCustomerByMetadata(
  key: string,
  value: string
): Promise<Stripe.Customer | null> {
  try {
    const result = await stripe.customers.search({
      query: `metadata['${key}']:'${value}'`,
      limit: 1,
    });
    return result.data[0] ?? null;
  } catch (error) {
    console.error(
      `Error searching Stripe customers by metadata ${key}:`,
      error
    );
    return null;
  }
}

async function parseRequestBody(req: NextRequest): Promise<RequestBody | null> {
  try {
    return await req.json();
  } catch (error) {
    console.error("Error parsing request body:", error);
    return null;
  }
}

function validateRequestBody(body: RequestBody | null): NextResponse | null {
  if (!body) {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }

  const { userId, wordAmount, packages } = body;

  if (!(userId && wordAmount && packages)) {
    return NextResponse.json(
      { error: "Missing required fields: userId, wordAmount, packages" },
      { status: 400 }
    );
  }

  if (wordAmount < 1000 || wordAmount > 30_000) {
    return NextResponse.json(
      { error: "Word amount must be between 1,000 and 30,000" },
      { status: 400 }
    );
  }

  if (packages < 1 || packages > 30) {
    return NextResponse.json(
      { error: "Packages must be between 1 and 30" },
      { status: 400 }
    );
  }

  return null;
}

function validateEnvironment(): NextResponse | null {
  if (!env.STRIPE_API_KEY) {
    console.error("STRIPE_API_KEY is not set");
    return NextResponse.json(
      { error: "Stripe API key is not configured" },
      { status: 500 }
    );
  }

  if (!env.WORKOS_API_KEY) {
    console.error("WORKOS_API_KEY is not set");
    return NextResponse.json(
      { error: "WorkOS API key is not configured" },
      { status: 500 }
    );
  }

  return null;
}

async function getOrCreateCustomer(
  userId: string,
  organizationId?: string
): Promise<string> {
  if (organizationId) {
    const organization =
      await workos.organizations.getOrganization(organizationId);
    const existingCustomer = await findCustomerByMetadata(
      "workOSOrganizationId",
      organizationId
    );

    if (existingCustomer) {
      return existingCustomer.id;
    }

    const customer = await stripe.customers.create({
      email: organization.domains?.[0]?.domain || undefined,
      metadata: {
        workOSOrganizationId: organizationId,
        workOSUserId: userId,
      },
    });
    return customer.id;
  }

  const existingCustomer = await findCustomerByMetadata("workOSUserId", userId);

  if (existingCustomer) {
    return existingCustomer.id;
  }

  const customer = await stripe.customers.create({
    metadata: {
      workOSUserId: userId,
    },
  });
  return customer.id;
}

export const POST = async (req: NextRequest) => {
  const body = await parseRequestBody(req);

  const validationError = validateRequestBody(body);
  if (validationError) {
    return validationError;
  }

  const envError = validateEnvironment();
  if (envError) {
    return envError;
  }

  const { userId, organizationId, wordAmount, packages } = body as RequestBody;

  try {
    const customerId = await getOrCreateCustomer(userId, organizationId);
    const session = await createCheckoutSession({
      customerId,
      userId,
      organizationId,
      wordAmount,
      packages,
    });

    return NextResponse.json({
      checkoutUrl: session.url,
      sessionId: session.id,
    });
  } catch (error) {
    console.error("Error creating checkout session:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";
    return NextResponse.json(
      { error: `Failed to create checkout session: ${errorMessage}` },
      { status: 500 }
    );
  }
};

async function createCheckoutSession(params: {
  customerId: string;
  userId: string;
  organizationId: string | undefined;
  wordAmount: number;
  packages: number;
}): Promise<Stripe.Checkout.Session> {
  const { customerId, userId, organizationId, wordAmount, packages } = params;
  const totalPrice = packages * PRICE_PER_PACKAGE;
  const amountInCents = Math.round(totalPrice * 100);

  const metadata = {
    type: "word_purchase",
    userId,
    organizationId: organizationId || "",
    wordAmount: wordAmount.toString(),
    packages: packages.toString(),
  };

  return await stripe.checkout.sessions.create({
    customer: customerId,
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: {
            name: "Word Package",
            description: `${wordAmount.toLocaleString()} words (${packages} × ${WORDS_PER_PACKAGE.toLocaleString()} words)`,
          },
          unit_amount: amountInCents,
        },
        quantity: 1,
      },
    ],
    mode: "payment",
    success_url: `${env.NEXT_PUBLIC_BASE_URL}/?purchase=success`,
    cancel_url: `${env.NEXT_PUBLIC_BASE_URL}/?purchase=cancelled`,
    client_reference_id: JSON.stringify(metadata),
    payment_intent_data: {
      metadata,
    },
  });
}
