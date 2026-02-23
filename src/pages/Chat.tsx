import { useState, useRef, useEffect, useCallback } from "react";
import { Menu } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useConversations } from "@/hooks/useConversations";
import { useMessages, Message } from "@/hooks/useMessages";
import { streamChat } from "@/lib/chat-stream";
import ChatSidebar from "@/components/chat/ChatSidebar";
import ChatMessage from "@/components/chat/ChatMessage";
import ChatInput from "@/components/chat/ChatInput";
import TypingIndicator from "@/components/chat/TypingIndicator";
import EmptyChat from "@/components/chat/EmptyChat";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export default function Chat() {
  const { user } = useAuth();
  const { conversations, createConversation, updateTitle, deleteConversation } = useConversations();
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const { messages, addMessage, appendLocal, updateLastAssistant } = useMessages(activeConvId);
  const [isStreaming, setIsStreaming] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [personality, setPersonality] = useState<string>("");
  const scrollRef = useRef<HTMLDivElement>(null);

  // Load user personality
  useEffect(() => {
    if (!user) return;
    supabase.from("user_settings").select("personality").eq("user_id", user.id).single()
      .then(({ data }) => { if (data?.personality) setPersonality(data.personality); });
  }, [user]);

  // Build memory from recent past conversations
  const buildMemory = useCallback(async () => {
    if (!user || !conversations.length) return "";
    // Get last 5 conversations (excluding current) with their messages
    const pastConvs = conversations.filter(c => c.id !== activeConvId).slice(0, 5);
    if (!pastConvs.length) return "";
    
    const memoryParts: string[] = [];
    for (const conv of pastConvs) {
      const { data: msgs } = await supabase
        .from("messages")
        .select("role, content")
        .eq("conversation_id", conv.id)
        .order("created_at", { ascending: true })
        .limit(6); // first 6 messages per conversation
      if (msgs && msgs.length > 0) {
        const summary = msgs.map(m => `${m.role === "user" ? "Usuario" : "Nova"}: ${m.content.slice(0, 150)}`).join("\n");
        memoryParts.push(`[${conv.title}]\n${summary}`);
      }
    }
    return memoryParts.join("\n\n");
  }, [user, conversations, activeConvId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isStreaming]);

  const handleSend = useCallback(async (input: string) => {
    let convId = activeConvId;

    if (!convId) {
      const conv = await createConversation();
      if (!conv) return;
      convId = conv.id;
      setActiveConvId(convId);
    }

    // Add user message
    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: input,
      created_at: new Date().toISOString(),
    };
    appendLocal(userMsg);
    await addMessage("user", input);

    // Auto-title on first message
    if (messages.length === 0) {
      const title = input.slice(0, 50) + (input.length > 50 ? "..." : "");
      updateTitle(convId, title);
    }

    // Stream AI response
    setIsStreaming(true);
    let assistantContent = "";

    try {
      const chatMessages = [...messages, userMsg].map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      }));

      const memory = await buildMemory();

      await streamChat({
        messages: chatMessages,
        personality,
        memory,
        onDelta: (chunk) => {
          assistantContent += chunk;
          updateLastAssistant(assistantContent);
        },
        onDone: () => {
          setIsStreaming(false);
          if (assistantContent) {
            addMessage("assistant", assistantContent);
          }
        },
      });
    } catch (err: any) {
      setIsStreaming(false);
      toast.error(err.message || "Error al comunicarse con la IA");
    }
  }, [activeConvId, messages, createConversation, addMessage, appendLocal, updateLastAssistant, updateTitle, buildMemory, personality]);

  const handleNewChat = async () => {
    setActiveConvId(null);
  };

  const handleDelete = async (id: string) => {
    await deleteConversation(id);
    if (activeConvId === id) setActiveConvId(null);
  };

  return (
    <div className="flex h-screen bg-background">
      <ChatSidebar
        conversations={conversations}
        activeId={activeConvId}
        onSelect={setActiveConvId}
        onNew={handleNewChat}
        onDelete={handleDelete}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="flex flex-1 flex-col">
        {/* Top bar */}
        <header className="flex items-center gap-3 border-b border-border bg-card px-4 py-3">
          <button
            onClick={() => setSidebarOpen(true)}
            className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted md:hidden"
          >
            <Menu className="h-5 w-5" />
          </button>
          <h1 className="text-sm font-medium text-foreground">
            {activeConvId
              ? conversations.find((c) => c.id === activeConvId)?.title || "Conversación"
              : "Nueva conversación"}
          </h1>
        </header>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto bg-sidebar">
          {!activeConvId && messages.length === 0 ? (
            <EmptyChat onSuggestion={handleSend} />
          ) : (
            <div className="mx-auto max-w-3xl divide-y divide-border/50">
              {messages.map((msg) => (
                <ChatMessage key={msg.id} role={msg.role} content={msg.content} />
              ))}
              {isStreaming && messages[messages.length - 1]?.role !== "assistant" && (
                <TypingIndicator />
              )}
            </div>
          )}
        </div>

        <ChatInput onSend={handleSend} disabled={isStreaming} />
      </div>
    </div>
  );
}
