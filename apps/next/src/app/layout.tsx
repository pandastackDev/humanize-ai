import "@workos-inc/widgets/styles.css";
import {
  AuthKitProvider,
  Impersonation,
} from "@workos-inc/authkit-nextjs/components";
import type { Metadata } from "next";
import { Geist, Geist_Mono, Inter } from "next/font/google";
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

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html className="overflow-x-hidden" lang="en" suppressHydrationWarning>
      <body
        className={`${inter.className} ${geistSans.variable} ${geistMono.variable} overflow-x-hidden bg-background antialiased`}
      >
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
