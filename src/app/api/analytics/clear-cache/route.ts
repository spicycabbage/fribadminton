import { NextResponse } from 'next/server';
import { analyticsCache } from '@/lib/cache';

export async function POST() {
  try {
    analyticsCache.clear();
    return NextResponse.json({ success: true, message: 'Analytics cache cleared' });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

