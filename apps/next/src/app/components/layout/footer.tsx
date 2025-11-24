"use client";

import {
  ChevronDown,
  Facebook,
  Instagram,
  Linkedin,
  Twitter,
  Youtube,
} from "lucide-react";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@humanize/ui/components/dropdown-menu";

// TikTok Icon Component
const TikTokIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    fill="currentColor"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
  >
    <title>TikTok</title>
    <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z" />
  </svg>
);

const SOCIAL_LINKS = [
  {
    name: "Instagram",
    icon: Instagram,
    href: "https://instagram.com",
    color: "text-pink-500",
  },
  {
    name: "TikTok",
    icon: TikTokIcon,
    href: "https://tiktok.com",
    color: "text-white",
  },
  {
    name: "YouTube",
    icon: Youtube,
    href: "https://youtube.com",
    color: "text-red-500",
  },
  {
    name: "Facebook",
    icon: Facebook,
    href: "https://facebook.com",
    color: "text-blue-500",
  },
  {
    name: "LinkedIn",
    icon: Linkedin,
    href: "https://linkedin.com",
    color: "text-blue-400",
  },
  {
    name: "X (Twitter)",
    icon: Twitter,
    href: "https://twitter.com",
    color: "text-white",
  },
];

export function Footer() {
  return (
    <footer className="mt-auto bg-black">
      {/* Layer 1: Help Center Section */}
      <div className="bg-black py-2">
        <div className="container mx-auto px-4 text-center text-gray-300 text-sm md:px-6">
          Still have more questions? Find answers in our{" "}
          <Link
            className="underline transition-colors hover:text-white"
            href="/help"
          >
            help center
          </Link>
          .
        </div>
      </div>

      {/* Layer 2: Trademark Policy Section */}
      <div className="bg-black py-2">
        <div className="container mx-auto px-4 text-center text-gray-300 text-sm md:px-6">
          <Link
            className="transition-colors hover:text-white"
            href="/legal/trademark"
          >
            Trademark Policy
          </Link>
        </div>
      </div>

      {/* Layer 3: Main Footer Navigation & Copyright */}
      <div className="bg-black py-4">
        <div className="container mx-auto px-4 md:px-6">
          {/* Navigation and Social Media Row */}
          <div className="flex flex-col items-center justify-between gap-4 pb-4 lg:flex-row">
            {/* Navigation Links */}
            <nav className="flex flex-wrap items-center justify-center gap-4 text-sm text-white lg:justify-start">
              <Link className="transition-colors hover:text-gray-300" href="/">
                Home
              </Link>
              <Link
                className="transition-colors hover:text-gray-300"
                href="/docs"
              >
                Docs
              </Link>
              <Link
                className="transition-colors hover:text-gray-300"
                href="/guides"
              >
                Guides
              </Link>
              <Link
                className="transition-colors hover:text-gray-300"
                href="/academy"
              >
                Academy
              </Link>

              {/* SDKs Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger className="flex items-center gap-1 text-white transition-colors hover:text-gray-300">
                  SDKs
                  <ChevronDown className="h-4 w-4" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  <DropdownMenuItem asChild>
                    <Link href="/sdk/javascript">JavaScript</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/sdk/python">Python</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/sdk/node">Node.js</Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <Link
                className="transition-colors hover:text-gray-300"
                href="/help"
              >
                Help
              </Link>
              <Link
                className="transition-colors hover:text-gray-300"
                href="/contact"
              >
                Contact
              </Link>

              {/* Legal Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger className="flex items-center gap-1 text-white transition-colors hover:text-gray-300">
                  Legal
                  <ChevronDown className="h-4 w-4" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  <DropdownMenuItem asChild>
                    <Link href="/legal/privacy">Privacy Policy</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/legal/terms">Terms of Service</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/legal/trademark">Trademark Policy</Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </nav>

            {/* Social Media Icons */}
            <div className="flex items-center gap-3">
              {SOCIAL_LINKS.map((social) => {
                const IconComponent = social.icon;
                return (
                  <a
                    aria-label={social.name}
                    className={`${social.color} transition-opacity hover:opacity-80`}
                    href={social.href}
                    key={social.name}
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    <IconComponent className="h-5 w-5" />
                  </a>
                );
              })}
            </div>
          </div>

          {/* Copyright */}
          <div className="border-gray-800 border-t pt-3">
            <p className="text-center text-gray-400 text-xs">
              Copyright © {new Date().getFullYear()} Humanize. All rights
              reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
