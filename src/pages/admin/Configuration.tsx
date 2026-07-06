import * as React from "react";
import { Plus, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { CONFIG_TABLES, useConfigList, useConfigMutations, type ConfigTableName } from "@/hooks/useConfigLists";
import { toast } from "@/hooks/use-toast";

const LABELS: Record<ConfigTableName, string> = {
  reporting_periods: "Reporting Periods",
  weekly_cycles: "Weekly Cycles",
  engagement_types: "Engagement Types",
  digital_channels: "Digital Channels",
  feedback_categories: "Feedback Categories",
  priority_levels: "Priority Levels",
  statuses: "Statuses",
  regions: "Regions",
  responsible_units: "Responsible Units",
  platforms: "Platforms",
};

export default function Configuration() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Lists / Configuration</h1>
        <p className="text-muted-foreground">
          Manage the dropdown lists used across data entry and reports. Add a row and it appears in the relevant
          dropdown immediately — mirrors the workbook's Lists sheet.
        </p>
      </div>

      <Tabs defaultValue={CONFIG_TABLES[0]}>
        <TabsList className="flex-wrap h-auto">
          {CONFIG_TABLES.map((t) => (
            <TabsTrigger key={t} value={t}>{LABELS[t]}</TabsTrigger>
          ))}
        </TabsList>
        {CONFIG_TABLES.map((t) => (
          <TabsContent key={t} value={t}>
            <ConfigTablePanel table={t} label={LABELS[t]} />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}

function ConfigTablePanel({ table, label }: { table: ConfigTableName; label: string }) {
  const { data, isLoading } = useConfigList(table);
  const { create, update, remove } = useConfigMutations(table);
  const [newLabel, setNewLabel] = React.useState("");

  async function handleAdd() {
    if (!newLabel.trim()) return;
    try {
      await create.mutateAsync({ label: newLabel.trim(), sort_order: (data?.length ?? 0) + 1 });
      setNewLabel("");
    } catch (err) {
      toast({ title: "Failed to add item", description: (err as Error).message, variant: "destructive" });
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{label}</CardTitle>
        <CardDescription>Only System Admin can add, rename, deactivate, or remove entries.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            placeholder={`Add a new ${label.toLowerCase()} value`}
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          />
          <Button onClick={handleAdd} disabled={create.isPending}>
            <Plus className="h-4 w-4" /> Add
          </Button>
        </div>

        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Label</TableHead>
                <TableHead className="w-24">Order</TableHead>
                <TableHead className="w-24">Active</TableHead>
                <TableHead className="w-16" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <Input
                      defaultValue={item.label}
                      onBlur={(e) => {
                        if (e.target.value !== item.label) update.mutate({ id: item.id, label: e.target.value });
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      defaultValue={item.sort_order}
                      className="w-20"
                      onBlur={(e) => {
                        const n = Number(e.target.value);
                        if (n !== item.sort_order) update.mutate({ id: item.id, sort_order: n });
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <Checkbox
                      checked={item.is_active}
                      onCheckedChange={(v) => update.mutate({ id: item.id, is_active: Boolean(v) })}
                    />
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" onClick={() => remove.mutate(item.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
