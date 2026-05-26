import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

function makeClient() {
  const cookieStore = cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Server Component context — cookies are read-only, ignore
          }
        },
      },
    }
  );
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const sb = makeClient();
  const { data, error } = await sb
    .from('order_comments')
    .select('*')
    .eq('order_id', params.id)
    .order('created_at', { ascending: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const body = await req.json();
  const { author = 'Admin', content, type = 'note' } = body;
  if (!content) return NextResponse.json({ error: 'content required' }, { status: 400 });
  const sb = makeClient();
  const { data, error } = await sb.from('order_comments').insert({
    order_id: params.id,
    author,
    content,
    type,
  }).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
