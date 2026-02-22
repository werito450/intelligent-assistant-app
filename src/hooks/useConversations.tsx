import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface Conversation {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export function useConversations() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchConversations = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("conversations")
      .select("*")
      .order("updated_at", { ascending: false });
    setConversations(data || []);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchConversations();
  }, [user]);

  const createConversation = async () => {
    if (!user) return null;
    const { data, error } = await supabase
      .from("conversations")
      .insert({ owner_id: user.id })
      .select()
      .single();
    if (error) return null;
    setConversations((prev) => [data, ...prev]);
    return data;
  };

  const updateTitle = async (id: string, title: string) => {
    await supabase.from("conversations").update({ title }).eq("id", id);
    setConversations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, title } : c))
    );
  };

  const deleteConversation = async (id: string) => {
    await supabase.from("conversations").delete().eq("id", id);
    setConversations((prev) => prev.filter((c) => c.id !== id));
  };

  return { conversations, isLoading, createConversation, updateTitle, deleteConversation, refetch: fetchConversations };
}
