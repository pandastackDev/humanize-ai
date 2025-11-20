import { Providers } from "@/components/providers";
import "@humanize/ui/globals.css";
import {
  AuthKitProvider,
  Impersonation,
} from "@workos-inc/authkit-nextjs/components";
import "@workos-inc/widgets/styles.css";
import type { Metadata } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import NextTopLoader from "nextjs-toploader";
import { DynamicBackground } from "./components/layout/dynamic-background";
import { Footer } from "./components/layout/footer";
import { Header } from "./components/layout/header";
import { QueryProvider } from "./providers/query-provider";

// If loading a variable font, you don't need to specify the font weight
const fontSans = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sans",
});

const fontHeading = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-heading",
  weight: ["600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Humanize",
  description: "Humanize is a platform for ... ",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${fontSans.variable} ${fontHeading.variable} font-sans antialiased`}
      >
        <Providers>
          <QueryProvider>
            <div className="min-h-screen bg-background">
              <DynamicBackground>
                <NextTopLoader showSpinner={false} />
                <div className="relative z-1 flex min-h-screen flex-col">
                  <AuthKitProvider>
                    <Impersonation />
                    <Header />
                    <div className="relative z-1 grow">
                      <main className="relative z-1">{children}</main>
                    </div>
                    <Footer />
                  </AuthKitProvider>
                </div>
              </DynamicBackground>
            </div>
          </QueryProvider>
        </Providers>
      </body>
    </html>
  );
}
