export type SignalType =
  | "PROBLEM"
  | "SOLUTION"
  | "OPPORTUNITY"
  | "EVENT"
  | "WEATHER"
  | "DISASTER"
  | "INNOVATION"
  | "FUNDING"
  | "PARTNERSHIP"
  | "YOUTH_INITIATIVE"
  | "POLICY_UPDATE"
  | "VOLUNTEER_REQUEST"
  | "KNOWLEDGE_SHARE"
  | "EMERGENCY"
  | "TRAINING"
  | "RESEARCH";

export type SignalStatus = "ACTIVE" | "RESOLVED" | "ARCHIVED";

export interface Chapter {
  id: string;
  countryCode: string;
  countryName: string;
  city: string | null;
  lat: number;
  lng: number;
  memberCount: number;
  color: string;
  description: string | null;
}

export interface Signal {
  id: string;
  chapterId: string;
  type: SignalType;
  status: SignalStatus;
  title: string;
  description: string;
  severity: number;
  lat: number;
  lng: number;
  createdAt: string;
  chapter?: Chapter;
}

export interface Connection {
  id: string;
  fromChapterId: string;
  toChapterId: string;
  label: string | null;
  strength: number;
}

export const SIGNAL_TYPE_META: Record<
  SignalType,
  { label: string; color: string }
> = {
  PROBLEM: { label: "Problem", color: "#F87171" },
  SOLUTION: { label: "Solution", color: "#34D399" },
  OPPORTUNITY: { label: "Opportunity", color: "#60A5FA" },
  EVENT: { label: "Event", color: "#A78BFA" },
  WEATHER: { label: "Weather", color: "#38BDF8" },
  DISASTER: { label: "Disaster", color: "#FB923C" },
  INNOVATION: { label: "Innovation", color: "#22D3EE" },
  FUNDING: { label: "Funding", color: "#FBBF24" },
  PARTNERSHIP: { label: "Partnership", color: "#C084FC" },
  YOUTH_INITIATIVE: { label: "Youth Initiative", color: "#4ADE80" },
  POLICY_UPDATE: { label: "Policy Update", color: "#818CF8" },
  VOLUNTEER_REQUEST: { label: "Volunteer Request", color: "#2DD4BF" },
  KNOWLEDGE_SHARE: { label: "Knowledge Share", color: "#F472B6" },
  EMERGENCY: { label: "Emergency", color: "#EF4444" },
  TRAINING: { label: "Training", color: "#A3E635" },
  RESEARCH: { label: "Research", color: "#93C5FD" },
};

export function severityColor(severity: number): string {
  if (severity >= 5) return "#EF4444";
  if (severity >= 4) return "#FB923C";
  if (severity >= 3) return "#FBBF24";
  if (severity >= 2) return "#34D399";
  return "#60A5FA";
}
