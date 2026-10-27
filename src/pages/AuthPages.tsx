import { useState, type FormEvent, type ReactNode } from "react";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowUpRight,
  ArrowRight,
  Brush,
  BriefcaseBusiness,
  Check,
} from "lucide-react";
import { useAuth } from "../auth";
import { ErrorNotice, Field } from "../components/ui";

function AuthFrame({ children }: { children: ReactNode }) {
  return (
    <div className="auth-page container">
      <aside className="auth-story">
        <span className="eyebrow">ВАШ СЛЕДУЮЩИЙ ПРОЕКТ</span>
        <h2>
          Хорошие идеи
          <br />
          знакомят
          <br />
          <em>хороших людей.</em>
        </h2>
        <div className="auth-illustration">
          <div />
          <div />
          <div />
        </div>
        <p>
          Показывайте свой взгляд на мир.
          <br />
          Находите тех, кто его разделяет.
        </p>
        <span className="auth-story-foot">
          FOLIO COMMUNITY <ArrowUpRight size={22} />
        </span>
      </aside>
      <div className="auth-form-panel">{children}</div>
    </div>
  );
}
export function Login() {
  const { login, user, profileId } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<unknown>(null);
  async function submit(e?: FormEvent, demo?: "anton" | "mira") {
    e?.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const data = await login(
        demo ? `${demo}@folio.test` : email,
        demo ? "FolioDemo2026!" : password,
      );
      const next = params.get("next");
      navigate(
        next?.startsWith("/") && !next.startsWith("//")
          ? next
          : data.user.roles.includes("author") && !data.profileId
            ? "/studio/profile"
            : "/",
      );
    } catch (e) {
      setError(e);
    } finally {
      setBusy(false);
    }
  }
  if (user) {
    const target = params.get("next");
    return (
      <Navigate
        to={
          target?.startsWith("/") && !target.startsWith("//")
            ? target
            : user.roles.includes("author") && !profileId
              ? "/studio/profile"
              : "/"
        }
        replace
      />
    );
  }
  return (
    <AuthFrame>
      <p className="eyebrow">СНОВА В СВОЁМ ПРОСТРАНСТВЕ</p>
      <h1>Рады вас видеть.</h1>
      <p className="muted">Войдите, чтобы продолжить работу над идеями.</p>
      <form onSubmit={submit}>
        <ErrorNotice error={error} />
        <Field label="Email">
          <input
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="you@example.com"
          />
        </Field>
        <Field label="Пароль">
          <input
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </Field>
        <button className="btn btn-dark full-width" disabled={busy}>
          {busy ? "Входим…" : "Войти"}
          <ArrowRight size={17} />
        </button>
      </form>
      <p className="auth-switch">
        Ещё нет аккаунта?{" "}
        <Link
          to={`/register${params.get("next") ? `?next=${encodeURIComponent(params.get("next")!)}` : ""}`}
        >
          Присоединиться
        </Link>
      </p>
      {import.meta.env.DEV && (
        <div className="demo-login">
          <span>Локальная демонстрация</span>
          <button disabled={busy} onClick={() => submit(undefined, "anton")}>
            Войти как заказчик
          </button>
          <button disabled={busy} onClick={() => submit(undefined, "mira")}>
            Войти как автор
          </button>
        </div>
      )}
    </AuthFrame>
  );
}
export function Register() {
  const { register, user, profileId } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"client" | "author">(
    params.get("role") === "author" ? "author" : "client",
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<unknown>(null);
  if (user) {
    const target = params.get("next");
    return (
      <Navigate
        to={
          target?.startsWith("/") && !target.startsWith("//")
            ? target
            : user.roles.includes("author") && !profileId
              ? "/studio/profile"
              : "/"
        }
        replace
      />
    );
  }
  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await register(name, email, password, role);
      const next = params.get("next");
      navigate(
        next?.startsWith("/") && !next.startsWith("//")
          ? next
          : role === "author"
            ? "/studio/profile"
            : "/",
      );
    } catch (e) {
      setError(e);
    } finally {
      setBusy(false);
    }
  }
  return (
    <AuthFrame>
      <p className="eyebrow">НАЧАЛО НОВОЙ ИСТОРИИ</p>
      <h1>Найдите своё место.</h1>
      <p className="muted">Один аккаунт — для творчества и новых проектов.</p>
      <form onSubmit={submit}>
        <ErrorNotice error={error} />
        <div className="role-options">
          <label className={role === "client" ? "selected" : ""}>
            <input
              type="radio"
              name="role"
              checked={role === "client"}
              onChange={() => setRole("client")}
            />
            <BriefcaseBusiness size={21} />
            <strong>Я ищу автора</strong>
            <span>Хочу воплотить идею</span>
          </label>
          <label className={role === "author" ? "selected" : ""}>
            <input
              type="radio"
              name="role"
              checked={role === "author"}
              onChange={() => setRole("author")}
            />
            <Brush size={21} />
            <strong>Я создаю</strong>
            <span>Хочу показать работы</span>
          </label>
        </div>
        <Field label="Как вас зовут">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            minLength={2}
            maxLength={80}
            autoComplete="name"
          />
        </Field>
        <Field label="Email">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
        </Field>
        <Field label="Пароль" hint="Не менее 10 символов">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={10}
            maxLength={128}
            autoComplete="new-password"
          />
        </Field>
        <button className="btn btn-dark full-width" disabled={busy}>
          {busy ? "Создаём аккаунт…" : "Создать аккаунт"}
          <ArrowRight size={17} />
        </button>
      </form>
      <p className="auth-switch">
        Уже с нами? <Link to="/login">Войти</Link>
      </p>
    </AuthFrame>
  );
}
export function BecomeAuthor() {
  const { user, becomeAuthor } = useAuth();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<unknown>(null);
  if (user?.roles.includes("author")) return <Navigate to="/studio" replace />;
  return (
    <div className="container narrow standard-page">
      <p className="eyebrow">ВАША ЛИЧНАЯ МАСТЕРСКАЯ</p>
      <h1>Покажите, что вы создаёте.</h1>
      <p className="lead">
        Оформите профиль, добавьте работы и расскажите о своих услугах. Ваш
        аккаунт заказчика продолжит работать.
      </p>
      <div className="feature-list">
        {[
          "Портфолио с 3D-моделями, иллюстрациями и анимацией",
          "Профиль с вашим оформлением и порядком разделов",
          "Услуги, ориентиры по стоимости и входящие брифы",
        ].map((x) => (
          <p key={x}>
            <Check size={18} />
            {x}
          </p>
        ))}
      </div>
      <ErrorNotice error={error} />
      <button
        className="btn btn-dark"
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          try {
            await becomeAuthor();
            navigate("/studio/profile");
          } catch (e) {
            setError(e);
          } finally {
            setBusy(false);
          }
        }}
      >
        Открыть мастерскую <ArrowRight size={17} />
      </button>
    </div>
  );
}
