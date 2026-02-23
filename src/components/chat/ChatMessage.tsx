import { Bot, User } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { motion } from "framer-motion";

interface Props {
  role: "user" | "assistant";
  content: string;
  isStreaming?: boolean;
}

export default function ChatMessage({ role, content, isStreaming }: Props) {
  const isUser = role === "user";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className={`flex gap-3 px-4 py-4`}
    >
      <div
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
          isUser ? "bg-chat-user" : "bg-primary"
        }`}
      >
        {isUser ? (
          <User className="h-4 w-4 text-chat-user-fg" />
        ) : (
          <Bot className="h-4 w-4 text-primary-foreground" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="mb-1 text-xs font-medium text-muted-foreground">
          {isUser ? "Tú" : "Nova"}
        </p>
        <div className={`prose-chat text-sm leading-relaxed text-foreground`}>
          {isUser ? (
            <p className="whitespace-pre-wrap">{content}</p>
          ) : (
            <div className={isStreaming ? "streaming-text" : ""}>
              <ReactMarkdown>{content}</ReactMarkdown>
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
