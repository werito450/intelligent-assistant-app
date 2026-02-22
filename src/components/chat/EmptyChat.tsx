import { Bot, Sparkles, Code, BookOpen } from "lucide-react";
import { motion } from "framer-motion";

interface Props {
  onSuggestion: (text: string) => void;
}

const suggestions = [
  { icon: Sparkles, text: "¿Qué puedes hacer por mí?", color: "text-primary" },
  { icon: Code, text: "Ayúdame a escribir código", color: "text-accent-foreground" },
  { icon: BookOpen, text: "Explícame un concepto", color: "text-muted-foreground" },
];

export default function EmptyChat({ onSuggestion }: Props) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", stiffness: 200 }}
        className="mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-primary/10"
      >
        <Bot className="h-10 w-10 text-primary" />
      </motion.div>
      <motion.h2
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mb-2 text-2xl font-semibold text-foreground"
      >
        ¡Hola! Soy Nova
      </motion.h2>
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mb-8 text-center text-muted-foreground"
      >
        Tu asistente personal. ¿En qué puedo ayudarte?
      </motion.p>
      <div className="grid w-full max-w-md gap-3">
        {suggestions.map((s, i) => (
          <motion.button
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 + i * 0.1 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onSuggestion(s.text)}
            className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 text-left text-sm text-foreground shadow-sm transition-shadow hover:shadow-md"
          >
            <s.icon className={`h-5 w-5 shrink-0 ${s.color}`} />
            {s.text}
          </motion.button>
        ))}
      </div>
    </div>
  );
}
