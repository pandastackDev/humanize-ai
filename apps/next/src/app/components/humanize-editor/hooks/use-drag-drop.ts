import { useCallback, useRef, useState } from "react";
import { getFileType } from "../utils";

export function useDragDrop(hasInputText: boolean) {
  const dragCounterRef = useRef(0);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isDragOverValid, setIsDragOverValid] = useState(false);

  const getDraggedFile = useCallback(
    (e: React.DragEvent<HTMLElement>): File | null => {
      if (!e.dataTransfer) {
        return null;
      }
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
    },
    []
  );

  const handleContainerDragEnter = useCallback(
    (e: React.DragEvent<HTMLElement>) => {
      e.preventDefault();
      e.stopPropagation();

      if (
        typeof dragCounterRef.current !== "number" ||
        dragCounterRef.current < 0
      ) {
        dragCounterRef.current = 0;
      }
      dragCounterRef.current += 1;

      if (hasInputText) {
        return;
      }

      if (!e.dataTransfer) {
        return;
      }

      const hasFiles = e.dataTransfer.types.some(
        (type) => type === "Files" || type === "application/x-moz-file"
      );
      if (!hasFiles) {
        setIsDragOver(false);
        setIsDragOverValid(false);
        return;
      }

      setIsDragOver(true);

      try {
        const file = getDraggedFile(e);
        if (file) {
          const type = getFileType(file);
          const isValidType =
            type === "pdf" || type === "docx" || type === "txt";
          setIsDragOverValid(isValidType);
        } else {
          setIsDragOverValid(true);
        }
      } catch {
        setIsDragOverValid(false);
      }
    },
    [hasInputText, getDraggedFile]
  );

  const handleContainerDragLeave = useCallback(
    (e: React.DragEvent<HTMLElement>) => {
      e.preventDefault();
      e.stopPropagation();

      if (
        typeof dragCounterRef.current !== "number" ||
        dragCounterRef.current < 0
      ) {
        dragCounterRef.current = 0;
      } else {
        dragCounterRef.current -= 1;
      }

      if (dragCounterRef.current <= 0) {
        dragCounterRef.current = 0;
        setIsDragOver(false);
        setIsDragOverValid(false);
      }
    },
    []
  );

  const handleContainerDragOver = useCallback(
    (e: React.DragEvent<HTMLElement>) => {
      e.preventDefault();
      e.stopPropagation();

      if (hasInputText) {
        return;
      }

      if (!e.dataTransfer) {
        return;
      }

      e.dataTransfer.dropEffect = "copy";

      const hasFiles = e.dataTransfer.types.some(
        (type) => type === "Files" || type === "application/x-moz-file"
      );
      if (!hasFiles) {
        setIsDragOver(false);
        setIsDragOverValid(false);
        return;
      }

      setIsDragOver(true);

      try {
        const file = getDraggedFile(e);
        if (file) {
          const type = getFileType(file);
          const isValidType =
            type === "pdf" || type === "docx" || type === "txt";
          setIsDragOverValid(isValidType);
        }
      } catch {
        setIsDragOverValid(false);
      }
    },
    [hasInputText, getDraggedFile]
  );

  const handleContainerDrop = useCallback(
    async (
      e: React.DragEvent<HTMLElement>,
      processUploadedFile: (file: File) => Promise<string | null>,
      onTextExtracted?: (text: string) => void
    ) => {
      e.preventDefault();
      e.stopPropagation();

      dragCounterRef.current = 0;
      setIsDragOver(false);
      setIsDragOverValid(false);

      if (hasInputText) {
        return;
      }

      if (!e.dataTransfer) {
        return;
      }

      const file = getDraggedFile(e);
      if (!file) {
        return;
      }

      try {
        const extractedText = await processUploadedFile(file);
        if (extractedText && extractedText.trim().length > 0) {
          if (onTextExtracted) {
            onTextExtracted(extractedText);
            console.log(
              "Drag-drop: Text set to input area, length:",
              extractedText.length
            );
          } else {
            console.warn("Drag-drop: Text extracted but no callback provided");
          }
        } else {
          console.warn("Drag-drop: No text extracted from file");
        }
      } catch (error) {
        console.error("Drag-drop: Error processing file:", error);
      }
    },
    [hasInputText, getDraggedFile]
  );

  return {
    isDragOver,
    isDragOverValid,
    handleContainerDragEnter,
    handleContainerDragLeave,
    handleContainerDragOver,
    handleContainerDrop,
  };
}
