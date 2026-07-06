export const ROLES = [
  "Trust Hospital Admin",
  "Trust Hospital Data Entry Officer",
  "Trust Hospital Reviewer",
  "SSNIT Viewer",
  "SSNIT Executive Viewer",
  "System Admin",
] as const;

export type RoleName = (typeof ROLES)[number];

export const TRUST_HOSPITAL_ROLES: RoleName[] = [
  "Trust Hospital Admin",
  "Trust Hospital Data Entry Officer",
  "Trust Hospital Reviewer",
];

export const SSNIT_ROLES: RoleName[] = ["SSNIT Viewer", "SSNIT Executive Viewer"];

export interface WeeklySummary {
  total_patients_contacted: number;
  total_followup_activities: number;
  total_feedback_collected: number;
  total_complaints: number;
  total_issues_resolved: number;
  positive_feedback: number;
  complaints: number;
  suggestions: number;
  neutral_other: number;
  top_observations: string[];
  top_recommendations: string[];
}

export interface MonthlyMetric {
  month: string;
  patients_contacted: number;
  followup_activities: number;
  feedback_records: number;
  complaints: number;
  issues_resolved: number;
  escalations: number;
}

export interface YearTotal {
  patients_contacted: number;
  followup_activities: number;
  feedback_records: number;
  complaints: number;
  issues_resolved: number;
  escalations: number;
}

export interface MonthlyConsolidation {
  year: number;
  months: MonthlyMetric[];
  year_total: YearTotal;
  top_observations: string[];
  top_recommendations: string[];
  top_risks: string[];
  top_opportunities: string[];
}

export interface QuarterlyMetric {
  quarter: string;
  patients_contacted: number;
  followup_activities: number;
  feedback_records: number;
  complaints: number;
  issues_resolved: number;
  escalations: number;
}

export interface QuarterlyConsolidation {
  year: number;
  quarters: QuarterlyMetric[];
  year_total: YearTotal;
  busiest_month: { month: string; patients_contacted: number } | null;
  busiest_quarter: { quarter: string; patients_contacted: number } | null;
  months_with_activity: number;
  emerging_trends: string[];
  major_service_concerns: string[];
  key_recommendations_for_management: string[];
}

export interface ExecutiveKpis {
  total_patients_contacted: number;
  total_followup_activities: number;
  total_complaints: number;
  issues_resolved: number;
  open_issues: number;
  closed_issues: number;
}

export interface RegionHeatmapRow {
  region: string;
  q1: number;
  q2: number;
  q3: number;
  q4: number;
}

export interface EngagementBreakdownRow {
  engagement_type: string;
  activities: number;
  complaints: number;
}

export interface FeedbackBreakdownRow {
  category: string;
  count: number;
}

export interface ExecutiveDashboard {
  year: number;
  kpis: ExecutiveKpis;
  monthly_trend: { month: string; patients_contacted: number; followup_activities: number; complaints: number }[];
  engagement_breakdown: EngagementBreakdownRow[];
  feedback_breakdown: FeedbackBreakdownRow[];
  region_heatmap: RegionHeatmapRow[];
  top_observations: string[];
  top_risks: string[];
  top_recommendations: string[];
  top_opportunities: string[];
}
