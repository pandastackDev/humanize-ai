import type { JSX } from "react";

export const languages = [
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

export const languageFlags: Record<string, string> = {
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
  Welsh: "🏴",
};

export const readabilityLevels = [
  { value: "university", label: "University" },
  { value: "high-school", label: "High School" },
  { value: "doctorate", label: "Doctorate", pro: true },
  { value: "journalist", label: "Journalist", pro: true },
  { value: "marketing", label: "Marketing", pro: true },
];

export const purposes = [
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

export const lengthModes = [
  { value: "standard", label: "Keep it as is" },
  { value: "shorten", label: "Make it shorter" },
  { value: "expand", label: "Make it longer" },
];

export const WORD_COUNT_REGEX = /\s+/;

export const AI_DETECTORS = [
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
  {
    name: "Grammarly",
    image: "/logos/humanization-logos/grammarly.png",
  },
  {
    name: "Scribbr",
    image: "/logos/humanization-logos/Scribbr.png",
  },
  {
    name: "CrossPlag",
    image: "/logos/humanization-logos/crossplag.png",
  },
];

export const EXAMPLE_TEXT = `The seaside town was a picturesque blend of old-world charm and modern amenities. Waves crashed gently against the shore, their rhythmic sound providing a soothing backdrop to the bustling boardwalk. Colorful fishing boats bobbed in the harbor, their nets filled with the day's catch. Tourists strolled along the promenade, enjoying the salty sea breeze and the vibrant atmosphere.`;

export const HISTORY_STORAGE_KEY = "humanize_history";
export const EDITOR_STATE_KEY = "humanize_editor_state";

// Icons for readability levels
export const readabilityIcons: Record<string, JSX.Element> = {
  university: (
    <svg
      className="h-5 w-5 text-brand-primary"
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
      className="h-5 w-5 text-brand-primary"
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
      className="h-5 w-5 text-brand-primary"
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
      className="h-4 w-4 text-brand-primary"
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
      className="h-4 w-4 text-brand-primary"
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
export const purposeIcons: Record<string, JSX.Element> = {
  academic: (
    <svg
      className="h-5 w-5 text-brand-primary"
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
      className="h-5 w-5 text-brand-primary"
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
      className="h-5 w-5 text-brand-primary"
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
      className="h-5 w-5 text-brand-primary"
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
      className="h-5 w-5 text-brand-primary"
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
      className="h-5 w-5 text-brand-primary"
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
      className="h-5 w-5 text-brand-primary"
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
      className="h-5 w-5 text-brand-primary"
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
      className="h-5 w-5 text-brand-primary"
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
      className="h-5 w-5 text-brand-primary"
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
