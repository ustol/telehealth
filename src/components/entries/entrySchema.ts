import { z } from "zod";
import { phoneNeedsCheck } from "@/lib/phone";

const baseEntryObject = z.object({
  reporting_period_id: z.coerce.number({ required_error: "Reporting period is required" }),
  weekly_cycle_id: z.coerce.number({ required_error: "Weekly cycle is required" }),
  date_of_interaction: z.string().min(1, "Date of interaction is required"),
  cro_name: z.string().optional(),

  patient_full_name: z.string().min(1, "Patient full name is required"),
  telephone_number: z.string().optional(),
  alternative_contact_number: z.string().optional(),
  email_address: z.string().email("Invalid email address").optional().or(z.literal("")),
  contact_unavailable: z.boolean().default(false),
  physical_location: z.string().optional(),
  region_id: z.coerce.number({ required_error: "Region is required" }),

  engagement_type_id: z.coerce.number({ required_error: "Engagement type is required" }),
  digital_channel_id: z.coerce.number().optional(),

  feedback_category_id: z.coerce.number({ required_error: "Feedback category is required" }),
  detailed_feedback_narrative: z.string().optional(),

  successful_contact: z.enum(["Yes", "No"], { required_error: "Successful contact is required" }),
  issue_resolved: z.enum(["Yes", "No"], { required_error: "Issue resolved is required" }),
  escalation_required: z.enum(["Yes", "No"], { required_error: "Escalation required is required" }),

  key_observation: z.string().optional(),
  root_cause: z.string().optional(),
  emerging_trend: z.string().optional(),
  recommendation: z.string().optional(),
  priority_level_id: z.coerce.number().optional(),
  responsible_unit_id: z.coerce.number().optional(),
  status_id: z.coerce.number({ required_error: "Status is required" }),
});

export type EntryFormValues = z.infer<typeof baseEntryObject>;

export function makeEntrySchema(complaintFeedbackCategoryId: number | undefined) {
  return baseEntryObject.superRefine((data, ctx) => {
    const hasContact = Boolean(data.telephone_number || data.alternative_contact_number || data.email_address);
    if (!hasContact && !data.contact_unavailable) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Provide at least one contact field, or tick 'contact deliberately unavailable'",
        path: ["telephone_number"],
      });
    }

    const isComplaint = complaintFeedbackCategoryId != null && data.feedback_category_id === complaintFeedbackCategoryId;
    const needsPriority =
      isComplaint || data.escalation_required === "Yes" || Boolean(data.root_cause) || Boolean(data.recommendation);
    if (needsPriority && !data.priority_level_id) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Priority level is required when a complaint, escalation, risk, or recommendation is present",
        path: ["priority_level_id"],
      });
    }
  });
}

export function computeWarnings(values: Partial<EntryFormValues>) {
  const warnings: string[] = [];
  if (phoneNeedsCheck(values.telephone_number)) {
    warnings.push("CHECK NUMBER — telephone number has fewer than 10 digits once cleaned.");
  }
  if (
    !values.telephone_number &&
    !values.alternative_contact_number &&
    !values.email_address &&
    !values.contact_unavailable
  ) {
    warnings.push("MISSING CONTACT — no telephone, alternative contact, or email provided.");
  }
  return warnings;
}
