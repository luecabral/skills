// Intentionally vulnerable — admin route without any auth check
// getSession() in a comment must not count as authorization.
export async function GET(req: Request) {
  return Response.json({ secret: 'admin-only-data', users: ['root'] });
}

export async function DELETE(req: Request) {
  return Response.json({ deleted: true });
}
