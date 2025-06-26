import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyIdToken } from '@/lib/firebase/admin';

export async function PUT(req: NextRequest) {
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

    const { documentId, folderId } = await req.json();

    if (!documentId) {
      return NextResponse.json({ error: 'Document ID is required' }, { status: 400 });
    }

    // Get or create user
    const userResult = await query(
      `INSERT INTO "user" (email) VALUES ($1) 
       ON CONFLICT (email) DO UPDATE SET updated_at = now() 
       RETURNING id`,
      [userEmail]
    );
    const userId = userResult.rows[0].id;

    // Verify the document belongs to the user
    const documentCheck = await query(
      `SELECT id FROM document WHERE id = $1 AND created_by = $2 AND soft_delete = false`,
      [documentId, userId]
    );

    if (documentCheck.rows.length === 0) {
      return NextResponse.json({ error: 'Document not found or access denied' }, { status: 404 });
    }

    // If moving to a folder, verify the folder belongs to the user
    if (folderId) {
      const folderCheck = await query(
        `SELECT id FROM folder WHERE id = $1 AND owner_id = $2 AND soft_delete = false`,
        [folderId, userId]
      );

      if (folderCheck.rows.length === 0) {
        return NextResponse.json({ error: 'Folder not found or access denied' }, { status: 404 });
      }
    }

    // Move the document
    const moveResult = await query(
      `UPDATE document 
       SET folder_id = $1, updated_at = now() 
       WHERE id = $2 AND created_by = $3 
       RETURNING id, name, content, created_at, updated_at, language, version, status, folder_id`,
      [folderId || null, documentId, userId]
    );

    return NextResponse.json({ document: moveResult.rows[0] });

  } catch (error) {
    console.error('Move document error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 