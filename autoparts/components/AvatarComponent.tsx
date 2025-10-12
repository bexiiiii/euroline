import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/lib/stores/authStore";
import { useNotificationsStore } from "@/lib/stores/notificationsStore";
import { useEffect } from "react";

type AvatarComponentProps = {
  className?: string;
};

const getInitials = (name?: string, surname?: string) => {
  const parts = [surname, name].filter(Boolean);
  if (parts.length === 0) return "EU";
  return parts
    .map((part) => part!.trim().charAt(0).toUpperCase())
    .join("")
    .slice(0, 2);
};

export default function AvatarComponent({ className }: AvatarComponentProps) {
  const { user } = useAuthStore();
  const unreadCount = useNotificationsStore((state) => state.unreadCount);
  const loadUnreadCount = useNotificationsStore((state) => state.loadUnreadCount);
  const subscribe = useNotificationsStore((state) => state.subscribe);
  const unsubscribe = useNotificationsStore((state) => state.unsubscribe);
  const initials = getInitials(user?.name, user?.surname);
  const avatarUrl =
    typeof (user as unknown as { avatarUrl?: string })?.avatarUrl === "string"
      ? ((user as unknown as { avatarUrl?: string }).avatarUrl ?? "").trim()
      : "";

  useEffect(() => {
    if (!user) return;
    loadUnreadCount().catch(() => {});
    subscribe();
    return () => {
      unsubscribe();
    };
  }, [user, loadUnreadCount, subscribe, unsubscribe]);

  return (
    <div className="relative inline-flex">
      <Avatar className={cn("h-10 w-10 border border-slate-200", className)}>
        {avatarUrl && (
          <AvatarImage
            src={avatarUrl}
            alt={user?.clientName || "Профиль"}
            className="object-cover"
          />
        )}
        <AvatarFallback className="bg-slate-100 text-slate-700 text-sm font-semibold">
          {initials}
        </AvatarFallback>
      </Avatar>
      {unreadCount > 0 && (
        <span className="absolute -right-0.5 -top-0.5 flex h-3 w-3">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-orange-500 opacity-75"></span>
          <span className="relative inline-flex h-3 w-3 rounded-full bg-orange-500"></span>
        </span>
      )}
    </div>
  );
}
