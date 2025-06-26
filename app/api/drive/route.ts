import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyIdToken } from '@/lib/firebase/admin';

export async function GET(req: NextRequest) {
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

    // Get folder ID from query params
    const { searchParams } = new URL(req.url);
    const folderId = searchParams.get('folderId');

    // Convert empty string to null for database queries
    const dbFolderId = folderId && folderId.trim() !== '' ? folderId : null;

    // Get or create user
    const userResult = await query(
      `INSERT INTO "user" (email) VALUES ($1) 
       ON CONFLICT (email) DO UPDATE SET updated_at = now() 
       RETURNING id`,
      [userEmail]
    );
    const userId = userResult.rows[0].id;

    // Fetch folders and files for the user in the current folder
    let foldersResult;
    let filesResult;

    if (dbFolderId === null) {
      // Root level - get folders and files with NULL parent_id/folder_id
      // Only show folders owned by user
      foldersResult = await query(
        `SELECT id, name, created_at, updated_at, parent_id 
         FROM folder 
         WHERE owner_id = $1 AND soft_delete = false AND parent_id IS NULL
         ORDER BY name`,
        [userId]
      );

      // Get documents that user owns OR has access to through sharing
      filesResult = await query(
        `SELECT DISTINCT d.id, d.name, d.content, d.created_at, d.updated_at, d.language, d.version, d.status, d.folder_id
         FROM document d
         LEFT JOIN document_ownership doc_owner ON d.id = doc_owner.document_id
         WHERE (d.created_by = $1 OR doc_owner.user_id = $1) 
         AND d.soft_delete = false 
         AND d.folder_id IS NULL
         ORDER BY d.updated_at DESC`,
        [userId]
      );
    } else {
      // Specific folder - get folders and files in this folder
      // Only show folders owned by user
      foldersResult = await query(
        `SELECT id, name, created_at, updated_at, parent_id 
         FROM folder 
         WHERE owner_id = $1 AND soft_delete = false AND parent_id = $2
         ORDER BY name`,
        [userId, dbFolderId]
      );

      // Get documents that user owns OR has access to through sharing
      filesResult = await query(
        `SELECT DISTINCT d.id, d.name, d.content, d.created_at, d.updated_at, d.language, d.version, d.status, d.folder_id
         FROM document d
         LEFT JOIN document_ownership doc_owner ON d.id = doc_owner.document_id
         WHERE (d.created_by = $1 OR doc_owner.user_id = $1) 
         AND d.soft_delete = false 
         AND d.folder_id = $2
         ORDER BY d.updated_at DESC`,
        [userId, dbFolderId]
      );
    }

    // If we're in a folder, get the folder details for breadcrumb
    let currentFolder = null;
    if (dbFolderId) {
      const folderResult = await query(
        `SELECT id, name, parent_id FROM folder WHERE id = $1 AND owner_id = $2`,
        [dbFolderId, userId]
      );
      currentFolder = folderResult.rows[0] || null;
    }

    return NextResponse.json({
      folders: foldersResult.rows,
      files: filesResult.rows,
      currentFolder
    });

  } catch (error) {
    console.error('Drive API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 