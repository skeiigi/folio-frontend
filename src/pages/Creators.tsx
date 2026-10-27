import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowUpRight, Search } from "lucide-react";
import { api } from "../api";
import type { CreatorProfile, Page } from "../types";
import {
  Avatar,
  Empty,
  ErrorNotice,
  Loading,
  PageTitle,
} from "../components/ui";

export default function Creators() {
  const [search, setSearch] = useState("");
  const [q, setQ] = useState("");
  const { data, isPending, error } = useQuery({
    queryKey: ["creators", q],
    queryFn: () =>
      api<Page<CreatorProfile>>(
        `/creators?q=${encodeURIComponent(q)}&limit=60`,
      ),
  });
  return (
    <div className="container standard-page">
      <PageTitle
        eyebrow="ЛЮДИ ЗА РАБОТАМИ"
        title="Найдите своего автора"
        description="Разные стили и взгляды. Одна любовь к тому, что они делают."
      />
      <form
        className="search-box search-wide"
        onSubmit={(e) => {
          e.preventDefault();
          setQ(search);
        }}
      >
        <Search size={18} />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Имя, специализация или стиль"
          aria-label="Поиск автора"
        />
        <button className="search-submit" type="submit">
          Найти
        </button>
      </form>
      {isPending ? (
        <Loading />
      ) : error ? (
        <ErrorNotice error={error} />
      ) : data?.items.length ? (
        <div className="creator-grid">
          {data.items.map((p, i) => (
            <Link className="creator-card" to={`/creators/${p.id}`} key={p.id}>
              <div className={`creator-banner creator-banner-${i % 3}`}>
                <span>
                  {p.publicName
                    .split(" ")
                    .map((x) => x[0])
                    .join("")}
                </span>
                <ArrowUpRight size={24} />
              </div>
              <div className="creator-card-body">
                <Avatar name={p.publicName} url={p.avatarUrl} size="large" />
                <h2>{p.publicName}</h2>
                <div className="tag-row">
                  {p.specialization.slice(0, 3).map((s) => (
                    <span className="tag" key={s}>
                      {s}
                    </span>
                  ))}
                </div>
                <p className="clamp-3">{p.description}</p>
                <div className="creator-card-foot">
                  <span>{p.artworkCount || 0} работ в портфолио</span>
                  <ArrowUpRight size={17} />
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <Empty
          title="Автор пока не нашёлся"
          text="Попробуйте другое имя или специализацию."
        />
      )}
    </div>
  );
}
