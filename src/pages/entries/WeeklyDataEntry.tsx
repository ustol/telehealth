import * as React from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { EntryForm } from "@/components/entries/EntryForm";
import { EntryTable } from "@/components/entries/EntryTable";
import { useCreateEntry, useEntries } from "@/hooks/useEntries";
import type { EntryFormValues } from "@/components/entries/entrySchema";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import { canEditEntries } from "@/lib/roles";

export default function WeeklyDataEntry() {
  const { data: entries, isLoading } = useEntries();
  const createEntry = useCreateEntry();
  const { profile, roles } = useAuth();
  const [open, setOpen] = React.useState(false);

  const canEdit = canEditEntries(roles);

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Weekly Data Entry</h1>
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
            <EntryTable data={entries ?? []} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
