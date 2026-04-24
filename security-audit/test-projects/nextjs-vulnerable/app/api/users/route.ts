// Intentionally vulnerable — logs sensitive data
export async function POST(req: Request) {
  const body = await req.json();
  console.log('user password:', body.password);
  console.log('auth token:', body.token);
  return Response.json({ ok: true });
}
