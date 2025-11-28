"use client";

import { Button } from "@humanize/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@humanize/ui/components/dialog";
import { LoadingSpinner } from "@humanize/ui/components/loading-spinner";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@humanize/ui/components/select";
import { Tabs, TabsList, TabsTrigger } from "@humanize/ui/components/tabs";
import { Textarea } from "@humanize/ui/components/textarea";
import {
  BarChart3,
  Check,
  Clipboard,
  Clock,
  Copy,
  Download,
  FileCheck,
  FileText,
  FileUp,
  Info,
  Loader2,
  Pencil,
  Sparkles,
  Star,
  ThumbsDown,
  ThumbsUp,
  Trash2,
  X,
} from "lucide-react";
import mammoth from "mammoth";
import Image from "next/image";
import { useRouter } from "next/navigation";
import * as pdfjsLib from "pdfjs-dist";
import type React from "react";
import type { JSX } from "react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { type DetectResponse, detectAIContent } from "@/lib/detect-api";
import { humanizeText } from "@/lib/humanize-api";
import {
  checkSubscription,
  type SubscriptionPlan,
} from "@/lib/subscription-api";
import { type HistoryItem, HistorySidebar } from "./history-sidebar";
import { ProUpgradeSidebar } from "./pro-upgrade-sidebar";
import { TextDiffViewer } from "./text-diff-viewer";
import { TextFeaturesSidebar } from "./text-features-sidebar";

// import { TrustSidebar } from "./trust-sidebar";

const languages = [
  "English",
  "Chinese (Simplified)",
  "Hindi",
  "Spanish",
  "Arabic",
  "Bengali",
  "Portuguese",
  "Russian",
  "Urdu",
  "Indonesian",
  "French",
  "German",
  "Japanese",
  "Swahili",
  "Marathi",
  "Telugu",
  "Turkish",
  "Vietnamese",
  "Korean",
  "Tamil",
  "Italian",
  "Thai",
  "Gujarati",
  "Polish",
  "Ukrainian",
  "Persian",
  "Malayalam",
  "Chinese (Traditional)",
  "Afrikaans",
  "Albanian",
  "Bulgarian",
  "Catalan",
  "Croatian",
  "Czech",
  "Danish",
  "Dutch",
  "Estonian",
  "Tagalog",
  "Finnish",
  "Greek",
  "Hungarian",
  "Kannada",
  "Latvian",
  "Lithuanian",
  "Macedonian",
  "Nepali",
  "Norwegian",
  "Punjabi",
  "Romanian",
  "Slovak",
  "Slovenian",
  "Somali",
  "Swedish",
  "Welsh",
];

const languageFlags: Record<string, string> = {
  English: "🇬🇧",
  "Chinese (Simplified)": "🇨🇳",
  Hindi: "🇮🇳",
  Spanish: "🇪🇸",
  Arabic: "🇸🇦",
  Bengali: "🇧🇩",
  Portuguese: "🇵🇹",
  Russian: "🇷🇺",
  Urdu: "🇵🇰",
  Indonesian: "🇮🇩",
  French: "🇫🇷",
  German: "🇩🇪",
  Japanese: "🇯🇵",
  Swahili: "🇹🇿",
  Marathi: "🇮🇳",
  Telugu: "🇮🇳",
  Turkish: "🇹🇷",
  Vietnamese: "🇻🇳",
  Korean: "🇰🇷",
  Tamil: "🇮🇳",
  Italian: "🇮🇹",
  Thai: "🇹🇭",
  Gujarati: "🇮🇳",
  Polish: "🇵🇱",
  Ukrainian: "🇺🇦",
  Persian: "🇮🇷",
  Malayalam: "🇮🇳",
  "Chinese (Traditional)": "🇹🇼",
  Afrikaans: "🇿🇦",
  Albanian: "🇦🇱",
  Bulgarian: "🇧🇬",
  Catalan: "🇪🇸",
  Croatian: "🇭🇷",
  Czech: "🇨🇿",
  Danish: "🇩🇰",
  Dutch: "🇳🇱",
  Estonian: "🇪🇪",
  Tagalog: "🇵🇭",
  Finnish: "🇫🇮",
  Greek: "🇬🇷",
  Hungarian: "🇭🇺",
  Kannada: "🇮🇳",
  Latvian: "🇱🇻",
  Lithuanian: "🇱🇹",
  Macedonian: "🇲🇰",
  Nepali: "🇳🇵",
  Norwegian: "🇳🇴",
  Punjabi: "🇮🇳",
  Romanian: "🇷🇴",
  Slovak: "🇸🇰",
  Slovenian: "🇸🇮",
  Somali: "🇸🇴",
  Swedish: "🇸🇪",
  Welsh: "🏴", // Wales flag emoji
};

const readabilityLevels = [
  { value: "university", label: "University" },
  { value: "high-school", label: "High School" },
  { value: "doctorate", label: "Doctorate", pro: true },
  { value: "journalist", label: "Journalist", pro: true },
  { value: "marketing", label: "Marketing", pro: true },
];

const purposes = [
  { value: "academic", label: "Academic" },
  { value: "general", label: "General Writing" },
  { value: "essay", label: "Essay" },
  { value: "article", label: "Article", pro: true },
  { value: "marketing", label: "Marketing Material", pro: true },
  { value: "story", label: "Story", pro: true },
  { value: "cover-letter", label: "Cover Letter", pro: true },
  { value: "report", label: "Report", pro: true },
  { value: "business", label: "Business Material", pro: true },
  { value: "legal", label: "Legal Material", pro: true },
];

const lengthModes = [
  { value: "standard", label: "Keep it as is" },
  { value: "shorten", label: "Make it shorter" },
  { value: "expand", label: "Make it longer" },
];

const WORD_COUNT_REGEX = /\s+/;

// AI detectors for loading screen
const AI_DETECTORS = [
  {
    name: "Turnitin",
    image: "/logos/humanization-logos/turnitin.png",
  },
  {
    name: "GPTZero",
    image: "/logos/humanization-logos/gptzero.png",
  },
  {
    name: "Copyleaks",
    image: "/logos/humanization-logos/copyleaks.png",
  },
  {
    name: "ZeroGPT",
    image: "/logos/humanization-logos/zerogpt.png",
  },
  {
    name: "Quillbot",
    image: "/logos/humanization-logos/quillbot.png",
  },
  {
    name: "Writer",
    image: "/logos/humanization-logos/writer.png",
  },
  {
    name: "Sapling",
    image: "/logos/humanization-logos/sapling.png",
  },
  {
    name: "Originality",
    image: "/logos/humanization-logos/originality.png",
  },
];

// Icons for readability levels
const readabilityIcons: Record<string, JSX.Element> = {
  university: (
    <svg
      className="h-5 w-5 text-[var(--color-brand-primary)]"
      fill="none"
      viewBox="0 0 20 20"
      xmlns="http://www.w3.org/2000/svg"
    >
      <title>University readability</title>
      <path
        d="M5.83427 8.75L5.83337 13.3333L10 15.4167L14.1658 13.3333V8.75"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path
        d="M16.6449 7.49604L9.94946 10.8498L1.67122 6.67451C1.66509 6.67143 1.6651 6.66261 1.67122 6.65954L9.94946 2.49921L18.3303 6.65944C18.3365 6.66252 18.3365 6.67145 18.3302 6.67449L16.6449 7.49604ZM16.6449 7.49604V14.1858M16.6449 14.1858L14.9876 17.4887C14.9849 17.4943 14.9889 17.5009 14.995 17.5009H18.2388C18.245 17.5009 18.249 17.4944 18.2463 17.4888L16.6449 14.1858Z"
        stroke="currentColor"
        strokeWidth="1.5"
      />
    </svg>
  ),
  "high-school": (
    <svg
      className="h-5 w-5 text-[var(--color-brand-primary)]"
      fill="none"
      viewBox="0 0 20 20"
      xmlns="http://www.w3.org/2000/svg"
    >
      <title>High school readability</title>
      <path d="M14.9631 9.18384H5" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M9.98047 9.18378V18.3715"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
      <path
        d="M7.90527 5.00732H12.0566"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
      <path
        d="M5.05212 18.3654V9.11161L9.96871 1.70702C9.97204 1.7021 9.97921 1.70206 9.98254 1.70696L14.9982 9.11161V18.3654"
        stroke="currentColor"
        strokeWidth="1.5"
      />
    </svg>
  ),
  doctorate: (
    <svg
      className="h-5 w-5 text-[var(--color-brand-primary)]"
      fill="none"
      viewBox="0 0 20 20"
      xmlns="http://www.w3.org/2000/svg"
    >
      <title>Doctorate readability</title>
      <path
        d="M8.75004 18.3334H2.08337L2.08352 1.66669H16.25V9.16669"
        stroke="currentColor"
        strokeLinecap="square"
        strokeWidth="1.25"
      />
      <path
        d="M5.83337 5.83331H12.5M5.83337 9.99998H12.5"
        stroke="currentColor"
        strokeLinecap="square"
        strokeWidth="1.25"
      />
      <path
        d="M11.25 16.6667V18.3334H12.9167L17.9167 13.3334L16.25 11.6667L11.25 16.6667Z"
        stroke="currentColor"
        strokeLinecap="square"
        strokeWidth="1.25"
      />
    </svg>
  ),
  journalist: (
    <svg
      className="h-4 w-4 text-[var(--color-brand-primary)]"
      fill="none"
      viewBox="0 0 18 18"
      xmlns="http://www.w3.org/2000/svg"
    >
      <title>Journalist readability</title>
      <path
        d="M13.5 6V2.25H1.5V15.75H15"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
      <path
        d="M4.125 6H10.875M4.125 9H10.875M4.125 12H7.5"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
      <path
        d="M13.5 6H16.5V14.25C16.5 15.0784 15.8284 15.75 15 15.75C14.1716 15.75 13.5 15.0784 13.5 14.25V6Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
    </svg>
  ),
  marketing: (
    <svg
      className="h-4 w-4 text-[var(--color-brand-primary)]"
      fill="none"
      viewBox="0 0 18 18"
      xmlns="http://www.w3.org/2000/svg"
    >
      <title>Marketing readability</title>
      <g clipPath="url(#clip0_readability_marketing)">
        <path
          d="M12.7491 9C12.7491 11.071 11.0701 12.75 8.99905 12.75C6.92796 12.75 5.24902 11.071 5.24902 9C5.24902 6.92893 6.92796 5.25 8.99905 5.25"
          stroke="currentColor"
          strokeLinejoin="round"
          strokeWidth="1.5"
        />
        <path
          d="M10.4991 1.65003C10.0144 1.55165 9.51273 1.5 8.99905 1.5C4.85689 1.5 1.49902 4.85786 1.49902 9C1.49902 13.1421 4.85689 16.5 8.99905 16.5C13.1412 16.5 16.4991 13.1421 16.4991 9C16.4991 8.48633 16.4474 7.98465 16.3491 7.5"
          stroke="currentColor"
          strokeLinejoin="round"
          strokeWidth="1.5"
        />
        <path
          d="M12.002 5.99065V3.75351L14.2286 1.53394C14.2329 1.52972 14.2401 1.53189 14.2413 1.53773L14.6152 3.3549C14.6158 3.35782 14.618 3.36012 14.621 3.36073L16.4873 3.75078C16.4931 3.752 16.4952 3.75925 16.491 3.76345L14.2407 5.98848C14.2393 5.98987 14.2374 5.99065 14.2355 5.99065H12.002ZM12.002 5.99065L8.99048 9.00108"
          stroke="currentColor"
          strokeWidth="1.5"
        />
      </g>
      <defs>
        <clipPath id="clip0_readability_marketing">
          <rect fill="white" height="18" width="18" />
        </clipPath>
      </defs>
    </svg>
  ),
};

// Icons for purposes
const purposeIcons: Record<string, JSX.Element> = {
  academic: (
    <svg
      className="h-5 w-5 text-[var(--color-brand-primary)]"
      fill="none"
      viewBox="0 0 20 20"
      xmlns="http://www.w3.org/2000/svg"
    >
      <title>Academic purpose</title>
      <path
        d="M6.65723 3.33899V6.68436"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
      <path
        d="M15.0457 18.3844H6.4355C4.55474 18.4376 3.5262 17.8998 3.29675 16.366M15.0457 18.3844H16.5997M15.0457 18.3844V14.1468M3.29675 16.366C3.29687 15.7533 3.27096 15.0002 3.29677 14.4605V6.30064C3.16234 4.28152 4.03543 3.09968 5.53632 2.9489H13.1981C13.6741 2.9489 14.1445 2.8468 14.5778 2.64945L16.6074 1.72525C16.6129 1.72273 16.6192 1.72678 16.6192 1.73285V14.1468H15.0457M3.29675 16.366C3.35819 15.0135 4.13408 14.054 6.41099 14.1389L15.0457 14.1468"
        stroke="currentColor"
        strokeWidth="1.5"
      />
    </svg>
  ),
  general: (
    <svg
      className="h-5 w-5 text-[var(--color-brand-primary)]"
      fill="none"
      viewBox="0 0 20 20"
      xmlns="http://www.w3.org/2000/svg"
    >
      <title>General writing purpose</title>
      <path
        d="M10.0432 9.16669H6.73022"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
      <path
        d="M12.5279 5.83331H6.73022"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
      <path
        d="M17.1158 17.7782V1.75008C17.1158 1.70402 17.0785 1.66669 17.0325 1.66669H3.03085C2.98483 1.66669 2.94751 1.70402 2.94751 1.75008V17.8059C2.94751 17.8682 3.01338 17.9085 3.06884 17.8801L6.25893 16.2455L9.99558 18.3229C10.0207 18.3368 10.0512 18.3369 10.0763 18.3229L13.8381 16.2455L16.9947 17.8525C17.0501 17.8808 17.1158 17.8404 17.1158 17.7782Z"
        stroke="currentColor"
        strokeWidth="1.5"
      />
    </svg>
  ),
  essay: (
    <svg
      className="h-5 w-5 text-[var(--color-brand-primary)]"
      fill="none"
      viewBox="0 0 20 20"
      xmlns="http://www.w3.org/2000/svg"
    >
      <title>Essay purpose</title>
      <path
        d="M13.3469 10.8464H6.67163"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
      <path
        d="M10.0092 14.1846H6.67163"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
      <path
        d="M17.0932 1.67645H5.52855C4.49269 1.67645 2.79515 2.42064 2.9403 4.3937M2.9403 4.3937C3.08545 6.36677 4.73693 6.68885 5.52855 6.68885H14.595M2.9403 4.3937V15.4701C2.84428 16.3569 3.20391 18.2053 5.48633 18.3472H17.0707V6.68885H14.595M14.595 6.68885V4.17305C14.595 4.16845 14.5912 4.16472 14.5867 4.16472H5.42388"
        stroke="currentColor"
        strokeWidth="1.5"
      />
    </svg>
  ),
  article: (
    <svg
      className="h-5 w-5 text-[var(--color-brand-primary)]"
      fill="none"
      viewBox="0 0 20 20"
      xmlns="http://www.w3.org/2000/svg"
    >
      <title>Article purpose</title>
      <path
        d="M17.0834 18.3334V1.66669H2.91689L2.91675 18.3334H17.0834Z"
        stroke="currentColor"
        strokeLinecap="square"
        strokeWidth="1.5"
      />
      <path
        d="M6.66675 5.83331H13.3334M6.66675 9.99998H13.3334M6.66675 14.1666H10.0001"
        stroke="currentColor"
        strokeLinecap="square"
        strokeWidth="1.5"
      />
    </svg>
  ),
  marketing: (
    <svg
      className="h-5 w-5 text-[var(--color-brand-primary)]"
      fill="none"
      viewBox="0 0 20 20"
      xmlns="http://www.w3.org/2000/svg"
    >
      <title>Marketing material purpose</title>
      <g clipPath="url(#clip0_purpose_marketingMaterial)">
        <path
          d="M10.0001 14.1667C11.841 14.1667 13.3334 12.6743 13.3334 10.8333C13.3334 8.99238 11.841 7.5 10.0001 7.5C8.15913 7.5 6.66675 8.99238 6.66675 10.8333C6.66675 12.6743 8.15913 14.1667 10.0001 14.1667Z"
          stroke="currentColor"
          strokeLinejoin="round"
          strokeWidth="1.5"
        />
        <path
          d="M9.99992 5.00002C10.9204 5.00002 11.6666 4.25383 11.6666 3.33335C11.6666 2.41288 10.9204 1.66669 9.99992 1.66669C9.07944 1.66669 8.33325 2.41288 8.33325 3.33335C8.33325 4.25383 9.07944 5.00002 9.99992 5.00002Z"
          stroke="currentColor"
          strokeLinejoin="round"
          strokeWidth="1.5"
        />
        <path
          d="M3.33341 18.3333C4.25389 18.3333 5.00008 17.5871 5.00008 16.6667C5.00008 15.7462 4.25389 15 3.33341 15C2.41294 15 1.66675 15.7462 1.66675 16.6667C1.66675 17.5871 2.41294 18.3333 3.33341 18.3333Z"
          stroke="currentColor"
          strokeLinejoin="round"
          strokeWidth="1.5"
        />
        <path
          d="M16.6667 18.3333C17.5871 18.3333 18.3333 17.5871 18.3333 16.6667C18.3333 15.7462 17.5871 15 16.6667 15C15.7462 15 15 15.7462 15 16.6667C15 17.5871 15.7462 18.3333 16.6667 18.3333Z"
          stroke="currentColor"
          strokeLinejoin="round"
          strokeWidth="1.5"
        />
        <path
          d="M9.99992 7.5V5M15.4166 15.4167L12.4999 13.3333M4.58325 15.4167L7.49992 13.3333"
          stroke="currentColor"
          strokeLinejoin="round"
          strokeWidth="1.5"
        />
      </g>
      <defs>
        <clipPath id="clip0_purpose_marketingMaterial">
          <rect fill="white" height="20" width="20" />
        </clipPath>
      </defs>
    </svg>
  ),
  story: (
    <svg
      className="h-5 w-5 text-[var(--color-brand-primary)]"
      fill="none"
      viewBox="0 0 20 20"
      xmlns="http://www.w3.org/2000/svg"
    >
      <title>Story purpose</title>
      <path
        d="M13.316 5.83087H6.66016"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
      <path
        d="M9.98808 9.1618H6.66016"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
      <path
        d="M15.3976 18.3242H6.25294C4.25547 18.3871 3.1631 17.7519 2.9194 15.9402M15.3976 18.3242H17.0479M15.3976 18.3242V13.3192M2.9194 15.9402C2.91953 15.2166 2.89202 14.3271 2.91943 13.6898L2.91939 5.1216C2.77662 2.7368 3.72662 1.83915 5.32067 1.66107L17.0687 1.66095V13.3192H15.3976M2.9194 15.9402C2.98466 14.3429 3.8087 13.2097 6.22692 13.3099L15.3976 13.3192"
        stroke="currentColor"
        strokeWidth="1.5"
      />
    </svg>
  ),
  "cover-letter": (
    <svg
      className="h-5 w-5 text-[var(--color-brand-primary)]"
      fill="none"
      viewBox="0 0 20 20"
      xmlns="http://www.w3.org/2000/svg"
    >
      <title>Cover letter purpose</title>
      <g clipPath="url(#clip0_purpose_coverLetter)">
        <path
          d="M1.66675 8.28818L10.0001 12.842L18.3334 8.28818"
          stroke="currentColor"
          strokeWidth="1.5"
        />
        <path
          d="M4.16675 9.94427V1.66669H15.8334V9.94427"
          stroke="currentColor"
          strokeWidth="1.5"
        />
        <path
          d="M7.5 8.28895H12.5M7.5 4.97791H12.5"
          stroke="currentColor"
          strokeLinejoin="round"
          strokeWidth="1.5"
        />
        <path
          d="M15.7563 5.80566L18.3282 8.37583L18.3066 18.3227C18.3066 18.3272 18.3029 18.3309 18.2982 18.3309H1.67508C1.67048 18.3309 1.66675 18.3272 1.66675 18.3227V8.38916L4.1933 5.84148"
          stroke="currentColor"
          strokeWidth="1.5"
        />
      </g>
      <defs>
        <clipPath id="clip0_purpose_coverLetter">
          <rect fill="white" height="20" width="20" />
        </clipPath>
      </defs>
    </svg>
  ),
  report: (
    <svg
      className="h-5 w-5 text-[var(--color-brand-primary)]"
      fill="none"
      viewBox="0 0 20 20"
      xmlns="http://www.w3.org/2000/svg"
    >
      <title>Report purpose</title>
      <path
        d="M5.83325 14.1667V10.8333"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
      <path
        d="M10 14.1667V5.83334"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
      <path
        d="M14.1667 14.1667V9.16666"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
      <path
        d="M17.5 2.5V17.5H2.5V2.5H17.5Z"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
    </svg>
  ),
  business: (
    <svg
      className="h-5 w-5 text-[var(--color-brand-primary)]"
      fill="none"
      viewBox="0 0 20 20"
      xmlns="http://www.w3.org/2000/svg"
    >
      <title>Business material purpose</title>
      <path
        d="M11.6454 10H8.32324V11.6667C8.32324 12.5872 9.06692 13.3333 9.98433 13.3333C10.9018 13.3333 11.6454 12.5872 11.6454 11.6667V10Z"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
      <path
        d="M2.9248 10V17.9167H17.0442V10"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
      <path
        d="M12.9179 5.00001V2.08334H7.104V5.00001"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
      <path
        d="M8.35375 11.6755H5.0156L2.08179 9.1575V5.05228C2.08179 5.04768 2.0855 5.04395 2.09009 5.04395H17.9101C17.9147 5.04395 17.9184 5.04768 17.9184 5.05228V9.11667L14.9427 11.6755H11.6256"
        stroke="currentColor"
        strokeWidth="1.5"
      />
    </svg>
  ),
  legal: (
    <svg
      className="h-5 w-5 text-[var(--color-brand-primary)]"
      fill="none"
      viewBox="0 0 20 20"
      xmlns="http://www.w3.org/2000/svg"
    >
      <title>Legal material purpose</title>
      <path
        d="M2.5 1.66666V18.3333H17.5V1.66666H2.5Z"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
      <path
        d="M2.5 1.66666L5.83333 5.83332H14.1667L17.5 1.66666"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path
        d="M9.58242 12.4998L6.66577 15.4166M9.99925 8.74948L13.3328 12.0831L11.2494 14.1666L7.91577 10.833L9.99925 8.74948Z"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
    </svg>
  ),
};
// Shared marketing content (ratings, detectors, trust metrics)
function MarketingInner() {
  return (
    <>
      {/* Rating Card */}
      <div className="w-full rounded-lg border border-border bg-card p-2.5 shadow-sm dark:border-[var(--color-editor-border)] dark:bg-[var(--color-editor-bg)]/50">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map((starNum) => (
              <Star
                className="h-4 w-4 fill-[var(--color-brand-primary)] text-[var(--color-brand-primary)]"
                key={`rating-star-${starNum}`}
              />
            ))}
          </div>
          <div className="flex flex-col">
            <p className="font-bold text-card-foreground text-sm">4.8/5</p>
            <p className="text-muted-foreground text-xs dark:text-muted-foreground">
              128,743 reviews
            </p>
          </div>
        </div>
      </div>

      {/* AI Detector Bypass Section */}
      <div className="w-full rounded-lg border border-white bg-card p-3 shadow-sm dark:border-[var(--color-editor-border)] dark:bg-[var(--color-editor-bg)]/50">
        <h3 className="mb-2 font-semibold text-card-foreground text-xs">
          AI Humanizer can bypass these AI detectors
        </h3>
        <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
          {AI_DETECTORS.map((detector) => (
            <div
              className="flex items-center gap-1.5 rounded-md border border-border bg-muted p-1.5 transition-all hover:border-[var(--color-brand-primary)]/30 hover:bg-[var(--color-brand-primary)]/5 dark:border-[var(--color-editor-border)] dark:bg-[var(--color-editor-bg)] dark:hover:border-[var(--color-brand-primary)]/50 dark:hover:bg-[var(--color-brand-primary)]/10"
              key={detector.name}
            >
              <div className="relative flex h-4 w-4 shrink-0 items-center justify-center">
                <Image
                  alt={detector.name}
                  className="object-contain"
                  height={16}
                  src={detector.image}
                  width={16}
                />
              </div>
              <span className="font-medium text-muted-foreground text-xs dark:text-muted-foreground">
                {detector.name}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Trust Metrics */}
      <div className="w-full space-y-2">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <div className="flex items-center gap-2 rounded-lg border border-[var(--color-brand-primary)]/20 bg-gradient-to-br from-[var(--color-brand-primary)]/10 to-[var(--color-brand-primary)]/5 p-2.5 shadow-sm dark:border-[var(--color-brand-primary)]/30 dark:from-[var(--color-brand-primary)]/20 dark:to-[var(--color-brand-primary)]/10">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-[var(--color-brand-primary)] bg-[var(--color-brand-primary)]/20 dark:bg-[var(--color-brand-primary)]/30">
              <Check className="h-3.5 w-3.5 text-[var(--color-brand-primary)]" />
            </div>
            <div>
              <p className="font-bold text-[var(--color-brand-primary)] text-xs">
                12 Million+
              </p>
              <p className="text-muted-foreground text-xs dark:text-muted-foreground">
                Trusted Users
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-lg border border-[var(--color-brand-primary)]/20 bg-gradient-to-br from-[var(--color-brand-primary)]/10 to-[var(--color-brand-primary)]/5 p-2.5 shadow-sm dark:border-[var(--color-brand-primary)]/30 dark:from-[var(--color-brand-primary)]/20 dark:to-[var(--color-brand-primary)]/10">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--color-brand-primary)]/20 dark:bg-[var(--color-brand-primary)]/30">
              <FileText className="h-3.5 w-3.5 text-[var(--color-brand-primary)]" />
            </div>
            <div>
              <p className="font-bold text-[var(--color-brand-primary)] text-xs">
                1.46 Billion+
              </p>
              <p className="text-muted-foreground text-xs dark:text-muted-foreground">
                Words Monthly
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          {/* Success Rate */}
          <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-gradient-to-br from-green-50 to-green-50/50 px-3 py-1.5 shadow-sm dark:border-green-900/50 dark:from-green-950/30 dark:to-green-950/10">
            <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/50">
              <Check className="h-3 w-3 text-green-600 dark:text-green-400" />
            </div>
            <p className="font-bold text-green-700 text-xs dark:text-green-400">
              99.54% Success Rate
            </p>
          </div>

          {/* Trustpilot Reviews */}
          <div className="flex flex-1 items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 shadow-sm dark:border-[var(--color-editor-border)] dark:bg-[var(--color-editor-bg)]/50">
            <Image
              alt="4.5 stars on Trustpilot"
              className="h-3.5 w-auto"
              height={14}
              src="https://cdn.trustpilot.net/brand-assets/4.1.0/stars/stars-4.5.svg"
              unoptimized
              width={70}
            />
            <span className="flex items-center gap-1 text-muted-foreground text-xs dark:text-muted-foreground">
              <span className="font-medium">5,936 reviews on</span>
              <Image
                alt="Trustpilot"
                className="h-3 w-3"
                height={12}
                src="/logos/trustpilot-star.png"
                width={12}
              />
              <span className="font-semibold">Trustpilot</span>
            </span>
          </div>
        </div>
      </div>
    </>
  );
}

function getLanguageCode(languageName: string): string {
  const languageMap: Record<string, string> = {
    English: "en",
    Spanish: "es",
    French: "fr",
    German: "de",
    Bulgarian: "bg",
    Czech: "cs",
    Danish: "da",
    Greek: "el",
    Estonian: "et",
    Finnish: "fi",
    Hungarian: "hu",
    Italian: "it",
    Japanese: "ja",
    Latvian: "lv",
    Dutch: "nl",
    Polish: "pl",
    Portuguese: "pt",
    "Brazilian (Pr)": "pt-BR",
    Romanian: "ro",
    Russian: "ru",
    Slovak: "sk",
    Slovenian: "sl",
    Swedish: "sv",
    Chinese: "zh",
  };
  return languageMap[languageName] || "en";
}

// Get detector-specific styles using CSS variables
function getDetectorStyles(detectorName: string): {
  bgColor: string;
  borderColor: string;
  textColor: string;
} {
  const name = detectorName.toLowerCase();

  // Use CSS variables instead of hardcoded colors
  if (
    name.includes("gptzero") ||
    name.includes("zerogpt") ||
    name.includes("copyleaks")
  ) {
    return {
      bgColor: "var(--color-detector-blue-bg)",
      borderColor: "var(--color-detector-blue-border)",
      textColor: "var(--color-detector-blue-text)",
    };
  }
  if (name.includes("smodin")) {
    return {
      bgColor: "var(--color-detector-red-bg)",
      borderColor: "var(--color-detector-red-border)",
      textColor: "var(--color-detector-red-text)",
    };
  }
  if (name.includes("quillbot")) {
    return {
      bgColor: "var(--color-detector-green-bg)",
      borderColor: "var(--color-detector-green-border)",
      textColor: "var(--color-detector-green-text)",
    };
  }
  if (name.includes("scribbr")) {
    return {
      bgColor: "var(--color-detector-orange-bg)",
      borderColor: "var(--color-detector-orange-border)",
      textColor: "var(--color-detector-orange-text)",
    };
  }

  // Default detector style
  return {
    bgColor: "var(--color-detector-default-bg)",
    borderColor: "var(--color-detector-default-border)",
    textColor: "var(--color-detector-default-text)",
  };
}

// Example text for "Try example" button
const EXAMPLE_TEXT = `The seaside town was a picturesque blend of old-world charm and modern amenities. Waves crashed gently against the shore, their rhythmic sound providing a soothing backdrop to the bustling boardwalk. Colorful fishing boats bobbed in the harbor, their nets filled with the day's catch. Tourists strolled along the promenade, enjoying the salty sea breeze and the vibrant atmosphere.`;

// History storage key
const HISTORY_STORAGE_KEY = "humanize_history";

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Component handles multiple UI states and interactions
export function HumanizeEditor({
  userId,
  organizationId,
}: {
  userId?: string;
  organizationId?: string;
}) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [inputText, setInputText] = useState("");
  const [outputText, setOutputText] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState("");
  const [readabilityLevel, setReadabilityLevel] = useState("");
  const [purpose, setPurpose] = useState("");
  const [lengthMode, setLengthMode] = useState<
    "shorten" | "expand" | "standard"
  >("standard");
  const [styleSample, setStyleSample] = useState("");
  const [tempStyleSample, setTempStyleSample] = useState("");
  const [styleSampleError, setStyleSampleError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isParsingFile, setIsParsingFile] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("humanize");
  const [showStyleSampleModal, setShowStyleSampleModal] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showProUpgrade, setShowProUpgrade] = useState(false);
  const [humanScore, setHumanScore] = useState<number | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [subscriptionPlan, setSubscriptionPlan] =
    useState<SubscriptionPlan>("free");
  const [hasInteracted, setHasInteracted] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isDragOverValid, setIsDragOverValid] = useState(false);
  const [enabledFeatures, setEnabledFeatures] = useState({
    changed: true,
    structural: true,
    unchanged: true, // Toggleable - can be shown/hidden
    thesaurus: false, // Always false - not toggleable
  });
  const [presentFeatures, setPresentFeatures] = useState({
    changed: false,
    structural: false,
    unchanged: false,
    thesaurus: false,
  });

  // AI Detection state
  const [detectionResult, setDetectionResult] = useState<DetectResponse | null>(
    null
  );
  const [isDetecting, setIsDetecting] = useState(false);
  const [detectionError, setDetectionError] = useState<string | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Detect dark mode
  useEffect(() => {
    const checkDarkMode = () => {
      setIsDarkMode(
        document.documentElement.classList.contains("dark") ||
          window.matchMedia("(prefers-color-scheme: dark)").matches
      );
    };

    checkDarkMode();

    // Watch for changes
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    mediaQuery.addEventListener("change", checkDarkMode);

    return () => {
      observer.disconnect();
      mediaQuery.removeEventListener("change", checkDarkMode);
    };
  }, []);

  // Fetch subscription status on mount
  useEffect(() => {
    async function fetchSubscription() {
      if (!userId) {
        return;
      }

      // Only run on client side
      if (typeof window === "undefined") {
        return;
      }

      try {
        const subscriptionInfo = await checkSubscription(
          userId,
          organizationId
        );
        setSubscriptionPlan(subscriptionInfo.plan);
      } catch {
        // Silently default to free plan on error (error is already handled in checkSubscription)
        setSubscriptionPlan("free");
      }
    }

    fetchSubscription();
  }, [userId, organizationId]);

  // Load history from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(HISTORY_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Convert timestamp strings back to Date objects
        const historyWithDates = parsed.map((item: HistoryItem) => ({
          ...item,
          timestamp: new Date(item.timestamp),
        }));
        setHistory(historyWithDates);
      }
    } catch (err) {
      console.error("Failed to load history:", err);
    }
  }, []);

  // Save history to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(history));
    } catch (err) {
      console.error("Failed to save history:", err);
    }
  }, [history]);

  const wordCount = inputText
    .trim()
    .split(WORD_COUNT_REGEX)
    .filter(Boolean).length;
  const outputWordCount = outputText
    .trim()
    .split(WORD_COUNT_REGEX)
    .filter(Boolean).length;

  // Get word limit based on subscription plan
  console.log("subscriptionPlan", subscriptionPlan);
  // const wordLimit = WORD_LIMITS[subscriptionPlan];
  const wordLimit = 3000;

  const isOverLimit = wordCount > wordLimit;
  const hasStyleSample = styleSample.trim().length > 0;

  // Handle paste from clipboard
  const handlePasteText = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setInputText(text);
    } catch (err) {
      console.error("Failed to read clipboard:", err);
    }
  };

  // Handle try example
  const handleTryExample = () => {
    setInputText(EXAMPLE_TEXT);
  };

  // Handle file upload
  const handleFileUpload = () => {
    // Clear any existing error when user clicks upload button
    setError(null);
    // Reset the file input to allow selecting the same file again
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    fileInputRef.current?.click();
  };

  // Helper function to check file type
  const getFileType = (
    file: File
  ): "pdf" | "docx" | "doc" | "txt" | "unknown" => {
    const extensionTypeMap: Record<string, "pdf" | "docx" | "doc" | "txt"> = {
      ".pdf": "pdf",
      ".docx": "docx",
      ".doc": "doc",
      ".txt": "txt",
    };
    const mimeTypeMap: Record<string, "pdf" | "docx" | "doc" | "txt"> = {
      "application/pdf": "pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
        "docx",
      "application/msword": "doc",
      "text/plain": "txt",
    };

    const fileName = file.name.toLowerCase();
    for (const [extension, type] of Object.entries(extensionTypeMap)) {
      if (fileName.endsWith(extension)) {
        return type;
      }
    }

    const mimeMatch = mimeTypeMap[file.type];
    if (mimeMatch) {
      return mimeMatch;
    }

    return "unknown";
  };

  // Helper function to parse PDF
  const parsePdf = async (file: File): Promise<string> => {
    if (typeof window !== "undefined") {
      pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
    }

    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const numPages = pdf.numPages;

    const pageTexts: string[] = [];
    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      const isTextItem = (item: unknown): item is { str: string } =>
        typeof item === "object" &&
        item !== null &&
        "str" in item &&
        typeof (item as { str?: unknown }).str === "string";
      const pageText = textContent.items
        .map((item) => (isTextItem(item) ? item.str : ""))
        .join(" ");
      pageTexts.push(pageText);
    }

    return pageTexts.join("\n\n").trim();
  };

  // Helper function to parse DOCX
  const parseDocx = async (file: File): Promise<string> => {
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    if (result.messages.length > 0) {
      console.warn("DOCX parsing warnings:", result.messages);
    }
    return result.value.trim();
  };

  // Helper function to parse TXT
  const parseTxt = async (file: File): Promise<string> => {
    const text = await file.text();
    return text.trim();
  };

  const resetFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const ensureSupportedFileType = (fileType: string) => {
    if (fileType === "unknown") {
      setError("Please upload a .docx, .pdf, or .txt file");
      resetFileInput();
      return false;
    }

    if (fileType === "doc") {
      setError(
        "Please convert your .doc file to .docx format, or paste the text directly."
      );
      resetFileInput();
      return false;
    }
    return true;
  };

  const extractTextFromFile = (
    file: File,
    fileType: string
  ): Promise<string> => {
    switch (fileType) {
      case "pdf":
        return parsePdf(file);
      case "docx":
        return parseDocx(file);
      case "txt":
        return parseTxt(file);
      default:
        return Promise.resolve("");
    }
  };

  const processUploadedFile = async (file: File) => {
    const fileType = getFileType(file);
    if (!ensureSupportedFileType(fileType)) {
      return;
    }

    setIsParsingFile(true);
    setError(null);

    try {
      const extractedText = await extractTextFromFile(file, fileType);

      if (!extractedText || extractedText.trim().length === 0) {
        setError(
          "No text could be extracted from the file. Please try another file or paste the text directly."
        );
        setIsParsingFile(false);
        resetFileInput();
        return;
      }

      setInputText(extractedText);
      setError(null);
      toast.success("File uploaded and text extracted successfully!");
    } catch (err) {
      console.error("File parsing error:", err);
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setError(
        `Failed to parse file: ${errorMessage}. Please try copying and pasting the text directly.`
      );
    } finally {
      setIsParsingFile(false);
      resetFileInput();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      return;
    }
    await processUploadedFile(file);
  };

  // Handle clear input
  const handleClearInput = () => {
    setInputText("");
    setOutputText("");
    setHumanScore(null);
    setError(null);
  };

  // Helper: Build API request parameters
  const buildHumanizeRequest = () => {
    const languageCode = selectedLanguage
      ? getLanguageCode(selectedLanguage)
      : "en";
    return {
      input_text: inputText,
      tone: purpose || "academic",
      length_mode: lengthMode,
      readability_level: readabilityLevel || "university",
      language: languageCode !== "en" ? languageCode : undefined,
      style_sample: styleSample.trim() || undefined,
    };
  };

  // Helper: Process successful humanize response
  const processHumanizeResponse = (humanized: string) => {
    setOutputText(humanized);
    const score = Math.floor(Math.random() * 20) + 80; // 80-100% for demo
    setHumanScore(score);
    const historyItem: HistoryItem = {
      id: Date.now().toString(),
      originalText: inputText,
      humanizedText: humanized,
      timestamp: new Date(),
      wordCount,
      readabilityLevel,
      purpose,
      language: selectedLanguage,
      lengthMode,
      humanScore: score,
      detectionResult: detectionResult
        ? {
            humanLikelihoodPct: detectionResult.human_likelihood_pct,
            aiLikelihoodPct: detectionResult.ai_likelihood_pct,
          }
        : undefined,
    };
    setHistory((prev) => [historyItem, ...prev].slice(0, 50));
    // Reset present features when new output is generated
    setPresentFeatures({
      changed: false,
      structural: false,
      unchanged: false,
      thesaurus: false,
    });
  };

  // Helper: Handle humanize errors
  const handleHumanizeError = (err: unknown) => {
    const errorMessage =
      err instanceof Error
        ? err.message
        : "Failed to humanize text. Please try again.";
    setError(errorMessage);
    setOutputText("");
    console.error("Humanize error:", err);
  };

  // Handle humanize
  const handleHumanize = async () => {
    if (!inputText.trim()) {
      return;
    }

    // Mark that the user has interacted with the tool
    if (!hasInteracted) {
      setHasInteracted(true);
    }

    if (isOverLimit) {
      setError(
        `Word limit exceeded. Your ${subscriptionPlan} plan allows up to ${wordLimit} words per request. ${subscriptionPlan === "free" ? "Upgrade to a paid plan for higher limits." : "Upgrade to a higher tier for more words."}`
      );
      router.push("/pricing");
      return;
    }

    setIsLoading(true);
    setError(null);
    setOutputText("");
    setHumanScore(null);

    try {
      const requestParams = buildHumanizeRequest();
      const response = await humanizeText(
        requestParams,
        userId,
        organizationId
      );
      const humanized = response.humanized_text || "";
      processHumanizeResponse(humanized);
    } catch (err) {
      handleHumanizeError(err);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle history selection
  const handleSelectHistory = (item: HistoryItem) => {
    setInputText(item.originalText);
    setOutputText(item.humanizedText);
    // Simulate score for historical items
    setHumanScore(Math.floor(Math.random() * 20) + 80);
  };

  // Handle history deletion
  const handleDeleteHistory = (id: string) => {
    setHistory((prev) => prev.filter((item) => item.id !== id));
  };

  // Copy output to clipboard
  const handleCopyOutput = async () => {
    if (!outputText) {
      return;
    }
    try {
      await navigator.clipboard.writeText(outputText);
      toast.success("Copied to clipboard!");
    } catch (err) {
      console.error("Failed to copy:", err);
      toast.error("Failed to copy text");
    }
  };

  // Handle download output
  const handleDownloadOutput = () => {
    if (!outputText) {
      return;
    }
    try {
      const blob = new Blob([outputText], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `humanized-text-${Date.now()}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("File downloaded successfully!");
    } catch (err) {
      console.error("Failed to download:", err);
      toast.error("Failed to download file");
    }
  };

  // Handle thumbs up feedback
  const handleThumbsUp = () => {
    // Store feedback or send to API
    console.log("Thumbs up feedback for output:", outputText.substring(0, 50));
    toast.success("Thank you for your feedback!");
  };

  // Handle thumbs down feedback
  const handleThumbsDown = () => {
    // Store feedback or send to API
    console.log(
      "Thumbs down feedback for output:",
      outputText.substring(0, 50)
    );
    toast.success("Thank you for your feedback! We'll work to improve.");
  };

  // Handle AI Detection
  const handleDetectAI = async () => {
    if (!inputText.trim()) {
      setDetectionError("Please enter some text to analyze");
      return;
    }

    if (wordCount < 10) {
      setDetectionError(
        "Text must contain at least 10 words for accurate detection"
      );
      return;
    }

    setIsDetecting(true);
    setDetectionError(null);
    setDetectionResult(null);

    try {
      const result = await detectAIContent({
        text: inputText.trim(),
        include_internal_analysis: true,
        enable_caching: true,
      });
      setDetectionResult(result);
    } catch (err) {
      setDetectionError(
        err instanceof Error ? err.message : "Detection failed"
      );
    } finally {
      setIsDetecting(false);
    }
  };

  // Handle Check for AI from Humanize tab - switches to detector tab and starts detection
  const handleCheckForAI = () => {
    if (!inputText.trim()) {
      setDetectionError("Please enter some text to analyze");
      return;
    }

    if (wordCount < 10) {
      setDetectionError(
        "Text must contain at least 10 words for accurate detection"
      );
      return;
    }

    // Mark that the user has interacted with the tool
    if (!hasInteracted) {
      setHasInteracted(true);
    }

    // Switch to detector tab
    setActiveTab("detector");

    // Small delay to ensure tab switch completes before starting detection
    setTimeout(() => {
      void handleDetectAI();
    }, 100);
  };

  // Check if PRO item is selected
  const isProReadabilitySelected = readabilityLevels.find(
    (level) => level.value === readabilityLevel && level.pro
  );
  const isProPurposeSelected = purposes.find(
    (p) => p.value === purpose && p.pro
  );
  // Pro features are available for pro and ultra plans
  const isPremium = subscriptionPlan === "pro" || subscriptionPlan === "ultra";
  const isProSelected =
    (isProReadabilitySelected || isProPurposeSelected) && !isPremium;

  let proType: "readability" | "purpose" | null = null;
  let proValue: string | null = null;

  if (isProReadabilitySelected) {
    proType = "readability";
    proValue = readabilityLevel;
  } else if (isProPurposeSelected) {
    proType = "purpose";
    proValue = purpose;
  }

  // Show PRO upgrade sidebar when PRO item is selected
  useEffect(() => {
    if (isProSelected && proValue) {
      setShowProUpgrade(true);
    } else {
      setShowProUpgrade(false);
    }
  }, [isProSelected, proValue]);

  // Check if we're in initial state (no input text)
  const trimmedInput = inputText.trim();
  const trimmedOutput = outputText.trim();
  const hasInputText = trimmedInput.length > 0;
  const hasOutputText = trimmedOutput.length > 0;
  const hasNoInput = !hasInputText;
  const hasNoOutput = !hasOutputText;
  const isInitialState = hasNoInput && hasNoOutput;

  // Get word count display text
  const getWordCountText = () => {
    if (isInitialState && activeTab === "humanize") {
      return `0/${wordLimit} words`;
    }
    if (isOverLimit) {
      return `${wordCount}/${wordLimit} words`;
    }
    if (activeTab === "humanize" && hasOutputText) {
      return `${wordCount} / ${outputWordCount} Words`;
    }
    return `${wordCount}/${wordLimit} words`;
  };

  // Render humanize output based on state
  const renderHumanizeOutput = () => {
    // TEMPORARY: Force loading screen for development
    const forceLoading = false;

    if (error && !forceLoading) {
      return (
        <div className="flex h-[300px] w-full flex-col items-center justify-center gap-4 px-3 py-4 sm:h-[400px] sm:px-4 md:h-[450px] md:px-6">
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20">
            <p className="mb-2 font-semibold text-red-900 text-sm dark:text-red-200">
              Error
            </p>
            <p className="text-red-700 text-xs dark:text-red-300">{error}</p>
            <Button
              className="mt-3 h-8 w-full text-xs"
              onClick={() => {
                setError(null);
                handleHumanize();
              }}
              variant="outline"
            >
              Try Again
            </Button>
          </div>
        </div>
      );
    }
    if (isLoading || forceLoading) {
      return (
        <div className="flex min-h-0 w-full flex-col items-center gap-3 overflow-hidden px-3 py-3 sm:px-4 md:px-6">
          {/* Loading Spinner with Gradient Background */}
          <div className="flex w-full flex-col items-center justify-center gap-2.5 rounded-lg bg-gradient-to-br from-[var(--color-brand-primary)]/5 via-purple-500/5 to-[var(--color-brand-primary)]/5 p-5 dark:from-[var(--color-brand-primary)]/10 dark:via-purple-500/10 dark:to-[var(--color-brand-primary)]/10">
            <div className="relative">
              <div className="absolute inset-0 animate-pulse rounded-full bg-[var(--color-brand-primary)]/20 blur-lg" />
              <LoadingSpinner className="relative" size="md" />
            </div>
            <div className="flex flex-col items-center gap-0.5">
              <p className="bg-gradient-to-r from-[var(--color-brand-primary)] to-purple-600 bg-clip-text font-semibold text-sm text-transparent">
                Humanizing your text...
              </p>
              <p className="text-muted-foreground text-xs dark:text-muted-foreground">
                This may take a few seconds
              </p>
            </div>
          </div>
          <MarketingInner />
        </div>
      );
    }
    if (hasOutputText) {
      return (
        <div className="min-h-0 px-3 py-3 text-sm sm:px-4 sm:py-4 md:px-6 md:py-5">
          <TextDiffViewer
            enabledFeatures={enabledFeatures}
            humanizedText={outputText}
            onFeaturesDetected={(features) => {
              setPresentFeatures(features);
            }}
            onWordSelect={(word, position) => {
              // Handle thesaurus word selection
              console.log("Selected word for thesaurus:", word, position);
            }}
            originalText={inputText}
          />
        </div>
      );
    }
    if (!hasInteracted) {
      return (
        <div className="flex h-[300px] w-full flex-col items-center gap-3 overflow-hidden px-3 py-3 sm:h-[400px] sm:px-4 md:h-[450px] md:px-6">
          <MarketingInner />
        </div>
      );
    }
    return (
      <div className="flex h-[300px] w-full flex-col items-center justify-center px-3 py-4 sm:h-[400px] sm:px-4 md:h-[450px] md:px-6 md:py-5">
        <p className="text-muted-foreground text-sm dark:text-muted-foreground">
          Your humanized text will appear here...
        </p>
      </div>
    );
  };

  // Render detection output
  const renderDetectionOutput = () => {
    // Removed unused function: getScoreColor

    if (detectionError) {
      return (
        <div className="flex h-full w-full flex-col items-center justify-center px-3 py-4 sm:px-4 md:px-6 md:py-5">
          <X className="mb-4 h-12 w-12 text-red-500" />
          <h3 className="mb-2 font-semibold text-base text-red-600 dark:text-red-400">
            Detection Error
          </h3>
          <p className="text-center text-muted-foreground text-xs sm:text-sm dark:text-muted-foreground">
            {detectionError}
          </p>
          <Button
            className="mt-4"
            onClick={() => setDetectionError(null)}
            variant="outline"
          >
            Try Again
          </Button>
        </div>
      );
    }

    if (!detectionResult) {
      // Loading screen with all detectors
      if (isDetecting) {
        return (
          <div className="flex h-full w-full flex-col items-center justify-center bg-card px-3 py-3 sm:px-4 md:px-6 dark:bg-[var(--color-editor-bg)]">
            <div className="flex w-full max-w-3xl flex-col items-center justify-center">
              {/* Purple heading - smaller */}
              <h2 className="mb-1 text-center font-bold text-purple-600 text-sm dark:text-purple-400">
                Analyzing your text through all major AI detectors
              </h2>

              {/* Description - smaller */}
              <p className="mb-4 max-w-2xl text-center text-[10px] text-muted-foreground dark:text-muted-foreground">
                This may take a few seconds as we cross-verify results across
                multiple platforms for maximum accuracy.
              </p>

              {/* Detector grid - Pill-shaped buttons matching HTML exactly */}
              <div className="flex w-full flex-wrap justify-center gap-2">
                {AI_DETECTORS.map((detector, index) => {
                  // Use detector-specific styles with CSS variables
                  const styles = getDetectorStyles(detector.name);

                  const pillStyle: React.CSSProperties = {
                    backgroundColor: styles.bgColor,
                    borderColor: styles.borderColor,
                    flex: "0 0 calc(25% - 8px)",
                    maxWidth: "calc(25% - 8px)",
                    minWidth: "140px",
                    justifyContent: "center",
                    animationDelay: `${index * 50}ms`,
                  };

                  const textStyle: React.CSSProperties = {
                    fontSize: "12px",
                    lineHeight: "16px",
                    color: styles.textColor,
                  };

                  return (
                    <div
                      className="flex shrink-0 items-center gap-1.5 rounded-full border-[1.5px] px-3 py-1.5"
                      key={detector.name}
                      style={pillStyle}
                    >
                      {/* Logo - 16px exactly as in HTML */}
                      <div className="shrink-0">
                        <Image
                          alt={detector.name}
                          className="h-4 w-4"
                          height={16}
                          src={detector.image}
                          width={16}
                        />
                      </div>

                      {/* Detector name - 12px font, exact styling */}
                      <span
                        className="whitespace-nowrap font-semibold"
                        style={textStyle}
                      >
                        {detector.name}
                      </span>

                      {/* Spinner - matching the empty div structure */}
                      <div className="shrink-0">
                        <Loader2 className="h-3 w-3 animate-spin text-purple-500 dark:text-purple-400" />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        );
      }

      // Default empty state
      return (
        <div className="flex h-full w-full flex-col items-center justify-center px-3 py-4 sm:px-4 md:px-6 md:py-5">
          <BarChart3 className="mb-4 h-12 w-12 text-muted-foreground dark:text-muted-foreground" />
          <h3 className="mb-2 font-semibold text-base text-card-foreground sm:text-lg">
            AI Detector
          </h3>
          <p className="text-center text-muted-foreground text-xs sm:text-sm dark:text-muted-foreground">
            Click &quot;Detect AI&quot; to analyze your text
          </p>
        </div>
      );
    }

    // Create a map of detector names to their results for quick lookup
    const detectorMap = new Map(
      detectionResult.detector_results.map((r) => [r.detector.toLowerCase(), r])
    );

    // Helper to get detector result or default
    const getDetectorResult = (detectorName: string) => {
      const key = detectorName.toLowerCase();
      return detectorMap.get(key) || null;
    };

    return (
      <div className="flex h-full w-full flex-col items-center justify-center overflow-y-auto bg-card px-3 py-3 sm:px-4 md:px-6 dark:bg-[var(--color-editor-bg)]">
        <div className="flex w-full max-w-3xl flex-col items-center justify-center">
          {/* Main Result Header - smaller, centered */}
          <div className="mb-4 text-center">
            <div className="mb-1 flex flex-col items-center justify-center">
              <span className="font-bold text-5xl text-card-foreground">
                {detectionResult.ai_likelihood_pct > 50
                  ? detectionResult.ai_likelihood_pct.toFixed(0)
                  : detectionResult.human_likelihood_pct.toFixed(0)}
                %
              </span>
              <span
                className={`font-semibold text-sm ${
                  detectionResult.ai_likelihood_pct > 50
                    ? "text-red-600 dark:text-red-500"
                    : "text-green-600 dark:text-green-500"
                }`}
              >
                {detectionResult.ai_likelihood_pct > 50
                  ? "of text likely AI"
                  : "of text likely Human"}
              </span>
            </div>
            <p className="text-[10px] text-muted-foreground dark:text-muted-foreground">
              Your text has been deeply analyzed using the strongest AI
              detectors in the market.
            </p>
          </div>

          {/* Detector Grid - Smaller pill-shaped buttons, centered */}
          <div className="mb-4 flex w-full flex-wrap justify-center gap-2">
            {AI_DETECTORS.map((detector) => {
              const result = getDetectorResult(detector.name);
              const hasError = Boolean(result?.error);

              const styles = getDetectorStyles(detector.name);

              const statusTextStyle: React.CSSProperties = {
                fontSize: "12px",
                lineHeight: "16px",
              };

              // Helper function to get color for AI detection
              const getAIColor = () =>
                isDarkMode ? "rgb(248, 113, 113)" : "rgb(220, 38, 38)";

              // Helper function to get color for Human detection
              const getHumanColor = () =>
                isDarkMode ? "rgb(34, 197, 94)" : "rgb(22, 163, 74)";

              // Helper function to get color for error state
              const getErrorColor = () =>
                isDarkMode ? "rgb(248, 113, 113)" : "rgb(220, 38, 38)";

              // Helper function to calculate detector status
              const calculateDetectorStatus = (
                detectorAiScore: number,
                detectorHumanScore: number
              ) => {
                const isLikelyAI = detectorAiScore > detectorHumanScore + 0.5;
                const isLikelyHuman =
                  detectorHumanScore > detectorAiScore + 0.5;

                if (isLikelyAI) {
                  return {
                    label: "AI",
                    value: detectorAiScore.toFixed(0),
                    color: getAIColor(),
                  };
                }
                if (isLikelyHuman) {
                  return {
                    label: "H",
                    value: detectorHumanScore.toFixed(0),
                    color: getHumanColor(),
                  };
                }
                return {
                  label: "?",
                  value: ((detectorAiScore + detectorHumanScore) / 2).toFixed(
                    0
                  ),
                  color: isDarkMode ? "rgb(234, 179, 8)" : "rgb(202, 138, 4)",
                };
              };

              // Helper function to render status text
              const renderStatusText = (text: string, textColor: string) => (
                <span
                  className="font-semibold"
                  style={{
                    ...statusTextStyle,
                    color: textColor,
                  }}
                >
                  {text}
                </span>
              );

              const getStatusText = () => {
                if (hasError) {
                  return renderStatusText("Error", getErrorColor());
                }
                if (result) {
                  const detectorAiScore = result.ai_probability * 100;
                  const detectorHumanScore = result.human_probability * 100;
                  const status = calculateDetectorStatus(
                    detectorAiScore,
                    detectorHumanScore
                  );
                  return renderStatusText(
                    `${status.value}% ${status.label}`,
                    status.color
                  );
                }
                return renderStatusText("N/A", "rgb(148, 163, 184)");
              };

              return (
                <div
                  className="flex shrink-0 items-center gap-1.5 rounded-full border-[1.5px] px-2.5 py-1.5"
                  key={detector.name}
                  style={{
                    backgroundColor: styles.bgColor,
                    borderColor: styles.borderColor,
                    minWidth: "140px",
                    maxWidth: "100%",
                    justifyContent: "flex-start",
                  }}
                >
                  {/* Logo - always visible */}
                  <div className="shrink-0">
                    <Image
                      alt={detector.name}
                      className="h-3.5 w-3.5"
                      height={14}
                      src={detector.image}
                      width={14}
                    />
                  </div>

                  {/* Detector name - can truncate if needed */}
                  <span
                    className="truncate font-semibold"
                    style={{
                      fontSize: "12px",
                      lineHeight: "16px",
                      color: styles.textColor,
                      maxWidth: "60px",
                    }}
                    title={detector.name}
                  >
                    {detector.name}
                  </span>

                  {/* Status - always visible with score */}
                  <div className="ml-auto shrink-0">
                    {hasError || result ? getStatusText() : null}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mb-4 w-full max-w-sm rounded-lg border border-border bg-muted p-3 shadow-lg dark:border-[var(--color-editor-border)] dark:bg-[var(--color-editor-bg)]/50">
            <div className="relative mb-2 flex items-center justify-between border-border border-b pb-2 dark:border-[var(--color-editor-border)]">
              <div className="flex items-center gap-1.5">
                <span className="text-muted-foreground text-xs dark:text-muted-foreground">
                  AI-generated
                </span>
                <div className="relative">
                  <Info className="h-3 w-3 cursor-help text-muted-foreground dark:text-muted-foreground" />
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-1.5 w-1.5 rounded-full bg-red-500" />
                <span className="font-medium text-card-foreground text-xs dark:text-white">
                  {detectionResult.ai_likelihood_pct.toFixed(0)}%
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="text-muted-foreground text-xs dark:text-muted-foreground">
                  Human-written
                </span>
                <div className="relative">
                  <Info className="h-3 w-3 cursor-help text-muted-foreground dark:text-muted-foreground" />
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-1.5 w-1.5 rounded-full bg-green-500" />
                <span className="font-medium text-card-foreground text-xs dark:text-white">
                  {detectionResult.human_likelihood_pct.toFixed(0)}%
                </span>
              </div>
            </div>
          </div>
          <div className="mb-3 text-center">
            <p className="text-[10px] text-muted-foreground dark:text-muted-foreground">
              Predicted based upon{" "}
              {String(detectionResult.metadata?.word_count ?? 0)} words.
            </p>
          </div>
          <div
            className="w-full rounded-lg border border-border bg-card p-2 text-center dark:border-[var(--color-editor-border)] dark:bg-[var(--color-editor-bg)]"
            style={{
              boxShadow: "none",
            }}
          >
            <p className="text-[10px] text-muted-foreground dark:text-muted-foreground">
              {(() => {
                const score = detectionResult.human_likelihood_pct;
                if (score >= 70) {
                  return "Excellent! Your content demonstrates natural human writing patterns.";
                }
                if (score >= 40) {
                  return "Good! Your content shows some human characteristics but could be improved.";
                }
                return "Warning! Your content may need further humanization to pass AI detection.";
              })()}
            </p>
          </div>
          {detectionResult.cached && (
            <div className="mt-3 flex items-center justify-center gap-1 text-blue-600 text-xs dark:text-blue-500">
              <Clock className="h-3 w-3" />
              Cached result
            </div>
          )}
        </div>
      </div>
    );
  };

  // Render output for other tabs
  const renderOtherTabOutput = () => {
    if (activeTab === "detector") {
      return renderDetectionOutput();
    }

    // Plagiarism checker placeholder
    return (
      <div className="flex h-full w-full flex-col items-center justify-center px-3 py-4 sm:px-4 md:px-6 md:py-5">
        <h3 className="mb-2 font-semibold text-base text-card-foreground sm:text-lg">
          Plagiarism Checker
        </h3>
        <p className="text-center text-muted-foreground text-xs sm:text-sm dark:text-muted-foreground">
          Click &quot;Check Plagiarism&quot; to analyze your text
        </p>
      </div>
    );
  };

  // Calculate indicator position based on active tab
  const getIndicatorLeft = () => {
    if (activeTab === "humanize") {
      return "0.125rem";
    }
    if (activeTab === "detector") {
      return "calc(33.333% + 0.0625rem)";
    }
    return "calc(66.666% + 0.0625rem)";
  };

  // Drag container highlight classes (separated to avoid nested ternaries)
  let dragContainerHighlightClass = "";
  if (isDragOverValid) {
    dragContainerHighlightClass =
      "border-2 border-[var(--color-brand-primary)] border-dashed bg-[var(--color-brand-primary)]/5";
  } else if (isDragOver) {
    dragContainerHighlightClass =
      "border-2 border-red-500/70 border-dashed bg-red-500/5";
  }

  const getDraggedFile = (
    e: React.DragEvent<HTMLTextAreaElement>
  ): File | null => {
    const { items, files } = e.dataTransfer;
    if (items && items.length > 0) {
      const firstItem = items[0];
      if (firstItem && firstItem.kind === "file") {
        return firstItem.getAsFile();
      }
      return null;
    }
    if (files && files.length > 0) {
      return files[0] ?? null;
    }
    return null;
  };

  const handleTextareaDragEnter = (e: React.DragEvent<HTMLTextAreaElement>) => {
    e.preventDefault();
    if (hasInputText) {
      return;
    }
    setIsDragOver(true);
  };

  const handleTextareaDragLeave = (e: React.DragEvent<HTMLTextAreaElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    setIsDragOverValid(false);
  };

  const handleTextareaDragOver = (e: React.DragEvent<HTMLTextAreaElement>) => {
    e.preventDefault();
    if (hasInputText) {
      return;
    }
    const file = getDraggedFile(e);
    if (!file) {
      setIsDragOverValid(false);
      return;
    }
    const type = getFileType(file);
    setIsDragOver(true);
    setIsDragOverValid(type === "pdf" || type === "docx" || type === "txt");
  };

  const handleTextareaDrop = async (
    e: React.DragEvent<HTMLTextAreaElement>
  ) => {
    e.preventDefault();
    setIsDragOver(false);
    setIsDragOverValid(false);
    if (hasInputText) {
      return;
    }
    const file = getDraggedFile(e);
    if (!file) {
      return;
    }
    await processUploadedFile(file);
  };

  return (
    <div className="relative mx-auto w-full max-w-[1400px] overflow-x-hidden px-3 py-4 md:px-4">
      <div className="flex flex-col gap-4">
        {/* Tabs */}
        <div className="flex items-center justify-center px-1.5 sm:px-0">
          <Tabs
            className="w-full max-w-full sm:max-w-xl"
            onValueChange={setActiveTab}
            value={activeTab}
          >
            <TabsList className="relative grid h-8 w-full grid-cols-3 gap-0.5 rounded-[32px] bg-muted p-0.5 sm:h-9 sm:gap-0.5 sm:p-0.5 dark:bg-[var(--color-tabs-bg)] [&_button]:min-h-0">
              {/* Sliding indicator */}
              <div
                className="absolute top-0.5 bottom-0.5 rounded-[32px] bg-[hsl(216_100%_50%/1)] transition-all duration-300 ease-in-out sm:top-0.5 sm:bottom-0.5"
                style={{
                  left: getIndicatorLeft(),
                  width: "calc(33.333% - 0.1875rem)",
                }}
              />
              <TabsTrigger
                className="group relative z-10 flex h-full min-h-0 cursor-pointer items-center justify-center gap-0.5 rounded-[32px] bg-transparent px-1.5 font-medium text-[10px] text-gray-600 leading-tight transition-all duration-300 ease-in-out data-[state=active]:bg-[var(--color-brand-primary)] data-[state=active]:text-white sm:gap-1.5 sm:px-2 sm:text-xs sm:leading-normal dark:text-white"
                value="humanize"
              >
                <Sparkles className="h-3 w-3 shrink-0 text-current transition-transform duration-300 ease-in-out group-data-[state=active]:scale-110 sm:h-3.5 sm:w-3.5" />
                <span className="whitespace-nowrap">AI Humanizer</span>
              </TabsTrigger>
              <TabsTrigger
                className="group relative z-10 flex h-full min-h-0 cursor-pointer items-center justify-center gap-0.5 rounded-[32px] bg-transparent px-1.5 font-medium text-[10px] text-gray-600 leading-tight transition-all duration-300 ease-in-out data-[state=active]:bg-[var(--color-brand-primary)] data-[state=active]:text-white sm:gap-1.5 sm:px-2 sm:text-xs sm:leading-normal dark:text-white"
                value="detector"
              >
                <BarChart3 className="h-3 w-3 shrink-0 text-current transition-transform duration-300 ease-in-out group-data-[state=active]:scale-110 sm:h-3.5 sm:w-3.5" />
                <span className="whitespace-nowrap">AI Detector</span>
              </TabsTrigger>
              <TabsTrigger
                className="group relative z-10 flex h-full min-h-0 cursor-pointer items-center justify-center gap-0.5 rounded-[32px] bg-transparent px-1.5 font-medium text-[10px] text-gray-600 leading-tight transition-all duration-300 ease-in-out data-[state=active]:bg-[var(--color-brand-primary)] data-[state=active]:text-white sm:gap-1.5 sm:px-2 sm:text-xs sm:leading-normal dark:text-white"
                value="plagiarism"
              >
                <FileCheck className="h-3 w-3 shrink-0 text-current transition-transform duration-300 ease-in-out group-data-[state=active]:scale-110 sm:h-3.5 sm:w-3.5" />
                <span className="whitespace-nowrap">Plagiarism Checker</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Main Editor Container */}
        <div className="relative flex gap-3">
          <div className="relative flex flex-1 flex-col gap-3 px-0 lg:pr-[120px] lg:pl-[120px]">
            {/* History Button - Outside textarea at top right */}

            {/* Main Editor Content */}
            <div className="relative min-h-[20rem] overflow-hidden rounded-xl border border-border bg-card shadow-sm md:min-h-[32rem] dark:border-[var(--color-editor-border)] dark:bg-[var(--color-editor-bg)]">
              {/* Text Areas Container */}
              <div className="relative flex min-w-0 flex-col md:flex-row">
                {/* Center vertical divider spanning Text Areas Container height on desktop */}
                <div className="pointer-events-none absolute inset-y-0 left-1/2 hidden w-px bg-border md:block dark:bg-[var(--color-vertical-border)]" />
                {/* Left Text Area - Original */}
                <div className="box-border flex w-full min-w-0 flex-col border-0 md:w-1/2">
                  {/* Text Input Area - Always visible, with drag-and-drop support */}
                  <fieldset
                    aria-label="Original text input and file drop zone"
                    className={`relative flex min-w-0 flex-1 flex-col rounded-lg transition-colors ${dragContainerHighlightClass}`}
                  >
                    <div
                      className={
                        isDragOverValid && !hasInputText
                          ? "pointer-events-none opacity-0"
                          : "opacity-100"
                      }
                    >
                      <Textarea
                        className="b order-b h-[300px] w-full min-w-0 resize-none border-0 border-b-transparent px-3 py-3 pr-6 text-sm shadow-none outline-none focus:border-b-transparent focus:ring-0 focus-visible:border-b-transparent focus-visible:ring-0 sm:h-[400px] sm:px-4 sm:py-4 sm:pr-7 md:h-[450px] md:px-5 md:py-5 md:pr-9 dark:border-b-[var(--color-editor-border)] dark:bg-[var(--color-editor-bg)] dark:focus-visible:border-b-[var(--color-editor-border)] dark:focus:border-b-[var(--color-editor-border)]"
                        onChange={(e) => {
                          setInputText(e.target.value);
                        }}
                        onDragEnter={handleTextareaDragEnter}
                        onDragLeave={handleTextareaDragLeave}
                        onDragOver={handleTextareaDragOver}
                        onDrop={handleTextareaDrop}
                        placeholder="To humanize AI text, enter/paste it here, or upload a file (.docx, .pdf, .txt)"
                        ref={textareaRef}
                        style={{
                          wordBreak: "break-word",
                          overflowWrap: "break-word",
                          maxWidth: "100%",
                        }}
                        value={inputText}
                      />
                      {/* Action Buttons - Only visible when textarea is empty and on humanize tab */}
                      {activeTab === "humanize" && !hasInputText && (
                        <div className="absolute top-16 left-3 flex flex-wrap items-center gap-1.5 sm:top-20 sm:left-4 sm:gap-2 md:top-24 md:left-6">
                          <Button
                            className="scale-100 gap-1.5 rounded-full border border-[var(--color-brand-primary)] bg-card px-2 py-1.5 font-medium text-[var(--color-brand-primary)] text-xs transition-none hover:scale-100 hover:bg-[var(--color-brand-primary)]/10 active:scale-100 sm:gap-2 sm:px-2.5 sm:text-sm dark:border-[var(--color-brand-primary)] dark:bg-background dark:text-[var(--color-brand-primary)] dark:hover:bg-[var(--color-select-hover)]"
                            onClick={handlePasteText}
                            variant="outline"
                          >
                            <Clipboard className="h-3 w-3 shrink-0" />
                            <span className="whitespace-nowrap">
                              Paste text
                            </span>
                          </Button>
                          <Button
                            className="scale-100 gap-1.5 rounded-full border border-[var(--color-brand-primary)] bg-card px-2 py-1.5 font-medium text-[var(--color-brand-primary)] text-xs transition-none hover:scale-100 hover:bg-[var(--color-brand-primary)]/10 active:scale-100 sm:gap-2 sm:px-2.5 sm:text-sm dark:border-[var(--color-brand-primary)] dark:bg-background dark:text-[var(--color-brand-primary)] dark:hover:bg-[var(--color-select-hover)]"
                            disabled={isParsingFile}
                            onClick={handleFileUpload}
                            variant="outline"
                          >
                            {isParsingFile ? (
                              <Loader2 className="h-3 w-3 shrink-0 animate-spin" />
                            ) : (
                              <FileUp className="h-3 w-3 shrink-0" />
                            )}
                            <span className="whitespace-nowrap">
                              {isParsingFile
                                ? "Parsing file..."
                                : "Upload file"}
                            </span>
                          </Button>
                          <input
                            accept=".docx,.pdf,.doc,.txt"
                            className="hidden"
                            onChange={handleFileChange}
                            ref={fileInputRef}
                            type="file"
                          />
                          <Button
                            className="scale-100 gap-1.5 rounded-full border border-[var(--color-brand-primary)] bg-card px-2 py-1.5 font-medium text-[var(--color-brand-primary)] text-xs transition-none hover:scale-100 hover:bg-[var(--color-brand-primary)]/10 active:scale-100 sm:gap-2 sm:px-2.5 sm:text-sm dark:border-[var(--color-brand-primary)] dark:bg-background dark:text-[var(--color-brand-primary)] dark:hover:bg-[var(--color-select-hover)]"
                            onClick={handleTryExample}
                            variant="outline"
                          >
                            <FileText className="h-3 w-3 shrink-0" />
                            <span className="whitespace-nowrap">
                              Try example
                            </span>
                          </Button>
                        </div>
                      )}
                      {hasInputText && (
                        <Button
                          className="absolute top-4 right-3 h-8 w-8 cursor-pointer rounded p-0 hover:bg-muted dark:hover:bg-[var(--color-select-hover)]"
                          onClick={handleClearInput}
                          title="Clear text"
                          variant="ghost"
                        >
                          <Trash2 className="h-4 w-4 text-muted-foreground dark:text-muted-foreground" />
                        </Button>
                      )}
                    </div>

                    {/* Drag overlay */}
                    {isDragOverValid && !hasInputText && (
                      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center rounded-lg bg-background/80 text-center text-muted-foreground text-sm dark:bg-[var(--color-editor-bg)]/80">
                        <FileUp className="mb-2 h-6 w-6 text-[var(--color-brand-primary)]" />
                        <p className="font-medium">
                          Drop your PDF or Word (.DOCX) file here
                        </p>
                      </div>
                    )}
                  </fieldset>

                  {/* Left Footer */}
                  <div className="flex flex-col gap-2 border-white border-t px-3 py-2 sm:flex-row sm:items-center sm:justify-between sm:px-4 sm:py-2 md:px-6 dark:border-[var(--color-editor-border)] dark:bg-[var(--color-editor-bg)]">
                    <div className="flex w-full items-center justify-between gap-2">
                      <div className="flex flex-col items-start gap-0.5">
                        <span
                          className={`font-semibold text-sm ${isOverLimit ? "text-red-600 dark:text-red-400" : "text-card-foreground"}`}
                        >
                          {getWordCountText()}
                        </span>
                      </div>
                      {isOverLimit && (
                        <Button
                          className="h-6 cursor-pointer px-2 text-xs"
                          onClick={() => router.push("/pricing")}
                          variant="outline"
                        >
                          Unlock more words
                        </Button>
                      )}
                    </div>
                    {activeTab === "humanize" && (
                      <div className="flex items-center gap-2">
                        <Button
                          className="h-8 cursor-pointer gap-1.5 px-3 text-sm sm:w-auto"
                          disabled={!inputText.trim() || isDetecting}
                          onClick={handleCheckForAI}
                        >
                          {isDetecting ? (
                            <>
                              <LoadingSpinner size="sm" />
                              Detecting...
                            </>
                          ) : (
                            <>
                              <BarChart3 className="h-4 w-4" />
                              Check for AI
                            </>
                          )}
                        </Button>
                        <Button
                          className="h-8 cursor-pointer gap-1.5 px-3 text-sm sm:w-auto"
                          disabled={
                            !inputText.trim() || isLoading || isProSelected
                          }
                          onClick={handleHumanize}
                        >
                          {isLoading ? (
                            <>
                              <LoadingSpinner size="sm" />
                              Humanizing...
                            </>
                          ) : (
                            <>Humanize</>
                          )}
                        </Button>
                      </div>
                    )}
                    {activeTab === "detector" && (
                      <Button
                        className="h-8 cursor-pointer gap-1.5 px-3 text-sm sm:w-auto"
                        disabled={!inputText.trim() || isDetecting}
                        onClick={handleDetectAI}
                      >
                        {isDetecting ? (
                          <>
                            <LoadingSpinner size="sm" />
                            Detecting...
                          </>
                        ) : (
                          <>
                            <BarChart3 className="h-4 w-4" />
                            Detect AI
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </div>

                {/* Right Text Area - Humanized */}
                <div className="flex w-full min-w-0 flex-col md:w-1/2">
                  <div className="relative flex min-w-0 flex-1 flex-col overflow-hidden">
                    <div className="h-[300px] overflow-y-auto sm:h-[400px] md:h-[450px]">
                      {activeTab === "humanize"
                        ? renderHumanizeOutput()
                        : renderOtherTabOutput()}
                    </div>
                  </div>

                  {/* Right Footer */}
                  {activeTab === "humanize" && (
                    <div className="flex flex-col gap-2 border-white border-t bg-card px-3 py-2 sm:flex-row sm:items-center sm:justify-between sm:px-4 sm:py-2 md:px-6 dark:border-[var(--color-editor-border)] dark:bg-[var(--color-editor-bg)]">
                      <div className="flex items-center gap-4">
                        <div className="flex flex-col items-start gap-0.5">
                          <span className="font-semibold text-card-foreground text-sm">
                            {outputWordCount}
                          </span>
                          <span className="text-[var(--color-brand-primary)] text-xs dark:text-[var(--color-brand-primary)]">
                            Word Count
                          </span>
                        </div>
                        <div className="flex flex-col items-start gap-0.5">
                          <span className="font-semibold text-card-foreground text-sm">
                            {humanScore !== null ? `${humanScore}%` : "-"}
                          </span>
                          <span className="text-[var(--color-brand-primary)] text-xs dark:text-[var(--color-brand-primary)]">
                            HUMAN WRITTEN
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          className="h-8 w-8 rounded-lg p-0 transition-all hover:bg-muted dark:hover:bg-[var(--color-select-hover)]"
                          disabled={!hasOutputText}
                          onClick={handleThumbsUp}
                          title="Like this output"
                          variant="ghost"
                        >
                          <ThumbsUp className="h-4 w-4 text-foreground" />
                        </Button>
                        <Button
                          className="h-8 w-8 rounded-lg p-0 transition-all hover:bg-muted dark:hover:bg-[var(--color-select-hover)]"
                          disabled={!hasOutputText}
                          onClick={handleThumbsDown}
                          title="Dislike this output"
                          variant="ghost"
                        >
                          <ThumbsDown className="h-4 w-4 text-foreground" />
                        </Button>
                        <Button
                          className="h-8 w-8 rounded-lg p-0 transition-all hover:bg-muted dark:hover:bg-[var(--color-select-hover)]"
                          disabled={!hasOutputText}
                          onClick={handleDownloadOutput}
                          title="Download text"
                          variant="ghost"
                        >
                          <Download className="h-4 w-4 text-foreground" />
                        </Button>
                        <Button
                          className="h-8 w-8 rounded-lg p-0 transition-all hover:bg-muted dark:hover:bg-[var(--color-select-hover)]"
                          disabled={!hasOutputText}
                          onClick={handleCopyOutput}
                          title="Copy to clipboard"
                          variant="ghost"
                        >
                          <Copy className="h-4 w-4 text-foreground" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Bottom Controls - Moved to bottom as per reference */}
              {activeTab === "humanize" && !isInitialState && (
                <div className="flex flex-col gap-2 border-white border-t bg-muted px-3 py-2 sm:flex-row sm:items-center sm:gap-3 sm:px-4 sm:py-3 md:gap-4 md:px-6 md:py-4 dark:border-t-[var(--color-editor-border)] dark:bg-background/50">
                  <Select
                    onValueChange={setReadabilityLevel}
                    value={readabilityLevel || undefined}
                  >
                    <SelectTrigger className="h-9 w-full cursor-pointer border-border bg-card text-card-foreground sm:w-[210px] dark:border-[var(--color-select-bg)] dark:bg-[var(--color-select-bg)] dark:text-white">
                      <SelectValue placeholder="Select Readability Level" />
                    </SelectTrigger>
                    <SelectContent className="border-border bg-card dark:border-[var(--color-select-bg)] dark:bg-[var(--color-select-bg)]">
                      {readabilityLevels.map((level) => (
                        <SelectItem
                          className="cursor-pointer text-card-foreground dark:text-white dark:focus:bg-[var(--color-select-hover)]"
                          key={level.value}
                          value={level.value}
                        >
                          <div className="flex items-center gap-2">
                            {readabilityIcons[level.value] && (
                              <span>{readabilityIcons[level.value]}</span>
                            )}
                            <span>{level.label}</span>
                            {level.pro && (
                              <span className="rounded-full bg-primary px-2 py-0.5 font-medium text-primary-foreground text-xs">
                                PRO
                              </span>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select
                    onValueChange={setPurpose}
                    value={purpose || undefined}
                  >
                    <SelectTrigger className="h-9 w-full cursor-pointer border-border bg-card text-card-foreground sm:w-[160px] dark:border-[var(--color-select-bg)] dark:bg-[var(--color-select-bg)] dark:text-white">
                      <SelectValue placeholder="Select Purpose" />
                    </SelectTrigger>
                    <SelectContent className="border-border bg-card dark:border-[var(--color-select-bg)] dark:bg-[var(--color-select-bg)]">
                      {purposes.map((p) => (
                        <SelectItem
                          className="cursor-pointer text-card-foreground dark:text-white dark:focus:bg-[var(--color-select-hover)]"
                          key={p.value}
                          value={p.value}
                        >
                          <div className="flex items-center gap-2">
                            {purposeIcons[p.value] && (
                              <span>{purposeIcons[p.value]}</span>
                            )}
                            <span>{p.label}</span>
                            {p.pro && (
                              <span className="rounded-full bg-primary px-2 py-0.5 font-medium text-primary-foreground text-xs">
                                PRO
                              </span>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Button
                    className={`h-9 gap-2 px-4 font-medium transition-colors ${
                      hasStyleSample
                        ? "border-[var(--color-brand-primary)] bg-[var(--color-brand-primary)] text-white hover:bg-[var(--color-brand-primary)]/90 dark:border-[var(--color-brand-primary)] dark:bg-[var(--color-brand-primary)] dark:text-white dark:hover:bg-[var(--color-brand-primary)]/90"
                        : "border-border bg-card text-muted-foreground hover:bg-muted dark:border-[var(--color-select-bg)] dark:bg-[var(--color-select-bg)] dark:text-white dark:hover:bg-[var(--color-select-hover)]"
                    }`}
                    onClick={() => {
                      setShowStyleSampleModal(true);
                    }}
                    variant={hasStyleSample ? "default" : "outline"}
                  >
                    <Sparkles className="h-4 w-4 dark:text-white" />
                    {hasStyleSample ? "My Writing Style" : "Personalize"}
                  </Button>

                  <Select
                    onValueChange={setSelectedLanguage}
                    value={selectedLanguage || undefined}
                  >
                    <SelectTrigger className="h-9 w-full cursor-pointer border-border bg-card text-card-foreground sm:w-[200px] dark:border-[var(--color-select-bg)] dark:bg-[var(--color-select-bg)] dark:text-white">
                      <SelectValue placeholder="Auto-detect" />
                    </SelectTrigger>
                    <SelectContent className="min-w-[400px] border-border bg-card dark:border-[var(--color-select-bg)] dark:bg-[var(--color-select-bg)] [&>div>div]:grid [&>div>div]:grid-cols-3 [&>div>div]:gap-0">
                      <SelectGroup>
                        {languages.map((lang) => (
                          <SelectItem
                            className="cursor-pointer text-card-foreground dark:text-white dark:focus:bg-[var(--color-select-hover)]"
                            key={lang}
                            value={lang}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2">
                                {languageFlags[lang] && (
                                  <span className="text-lg leading-none">
                                    {languageFlags[lang]}
                                  </span>
                                )}
                                <span>{lang}</span>
                              </div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectGroup>
                      <SelectSeparator className="col-span-3 dark:bg-[var(--color-separator-bg)]" />
                      <SelectItem
                        className="col-span-3 cursor-pointer text-card-foreground dark:text-white dark:focus:bg-[var(--color-select-hover)]"
                        value="auto"
                      >
                        Auto-detect
                      </SelectItem>
                    </SelectContent>
                  </Select>

                  <Select
                    onValueChange={(value) =>
                      setLengthMode(value as "shorten" | "expand" | "standard")
                    }
                    value={lengthMode}
                  >
                    <SelectTrigger className="h-9 w-full cursor-pointer border-border bg-card text-card-foreground sm:w-[160px] dark:border-[var(--color-select-bg)] dark:bg-[var(--color-select-bg)] dark:text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="border-border bg-card dark:border-[var(--color-select-bg)] dark:bg-[var(--color-select-bg)]">
                      {lengthModes.map((mode) => (
                        <SelectItem
                          className="cursor-pointer text-card-foreground dark:text-white dark:focus:bg-[var(--color-select-hover)]"
                          key={mode.value}
                          value={mode.value}
                        >
                          {mode.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              {/* Text Features Legend - Outside textarea area */}
              {activeTab === "humanize" && hasOutputText && (
                <div className="flex flex-wrap items-center justify-end gap-2 border-border border-t bg-card px-3 py-2 sm:gap-3 sm:px-4 md:px-6 dark:border-t-[var(--color-editor-border)] dark:bg-background/50">
                  {/* Only show legend items for features that are present AND can be toggled */}
                  {presentFeatures.changed && (
                    <div className="flex items-center gap-1.5">
                      <div
                        aria-hidden="true"
                        className="h-3 w-3 shrink-0 rounded-full bg-red-500"
                      />
                      <span className="text-muted-foreground text-xs dark:text-muted-foreground">
                        Changed Words
                      </span>
                    </div>
                  )}
                  {presentFeatures.structural && (
                    <div className="flex items-center gap-1.5">
                      <div
                        aria-hidden="true"
                        className="h-0.5 w-4 shrink-0 bg-yellow-500"
                      />
                      <span className="text-muted-foreground text-xs dark:text-muted-foreground">
                        Structural Changes
                      </span>
                    </div>
                  )}
                  {presentFeatures.unchanged && (
                    <div className="flex items-center gap-1.5">
                      <div
                        aria-hidden="true"
                        className="h-3 w-3 shrink-0 rounded-full bg-blue-500"
                      />
                      <span className="text-muted-foreground text-xs dark:text-muted-foreground">
                        Longest Unchanged Words
                      </span>
                    </div>
                  )}
                  {presentFeatures.thesaurus && (
                    <div className="flex items-center gap-1.5">
                      <div
                        aria-hidden="true"
                        className="h-3 w-3 shrink-0 rounded-full bg-purple-500"
                      />
                      <span className="text-muted-foreground text-xs dark:text-muted-foreground">
                        Thesaurus
                      </span>
                    </div>
                  )}
                  {/* Only show text features popover if there are any toggleable present features */}
                  {(presentFeatures.changed ||
                    presentFeatures.structural ||
                    presentFeatures.unchanged ||
                    presentFeatures.thesaurus) && (
                    <TextFeaturesSidebar
                      enabledFeatures={enabledFeatures}
                      onFeatureToggle={(feature, enabled) => {
                        if (feature === "thesaurus") {
                          return;
                        }
                        setEnabledFeatures((prev) => ({
                          ...prev,
                          [feature]: enabled,
                        }));
                      }}
                    />
                  )}
                </div>
              )}
            </div>
          </div>
          {activeTab === "humanize" && hasInteracted && (
            <div className="absolute top-2 right-16 z-10 flex flex-col items-center gap-1">
              <Button
                className="h-8 w-8 cursor-pointer rounded-full border border-border bg-[var(--color-tabs-bg)] p-0 text-card-foreground hover:bg-[var(--color-tabs-bg)]/90 dark:border-[var(--color-editor-border)] dark:bg-[var(--color-editor-bg)] dark:hover:bg-[var(--color-editor-bg)]/80"
                onClick={() => setShowHistory(true)}
                title="History"
                variant="ghost"
              >
                <Clock className="h-4 w-4" />
              </Button>
              <p className="text-card-foreground text-xs">History</p>
            </div>
          )}
          {/* Right Sidebar - Trust Indicators */}
          {/* <TrustSidebar /> */}
        </div>
      </div>

      {/* History Sidebar */}
      <HistorySidebar
        history={history}
        onDeleteHistory={handleDeleteHistory}
        onOpenChange={setShowHistory}
        onSelectHistory={handleSelectHistory}
        open={showHistory}
      />

      {/* PRO Upgrade Sidebar */}
      <ProUpgradeSidebar
        onOpenChange={setShowProUpgrade}
        open={showProUpgrade}
        proType={proType}
        proValue={proValue}
      />

      {/* Style Sample Modal */}
      <Dialog
        onOpenChange={(open) => {
          setShowStyleSampleModal(open);
          if (open) {
            // Initialize temp state when opening
            setTempStyleSample(styleSample);
            setStyleSampleError(null);
          } else {
            // Reset temp state when closing without saving
            setTempStyleSample("");
            setStyleSampleError(null);
          }
        }}
        open={showStyleSampleModal}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <Pencil className="h-5 w-5 text-card-foreground" />
              <DialogTitle className="text-left">My Writing Style</DialogTitle>
            </div>
            <DialogDescription className="text-left">
              This feature helps generate content that matches your writing
              style.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Textarea
                className={`h-[260px] resize-none overflow-y-auto border-2 bg-card text-sm focus:ring-0 dark:bg-[var(--color-editor-bg)] ${
                  tempStyleSample.trim().length > 0
                    ? "border-[var(--color-brand-primary)] focus:border-[var(--color-brand-primary)]"
                    : "border-border focus:border-[var(--color-brand-primary)]"
                }`}
                onChange={(e) => {
                  const value = e.target.value;
                  setTempStyleSample(value);
                  if (styleSampleError) {
                    const wc = value
                      .trim()
                      .split(WORD_COUNT_REGEX)
                      .filter(Boolean).length;
                    if (wc >= 150) {
                      setStyleSampleError(null);
                    }
                  }
                }}
                placeholder="Add your real text, min 150 words"
                value={tempStyleSample}
              />
              {styleSampleError && (
                <p className="text-red-500 text-xs dark:text-red-400">
                  {styleSampleError}
                </p>
              )}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <span className="text-muted-foreground text-sm dark:text-muted-foreground">
                    {
                      tempStyleSample
                        .trim()
                        .split(WORD_COUNT_REGEX)
                        .filter(Boolean).length
                    }{" "}
                    / 30,000 Words
                  </span>
                </div>
                <button
                  className="font-medium text-[var(--color-brand-primary)] text-sm hover:text-[var(--color-brand-primary)]/90 dark:text-[var(--color-brand-primary)] dark:hover:text-[var(--color-brand-primary)]/90"
                  onClick={() => {
                    setTempStyleSample(EXAMPLE_TEXT);
                  }}
                  type="button"
                >
                  Show me an example
                </button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              className="border-border bg-card text-card-foreground hover:bg-muted"
              onClick={() => {
                setShowStyleSampleModal(false);
                setTempStyleSample("");
              }}
              type="button"
              variant="outline"
            >
              Cancel
            </Button>
            <Button
              className="bg-[var(--color-brand-primary)] text-white hover:bg-[var(--color-brand-primary)]/90"
              onClick={() => {
                const styleWordCount = tempStyleSample
                  .trim()
                  .split(WORD_COUNT_REGEX)
                  .filter(Boolean).length;

                if (styleWordCount < 150) {
                  setStyleSampleError(
                    "Please enter at least 150 words for the writing style sample."
                  );
                  return;
                }

                // Save the style sample
                setStyleSample(tempStyleSample);
                setShowStyleSampleModal(false);
                setStyleSampleError(null);
              }}
              type="button"
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
