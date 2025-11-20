import { withAuth } from "@workos-inc/authkit-nextjs";
import { Pricing } from "../components/pricing";

export default async function PricingPage() {
  const { user, organizationId } = await withAuth();

  return (
    <div className="min-h-screen bg-white dark:bg-white">
      <div className="flex w-full flex-1 flex-col items-center justify-center gap-8 p-4 px-4 py-12 sm:px-6">
        <div className="mx-auto flex w-full max-w-7xl flex-col items-center gap-8 px-4 sm:px-6">
          <h1 className="text-center font-bold text-4xl sm:text-5xl lg:text-6xl">
            Choose the right plan for you
          </h1>
          <Pricing organizationId={organizationId} userId={user?.id} />
        </div>
      </div>
    </div>
  );
}
