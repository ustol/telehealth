import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { supabase } from "@/lib/supabase";
import { writeAudit } from "@/lib/audit";
import type { EntryComputedRow } from "@/hooks/useEntries";
import type { Json } from "@/types/database";

export const EXPORT_COLUMNS: { key: keyof EntryComputedRow; label: string }[] = [
  { key: "entry_id", label: "Entry ID" },
  { key: "date_of_interaction", label: "Date" },
  { key: "reporting_period", label: "Period" },
  { key: "weekly_cycle", label: "Cycle" },
  { key: "quarter", label: "Quarter" },
  { key: "patient_full_name", label: "Patient" },
  { key: "region", label: "Region" },
  { key: "engagement_type", label: "Engagement Type" },
  { key: "feedback_category", label: "Feedback Category" },
  { key: "priority_level", label: "Priority" },
  { key: "responsible_unit", label: "Responsible Unit" },
  { key: "status", label: "Status" },
];

function toRows(entries: EntryComputedRow[]) {
  return entries.map((e) => EXPORT_COLUMNS.map((c) => String(e[c.key] ?? "")));
}

async function recordSnapshot(format: "pdf" | "excel" | "csv", periodLabel: string, params: Record<string, unknown>) {
  const { data: userData } = await supabase.auth.getUser();
  await supabase.from("report_snapshots").insert({
    report_type: "weekly",
    period_label: periodLabel,
    generated_by: userData.user?.id,
    export_format: format,
    params: params as Json,
  });
  await writeAudit(`Exported report as ${format.toUpperCase()}`, "export", { details: params });
}

const BRAND_TITLE = "Telehealth Reporting — The Trust Hospital & SSNIT";

export async function exportPdf(entries: EntryComputedRow[], periodLabel: string, filters: Record<string, unknown>) {
  const doc = new jsPDF({ orientation: "landscape" });
  doc.setFontSize(14);
  doc.text(BRAND_TITLE, 14, 16);
  doc.setFontSize(10);
  doc.text(`Report period: ${periodLabel} · Generated ${new Date().toLocaleString()}`, 14, 22);

  autoTable(doc, {
    startY: 28,
    head: [EXPORT_COLUMNS.map((c) => c.label)],
    body: toRows(entries),
    styles: { fontSize: 7 },
    headStyles: { fillColor: [42, 120, 214] },
  });

  doc.save(`telehealth-report-${Date.now()}.pdf`);
  await recordSnapshot("pdf", periodLabel, filters);
}

export async function exportExcel(entries: EntryComputedRow[], periodLabel: string, filters: Record<string, unknown>) {
  const worksheet = XLSX.utils.aoa_to_sheet([EXPORT_COLUMNS.map((c) => c.label), ...toRows(entries)]);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Entries");
  XLSX.writeFile(workbook, `telehealth-report-${Date.now()}.xlsx`);
  await recordSnapshot("excel", periodLabel, filters);
}

export async function exportCsv(entries: EntryComputedRow[], periodLabel: string, filters: Record<string, unknown>) {
  const worksheet = XLSX.utils.aoa_to_sheet([EXPORT_COLUMNS.map((c) => c.label), ...toRows(entries)]);
  const csv = XLSX.utils.sheet_to_csv(worksheet);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `telehealth-report-${Date.now()}.csv`;
  link.click();
  URL.revokeObjectURL(url);
  await recordSnapshot("csv", periodLabel, filters);
}
