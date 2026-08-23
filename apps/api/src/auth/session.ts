import { db } from '@vaultbill/db';
import { session as sessionTable } from '@vaultbill/db/schemas/auth';
import { eq } from 'drizzle-orm';

export async function getSessionFromCookie(cookieHeader: string | undefined) {
  if (!cookieHeader) return null;

  const cookies = Object.fromEntries(
    cookieHeader.split(';').map((c) => {
      const [key, ...val] = c.trim().split('=');
      return [key, val.join('=')];
    }),
  );

  const sessionToken = cookies['better-auth.session_token'] || cookies['__Secure-better-auth.session_token'];
  if (!sessionToken) return null;

  const sessions = await db
    .select()
    .from(sessionTable)
    .where(eq(sessionTable.token, sessionToken))
    .limit(1);

  const session = sessions[0];
  if (!session) return null;

  if (new Date(session.expiresAt) < new Date()) return null;

  return {
    sessionId: session.id,
    userId: session.userId,
    token: session.token,
  };
}