import Stripe from "stripe";

// Use placeholder value during build time if env var is not available
// This will be replaced with actual value at runtime
const stripeApiKey = process.env.STRIPE_API_KEY || "sk_placeholder_for_build";

const stripe = new Stripe(stripeApiKey);

export { stripe };
