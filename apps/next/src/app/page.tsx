import { withAuth } from "@workos-inc/authkit-nextjs";
import { HumanizeEditor } from "./components/humanize-editor";
import { SignInButton } from "./components/sign-in-button2";

export default async function Home() {
  const { user } = await withAuth();

  if (user) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] flex-1 flex-col items-center px-4 py-8 md:py-12">
        <div className="flex w-full flex-col items-center gap-8">
          <div className="flex w-full max-w-2xl flex-col items-center justify-center gap-4 text-center">
            <h1 className="bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text font-extrabold text-4xl text-transparent tracking-tight md:text-5xl">
              Humanize
            </h1>
            <p className="text-base text-muted-foreground md:text-lg">
              Powerful Humanize AI Text Tool for 100% Human Score &
              Plagiarism-Free Content
            </p>
          </div>
          <HumanizeEditor />
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-1 items-center justify-center px-4 py-16 md:py-24">
      <div className="flex w-full max-w-4xl flex-col items-center justify-center gap-12">
        <div className="flex w-full max-w-2xl flex-col items-center justify-center gap-8 text-center">
          <div className="flex flex-col items-center gap-4">
            <h1 className="bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text font-extrabold text-5xl text-transparent tracking-tight md:text-7xl lg:text-8xl">
              Humanize
            </h1>
            <p className="max-w-xl text-lg text-muted-foreground md:text-xl">
              Powerful Humanize AI Text Tool for 100% Human Score &
              Plagiarism-Free Content
            </p>
          </div>

          <div className="flex flex-col items-center gap-6">
            <div className="flex flex-col items-center gap-3">
              <h2 className="font-bold text-3xl tracking-tight md:text-4xl">
                Get Started with Humanize
              </h2>
              <p className="max-w-md text-base text-muted-foreground md:text-lg">
                Sign in to transform your AI content and access powerful
                humanization tools
              </p>
            </div>
            <div className="mt-2">
              <SignInButton large />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}