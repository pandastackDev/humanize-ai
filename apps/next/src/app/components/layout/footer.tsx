"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@humanize/ui/components/dropdown-menu";
import { ChevronDown, Monitor, Moon, Sun } from "lucide-react";
import Link from "next/link";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

// Triangle Logo SVG Component
const TriangleLogo = ({ className }: { className?: string }) => (
  <svg
    className={className}
    fill="currentColor"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
  >
    <title>Humanize Logo</title>
    <path d="M12 2L2 22h20L12 2z" />
  </svg>
);

// Helper function to detect if it's night time (6 PM to 6 AM)
const getIsNightTime = (): boolean => {
  const now = new Date();
  const hours = now.getHours();
  // Night time: 6 PM (18:00) to 6 AM (06:00)
  return hours >= 18 || hours < 6;
};

// Social Media SVG Icons
const InstagramIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    fill="currentColor"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
  >
    <title>Instagram</title>
    <path
      d="M12.005 2.999c-3.759 0-4.858.004-5.071.021-.772.065-1.252.186-1.775.446-.402.2-.72.432-1.034.758-.571.592-.917 1.322-1.043 2.19-.06.42-.078.506-.082 2.656v2.926c0 3.755.004 4.853.022 5.067.063.75.18 1.222.43 1.739a3.792 3.792 0 0 0 2.457 2.008c.372.095.781.148 1.308.173.223.01 2.495.016 4.769.016 2.273 0 4.547-.002 4.764-.014.61-.028.964-.076 1.355-.177a3.77 3.77 0 0 0 2.458-2.012c.244-.504.368-.994.424-1.705.012-.155.017-2.628.017-5.098 0-2.47-.005-4.938-.017-5.093-.057-.723-.181-1.209-.433-1.723a3.568 3.568 0 0 0-.77-1.055c-.596-.57-1.325-.915-2.193-1.04-.42-.061-.504-.08-2.656-.083z"
      fill="url(#instagram_static_svg__a)"
    />
    <path
      d="M12.005 2.999c-3.759 0-4.858.004-5.071.021-.772.065-1.252.186-1.775.446-.402.2-.72.432-1.034.758-.571.592-.917 1.322-1.043 2.19-.06.42-.078.506-.082 2.656v2.926c0 3.755.004 4.853.022 5.067.063.75.18 1.222.43 1.739a3.792 3.792 0 0 0 2.457 2.008c.372.095.781.148 1.308.173.223.01 2.495.016 4.769.016 2.273 0 4.547-.002 4.764-.014.61-.028.964-.076 1.355-.177a3.77 3.77 0 0 0 2.458-2.012c.244-.504.368-.994.424-1.705.012-.155.017-2.628.017-5.098 0-2.47-.005-4.938-.017-5.093-.057-.723-.181-1.209-.433-1.723a3.568 3.568 0 0 0-.77-1.055c-.596-.57-1.325-.915-2.193-1.04-.42-.061-.504-.08-2.656-.083z"
      fill="url(#instagram_static_svg__b)"
    />
    <path
      d="M12 5.353c-1.804 0-2.03.008-2.74.04-.707.032-1.19.144-1.613.309-.437.17-.808.397-1.178.766-.37.37-.596.74-.767 1.178-.164.422-.277.906-.308 1.613-.032.709-.04.936-.04 2.74 0 1.806.008 2.032.04 2.74.032.708.144 1.191.308 1.614.17.437.397.808.767 1.178.37.37.74.597 1.177.767.423.164.906.276 1.614.309.709.032.935.04 2.74.04 1.805 0 2.031-.008 2.74-.04.708-.033 1.191-.145 1.614-.31.437-.17.807-.397 1.177-.766.37-.37.597-.74.767-1.178.163-.423.275-.906.309-1.613.032-.71.04-.935.04-2.74 0-1.805-.008-2.032-.04-2.741-.034-.708-.146-1.19-.31-1.613a3.264 3.264 0 0 0-.766-1.178c-.37-.37-.74-.597-1.177-.766-.424-.165-.907-.277-1.615-.309-.709-.032-.935-.04-2.74-.04zm-.595 1.198H12c1.774 0 1.985.006 2.686.038.648.03 1 .138 1.234.229.31.12.531.264.764.497.232.233.376.454.497.764.09.234.2.586.229 1.234.032.7.039.911.039 2.685s-.007 1.985-.04 2.685c-.029.648-.137 1-.228 1.234-.12.31-.265.531-.497.764a2.054 2.054 0 0 1-.764.497c-.234.091-.586.2-1.234.229-.701.032-.912.039-2.686.039-1.775 0-1.985-.007-2.686-.04-.648-.029-1-.137-1.234-.228a2.06 2.06 0 0 1-.765-.497 2.061 2.061 0 0 1-.497-.764c-.091-.234-.2-.586-.229-1.234-.032-.7-.038-.911-.038-2.686s.006-1.985.038-2.685c.03-.649.138-1 .229-1.235.12-.31.265-.531.497-.764.233-.233.455-.377.765-.497.234-.092.586-.2 1.234-.23.613-.027.85-.036 2.09-.037zm4.144 1.103a.798.798 0 1 0 0 1.596.798.798 0 0 0 0-1.596zM12 8.586a3.414 3.414 0 1 0 0 6.827 3.414 3.414 0 0 0 0-6.827m0 1.198a2.216 2.216 0 1 1 0 4.431 2.216 2.216 0 0 1 0-4.43"
      fill="#fff"
    />
    <defs>
      <radialGradient
        cx="0"
        cy="0"
        gradientTransform="matrix(0 -17.8399 16.5965 0 7.782 22.386)"
        gradientUnits="userSpaceOnUse"
        id="instagram_static_svg__a"
        r="1"
      >
        <stop stopColor="#FD5" />
        <stop offset="0.1" stopColor="#FD5" />
        <stop offset="0.5" stopColor="#FF543E" />
        <stop offset="1" stopColor="#C837AB" />
      </radialGradient>
      <radialGradient
        cx="0"
        cy="0"
        gradientTransform="matrix(1.56559 7.81938 -32.23906 6.45487 -.016 4.296)"
        gradientUnits="userSpaceOnUse"
        id="instagram_static_svg__b"
        r="1"
      >
        <stop stopColor="#3771C8" />
        <stop offset="0.128" stopColor="#3771C8" />
        <stop offset="1" stopColor="#60F" stopOpacity="0" />
      </radialGradient>
    </defs>
  </svg>
);

const TikTokIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    fill="currentColor"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
  >
    <title>TikTok</title>
    <path
      d="M16.113 9.22a7.855 7.855 0 0 0 4.581 1.465V7.4c-.324 0-.646-.033-.962-.1v2.586a7.855 7.855 0 0 1-4.581-1.464v6.704A6.075 6.075 0 0 1 9.075 21.2a6.062 6.062 0 0 1-3.384-1.027 6.057 6.057 0 0 0 4.344 1.827 6.075 6.075 0 0 0 6.076-6.074V9.221zM17.3 5.904a4.581 4.581 0 0 1-1.187-2.68V2.8H15.2A4.6 4.6 0 0 0 17.3 5.906m-9.485 11.69a2.779 2.779 0 0 1 3.055-4.329V9.909a6.088 6.088 0 0 0-.962-.055v2.615a2.778 2.778 0 0 0-2.094 5.13z"
      fill="#FF004F"
    />
    <path
      d="M15.15 8.42a7.855 7.855 0 0 0 4.582 1.464V7.298A4.601 4.601 0 0 1 17.3 5.905a4.598 4.598 0 0 1-2.098-3.103h-2.395v13.122a2.779 2.779 0 0 1-4.992 1.672 2.777 2.777 0 0 1 1.25-5.26c.294 0 .578.046.844.13V9.853a6.075 6.075 0 0 0-4.216 10.319 6.045 6.045 0 0 0 3.383 1.026 6.075 6.075 0 0 0 6.076-6.073V8.419z"
      fill="#000"
    />
    <path
      d="M19.732 7.298v-.7c-.859 0-1.703-.24-2.432-.695a4.6 4.6 0 0 0 2.432 1.395M15.202 2.8a5.04 5.04 0 0 1-.051-.377V2h-3.306v13.123a2.779 2.779 0 0 1-4.03 2.472 2.779 2.779 0 0 0 4.992-1.672V2.8zM9.909 9.852v-.744A6.075 6.075 0 0 0 5.694 20.17a6.05 6.05 0 0 1-1.732-4.246 6.076 6.076 0 0 1 5.949-6.072z"
      fill="#00F2EA"
    />
  </svg>
);

const YouTubeIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    fill="currentColor"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
  >
    <title>YouTube</title>
    <path
      d="M19.287 18.847S13.824 19 12.003 19c-1.822 0-7.285-.153-7.285-.153a2.573 2.573 0 0 1-2.565-2.565S2 13.072 2 12c0-1.073.153-4.283.153-4.283a2.572 2.572 0 0 1 2.564-2.564S10.181 5 12.002 5c1.82 0 7.284.153 7.284.153a2.573 2.573 0 0 1 2.566 2.565s.152 3.207.152 4.282c0 1.075-.152 4.282-.152 4.282a2.573 2.573 0 0 1-2.566 2.566z"
      fill="red"
    />
    <path
      clipRule="evenodd"
      d="M10.087 15.128V8.872l5.054 3.127z"
      fill="#fff"
      fillRule="evenodd"
    />
  </svg>
);

const FacebookIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    fill="currentColor"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
  >
    <title>Facebook</title>
    <path
      d="M22 12.062C22 6.508 17.52 2 12 2S2 6.508 2 12.062c0 5.026 3.656 9.192 8.445 9.938v-7.036H7.89v-2.902h2.554V9.845c0-2.519 1.483-3.918 3.77-3.918 1.09 0 2.224.208 2.224.208V8.59h-1.257c-1.246 0-1.637.787-1.637 1.575v1.886h2.78l-.442 2.901h-2.338v7.037c4.8-.735 8.456-4.901 8.456-9.927"
      fill="#0866FF"
    />
    <path
      d="M10.445 22v-7.036H7.89v-2.902h2.554V9.845c0-2.519 1.483-3.918 3.77-3.918 1.09 0 2.224.208 2.224.208V8.59h-1.257c-1.246 0-1.637.787-1.637 1.575v1.886h2.78l-.442 2.901h-2.338v7.037l-3.1.01Z"
      fill="#fff"
    />
  </svg>
);

const LinkedInIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    fill="currentColor"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
  >
    <title>LinkedIn</title>
    <path
      d="M21 18.5a2.5 2.5 0 0 1-2.5 2.5h-13A2.5 2.5 0 0 1 3 18.5v-13A2.5 2.5 0 0 1 5.5 3h13A2.5 2.5 0 0 1 21 5.5z"
      fill="#0078D4"
    />
    <path
      d="M6 9.5h2.5V18H6zm1.242-1H7.23C6.482 8.5 6 7.944 6 7.25 6 6.54 6.497 6 7.257 6c.76 0 1.229.54 1.243 1.25 0 .694-.482 1.25-1.258 1.25M18 18h-2.5v-4.55c0-1.098-.613-1.848-1.596-1.848-.75 0-1.156.505-1.354.995-.072.175-.05.659-.05.903V18H10V9.5h2.5v1.308c.36-.558.925-1.308 2.369-1.308 1.789 0 3.13 1.125 3.13 3.637z"
      fill="#fff"
    />
  </svg>
);

const TwitterIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    fill="currentColor"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
  >
    <title>X (Twitter)</title>
    <path d="M17.768 2.999h3.055l-6.673 7.625L22 21h-6.145l-4.817-6.292-5.504 6.293h-3.06l7.136-8.158-7.526-9.845h6.301l4.35 5.751zm-1.073 16.176h1.692L7.464 4.73H5.646z" />
  </svg>
);

const SOCIAL_LINKS = [
  {
    name: "Instagram",
    icon: InstagramIcon,
    href: "https://www.instagram.com/thequillbot/",
  },
  {
    name: "TikTok",
    icon: TikTokIcon,
    href: "https://www.tiktok.com/@thequillbot",
  },
  {
    name: "YouTube",
    icon: YouTubeIcon,
    href: "https://www.youtube.com/@QuillBot",
  },
  {
    name: "Facebook",
    icon: FacebookIcon,
    href: "https://www.facebook.com/thequillbot/",
  },
  {
    name: "LinkedIn",
    icon: LinkedInIcon,
    href: "https://www.linkedin.com/company/quillbot/",
  },
  {
    name: "X (Twitter)",
    icon: TwitterIcon,
    href: "https://x.com/thequillbot",
  },
];

export function Footer() {
  const { setTheme, theme } = useTheme();
  const [isSystemMode, setIsSystemMode] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Set mounted state after component mounts to avoid hydration mismatch
  // Use setTimeout to avoid synchronous setState in effect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setMounted(true);
    }, 0);
    return () => clearTimeout(timeoutId);
  }, []);

  // Check if system mode is active on mount
  useEffect(() => {
    if (!mounted) {
      return;
    }
    const storedTheme = localStorage.getItem("theme");
    if (storedTheme === "system") {
      setTimeout(() => {
        setIsSystemMode(true);
        const isNight = getIsNightTime();
        setTheme(isNight ? "dark" : "light");
      }, 0);
    }
  }, [mounted, setTheme]);

  // Update theme based on time when system mode is active
  useEffect(() => {
    if (isSystemMode) {
      const checkTime = () => {
        const isNight = getIsNightTime();
        setTheme(isNight ? "dark" : "light");
      };

      checkTime();
      const interval = setInterval(checkTime, 60 * 1000);
      return () => clearInterval(interval);
    }
  }, [isSystemMode, setTheme]);

  // Reset system mode when user manually selects light or dark
  useEffect(() => {
    if (theme === "light" || theme === "dark") {
      const storedTheme = localStorage.getItem("theme");
      if (storedTheme !== "system") {
        setTimeout(() => {
          setIsSystemMode(false);
        }, 0);
      }
    }
  }, [theme]);

  // System button styling is handled inline in the JSX

  return (
    <footer className="mt-auto bg-black">
      <div className="bg-black py-4">
        <div className="container mx-auto px-4 md:px-6">
          {/* Navigation and Social Media Row */}
          <div className="flex flex-col items-center justify-between gap-4 pb-4 lg:flex-row">
            {/* Left Section: Logo and Navigation Links */}
            <div className="flex flex-col items-center gap-4 lg:flex-row lg:items-center lg:gap-6">
              {/* Logo */}
              <Link
                className="flex items-center space-x-2 font-semibold text-lg transition-opacity hover:opacity-80"
                href="/"
              >
                <TriangleLogo className="h-6 w-6 text-white" />
              </Link>

              {/* Navigation Links */}
              <nav className="flex flex-wrap items-center justify-center gap-4 text-sm text-white lg:justify-start">
                <Link
                  className="transition-colors hover:text-muted-foreground"
                  href="/"
                >
                  Home
                </Link>

                {/* Free Tools Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger className="flex items-center gap-1 text-white transition-colors hover:text-muted-foreground">
                    Free tools
                    <ChevronDown className="h-4 w-4" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    <DropdownMenuItem asChild>
                      <Link href="/free-tools">All Free Tools</Link>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                <Link
                  className="transition-colors hover:text-muted-foreground"
                  href="/faq"
                >
                  FAQ
                </Link>
                <Link
                  className="transition-colors hover:text-muted-foreground"
                  href="/become-an-affiliate"
                >
                  Become an Affiliate
                </Link>
                <Link
                  className="transition-colors hover:text-muted-foreground"
                  href="/api"
                >
                  API
                </Link>
                <Link
                  className="transition-colors hover:text-muted-foreground"
                  href="/contact"
                >
                  Contact
                </Link>

                {/* Legal Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger className="flex items-center gap-1 text-white transition-colors hover:text-muted-foreground">
                    Legal
                    <ChevronDown className="h-4 w-4" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    <DropdownMenuItem asChild>
                      <Link href="/legal/terms">Terms of Service</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/legal/privacy">Privacy Policy</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/legal/cookies">Cookie Policy</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/legal/refund">Refund Policy</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/legal/fair-usage">Fair Usage Policy</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/manage-cookies">Manage Cookies</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/sitemap">Sitemap</Link>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </nav>
            </div>

            {/* Right Section: Team Toggle, Theme Toggle, and Social Media Icons */}
            <div className="flex items-center gap-4">
              {/* Social Media Icons */}
              <div className="flex items-center gap-3">
                {SOCIAL_LINKS.map((social) => {
                  const IconComponent = social.icon;
                  return (
                    <a
                      aria-label={social.name}
                      className="text-white transition-opacity hover:opacity-80"
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
              {/* Theme Toggle */}
              <div className="flex items-center gap-1 rounded-md border border-gray-700 bg-gray-800 p-0.5">
                <button
                  className={`flex h-7 w-7 items-center justify-center rounded transition-colors ${
                    mounted && !isSystemMode && theme === "light"
                      ? "bg-gray-600"
                      : "hover:bg-gray-700/50"
                  }`}
                  onClick={() => {
                    setIsSystemMode(false);
                    setTheme("light");
                  }}
                  type="button"
                >
                  <Sun
                    className={`h-4 w-4 cursor-pointer ${
                      mounted && !isSystemMode && theme === "light"
                        ? "text-white"
                        : "text-gray-400"
                    }`}
                  />
                </button>
                <button
                  className={`flex h-7 w-7 items-center justify-center rounded transition-colors ${
                    mounted && !isSystemMode && theme === "dark"
                      ? "bg-gray-600"
                      : "hover:bg-gray-700/50"
                  }`}
                  onClick={() => {
                    setIsSystemMode(false);
                    setTheme("dark");
                  }}
                  type="button"
                >
                  <Moon
                    className={`h-4 w-4 cursor-pointer ${
                      mounted && !isSystemMode && theme === "dark"
                        ? "text-white"
                        : "text-gray-400"
                    }`}
                  />
                </button>
                <button
                  className={`flex h-7 w-7 items-center justify-center rounded transition-colors ${
                    isSystemMode ? "bg-gray-600" : "hover:bg-gray-700/50"
                  }`}
                  onClick={() => {
                    const isNight = getIsNightTime();
                    setIsSystemMode(true);
                    localStorage.setItem("theme", "system");
                    setTheme(isNight ? "dark" : "light");
                  }}
                  type="button"
                >
                  <Monitor
                    className={`h-4 w-4 cursor-pointer ${
                      isSystemMode ? "text-white" : "text-gray-400"
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
