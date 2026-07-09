import * as React from "react";
import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type SortingState,
} from "@tanstack/react-table";
import { ArrowUpDown, Eye, Pencil, Trash2 } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import type { EntryComputedRow } from "@/hooks/useEntries";

interface EntryTableProps {
  data: EntryComputedRow[];
  canEdit?: boolean;
  canDelete?: boolean;
  onView: (row: EntryComputedRow) => void;
  onEdit?: (row: EntryComputedRow) => void;
  onDelete?: (row: EntryComputedRow) => void;
}

function SortableHeader({ label, column }: { label: string; column: { toggleSorting: (desc?: boolean) => void; getIsSorted: () => false | "asc" | "desc" } }) {
  return (
    <Button variant="ghost" size="sm" className="-ml-3 h-8" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
      {label}
      <ArrowUpDown className="h-3.5 w-3.5" />
    </Button>
  );
}

export function EntryTable({ data, canEdit, canDelete, onView, onEdit, onDelete }: EntryTableProps) {
  const [sorting, setSorting] = React.useState<SortingState>([{ id: "date_of_interaction", desc: true }]);

  const columns = React.useMemo<ColumnDef<EntryComputedRow>[]>(
    () => [
      { accessorKey: "entry_id", header: "Entry ID" },
      {
        accessorKey: "date_of_interaction",
        header: ({ column }) => <SortableHeader label="Date" column={column} />,
        cell: ({ row }) => formatDate(row.original.date_of_interaction),
      },
      { accessorKey: "reporting_period", header: "Period" },
      { accessorKey: "weekly_cycle", header: "Cycle" },
      { accessorKey: "ssnit_number", header: "SSNIT Number" },
      { accessorKey: "region", header: "Region" },
      { accessorKey: "engagement_type", header: "Engagement Type" },
      { accessorKey: "feedback_category", header: "Feedback" },
      {
        accessorKey: "priority_level",
        header: "Priority",
        cell: ({ row }) => {
          const v = row.original.priority_level;
          if (!v) return "—";
          const variant = v === "High" ? "destructive" : v === "Medium" ? "warning" : "secondary";
          return <Badge variant={variant}>{v}</Badge>;
        },
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => {
          const v = row.original.status;
          const variant = v === "Open" ? "warning" : v === "Closed" ? "success" : "secondary";
          return <Badge variant={variant}>{v ?? "—"}</Badge>;
        },
      },
      {
        id: "flags",
        header: "Flags",
        cell: ({ row }) => {
          const e = row.original;
          return (
            <div className="flex flex-wrap gap-1">
              {e.duplicate_flag && <Badge variant="destructive">DUPLICATE</Badge>}
              {e.contact_missing && <Badge variant="warning">MISSING CONTACT</Badge>}
              {e.phone_check && <Badge variant="warning">CHECK NUMBER</Badge>}
            </div>
          );
        },
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => (
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8" title="View" onClick={() => onView(row.original)}>
              <Eye className="h-4 w-4" />
            </Button>
            {canEdit && (
              <Button variant="ghost" size="icon" className="h-8 w-8" title="Edit" onClick={() => onEdit?.(row.original)}>
                <Pencil className="h-4 w-4" />
              </Button>
            )}
            {canDelete && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                title="Delete"
                onClick={() => onDelete?.(row.original)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        ),
      },
    ],
    [canEdit, canDelete, onView, onEdit, onDelete]
  );

  const table = useReactTable({
    data,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 15 } },
  });

  return (
    <div className="space-y-3">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id}>
                {hg.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground">
                  No entries yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount() || 1}
        </p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
            Previous
          </Button>
          <Button variant="outline" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
