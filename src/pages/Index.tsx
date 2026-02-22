import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";
import Chat from "./Chat";

const Index = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" replace />;

  return <Chat />;
};

export default Index;
