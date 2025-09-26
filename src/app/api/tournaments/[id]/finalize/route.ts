import { NextResponse } from 'next/server';
import { ensureSchema, sql } from '@/lib/db';

export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await ensureSchema();
    await sql`update tournaments set is_finalized=true where id=${id}`;
    const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ''}/api/tournaments/${id}`, { cache: 'no-store' });
    const updated = await res.json();
    return NextResponse.json(updated);
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Server error' }, { status: 500 });
  }
}


