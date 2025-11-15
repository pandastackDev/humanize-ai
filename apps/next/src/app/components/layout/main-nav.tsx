"use client";

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
  Music,
  Search,
  Shield,
  Sparkles,
  TrendingUp,
  Type,
  Video,
  Wand2,
} from "lucide-react";
import type { ComponentPropsWithoutRef, ComponentType } from "react";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { cn } from "@/lib/utils";

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

function ListItem({
  title,
  href,
  description,
  icon: Icon,
  ...props
}: {
  title: string;
  href: string;
  description?: string;
  icon?: ComponentType<{ className?: string }>;
} & ComponentPropsWithoutRef<"li">) {
  return (
    <li {...props}>
      <NavigationMenuLink
        className={cn(
          "flex w-full min-w-[280px] max-w-[340px] scale-[0.98] transform cursor-pointer gap-2 rounded-2xl bg-white px-4 py-[1.1rem] outline-none transition-all duration-200 ease-in-out hover:scale-100 hover:bg-[#F5F8FF] active:scale-[0.95] sm:px-6",
          description && "flex-col"
        )}
        href={href}
      >
        <div className="flex items-start gap-2">
          {Icon && <Icon className="mt-1 h-5 w-5 shrink-0 sm:h-6 sm:w-6" />}
          <div className="flex flex-col gap-1">
            <span className="font-bold text-sm leading-none sm:text-base">
              {title}
            </span>
            {description && (
              <p className="text-slate-600 text-xs leading-snug sm:text-sm">
                {description}
              </p>
            )}
          </div>
        </div>
      </NavigationMenuLink>
    </li>
  );
}

export function MainNav() {
  return (
    <NavigationMenu>
      <NavigationMenuList className="flex-wrap gap-6">
        <NavigationMenuItem value="free-tools">
          <NavigationMenuTrigger value="free-tools">
            Free Tools
          </NavigationMenuTrigger>
          <NavigationMenuContent value="free-tools">
            <div className="max-h-[85vh] overflow-y-auto rounded-3xl border-2 border-slate-100 bg-white px-4 py-5 shadow-xl sm:px-8 sm:py-7">
              <div className="mb-4 font-bold text-sm sm:text-base">
                Free Tools
              </div>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:flex lg:gap-6">
                {Object.entries(freeTools).map(([category, tools]) => (
                  <div
                    className="w-full min-w-[160px] sm:w-[200px]"
                    key={category}
                  >
                    <div className="mb-3 font-semibold text-slate-800 text-xs sm:text-sm">
                      {category}
                    </div>
                    <ul className="list-none space-y-2">
                      {tools.map((tool) => (
                        <li key={tool.title}>
                          <NavigationMenuLink
                            className="block scale-[0.98] transform text-slate-600 text-xs transition-all duration-200 ease-in-out hover:scale-100 hover:text-indigo-600 active:scale-[0.95] sm:text-sm"
                            href={tool.href}
                          >
                            {tool.title}
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
          <NavigationMenuLink
            className={navigationMenuTriggerStyle}
            href="/pricing"
          >
            Pricing
          </NavigationMenuLink>
        </NavigationMenuItem>

        <NavigationMenuItem>
          <NavigationMenuLink
            className={navigationMenuTriggerStyle}
            href="/humanize"
          >
            Humanize AI
          </NavigationMenuLink>
        </NavigationMenuItem>

        <NavigationMenuItem>
          <NavigationMenuLink
            className={navigationMenuTriggerStyle}
            href="/affiliate"
          >
            Become an affiliate
          </NavigationMenuLink>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  );
}
