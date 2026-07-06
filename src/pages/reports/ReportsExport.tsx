import * as React from "react";
import { FileDown, FileSpreadsheet, FileText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EntryTable } from "@/components/entries/EntryTable";
import { useEntries } from "@/hooks/useEntries";
import { useConfigList } from "@/hooks/useConfigLists";
import { exportCsv, exportExcel, exportPdf } from "@/lib/export";
import { toast } from "@/hooks/use-toast";

const ALL = "__all__";

export default function ReportsExport() {
  const { data: entries = [] } = useEntries();
  const { data: periods } = useConfigList("reporting_periods");
  const { data: regions } = useConfigList("regions");
  const { data: statuses } = useConfigList("statuses");
  const { data: responsibleUnits } = useConfigList("responsible_units");
  const { data: feedbackCategories } = useConfigList("feedback_categories");
  const { data: priorityLevels } = useConfigList("priority_levels");

  const [dateFrom, setDateFrom] = React.useState("");
  const [dateTo, setDateTo] = React.useState("");
  const [period, setPeriod] = React.useState(ALL);
  const [region, setRegion] = React.useState(ALL);
  const [status, setStatus] = React.useState(ALL);
  const [responsibleUnit, setResponsibleUnit] = React.useState(ALL);
  const [feedbackCategory, setFeedbackCategory] = React.useState(ALL);
  const [priority, setPriority] = React.useState(ALL);

  const filtered = React.useMemo(() => {
    return entries.filter((e) => {
      if (dateFrom && e.date_of_interaction < dateFrom) return false;
      if (dateTo && e.date_of_interaction > dateTo) return false;
      if (period !== ALL && e.reporting_period !== period) return false;
      if (region !== ALL && e.region !== region) return false;
      if (status !== ALL && e.status !== status) return false;
      if (responsibleUnit !== ALL && e.responsible_unit !== responsibleUnit) return false;
      if (feedbackCategory !== ALL && e.feedback_category !== feedbackCategory) return false;
      if (priority !== ALL && e.priority_level !== priority) return false;
      return true;
    });
  }, [entries, dateFrom, dateTo, period, region, status, responsibleUnit, feedbackCategory, priority]);

  const filterSummary = React.useMemo(
    () => ({ dateFrom, dateTo, period, region, status, responsibleUnit, feedbackCategory, priority }),
    [dateFrom, dateTo, period, region, status, responsibleUnit, feedbackCategory, priority]
  );

  const periodLabel = period !== ALL ? period : dateFrom || dateTo ? `${dateFrom || "…"} to ${dateTo || "…"}` : "All records";

  async function handleExport(format: "pdf" | "excel" | "csv") {
    if (filtered.length === 0) {
      toast({ title: "No records match the current filters", variant: "destructive" });
      return;
    }
    try {
      if (format === "pdf") await exportPdf(filtered, periodLabel, filterSummary);
      if (format === "excel") await exportExcel(filtered, periodLabel, filterSummary);
      if (format === "csv") await exportCsv(filtered, periodLabel, filterSummary);
      toast({ title: `Export ready (${format.toUpperCase()})`, variant: "success" });
    } catch (err) {
      toast({ title: "Export failed", description: (err as Error).message, variant: "destructive" });
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Reports Export</h1>
        <p className="text-muted-foreground">
          Filter telemedicine records and export a joint SSNIT / The Trust Hospital report.
        </p>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Filters</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          <div className="space-y-1.5">
            <Label>Date From</Label>
            <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Date To</Label>
            <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
          </div>
          <FilterSelect label="Reporting Period" value={period} onChange={setPeriod} options={periods?.map((p) => p.label)} />
          <FilterSelect label="Region" value={region} onChange={setRegion} options={regions?.map((r) => r.label)} />
          <FilterSelect label="Status" value={status} onChange={setStatus} options={statuses?.map((s) => s.label)} />
          <FilterSelect label="Responsible Unit" value={responsibleUnit} onChange={setResponsibleUnit} options={responsibleUnits?.map((u) => u.label)} />
          <FilterSelect label="Feedback Category" value={feedbackCategory} onChange={setFeedbackCategory} options={feedbackCategories?.map((f) => f.label)} />
          <FilterSelect label="Priority" value={priority} onChange={setPriority} options={priorityLevels?.map((p) => p.label)} />
        </CardContent>
      </Card>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">{filtered.length} record(s) match the current filters</p>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => handleExport("pdf")}>
            <FileText className="h-4 w-4" /> PDF
          </Button>
          <Button variant="outline" onClick={() => handleExport("excel")}>
            <FileSpreadsheet className="h-4 w-4" /> Excel
          </Button>
          <Button variant="outline" onClick={() => handleExport("csv")}>
            <FileDown className="h-4 w-4" /> CSV
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          <EntryTable data={filtered} />
        </CardContent>
      </Card>
    </div>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options?: string[];
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>All</SelectItem>
          {options?.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
        </SelectContent>
      </Select>
    </div>
  );
}
