export type QuestionType =
  | "short_text"
  | "long_text"
  | "multiple_choice"
  | "dropdown"
  | "email"
  | "number"
  | "yes_no"
  | "rating"
  | "file_upload"
  | "payment";

export type FormStatus = "draft" | "published";
export type MemberRole = "owner" | "editor" | "viewer";

export interface LogicRule {
  option?: string;
  target_id?: number | "";
  end?: boolean;
}

export interface QuestionLogic extends LogicRule {
  rules?: LogicRule[];
}

export interface Question {
  id?: number;
  position?: number;
  type: QuestionType;
  title: string;
  description: string;
  required: boolean;
  options: string[];
  logic: QuestionLogic;
}

export interface FormTheme {
  color?: string;
  background?: string;
  accent?: string;
  font?: string;
  thankYou?: string;
  darkMode?: boolean;
}

export interface FormDefinition {
  id: number;
  title: string;
  description: string;
  status: FormStatus;
  slug: string;
  webhook_url?: string;
  updated_by?: string;
  updated_by_email?: string;
  theme: FormTheme;
  created_at?: string;
  updated_at?: string;
  response_count: number;
  questions: Question[];
}

export interface FormResponse {
  id: number;
  submitted_at: string;
  answers: Record<number, string>;
}

export interface QuestionStat {
  question_id: number;
  title: string;
  type: QuestionType;
  responses: number;
  counts: Record<string, number>;
}

export interface FormStats {
  questions: QuestionStat[];
  completion: {
    completed: number;
    in_progress: number;
    rate: number;
  };
}

export interface WorkspaceMember {
  id: number;
  name: string;
  email: string;
  role: MemberRole;
  created_at?: string;
}

export interface WorkspaceInvite {
  id: number;
  name: string;
  email: string;
  role: MemberRole;
  status: "pending" | "accepted" | "revoked" | "expired";
  created_at?: string;
  expires_at?: string;
  accept_url?: string;
}

export interface InviteCreateResult {
  invite: WorkspaceInvite;
  email_sent: boolean;
  accept_url: string;
  message: string;
}

export interface FormEditor {
  name: string;
  email: string;
  last_seen: string;
}

export interface FormActivity {
  id: number;
  actor_name: string;
  actor_email: string;
  action: string;
  detail: string;
  created_at: string;
}
