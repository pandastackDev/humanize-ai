"use client";

import { Button } from "@humanize/ui/components/button";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@humanize/ui/components/navigation-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@humanize/ui/components/sheet";
import {
  BarChart3,
  Download,
  Eye,
  FileCheck,
  FileCode,
  FileText,
  Hash,
  Image as ImageIcon,
  Instagram,
  Menu,
  Music,
  Search,
  Shield,
  Sparkles,
  TrendingUp,
  Type,
  Video,
  Wand2,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

const freeTools = {
  "YouTube Tools": [
    {
      title: "YouTube Video Downloader",
      href: "/tools/youtube-downloader",
      icon: Download,
    },
    { title: "YouTube to MP3", href: "/tools/youtube-mp3", icon: Music },
    {
      title: "YouTube Title Generator",
      href: "/tools/youtube-title",
      icon: Type,
    },
    {
      title: "YouTube Description Generator",
      href: "/tools/youtube-description",
      icon: FileText,
    },
    {
      title: "YouTube Hashtag Generator",
      href: "/tools/youtube-hashtag",
      icon: Hash,
    },
    {
      title: "YouTube Username Generator",
      href: "/tools/youtube-username",
      icon: Type,
    },
    {
      title: "YouTube Transcript Generator",
      href: "/tools/youtube-transcript",
      icon: FileText,
    },
    {
      title: "YouTube Thumbnail Downloader",
      href: "/tools/youtube-thumbnail",
      icon: Download,
    },
    {
      title: "YouTube Shorts Downloader",
      href: "/tools/youtube-shorts",
      icon: Video,
    },
  ],
  "Social & Image Tools": [
    {
      title: "TikTok Video Downloader",
      href: "/tools/tiktok-downloader",
      icon: Video,
    },
    {
      title: "Instagram Reels Downloader",
      href: "/tools/instagram-reels",
      icon: Instagram,
    },
    { title: "AI Image Generator", href: "/tools/ai-image", icon: ImageIcon },
    { title: "Ghibli Style", href: "/tools/ghibli-style", icon: Sparkles },
    {
      title: "Sora Watermark Remover",
      href: "/tools/sora-watermark",
      icon: Wand2,
    },
  ],
  "SEO Tools": [
    { title: "AI Grader", href: "/tools/ai-grader", icon: FileCheck },
    { title: "LLM Optimizer", href: "/tools/llm-optimizer", icon: TrendingUp },
    {
      title: "Generative Engine Optimization",
      href: "/tools/geo",
      icon: Search,
    },
    { title: "Answer Engine Optimization", href: "/tools/aeo", icon: Search },
    { title: "LLMs.txt Generator", href: "/tools/llms-txt", icon: FileCode },
    {
      title: "Keyword Rank Checker",
      href: "/tools/keyword-rank",
      icon: BarChart3,
    },
    {
      title: "Competitor Keywords",
      href: "/tools/competitor-keywords",
      icon: TrendingUp,
    },
    {
      title: "SEO Ranking Checker",
      href: "/tools/seo-ranking",
      icon: BarChart3,
    },
    {
      title: "Keyword Density Checker",
      href: "/tools/keyword-density",
      icon: BarChart3,
    },
    { title: "Plagiarism Checker", href: "/tools/plagiarism", icon: Shield },
    { title: "AI Detector", href: "/tools/ai-detector", icon: Eye },
  ],
};

export function MainNav() {
  const [isCompact, setIsCompact] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 1024px)");
    const updateMatch = () => setIsCompact(mediaQuery.matches);
    updateMatch();
    mediaQuery.addEventListener("change", updateMatch);

    return () => mediaQuery.removeEventListener("change", updateMatch);
  }, []);

  if (isCompact) {
    return <CompactNav />;
  }

  return (
    <NavigationMenu viewport={false}>
      <NavigationMenuList className="flex-wrap gap-4 xl:gap-6">
        <NavigationMenuItem value="free-tools">
          <NavigationMenuTrigger
            className="bg-transparent text-foreground hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground data-[state=open]:bg-accent/50 data-[state=open]:text-accent-foreground"
            value="free-tools"
          >
            Free Tools
          </NavigationMenuTrigger>
          <NavigationMenuContent className="!left-0 !top-full !mt-1.5 !w-auto !p-0 !bg-transparent !border-0 !shadow-none !rounded-none">
            <div className="max-h-[85vh] overflow-y-auto rounded-3xl border-2 border-border bg-card px-4 py-5 shadow-xl sm:px-8 sm:py-7">
              <div className="mb-4 font-bold text-card-foreground text-sm sm:text-base">
                Free Tools
              </div>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:flex lg:gap-6">
                {Object.entries(freeTools).map(([category, tools]) => (
                  <div
                    className="w-full min-w-[160px] sm:w-[200px]"
                    key={category}
                  >
                    <div className="mb-3 font-semibold text-card-foreground text-xs sm:text-sm">
                      {category}
                    </div>
                    <ul className="list-none space-y-2">
                      {tools.map((tool) => (
                        <li key={tool.title}>
                          <NavigationMenuLink asChild>
                            <Link
                              className="block scale-[0.98] transform text-muted-foreground text-xs transition-all duration-200 ease-in-out hover:scale-100 hover:text-primary active:scale-[0.95] sm:text-sm"
                              href={tool.href}
                            >
                              {tool.title}
                            </Link>
                          </NavigationMenuLink>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          </NavigationMenuContent>
        </NavigationMenuItem>

        <NavigationMenuItem>
          <NavigationMenuLink asChild>
            <Link
              className="inline-flex h-9 w-max items-center justify-center rounded-md bg-transparent px-4 py-2 font-medium text-foreground text-sm transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus-visible:outline-none"
              href="/faq"
            >
              FAQ
            </Link>
          </NavigationMenuLink>
        </NavigationMenuItem>

        <NavigationMenuItem>
          <NavigationMenuLink asChild>
            <Link
              className="inline-flex h-9 w-max items-center justify-center rounded-md bg-transparent px-4 py-2 font-medium text-foreground text-sm transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus-visible:outline-none"
              href="/affiliate"
            >
              Become an affiliate
            </Link>
          </NavigationMenuLink>
        </NavigationMenuItem>

        <NavigationMenuItem>
          <NavigationMenuLink asChild>
            <Link
              className="inline-flex h-9 w-max items-center justify-center rounded-md bg-transparent px-4 py-2 font-medium text-foreground text-sm transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus-visible:outline-none"
              href="/api"
            >
              API
            </Link>
          </NavigationMenuLink>
        </NavigationMenuItem>

        <NavigationMenuItem>
          <NavigationMenuLink asChild>
            <Link
              className="inline-flex h-9 w-max items-center justify-center rounded-md bg-transparent px-4 py-2 font-medium text-foreground text-sm transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus-visible:outline-none"
              href="/contact"
            >
              Contact
            </Link>
          </NavigationMenuLink>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  );
}

function CompactNav() {
  return (
    <div className="flex items-center gap-2 overflow-x-auto">
      <Sheet>
        <SheetTrigger asChild>
          <Button
            className="gap-2 whitespace-nowrap"
            size="sm"
            variant="outline"
          >
            <Menu className="h-4 w-4" />
            Browse tools
          </Button>
        </SheetTrigger>
        <SheetContent className="w-[90vw] max-w-md overflow-y-auto" side="left">
          <SheetHeader>
            <SheetTitle>Free Tools</SheetTitle>
          </SheetHeader>
          <div className="mt-6 flex flex-col gap-6">
            {Object.entries(freeTools).map(([category, tools]) => (
              <div key={category}>
                <div className="mb-2 font-semibold text-muted-foreground text-sm uppercase">
                  {category}
                </div>
                <div className="flex flex-col gap-2">
                  {tools.map((tool) => (
                    <Link
                      className="rounded-md px-3 py-1.5 text-muted-foreground text-sm transition-colors hover:bg-primary/10 hover:text-primary"
                      href={tool.href}
                      key={tool.title}
                    >
                      {tool.title}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </SheetContent>
      </Sheet>

      <Link
        className="rounded-md px-3 py-1.5 font-semibold text-muted-foreground text-sm transition-colors hover:bg-primary/10 hover:text-primary"
        href="/faq"
      >
        FAQ
      </Link>
      <Link
        className="rounded-md px-3 py-1.5 font-semibold text-muted-foreground text-sm transition-colors hover:bg-primary/10 hover:text-primary"
        href="/affiliate"
      >
        Become an affiliate
      </Link>
      <Link
        className="rounded-md px-3 py-1.5 font-semibold text-muted-foreground text-sm transition-colors hover:bg-primary/10 hover:text-primary"
        href="/api"
      >
        API
      </Link>
      <Link
        className="rounded-md px-3 py-1.5 font-semibold text-muted-foreground text-sm transition-colors hover:bg-primary/10 hover:text-primary"
        href="/contact"
      >
        Contact
      </Link>
    </div>
  );
}
