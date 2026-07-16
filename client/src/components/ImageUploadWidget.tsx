/**
 * ImageUploadWidget
 * A reusable drag-and-drop / click-to-upload widget that converts a selected
 * image to base64, calls the provided tRPC upload mutation, and returns the
 * resulting storage URL via onUploaded().
 *
 * Usage:
 *   <ImageUploadWidget
 *     onUploaded={(url) => setForm(f => ({ ...f, mediaUrl: url }))}
 *     uploadMutation={trpc.projects.uploadUpdateImage.useMutation()}
 *     currentUrl={form.mediaUrl}
 *     onClear={() => setForm(f => ({ ...f, mediaUrl: "" }))}
 *   />
 */
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Upload, X, ImageIcon, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface UploadMutation {
  mutateAsync: (input: { base64: string; mimeType: string; filename: string }) => Promise<{ url: string }>;
  isPending: boolean;
}

interface ImageUploadWidgetProps {
  onUploaded: (url: string) => void;
  uploadMutation: UploadMutation;
  currentUrl?: string;
  onClear?: () => void;
  label?: string;
  accept?: string;
  maxSizeMB?: number;
}

export default function ImageUploadWidget({
  onUploaded,
  uploadMutation,
  currentUrl,
  onClear,
  label = "Photo (optional)",
  accept = "image/jpeg,image/png,image/webp,image/gif",
  maxSizeMB = 5,
}: ImageUploadWidgetProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  async function processFile(file: File) {
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file.");
      return;
    }
    if (file.size > maxSizeMB * 1024 * 1024) {
      toast.error(`Image must be under ${maxSizeMB} MB.`);
      return;
    }
    try {
      const base64 = await fileToBase64(file);
      const result = await uploadMutation.mutateAsync({
        base64,
        mimeType: file.type,
        filename: file.name,
      });
      onUploaded(result.url);
      toast.success("Image uploaded.");
    } catch (err: any) {
      toast.error(err?.message ?? "Upload failed.");
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    // Reset input so the same file can be re-selected
    e.target.value = "";
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  }

  if (currentUrl) {
    return (
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-muted-foreground block">{label}</label>
        <div className="relative rounded-lg overflow-hidden border bg-muted/20 group">
          <img
            src={currentUrl}
            alt="Update photo"
            className="w-full max-h-48 object-cover"
          />
          {onClear && (
            <button
              type="button"
              onClick={onClear}
              className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/80"
              aria-label="Remove image"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-muted-foreground block">{label}</label>
      <div
        className={`relative border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors ${
          dragOver ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/30"
        } ${uploadMutation.isPending ? "pointer-events-none opacity-60" : ""}`}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          className="sr-only"
          onChange={handleFileChange}
        />
        {uploadMutation.isPending ? (
          <div className="flex flex-col items-center gap-2 py-2">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Uploading…</span>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 py-2">
            <div className="flex items-center gap-2 text-muted-foreground">
              <ImageIcon className="w-5 h-5" />
              <Upload className="w-4 h-4" />
            </div>
            <span className="text-xs text-muted-foreground">
              Drag & drop or <span className="text-primary underline">click to upload</span>
            </span>
            <span className="text-xs text-muted-foreground/60">JPEG, PNG, WebP or GIF · max {maxSizeMB} MB</span>
          </div>
        )}
      </div>
    </div>
  );
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Strip the data URL prefix (e.g. "data:image/jpeg;base64,")
      resolve(result.split(",")[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
