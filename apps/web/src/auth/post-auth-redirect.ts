const postAuthRedirectStorageKey = "mtg.auth.post-login.redirect";

export function normalizePostAuthRedirectPath(path: string | null | undefined) {
  if (typeof path !== "string") {
    return null;
  }

  const normalizedPath = path.trim();

  if (!normalizedPath || !normalizedPath.startsWith("/") || normalizedPath.startsWith("//")) {
    return null;
  }

  return normalizedPath;
}

function getStorage() {
  if (typeof window === "undefined") {
    return null;
  }

  return window.sessionStorage;
}

export function readPostAuthRedirectPath() {
  const storage = getStorage();

  if (!storage) {
    return null;
  }

  return normalizePostAuthRedirectPath(storage.getItem(postAuthRedirectStorageKey));
}

export function storePostAuthRedirectPath(path: string) {
  const storage = getStorage();
  const normalizedPath = normalizePostAuthRedirectPath(path);

  if (!storage || !normalizedPath) {
    return;
  }

  storage.setItem(postAuthRedirectStorageKey, normalizedPath);
}

export function clearPostAuthRedirectPath() {
  getStorage()?.removeItem(postAuthRedirectStorageKey);
}

export function consumePostAuthRedirectPath() {
  const path = readPostAuthRedirectPath();
  clearPostAuthRedirectPath();
  return path;
}

export function resolvePostAuthRedirectPath(fallbackPath = "/matches") {
  return consumePostAuthRedirectPath() ?? fallbackPath;
}
