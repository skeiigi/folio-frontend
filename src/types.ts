export type Role = "client" | "author" | "admin";
export interface User {
  id: string;
  name: string;
  email: string;
  roles: Role[];
  status: string;
  createdAt: string;
}
export interface MoneyRange {
  min: number;
  max: number;
  currency: "RUB" | "USD" | "EUR";
}
export interface LayoutConfig {
  theme: "paper" | "night" | "sage";
  accent: string;
  font: "sans" | "serif";
  sections: ("portfolio" | "services" | "about")[];
  hiddenSections: ("services" | "about")[];
  columns: 2 | 3;
}
export interface MediaFile {
  id: string;
  artworkId?: string;
  briefId?: string;
  purpose: "cover" | "preview" | "model" | "reference";
  fileName: string;
  mimeType: string;
  sizeBytes: number;
}
export interface AuthorSummary {
  id: string;
  publicName: string;
  specialization: string[];
  avatarUrl: string;
  layoutConfig: LayoutConfig;
}
export interface Artwork {
  isPublic?: boolean;
  id: string;
  authorProfileId: string;
  title: string;
  description: string;
  workType: "model3d" | "illustration" | "animation" | "other";
  style: string;
  technicalDetails: {
    polygonCount?: number;
    textureResolution?: string;
    software?: string;
    engine?: string;
  };
  status: "draft" | "published" | "archived";
  createdAt: string;
  updatedAt: string;
  author: AuthorSummary;
  media: MediaFile[];
}
export interface Service {
  id: string;
  authorProfileId: string;
  title: string;
  description: string;
  priceRange: MoneyRange;
  estimatedDays: number | null;
  revisionRounds: number;
  status: "draft" | "active" | "hidden";
}
export interface CreatorProfile extends AuthorSummary {
  userId: string;
  description: string;
  status: "draft" | "published" | "hidden";
  artworks: Artwork[];
  services: Service[];
  artworkCount?: number;
  createdAt: string;
}
export type BriefStatus =
  | "submitted"
  | "in_discussion"
  | "accepted"
  | "in_progress"
  | "completed"
  | "rejected"
  | "cancelled";
export interface Brief {
  id: string;
  clientUserId: string;
  authorProfileId: string;
  title: string;
  description: string;
  budgetRange: MoneyRange;
  desiredDeadline: string | null;
  status: BriefStatus;
  createdAt: string;
  updatedAt: string;
  authorName: string;
  authorUserId?: string;
  authorEmail?: string;
  clientName: string;
  clientEmail?: string;
  attachments?: MediaFile[];
  history?: {
    id: string;
    actorName: string;
    fromStatus: BriefStatus | null;
    toStatus: BriefStatus;
    message: string;
    createdAt: string;
  }[];
  allowedTransitions?: BriefStatus[];
  canEdit?: boolean;
}
export interface Page<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}
export interface Meta {
  maxUploadBytes: number;
  stats: { artworks: number; creators: number };
}
export const WORK_TYPES = {
  model3d: "3D-модели",
  illustration: "Иллюстрации",
  animation: "Анимация",
  other: "Другое",
};
export const STATUS_LABELS: Record<BriefStatus, string> = {
  submitted: "Отправлен",
  in_discussion: "Обсуждение",
  accepted: "Принят",
  in_progress: "В работе",
  completed: "Завершён",
  rejected: "Отклонён",
  cancelled: "Отменён",
};
export const DEFAULT_LAYOUT: LayoutConfig = {
  theme: "paper",
  accent: "#28634b",
  font: "sans",
  sections: ["portfolio", "services", "about"],
  hiddenSections: [],
  columns: 3,
};
