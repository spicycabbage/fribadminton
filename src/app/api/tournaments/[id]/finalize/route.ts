import { NextRequest, NextResponse } from 'next/server';
import { ensureSchema, sql } from '@/lib/db';

export async function POST(_: NextRequest, { params }: { params: { id: string } }) {
  try {
    await ensureSchema();
    await sql`update tournaments set is_finalized=true where id=${params.id}`;
    const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ''}/api/tournaments/${params.id}`, { cache: 'no-store' });
    const updated = await res.json();
    return NextResponse.json(updated);
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Server error' }, { status: 500 });
  }
}


