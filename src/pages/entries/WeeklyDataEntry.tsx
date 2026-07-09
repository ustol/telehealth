import * as React from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { EntryForm } from "@/components/entries/EntryForm";
import { EntryTable } from "@/components/entries/EntryTable";
import { EntryDetails } from "@/components/entries/EntryDetails";
import { useCreateEntry, useEntries, useSoftDeleteEntry, useUpdateEntry, type EntryComputedRow } from "@/hooks/useEntries";
import type { EntryFormValues } from "@/components/entries/entrySchema";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import { canEditEntries, canModifyEntries, canDeleteEntries } from "@/lib/roles";

function toFormValues(row: EntryComputedRow): Partial<EntryFormValues> {
  return {
    reporting_period_id: row.reporting_period_id ?? undefined,
    weekly_cycle_id: row.weekly_cycle_id ?? undefined,
    date_of_interaction: row.date_of_interaction,
    cro_name: row.cro_name ?? "",
    ssnit_number: row.ssnit_number,
    telephone_number: row.telephone_number ?? "",
    alternative_contact_number: row.alternative_contact_number ?? "",
    email_address: row.email_address ?? "",
    contact_unavailable: false,
    physical_location: row.physical_location ?? "",
    region_id: row.region_id ?? undefined,
    engagement_type_id: row.engagement_type_id ?? undefined,
    digital_channel_id: row.digital_channel_id ?? undefined,
    feedback_category_id: row.feedback_category_id ?? undefined,
    detailed_feedback_narrative: row.detailed_feedback_narrative ?? "",
    successful_contact: row.successful_contact ? "Yes" : "No",
    issue_resolved: row.issue_resolved ? "Yes" : "No",
    escalation_required: row.escalation_required ? "Yes" : "No",
    key_observation: row.key_observation ?? "",
    root_cause: row.root_cause ?? "",
    emerging_trend: row.emerging_trend ?? "",
    recommendation: row.recommendation ?? "",
    priority_level_id: row.priority_level_id ?? undefined,
    responsible_unit_id: row.responsible_unit_id ?? undefined,
    status_id: row.status_id ?? undefined,
  };
}

export default function WeeklyDataEntry() {
  const { data: entries, isLoading } = useEntries();
  const createEntry = useCreateEntry();
  const updateEntry = useUpdateEntry();
  const softDeleteEntry = useSoftDeleteEntry();
  const { profile, roles } = useAuth();
  const [open, setOpen] = React.useState(false);
  const [viewing, setViewing] = React.useState<EntryComputedRow | null>(null);
  const [editing, setEditing] = React.useState<EntryComputedRow | null>(null);
  const [deleting, setDeleting] = React.useState<EntryComputedRow | null>(null);

  const canEdit = canEditEntries(roles);
  const canModify = canModifyEntries(roles);
  const canDelete = canDeleteEntries(roles);

  async function handleCreate(values: EntryFormValues) {
    if (!profile?.institution_id) {
      toast({ title: "No institution assigned", description: "Contact your System Admin.", variant: "destructive" });
      return;
    }
    try {
      const { email_address, contact_unavailable: _contact_unavailable, ...rest } = values;
      await createEntry.mutateAsync({
        ...rest,
        email_address: email_address || null,
        institution_id: profile.institution_id,
        created_by: profile.id,
        updated_by: profile.id,
        successful_contact: values.successful_contact === "Yes",
        issue_resolved: values.issue_resolved === "Yes",
        escalation_required: values.escalation_required === "Yes",
      });
      toast({ title: "Entry saved", variant: "success" });
      setOpen(false);
    } catch (err) {
      toast({ title: "Failed to save entry", description: (err as Error).message, variant: "destructive" });
    }
  }

  async function handleUpdate(values: EntryFormValues) {
    if (!editing || !profile) return;
    try {
      const { email_address, contact_unavailable: _contact_unavailable, ...rest } = values;
      await updateEntry.mutateAsync({
        id: editing.id,
        ...rest,
        email_address: email_address || null,
        updated_by: profile.id,
        successful_contact: values.successful_contact === "Yes",
        issue_resolved: values.issue_resolved === "Yes",
        escalation_required: values.escalation_required === "Yes",
      });
      toast({ title: "Entry updated", variant: "success" });
      setEditing(null);
    } catch (err) {
      toast({ title: "Failed to update entry", description: (err as Error).message, variant: "destructive" });
    }
  }

  async function handleDelete() {
    if (!deleting) return;
    try {
      await softDeleteEntry.mutateAsync(deleting.id);
      toast({ title: "Entry deleted", variant: "success" });
      setDeleting(null);
    } catch (err) {
      toast({ title: "Failed to delete entry", description: (err as Error).message, variant: "destructive" });
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Data Entry</h1>
          <p className="text-muted-foreground">Capture telemedicine interactions for SSNIT pensioners.</p>
        </div>
        {canEdit && (
          <Dialog open={open} onOpenChange={setOpen}>
            <Button onClick={() => setOpen(true)}>
              <Plus className="h-4 w-4" /> New Entry
            </Button>
            <DialogContent className="max-w-3xl">
              <DialogHeader>
                <DialogTitle>New Telemedicine Interaction</DialogTitle>
              </DialogHeader>
              <EntryForm existingEntries={entries ?? []} onSubmit={handleCreate} />
            </DialogContent>
          </Dialog>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Entries</CardTitle>
          <CardDescription>
            Entry IDs are assigned automatically (TTH-0001, TTH-0002, …). Duplicate, missing-contact, and phone-check
            flags are computed live and shown per row.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading entries…</p>
          ) : (
            <EntryTable
              data={entries ?? []}
              canEdit={canModify}
              canDelete={canDelete}
              onView={setViewing}
              onEdit={setEditing}
              onDelete={setDeleting}
            />
          )}
        </CardContent>
      </Card>

      <Dialog open={!!viewing} onOpenChange={(o) => !o && setViewing(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Entry {viewing?.entry_id}</DialogTitle>
          </DialogHeader>
          {viewing && <EntryDetails entry={viewing} />}
        </DialogContent>
      </Dialog>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Edit Entry {editing?.entry_id}</DialogTitle>
          </DialogHeader>
          {editing && (
            <EntryForm
              defaultValues={toFormValues(editing)}
              existingEntries={(entries ?? []).filter((e) => e.id !== editing.id)}
              onSubmit={handleUpdate}
              submitLabel="Save Changes"
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete entry {deleting?.entry_id}?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            This removes the entry for SSNIT Number {deleting?.ssnit_number} from all reports. This cannot be undone
            from the app.
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setDeleting(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={softDeleteEntry.isPending}>
              {softDeleteEntry.isPending ? "Deleting…" : "Delete"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
