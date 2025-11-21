"use client";

import { Button } from "@humanize/ui/components/button";
import type { User } from "@workos-inc/node";
import { Menu } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { SignInButton } from "../sign-in-button";

export function MobileNav({ user }: { user: User | null }) {
  const [open, setOpen] = useState(false);

  return (
    <Sheet onOpenChange={setOpen} open={open}>
      <SheetTrigger asChild className="md:hidden">
        <Button className="h-9 w-9 p-0" size="icon" variant="ghost">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent
        className="w-[85vw] max-w-sm overflow-y-auto sm:w-[85vw]"
        side="right"
      >
        <SheetHeader>
          <SheetTitle className="sr-only">Navigation</SheetTitle>
        </SheetHeader>
        <div className="mt-6 flex flex-col gap-6">
          {!user && (
            <div className="sm:hidden">
              <SignInButton />
            </div>
          )}
          <MobileMainNav onLinkClick={() => setOpen(false)} />
        </div>
      </SheetContent>
    </Sheet>
  );
}

function MobileMainNav({ onLinkClick }: { onLinkClick: () => void }) {
  const [openFreeTools, setOpenFreeTools] = useState(false);

  const freeTools = {
    "YouTube Tools": [
      { title: "YouTube Video Downloader", href: "/tools/youtube-downloader" },
      { title: "YouTube to MP3", href: "/tools/youtube-mp3" },
      { title: "YouTube Title Generator", href: "/tools/youtube-title" },
      {
        title: "YouTube Description Generator",
        href: "/tools/youtube-description",
      },
      { title: "YouTube Hashtag Generator", href: "/tools/youtube-hashtag" },
      { title: "YouTube Username Generator", href: "/tools/youtube-username" },
      {
        title: "YouTube Transcript Generator",
        href: "/tools/youtube-transcript",
      },
      {
        title: "YouTube Thumbnail Downloader",
        href: "/tools/youtube-thumbnail",
      },
      { title: "YouTube Shorts Downloader", href: "/tools/youtube-shorts" },
    ],
    "Social & Image Tools": [
      { title: "TikTok Video Downloader", href: "/tools/tiktok-downloader" },
      { title: "Instagram Reels Downloader", href: "/tools/instagram-reels" },
      { title: "AI Image Generator", href: "/tools/ai-image" },
      { title: "Ghibli Style", href: "/tools/ghibli-style" },
      { title: "Sora Watermark Remover", href: "/tools/sora-watermark" },
    ],
    "SEO Tools": [
      { title: "AI Grader", href: "/tools/ai-grader" },
      { title: "LLM Optimizer", href: "/tools/llm-optimizer" },
      { title: "Generative Engine Optimization", href: "/tools/geo" },
      { title: "Answer Engine Optimization", href: "/tools/aeo" },
      { title: "LLMs.txt Generator", href: "/tools/llms-txt" },
      { title: "Keyword Rank Checker", href: "/tools/keyword-rank" },
      { title: "Competitor Keywords", href: "/tools/competitor-keywords" },
      { title: "SEO Ranking Checker", href: "/tools/seo-ranking" },
      { title: "Keyword Density Checker", href: "/tools/keyword-density" },
      { title: "Plagiarism Checker", href: "/tools/plagiarism" },
      { title: "AI Detector", href: "/tools/ai-detector" },
    ],
  };

  return (
    <nav className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <button
          className="flex scale-[0.98] transform items-center justify-between rounded-md px-3 py-2 text-left font-medium text-base transition-all duration-200 ease-in-out hover:scale-100 hover:bg-accent active:scale-[0.95]"
          onClick={() => setOpenFreeTools(!openFreeTools)}
          type="button"
        >
          Free Tools
          <span
            className={`transition-transform ${openFreeTools ? "rotate-180" : ""}`}
          >
            ▼
          </span>
        </button>
        {openFreeTools && (
          <div className="ml-4 flex max-h-[60vh] flex-col gap-4 overflow-y-auto border-l pl-4">
            {Object.entries(freeTools).map(([category, tools]) => (
              <div key={category}>
                <div className="mb-2 font-semibold text-sm">{category}</div>
                <div className="flex flex-col gap-1">
                  {tools.map((tool) => (
                    <Link
                      className="scale-[0.98] transform rounded-md px-3 py-1.5 text-muted-foreground text-sm transition-all duration-200 ease-in-out hover:scale-100 hover:bg-accent hover:text-foreground active:scale-[0.95]"
                      href={tool.href}
                      key={tool.title}
                      onClick={onLinkClick}
                    >
                      {tool.title}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Link
        className="scale-[0.98] transform rounded-md px-3 py-2 font-medium text-base transition-all duration-200 ease-in-out hover:scale-100 hover:bg-accent active:scale-[0.95]"
        href="/pricing"
        onClick={onLinkClick}
      >
        Pricing
      </Link>

      <Link
        className="scale-[0.98] transform rounded-md px-3 py-2 font-medium text-base transition-all duration-200 ease-in-out hover:scale-100 hover:bg-accent active:scale-[0.95]"
        href="/humanize"
        onClick={onLinkClick}
      >
        Humanize AI
      </Link>

      <Link
        className="scale-[0.98] transform rounded-md px-3 py-2 font-medium text-base transition-all duration-200 ease-in-out hover:scale-100 hover:bg-accent active:scale-[0.95]"
        href="/affiliate"
        onClick={onLinkClick}
      >
        Become an affiliate
      </Link>
    </nav>
  );
}
