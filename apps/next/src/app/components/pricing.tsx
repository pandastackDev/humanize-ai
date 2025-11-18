"use client";

import { Check } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Ideally this data would come from a database or API
const plansData = {
  monthly: [
    {
      name: "Basic",
      description: "Best for students who need basic humanization features",
      price: 5.99,
      originalPrice: 5.99,
      currency: "$",
      features: [
        "5,000 words per month",
        "Basic AI Humanizer",
        "Unlimited AI Detection",
        "Multilingual support",
        "500 words per request",
        "My Writing Style",
        "Bypass Turnitin, GPTZero, Quillbot",
      ],
      highlight: false,
    },
    {
      name: "Pro",
      description:
        "Perfect for professional writing with advanced humanization model",
      price: 19.99,
      originalPrice: 19.99,
      currency: "$",
      features: [
        "15,000 words per month",
        "Advanced AI Humanizer",
        "Unlimited AI Detection",
        "Multilingual support",
        "1,500 words per request",
        "My Writing Style",
        "Bypass Turnitin, GPTZero, Quillbot, ZeroGPT, Originality, Copyleaks",
      ],
      highlight: true,
    },
    {
      name: "Ultra",
      description: "Designed for blogs, research papers, and long-form writing",
      price: 39.99,
      originalPrice: 39.99,
      currency: "$",
      features: [
        "30,000 words per month",
        "Advanced AI Humanizer",
        "Unlimited AI Detection",
        "Multilingual support",
        "3,000 words per request",
        "My Writing Style",
        "Bypass Turnitin, GPTZero, Quillbot, ZeroGPT, Originality, Copyleaks",
        "Fast processing",
        "Priority support",
      ],
      highlight: false,
    },
  ],
  annual: [
    {
      name: "Basic",
      description: "Best for students who need basic humanization features",
      price: 2.99,
      originalPrice: 5.99,
      currency: "$",
      features: [
        "5,000 words per month",
        "Basic AI Humanizer",
        "Unlimited AI Detection",
        "Multilingual support",
        "500 words per request",
        "My Writing Style",
        "Bypass Turnitin, GPTZero, Quillbot",
      ],
      highlight: false,
    },
    {
      name: "Pro",
      description:
        "Perfect for professional writing with advanced humanization model",
      price: 9.99,
      originalPrice: 19.99,
      currency: "$",
      features: [
        "15,000 words per month",
        "Advanced AI Humanizer",
        "Unlimited AI Detection",
        "Multilingual support",
        "1,500 words per request",
        "My Writing Style",
        "Bypass Turnitin, GPTZero, Quillbot, ZeroGPT, Originality, Copyleaks",
      ],
      highlight: true,
    },
    {
      name: "Ultra",
      description: "Designed for blogs, research papers, and long-form writing",
      price: 19.99,
      originalPrice: 39.99,
      currency: "$",
      features: [
        "30,000 words per month",
        "Advanced AI Humanizer",
        "Unlimited AI Detection",
        "Multilingual support",
        "3,000 words per request",
        "My Writing Style",
        "Bypass Turnitin, GPTZero, Quillbot, ZeroGPT, Originality, Copyleaks",
        "Fast processing",
        "Priority support",
      ],
      highlight: false,
    },
  ],
};

export function Pricing({ userId }: { userId?: string }) {
  const router = useRouter();
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "annual">(
    "annual"
  );
  const [selectedPlan, setSelectedPlan] = useState<string>("Pro");
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const plans = plansData[billingPeriod];

  const handleSubscribe = async (planName: string) => {
    if (!userId) {
      // Redirect to /login which will redirect to WorkOS sign-in
      window.location.href = "/login";
      return;
    }

    const subscriptionLevel = `${planName}-${billingPeriod}`;
    setLoadingPlan(subscriptionLevel);

    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          subscriptionLevel: subscriptionLevel.toLowerCase(),
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({
          error: `HTTP ${res.status}: ${res.statusText}`,
        }));
        throw new Error(
          errorData.error || `Failed to subscribe: ${res.statusText}`
        );
      }

      const data = await res.json();

      if (data.error) {
        throw new Error(data.error);
      }

      if (data.url) {
        window.location.href = data.url;
        return;
      }

      throw new Error("No checkout URL received from server");
    } catch (err) {
      console.error("Subscription error:", err);
      alert(
        err instanceof Error
          ? err.message
          : "An unexpected error occurred. Please try again."
      );
      setLoadingPlan(null);
    }
  };

  // Calculate indicator position for the sliding indicator
  const getIndicatorLeft = () => {
    if (billingPeriod === "monthly") {
      return "0.125rem";
    }
    return "calc(50% + 0.0625rem)";
  };

  return (
    <div className="flex w-full flex-col gap-8">
      {/* Billing Toggle */}
      <div className="flex items-center justify-center">
        <Tabs
          className="w-full max-w-xs"
          onValueChange={(value) =>
            setBillingPeriod(value as "monthly" | "annual")
          }
          value={billingPeriod}
        >
          <TabsList className="relative grid h-9 w-full grid-cols-2 gap-0.5 rounded-[32px] bg-slate-100 p-0.5 dark:bg-[#141414] [&_button]:min-h-0">
            {/* Sliding indicator */}
            <div
              className="absolute top-0.5 bottom-0.5 rounded-[32px] bg-[var(--primary)] transition-all duration-300 ease-in-out"
              style={{
                left: getIndicatorLeft(),
                width: "calc(50% - 0.1875rem)",
              }}
            />
            <TabsTrigger
              className="group relative z-10 flex h-full min-h-0 cursor-pointer items-center justify-center gap-1.5 rounded-[32px] bg-transparent px-4 font-medium text-gray-600 text-sm leading-normal transition-all duration-300 ease-in-out data-[state=active]:text-white dark:text-gray-300"
              value="monthly"
            >
              <span className="whitespace-nowrap">Monthly</span>
            </TabsTrigger>
            <TabsTrigger
              className="group relative z-10 flex h-full min-h-0 cursor-pointer items-center justify-center gap-1.5 rounded-[32px] bg-transparent px-4 font-medium text-gray-600 text-sm leading-normal transition-all duration-300 ease-in-out data-[state=active]:text-white dark:text-gray-300"
              value="annual"
            >
              <span className="whitespace-nowrap">Annual</span>
              {billingPeriod === "annual" && (
                <span
                  className="ml-1 rounded-full px-2 py-0.5 font-semibold text-white text-xs"
                  style={{ backgroundColor: "#0066ff" }}
                >
                  SAVE 50%
                </span>
              )}
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Pricing Cards */}
      <div className="flex w-full flex-col items-center justify-center gap-5 sm:flex-row sm:items-stretch">
        {plans.map((plan) => {
          const isSelected = selectedPlan === plan.name;
          return (
            <div
              className="relative w-full flex-1 sm:max-w-none"
              key={plan.name}
            >
              {plan.highlight && (
                <div
                  className="-top-3 absolute right-4 z-10 rounded-full px-3 py-1 font-semibold text-white text-xs"
                  style={{ backgroundColor: "#0066ff" }}
                >
                  MOST POPULAR
                </div>
              )}
              <Card
                className={`flex h-full cursor-pointer flex-col transition-all ${
                  isSelected
                    ? "border-2 border-[var(--primary)] shadow-lg"
                    : "border-slate-200"
                }`}
                onClick={() => setSelectedPlan(plan.name)}
              >
                <CardHeader>
                  <CardTitle
                    className={`text-xl ${
                      isSelected ? "text-[var(--primary)]" : "text-slate-900"
                    }`}
                  >
                    {plan.name}
                  </CardTitle>
                  <p className="text-muted-foreground text-sm">
                    {plan.description}
                  </p>
                </CardHeader>
                <CardContent className="flex flex-1 flex-col gap-4">
                  <div className="flex flex-wrap items-baseline gap-2">
                    <p className="font-bold text-3xl sm:text-4xl">
                      {plan.currency}
                      {plan.price.toFixed(2)}
                    </p>
                    {plan.price !== plan.originalPrice && (
                      <p className="text-muted-foreground text-sm line-through">
                        {plan.currency}
                        {plan.originalPrice.toFixed(2)}
                      </p>
                    )}
                    <p className="text-muted-foreground text-xs">
                      Per month, billed{" "}
                      {billingPeriod === "annual" ? "annually" : "monthly"}
                    </p>
                  </div>
                  <div className="flex flex-1 flex-col gap-3">
                    {plan.features.map((feature, index) => (
                      <div
                        className="flex items-start gap-2"
                        key={`${plan.name}-${index}`}
                      >
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-[var(--primary)]" />
                        <p className="text-slate-700 text-sm dark:text-slate-300">
                          {feature}
                        </p>
                      </div>
                    ))}
                  </div>
                  {userId ? (
                    <Button
                      className="mt-auto w-full bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-90"
                      disabled={loadingPlan === `${plan.name}-${billingPeriod}`}
                      onClick={() => handleSubscribe(plan.name)}
                    >
                      {loadingPlan === `${plan.name}-${billingPeriod}` ? (
                        <>
                          <LoadingSpinner className="mr-2" size="sm" />
                          Redirecting...
                        </>
                      ) : (
                        "Subscribe"
                      )}
                    </Button>
                  ) : (
                    <Button
                      className="mt-auto w-full bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-90"
                      onClick={() => {
                        // Redirect to /login which will redirect to WorkOS sign-in
                        window.location.href = "/login";
                      }}
                    >
                      Sign in to Subscribe
                    </Button>
                  )}
                </CardContent>
              </Card>
            </div>
          );
        })}
      </div>
    </div>
  );
}
