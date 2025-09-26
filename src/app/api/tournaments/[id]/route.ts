import { NextResponse } from 'next/server';
import { ensureSchema, sql } from '@/lib/db';

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await ensureSchema();
    
    // Delete the tournament (cascade will handle players and matches)
    const result = await sql`delete from tournaments where id=${id}`;
    
    return NextResponse.json({ success: true, message: 'Tournament deleted successfully' });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Server error' }, { status: 500 });
  }
}