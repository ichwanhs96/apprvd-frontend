import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyIdToken } from '@/lib/firebase/admin';

export async function POST(req: NextRequest) {
  try {
    // Get the Authorization header
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'No valid authorization header' }, { status: 401 });
    }

    const idToken = authHeader.split('Bearer ')[1];
    
    // Verify the Firebase ID token
    const decodedToken = await verifyIdToken(idToken);
    const userEmail = decodedToken.email;

    if (!userEmail) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { name, parentId } = await req.json();

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json({ error: 'Folder name is required' }, { status: 400 });
    }

    // Get or create user
    const userResult = await query(
      `INSERT INTO "user" (email) VALUES ($1) 
       ON CONFLICT (email) DO UPDATE SET updated_at = now() 
       RETURNING id`,
      [userEmail]
    );
    const userId = userResult.rows[0].id;

    // Create the folder
    const folderResult = await query(
      `INSERT INTO folder (name, parent_id, owner_id) 
       VALUES ($1, $2, $3) 
       RETURNING id, name, created_at, updated_at, parent_id`,
      [name.trim(), parentId || null, userId]
    );

    return NextResponse.json({ folder: folderResult.rows[0] });

  } catch (error) {
    console.error('Create folder error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 