import { useState, useRef, useEffect } from "react";
import { Send, ImagePlus, X } from "lucide-react";
import { motion } from "framer-motion";

interface Props {
  onSend: (message: string, image?: string) => void;
  disabled: boolean;
}

export default function ChatInput({ onSend, disabled }: Props) {
  const [input, setInput] = useState("");
  const [attachedImage, setAttachedImage] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 160) + "px";
    }
  }, [input]);

  const handleSubmit = () => {
    if ((!input.trim() && !attachedImage) || disabled) return;
    onSend(input.trim() || "Analiza esta imagen", attachedImage || undefined);
    setInput("");
    setAttachedImage(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) return;
    if (file.size > 10 * 1024 * 1024) return; // 10MB max

    const reader = new FileReader();
    reader.onload = () => {
      setAttachedImage(reader.result as string);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  return (
    <div className="border-t border-border bg-card px-4 py-3">
      <div className="mx-auto max-w-3xl">
        {/* Image preview */}
        {attachedImage && (
          <div className="mb-2 relative inline-block">
            <img
              src={attachedImage}
              alt="Adjunto"
              className="h-20 w-20 rounded-lg object-cover border border-border"
            />
            <button
              onClick={() => setAttachedImage(null)}
              className="absolute -top-2 -right-2 rounded-full bg-destructive p-0.5 text-destructive-foreground shadow-sm"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        )}

        <div className="flex items-end gap-2 rounded-xl border border-border bg-background p-2 shadow-sm transition-shadow focus-within:shadow-md focus-within:ring-1 focus-within:ring-ring/20">
          {/* Image upload button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-30"
            title="Adjuntar imagen"
          >
            <ImagePlus className="h-4 w-4" />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />

          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={attachedImage ? "Describe qué quieres saber de la imagen..." : "Escribe tu mensaje..."}
            rows={1}
            className="flex-1 resize-none bg-transparent px-2 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
            disabled={disabled}
          />
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleSubmit}
            disabled={(!input.trim() && !attachedImage) || disabled}
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground transition-opacity disabled:opacity-30"
          >
            <Send className="h-4 w-4" />
          </motion.button>
        </div>
        <p className="mt-2 text-center text-xs text-muted-foreground">
          Nova puede analizar imágenes y generar nuevas. Verifica la información importante.
        </p>
      </div>
    </div>
  );
}
