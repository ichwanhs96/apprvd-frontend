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

    // Fetch the specific document
    const documentResult = await query(
      `SELECT d.id, d.name, d.content, d.created_at, d.updated_at, d.language, d.version, d.status, d.folder_id, d.created_by, doc_owner.access_level
       FROM document d
       LEFT JOIN document_ownership doc_owner ON d.id = doc_owner.document_id
       WHERE d.id = $1 AND (d.created_by = $2 OR doc_owner.user_id = $2) AND d.soft_delete = false`,
      [documentId, userId]
    );

    if (documentResult.rows.length === 0) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    const document = documentResult.rows[0];
    
    // Determine user's access level
    const isOwner = document.created_by === userId;
    let userAccessLevel = isOwner ? 'edit' : (document.access_level || 'view');
    
    // If document is FINAL, everyone has view-only access
    if (document.status === 'FINAL') {
      userAccessLevel = 'view';
    }

    return NextResponse.json({ 
      document: {
        id: document.id,
        name: document.name,
        content: document.content,
        created_at: document.created_at,
        updated_at: document.updated_at,
        language: document.language,
        version: document.version,
        status: document.status,
        folder_id: document.folder_id
      },
      userAccessLevel
    });

  } catch (error) {
    console.error('Document API error:', error);
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
    const { content, status, name } = body;

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
      `SELECT d.id, d.name, d.created_by, d.status as current_status, doc_owner.access_level
       FROM document d
       LEFT JOIN document_ownership doc_owner ON d.id = doc_owner.document_id AND doc_owner.user_id = $2
       WHERE d.id = $1 AND (d.created_by = $2 OR doc_owner.user_id = $2) AND d.soft_delete = false`,
      [documentId, userId]
    );

    if (documentResult.rows.length === 0) {
      return NextResponse.json({ error: 'Document not found or access denied' }, { status: 404 });
    }

    const document = documentResult.rows[0];
    const isOwner = document.created_by === userId;
    const hasEditAccess = isOwner || document.access_level === 'edit';
    const currentStatus = document.current_status;

    // Check if status is being changed to FINAL and prevent editing
    if (status === 'FINAL' && currentStatus !== 'FINAL') {
      // Allow status change to FINAL
    } else if (currentStatus === 'FINAL') {
      // Document is already FINAL, no editing allowed
      return NextResponse.json({ error: 'Document is finalized and cannot be edited' }, { status: 403 });
    } else if (!hasEditAccess) {
      return NextResponse.json({ error: 'You only have view access to this document' }, { status: 403 });
    }

    // If name is provided, update it; otherwise keep the existing name
    if (name) {
      // Update the document with new name
      const updateResult = await query(
        `UPDATE document 
         SET name = $1, content = $2, status = $3, updated_at = now()
         WHERE id = $4 AND created_by = $5 AND soft_delete = false
         RETURNING id, name, content, created_at, updated_at, language, version, status, folder_id`,
        [name, content, status, documentId, document.created_by]
      );

      if (updateResult.rows.length === 0) {
        return NextResponse.json({ error: 'Document not found or access denied' }, { status: 404 });
      }

      const updatedDocument = updateResult.rows[0];
      
      // Send notification if status changed
      if (status !== currentStatus) {
        await sendStatusChangeNotification(documentId, document.name, currentStatus, status, userId);
      }
      
      return NextResponse.json({ document: updatedDocument });
    } else {
      // Update only content and status, preserve existing name
      const updateResult = await query(
        `UPDATE document 
         SET content = $1, status = $2, updated_at = now()
         WHERE id = $3 AND created_by = $4 AND soft_delete = false
         RETURNING id, name, content, created_at, updated_at, language, version, status, folder_id`,
        [content, status, documentId, document.created_by]
      );

      if (updateResult.rows.length === 0) {
        return NextResponse.json({ error: 'Document not found or access denied' }, { status: 404 });
      }

      const updatedDocument = updateResult.rows[0];
      
      // Send notification if status changed
      if (status !== currentStatus) {
        await sendStatusChangeNotification(documentId, document.name, currentStatus, status, userId);
      }
      
      return NextResponse.json({ document: updatedDocument });
    }

  } catch (error) {
    console.error('Document update API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Helper function to send status change notifications
async function sendStatusChangeNotification(
  documentId: string, 
  documentName: string, 
  oldStatus: string, 
  newStatus: string, 
  senderId: number
) {
  try {
    // Get all users with access to this document
    const usersResult = await query(
      `SELECT DISTINCT u.id, u.email
       FROM "user" u
       WHERE u.id = (
         SELECT created_by FROM document WHERE id = $1
       )
       OR u.id IN (
         SELECT user_id FROM document_ownership WHERE document_id = $1
       )`,
      [documentId]
    );

    const statusMessages = {
      'DRAFT': 'draft',
      'REVIEW': 'review',
      'FINAL': 'finalized'
    };

    const oldStatusText = statusMessages[oldStatus as keyof typeof statusMessages] || oldStatus.toLowerCase();
    const newStatusText = statusMessages[newStatus as keyof typeof statusMessages] || newStatus.toLowerCase();

    // Create notifications for all users except the sender
    for (const user of usersResult.rows) {
      if (user.id !== senderId) {
        await query(
          `INSERT INTO notification (recipient_id, sender_id, document_id, type, title, message, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, now(), now())`,
          [
            user.id,
            senderId,
            documentId,
            'status_change',
            `Document Status Updated`,
            `The document "${documentName}" has been moved from ${oldStatusText} to ${newStatusText}.`,
          ]
        );
      }
    }
  } catch (error) {
    console.error('Failed to send status change notifications:', error);
    // Don't fail the main request if notifications fail
  }
} 