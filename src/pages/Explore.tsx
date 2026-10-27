import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  ArrowUpRight,
  Search,
  SlidersHorizontal,
  X,
  Sparkles,
} from "lucide-react";
import { api } from "../api";
import { useAuth } from "../auth";
import type { Artwork, Page, Meta } from "../types";
import { WORK_TYPES } from "../types";
import { ArtworkCard, Empty, ErrorNotice, Loading } from "../components/ui";

export default function Explore() {
  const { user } = useAuth();
  const [params, setParams] = useSearchParams();
  const q = params.get("q") || "";
  const type = params.get("workType") || "";
  const style = params.get("style") || "";
  const page = Number(params.get("page") || 1);
  const [search, setSearch] = useState(q);
  const [filters, setFilters] = useState(false);
  const works = useQuery({
    queryKey: ["artworks", params.toString()],
    queryFn: () => api<Page<Artwork>>(`/artworks?${params.toString()}`),
  });
  const meta = useQuery({
    queryKey: ["meta"],
    queryFn: () => api<Meta>("/meta"),
  });
  function change(key: string, value: string) {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    if (key !== "page") next.delete("page");
    setParams(next);
  }
  return (
    <div className="container explore-page">
      <section className="explore-hero">
        <div className="hero-copy">
          <p className="eyebrow">
            <span className="live-dot" /> ПРОСТРАНСТВО ДЛЯ ТВОРЧЕСТВА
          </p>
          <h1>
            Работы, которые
            <br />
            хочется <span>рассмотреть.</span>
          </h1>
          <p className="hero-description">
            Открывайте новые миры, находите свой стиль
            <br className="desktop-break" /> и авторов для следующей большой
            идеи.
          </p>
          <Link className="text-link" to="/creators">
            Найти своего автора <ArrowUpRight size={17} />
          </Link>
        </div>
        <div className="hero-note">
          <div className="hero-orbit">
            <span />
            <span />
            <span />
            <Sparkles size={28} />
          </div>
          <p>
            У каждой идеи
            <br />
            есть свой автор.
          </p>
          <div className="hero-note-bottom">
            <span>3D · ИЛЛЮСТРАЦИЯ · АНИМАЦИЯ</span>
            <ArrowUpRight size={20} />
          </div>
        </div>
      </section>
      <section className="discovery">
        <div className="section-heading">
          <h2>
            Свежий взгляд <span>{meta.data?.stats.artworks ?? "—"}</span>
          </h2>
          <p>Новые работы сообщества</p>
        </div>
        <div className="discovery-toolbar">
          <div className="filter-tabs" role="group" aria-label="Формат работы">
            <button
              className={!type ? "active" : ""}
              onClick={() => change("workType", "")}
            >
              Все работы
            </button>
            {Object.entries(WORK_TYPES)
              .filter(([key]) => key !== "other")
              .map(([key, name]) => (
                <button
                  key={key}
                  className={type === key ? "active" : ""}
                  onClick={() => change("workType", key)}
                >
                  {name}
                </button>
              ))}
          </div>
          <div className="toolbar-right">
            <form
              className="search-box"
              onSubmit={(e) => {
                e.preventDefault();
                change("q", search);
              }}
            >
              <Search size={17} />
              <input
                aria-label="Поиск работ"
                placeholder="Найти вдохновение…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              {search && (
                <button
                  type="button"
                  aria-label="Сбросить поиск"
                  onClick={() => {
                    setSearch("");
                    change("q", "");
                  }}
                >
                  <X size={14} />
                </button>
              )}
            </form>
            <button
              className={`icon-button filter-toggle ${filters ? "selected" : ""}`}
              aria-label="Фильтр по стилю"
              aria-expanded={filters}
              onClick={() => setFilters(!filters)}
            >
              <SlidersHorizontal size={18} />
            </button>
          </div>
        </div>
        {filters && (
          <div className="filter-panel">
            <label>
              Стиль{" "}
              <select
                value={style}
                onChange={(e) => change("style", e.target.value)}
              >
                <option value="">Любой стиль</option>
                {[
                  "Stylized",
                  "Low-poly",
                  "Sci-fi",
                  "Botanical",
                  "Abstract",
                  "Landscape",
                ].map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </label>
            {style && (
              <button className="text-link" onClick={() => change("style", "")}>
                Сбросить <X size={14} />
              </button>
            )}
          </div>
        )}
        {works.isPending ? (
          <div className="art-grid">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <div className="skeleton-card" key={i}>
                <div />
                <span />
              </div>
            ))}
          </div>
        ) : works.isError ? (
          <>
            <ErrorNotice error={works.error} />
            <button className="btn btn-outline" onClick={() => works.refetch()}>
              Попробовать снова
            </button>
          </>
        ) : works.data.items.length ? (
          <>
            <div className="art-grid">
              {works.data.items.map((a) => (
                <ArtworkCard key={a.id} artwork={a} />
              ))}
            </div>
            {works.data.total > works.data.limit && (
              <div className="pagination">
                <button
                  className="btn btn-outline"
                  disabled={page === 1}
                  onClick={() => change("page", String(page - 1))}
                >
                  Назад
                </button>
                <span>Страница {page}</span>
                <button
                  className="btn btn-outline"
                  disabled={page * works.data.limit >= works.data.total}
                  onClick={() => change("page", String(page + 1))}
                >
                  Дальше <ArrowRight size={16} />
                </button>
              </div>
            )}
          </>
        ) : (
          <Empty
            title="Пока ничего не нашлось"
            text="Попробуйте другой запрос или снимите фильтры."
            action={
              <button
                className="btn btn-dark"
                onClick={() => {
                  setSearch("");
                  setParams({});
                }}
              >
                Показать все работы
              </button>
            }
          />
        )}
      </section>
      <section className="join-strip">
        <div>
          <p className="eyebrow">МЕСТО ДЛЯ ВАШИХ РАБОТ</p>
          <h2>
            Создавайте. Показывайте.
            <br />
            Находите друг друга.
          </h2>
        </div>
        <Link
          className="btn btn-light"
          to={
            user?.roles.includes("author")
              ? "/studio/artworks/new"
              : user
                ? "/become-author"
                : "/register?role=author"
          }
        >
          Присоединиться к Folio <ArrowUpRight size={18} />
        </Link>
      </section>
    </div>
  );
}
