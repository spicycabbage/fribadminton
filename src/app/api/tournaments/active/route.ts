import { NextResponse } from 'next/server';
import { ensureSchema, sql } from '@/lib/db';

export async function GET() {
  try {
    await ensureSchema();
    const rows = await sql<{ id: string; access_code: string }[]>`
      select id, access_code from tournaments
      where is_finalized=false
      order by created_at desc
      limit 1`;
    const t = rows[0] || null;
    return NextResponse.json({ active: !!t, tournament: t });
  } catch (e: any) {
    return NextResponse.json({ active: false, error: e.message || 'Server error' }, { status: 500 });
  }
}


