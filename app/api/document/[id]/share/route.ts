import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyIdToken } from '@/lib/firebase/admin';

export async function POST(
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

    // Get request body
    const body = await req.json();
    const { email, access } = body;

    if (!email || !access || !['view', 'edit'].includes(access)) {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    // Get or create current user
    const currentUserResult = await query(
      `INSERT INTO "user" (email) VALUES ($1) 
       ON CONFLICT (email) DO UPDATE SET updated_at = now() 
       RETURNING id`,
      [userEmail]
    );
    const currentUserId = currentUserResult.rows[0].id;

    // Verify document exists and current user owns it
    const documentResult = await query(
      `SELECT id FROM document WHERE id = $1 AND created_by = $2 AND soft_delete = false`,
      [documentId, currentUserId]
    );

    if (documentResult.rows.length === 0) {
      return NextResponse.json({ error: 'Document not found or access denied' }, { status: 404 });
    }

    // Get or create the user to share with
    const targetUserResult = await query(
      `INSERT INTO "user" (email) VALUES ($1) 
       ON CONFLICT (email) DO UPDATE SET updated_at = now() 
       RETURNING id`,
      [email]
    );
    const targetUserId = targetUserResult.rows[0].id;

    // Check if already shared
    const existingShare = await query(
      `SELECT id FROM document_ownership WHERE document_id = $1 AND user_id = $2`,
      [documentId, targetUserId]
    );

    if (existingShare.rows.length > 0) {
      // Update existing share
      await query(
        `UPDATE document_ownership 
         SET access_level = $1, updated_at = now()
         WHERE document_id = $2 AND user_id = $3`,
        [access, documentId, targetUserId]
      );
    } else {
      // Create new share
      await query(
        `INSERT INTO document_ownership (document_id, user_id, access_level, shared_by, created_at, updated_at)
         VALUES ($1, $2, $3, $4, now(), now())`,
        [documentId, targetUserId, access, currentUserId]
      );
    }

    // Get document name for notification
    const documentNameResult = await query(
      `SELECT name FROM document WHERE id = $1`,
      [documentId]
    );
    const documentName = documentNameResult.rows[0]?.name || 'Document';

    // Get current user email for notification
    const currentUserEmailResult = await query(
      `SELECT email FROM "user" WHERE id = $1`,
      [currentUserId]
    );
    const currentUserEmail = currentUserEmailResult.rows[0]?.email || 'Unknown user';

    // Create notification for the target user
    await query(
      `INSERT INTO notification (type, title, message, recipient_id, sender_id, document_id, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, now(), now())`,
      [
        existingShare.rows.length > 0 ? 'access_change' : 'document_shared',
        existingShare.rows.length > 0 ? 'Document Access Updated' : 'Document Shared',
        existingShare.rows.length > 0 
          ? `${currentUserEmail} has updated your access to "${documentName}" to ${access} access.`
          : `${currentUserEmail} has shared "${documentName}" with you with ${access} access.`,
        targetUserId,
        currentUserId,
        documentId
      ]
    );

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Document share API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

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

    // Get or create current user
    const currentUserResult = await query(
      `INSERT INTO "user" (email) VALUES ($1) 
       ON CONFLICT (email) DO UPDATE SET updated_at = now() 
       RETURNING id`,
      [userEmail]
    );
    const currentUserId = currentUserResult.rows[0].id;

    // Verify document exists and current user owns it
    const documentResult = await query(
      `SELECT id FROM document WHERE id = $1 AND created_by = $2 AND soft_delete = false`,
      [documentId, currentUserId]
    );

    if (documentResult.rows.length === 0) {
      return NextResponse.json({ error: 'Document not found or access denied' }, { status: 404 });
    }

    // Get all shared users
    const sharesResult = await query(
      `SELECT 
        doc_owner.id,
        u.email,
        doc_owner.access_level as access,
        doc_owner.created_at as shared_at,
        s.email as shared_by_email
       FROM document_ownership doc_owner
       JOIN "user" u ON doc_owner.user_id = u.id
       JOIN "user" s ON doc_owner.shared_by = s.id
       WHERE doc_owner.document_id = $1
       ORDER BY doc_owner.created_at DESC`,
      [documentId]
    );

    const shares = sharesResult.rows.map((share: any) => ({
      id: share.id,
      email: share.email,
      access: share.access,
      sharedAt: share.shared_at,
      sharedBy: share.shared_by_email
    }));

    return NextResponse.json({ shares });

  } catch (error) {
    console.error('Document shares fetch API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
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

    // Get request body
    const body = await req.json();
    const { email, access } = body;

    if (!email || !access || !['view', 'edit'].includes(access)) {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    // Get or create current user
    const currentUserResult = await query(
      `INSERT INTO "user" (email) VALUES ($1) 
       ON CONFLICT (email) DO UPDATE SET updated_at = now() 
       RETURNING id`,
      [userEmail]
    );
    const currentUserId = currentUserResult.rows[0].id;

    // Verify document exists and current user owns it
    const documentResult = await query(
      `SELECT id FROM document WHERE id = $1 AND created_by = $2 AND soft_delete = false`,
      [documentId, currentUserId]
    );

    if (documentResult.rows.length === 0) {
      return NextResponse.json({ error: 'Document not found or access denied' }, { status: 404 });
    }

    // Get the target user ID by email
    const targetUserResult = await query(
      `SELECT id FROM "user" WHERE email = $1`,
      [email]
    );

    if (targetUserResult.rows.length === 0) {
      return NextResponse.json({ error: 'Target user not found' }, { status: 404 });
    }

    const targetUserId = targetUserResult.rows[0].id;

    // Update access level for the target user
    const updateResult = await query(
      `UPDATE document_ownership 
       SET access_level = $1, updated_at = now()
       WHERE document_id = $2 AND user_id = $3`,
      [access, documentId, targetUserId]
    );

    if (updateResult.rowCount === 0) {
      return NextResponse.json({ error: 'Share not found' }, { status: 404 });
    }

    // Get document name for notification
    const documentNameResult = await query(
      `SELECT name FROM document WHERE id = $1`,
      [documentId]
    );
    const documentName = documentNameResult.rows[0]?.name || 'Document';

    // Get current user email for notification
    const currentUserEmailResult = await query(
      `SELECT email FROM "user" WHERE id = $1`,
      [currentUserId]
    );
    const currentUserEmail = currentUserEmailResult.rows[0]?.email || 'Unknown user';

    // Create notification for the target user
    await query(
      `INSERT INTO notification (type, title, message, recipient_id, sender_id, document_id, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, now(), now())`,
      [
        'access_change',
        'Document Access Updated',
        `${currentUserEmail} has updated your access to "${documentName}" to ${access} access.`,
        targetUserId,
        currentUserId,
        documentId
      ]
    );

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Document share update API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
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

    // Get request body
    const body = await req.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    // Get or create current user
    const currentUserResult = await query(
      `INSERT INTO "user" (email) VALUES ($1) 
       ON CONFLICT (email) DO UPDATE SET updated_at = now() 
       RETURNING id`,
      [userEmail]
    );
    const currentUserId = currentUserResult.rows[0].id;

    // Verify document exists and current user owns it
    const documentResult = await query(
      `SELECT id FROM document WHERE id = $1 AND created_by = $2 AND soft_delete = false`,
      [documentId, currentUserId]
    );

    if (documentResult.rows.length === 0) {
      return NextResponse.json({ error: 'Document not found or access denied' }, { status: 404 });
    }

    // Get the target user ID by email
    const targetUserResult = await query(
      `SELECT id FROM "user" WHERE email = $1`,
      [email]
    );

    if (targetUserResult.rows.length === 0) {
      return NextResponse.json({ error: 'Target user not found' }, { status: 404 });
    }

    const targetUserId = targetUserResult.rows[0].id;

    // Remove access
    const deleteResult = await query(
      `DELETE FROM document_ownership 
       WHERE document_id = $1 AND user_id = $2`,
      [documentId, targetUserId]
    );

    if (deleteResult.rowCount === 0) {
      return NextResponse.json({ error: 'Share not found' }, { status: 404 });
    }

    // Get document name for notification
    const documentNameResult = await query(
      `SELECT name FROM document WHERE id = $1`,
      [documentId]
    );
    const documentName = documentNameResult.rows[0]?.name || 'Document';

    // Get current user email for notification
    const currentUserEmailResult = await query(
      `SELECT email FROM "user" WHERE id = $1`,
      [currentUserId]
    );
    const currentUserEmail = currentUserEmailResult.rows[0]?.email || 'Unknown user';

    // Create notification for the target user
    await query(
      `INSERT INTO notification (type, title, message, recipient_id, sender_id, document_id, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, now(), now())`,
      [
        'access_removed',
        'Document Access Removed',
        `${currentUserEmail} has removed your access to "${documentName}".`,
        targetUserId,
        currentUserId,
        documentId
      ]
    );

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Document share delete API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 