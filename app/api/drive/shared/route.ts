import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyIdToken } from '@/lib/firebase/admin';

export async function GET(request: NextRequest) {
  try {
    // Get the Authorization header
    const authHeader = request.headers.get('authorization');
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

    // Get or create user
    const userResult = await query(
      `INSERT INTO "user" (email) VALUES ($1) 
       ON CONFLICT (email) DO UPDATE SET updated_at = now() 
       RETURNING id`,
      [userEmail]
    );
    const userId = userResult.rows[0].id;

    // Get documents shared with this user
    const sharedDocsQuery = `
      SELECT 
        d.id,
        d.name,
        d.content,
        d.created_at,
        d.updated_at,
        d.language,
        d.version,
        d.status,
        d.folder_id,
        doc_owner.access_level,
        doc_owner.created_at as shared_at,
        s.email as shared_by_email
      FROM document d
      JOIN document_ownership doc_owner ON d.id = doc_owner.document_id
      JOIN "user" s ON doc_owner.shared_by = s.id
      WHERE doc_owner.user_id = $1
      AND doc_owner.shared_by != $1
      AND d.soft_delete = false
      ORDER BY doc_owner.created_at DESC
    `;

    const sharedDocsResult = await query(sharedDocsQuery, [userId]);

    const sharedDocuments = sharedDocsResult.rows.map((row: any) => ({
      id: row.id,
      name: row.name,
      content: row.content,
      created_at: row.created_at,
      updated_at: row.updated_at,
      language: row.language,
      version: row.version,
      status: row.status,
      folder_id: row.folder_id,
      access_level: row.access_level,
      shared_at: row.shared_at,
      shared_by_email: row.shared_by_email,
      shared_by_name: row.shared_by_email // Use email as name since display_name doesn't exist
    }));

    return NextResponse.json({
      documents: sharedDocuments,
      count: sharedDocuments.length
    });

  } catch (error) {
    console.error('Error fetching shared documents:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 