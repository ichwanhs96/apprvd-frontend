import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Upsert user
    const upsertSql = `
      INSERT INTO "user" (email)
      VALUES ($1)
      ON CONFLICT (email) DO UPDATE SET updated_at = now()
      RETURNING *;
    `;
    const result = await query(upsertSql, [email]);
    return NextResponse.json({ user: result.rows[0] });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
} 