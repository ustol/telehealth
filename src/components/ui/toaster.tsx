import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";

export function Toaster() {
  const { toasts, dismiss } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex w-full max-w-sm flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={cn(
            "relative rounded-lg border p-4 shadow-lg bg-card",
            t.variant === "destructive" && "border-destructive bg-destructive text-destructive-foreground",
            t.variant === "success" && "border-success bg-success text-success-foreground"
          )}
        >
          <button onClick={() => dismiss(t.id)} className="absolute right-2 top-2 opacity-70 hover:opacity-100">
            <X className="h-4 w-4" />
          </button>
          <p className="text-sm font-semibold pr-6">{t.title}</p>
          {t.description && <p className="text-sm opacity-90 mt-1">{t.description}</p>}
        </div>
      ))}
    </div>
  );
}
