import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Users, MessageSquare } from "lucide-react";
import { useNavigate, Navigate } from "react-router-dom";
import { motion } from "framer-motion";

interface UserRow {
  id: string;
  email: string | null;
  username: string | null;
  created_at: string;
}

export default function AdminPage() {
  const { isAdmin, isLoading } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [stats, setStats] = useState({ users: 0, conversations: 0, messages: 0 });

  useEffect(() => {
    if (!isAdmin) return;
    const load = async () => {
      const { data: profiles, count: userCount } = await supabase.from("profiles").select("*", { count: "exact" });
      const { count: convCount } = await supabase.from("conversations").select("*", { count: "exact", head: true });
      const { count: msgCount } = await supabase.from("messages").select("*", { count: "exact", head: true });
      setUsers(profiles || []);
      setStats({
        users: userCount || 0,
        conversations: convCount || 0,
        messages: msgCount || 0,
      });
    };
    load();
  }, [isAdmin]);

  if (isLoading) return null;
  if (!isAdmin) return <Navigate to="/" replace />;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card px-4 py-3">
        <div className="mx-auto flex max-w-4xl items-center gap-3">
          <button onClick={() => navigate("/")} className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-lg font-semibold text-foreground">Panel de Administración</h1>
        </div>
      </header>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mx-auto max-w-4xl p-6">
        {/* Stats */}
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[
            { label: "Usuarios", value: stats.users, icon: Users },
            { label: "Conversaciones", value: stats.conversations, icon: MessageSquare },
            { label: "Mensajes", value: stats.messages, icon: MessageSquare },
          ].map((s) => (
            <div key={s.label} className="rounded-xl border border-border bg-card p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-primary/10 p-2">
                  <s.icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{s.value}</p>
                  <p className="text-sm text-muted-foreground">{s.label}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Users table */}
        <div className="rounded-xl border border-border bg-card shadow-sm">
          <div className="border-b border-border px-5 py-4">
            <h2 className="font-semibold text-foreground">Usuarios registrados</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-muted-foreground">
                  <th className="px-5 py-3 font-medium">Email</th>
                  <th className="px-5 py-3 font-medium">Usuario</th>
                  <th className="px-5 py-3 font-medium">Registro</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-b border-border/50 last:border-0">
                    <td className="px-5 py-3 text-foreground">{u.email || "—"}</td>
                    <td className="px-5 py-3 text-foreground">{u.username || "—"}</td>
                    <td className="px-5 py-3 text-muted-foreground">
                      {new Date(u.created_at).toLocaleDateString("es")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
