import { NextRequest, NextResponse } from 'next/server';
import { predict } from '@/lib/predictor';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { industry = '전체', gender = '전체', minAge = 18, maxAge = 65, budget = 10000000 } = body;

    const result = predict({ industry, gender, minAge, maxAge, budget });
    return NextResponse.json(result);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Prediction failed' }, { status: 500 });
  }
}
