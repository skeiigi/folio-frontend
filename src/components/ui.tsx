import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { Link } from "react-router-dom";
import {
  ArrowUpRight,
  AlertCircle,
  Check,
  ImageIcon,
  LoaderCircle,
  X,
  ArrowLeft,
  FileText,
  Box,
  Clapperboard,
} from "lucide-react";
import { mediaUrl, mediaBlob, errorMessage } from "../api";
import { useAuth } from "../auth";
import type { Artwork, MediaFile, MoneyRange, BriefStatus } from "../types";
import { WORK_TYPES, STATUS_LABELS } from "../types";

export const money = (range: MoneyRange) => {
  const f = (n: number) =>
    new Intl.NumberFormat("ru-RU", {
      style: "currency",
      currency: range.currency,
      maximumFractionDigits: 0,
    }).format(n);
  return range.min === range.max
    ? f(range.min)
    : `${new Intl.NumberFormat("ru-RU").format(range.min)} – ${f(range.max)}`;
};
export const date = (value: string) =>
  new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(value));
export const shortId = (id: string) =>
  id.replace(/-/g, "").slice(-8).toUpperCase();
export function Avatar({
  name,
  url,
  size = "normal",
}: {
  name: string;
  url?: string;
  size?: "small" | "normal" | "large";
}) {
  const palette = ["#d9e6cf", "#e6d5cc", "#d8dfec", "#e7dcb7"];
  const color =
    palette[
      [...name].reduce((n, c) => n + c.charCodeAt(0), 0) % palette.length
    ];
  return (
    <span className={`avatar avatar-${size}`} style={{ background: color }}>
      {url ? (
        <img src={url} alt="" />
      ) : (
        name
          .split(" ")
          .slice(0, 2)
          .map((x) => x[0])
          .join("")
      )}
    </span>
  );
}
export function Loading({
  label = "Собираем вдохновение…",
}: {
  label?: string;
}) {
  return (
    <div className="state-box">
      <LoaderCircle className="spin" size={28} />
      <p>{label}</p>
    </div>
  );
}
export function ErrorNotice({ error }: { error: unknown }) {
  return error ? (
    <div className="notice notice-error" role="alert">
      <AlertCircle size={18} />
      <span>{errorMessage(error)}</span>
    </div>
  ) : null;
}
export function Empty({
  title,
  text,
  action,
}: {
  title: string;
  text: string;
  action?: ReactNode;
}) {
  return (
    <div className="empty-state">
      <span className="empty-icon">
        <ImageIcon size={26} />
      </span>
      <h3>{title}</h3>
      <p>{text}</p>
      {action}
    </div>
  );
}
export function PageTitle({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  useEffect(() => {
    document.title = `${title} — Folio`;
  }, [title]);
  return (
    <div className="page-title">
      <div>
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h1>{title}</h1>
        {description && <p className="muted">{description}</p>}
      </div>
      {actions && <div className="page-actions">{actions}</div>}
    </div>
  );
}
export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="field">
      <span className="field-label">{label}</span>
      {children}
      {hint && <small>{hint}</small>}
    </label>
  );
}
export function BackLink({
  to = "/",
  children = "К работам",
}: {
  to?: string;
  children?: ReactNode;
}) {
  return (
    <Link className="back-link" to={to}>
      <ArrowLeft size={16} />
      {children}
    </Link>
  );
}
export function Status({ status }: { status: BriefStatus | string }) {
  const labels: Record<string, string> = {
    ...STATUS_LABELS,
    published: "Опубликовано",
    draft: "Черновик",
    archived: "В архиве",
    active: "Активна",
    hidden: "Скрыто",
  };
  return (
    <span className={`status status-${status}`}>
      <i />
      {labels[status] || status}
    </span>
  );
}
export function MediaImage({
  media,
  alt,
  className = "",
  privateFile = false,
}: {
  media?: MediaFile;
  alt: string;
  className?: string;
  privateFile?: boolean;
}) {
  const [url, setUrl] = useState("");
  const { user } = useAuth();
  useEffect(() => {
    let active = true;
    let object = "";
    setUrl("");
    if (media && privateFile && user)
      mediaBlob(media.id)
        .then((b) => {
          object = URL.createObjectURL(b);
          if (active) setUrl(object);
        })
        .catch(() => {});
    return () => {
      active = false;
      if (object) URL.revokeObjectURL(object);
    };
  }, [media?.id, privateFile, user?.id]);
  if (!media)
    return (
      <div className={`media-placeholder ${className}`}>
        <ImageIcon size={32} />
      </div>
    );
  return (
    <img
      className={className}
      src={privateFile ? url || undefined : mediaUrl(media.id)}
      alt={alt}
      loading="lazy"
    />
  );
}
export function ArtworkCard({
  artwork,
  editable = false,
}: {
  artwork: Artwork;
  editable?: boolean;
}) {
  const media = artwork.media.find((m) => m.purpose === "cover");
  const Icon =
    artwork.workType === "model3d"
      ? Box
      : artwork.workType === "animation"
        ? Clapperboard
        : ImageIcon;
  return (
    <article className="art-card">
      <Link
        className="art-visual"
        to={
          editable
            ? `/studio/artworks/${artwork.id}/edit`
            : `/artworks/${artwork.id}`
        }
      >
        <MediaImage
          media={media}
          alt={artwork.title}
            privateFile={artwork.isPublic === false || artwork.status !== "published"}
        />
        <span className="art-format">
          <Icon size={13} />
          {WORK_TYPES[artwork.workType]}
        </span>
        <span className="art-open">
          <ArrowUpRight size={19} />
        </span>
      </Link>
      <div className="art-caption">
        <div>
          <Link
            className="art-title"
            to={
              editable
                ? `/studio/artworks/${artwork.id}/edit`
                : `/artworks/${artwork.id}`
            }
          >
            {artwork.title}
          </Link>
          <Link className="art-author" to={`/creators/${artwork.author.id}`}>
            <Avatar name={artwork.author.publicName} size="small" />
            {artwork.author.publicName}
          </Link>
        </div>
        {editable ? (
          <Status status={artwork.status} />
        ) : (
          <span className="art-style">{artwork.style}</span>
        )}
      </div>
    </article>
  );
}
interface ToastData {
  text: string;
  kind: "success" | "error";
}
const ToastContext = createContext<
  (text: string, kind?: "success" | "error") => void
>(() => {});
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastData | null>(null);
  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 5000);
      return () => clearTimeout(t);
    }
  }, [toast]);
  return (
    <ToastContext.Provider
      value={(text, kind = "success") => setToast({ text, kind })}
    >
      {children}
      {toast && (
        <div className={`toast toast-${toast.kind}`} role="status">
          {toast.kind === "success" ? (
            <Check size={18} />
          ) : (
            <AlertCircle size={18} />
          )}
          <span>{toast.text}</span>
          <button
            type="button"
            aria-label="Закрыть уведомление"
            onClick={() => setToast(null)}
          >
            <X size={16} />
          </button>
        </div>
      )}
    </ToastContext.Provider>
  );
}
export const useToast = () => useContext(ToastContext);
export function ConfirmDialog({
  title,
  children,
  onConfirm,
  onClose,
  busy = false,
}: {
  title: string;
  children: ReactNode;
  onConfirm: () => void;
  onClose: () => void;
  busy?: boolean;
}) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <section
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="modal"
        onClick={(e) => e.stopPropagation()}
      >
        <h2>{title}</h2>
        <div className="muted">{children}</div>
        <div className="form-actions">
          <button
            className="btn btn-danger"
            onClick={onConfirm}
            disabled={busy}
          >
            {busy ? "Подождите…" : "Подтвердить"}
          </button>
          <button className="btn btn-ghost" onClick={onClose}>
            Отмена
          </button>
        </div>
      </section>
    </div>
  );
}
export function FilePicker({
  label,
  accept,
  onChange,
  hint,
  file,
}: {
  label: string;
  accept: string;
  onChange: (file: File | null) => void;
  hint?: string;
  file?: File | null;
}) {
  return (
    <label className="file-picker">
      <FileText size={24} />
      <strong>{file ? file.name : label}</strong>
      <span>
        {file
          ? `${(file.size / 1024 / 1024).toFixed(1)} МБ`
          : hint || "Нажмите, чтобы выбрать файл"}
      </span>
      <input
        type="file"
        accept={accept}
        onChange={(e) => onChange(e.target.files?.[0] || null)}
      />
    </label>
  );
}
