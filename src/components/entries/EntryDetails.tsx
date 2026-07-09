import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import type { EntryComputedRow } from "@/hooks/useEntries";

function Field({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <div className="space-y-0.5">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="text-sm">{value === null || value === undefined || value === "" ? "—" : value}</p>
    </div>
  );
}

export function EntryDetails({ entry }: { entry: EntryComputedRow }) {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-1">
        {entry.duplicate_flag && <Badge variant="destructive">DUPLICATE</Badge>}
        {entry.contact_missing && <Badge variant="warning">MISSING CONTACT</Badge>}
        {entry.phone_check && <Badge variant="warning">CHECK NUMBER</Badge>}
      </div>

      <div>
        <p className="mb-2 text-sm font-semibold text-primary">Reporting Information</p>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Field label="Entry ID" value={entry.entry_id} />
          <Field label="Reporting Period" value={entry.reporting_period} />
          <Field label="Weekly Cycle" value={entry.weekly_cycle} />
          <Field label="Date of Interaction" value={formatDate(entry.date_of_interaction)} />
          <Field label="Quarter" value={entry.quarter} />
          <Field label="CRO's Name" value={entry.cro_name} />
        </div>
      </div>

      <div>
        <p className="mb-2 text-sm font-semibold text-primary">Patient Information</p>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Field label="SSNIT Number" value={entry.ssnit_number} />
          <Field label="Region" value={entry.region} />
          <Field label="Telephone Number" value={entry.telephone_number} />
          <Field label="Alternative Contact" value={entry.alternative_contact_number} />
          <Field label="Email Address" value={entry.email_address} />
          <Field label="Physical Location" value={entry.physical_location} />
        </div>
      </div>

      <div>
        <p className="mb-2 text-sm font-semibold text-primary">Engagement & Feedback</p>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Field label="Engagement Type" value={entry.engagement_type} />
          <Field label="Digital Channel Used" value={entry.digital_channel_used} />
          <Field label="Feedback Category" value={entry.feedback_category} />
          <Field label="Successful Contact" value={entry.successful_contact ? "Yes" : "No"} />
          <Field label="Issue Resolved" value={entry.issue_resolved ? "Yes" : "No"} />
          <Field label="Escalation Required" value={entry.escalation_required ? "Yes" : "No"} />
        </div>
        {entry.detailed_feedback_narrative && (
          <div className="mt-3">
            <Field label="Detailed Feedback Narrative" value={entry.detailed_feedback_narrative} />
          </div>
        )}
      </div>

      <div>
        <p className="mb-2 text-sm font-semibold text-primary">Observations & Recommendations</p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Field label="Key Observation" value={entry.key_observation} />
          <Field label="Root Cause" value={entry.root_cause} />
          <Field label="Emerging Trend" value={entry.emerging_trend} />
        </div>
        <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Field label="Recommendation" value={entry.recommendation} />
          <Field label="Priority Level" value={entry.priority_level} />
          <Field label="Responsible Unit" value={entry.responsible_unit} />
        </div>
      </div>

      <div>
        <p className="mb-2 text-sm font-semibold text-primary">Status</p>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Field label="Status" value={entry.status} />
          <Field label="Created" value={formatDate(entry.created_at)} />
          <Field label="Last Updated" value={formatDate(entry.updated_at)} />
        </div>
      </div>
    </div>
  );
}
