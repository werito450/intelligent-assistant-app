import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Save } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { motion } from "framer-motion";

export default function SettingsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
      const { data: settings } = await supabase.from("user_settings").select("*").eq("user_id", user.id).single();
      if (profile) setUsername(profile.username || "");
      if (settings) setDisplayName(settings.display_name || "");
    };
    load();
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    await supabase.from("profiles").update({ username }).eq("id", user.id);
    await supabase.from("user_settings").update({ display_name: displayName }).eq("user_id", user.id);
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
        className="mx-auto max-w-2xl p-6"
      >
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
          <Button onClick={handleSave} disabled={saving} className="mt-6 gap-2">
            <Save className="h-4 w-4" />
            {saving ? "Guardando..." : "Guardar cambios"}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
