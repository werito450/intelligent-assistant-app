import { Plus, MessageSquare, Trash2, Settings, Shield, LogOut } from "lucide-react";
import { Conversation } from "@/hooks/useConversations";
import { useAuth } from "@/hooks/useAuth";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";

interface Props {
  conversations: Conversation[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

export default function ChatSidebar({ conversations, activeId, onSelect, onNew, onDelete, isOpen, onClose }: Props) {
  const { user, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();

  return (
    <>
      {/* Mobile overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-foreground/20 backdrop-blur-sm md:hidden"
            onClick={onClose}
          />
        )}
      </AnimatePresence>

      <motion.aside
        initial={false}
        animate={{ x: isOpen ? 0 : "-100%" }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="fixed left-0 top-0 z-50 flex h-full w-72 flex-col bg-sidebar md:relative md:translate-x-0"
        style={{ transform: undefined }}
      >
        <div className="flex h-full flex-col md:animate-none" style={{ transform: "none" }}>
          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sidebar-accent">
              <MessageSquare className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-lg font-semibold text-sidebar-active">Nova</span>
          </div>

          {/* New chat */}
          <div className="px-3">
            <button
              onClick={onNew}
              className="flex w-full items-center gap-2 rounded-lg border border-sidebar-border px-3 py-2.5 text-sm text-sidebar-foreground transition-colors hover:bg-sidebar-hover hover:text-sidebar-active"
            >
              <Plus className="h-4 w-4" />
              Nueva conversación
            </button>
          </div>

          {/* Conversations */}
          <div className="mt-4 flex-1 overflow-y-auto px-3">
            <p className="mb-2 px-2 text-xs font-medium uppercase tracking-wider text-sidebar-foreground/60">
              Recientes
            </p>
            <AnimatePresence>
              {conversations.map((conv) => (
                <motion.button
                  key={conv.id}
                  layout
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  onClick={() => { onSelect(conv.id); onClose(); }}
                  className={`group mb-1 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                    activeId === conv.id
                      ? "bg-sidebar-hover text-sidebar-active"
                      : "text-sidebar-foreground hover:bg-sidebar-hover hover:text-sidebar-active"
                  }`}
                >
                  <MessageSquare className="h-4 w-4 shrink-0 opacity-60" />
                  <span className="flex-1 truncate">{conv.title}</span>
                  <Trash2
                    className="h-3.5 w-3.5 shrink-0 opacity-0 transition-opacity group-hover:opacity-60 hover:!opacity-100"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(conv.id);
                    }}
                  />
                </motion.button>
              ))}
            </AnimatePresence>
          </div>

          {/* Footer */}
          <div className="border-t border-sidebar-border p-3 space-y-1">
            <button
              onClick={() => { navigate("/settings"); onClose(); }}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-sidebar-foreground transition-colors hover:bg-sidebar-hover hover:text-sidebar-active"
            >
              <Settings className="h-4 w-4" />
              Ajustes
            </button>
            {isAdmin && (
              <button
                onClick={() => { navigate("/admin"); onClose(); }}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-sidebar-foreground transition-colors hover:bg-sidebar-hover hover:text-sidebar-active"
              >
                <Shield className="h-4 w-4" />
                Admin
              </button>
            )}
            <button
              onClick={signOut}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-sidebar-foreground transition-colors hover:bg-sidebar-hover hover:text-sidebar-active"
            >
              <LogOut className="h-4 w-4" />
              Cerrar sesión
            </button>
            <div className="px-3 pt-2 text-xs text-sidebar-foreground/40 truncate">
              {user?.email}
            </div>
          </div>
        </div>
      </motion.aside>
    </>
  );
}
