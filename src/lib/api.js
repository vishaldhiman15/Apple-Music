const base = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");
export const backendEnabled =
  import.meta.env.VITE_BACKEND_MODE === "enabled" ||
  Boolean(base) ||
  (import.meta.env.DEV && import.meta.env.VITE_BACKEND_MODE !== "off");
export async function api(path, options = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), options.timeout || 12000);
  try {
    const response = await fetch(base + "/api" + path, {
      ...options,
      credentials: "include",
      signal: controller.signal,
      headers: {
        "X-Music-Request": "1",
        ...(options.body ? { "Content-Type": "application/json" } : {}),
        ...options.headers,
      },
      body: options.body ? JSON.stringify(options.body) : undefined,
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok)
      throw new Error(
        data.message || "Something went wrong. Please try again.",
      );
    return data;
  } catch (error) {
    if (error.name === "AbortError")
      throw new Error(
        "The connection timed out. Your device library is still available.",
      );
    throw error;
  } finally {
    clearTimeout(timer);
  }
}
