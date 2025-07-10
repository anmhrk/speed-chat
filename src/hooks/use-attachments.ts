"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useUploadThing } from "@/lib/utils";
import { toast } from "sonner";
import { deleteFiles } from "@/lib/uploadthing";
import type { FileMetadata, Models } from "@/lib/types";
import type { Attachment } from "@ai-sdk/ui-utils";
import { useDropzone } from "react-dropzone";
import { supportsPdfInput } from "@/lib/models";

export function useAttachments(model: Models) {
  const [files, setFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [droppedFiles, setDroppedFiles] = useState<File[]>([]);
  const [fileMetadata, setFileMetadata] = useState<
    Record<string, FileMetadata>
  >({});

  const acceptsPdf = supportsPdfInput(model);

  const { startUpload, isUploading } = useUploadThing("fileUploader", {
    onClientUploadComplete: (res) => {
      res.forEach((file) => {
        setFileMetadata((prev) => ({
          ...prev,
          [file.name]: {
            url: file.ufsUrl,
            name: file.name,
            type: file.type.startsWith("image/") ? "image" : "pdf",
            extension: file.type.startsWith("image/")
              ? file.type.split("/")[1]
              : "pdf",
          },
        }));
      });
    },
    onUploadError: (error: Error) => {
      console.error(error);
      toast.error("Failed to upload files");
      clearFiles();
    },
  });

  // Sync attachments with fileMetadata state
  useEffect(() => {
    const newAttachments = Object.values(fileMetadata).map((file) => ({
      name: file.name,
      contentType:
        file.type === "image" ? `image/${file.extension}` : "application/pdf",
      url: file.url,
    }));

    if (JSON.stringify(attachments) !== JSON.stringify(newAttachments)) {
      setAttachments(newAttachments);
    }
  }, [fileMetadata, attachments]);

  const handleFileDrop = (files: File[]) => {
    setDroppedFiles(files);
    setTimeout(() => setDroppedFiles([]), 100);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: handleFileDrop,
    noClick: true,
    noKeyboard: true,
    multiple: true,
  });

  const processFiles = useCallback(
    (selectedFiles: File[]) => {
      const maxFileSize = 4 * 1024 * 1024;

      const acceptedFileTypes = new Set<string>([
        "image/png",
        "image/jpeg",
        "image/jpg",
        "image/webp",
        ...(acceptsPdf ? ["application/pdf"] : []),
      ]);

      if (selectedFiles.length > 0) {
        const unsupportedFiles = selectedFiles.filter(
          (file) => !acceptedFileTypes.has(file.type)
        );

        if (unsupportedFiles.length > 0) {
          toast.error(
            `Unsupported file type${unsupportedFiles.length > 1 ? "s" : ""}: ${unsupportedFiles
              .map((f) => f.name)
              .join(", ")}`
          );
          return;
        }

        // Filter out duplicates - check against both files and fileMetadata
        const uniqueFiles = selectedFiles.filter(
          (file) =>
            !files.some((f) => f.name === file.name) && !fileMetadata[file.name]
        );

        const duplicateCount = selectedFiles.length - uniqueFiles.length;
        if (duplicateCount > 0) {
          toast.info(
            `Removed ${duplicateCount} duplicate file${duplicateCount > 1 ? "s" : ""}`
          );
        }

        // Count current files by type
        const currentImages = files.filter((file) =>
          file.type.startsWith("image/")
        ).length;
        const currentPdfs = files.filter(
          (file) => file.type === "application/pdf"
        ).length;

        // Count new files by type
        const newImages = uniqueFiles.filter((file) =>
          file.type.startsWith("image/")
        ).length;
        const newPdfs = uniqueFiles.filter(
          (file) => file.type === "application/pdf"
        ).length;

        // Calculate totals after adding new files
        const totalImages = currentImages + newImages;
        const totalPdfs = currentPdfs + newPdfs;

        // Apply file count limits based on content
        const hasPdfs = totalPdfs > 0;

        if (hasPdfs) {
          // If PDFs are present: max 2 images and 2 PDFs
          if (totalImages > 2 || totalPdfs > 2) {
            toast.error(
              "When PDFs are included, max 2 images and 2 PDFs per message"
            );
            return;
          }
        } else {
          // If no PDFs: max 5 images
          if (totalImages > 5) {
            toast.error("Max 5 images per message");
            return;
          }
        }

        // File size limit check
        const exceedsSizeLimitFiles = uniqueFiles
          .filter((file) => file.size > maxFileSize)
          .map((file) => file.name);

        if (exceedsSizeLimitFiles.length > 0) {
          toast.error(
            `Files exceeds size limit: ${exceedsSizeLimitFiles.join(", ")}`
          );
          return;
        }

        if (uniqueFiles.length > 0) {
          setFiles((prev) => [...prev, ...uniqueFiles]);
          startUpload(uniqueFiles);
        }
      }
    },
    [files, startUpload]
  );

  // Process files from dropzone
  useEffect(() => {
    if (droppedFiles && droppedFiles.length > 0) {
      processFiles(droppedFiles);
    }
  }, [droppedFiles]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const allSelectedFiles = e.target.files ? Array.from(e.target.files) : [];
    processFiles(allSelectedFiles);
  };

  const removeFile = async (fileName: string) => {
    const fileToRemove = fileMetadata[fileName];
    if (fileToRemove) {
      toast.promise(
        deleteFiles([fileToRemove.url]).finally(() => {
          setFiles((prev) => prev.filter((f) => f.name !== fileName));
          setFileMetadata((prev) => {
            const { [fileName]: _, ...rest } = prev;
            return rest;
          });
        }),
        {
          loading: "Deleting file...",
          success: "File deleted",
          error: "Failed to delete file",
        }
      );
    }
  };

  const clearFiles = () => {
    setFiles([]);
    setFileMetadata({});
  };

  return {
    fileMetadata,
    attachments,
    files,
    setFiles,
    isUploading,
    acceptsPdf,
    getRootProps,
    getInputProps,
    isDragActive,
    fileInputRef,
    handleFileChange,
    removeFile,
    clearFiles,
  };
}
