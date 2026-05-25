import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return NextResponse.json({ error: 'Auth nicht konfiguriert.' }, { status: 503 });
  }

  let body: { email: string; role?: string; name?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Ungültiger Request-Body.' }, { status: 400 });
  }

  const { email, role = 'member', name } = body;
  if (!email) {
    return NextResponse.json({ error: 'E-Mail-Adresse erforderlich.' }, { status: 400 });
  }

  // Use service-role key for admin operations
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) {
    return NextResponse.json({ error: 'SUPABASE_SERVICE_ROLE_KEY fehlt.' }, { status: 503 });
  }

  const { createClient } = await import('@supabase/supabase-js');
  const adminClient = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data, error } = await adminClient.auth.admin.inviteUserByEmail(email, {
    data: { role, full_name: name ?? email.split('@')[0] },
    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'}/auth/callback`,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, userId: data.user?.id });
}
