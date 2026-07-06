import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface TopNPanelProps {
  title: string;
  items: string[];
  emptyLabel?: string;
}

export function TopNPanel({ title, items, emptyLabel = "No data yet" }: TopNPanelProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">{emptyLabel}</p>
        ) : (
          <ol className="space-y-2 list-decimal list-inside text-sm">
            {items.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ol>
        )}
      </CardContent>
    </Card>
  );
}
