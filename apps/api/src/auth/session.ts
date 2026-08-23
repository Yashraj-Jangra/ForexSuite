import { auth } from './config';

export async function getSessionFromCookie(headers: Record<string, string | string[] | undefined>) {
  try {
    const h = new Headers();
    for (const [key, value] of Object.entries(headers)) {
      if (value !== undefined) {
        h.set(key, Array.isArray(value) ? value[0] ?? '' : value);
      }
    }
    return await auth.api.getSession({ headers: h });
  } catch {
    return null;
  }
}