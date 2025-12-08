import mammoth from "mammoth";
import * as pdfjsLib from "pdfjs-dist";
import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";
import type { FileType } from "../types";
import { getFileType } from "../utils";

export function useFileUpload() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isParsingFile, setIsParsingFile] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const parsePdf = useCallback(async (file: File): Promise<string> => {
    try {
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
    } catch (pdfError) {
      const errorMessage =
        pdfError instanceof Error ? pdfError.message : String(pdfError);
      throw new Error(
        `Failed to parse PDF file: ${errorMessage}. Please try copying and pasting the text directly, or ensure the file is not corrupted.`
      );
    }
  }, []);

  const parseDocx = useCallback(async (file: File): Promise<string> => {
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    if (result.messages.length > 0) {
      console.warn("DOCX parsing warnings:", result.messages);
    }
    return result.value.trim();
  }, []);

  const parseTxt = useCallback(async (file: File): Promise<string> => {
    const text = await file.text();
    return text.trim();
  }, []);

  const resetFileInput = useCallback(() => {
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, []);

  const ensureSupportedFileType = useCallback(
    (fileType: string) => {
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
    },
    [resetFileInput]
  );

  const extractTextFromFile = useCallback(
    (file: File, fileType: FileType): Promise<string> => {
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
    },
    [parseDocx, parsePdf, parseTxt]
  );

  const processUploadedFile = useCallback(
    async (file: File): Promise<string | null> => {
      const fileType = getFileType(file);
      if (!ensureSupportedFileType(fileType)) {
        return null;
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
          return null;
        }

        setError(null);
        toast.success("File uploaded and text extracted successfully!");
        return extractedText;
      } catch (err) {
        console.error("File parsing error:", err);
        const errorMessage =
          err instanceof Error ? err.message : "Unknown error";
        setError(
          `Failed to parse file: ${errorMessage}. Please try copying and pasting the text directly.`
        );
        return null;
      } finally {
        setIsParsingFile(false);
        resetFileInput();
      }
    },
    [ensureSupportedFileType, extractTextFromFile, resetFileInput]
  );

  const handleFileUpload = useCallback(() => {
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    fileInputRef.current?.click();
  }, []);

  return {
    fileInputRef,
    isParsingFile,
    error,
    setError,
    processUploadedFile,
    handleFileUpload,
  };
}
