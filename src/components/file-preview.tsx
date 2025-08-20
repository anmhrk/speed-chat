import type { FileUIPart } from 'ai';
import { Loader2, X } from 'lucide-react';
import Image from 'next/image';
import { memo, useMemo } from 'react';
import { Button } from './ui/button';

function FilePreview({
  filesToSend,
  filesToUpload,
  isUploading,
  removeFile,
}: {
  filesToSend: FileUIPart[];
  filesToUpload: File[];
  isUploading: boolean;
  removeFile: (file: File) => void;
}) {
  const previews = useMemo(
    () =>
      filesToUpload.map((file) => {
        const isFileUploaded = filesToSend.some(
          (f) => f.filename === file.name
        );

        return (
          <div className="group relative" key={file.name}>
            <Image
              alt={file.name ?? 'Uploaded image'}
              className="h-20 w-20 cursor-pointer rounded-md object-cover"
              height={80}
              loading="lazy"
              onClick={() => window.open(URL.createObjectURL(file), '_blank')}
              src={URL.createObjectURL(file)}
              width={80}
            />
            {isUploading && !isFileUploaded && (
              <div className="absolute top-0 right-0 bottom-0 left-0 flex items-center justify-center rounded-md bg-black/50">
                <Loader2 className="size-6 animate-spin text-white" />
              </div>
            )}
            {!(isUploading && !isFileUploaded) && (
              <Button
                className="!bg-black/90 hover:!bg-black/90 absolute top-0 right-0 h-6 w-6 rounded-full text-white opacity-0 transition-opacity hover:text-white group-hover:opacity-100"
                onClick={() => removeFile(file)}
                size="icon"
                variant="ghost"
              >
                <X className="size-4" />
              </Button>
            )}
          </div>
        );
      }),
    [filesToUpload, isUploading, removeFile, filesToSend]
  );

  return <div className="flex flex-wrap gap-2 px-2 pb-3">{previews}</div>;
}

export const MemoizedFilePreview = memo(FilePreview);
