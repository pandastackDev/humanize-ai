import "@workos-inc/widgets/styles.css";
import {
  AuthKitProvider,
  Impersonation,
} from "@workos-inc/authkit-nextjs/components";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ThemeProvider } from "next-themes";
import NextTopLoader from "nextjs-toploader";
import { DynamicBackground } from "./components/layout/dynamic-background";
import { Footer } from "./components/layout/footer";
import { Header } from "./components/layout/header";
import { QueryProvider } from "./providers/query-provider";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Humanize",
  description: "Humanize is a platform for ... ",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html className="overflow-x-hidden" lang="en" suppressHydrationWarning>
      <body className={`${inter.className} overflow-x-hidden bg-background`}>
        <QueryProvider>
          <ThemeProvider attribute="class" defaultTheme="dark">
            <div className="min-h-screen bg-background">
              <DynamicBackground>
                <NextTopLoader showSpinner={false} />
                <div className="relative z-1 flex min-h-screen flex-col">
                  <Header />
                  <div className="relative z-1 grow">
                    <AuthKitProvider>
                      <Impersonation />
                      <main className="relative z-1">{children}</main>
                    </AuthKitProvider>
                  </div>
                  <Footer />
                </div>
              </DynamicBackground>
            </div>
          </ThemeProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
