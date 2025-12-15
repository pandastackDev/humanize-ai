import { Button } from "@humanize/ui/components/button";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@humanize/ui/components/select";
import { Switch } from "@humanize/ui/components/switch";
import {
  languageFlags,
  languages,
  lengthModes,
  purposeIcons,
  purposes,
  readabilityIcons,
  readabilityLevels,
} from "../constants";

type EditorControlsProps = {
  readabilityLevel: string;
  setReadabilityLevel: (value: string) => void;
  purpose: string;
  setPurpose: (value: string) => void;
  lengthMode: string;
  setLengthMode: (value: "shorten" | "expand" | "standard") => void;
  selectedLanguage: string;
  setSelectedLanguage: (value: string) => void;
  advancedMode: boolean;
  setAdvancedMode: (value: boolean) => void;
  hasStyleSample: boolean;
  onOpenStyleModal: () => void;
};

export function EditorControls({
  readabilityLevel,
  setReadabilityLevel,
  purpose,
  setPurpose,
  lengthMode,
  setLengthMode,
  selectedLanguage,
  setSelectedLanguage,
  advancedMode,
  setAdvancedMode,
  hasStyleSample,
  onOpenStyleModal,
}: EditorControlsProps) {
  return (
    <div className="flex flex-col gap-2 bg-transparent px-3 py-2 sm:flex-row sm:items-center sm:gap-3 sm:px-4 sm:py-3 md:gap-4 md:px-6 md:py-4 dark:bg-background/50">
      <Select
        onValueChange={setReadabilityLevel}
        value={readabilityLevel || undefined}
      >
        <SelectTrigger className="h-9 w-full cursor-pointer border-border bg-card text-card-foreground sm:w-select-large dark:border-select-bg dark:bg-select-bg dark:text-white">
          <SelectValue placeholder="Select Readability Level" />
        </SelectTrigger>
        <SelectContent className="border-border bg-card dark:border-select-bg dark:bg-select-bg">
          {readabilityLevels.map((level) => (
            <SelectItem
              className="cursor-pointer text-card-foreground dark:text-white dark:focus:bg-select-hover"
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

      <Select onValueChange={setPurpose} value={purpose || undefined}>
        <SelectTrigger className="h-9 w-full cursor-pointer border-border bg-card text-card-foreground sm:w-select-large dark:border-select-bg dark:bg-select-bg dark:text-white">
          <SelectValue placeholder="Select Purpose" />
        </SelectTrigger>
        <SelectContent className="border-border bg-card dark:border-select-bg dark:bg-select-bg">
          {purposes.map((p) => (
            <SelectItem
              className="cursor-pointer text-card-foreground dark:text-white dark:focus:bg-select-hover"
              key={p.value}
              value={p.value}
            >
              <div className="flex items-center gap-2">
                {purposeIcons[p.value] && <span>{purposeIcons[p.value]}</span>}
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
            ? "border-brand-primary bg-brand-primary text-white hover:bg-brand-primary/90 dark:border-brand-primary dark:bg-brand-primary dark:text-white dark:hover:bg-brand-primary/90"
            : "border-border bg-card text-muted-foreground hover:bg-muted dark:border-select-bg dark:bg-select-bg dark:text-white dark:hover:bg-select-hover"
        }`}
        onClick={onOpenStyleModal}
        variant={hasStyleSample ? "default" : "outline"}
      >
        {hasStyleSample ? "My Writing Style" : "Personalize"}
      </Button>

      {/* Advanced Mode Toggle */}
      <div className="flex items-center gap-2">
        <label
          className="flex cursor-pointer items-center gap-2 font-medium text-card-foreground text-sm"
          htmlFor="advanced-mode-toggle"
        >
          <Switch
            checked={advancedMode}
            id="advanced-mode-toggle"
            onCheckedChange={setAdvancedMode}
          />
          <span className="whitespace-nowrap">Advanced mode</span>
        </label>
      </div>

      <Select
        onValueChange={setSelectedLanguage}
        value={selectedLanguage || undefined}
      >
        <SelectTrigger className="h-9 w-full cursor-pointer border-border bg-card text-card-foreground sm:w-select-medium dark:border-select-bg dark:bg-select-bg dark:text-white">
          <SelectValue placeholder="Auto-detect" />
        </SelectTrigger>
        <SelectContent className="min-w-select-content border-border bg-card dark:border-select-bg dark:bg-select-bg [&>div>div]:grid [&>div>div]:grid-cols-3 [&>div>div]:gap-0">
          <SelectGroup>
            {languages.map((lang) => (
              <SelectItem
                className="cursor-pointer text-card-foreground dark:text-white dark:focus:bg-select-hover"
                key={lang}
                value={lang}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {languageFlags[lang] && (
                      <span
                        aria-label={`${lang} flag`}
                        className="text-lg leading-none"
                        role="img"
                        style={
                          {
                            fontFamily:
                              "Apple Color Emoji, Segoe UI Emoji, Segoe UI Symbol, Noto Color Emoji, Twemoji Mozilla, emoji",
                            fontSize: "1.25rem",
                            lineHeight: "1",
                            display: "inline-block",
                            minWidth: "1.5rem",
                            textAlign: "center",
                          } as React.CSSProperties
                        }
                        suppressHydrationWarning
                      >
                        {languageFlags[lang]}
                      </span>
                    )}
                    <span>{lang}</span>
                  </div>
                </div>
              </SelectItem>
            ))}
          </SelectGroup>
          <SelectSeparator className="col-span-3 dark:bg-separator-bg" />
          <SelectItem
            className="col-span-3 cursor-pointer text-card-foreground dark:text-white dark:focus:bg-select-hover"
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
        <SelectTrigger className="h-9 w-full cursor-pointer border-border bg-card text-card-foreground sm:w-select-small dark:border-select-bg dark:bg-select-bg dark:text-white">
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="border-border bg-card dark:border-select-bg dark:bg-select-bg">
          {lengthModes.map((mode) => (
            <SelectItem
              className="cursor-pointer text-card-foreground dark:text-white dark:focus:bg-select-hover"
              key={mode.value}
              value={mode.value}
            >
              {mode.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
