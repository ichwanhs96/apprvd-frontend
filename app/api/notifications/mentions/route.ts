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

    // Get request body
    const body = await req.json();
    const { documentId, mentionedUsers, commentContent, author, conversationUid } = body;

    if (!documentId || !mentionedUsers || !Array.isArray(mentionedUsers)) {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    // Get or create user
    const userResult = await query(
      `INSERT INTO "user" (email) VALUES ($1) 
       ON CONFLICT (email) DO UPDATE SET updated_at = now() 
       RETURNING id`,
      [userEmail]
    );
    const userId = userResult.rows[0].id;

    // Get document details
    const documentResult = await query(
      `SELECT d.id, d.content FROM document d
       LEFT JOIN document_ownership doc_owner ON d.id = doc_owner.document_id
       WHERE d.id = $1 AND (d.created_by = $2 OR doc_owner.user_id = $2) AND d.soft_delete = false`,
      [documentId, userId]
    );

    if (documentResult.rows.length === 0) {
      return NextResponse.json({ error: 'Document not found or access denied' }, { status: 404 });
    }

    const document = documentResult.rows[0];

    // Create notifications for mentioned users
    for (const mentionedEmail of mentionedUsers) {
      // Find user by email
      const userResult = await query(
        'SELECT id FROM "user" WHERE email = $1 AND soft_delete = false',
        [mentionedEmail]
      );

      if (userResult.rows.length > 0) {
        const mentionedUserId = userResult.rows[0].id;
        
        // Check if notification already exists
        const existingNotification = await query(
          'SELECT id FROM notification WHERE recipient_id = $1 AND document_id = $2 AND type = $3 AND read_at IS NULL',
          [mentionedUserId, documentId, 'mention']
        );

        if (existingNotification.rows.length === 0) {
          // Create new notification
          await query(
            `INSERT INTO notification (type, title, message, recipient_id, sender_id, document_id, conversation_uid, created_at, updated_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, now(), now())`,
            [
              'mention',
              `You were mentioned in a comment`,
              `${author} mentioned you in a comment: "${commentContent.substring(0, 100)}${commentContent.length > 100 ? '...' : ''}"`,
              mentionedUserId,
              userId,
              documentId,
              conversationUid
            ]
          );
        }
      }
    }

    return NextResponse.json({ 
      success: true, 
      totalMentions: mentionedUsers.length
    });

  } catch (error) {
    console.error('Mention notification API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 