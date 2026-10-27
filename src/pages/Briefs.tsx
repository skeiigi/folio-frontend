import { useEffect, useState, type FormEvent } from "react";
import {
  Link,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  Clock,
  FileText,
  Paperclip,
  Plus,
  Download,
  Trash2,
  List,
  Columns3,
  PenLine,
  Mail,
} from "lucide-react";
import { api, uploadFile, mediaBlob, errorMessage } from "../api";
import { useAuth } from "../auth";
import type {
  Brief,
  BriefStatus,
  CreatorProfile,
  Page,
  MoneyRange,
} from "../types";
import { STATUS_LABELS } from "../types";
import {
  Avatar,
  BackLink,
  ConfirmDialog,
  Empty,
  ErrorNotice,
  Field,
  Loading,
  PageTitle,
  Status,
  date,
  money,
  shortId,
  useToast,
} from "../components/ui";

interface BriefValues {
  title: string;
  description: string;
  min: string;
  max: string;
  currency: MoneyRange["currency"];
  deadline: string;
}
const defaultBrief = (): BriefValues => ({
  title: "",
  description: "",
  min: "",
  max: "",
  currency: "RUB",
  deadline: "",
});
const fromBrief = (b: Brief): BriefValues => ({
  title: b.title,
  description: b.description,
  min: String(b.budgetRange.min),
  max: String(b.budgetRange.max),
  currency: b.budgetRange.currency,
  deadline: b.desiredDeadline?.slice(0, 10) || "",
});
const briefBody = (f: BriefValues) => ({
  title: f.title,
  description: f.description,
  budgetRange: { min: Number(f.min), max: Number(f.max), currency: f.currency },
  desiredDeadline: f.deadline || null,
});
function BriefFields({
  value,
  onChange,
}: {
  value: BriefValues;
  onChange: (value: BriefValues) => void;
}) {
  const update = (key: keyof BriefValues, v: string) =>
    onChange({ ...value, [key]: v });
  return (
    <>
      <Field label="Как называется ваш проект?">
        <input
          value={value.title}
          onChange={(e) => update("title", e.target.value)}
          required
          minLength={3}
          maxLength={160}
          placeholder="Например, пропсы для инди-игры"
        />
      </Field>
      <Field
        label="Расскажите о задаче"
        hint="Что нужно создать, где будет использоваться работа и какие есть ограничения?"
      >
        <textarea
          rows={7}
          value={value.description}
          onChange={(e) => update("description", e.target.value)}
          required
          minLength={20}
          maxLength={10000}
          placeholder="Стиль, количество объектов, нужные форматы и важные детали…"
        />
      </Field>
      <div className="field-row">
        <Field label="Бюджет от">
          <input
            type="number"
            value={value.min}
            onChange={(e) => update("min", e.target.value)}
            min={0}
            max={100000000}
            required
            placeholder="5 000"
          />
        </Field>
        <Field label="Бюджет до">
          <input
            type="number"
            value={value.max}
            onChange={(e) => update("max", e.target.value)}
            min={Number(value.min)}
            max={100000000}
            required
            placeholder="15 000"
          />
        </Field>
        <Field label="Валюта">
          <select
            value={value.currency}
            onChange={(e) => update("currency", e.target.value)}
          >
            <option>RUB</option>
            <option>USD</option>
            <option>EUR</option>
          </select>
        </Field>
      </div>
      <Field
        label="Желаемый срок"
        hint="Необязательно. Окончательный срок можно согласовать с автором."
      >
        <input
          type="date"
          value={value.deadline}
          onChange={(e) => update("deadline", e.target.value)}
          min={new Date().toISOString().slice(0, 10)}
        />
      </Field>
    </>
  );
}

export function BriefForm() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const query = useQueryClient();
  const toast = useToast();
  const [form, setForm] = useState(defaultBrief);
  const [files, setFiles] = useState<File[]>([]);
  const [createdId, setCreatedId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [saveError, setSaveError] = useState<unknown>(null);
  const {
    data: p,
    isPending,
    error,
  } = useQuery({
    queryKey: ["creator", id],
    queryFn: () => api<CreatorProfile>(`/creators/${id}`),
  });
  const selectedService = p?.services.find(
    (s) => s.id === params.get("service"),
  );
  useEffect(() => {
    if (selectedService)
      setForm((f) => ({
        ...f,
        title: selectedService.title,
        description: `Интересует услуга «${selectedService.title}».\n\n`,
        min: String(selectedService.priceRange.min),
        max: String(selectedService.priceRange.max),
        currency: selectedService.priceRange.currency,
      }));
  }, [selectedService?.id]);
  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setSaveError(null);
    let saved = createdId;
    try {
      if (!saved) {
        const b = await api<Brief>("/briefs", {
          method: "POST",
          json: { ...briefBody(form), authorProfileId: id },
        });
        saved = b.id;
        setCreatedId(b.id);
      } else
        await api(`/briefs/${saved}`, {
          method: "PATCH",
          json: briefBody(form),
        });
      for (const file of files) {
        await uploadFile(`/briefs/${saved}/attachments`, file);
        setFiles((items) => items.filter((x) => x !== file));
      }
      query.invalidateQueries({ queryKey: ["briefs"] });
      toast("Бриф отправлен автору.");
      navigate(`/briefs/${saved}?created=1`);
    } catch (e) {
      setSaveError(e);
    } finally {
      setBusy(false);
    }
  }
  if (isPending) return <Loading />;
  if (error || !p)
    return (
      <div className="container standard-page">
        <ErrorNotice error={error} />
        <BackLink to="/creators" />
      </div>
    );
  if (p.userId === user?.id)
    return (
      <div className="container narrow standard-page">
        <Empty
          title="Это ваш профиль"
          text="Выберите другого автора, чтобы отправить бриф."
          action={
            <Link className="btn btn-dark" to="/creators">
              Найти автора
            </Link>
          }
        />
      </div>
    );
  return (
    <div className="container standard-page">
      <BackLink to={`/creators/${id}`}>К профилю автора</BackLink>
      <PageTitle
        eyebrow="ОТ ИДЕИ К СОТРУДНИЧЕСТВУ"
        title="Расскажите, что вы задумали."
        description="Понятный бриф поможет автору оценить задачу и ответить по существу."
      />
      <div className="editor-layout">
        <form className="form-section editor-main" onSubmit={submit}>
          <ErrorNotice error={saveError} />
          {createdId && (
            <div className="notice notice-success">
              <Check size={18} />
              <span>
                Бриф №{shortId(createdId)} уже сохранён. Можно повторить
                загрузку файлов или{" "}
                <Link to={`/briefs/${createdId}`}>открыть бриф</Link>.
              </span>
            </div>
          )}
          <BriefFields value={form} onChange={setForm} />
          <div className="field">
            <span className="field-label">Референсы</span>
            <label className="file-picker compact">
              <Paperclip size={22} />
              <strong>Добавить изображения</strong>
              <span>
                PNG, JPEG, WebP или GIF · до 20 МБ · максимум 10 файлов
              </span>
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                multiple
                onChange={(e) => {
                  const list = [...files, ...Array.from(e.target.files || [])];
                  if (list.length > 10) {
                    setSaveError(
                      new Error("Можно прикрепить не больше 10 файлов."),
                    );
                    return;
                  }
                  setFiles(list);
                }}
              />
            </label>
            {files.map((f, i) => (
              <div className="pending-file" key={`${f.name}-${i}`}>
                <FileText size={16} />
                <span>{f.name}</span>
                <button
                  className="icon-button"
                  type="button"
                  aria-label={`Убрать ${f.name}`}
                  onClick={() => setFiles(files.filter((_, j) => j !== i))}
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
          </div>
          <div className="brief-contact">
            <Avatar name={user!.name} size="small" />
            <span>
              Отправитель: <strong>{user?.name}</strong> · {user?.email}
            </span>
          </div>
          <p className="small muted">
            Бриф и референсы будут доступны вам, выбранному автору и
            администратору платформы.
          </p>
          <button className="btn btn-dark" disabled={busy}>
            {busy
              ? "Отправляем…"
              : createdId
                ? "Продолжить отправку"
                : "Отправить бриф"}
            <ArrowUpRight size={17} />
          </button>
        </form>
        <aside className="brief-author-card">
          <Avatar name={p.publicName} url={p.avatarUrl} size="large" />
          <p className="eyebrow">ВАШ АВТОР</p>
          <h2>{p.publicName}</h2>
          <div className="tag-row">
            {p.specialization.map((s) => (
              <span className="tag" key={s}>
                {s}
              </span>
            ))}
          </div>
          {selectedService && (
            <div className="selected-service">
              <span className="eyebrow">ВЫБРАННАЯ УСЛУГА</span>
              <h3>{selectedService.title}</h3>
              <strong>{money(selectedService.priceRange)}</strong>
              {selectedService.estimatedDays && (
                <p>
                  <Clock size={14} />
                  от {selectedService.estimatedDays} дней
                </p>
              )}
            </div>
          )}
          <hr />
          <h3>Что произойдёт дальше?</h3>
          <ol className="next-steps">
            <li>Бриф сохранится и получит номер.</li>
            <li>Автор изучит задачу и предложит следующий шаг.</li>
            <li>Вы уточните объём, сроки и условия до начала работы.</li>
          </ol>
          <p className="small muted">
            Отправка брифа не создаёт обязательства об оплате.
          </p>
        </aside>
      </div>
    </div>
  );
}

const statuses = Object.keys(STATUS_LABELS) as BriefStatus[];
const authorTransitions: Partial<Record<BriefStatus, BriefStatus[]>> = {
  submitted: ["in_discussion", "accepted", "rejected"],
  in_discussion: ["accepted", "rejected"],
  accepted: ["in_progress"],
  in_progress: ["completed"],
};
export function BriefList() {
  const { user } = useAuth();
  const [params, setParams] = useSearchParams();
  const author = user!.roles.includes("author");
  const side = params.get("side") || (author ? "received" : "sent");
  const status = params.get("status") || "";
  const [mode, setMode] = useState<"list" | "board">("list");
  const [moveError, setMoveError] = useState<unknown>(null);
  const query = useQueryClient();
  const toast = useToast();
  const { data, isPending, error } = useQuery({
    queryKey: ["briefs", user?.id, side, status],
    queryFn: () =>
      api<Page<Brief>>(`/me/briefs?side=${side}&status=${status}&limit=60`),
  });
  function change(key: string, value: string) {
    const next = new URLSearchParams(params);
    value ? next.set(key, value) : next.delete(key);
    setParams(next);
  }
  function allowed(b: Brief) {
    return user!.roles.includes("admin")
      ? statuses.filter((s) => s !== b.status)
      : side === "received"
        ? authorTransitions[b.status] || []
        : ["submitted", "in_discussion"].includes(b.status)
          ? ["cancelled"]
          : [];
  }
  async function move(id: string, status: BriefStatus) {
    const b = data?.items.find((x) => x.id === id);
    if (!b || !allowed(b).includes(status)) {
      toast("Такой переход статуса недоступен.", "error");
      return;
    }
    try {
      await api(`/briefs/${id}/status`, { method: "PATCH", json: { status } });
      query.invalidateQueries({ queryKey: ["briefs"] });
      query.invalidateQueries({ queryKey: ["brief", id] });
      toast("Статус обновлён.");
    } catch (e) {
      setMoveError(e);
    }
  }
  return (
    <div
      className={`container standard-page ${mode === "board" ? "board-page" : ""}`}
    >
      <PageTitle
        eyebrow="ОТ ИДЕЙ К ПРОЕКТАМ"
        title="Ваши брифы"
        description="Обсуждения, договорённости и следующие шаги — в одном месте."
      />
      <div className="brief-toolbar">
        <div className="filter-tabs">
          {author && (
            <button
              className={side === "received" ? "active" : ""}
              onClick={() => change("side", "received")}
            >
              Входящие
            </button>
          )}
          <button
            className={side === "sent" ? "active" : ""}
            onClick={() => change("side", "sent")}
          >
            Отправленные
          </button>
        </div>
        <div className="toolbar-right">
          <select
            aria-label="Фильтр статуса"
            value={status}
            onChange={(e) => change("status", e.target.value)}
          >
            <option value="">Все статусы</option>
            {statuses.map((s) => (
              <option value={s} key={s}>
                {STATUS_LABELS[s]}
              </option>
            ))}
          </select>
          <div className="view-toggle">
            <button
              className={mode === "list" ? "active" : ""}
              aria-label="Список брифов"
              onClick={() => setMode("list")}
            >
              <List size={18} />
            </button>
            <button
              className={mode === "board" ? "active" : ""}
              aria-label="Доска брифов"
              onClick={() => setMode("board")}
            >
              <Columns3 size={18} />
            </button>
          </div>
        </div>
      </div>
      <ErrorNotice error={moveError} />
      {isPending ? (
        <Loading label="Загружаем ваши брифы…" />
      ) : error ? (
        <ErrorNotice error={error} />
      ) : !data?.items.length ? (
        <Empty
          title={
            side === "received"
              ? "Ваш следующий проект ещё впереди"
              : "Начните с идеи"
          }
          text={
            side === "received"
              ? "Дополните портфолио и услуги, чтобы заказчикам было проще выбрать вас."
              : "Найдите автора, чьи работы вам близки, и расскажите о своей задаче."
          }
          action={
            <Link
              className="btn btn-dark"
              to={side === "received" ? "/studio" : "/creators"}
            >
              {side === "received" ? "В мастерскую" : "Найти автора"}
              <ArrowUpRight size={16} />
            </Link>
          }
        />
      ) : mode === "list" ? (
        <div className="brief-table">
          <div className="brief-table-head">
            <span>Проект</span>
            <span>{side === "received" ? "Заказчик" : "Автор"}</span>
            <span>Бюджет</span>
            <span>Статус</span>
            <span />
          </div>
          {data.items.map((b) => (
            <Link className="brief-table-row" key={b.id} to={`/briefs/${b.id}`}>
              <span>
                <strong>{b.title}</strong>
                <small>
                  №{shortId(b.id)} · {date(b.createdAt)}
                </small>
              </span>
              <span>{side === "received" ? b.clientName : b.authorName}</span>
              <span>{money(b.budgetRange)}</span>
              <Status status={b.status} />
              <ArrowUpRight size={17} />
            </Link>
          ))}
        </div>
      ) : (
        <>
          <p className="small muted board-hint">
            Перетащите карточку в доступный статус или откройте бриф, чтобы
            выбрать действие.
          </p>
          <div className="kanban-board">
            {statuses
              .filter((s) => !status || s === status)
              .map((s) => (
                <section
                  className={`kanban-column lane-${s}`}
                  key={s}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    move(e.dataTransfer.getData("text/plain"), s);
                  }}
                >
                  <div className="kanban-header">
                    <Status status={s} />
                    <span>
                      {data.items.filter((b) => b.status === s).length}
                    </span>
                  </div>
                  {data.items
                    .filter((b) => b.status === s)
                    .map((b) => (
                      <Link
                        draggable={allowed(b).length > 0}
                        onDragStart={(e) =>
                          e.dataTransfer.setData("text/plain", b.id)
                        }
                        className="kanban-card"
                        key={b.id}
                        to={`/briefs/${b.id}`}
                      >
                        <small>№{shortId(b.id)}</small>
                        <h3>{b.title}</h3>
                        <p>
                          {side === "received" ? b.clientName : b.authorName}
                        </p>
                        <strong>{money(b.budgetRange)}</strong>
                        <ArrowUpRight size={15} />
                      </Link>
                    ))}
                </section>
              ))}
          </div>
        </>
      )}
      {data && data.total > 60 && (
        <p className="small muted">
          Показаны последние 60 записей. Используйте фильтр статуса.
        </p>
      )}
    </div>
  );
}

const actionLabels: Record<BriefStatus, string> = {
  submitted: "Вернуть в отправленные",
  in_discussion: "Начать обсуждение",
  accepted: "Принять бриф",
  in_progress: "Начать работу",
  completed: "Завершить проект",
  rejected: "Отклонить бриф",
  cancelled: "Отменить бриф",
};
export function BriefDetail() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const { user } = useAuth();
  const query = useQueryClient();
  const toast = useToast();
  const {
    data: b,
    isPending,
    error,
  } = useQuery({
    queryKey: ["brief", id, user?.id],
    queryFn: () => api<Brief>(`/briefs/${id}`),
  });
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(defaultBrief);
  const [action, setAction] = useState<BriefStatus | null>(null);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [saveError, setSaveError] = useState<unknown>(null);
  useEffect(() => {
    if (b) setForm(fromBrief(b));
  }, [b]);
  function refresh() {
    query.invalidateQueries({ queryKey: ["brief", id] });
    query.invalidateQueries({ queryKey: ["briefs"] });
    query.invalidateQueries({ queryKey: ["new-briefs"] });
  }
  async function update(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setSaveError(null);
    try {
      await api(`/briefs/${id}`, { method: "PATCH", json: briefBody(form) });
      refresh();
      setEditing(false);
      toast("Бриф обновлён.");
    } catch (e) {
      setSaveError(e);
    } finally {
      setBusy(false);
    }
  }
  async function transition() {
    if (!action) return;
    setBusy(true);
    try {
      await api(`/briefs/${id}/status`, {
        method: "PATCH",
        json: { status: action, message },
      });
      refresh();
      setAction(null);
      setMessage("");
      toast("Статус брифа обновлён.");
    } catch (e) {
      setSaveError(e);
      setAction(null);
    } finally {
      setBusy(false);
    }
  }
  async function download(fileId: string, name: string) {
    try {
      const blob = await mediaBlob(fileId);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = name;
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (e) {
      setSaveError(e);
    }
  }
  if (isPending) return <Loading />;
  if (error || !b)
    return (
      <div className="container standard-page">
        <ErrorNotice error={error} />
        <BackLink to="/briefs">К моим брифам</BackLink>
      </div>
    );
  const otherName = user?.id === b.clientUserId ? b.authorName : b.clientName;
  const otherEmail =
    user?.id === b.clientUserId ? b.authorEmail : b.clientEmail;
  return (
    <div className="container standard-page">
      <BackLink to="/briefs">Все мои брифы</BackLink>
      {params.get("created") && user?.id === b.clientUserId && (
        <div className="notice notice-success">
          <Check size={18} />
          <span>
            Бриф отправлен. Его номер — {shortId(b.id)}. Автор сможет изучить
            задачу и обновить статус.
          </span>
        </div>
      )}
      <PageTitle
        eyebrow={`БРИФ №${shortId(b.id)}`}
        title={b.title}
        description={`Отправлен ${date(b.createdAt)}`}
        actions={<Status status={b.status} />}
      />
      <ErrorNotice error={saveError} />
      <div className="editor-layout">
        <div className="editor-main">
          <section className="form-section">
            <div className="section-heading">
              <h2>Описание задачи</h2>
              {b.canEdit && !editing && (
                <button className="text-link" onClick={() => setEditing(true)}>
                  <PenLine size={15} />
                  Изменить
                </button>
              )}
            </div>
            {editing ? (
              <form onSubmit={update}>
                <BriefFields value={form} onChange={setForm} />
                <div className="form-actions">
                  <button className="btn btn-dark" disabled={busy}>
                    Сохранить
                  </button>
                  <button
                    className="btn btn-ghost"
                    type="button"
                    onClick={() => {
                      setEditing(false);
                      setForm(fromBrief(b));
                    }}
                  >
                    Отмена
                  </button>
                </div>
              </form>
            ) : (
              <>
                <p className="preserve-lines brief-description">
                  {b.description}
                </p>
                <div className="brief-facts">
                  <div>
                    <span>Бюджет</span>
                    <strong>{money(b.budgetRange)}</strong>
                  </div>
                  <div>
                    <span>Желаемый срок</span>
                    <strong>
                      {b.desiredDeadline
                        ? date(b.desiredDeadline)
                        : "Обсуждается"}
                    </strong>
                  </div>
                </div>
              </>
            )}
          </section>
          <section className="form-section">
            <h2>
              Референсы{" "}
              <span className="count">{b.attachments?.length || 0}</span>
            </h2>
            {b.attachments?.length ? (
              <div className="attachment-list">
                {b.attachments.map((f) => (
                  <div className="attachment" key={f.id}>
                    <FileText size={22} />
                    <div>
                      <strong>{f.fileName}</strong>
                      <span>{(f.sizeBytes / 1024 / 1024).toFixed(2)} МБ</span>
                    </div>
                    <button
                      className="icon-button"
                      aria-label={`Скачать ${f.fileName}`}
                      onClick={() => download(f.id, f.fileName)}
                    >
                      <Download size={17} />
                    </button>
                    {b.canEdit && (
                      <button
                        className="icon-button"
                        aria-label={`Удалить ${f.fileName}`}
                        onClick={async () => {
                          try {
                            await api(`/briefs/${id}/attachments/${f.id}`, {
                              method: "DELETE",
                            });
                            refresh();
                            toast("Референс удалён.");
                          } catch (e) {
                            setSaveError(e);
                          }
                        }}
                      >
                        <Trash2 size={17} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="muted">Вложения пока не добавлены.</p>
            )}
            {b.canEdit && (
              <label
                className={`btn btn-outline upload-inline ${busy ? "disabled" : ""}`}
              >
                <Plus size={16} />
                Добавить референс
                <input
                  disabled={busy}
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/gif"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    setBusy(true);
                    try {
                      await uploadFile(`/briefs/${id}/attachments`, file);
                      refresh();
                      toast("Референс добавлен.");
                    } catch (e) {
                      setSaveError(e);
                    } finally {
                      setBusy(false);
                      e.target.value = "";
                    }
                  }}
                />
              </label>
            )}
          </section>
          <section className="form-section">
            <h2>История проекта</h2>
            <div className="timeline">
              {b.history?.map((h) => (
                <div className="timeline-event" key={h.id}>
                  <span className="timeline-dot" />
                  <div>
                    <strong>{STATUS_LABELS[h.toStatus]}</strong>
                    <p>
                      {h.message ||
                        `${h.actorName || "Участник"} обновил статус`}
                    </p>
                    <small>
                      {h.actorName} · {date(h.createdAt)}
                    </small>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
        <aside className="brief-side">
          <div className="brief-author-card">
            <Avatar name={otherName} size="large" />
            <p className="eyebrow">
              {user?.id === b.clientUserId ? "ВАШ АВТОР" : "ЗАКАЗЧИК"}
            </p>
            <h2>{otherName}</h2>
            {otherEmail && (
              <a
                className="text-link contact-email"
                href={`mailto:${otherEmail}`}
              >
                <Mail size={16} />
                {otherEmail}
              </a>
            )}
            <Link className="text-link" to={`/creators/${b.authorProfileId}`}>
              Профиль автора <ArrowUpRight size={15} />
            </Link>
          </div>
          <section className="brief-actions">
            <h3>Следующий шаг</h3>
            {b.allowedTransitions?.length ? (
              <>
                {b.allowedTransitions.map((s) => (
                  <button
                    className={`btn full-width ${s === "rejected" || s === "cancelled" ? "btn-outline" : "btn-dark"}`}
                    key={s}
                    onClick={() => setAction(s)}
                  >
                    {actionLabels[s]}
                    <ArrowRight size={16} />
                  </button>
                ))}
              </>
            ) : (
              <p className="muted small">
                {["completed", "rejected", "cancelled"].includes(b.status)
                  ? "Этот бриф закрыт. История и вложения доступны участникам."
                  : "Сейчас следующий шаг за другим участником проекта."}
              </p>
            )}
          </section>
        </aside>
      </div>
      {action && (
        <ConfirmDialog
          title={actionLabels[action] + "?"}
          busy={busy}
          onClose={() => setAction(null)}
          onConfirm={transition}
        >
          <p>
            Статус изменится на «{STATUS_LABELS[action]}» и сохранится в
            истории.
          </p>
          <Field label="Комментарий — необязательно">
            <textarea
              rows={3}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              maxLength={2000}
            />
          </Field>
        </ConfirmDialog>
      )}
    </div>
  );
}
