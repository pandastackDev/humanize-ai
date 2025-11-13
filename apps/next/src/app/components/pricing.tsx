import { withAuth } from "@workos-inc/authkit-nextjs";
import { Check } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ModalDialog } from "./modal-dialog";

// Ideally this data would come from a database or API
const plans = [
  {
    name: "Basic",
    teamMembers: 3,
    price: 5,
    currency: "$",
    cadence: "monthly",
    features: ["Lorem ipsum", "Lorem ipsum", "Lorem ipsum", "Lorem ipsum"],
    highlight: false,
  },
  {
    name: "Standard",
    teamMembers: 10,
    price: 10,
    currency: "$",
    cadence: "monthly",
    features: ["Lorem ipsum", "Lorem ipsum", "Lorem ipsum", "Lorem ipsum"],
    highlight: false,
  },
  {
    name: "Enterprise",
    teamMembers: "Unlimited",
    price: 100,
    currency: "$",
    cadence: "yearly",
    features: ["Audit logs", "Lorem ipsum", "Lorem ipsum", "Lorem ipsum"],
    highlight: true,
  },
];

export async function Pricing() {
  const { user } = await withAuth();

  return (
    <div className="flex w-full flex-col gap-5 sm:min-w-[50vw] sm:flex-row">
      {plans.map((plan) => (
        <div className="flex-1" key={plan.name}>
          <Card className={plan.highlight ? "border-blue-500" : ""}>
            <CardHeader>
              <CardTitle className={plan.highlight ? "text-blue-600" : ""}>
                {plan.name}
              </CardTitle>
              <p className="text-muted-foreground text-sm">
                {plan.teamMembers} team members
              </p>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="flex items-center gap-2">
                <p className="font-bold text-3xl sm:text-4xl">
                  {plan.currency}
                  {plan.price}
                </p>
                <div className="flex flex-col">
                  <p className="text-muted-foreground text-xs">per month,</p>
                  <p className="text-muted-foreground text-xs">
                    billed {plan.cadence}
                  </p>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                {plan.features.map((feature, index) => (
                  <div
                    className="flex items-center gap-2"
                    key={`${plan.name}-${index}`}
                  >
                    <Check className="h-4 w-4 shrink-0" />
                    <p className="text-sm">{feature}</p>
                  </div>
                ))}
              </div>
              {user && (
                <ModalDialog subscriptionLevel={plan.name} userId={user.id} />
              )}
            </CardContent>
          </Card>
        </div>
      ))}
    </div>
  );
}
