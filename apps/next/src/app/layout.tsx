import "@workos-inc/widgets/styles.css";
import {
  AuthKitProvider,
  Impersonation,
} from "@workos-inc/authkit-nextjs/components";
import type { Metadata } from "next";
import { ThemeProvider } from "next-themes";
import NextTopLoader from "nextjs-toploader";
import { DynamicBackground } from "./components/layout/dynamic-background";
import { Footer } from "./components/layout/footer";
import { Header } from "./components/layout/header";
import { QueryProvider } from "./providers/query-provider";
import "./globals.css";

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
    <html className="overflow-x-hidden" lang="en" suppressHydrationWarning>
      <body className="overflow-x-hidden bg-background antialiased">
        <QueryProvider>
          <ThemeProvider attribute="class" defaultTheme="dark">
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
          </ThemeProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
