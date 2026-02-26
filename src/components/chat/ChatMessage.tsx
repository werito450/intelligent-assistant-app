import { User, Volume2, Square } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { motion } from "framer-motion";
import { useState, useRef, useCallback } from "react";
import novaAvatar from "@/assets/nova-avatar.png";

interface Props {
  role: "user" | "assistant";
  content: string;
  isStreaming?: boolean;
  voiceId?: string;
}

const TTS_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/elevenlabs-tts`;

export default function ChatMessage({ role, content, isStreaming, voiceId }: Props) {
  const isUser = role === "user";
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const handleSpeak = useCallback(async () => {
    if (isPlaying && audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(TTS_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ text: content, voiceId }),
      });

      if (!response.ok) throw new Error("TTS failed");

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audioRef.current = audio;

      audio.onended = () => {
        setIsPlaying(false);
        URL.revokeObjectURL(url);
      };

      await audio.play();
      setIsPlaying(true);
    } catch {
      console.error("TTS playback failed");
    } finally {
      setIsLoading(false);
    }
  }, [content, isPlaying]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className={`flex gap-3 px-4 py-4`}
    >
      {isUser ? (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-chat-user">
          <User className="h-4 w-4 text-chat-user-fg" />
        </div>
      ) : (
        <img src={novaAvatar} alt="Nova" className="h-8 w-8 shrink-0 rounded-lg object-cover" />
      )}
      <div className="min-w-0 flex-1">
        <div className="mb-1 flex items-center gap-2">
          <p className="text-xs font-medium text-muted-foreground">
            {isUser ? "Tú" : "Nova"}
          </p>
          {!isUser && !isStreaming && content && (
            <button
              onClick={handleSpeak}
              disabled={isLoading}
              className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50"
              title={isPlaying ? "Detener" : "Escuchar"}
            >
              {isPlaying ? (
                <Square className="h-3.5 w-3.5" />
              ) : (
                <motion.div animate={isLoading ? { scale: [1, 1.2, 1] } : {}} transition={{ duration: 0.6, repeat: Infinity }}>
                  <Volume2 className="h-3.5 w-3.5" />
                </motion.div>
              )}
            </button>
          )}
        </div>
        <div className={`prose-chat text-sm leading-relaxed text-foreground`}>
          {isUser ? (
            <p className="whitespace-pre-wrap">{content}</p>
          ) : (
            <div className={isStreaming ? "streaming-text" : ""}>
              <ReactMarkdown
                components={{
                  img: ({ src, alt }) => (
                    <img
                      src={src}
                      alt={alt || "Imagen generada por Nova"}
                      className="my-3 max-w-full rounded-xl border border-border shadow-md"
                      style={{ maxHeight: 512 }}
                      loading="lazy"
                    />
                  ),
                }}
              >{content}</ReactMarkdown>
              {isStreaming && (
                <motion.span
                  className="inline-block ml-0.5 w-0.5 h-4 bg-primary align-text-bottom"
                  animate={{ opacity: [1, 0, 1] }}
                  transition={{ duration: 0.8, repeat: Infinity, ease: "easeInOut" }}
                />
              )}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
