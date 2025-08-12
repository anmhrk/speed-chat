import { api } from "@/convex/_generated/api";
import { FileUIPart } from "ai";
import { useMutation } from "convex/react";
import { useState } from "react";
import { toast } from "sonner";

interface UseAttachmentsProps {
  filesToSend: FileUIPart[];
  setFilesToSend: React.Dispatch<React.SetStateAction<FileUIPart[]>>;
}

export function useAttachments({
  filesToSend,
  setFilesToSend,
}: UseAttachmentsProps) {
  const [filesToUpload, setFilesToUpload] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const maxFileSize = 4 * 1024 * 1024;
  const supportedImageFormats = [
    "image/png",
    "image/jpeg",
    "image/jpg",
    "image/webp",
  ];

  const generateUploadUrl = useMutation(api.storage.generateUploadUrl);
  const storeFile = useMutation(api.storage.storeFile);
  const deleteFiles = useMutation(api.storage.deleteFiles);

  const startUpload = (files: File[]) => {
    setIsUploading(true);

    const uploadPromises = files.map(async (file) => {
      const postUrl = await generateUploadUrl();

      const result = await fetch(postUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });

      const { storageId } = await result.json();

      const url = await storeFile({ fileId: storageId });

      return {
        type: "file",
        filename: file.name,
        mediaType: file.type,
        url,
      };
    });

    Promise.all(uploadPromises)
      .then((urls) => {
        setFilesToSend((prev) => [...prev, ...urls] as FileUIPart[]);
      })
      .catch((error) => {
        console.error(error);
        toast.error("Failed to upload files");
      })
      .finally(() => setIsUploading(false));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    processFilesAndUpload(files);
  };

  const removeFile = (file: File) => {
    const fileToRemove = filesToSend.find((f) => f.filename === file.name);
    if (fileToRemove) {
      toast.promise(
        deleteFiles({ fileUrls: [fileToRemove.url] }).then(() => {
          setFilesToUpload((prev) => prev.filter((f) => f.name !== file.name));
          setFilesToSend((prev) =>
            prev.filter((f) => f.filename !== file.name)
          );
        }),
        {
          loading: "Removing file...",
          success: "File removed",
          error: "Failed to remove file",
        }
      );
    }
  };

  const processFilesAndUpload = (files: File[]) => {
    if (files.some((file) => !supportedImageFormats.includes(file.type))) {
      toast.error("Only image files are allowed");
      return;
    }

    // Max file size check
    const exceedMaxFiles = files.filter((file) => file.size > maxFileSize);
    if (exceedMaxFiles.length > 0) {
      toast.error(
        `File ${exceedMaxFiles.map((f) => f.name).join(", ")} size exceeds 4MB`
      );
      return;
    }

    // Duplicate file check
    const duplicateFiles = files.filter((file) =>
      filesToSend.some((f) => f.filename === file.name)
    );

    if (duplicateFiles.length > 0) {
      toast.error(
        `File ${duplicateFiles.map((f) => f.name).join(", ")} is already uploaded`
      );
      return;
    }

    // Max file count check
    if (files.length + filesToSend.length > 5) {
      toast.error("You can only upload up to 5 files");
      return;
    }

    setFilesToUpload((prev) => [...prev, ...files]);
    startUpload(files);
  };

  return {
    filesToUpload,
    isUploading,
    handleFileChange,
    removeFile,
  };
}
