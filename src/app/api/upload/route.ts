import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get('file') as File | null;
  const name = formData.get('name') as string || '';
  const type = formData.get('type') as string || 'Sonstiges';
  const orderId = formData.get('order_id') as string || null;

  if (!file) return NextResponse.json({ error: 'No file' }, { status: 400 });

  const cookieStore = cookies();
  // Use service role key for storage (anon key can't upload to private buckets)
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  // Use service key if available, fall back to anon key
  const sb = createServerClient(supabaseUrl, serviceKey ?? anonKey, {
    cookies: {
      getAll() { return cookieStore.getAll(); },
      setAll(cs) {
        try {
          cs.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Server Component context — cookies are read-only, ignore
        }
      },
    },
  });

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const ext = file.name.split('.').pop() ?? 'bin';
  void ext; // used implicitly via file.name
  const path = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;

  // Upload to storage (bucket 'documents' - must be pre-created in Supabase)
  const { error: storageError } = await sb.storage
    .from('documents')
    .upload(path, buffer, { contentType: file.type });

  // If storage fails (bucket doesn't exist yet), still save metadata
  const storageOk = !storageError;

  const docId = `DOC-${Date.now().toString().slice(-6)}`;
  const fileSize = file.size < 1024
    ? `${file.size} B`
    : file.size < 1024 * 1024
      ? `${(file.size / 1024).toFixed(1)} KB`
      : `${(file.size / (1024 * 1024)).toFixed(1)} MB`;

  const { error: dbError } = await sb.from('documents').insert({
    id: docId,
    name: name || file.name,
    type,
    order_id: orderId || null,
    status: 'Entwurf',
    file_size: fileSize,
    file_url: storageOk ? path : null,
    created_at: new Date().toISOString(),
  });

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 });
  return NextResponse.json({ success: true, docId, storageOk });
}
