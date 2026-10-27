import type { MediaFile } from "./types";

export const API_URL = (import.meta.env.VITE_API_URL || "/api/v1").replace(
  /\/+$/,
  "",
);
const TOKEN_KEY = "folio.accessToken";
export const tokenStore = {
  get: () => sessionStorage.getItem(TOKEN_KEY),
  set: (token: string) => sessionStorage.setItem(TOKEN_KEY, token),
  clear: () => sessionStorage.removeItem(TOKEN_KEY),
};
export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public details?: Record<string, string[]>,
  ) {
    super(message);
  }
}
export async function api<T>(
  path: string,
  options: RequestInit & { json?: unknown } = {},
): Promise<T> {
  const { json, ...init } = options;
  const headers = new Headers(init.headers);
  const token = tokenStore.get();
  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (json !== undefined) headers.set("Content-Type", "application/json");
  let response: Response;
  try {
    response = await fetch(API_URL + path, {
      ...init,
      headers,
      body: json !== undefined ? JSON.stringify(json) : init.body,
      signal: init.signal || AbortSignal.timeout(70000),
    });
  } catch {
    throw new ApiError(
      0,
      "Не удалось подключиться к Folio. Сервер может запускаться после простоя. Попробуйте ещё раз.",
    );
  }
  if (!response.ok) {
    let data;
    try {
      data = await response.json();
    } catch {
      /* non-JSON hosting error */
    }
    if (response.status === 401 && !path.startsWith("/auth/"))
      window.dispatchEvent(new Event("folio:unauthorized"));
    throw new ApiError(
      response.status,
      data?.error?.message || "Не удалось выполнить запрос.",
      data?.error?.details,
    );
  }
  return (response.status === 204 ? undefined : await response.json()) as T;
}
export const mediaUrl = (id: string) => `${API_URL}/media/${id}/content`;
export async function mediaBlob(id: string) {
  const token = tokenStore.get();
  const res = await fetch(mediaUrl(id), {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) throw new ApiError(res.status, "Не удалось загрузить файл.");
  return res.blob();
}
export async function uploadFile(path: string, file: File, purpose?: string) {
  const data = new FormData();
  data.append("file", file);
  if (purpose) data.append("purpose", purpose);
  return api<MediaFile>(path, { method: "POST", body: data });
}
export const errorMessage = (error: unknown) =>
  error instanceof ApiError && error.details
    ? Object.values(error.details).flat().filter(Boolean).join(" ") ||
      error.message
    : error instanceof Error
      ? error.message
      : String(error || "");
