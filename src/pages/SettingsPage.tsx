import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Save, Bot, Volume2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { motion } from "framer-motion";

const defaultPersonality = "Eres un asistente personal inteligente, amable y profesional. Respondes en el mismo idioma que el usuario. Eres conciso pero completo. Usas markdown para formatear tus respuestas cuando es apropiado (listas, código, negritas, etc). Tu nombre es Nova.";

const presetPersonalities = [
  { label: "Profesional", value: "Eres un asistente profesional y formal. Das respuestas estructuradas, precisas y orientadas a resultados. Tu nombre es Nova." },
  { label: "Amigable", value: "Eres un asistente súper amigable y cercano, como un mejor amigo. Usas un tono casual, emojis ocasionales y eres muy empático. Tu nombre es Nova." },
  { label: "Creativo", value: "Eres un asistente creativo e imaginativo. Te encanta proponer ideas originales, usar metáforas y pensar fuera de la caja. Tu nombre es Nova." },
  { label: "Técnico", value: "Eres un asistente técnico experto. Das explicaciones detalladas con terminología precisa, ejemplos de código y referencias técnicas. Tu nombre es Nova." },
];

const voiceOptions = [
  { id: "EXAVITQu4vr4xnSDxMaL", label: "Sarah", desc: "Femenina, amigable" },
  { id: "FGY2WhTYpPnrIDTdsKH5", label: "Laura", desc: "Femenina, cálida" },
  { id: "pFZP5JQG7iQjIQuC4Bku", label: "Lily", desc: "Femenina, suave" },
  { id: "JBFqnCBsd6RMkjVDRZzb", label: "George", desc: "Masculina, profunda" },
  { id: "TX3LPaxmHKxFdv7VOQHJ", label: "Liam", desc: "Masculina, clara" },
  { id: "onwK4e9ZLuTAKqWW03F9", label: "Daniel", desc: "Masculina, natural" },
  { id: "CwhRBWXzGAHq8TQ4Fs17", label: "Roger", desc: "Masculina, madura" },
  { id: "cgSgspJ2msm6clMCkdW9", label: "Jessica", desc: "Femenina, expresiva" },
];

export default function SettingsPage() {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [personality, setPersonality] = useState(defaultPersonality);
  const [voiceId, setVoiceId] = useState("EXAVITQu4vr4xnSDxMaL");
  const [previewingVoice, setPreviewingVoice] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
      const { data: settings } = await supabase.from("user_settings").select("*").eq("user_id", user.id).single();
      if (profile) setUsername(profile.username || "");
      if (settings) {
        setDisplayName(settings.display_name || "");
        if (settings.personality) setPersonality(settings.personality);
        if (settings.voice_id) setVoiceId(settings.voice_id);
      }
    };
    load();
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    await supabase.from("profiles").update({ username }).eq("id", user.id);
    await supabase.from("user_settings").update({ display_name: displayName, personality, voice_id: voiceId }).eq("user_id", user.id);
    toast.success("Ajustes guardados");
    setSaving(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card px-4 py-3">
        <div className="mx-auto flex max-w-2xl items-center gap-3">
          <button onClick={() => navigate("/")} className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-lg font-semibold text-foreground">Ajustes</h1>
        </div>
      </header>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-auto max-w-2xl space-y-6 p-6"
      >
        {/* Profile */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <h2 className="mb-4 text-base font-semibold text-foreground">Perfil</h2>
          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">Email</label>
              <Input value={user?.email || ""} disabled className="bg-muted" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">Nombre de usuario</label>
              <Input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="tu_usuario" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">Nombre para mostrar</label>
              <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Tu Nombre" />
            </div>
          </div>
        </div>

        {/* Personality - Admin only */}
        {isAdmin && (
          <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <Bot className="h-5 w-5 text-primary" />
              <h2 className="text-base font-semibold text-foreground">Personalidad de Nova</h2>
            </div>
            <p className="mb-4 text-sm text-muted-foreground">
              Personaliza cómo se comporta Nova. Elige un preset o escribe tu propia instrucción.
            </p>
            <div className="mb-4 flex flex-wrap gap-2">
              {presetPersonalities.map((p) => (
                <button
                  key={p.label}
                  onClick={() => setPersonality(p.value)}
                  className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                    personality === p.value
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground"
                  }`}
                >
                  {p.label}
                </button>
              ))}
              <button
                onClick={() => setPersonality(defaultPersonality)}
                className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground"
              >
                Restablecer
              </button>
            </div>
            <Textarea
              value={personality}
              onChange={(e) => setPersonality(e.target.value)}
              placeholder="Describe cómo quieres que se comporte Nova..."
              rows={4}
              className="resize-none"
            />
          </div>
        )}

        {/* Voice - Admin only */}
        {isAdmin && (
          <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <Volume2 className="h-5 w-5 text-primary" />
              <h2 className="text-base font-semibold text-foreground">Voz de Nova</h2>
            </div>
            <p className="mb-4 text-sm text-muted-foreground">
              Elige la voz que usará Nova al hablar sus respuestas.
            </p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {voiceOptions.map((v) => (
                <button
                  key={v.id}
                  onClick={() => setVoiceId(v.id)}
                  className={`rounded-lg border p-3 text-left transition-colors ${
                    voiceId === v.id
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <p className={`text-sm font-medium ${voiceId === v.id ? "text-primary" : "text-foreground"}`}>
                    {v.label}
                  </p>
                  <p className="text-xs text-muted-foreground">{v.desc}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        <Button onClick={handleSave} disabled={saving} className="gap-2">
          <Save className="h-4 w-4" />
          {saving ? "Guardando..." : "Guardar cambios"}
        </Button>
      </motion.div>
    </div>
  );
}