import { createElement, useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowUpRight,
  Box,
  RotateCcw,
  Pause,
  Play,
  Move,
  Maximize2,
  ImageIcon,
} from "lucide-react";
import { api, mediaUrl, mediaBlob } from "../api";
import type { Artwork as ArtworkType, MediaFile } from "../types";
import { WORK_TYPES } from "../types";
import {
  Avatar,
  BackLink,
  ErrorNotice,
  Loading,
  MediaImage,
  date,
} from "../components/ui";

function Model({
  model,
  poster,
  privateFile,
}: {
  model: MediaFile;
  poster?: MediaFile;
  privateFile: boolean;
}) {
  const ref = useRef<HTMLElement | null>(null);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [rotate, setRotate] = useState(true);
  const [src, setSrc] = useState(privateFile ? "" : mediaUrl(model.id));
  useEffect(() => {
    let object = "";
    let alive = true;
    import("@google/model-viewer")
      .then(() => {
        if (alive) setReady(true);
      })
      .catch(() => setFailed(true));
    if (privateFile)
      mediaBlob(model.id)
        .then((b) => {
          object = URL.createObjectURL(b);
          if (alive) setSrc(object);
        })
        .catch(() => setFailed(true));
    return () => {
      alive = false;
      if (object) URL.revokeObjectURL(object);
    };
  }, [model.id, privateFile]);
  useEffect(() => {
    const node = ref.current;
    const onError = () => setFailed(true);
    node?.addEventListener("error", onError);
    return () => node?.removeEventListener("error", onError);
  }, [ready]);
  if (failed)
    return (
      <div className="model-fallback">
        <MediaImage
          media={poster}
          alt="Обложка работы"
          privateFile={privateFile}
        />
        <span>
          3D-просмотр недоступен на этом устройстве. Попробуйте браузер с
          поддержкой WebGL.
        </span>
      </div>
    );
  return (
    <div className="model-shell">
      {ready && src ? (
        createElement("model-viewer", {
          ref,
          src,
          poster: !privateFile && poster ? mediaUrl(poster.id) : undefined,
          alt: "Интерактивная 3D-модель",
          "camera-controls": true,
          "auto-rotate": rotate,
          "interaction-prompt": "none",
          "shadow-intensity": "1",
          "environment-image": "neutral",
          exposure: "1",
          "camera-orbit": "45deg 65deg auto",
          style: { width: "100%", height: "100%" },
        })
      ) : (
        <Loading label="Подготавливаем 3D-модель…" />
      )}
      <div className="viewer-hint">
        <Move size={14} />
        Перетаскивайте, чтобы вращать · Колесо — масштаб
      </div>
      <div className="viewer-tools">
        <button
          className="icon-button"
          aria-label={rotate ? "Остановить вращение" : "Вращать модель"}
          onClick={() => setRotate(!rotate)}
        >
          {rotate ? <Pause size={17} /> : <Play size={17} />}
        </button>
        <button
          className="icon-button"
          aria-label="Сбросить камеру"
          onClick={() =>
            ref.current?.setAttribute("camera-orbit", "45deg 65deg auto")
          }
        >
          <RotateCcw size={17} />
        </button>
      </div>
    </div>
  );
}

export default function Artwork() {
  const { id } = useParams();
  const [mode, setMode] = useState("preview");
  const {
    data: a,
    isPending,
    error,
  } = useQuery({
    queryKey: ["artwork", id],
    queryFn: () => api<ArtworkType>(`/artworks/${id}`),
  });
  if (isPending) return <Loading />;
  if (error || !a)
    return (
      <div className="container standard-page">
        <ErrorNotice error={error} />
        <BackLink />
      </div>
    );
  const cover = a.media.find((x) => x.purpose === "cover");
  const model = a.media.find((x) => x.purpose === "model");
  const preview = a.media.find((x) => x.purpose === "preview");
  const privateFile = a.isPublic === false || a.status !== "published";
  return (
    <div className="container standard-page artwork-page">
      <BackLink />
      <div className="artwork-detail-grid">
        <div>
          <div className="artwork-viewer">
            {model && mode === "preview" ? (
              <Model model={model} poster={cover} privateFile={privateFile} />
            ) : preview && mode === "preview" ? (
              preview.mimeType.startsWith("video/") ? (
                <video
                  controls
                  playsInline
                  src={mediaUrl(preview.id)}
                  poster={cover ? mediaUrl(cover.id) : undefined}
                />
              ) : (
                <MediaImage
                  media={preview}
                  alt={a.title}
                  privateFile={privateFile}
                />
              )
            ) : (
              <MediaImage
                media={cover}
                alt={a.title}
                privateFile={privateFile}
              />
            )}
          </div>
          {(model || preview) && (
            <div className="viewer-tabs">
              <button
                className={mode === "preview" ? "active" : ""}
                onClick={() => setMode("preview")}
              >
                {model ? <Box size={15} /> : <Play size={15} />}{" "}
                {model ? "3D-просмотр" : "Анимация"}
              </button>
              <button
                className={mode === "cover" ? "active" : ""}
                onClick={() => setMode("cover")}
              >
                <ImageIcon size={15} />
                Обложка
              </button>
            </div>
          )}
          <section className="artwork-story">
            <p className="eyebrow">О ПРОЕКТЕ</p>
            <h2>Немного контекста</h2>
            <p className="preserve-lines">{a.description}</p>
          </section>
        </div>
        <aside className="artwork-info">
          <div className="tag-row">
            <span className="tag">{WORK_TYPES[a.workType]}</span>
            <span className="tag">{a.style}</span>
          </div>
          <h1>{a.title}</h1>
          <Link className="author-line" to={`/creators/${a.author.id}`}>
            <Avatar name={a.author.publicName} url={a.author.avatarUrl} />
            <div>
              <strong>{a.author.publicName}</strong>
              <span>
                Смотреть профиль <ArrowUpRight size={12} />
              </span>
            </div>
          </Link>
          <Link
            className="btn btn-dark full-width"
            to={`/creators/${a.author.id}/brief`}
          >
            Обсудить похожий проект <ArrowUpRight size={17} />
          </Link>
          <div className="detail-list">
            <p className="eyebrow">ДЕТАЛИ РАБОТЫ</p>
            {a.technicalDetails.polygonCount !== undefined && (
              <div>
                <span>Полигоны</span>
                <strong>
                  {a.technicalDetails.polygonCount.toLocaleString("ru-RU")}
                </strong>
              </div>
            )}
            {a.technicalDetails.textureResolution && (
              <div>
                <span>Текстуры</span>
                <strong>{a.technicalDetails.textureResolution}</strong>
              </div>
            )}
            {a.technicalDetails.software && (
              <div>
                <span>Инструменты</span>
                <strong>{a.technicalDetails.software}</strong>
              </div>
            )}
            {a.technicalDetails.engine && (
              <div>
                <span>Движок</span>
                <strong>{a.technicalDetails.engine}</strong>
              </div>
            )}
            <div>
              <span>Опубликовано</span>
              <strong>{date(a.createdAt)}</strong>
            </div>
          </div>
          <p className="small muted">
            Нравится подход автора? Посмотрите услуги и расскажите о своей
            задаче — состав работы и стоимость можно уточнить в брифе.
          </p>
        </aside>
      </div>
    </div>
  );
}
