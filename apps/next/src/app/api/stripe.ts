import Stripe from "stripe";
import { env } from "@/env";

const stripe = new Stripe(env.STRIPE_API_KEY);

export { stripe };
