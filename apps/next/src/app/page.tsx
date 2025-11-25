import { withAuth } from "@workos-inc/authkit-nextjs";
import { BypassDetectorsSection } from "./components/bypass-detectors-section";
import { FAQSection } from "./components/faq-section";
import { HumanizeEditor } from "./components/humanize-editor";

export default async function Home() {
  const { user, organizationId } = await withAuth();

  if (user) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] flex-1 flex-col items-center bg-white px-2 py-6 sm:px-4 sm:py-8 md:py-12 dark:bg-[#141414]">
        <div className="flex w-full flex-col items-center gap-6 sm:gap-8">
          <div className="flex w-full max-w-5xl flex-col items-center justify-center gap-3 text-center sm:gap-4">
            <h1 className="font-bold font-heading text-slate-900 text-xl tracking-tight sm:text-2xl md:text-3xl lg:text-4xl xl:whitespace-nowrap dark:text-slate-100">
              Humanize AI Text Tool for 100% Human Score & Plagiarism-Free
              Content
            </h1>
            <p className="text-slate-600 text-sm sm:text-base md:text-lg dark:text-[hsl(0_0%_68%)]">
              Get the best humanizer AI online. AISEO offers unlimited free
              words, plagiarism-free content, and a 100% human score.
              Effortlessly bypass all AI detectors.
            </p>
          </div>
          <HumanizeEditor organizationId={organizationId} userId={user.id} />
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex min-h-[calc(100vh-4rem)] flex-1 flex-col items-center bg-white px-2 py-6 sm:px-4 sm:py-8 md:py-12 dark:bg-[#141414]">
        <div className="flex w-full flex-col items-center gap-6 sm:gap-8">
          <div className="flex w-full max-w-5xl flex-col items-center justify-center gap-3 text-center sm:gap-4">
            <h1 className="font-bold text-slate-900 text-xl tracking-tight sm:text-2xl md:text-3xl lg:text-4xl xl:whitespace-nowrap dark:text-slate-100">
              Humanize AI Text Tool for 100% Human Score & Plagiarism-Free
              Content
            </h1>
            <p className="text-slate-600 text-sm sm:text-base md:text-lg dark:text-[hsl(0_0%_68%)]">
              Get the best humanizer AI online. AISEO offers unlimited free
              words, plagiarism-free content, and a 100% human score.
              Effortlessly bypass all AI detectors.
            </p>
          </div>
          <HumanizeEditor />
        </div>
      </div>
      <BypassDetectorsSection />
      <FAQSection />
    </>
  );
}
