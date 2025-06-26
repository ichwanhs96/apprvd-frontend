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
    const { content, author, authorName, authorAvatar, conversationUid, commentUid } = body;

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

    // Create comment
    const commentResult = await query(
      `INSERT INTO comment (conversation_uid, comment_uid, content, author, author_avatar, document_id, user_id, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, now(), now())
       RETURNING id, conversation_uid, comment_uid, content, author, author_avatar, created_at`,
      [conversationUid, commentUid, content, author, authorAvatar, documentId, userId]
    );

    const comment = commentResult.rows[0];

    return NextResponse.json({ 
      commentUid: comment.comment_uid,
      conversationUid: comment.conversation_uid,
      content: comment.content,
      author: comment.author,
      authorName: comment.author,
      authorAvatar: comment.author_avatar,
      createdAt: comment.created_at
    });

  } catch (error) {
    console.error('Comment creation API error:', error);
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

    // Get conversation UIDs from query params
    const { searchParams } = new URL(req.url);
    const conversationUids = searchParams.get('conversation_uids');

    if (!conversationUids) {
      return NextResponse.json({ error: 'Conversation UIDs required' }, { status: 400 });
    }

    const uidArray = conversationUids.split(',');

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

    // Fetch comments for the specified conversation UIDs
    const commentsResult = await query(
      `SELECT c.id, c.content, c.author, c.author_avatar, c.conversation_uid, c.comment_uid, c.created_at, c.updated_at
       FROM comment c
       WHERE c.document_id = $1 AND c.conversation_uid = ANY($2) AND c.soft_delete = false
       ORDER BY c.created_at ASC`,
      [documentId, uidArray]
    );

    // Group comments by conversation UID
    const conversations: any = {};
    commentsResult.rows.forEach((comment: any) => {
      const conversationUid = comment.conversation_uid;
      if (!conversations[conversationUid]) {
        conversations[conversationUid] = {
          uid: conversationUid,
          comments: []
        };
      }
      conversations[conversationUid].comments.push({
        uid: comment.comment_uid,
        author: comment.author,
        authorName: comment.author,
        authorAvatar: comment.author_avatar,
        content: comment.content,
        createdAt: comment.created_at,
        modifiedAt: comment.updated_at
      });
    });

    // Convert to array format expected by TinyMCE
    const result = Object.values(conversations).map((conversation: any) => ({
      conversation
    }));

    return NextResponse.json(result);

  } catch (error) {
    console.error('Comment fetch API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 