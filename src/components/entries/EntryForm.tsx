import * as React from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAllConfigLists } from "@/hooks/useConfigLists";
import { computeWarnings, makeEntrySchema, type EntryFormValues } from "@/components/entries/entrySchema";
import type { EntryComputedRow } from "@/hooks/useEntries";

interface EntryFormProps {
  defaultValues?: Partial<EntryFormValues>;
  existingEntries: EntryComputedRow[];
  onSubmit: (values: EntryFormValues) => Promise<void>;
  submitLabel?: string;
}

const yesNo = ["Yes", "No"] as const;

function Req() {
  return (
    <span className="text-destructive" aria-hidden="true">
      {" "}
      *
    </span>
  );
}

export function EntryForm({ defaultValues, existingEntries, onSubmit, submitLabel = "Save Entry" }: EntryFormProps) {
  const { data: lists } = useAllConfigLists();
  const complaintId = lists?.feedback_categories.find((c) => c.label === "Complaint")?.id;
  const schema = React.useMemo(() => makeEntrySchema(complaintId), [complaintId]);

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<EntryFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { contact_unavailable: false, ...defaultValues },
  });

  const watched = watch();
  const warnings = computeWarnings(watched);

  const isDuplicate = React.useMemo(() => {
    if (!watched.ssnit_number) return false;
    return existingEntries.some((e) => e.ssnit_number === watched.ssnit_number);
  }, [existingEntries, watched.ssnit_number]);

  if (!lists) return <p className="text-sm text-muted-foreground">Loading configuration…</p>;

  return (
    <form
      onSubmit={handleSubmit(async (values) => {
        await onSubmit(values);
      })}
      className="space-y-6"
    >
      {(warnings.length > 0 || isDuplicate) && (
        <div className="rounded-md border border-warning bg-warning p-3 space-y-1">
          {isDuplicate && (
            <p className="flex items-center gap-2 text-sm font-medium text-warning-foreground">
              <AlertTriangle className="h-4 w-4 shrink-0" /> DUPLICATE — this SSNIT Number already exists. You may
              still save.
            </p>
          )}
          {warnings.map((w) => (
            <p key={w} className="flex items-center gap-2 text-sm font-medium text-warning-foreground">
              <AlertTriangle className="h-4 w-4 shrink-0" /> {w}
            </p>
          ))}
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        Fields marked <span className="font-semibold text-destructive">*</span> are required.
      </p>

      <fieldset className="space-y-3">
        <legend className="text-sm font-semibold text-primary">Reporting Information</legend>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="space-y-1.5">
            <Label>Reporting Period<Req /></Label>
            <Controller
              control={control}
              name="reporting_period_id"
              render={({ field }) => (
                <Select onValueChange={(v) => field.onChange(Number(v))} value={field.value?.toString()}>
                  <SelectTrigger><SelectValue placeholder="Select period" /></SelectTrigger>
                  <SelectContent>
                    {lists.reporting_periods.map((p) => (
                      <SelectItem key={p.id} value={p.id.toString()}>{p.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.reporting_period_id && <p className="text-xs text-destructive">{errors.reporting_period_id.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label>Weekly Cycle<Req /></Label>
            <Controller
              control={control}
              name="weekly_cycle_id"
              render={({ field }) => (
                <Select onValueChange={(v) => field.onChange(Number(v))} value={field.value?.toString()}>
                  <SelectTrigger><SelectValue placeholder="Select cycle" /></SelectTrigger>
                  <SelectContent>
                    {lists.weekly_cycles.map((c) => (
                      <SelectItem key={c.id} value={c.id.toString()}>{c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.weekly_cycle_id && <p className="text-xs text-destructive">{errors.weekly_cycle_id.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label>Date of Interaction<Req /></Label>
            <Input type="date" {...register("date_of_interaction")} />
            {errors.date_of_interaction && <p className="text-xs text-destructive">{errors.date_of_interaction.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label>CRO's Name</Label>
            <Input {...register("cro_name")} placeholder="e.g. Ama Mensah" />
          </div>
        </div>
      </fieldset>

      <fieldset className="space-y-3">
        <legend className="text-sm font-semibold text-primary">Patient Information</legend>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="space-y-1.5 sm:col-span-2">
            <Label>SSNIT Number<Req /></Label>
            <Controller
              control={control}
              name="ssnit_number"
              render={({ field }) => (
                <Input
                  maxLength={13}
                  placeholder="e.g. A123456789012"
                  value={field.value ?? ""}
                  onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                  onBlur={field.onBlur}
                />
              )}
            />
            {errors.ssnit_number && <p className="text-xs text-destructive">{errors.ssnit_number.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label>Region<Req /></Label>
            <Controller
              control={control}
              name="region_id"
              render={({ field }) => (
                <Select onValueChange={(v) => field.onChange(Number(v))} value={field.value?.toString()}>
                  <SelectTrigger><SelectValue placeholder="Select region" /></SelectTrigger>
                  <SelectContent>
                    {lists.regions.map((r) => (
                      <SelectItem key={r.id} value={r.id.toString()}>{r.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.region_id && <p className="text-xs text-destructive">{errors.region_id.message}</p>}
          </div>
          <div className="space-y-1.5 sm:col-span-3">
            <p className="text-xs text-muted-foreground">
              At least one of Telephone / Alternative Contact / Email is required
              <Req /> unless marked unavailable below.
            </p>
          </div>
          <div className="space-y-1.5">
            <Label>Telephone Number</Label>
            <Input {...register("telephone_number")} placeholder="024XXXXXXX" />
            {errors.telephone_number && <p className="text-xs text-destructive">{errors.telephone_number.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label>Alternative Contact Number</Label>
            <Input {...register("alternative_contact_number")} />
          </div>
          <div className="space-y-1.5">
            <Label>Email Address</Label>
            <Input type="email" {...register("email_address")} />
            {errors.email_address && <p className="text-xs text-destructive">{errors.email_address.message}</p>}
          </div>
          <div className="flex items-center gap-2 sm:col-span-3">
            <Controller
              control={control}
              name="contact_unavailable"
              render={({ field }) => (
                <Checkbox checked={field.value} onCheckedChange={(v) => field.onChange(Boolean(v))} id="contact_unavailable" />
              )}
            />
            <Label htmlFor="contact_unavailable" className="font-normal">
              Contact deliberately unavailable (skip the "at least one contact" requirement)
            </Label>
          </div>
          <div className="space-y-1.5 sm:col-span-3">
            <Label>Physical Location</Label>
            <Input {...register("physical_location")} placeholder="e.g. Damongo community" />
          </div>
        </div>
      </fieldset>

      <fieldset className="space-y-3">
        <legend className="text-sm font-semibold text-primary">Engagement</legend>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Engagement Type<Req /></Label>
            <Controller
              control={control}
              name="engagement_type_id"
              render={({ field }) => (
                <Select onValueChange={(v) => field.onChange(Number(v))} value={field.value?.toString()}>
                  <SelectTrigger><SelectValue placeholder="Select engagement type" /></SelectTrigger>
                  <SelectContent>
                    {lists.engagement_types.map((e) => (
                      <SelectItem key={e.id} value={e.id.toString()}>{e.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.engagement_type_id && <p className="text-xs text-destructive">{errors.engagement_type_id.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label>Digital Channel Used</Label>
            <Controller
              control={control}
              name="digital_channel_id"
              render={({ field }) => (
                <Select onValueChange={(v) => field.onChange(Number(v))} value={field.value?.toString()}>
                  <SelectTrigger><SelectValue placeholder="Select channel" /></SelectTrigger>
                  <SelectContent>
                    {lists.digital_channels.map((d) => (
                      <SelectItem key={d.id} value={d.id.toString()}>{d.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>
        </div>
      </fieldset>

      <fieldset className="space-y-3">
        <legend className="text-sm font-semibold text-primary">Client Feedback</legend>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Feedback Category<Req /></Label>
            <Controller
              control={control}
              name="feedback_category_id"
              render={({ field }) => (
                <Select onValueChange={(v) => field.onChange(Number(v))} value={field.value?.toString()}>
                  <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                  <SelectContent>
                    {lists.feedback_categories.map((f) => (
                      <SelectItem key={f.id} value={f.id.toString()}>{f.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.feedback_category_id && <p className="text-xs text-destructive">{errors.feedback_category_id.message}</p>}
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Detailed Feedback Narrative</Label>
            <Textarea {...register("detailed_feedback_narrative")} rows={2} />
          </div>
        </div>
      </fieldset>

      <fieldset className="space-y-3">
        <legend className="text-sm font-semibold text-primary">Follow-Up Outcomes</legend>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <YesNoField label="Successful Contact" name="successful_contact" control={control} error={errors.successful_contact?.message} required />
          <YesNoField label="Issue Resolved" name="issue_resolved" control={control} error={errors.issue_resolved?.message} required />
          <YesNoField label="Escalation Required" name="escalation_required" control={control} error={errors.escalation_required?.message} required />
        </div>
      </fieldset>

      <fieldset className="space-y-3">
        <legend className="text-sm font-semibold text-primary">Observations</legend>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="space-y-1.5">
            <Label>Key Observation</Label>
            <Textarea {...register("key_observation")} rows={2} placeholder="What was noticed from interacting with the patient" />
          </div>
          <div className="space-y-1.5">
            <Label>Root Cause</Label>
            <Textarea {...register("root_cause")} rows={2} placeholder="What caused the problem per patient" />
          </div>
          <div className="space-y-1.5">
            <Label>Emerging Trend</Label>
            <Textarea {...register("emerging_trend")} rows={2} placeholder="Pattern observed across several patients" />
          </div>
        </div>
      </fieldset>

      <fieldset className="space-y-3">
        <legend className="text-sm font-semibold text-primary">Recommendations</legend>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Recommendation</Label>
            <Textarea {...register("recommendation")} rows={2} />
          </div>
          <div className="space-y-1.5">
            <Label>
              Priority Level
              <span className="text-destructive" aria-hidden="true"> *</span>
              <span className="text-xs font-normal text-muted-foreground"> (if complaint, escalation, risk, or recommendation)</span>
            </Label>
            <Controller
              control={control}
              name="priority_level_id"
              render={({ field }) => (
                <Select onValueChange={(v) => field.onChange(Number(v))} value={field.value?.toString()}>
                  <SelectTrigger><SelectValue placeholder="Select priority" /></SelectTrigger>
                  <SelectContent>
                    {lists.priority_levels.map((p) => (
                      <SelectItem key={p.id} value={p.id.toString()}>{p.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.priority_level_id && <p className="text-xs text-destructive">{errors.priority_level_id.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label>Responsible Unit</Label>
            <Controller
              control={control}
              name="responsible_unit_id"
              render={({ field }) => (
                <Select onValueChange={(v) => field.onChange(Number(v))} value={field.value?.toString()}>
                  <SelectTrigger><SelectValue placeholder="Select unit" /></SelectTrigger>
                  <SelectContent>
                    {lists.responsible_units.map((u) => (
                      <SelectItem key={u.id} value={u.id.toString()}>{u.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>
        </div>
      </fieldset>

      <fieldset className="space-y-3">
        <legend className="text-sm font-semibold text-primary">Status</legend>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="space-y-1.5">
            <Label>Status<Req /></Label>
            <Controller
              control={control}
              name="status_id"
              render={({ field }) => (
                <Select onValueChange={(v) => field.onChange(Number(v))} value={field.value?.toString()}>
                  <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
                  <SelectContent>
                    {lists.statuses.map((s) => (
                      <SelectItem key={s.id} value={s.id.toString()}>{s.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.status_id && <p className="text-xs text-destructive">{errors.status_id.message}</p>}
          </div>
        </div>
      </fieldset>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving…" : submitLabel}
        </Button>
      </div>
    </form>
  );
}

function YesNoField({
  label,
  name,
  control,
  error,
  required,
}: {
  label: string;
  name: "successful_contact" | "issue_resolved" | "escalation_required";
  control: ReturnType<typeof useForm<EntryFormValues>>["control"];
  error?: string;
  required?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <Label>
        {label}
        {required && <Req />}
      </Label>
      <Controller
        control={control}
        name={name}
        render={({ field }) => (
          <Select onValueChange={field.onChange} value={field.value}>
            <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
            <SelectContent>
              {yesNo.map((v) => (
                <SelectItem key={v} value={v}>{v}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      />
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
