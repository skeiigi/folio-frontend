import type { CSSProperties } from "react";
import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowUpRight,
  Clock,
  RotateCcw,
  PenLine,
  ArrowRight,
} from "lucide-react";
import { api } from "../api";
import { useAuth } from "../auth";
import type { CreatorProfile } from "../types";
import { DEFAULT_LAYOUT } from "../types";
import {
  ArtworkCard,
  Avatar,
  BackLink,
  Empty,
  ErrorNotice,
  Loading,
  money,
  Status,
} from "../components/ui";

export default function Profile() {
  const { id } = useParams();
  const { user } = useAuth();
  const {
    data: p,
    isPending,
    error,
  } = useQuery({
    queryKey: ["creator", id],
    queryFn: () => api<CreatorProfile>(`/creators/${id}`),
  });
  if (isPending) return <Loading />;
  if (error || !p)
    return (
      <div className="container standard-page">
        <ErrorNotice error={error} />
        <BackLink to="/creators">К авторам</BackLink>
      </div>
    );
  const own = user?.id === p.userId;
  const config = { ...DEFAULT_LAYOUT, ...p.layoutConfig };
  const sections = {
    portfolio: (
      <section id="portfolio" className="profile-section" key="portfolio">
        <div className="section-heading">
          <h2>
            Портфолио{" "}
            <span>
              {p.artworks.filter((a) => a.status === "published").length}
            </span>
          </h2>
        </div>
        {p.artworks.filter((a) => a.status === "published").length ? (
          <div className={`art-grid columns-${config.columns}`}>
            {p.artworks
              .filter((a) => a.status === "published")
              .map((a) => (
                <ArtworkCard key={a.id} artwork={a} />
              ))}
          </div>
        ) : (
          <Empty
            title="Портфолио скоро появится"
            text="Автор готовит свои первые публикации."
          />
        )}
      </section>
    ),
    services: (
      <section id="services" className="profile-section" key="services">
        <div className="section-heading">
          <h2>Что я могу для вас сделать</h2>
          <p>Стоимость уточняется после обсуждения задачи</p>
        </div>
        {p.services.filter((s) => s.status === "active").length ? (
          <div className="services-grid">
            {p.services
              .filter((s) => s.status === "active")
              .map((s) => (
                <article className="service-card" key={s.id}>
                  <h3>{s.title}</h3>
                  <p>{s.description}</p>
                  <div className="service-terms">
                    {s.estimatedDays && (
                      <span>
                        <Clock size={14} />
                        от {s.estimatedDays} дней
                      </span>
                    )}
                    <span>
                      <RotateCcw size={14} />
                      {s.revisionRounds} круга правок
                    </span>
                  </div>
                  <div className="service-bottom">
                    <strong>{money(s.priceRange)}</strong>
                    {!own && (
                      <Link
                        to={`/creators/${p.id}/brief?service=${s.id}`}
                        className="icon-button"
                        aria-label={`Обсудить услугу ${s.title}`}
                      >
                        <ArrowUpRight size={20} />
                      </Link>
                    )}
                  </div>
                </article>
              ))}
          </div>
        ) : (
          <p className="muted">Автор пока не добавил услуги.</p>
        )}
      </section>
    ),
    about: (
      <section id="about" className="profile-section profile-about" key="about">
        <p className="eyebrow">НЕМНОГО ОБО МНЕ</p>
        <h2>
          За каждой работой —<br />
          свой взгляд.
        </h2>
        <p className="preserve-lines">
          {p.description || "Автор пока не добавил описание."}
        </p>
      </section>
    ),
  };
  return (
    <div
      className={`profile-page profile-theme-${config.theme} profile-font-${config.font}`}
      style={{ "--profile-accent": config.accent } as CSSProperties}
    >
      <div className="container">
        <BackLink to="/creators">Все авторы</BackLink>
        <header className="profile-hero">
          <div className="profile-identity">
            <Avatar name={p.publicName} url={p.avatarUrl} size="large" />
            <div>
              <p className="eyebrow">
                ПРОФИЛЬ АВТОРА{" "}
                {p.status !== "published" && <Status status={p.status} />}
              </p>
              <h1>{p.publicName}</h1>
              <div className="tag-row">
                {p.specialization.map((s) => (
                  <span className="tag" key={s}>
                    {s}
                  </span>
                ))}
              </div>
            </div>
          </div>
          <div className="profile-hero-action">
            {own ? (
              <Link className="btn btn-dark" to="/studio/profile">
                <PenLine size={16} />
                Оформить профиль
              </Link>
            ) : (
              <Link className="btn btn-profile" to={`/creators/${p.id}/brief`}>
                Обсудить проект <ArrowUpRight size={17} />
              </Link>
            )}
          </div>
        </header>
        <nav className="profile-section-nav" aria-label="Разделы профиля">
          {config.sections
            .filter(
              (s) => !config.hiddenSections.includes(s as "services" | "about"),
            )
            .map((s) => (
              <a href={`#${s}`} key={s}>
                {
                  {
                    portfolio: "Работы",
                    services: "Услуги",
                    about: "Об авторе",
                  }[s]
                }
              </a>
            ))}
        </nav>
        {config.sections
          .filter(
            (s) => !config.hiddenSections.includes(s as "services" | "about"),
          )
          .map((s) => sections[s])}
        {!own && (
          <div className="profile-bottom-cta">
            <h2>Давайте создадим что-нибудь вместе.</h2>
            <Link className="btn btn-profile" to={`/creators/${p.id}/brief`}>
              Рассказать об идее <ArrowRight size={17} />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
