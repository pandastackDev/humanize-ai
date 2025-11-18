import { withAuth } from "@workos-inc/authkit-nextjs";
import { HumanizeEditor } from "./components/humanize-editor";
import { SignInButtonClient } from "./components/sign-in-button-client";

export default async function Home() {
  const { user, organizationId } = await withAuth();

  if (user) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] flex-1 flex-col items-center px-2 py-6 sm:px-4 sm:py-8 md:py-12">
        <div className="flex w-full flex-col items-center gap-6 sm:gap-8">
          <div className="flex w-full max-w-2xl flex-col items-center justify-center gap-3 text-center sm:gap-4">
            <h1 className="bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text font-extrabold text-3xl text-transparent tracking-tight sm:text-4xl md:text-5xl">
              Humanize
            </h1>
            <p className="text-muted-foreground text-sm sm:text-base md:text-lg">
              Powerful Humanize AI Text Tool for 100% Human Score &
              Plagiarism-Free Content
            </p>
          </div>
          <HumanizeEditor organizationId={organizationId} userId={user.id} />
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-1 items-center justify-center px-4 py-12 sm:py-16 md:py-24">
      <div className="flex w-full max-w-4xl flex-col items-center justify-center gap-8 sm:gap-12">
        <div className="flex w-full max-w-2xl flex-col items-center justify-center gap-6 text-center sm:gap-8">
          <div className="flex flex-col items-center gap-3 sm:gap-4">
            <h1 className="bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text font-extrabold text-4xl text-transparent tracking-tight sm:text-5xl md:text-7xl lg:text-8xl">
              Humanize
            </h1>
            <p className="max-w-xl text-base text-muted-foreground sm:text-lg md:text-xl">
              Powerful Humanize AI Text Tool for 100% Human Score &
              Plagiarism-Free Content
            </p>
          </div>

          <div className="flex flex-col items-center gap-4 sm:gap-6">
            <div className="flex flex-col items-center gap-2 sm:gap-3">
              <h2 className="font-bold text-2xl tracking-tight sm:text-3xl md:text-4xl">
                Get Started with Humanize
              </h2>
              <p className="max-w-md text-muted-foreground text-sm sm:text-base md:text-lg">
                Sign in to transform your AI content and access powerful
                humanization tools
              </p>
            </div>
            <div className="mt-2">
              <SignInButtonClient large />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
