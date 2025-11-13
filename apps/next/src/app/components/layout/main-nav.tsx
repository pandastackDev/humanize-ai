"use client";

import {
  BarChart3,
  BookOpen,
  Download,
  Eye,
  FileCheck,
  FileCode,
  FileQuestion,
  FileText,
  Hash,
  Image as ImageIcon,
  Instagram,
  Map as MapIcon,
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

const resources = [
  {
    title: "FAQ",
    href: "/faq",
    description:
      "Find answers to common questions about AISEO.ai, our technology, usage, and best practices.",
    icon: FileQuestion,
  },
  {
    title: "Roadmap",
    href: "/roadmap",
    description:
      "Stay updated with our forward vision, upcoming features, and the evolution journey of AISEO.ai.",
    icon: MapIcon,
  },
  {
    title: "Blog",
    href: "/blog",
    description:
      "Dive into insightful articles, stories, and updates from the world of AI-enhanced SEO and content creation.",
    icon: BookOpen,
  },
];

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
          "flex w-[340px] cursor-pointer gap-2 rounded-2xl bg-white px-6 py-[1.1rem] outline-none transition-colors hover:bg-[#F5F8FF]",
          description && "flex-col"
        )}
        href={href}
      >
        <div className="flex items-start gap-2">
          {Icon && <Icon className="mt-1 h-6 w-6 shrink-0" />}
          <div className="flex flex-col gap-1">
            <span className="font-bold text-base leading-none">{title}</span>
            {description && (
              <p className="text-slate-600 text-sm leading-snug">
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
        <NavigationMenuItem value="resources">
          <NavigationMenuTrigger value="resources">
            Resources
          </NavigationMenuTrigger>
          <NavigationMenuContent value="resources">
            <div className="rounded-3xl border-2 border-slate-100 bg-white px-8 py-7 shadow-xl">
              <div className="mb-4 w-fit font-bold text-base">
                AISEO.ai Resources
              </div>
              <ul className="flex flex-col gap-3">
                {resources.map((resource) => (
                  <ListItem
                    description={resource.description}
                    href={resource.href}
                    icon={resource.icon}
                    key={resource.title}
                    title={resource.title}
                  />
                ))}
              </ul>
            </div>
          </NavigationMenuContent>
        </NavigationMenuItem>

        <NavigationMenuItem value="free-tools">
          <NavigationMenuTrigger value="free-tools">
            Free Tools
          </NavigationMenuTrigger>
          <NavigationMenuContent value="free-tools">
            <div className="max-h-[85vh] overflow-y-auto rounded-3xl border-2 border-slate-100 bg-white px-8 py-7 shadow-xl">
              <div className="mb-4 font-bold text-base">Free Tools</div>
              <div className="flex gap-6">
                {Object.entries(freeTools).map(([category, tools]) => (
                  <div className="w-[200px]" key={category}>
                    <div className="mb-3 font-semibold text-slate-800 text-sm">
                      {category}
                    </div>
                    <ul className="list-none space-y-2">
                      {tools.map((tool) => (
                        <li key={tool.title}>
                          <NavigationMenuLink
                            className="block text-slate-600 text-sm hover:text-indigo-600"
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
