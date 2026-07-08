import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type KpiTone = "neutral" | "success" | "warning";

const TONE_CLASSES: Record<KpiTone, string> = {
  neutral: "bg-primary/10 text-primary",
  success: "bg-success/10 text-success",
  warning: "bg-warning/10 text-warning",
};

interface KpiCardProps {
  label: string;
  value: number | string;
  icon?: React.ComponentType<{ className?: string }>;
  tone?: KpiTone;
  className?: string;
}

export function KpiCard({ label, value, icon: Icon, tone = "neutral", className }: KpiCardProps) {
  const display = typeof value === "number" ? value.toLocaleString() : value;
  return (
    <Card className={cn(className)}>
      <CardHeader className="flex-row items-start justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
        {Icon && (
          <span className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-md", TONE_CLASSES[tone])}>
            <Icon className="h-4 w-4" />
          </span>
        )}
      </CardHeader>
      <CardContent>
        <p className="text-3xl font-semibold tracking-tight">{display}</p>
      </CardContent>
    </Card>
  );
}
