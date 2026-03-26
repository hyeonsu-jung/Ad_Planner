import { NextRequest, NextResponse } from 'next/server';
import { getTrends } from '@/lib/trendsData';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const industry = searchParams.get('industry') ?? '전체';
    const gender = searchParams.get('gender') ?? '전체';
    const ageRange = searchParams.get('ageRange') ?? '전체';

    const data = getTrends(industry, gender, ageRange);
    return NextResponse.json(data);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to load trends' }, { status: 500 });
  }
}
