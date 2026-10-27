import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Shield, EyeOff } from "lucide-react";
import { api, tokenStore } from "../api";
import { useAuth } from "../auth";
import type { Artwork, User } from "../types";
import {
  ConfirmDialog,
  ErrorNotice,
  Field,
  Loading,
  PageTitle,
  Status,
  useToast,
} from "../components/ui";

export function Account() {
  const { user, refresh, logout } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [name, setName] = useState(user!.name);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [deletePassword, setDeletePassword] = useState("");
  const [deactivate, setDeactivate] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const [busy, setBusy] = useState(false);
  async function changeName(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await api("/me", { method: "PATCH", json: { name } });
      await refresh();
      toast("Имя обновлено.");
    } catch (e) {
      setError(e);
    } finally {
      setBusy(false);
    }
  }
  async function changePassword(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const data = await api<{ token: string }>("/auth/password", {
        method: "POST",
        json: { currentPassword: oldPassword, newPassword },
      });
      tokenStore.set(data.token);
      setOldPassword("");
      setNewPassword("");
      toast("Пароль изменён. Другие сеансы завершены.");
    } catch (e) {
      setError(e);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="container narrow standard-page">
      <PageTitle
        eyebrow="ВАШ АККАУНТ"
        title="Личное пространство"
        description={user!.email}
      />
      <ErrorNotice error={error} />
      <form className="form-section" onSubmit={changeName}>
        <h2>Как к вам обращаться</h2>
        <Field label="Имя">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            minLength={2}
            maxLength={80}
          />
        </Field>
        <button className="btn btn-dark" disabled={busy}>
          Сохранить <Check size={16} />
        </button>
      </form>
      <form className="form-section" onSubmit={changePassword}>
        <h2>Изменить пароль</h2>
        <Field label="Текущий пароль">
          <input
            type="password"
            value={oldPassword}
            onChange={(e) => setOldPassword(e.target.value)}
            required
            autoComplete="current-password"
          />
        </Field>
        <Field label="Новый пароль" hint="Не менее 10 символов">
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            minLength={10}
            maxLength={128}
            autoComplete="new-password"
          />
        </Field>
        <button className="btn btn-outline" disabled={busy}>
          Изменить пароль
        </button>
      </form>
      {!user!.roles.includes("admin") && (
        <section className="form-section">
          <h2>Деактивация аккаунта</h2>
          <p className="muted">
            Ваш профиль и работы исчезнут из публичного каталога. Существующие
            брифы сохранятся для истории сотрудничества.
          </p>
          <button
            className="btn btn-ghost danger-text"
            onClick={() => setDeactivate(true)}
          >
            Деактивировать аккаунт
          </button>
        </section>
      )}
      {deactivate && (
        <ConfirmDialog
          title="Деактивировать аккаунт?"
          busy={busy}
          onClose={() => setDeactivate(false)}
          onConfirm={async () => {
            setBusy(true);
            try {
              await api("/me", {
                method: "DELETE",
                json: { password: deletePassword },
              });
              await logout();
              navigate("/");
            } catch (e) {
              setError(e);
              setDeactivate(false);
            } finally {
              setBusy(false);
            }
          }}
        >
          <Field label="Подтвердите действие паролем">
            <input
              type="password"
              value={deletePassword}
              onChange={(e) => setDeletePassword(e.target.value)}
              autoComplete="current-password"
            />
          </Field>
        </ConfirmDialog>
      )}
    </div>
  );
}
interface OutboxRow {
  id: string;
  eventType: string;
  target: string;
  status: string;
  attempts: number;
}
export function Admin() {
  const query = useQueryClient();
  const toast = useToast();
  const users = useQuery({
    queryKey: ["admin-users"],
    queryFn: () => api<User[]>("/admin/users"),
  });
  const works = useQuery({
    queryKey: ["admin-artworks"],
    queryFn: () => api<Artwork[]>("/admin/artworks"),
  });
  const outbox = useQuery({
    queryKey: ["admin-outbox"],
    queryFn: () => api<OutboxRow[]>("/admin/outbox"),
  });
  const [error, setError] = useState<unknown>(null);
  const [action, setAction] = useState<{
    type: "user" | "artwork";
    id: string;
    status: string;
    label: string;
  } | null>(null);
  async function confirm() {
    if (!action) return;
    try {
      await api(
        action.type === "user"
          ? `/admin/users/${action.id}/status`
          : `/artworks/${action.id}`,
        { method: "PATCH", json: { status: action.status } },
      );
      query.invalidateQueries();
      toast("Изменения сохранены.");
    } catch (e) {
      setError(e);
    } finally {
      setAction(null);
    }
  }
  return (
    <div className="container standard-page">
      <PageTitle
        eyebrow="ПОДДЕРЖКА FOLIO"
        title="Модерация"
        description="Управление видимостью работ и доступом к платформе."
      />
      <ErrorNotice error={error || users.error || works.error} />
      <section className="form-section">
        <h2>Пользователи</h2>
        {users.isPending ? (
          <Loading />
        ) : (
          <div className="admin-table">
            {users.data?.map((u) => (
              <div className="admin-row" key={u.id}>
                <div>
                  <strong>{u.name}</strong>
                  <small>{u.email}</small>
                </div>
                <span>{u.roles.join(", ")}</span>
                <Status status={u.status} />
                {!u.roles.includes("admin") && u.status !== "deleted" && (
                  <button
                    className="btn btn-outline btn-small"
                    onClick={() =>
                      setAction({
                        type: "user",
                        id: u.id,
                        status: u.status === "blocked" ? "active" : "blocked",
                        label:
                          u.status === "blocked"
                            ? "Разблокировать пользователя?"
                            : "Заблокировать пользователя?",
                      })
                    }
                  >
                    {u.status === "blocked"
                      ? "Разблокировать"
                      : "Заблокировать"}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
      <section className="form-section">
        <h2>Работы</h2>
        {works.data?.map((a) => (
          <div className="admin-row" key={a.id}>
            <div>
              <strong>{a.title}</strong>
              <small>{a.author.publicName}</small>
            </div>
            <Status status={a.status} />
            {a.status === "published" && (
              <button
                className="btn btn-outline btn-small"
                onClick={() =>
                  setAction({
                    type: "artwork",
                    id: a.id,
                    status: "draft",
                    label: "Снять работу с публикации?",
                  })
                }
              >
                <EyeOff size={14} />
                Скрыть
              </button>
            )}
          </div>
        ))}
      </section>
      <section className="form-section">
        <h2>Уведомления и интеграции</h2>
        {outbox.data?.length ? (
          <div className="admin-table">
            {outbox.data.map((row) => (
              <div className="admin-row" key={row.id}>
                <strong>{row.eventType}</strong>
                <span>{row.target}</span>
                <span>{row.status}</span>
                <small>Попыток: {row.attempts}</small>
              </div>
            ))}
          </div>
        ) : (
          <p className="muted">
            Очередь пуста. Задания появятся после подключения почты, CRM или
            BPMS.
          </p>
        )}
      </section>
      {action && (
        <ConfirmDialog
          title={action.label}
          onClose={() => setAction(null)}
          onConfirm={confirm}
        >
          Изменение будет применено к выбранной записи.
        </ConfirmDialog>
      )}
    </div>
  );
}
