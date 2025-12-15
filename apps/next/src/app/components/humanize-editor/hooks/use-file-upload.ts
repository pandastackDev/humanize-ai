import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";
import { env } from "@/env";
import { getFileType } from "../utils";

export function useFileUpload() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isParsingFile, setIsParsingFile] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const extractErrorMessage = useCallback(
    async (response: Response): Promise<string> => {
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      try {
        const errorData = await response.json();
        if (errorData.detail && typeof errorData.detail === "string") {
          errorMessage = errorData.detail;
        } else if (errorData.message && typeof errorData.message === "string") {
          errorMessage = errorData.message;
        }
      } catch {
        // If JSON parsing fails, use default error
      }
      return errorMessage;
    },
    []
  );

  const handleFetchError = useCallback(
    (fetchError: unknown, baseUrl: string): never => {
      if (fetchError instanceof Error) {
        if (fetchError.name === "AbortError") {
          console.error("File upload aborted (timeout)");
          throw new Error(
            "Request timed out. The file might be too large. Please try a smaller file or paste the text directly."
          );
        }
        if (
          fetchError.message.includes("Failed to fetch") ||
          fetchError.message.includes("NetworkError") ||
          fetchError.message.includes("Network request failed")
        ) {
          console.error(
            "Network error during file upload:",
            fetchError.message
          );
          throw new Error(
            "Network error. Please check your connection and ensure the backend server is running at " +
              baseUrl
          );
        }
        throw fetchError;
      }
      console.error("Unknown error during file upload:", fetchError);
      throw new Error(
        "Failed to parse file. Please try copying and pasting the text directly."
      );
    },
    []
  );

  const parseFileViaBackend = useCallback(
    async (file: File): Promise<string> => {
      const baseUrl = env.NEXT_PUBLIC_PYTHON_API_URL;
      if (!baseUrl) {
        throw new Error(
          "Backend API URL is not configured. Please check your environment variables."
        );
      }

      const url = `${baseUrl}/api/v1/parse-file`;
      console.log(
        "Uploading file to:",
        url,
        "File:",
        file.name,
        "Size:",
        file.size
      );

      const formData = new FormData();
      formData.append("file", file);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        console.warn("File upload timeout after 30 seconds");
        controller.abort();
      }, 30_000);

      try {
        const response = await fetch(url, {
          method: "POST",
          body: formData,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorMessage = await extractErrorMessage(response);
          console.error("File upload failed:", errorMessage);
          throw new Error(errorMessage);
        }

        const data = await response.json();
        if (!data.text || typeof data.text !== "string") {
          throw new Error(
            "No text could be extracted from the file. Please try another file or paste the text directly."
          );
        }

        console.log(
          "File parsed successfully, extracted text length:",
          data.text.length
        );
        return data.text;
      } catch (fetchError) {
        clearTimeout(timeoutId);
        return handleFetchError(fetchError, baseUrl);
      }
    },
    [extractErrorMessage, handleFetchError]
  );

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
    (file: File): Promise<string> => {
      // Use backend API for all file types
      return parseFileViaBackend(file);
    },
    [parseFileViaBackend]
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
        console.log("Starting file upload:", file.name, fileType);
        const extractedText = await extractTextFromFile(file);
        console.log(
          "File parsed successfully, text length:",
          extractedText.length
        );

        if (!extractedText || extractedText.trim().length === 0) {
          setError(
            "No text could be extracted from the file. Please try another file or paste the text directly."
          );
          return null;
        }

        setError(null);
        toast.success("File uploaded and text extracted successfully!");
        return extractedText;
      } catch (parseError) {
        console.error("File parsing error:", parseError);
        const errorMessage =
          parseError instanceof Error ? parseError.message : "Unknown error";
        setError(
          `Failed to parse file: ${errorMessage}. Please try copying and pasting the text directly.`
        );
        toast.error(`File parsing failed: ${errorMessage}`);
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
