import { z } from 'zod';

const profileQuerySchema = z.object({
  id: z.string().uuid().optional(),
});

async function auth() {
  return { userId: 'user_123' };
}

async function rateLimitByIp() {
  return { success: true };
}

async function rateLimitByUser() {
  return { success: true };
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const input = profileQuerySchema.safeParse({
    id: url.searchParams.get('id') || undefined,
  });
  if (!input.success) {
    return Response.json({ error: 'Invalid request' }, { status: 400 });
  }

  await rateLimitByIp();
  const session = await auth();
  await rateLimitByUser();

  return Response.json({ userId: session.userId });
}
