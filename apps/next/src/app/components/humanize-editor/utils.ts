import type { DetectorStyles, FileType } from "./types";

export function getLanguageCode(languageName: string): string {
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

export function getDetectorStyles(detectorName: string): DetectorStyles {
  const name = detectorName.toLowerCase();

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

  return {
    bgColor: "var(--color-detector-default-bg)",
    borderColor: "var(--color-detector-default-border)",
    textColor: "var(--color-detector-default-text)",
  };
}

export function getFileType(file: File): FileType {
  const extensionTypeMap: Record<string, FileType> = {
    ".pdf": "pdf",
    ".docx": "docx",
    ".doc": "doc",
    ".txt": "txt",
  };
  const mimeTypeMap: Record<string, FileType> = {
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
}
