import { Box, Flex, Theme } from "@radix-ui/themes";
import "@radix-ui/themes/styles.css";
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
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className}`}>
        <QueryProvider>
          <ThemeProvider attribute="class" defaultTheme="dark">
            <Theme
              accentColor="iris"
              panelBackground="solid"
              style={{ backgroundColor: "var(--gray-1)" }}
            >
              <DynamicBackground>
                <NextTopLoader showSpinner={false} />
                <Flex direction="column" minHeight="100vh">
                  <Header />
                  <Box asChild flexGrow="1">
                    <AuthKitProvider>
                      <Impersonation />
                      <main>{children}</main>
                    </AuthKitProvider>
                  </Box>
                  <Footer />
                </Flex>
              </DynamicBackground>
            </Theme>
          </ThemeProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
