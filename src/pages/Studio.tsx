import { useEffect, useState, type FormEvent, type CSSProperties } from "react";
import { Link, NavLink, useNavigate, useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowUpRight,
  ArrowUp,
  ArrowDown,
  Plus,
  PenLine,
  Palette,
  Layers,
  FileText,
  Eye,
  Trash2,
  Check,
  ArrowRight,
} from "lucide-react";
import { api, uploadFile, errorMessage } from "../api";
import { useAuth } from "../auth";
import type {
  Artwork,
  CreatorProfile,
  LayoutConfig,
  Service,
  Page,
  Brief,
} from "../types";
import { DEFAULT_LAYOUT, WORK_TYPES } from "../types";
import {
  ArtworkCard,
  Avatar,
  BackLink,
  ConfirmDialog,
  Empty,
  ErrorNotice,
  Field,
  FilePicker,
  Loading,
  PageTitle,
  Status,
  money,
  useToast,
} from "../components/ui";

export function StudioNav() {
  return (
    <nav className="studio-nav" aria-label="Мастерская">
      <NavLink to="/studio" end>
        <Layers size={16} />
        Мои работы
      </NavLink>
      <NavLink to="/studio/profile">
        <Palette size={16} />
        Мой профиль
      </NavLink>
      <NavLink to="/studio/services">
        <FileText size={16} />
        Услуги
      </NavLink>
      <NavLink to="/briefs?side=received">
        <ArrowUpRight size={16} />
        Входящие брифы
      </NavLink>
    </nav>
  );
}
export function Studio() {
  const { user } = useAuth();
  const profile = useQuery({
    queryKey: ["my-profile"],
    queryFn: () => api<CreatorProfile | null>("/me/profile"),
  });
  const works = useQuery({
    queryKey: ["my-artworks"],
    queryFn: () => api<Artwork[]>("/me/artworks"),
  });
  const briefs = useQuery({
    queryKey: ["new-briefs", user?.id],
    queryFn: () =>
      api<Page<Brief>>("/me/briefs?side=received&status=submitted"),
  });
  return (
    <div className="container standard-page">
      <PageTitle
        eyebrow="ВАША МАСТЕРСКАЯ"
        title={`С возвращением, ${user?.name.split(" ")[0]}.`}
        description="Здесь ваши работы находят своих людей."
        actions={
          <Link className="btn btn-dark" to="/studio/artworks/new">
            <Plus size={17} />
            Добавить работу
          </Link>
        }
      />
      <StudioNav />
      {profile.isPending || works.isPending ? (
        <Loading />
      ) : profile.error || works.error ? (
        <ErrorNotice error={profile.error || works.error} />
      ) : !profile.data ? (
        <Empty
          title="Начнём с вашего профиля"
          text="Выберите имя, специализацию и оформление. Затем можно будет публиковать работы."
          action={
            <Link to="/studio/profile" className="btn btn-dark">
              Создать профиль <ArrowRight size={16} />
            </Link>
          }
        />
      ) : (
        <>
          <div className="studio-stats">
            <div>
              <span>В портфолио</span>
              <strong>
                {works.data?.filter((a) => a.status === "published").length ||
                  0}
                <small>работ</small>
              </strong>
            </div>
            <div>
              <span>Черновики</span>
              <strong>
                {works.data?.filter((a) => a.status === "draft").length || 0}
                <small>идей в процессе</small>
              </strong>
            </div>
            <Link to="/briefs?side=received&status=submitted">
              <span>
                Новые брифы <ArrowUpRight size={15} />
              </span>
              <strong>
                {briefs.data?.total || 0}
                <small>ждут вашего ответа</small>
              </strong>
            </Link>
          </div>
          <div className="studio-profile-strip">
            <Avatar name={profile.data.publicName} />
            <div>
              <strong>{profile.data.publicName}</strong>
              <Status status={profile.data.status} />
            </div>
            <Link to={`/creators/${profile.data.id}`} className="text-link">
              Посмотреть профиль <ArrowUpRight size={15} />
            </Link>
          </div>
          {works.data?.length ? (
            <div className="art-grid">
              {works.data.map((a) => (
                <ArtworkCard key={a.id} artwork={a} editable />
              ))}
            </div>
          ) : (
            <Empty
              title="Покажите свою первую работу"
              text="Добавьте описание и обложку, а для 3D — файл модели, который можно вращать."
              action={
                <Link className="btn btn-dark" to="/studio/artworks/new">
                  Добавить работу
                </Link>
              }
            />
          )}
        </>
      )}
    </div>
  );
}

export function ProfileEditor() {
  const { user, refresh } = useAuth();
  const query = useQueryClient();
  const toast = useToast();
  const {
    data: p,
    isPending,
    error,
  } = useQuery({
    queryKey: ["my-profile"],
    queryFn: () => api<CreatorProfile | null>("/me/profile"),
  });
  const [name, setName] = useState(user?.name || "");
  const [specialization, setSpecialization] = useState("");
  const [description, setDescription] = useState("");
  const [avatar, setAvatar] = useState("");
  const [status, setStatus] = useState("draft");
  const [layout, setLayout] = useState<LayoutConfig>(DEFAULT_LAYOUT);
  const [busy, setBusy] = useState(false);
  const [saveError, setSaveError] = useState<unknown>(null);
  useEffect(() => {
    if (p) {
      setName(p.publicName);
      setSpecialization(p.specialization.join(", "));
      setDescription(p.description);
      setAvatar(p.avatarUrl);
      setStatus(p.status);
      setLayout({ ...DEFAULT_LAYOUT, ...p.layoutConfig });
    }
  }, [p]);
  async function save(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setSaveError(null);
    try {
      const data = await api<CreatorProfile>(
        p ? `/creators/${p.id}` : "/creator-profiles",
        {
          method: p ? "PATCH" : "POST",
          json: {
            publicName: name,
            specialization: specialization
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean),
            description,
            avatarUrl: avatar,
            layoutConfig: layout,
            status,
          },
        },
      );
      await refresh();
      await query.invalidateQueries({ queryKey: ["my-profile"] });
      query.invalidateQueries({ queryKey: ["creator", data.id] });
      query.invalidateQueries({ queryKey: ["creators"] });
      query.invalidateQueries({ queryKey: ["meta"] });
      toast("Профиль сохранён.");
    } catch (e) {
      setSaveError(e);
    } finally {
      setBusy(false);
    }
  }
  function move(index: number, delta: number) {
    const sections = [...layout.sections];
    const target = index + delta;
    if (target < 0 || target >= sections.length) return;
    [sections[index], sections[target]] = [sections[target], sections[index]];
    setLayout({ ...layout, sections });
  }
  if (isPending) return <Loading />;
  return (
    <div className="container standard-page">
      <PageTitle
        eyebrow="ВАША МАСТЕРСКАЯ"
        title="Профиль с вашим характером"
        description="Расскажите о себе и создайте пространство, которое подходит вашим работам."
      />
      <StudioNav />
      <ErrorNotice error={error} />
      <form className="editor-layout" onSubmit={save}>
        <div className="editor-main">
          <ErrorNotice error={saveError} />
          <section className="form-section">
            <h2>Давайте познакомимся</h2>
            <Field label="Имя или псевдоним">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                minLength={2}
                maxLength={80}
                required
              />
            </Field>
            <Field
              label="Специализации"
              hint="Через запятую. Например: 3D-моделирование, Stylized, Окружение"
            >
              <input
                value={specialization}
                onChange={(e) => setSpecialization(e.target.value)}
                required
              />
            </Field>
            <Field label="О себе">
              <textarea
                rows={6}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={4000}
                placeholder="Что вы создаёте, как работаете, какие проекты вам близки?"
              />
            </Field>
            <Field
              label="Ссылка на аватар"
              hint="Необязательно. Ссылка на изображение по HTTPS."
            >
              <input
                type="url"
                value={avatar}
                onChange={(e) => setAvatar(e.target.value)}
                placeholder="https://…"
              />
            </Field>
          </section>
          <section className="form-section">
            <h2>Оформление</h2>
            <div className="theme-options">
              {(["paper", "sage", "night"] as const).map((theme) => (
                <button
                  type="button"
                  className={`theme-swatch theme-${theme} ${layout.theme === theme ? "selected" : ""}`}
                  key={theme}
                  onClick={() => setLayout({ ...layout, theme })}
                >
                  <span>{layout.theme === theme && <Check size={20} />}</span>
                  {{ paper: "Бумага", sage: "Шалфей", night: "Ночь" }[theme]}
                </button>
              ))}
            </div>
            <div className="field-row">
              <Field label="Акцентный цвет">
                <input
                  className="color-input"
                  type="color"
                  value={layout.accent}
                  onChange={(e) =>
                    setLayout({ ...layout, accent: e.target.value })
                  }
                />
              </Field>
              <Field label="Шрифт">
                <select
                  value={layout.font}
                  onChange={(e) =>
                    setLayout({
                      ...layout,
                      font: e.target.value as LayoutConfig["font"],
                    })
                  }
                >
                  <option value="sans">Современный</option>
                  <option value="serif">Редакционный</option>
                </select>
              </Field>
              <Field label="Работ в строке">
                <select
                  value={layout.columns}
                  onChange={(e) =>
                    setLayout({
                      ...layout,
                      columns: Number(e.target.value) as 2 | 3,
                    })
                  }
                >
                  <option value={2}>Две</option>
                  <option value={3}>Три</option>
                </select>
              </Field>
            </div>
            <h3>Порядок разделов</h3>
            <div className="section-order">
              {layout.sections.map((section, index) => (
                <div key={section}>
                  <strong>
                    {
                      {
                        portfolio: "Портфолио",
                        services: "Услуги",
                        about: "Об авторе",
                      }[section]
                    }
                  </strong>
                  <div>
                    {section !== "portfolio" && (
                      <label className="check-inline">
                        <input
                          type="checkbox"
                          checked={!layout.hiddenSections.includes(section)}
                          onChange={(e) =>
                            setLayout({
                              ...layout,
                              hiddenSections: e.target.checked
                                ? layout.hiddenSections.filter(
                                    (s) => s !== section,
                                  )
                                : [...layout.hiddenSections, section],
                            })
                          }
                        />
                        Показывать
                      </label>
                    )}
                    <button
                      className="icon-button"
                      type="button"
                      aria-label={`Поднять раздел ${section}`}
                      disabled={index === 0}
                      onClick={() => move(index, -1)}
                    >
                      <ArrowUp size={16} />
                    </button>
                    <button
                      className="icon-button"
                      type="button"
                      aria-label={`Опустить раздел ${section}`}
                      disabled={index === 2}
                      onClick={() => move(index, 1)}
                    >
                      <ArrowDown size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
          <section className="form-section">
            <Field label="Видимость профиля">
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="draft">Черновик — виден только мне</option>
                <option value="published">Опубликован — виден всем</option>
                <option value="hidden">Скрыт — без публичного доступа</option>
              </select>
            </Field>
            <div className="form-actions">
              <button className="btn btn-dark" disabled={busy}>
                {busy ? "Сохраняем…" : "Сохранить профиль"}
                <Check size={17} />
              </button>
              {p && (
                <Link to={`/creators/${p.id}`} className="btn btn-outline">
                  <Eye size={17} />
                  Посмотреть
                </Link>
              )}
            </div>
          </section>
        </div>
        <aside className="editor-preview">
          <span className="eyebrow">КАК ЭТО БУДЕТ ВЫГЛЯДЕТЬ</span>
          <div
            className={`profile-mini profile-theme-${layout.theme} profile-font-${layout.font}`}
            style={{ "--profile-accent": layout.accent } as CSSProperties}
          >
            <Avatar name={name || "Ваше имя"} url={avatar} size="large" />
            <h2>{name || "Ваше имя"}</h2>
            <p>{specialization || "Ваша специализация"}</p>
            <span className="mini-cta" style={{ background: layout.accent }}>
              Обсудить проект <ArrowUpRight size={12} />
            </span>
            {layout.sections
              .filter(
                (s) =>
                  !layout.hiddenSections.includes(s as "services" | "about"),
              )
              .map((section) => (
                <section key={section}>
                  <strong>
                    {
                      {
                        portfolio: "Портфолио",
                        services: "Услуги",
                        about: "Об авторе",
                      }[section]
                    }
                  </strong>
                  {section === "portfolio" ? (
                    <div className={`mini-gallery cols-${layout.columns}`}>
                      <i />
                      <i />
                      <i />
                    </div>
                  ) : section === "services" ? (
                    <div className="mini-service">
                      Ваш талант — чей-то следующий проект.
                    </div>
                  ) : (
                    <p className="clamp-3">
                      {description || "Здесь будет ваша история."}
                    </p>
                  )}
                </section>
              ))}
          </div>
        </aside>
      </form>
    </div>
  );
}

export function ArtworkEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const query = useQueryClient();
  const toast = useToast();
  const [draftId, setDraftId] = useState<string | null>(id || null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<Artwork["workType"]>("model3d");
  const [style, setStyle] = useState("");
  const [polygons, setPolygons] = useState("");
  const [texture, setTexture] = useState("");
  const [software, setSoftware] = useState("");
  const [engine, setEngine] = useState("");
  const [cover, setCover] = useState<File | null>(null);
  const [model, setModel] = useState<File | null>(null);
  const [preview, setPreview] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [saveError, setSaveError] = useState<unknown>(null);
  const [archiving, setArchiving] = useState(false);
  const artwork = useQuery({
    queryKey: ["artwork", id],
    queryFn: () => api<Artwork>(`/artworks/${id}`),
    enabled: !!id,
  });
  const [saved, setSaved] = useState<Artwork | null>(null);
  useEffect(() => {
    if (artwork.data) {
      const a = artwork.data;
      setSaved(a);
      setTitle(a.title);
      setDescription(a.description);
      setType(a.workType);
      setStyle(a.style);
      setPolygons(a.technicalDetails.polygonCount?.toString() || "");
      setTexture(a.technicalDetails.textureResolution || "");
      setSoftware(a.technicalDetails.software || "");
      setEngine(a.technicalDetails.engine || "");
    }
  }, [artwork.data]);
  async function save(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const publish =
      (e.nativeEvent as SubmitEvent).submitter?.getAttribute("value") ===
      "publish";
    setBusy(true);
    setSaveError(null);
    try {
      const technicalDetails = {
        ...(polygons ? { polygonCount: Number(polygons) } : {}),
        textureResolution: texture,
        software,
        engine,
      };
      const fields = {
        title,
        description,
        workType: type,
        style,
        technicalDetails,
        status: "draft",
      };
      const a = await api<Artwork>(
        draftId ? `/artworks/${draftId}` : "/artworks",
        { method: draftId ? "PATCH" : "POST", json: fields },
      );
      setDraftId(a.id);
      setSaved(a);
      if (cover) {
        await uploadFile(`/artworks/${a.id}/media`, cover, "cover");
        setCover(null);
      }
      if (model) {
        await uploadFile(`/artworks/${a.id}/media`, model, "model");
        setModel(null);
      }
      if (preview) {
        await uploadFile(`/artworks/${a.id}/media`, preview, "preview");
        setPreview(null);
      }
      if (publish)
        await api(`/artworks/${a.id}`, {
          method: "PATCH",
          json: { status: "published" },
        });
      await query.invalidateQueries({ queryKey: ["my-artworks"] });
      query.invalidateQueries({ queryKey: ["artworks"] });
      query.invalidateQueries({ queryKey: ["creator"] });
      query.invalidateQueries({ queryKey: ["meta"] });
      toast(publish ? "Работа опубликована." : "Черновик сохранён.");
      navigate("/studio");
    } catch (e) {
      setSaveError(e);
    } finally {
      setBusy(false);
    }
  }
  if (id && artwork.isPending) return <Loading />;
  return (
    <div className="container standard-page">
      <BackLink to="/studio">В мастерскую</BackLink>
      <PageTitle
        eyebrow="ПОКАЖИТЕ СВОЙ ВЗГЛЯД"
        title={id ? "Редактировать работу" : "Новая работа"}
        description="Контекст делает портфолио сильнее. Расскажите, что стоит за результатом."
      />
      <form className="editor-layout" onSubmit={save}>
        <div className="editor-main">
          <ErrorNotice error={artwork.error || saveError} />
          <section className="form-section">
            <h2>О проекте</h2>
            <Field label="Название работы">
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                minLength={2}
                maxLength={120}
                placeholder="Дайте работе имя"
              />
            </Field>
            <div className="field-row">
              <Field label="Формат">
                <select
                  value={type}
                  onChange={(e) =>
                    setType(e.target.value as Artwork["workType"])
                  }
                >
                  {Object.entries(WORK_TYPES).map(([v, label]) => (
                    <option key={v} value={v}>
                      {label}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Стиль">
                <input
                  value={style}
                  onChange={(e) => setStyle(e.target.value)}
                  required
                  minLength={2}
                  maxLength={60}
                  placeholder="Например, Low-poly"
                />
              </Field>
            </div>
            <Field
              label="Описание"
              hint="Задача, идея, процесс и результат. Не менее 10 символов."
            >
              <textarea
                rows={6}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                minLength={10}
                maxLength={8000}
              />
            </Field>
          </section>
          <section className="form-section">
            <h2>Файлы работы</h2>
            <p className="muted small">
              Обложка нужна для публикации. Максимальный размер каждого файла —
              20 МБ.
            </p>
            <FilePicker
              label={
                saved?.media.some((m) => m.purpose === "cover")
                  ? "Заменить обложку"
                  : "Добавить обложку"
              }
              hint="PNG, JPEG, WebP или GIF"
              accept="image/png,image/jpeg,image/webp,image/gif"
              file={cover}
              onChange={setCover}
            />
            {type === "model3d" && (
              <>
                <FilePicker
                  label={
                    saved?.media.some((m) => m.purpose === "model")
                      ? "Заменить 3D-модель"
                      : "Добавить 3D-модель"
                  }
                  hint="GLB · модель можно будет вращать в браузере"
                  accept=".glb"
                  file={model}
                  onChange={setModel}
                />
                <p className="small muted">
                  Загружайте подготовленное публичное превью. Файл GLB будет
                  доступен браузерам посетителей.
                </p>
              </>
            )}
            {type === "animation" && (
              <FilePicker
                label="Добавить анимацию"
                hint="GIF или MP4"
                accept="image/gif,video/mp4"
                file={preview}
                onChange={setPreview}
              />
            )}
          </section>
          <section className="form-section">
            <h2>Технические детали</h2>
            <div className="field-row">
              <Field label="Количество полигонов">
                <input
                  type="number"
                  min={0}
                  max={50000000}
                  value={polygons}
                  onChange={(e) => setPolygons(e.target.value)}
                  placeholder="Необязательно"
                />
              </Field>
              <Field label="Текстуры">
                <input
                  value={texture}
                  onChange={(e) => setTexture(e.target.value)}
                  maxLength={60}
                  placeholder="Например, 2048 × 2048"
                />
              </Field>
            </div>
            <div className="field-row">
              <Field label="Инструменты">
                <input
                  value={software}
                  onChange={(e) => setSoftware(e.target.value)}
                  maxLength={120}
                  placeholder="Blender, Photoshop…"
                />
              </Field>
              <Field label="Движок">
                <input
                  value={engine}
                  onChange={(e) => setEngine(e.target.value)}
                  maxLength={120}
                  placeholder="Unity, Unreal Engine…"
                />
              </Field>
            </div>
          </section>
          <div className="form-actions sticky-actions">
            <button
              className="btn btn-dark"
              type="submit"
              value="publish"
              disabled={busy}
            >
              {busy ? "Сохраняем…" : "Опубликовать работу"}
              <ArrowUpRight size={17} />
            </button>
            <button
              className="btn btn-outline"
              type="submit"
              value="draft"
              disabled={busy}
            >
              Сохранить черновик
            </button>
            {id && (
              <button
                className="icon-button danger-text"
                type="button"
                aria-label="Архивировать работу"
                onClick={() => setArchiving(true)}
              >
                <Trash2 size={18} />
              </button>
            )}
          </div>
        </div>
        <aside className="editor-aside">
          <span className="editor-aside-icon">
            <Layers size={24} />
          </span>
          <h3>Расскажите больше, чем показывает обложка.</h3>
          <p>
            Для заказчика важны стиль, контекст и ограничения. Технические
            детали помогают понять, подходит ли работа для его проекта.
          </p>
          <ul>
            <li>Выберите понятную обложку</li>
            <li>Опишите свою задачу и вклад</li>
            <li>Покажите результат со всех сторон</li>
          </ul>
          <Link className="text-link" to="/studio/profile">
            Настроить профиль <ArrowUpRight size={15} />
          </Link>
        </aside>
      </form>
      {archiving && (
        <ConfirmDialog
          title="Убрать работу в архив?"
          onClose={() => setArchiving(false)}
          onConfirm={async () => {
            try {
              await api(`/artworks/${id}`, { method: "DELETE" });
              query.invalidateQueries();
              toast("Работа перемещена в архив.");
              navigate("/studio");
            } catch (e) {
              setSaveError(e);
              setArchiving(false);
            }
          }}
        >
          Она исчезнет из каталога, но сохранится в мастерской.
        </ConfirmDialog>
      )}
    </div>
  );
}

const emptyService = () => ({
  title: "",
  description: "",
  min: "5000",
  max: "15000",
  currency: "RUB",
  days: "5",
  revisions: "2",
  status: "active",
});
export function Services() {
  const query = useQueryClient();
  const toast = useToast();
  const {
    data: services,
    isPending,
    error,
  } = useQuery({
    queryKey: ["my-services"],
    queryFn: () => api<Service[]>("/me/services"),
  });
  const [form, setForm] = useState(emptyService);
  const [editing, setEditing] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [saveError, setSaveError] = useState<unknown>(null);
  const [hide, setHide] = useState<string | null>(null);
  const update = (key: keyof ReturnType<typeof emptyService>, value: string) =>
    setForm({ ...form, [key]: value });
  function edit(s: Service) {
    setEditing(s.id);
    setForm({
      title: s.title,
      description: s.description,
      min: String(s.priceRange.min),
      max: String(s.priceRange.max),
      currency: s.priceRange.currency,
      days: s.estimatedDays ? String(s.estimatedDays) : "",
      revisions: String(s.revisionRounds),
      status: s.status,
    });
    document
      .getElementById("service-editor")
      ?.scrollIntoView({ behavior: "smooth" });
  }
  async function save(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setSaveError(null);
    try {
      await api(editing ? `/services/${editing}` : "/services", {
        method: editing ? "PATCH" : "POST",
        json: {
          title: form.title,
          description: form.description,
          priceRange: {
            min: Number(form.min),
            max: Number(form.max),
            currency: form.currency,
          },
          estimatedDays: form.days ? Number(form.days) : null,
          revisionRounds: Number(form.revisions),
          status: form.status,
        },
      });
      query.invalidateQueries({ queryKey: ["my-services"] });
      query.invalidateQueries({ queryKey: ["creator"] });
      setForm(emptyService());
      setEditing(null);
      toast("Услуга сохранена.");
    } catch (e) {
      setSaveError(e);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="container standard-page">
      <PageTitle
        eyebrow="ВАША МАСТЕРСКАЯ"
        title="Понятные услуги. Хорошее начало."
        description="Обозначьте состав работы, ориентир по цене и границы правок."
      />
      <StudioNav />
      {isPending ? (
        <Loading />
      ) : (
        <>
          <ErrorNotice error={error} />
          <div className="services-grid studio-services">
            {services?.map((s) => (
              <article className="service-card" key={s.id}>
                <div className="card-topline">
                  <h3>{s.title}</h3>
                  <Status status={s.status} />
                </div>
                <p>{s.description}</p>
                <div className="service-terms">
                  {s.estimatedDays || "—"} дней · {s.revisionRounds} круга
                  правок
                </div>
                <div className="service-bottom">
                  <strong>{money(s.priceRange)}</strong>
                  <div>
                    <button
                      className="icon-button"
                      aria-label={`Изменить услугу ${s.title}`}
                      onClick={() => edit(s)}
                    >
                      <PenLine size={17} />
                    </button>
                    {s.status !== "hidden" && (
                      <button
                        className="icon-button"
                        aria-label={`Скрыть услугу ${s.title}`}
                        onClick={() => setHide(s.id)}
                      >
                        <Trash2 size={17} />
                      </button>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>
          <form
            id="service-editor"
            className="service-editor form-section"
            onSubmit={save}
          >
            <h2>{editing ? "Редактировать услугу" : "Добавить услугу"}</h2>
            <ErrorNotice error={saveError} />
            <Field label="Название">
              <input
                value={form.title}
                onChange={(e) => update("title", e.target.value)}
                required
                minLength={3}
                maxLength={120}
                placeholder="Например, игровой пропс"
              />
            </Field>
            <Field label="Что входит в работу">
              <textarea
                rows={4}
                value={form.description}
                onChange={(e) => update("description", e.target.value)}
                required
                minLength={10}
                maxLength={3000}
              />
            </Field>
            <div className="field-row">
              <Field label="Стоимость от">
                <input
                  type="number"
                  min={0}
                  value={form.min}
                  onChange={(e) => update("min", e.target.value)}
                  required
                />
              </Field>
              <Field label="Стоимость до">
                <input
                  type="number"
                  min={Number(form.min)}
                  value={form.max}
                  onChange={(e) => update("max", e.target.value)}
                  required
                />
              </Field>
              <Field label="Валюта">
                <select
                  value={form.currency}
                  onChange={(e) => update("currency", e.target.value)}
                >
                  <option>RUB</option>
                  <option>USD</option>
                  <option>EUR</option>
                </select>
              </Field>
            </div>
            <div className="field-row">
              <Field label="Примерный срок, дней">
                <input
                  type="number"
                  min={1}
                  max={730}
                  value={form.days}
                  onChange={(e) => update("days", e.target.value)}
                />
              </Field>
              <Field label="Кругов правок">
                <input
                  type="number"
                  min={0}
                  max={50}
                  value={form.revisions}
                  onChange={(e) => update("revisions", e.target.value)}
                  required
                />
              </Field>
              <Field label="Видимость">
                <select
                  value={form.status}
                  onChange={(e) => update("status", e.target.value)}
                >
                  <option value="active">Активна</option>
                  <option value="draft">Черновик</option>
                  <option value="hidden">Скрыта</option>
                </select>
              </Field>
            </div>
            <div className="form-actions">
              <button className="btn btn-dark" disabled={busy}>
                {busy
                  ? "Сохраняем…"
                  : editing
                    ? "Сохранить изменения"
                    : "Добавить услугу"}
                <Plus size={17} />
              </button>
              {editing && (
                <button
                  className="btn btn-ghost"
                  type="button"
                  onClick={() => {
                    setEditing(null);
                    setForm(emptyService());
                  }}
                >
                  Отменить редактирование
                </button>
              )}
            </div>
          </form>
        </>
      )}
      {hide && (
        <ConfirmDialog
          title="Скрыть услугу?"
          onClose={() => setHide(null)}
          onConfirm={async () => {
            try {
              await api(`/services/${hide}`, { method: "DELETE" });
              query.invalidateQueries({ queryKey: ["my-services"] });
              query.invalidateQueries({ queryKey: ["creator"] });
              toast("Услуга скрыта.");
            } catch (e) {
              setSaveError(e);
            } finally {
              setHide(null);
            }
          }}
        >
          Посетители не будут видеть её в вашем профиле.
        </ConfirmDialog>
      )}
    </div>
  );
}
