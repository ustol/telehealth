import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useAuditLogs } from "@/hooks/useAuditLogs";

const EVENT_VARIANT: Record<string, "default" | "secondary" | "destructive" | "warning" | "success"> = {
  crud: "secondary",
  login: "success",
  logout: "secondary",
  export: "warning",
  view: "default",
};

export default function AuditLogs() {
  const { data: logs, isLoading } = useAuditLogs();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Audit Logs</h1>
        <p className="text-muted-foreground">
          Every create, update, delete, login, export, and report view is recorded here.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent Activity</CardTitle>
          <CardDescription>Showing the latest 500 events.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>When</TableHead>
                  <TableHead>Actor</TableHead>
                  <TableHead>Event</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Table</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs?.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="whitespace-nowrap text-sm">{new Date(log.created_at).toLocaleString()}</TableCell>
                    <TableCell>{log.actor_name}</TableCell>
                    <TableCell><Badge variant={EVENT_VARIANT[log.event_type]}>{log.event_type}</Badge></TableCell>
                    <TableCell>{log.action}</TableCell>
                    <TableCell className="text-muted-foreground">{log.table_name ?? "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
