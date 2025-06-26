import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyIdToken } from '@/lib/firebase/admin';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    // Await the params to get the document ID
    const { id: documentId } = await params;

    // Get or create user
    const userResult = await query(
      `INSERT INTO "user" (email) VALUES ($1) 
       ON CONFLICT (email) DO UPDATE SET updated_at = now() 
       RETURNING id`,
      [userEmail]
    );
    const userId = userResult.rows[0].id;

    // Verify document exists and user has access
    const documentResult = await query(
      `SELECT d.id FROM document d
       LEFT JOIN document_ownership doc_owner ON d.id = doc_owner.document_id
       WHERE d.id = $1 AND (d.created_by = $2 OR doc_owner.user_id = $2) AND d.soft_delete = false`,
      [documentId, userId]
    );

    if (documentResult.rows.length === 0) {
      return NextResponse.json({ error: 'Document not found or access denied' }, { status: 404 });
    }

    // Get all users who have access to this document
    const usersResult = await query(
      `SELECT DISTINCT u.email
       FROM "user" u
       WHERE u.id = (
         SELECT created_by FROM document WHERE id = $1
       )
       OR u.id IN (
         SELECT user_id FROM document_ownership WHERE document_id = $1
       )
       ORDER BY u.email`,
      [documentId]
    );

    const users = usersResult.rows.map((user: any) => ({
      id: user.email,
      name: user.email
    }));

    return NextResponse.json({ users });

  } catch (error) {
    console.error('Document users API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 