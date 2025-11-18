import { type NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";
import { env } from "@/env";
import { stripe } from "../stripe";
import { workos } from "../workos";

const PRICE_PER_PACKAGE = 1.99; // $1.99 per 1000 words
const WORDS_PER_PACKAGE = 1000;

export const POST = async (req: NextRequest) => {
  let body;
  const findCustomerByMetadata = async (
    key: string,
    value: string
  ): Promise<Stripe.Customer | null> => {
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
  };

  try {
    body = await req.json();
  } catch (error) {
    console.error("Error parsing request body:", error);
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }

  const { userId, organizationId, wordAmount, packages } = body;

  if (!userId || !wordAmount || !packages) {
    return NextResponse.json(
      { error: "Missing required fields: userId, wordAmount, packages" },
      { status: 400 }
    );
  }

  // Validate word amount
  if (wordAmount < 1000 || wordAmount > 30000) {
    return NextResponse.json(
      { error: "Word amount must be between 1,000 and 30,000" },
      { status: 400 }
    );
  }

  // Validate packages
  if (packages < 1 || packages > 30) {
    return NextResponse.json(
      { error: "Packages must be between 1 and 30" },
      { status: 400 }
    );
  }

  // Validate environment variables
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

  try {
    // Get or create Stripe customer
    let customerId: string;
    let organization;

    if (organizationId) {
      // Get organization from WorkOS
      organization = await workos.organizations.getOrganization(organizationId);
      
      // Check if organization has a Stripe customer ID
      // We'll need to store this in Convex or fetch from Stripe
      // For now, we'll search Stripe for existing customer by metadata
      const existingCustomer = await findCustomerByMetadata(
        "workOSOrganizationId",
        organizationId
      );

      if (existingCustomer) {
        customerId = existingCustomer.id;
      } else {
        // Create new Stripe customer
        const customer = await stripe.customers.create({
          email: organization.domains?.[0] || undefined,
          metadata: {
            workOSOrganizationId: organizationId,
            workOSUserId: userId,
          },
        });
        customerId = customer.id;
      }
    } else {
      // No organization - create customer with user ID only
      const existingCustomer = await findCustomerByMetadata(
        "workOSUserId",
        userId
      );

      if (existingCustomer) {
        customerId = existingCustomer.id;
      } else {
        const customer = await stripe.customers.create({
          metadata: {
            workOSUserId: userId,
          },
        });
        customerId = customer.id;
      }
    }

    // Calculate total price
    const totalPrice = packages * PRICE_PER_PACKAGE;
    const amountInCents = Math.round(totalPrice * 100);

    const metadata = {
      type: "word_purchase",
      userId,
      organizationId: organizationId || "",
      wordAmount: wordAmount.toString(),
      packages: packages.toString(),
    };
    const clientReferenceId = JSON.stringify(metadata);

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
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
      client_reference_id: clientReferenceId,
      payment_intent_data: {
        metadata,
      },
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

