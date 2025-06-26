import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyIdToken } from '@/lib/firebase/admin';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; conversationUid: string }> }
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

    // Await the params to get the document ID and conversation UID
    const { id: documentId, conversationUid } = await params;

    // Get request body
    const body = await req.json();
    const { content, author, authorName, authorAvatar, createdAt } = body;

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

    // Generate comment UID
    const commentUid = 'comment-' + crypto.randomUUID();

    // Create reply comment
    const commentResult = await query(
      `INSERT INTO comment (conversation_uid, comment_uid, content, author, author_avatar, document_id, user_id, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING id, conversation_uid, comment_uid, content, author, author_avatar, created_at`,
      [conversationUid, commentUid, content, author, authorAvatar, documentId, userId, createdAt || new Date(), createdAt || new Date()]
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
    console.error('Comment reply API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; conversationUid: string }> }
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

    // Await the params to get the document ID and conversation UID
    const { id: documentId, conversationUid } = await params;

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

    // Fetch comments for the specific conversation
    const commentsResult = await query(
      `SELECT c.id, c.content, c.author, c.author_avatar, c.conversation_uid, c.comment_uid, c.created_at, c.updated_at
       FROM comment c
       WHERE c.document_id = $1 AND c.conversation_uid = $2 AND c.soft_delete = false
       ORDER BY c.created_at ASC`,
      [documentId, conversationUid]
    );

    const comments = commentsResult.rows.map((comment: any) => ({
      uid: comment.comment_uid,
      author: comment.author,
      authorName: comment.author,
      authorAvatar: comment.author_avatar,
      content: comment.content,
      createdAt: comment.created_at,
      modifiedAt: comment.updated_at
    }));

    return NextResponse.json({
      conversation_uid: conversationUid,
      comments: comments
    });

  } catch (error) {
    console.error('Comment fetch API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; conversationUid: string }> }
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

    // Await the params to get the document ID and conversation UID
    const { id: documentId, conversationUid } = await params;

    // Get request body
    const body = await req.json();
    const { content } = body;

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

    // Update the comment (assuming we're updating the first comment in the conversation)
    const updateResult = await query(
      `UPDATE comment 
       SET content = $1, updated_at = now()
       WHERE document_id = $2 AND conversation_uid = $3 AND user_id = $4 AND soft_delete = false
       RETURNING id`,
      [content, documentId, conversationUid, userId]
    );

    if (updateResult.rows.length === 0) {
      return NextResponse.json({ error: 'Comment not found or access denied' }, { status: 404 });
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Comment update API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; conversationUid: string }> }
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

    // Await the params to get the document ID and conversation UID
    const { id: documentId, conversationUid } = await params;

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

    // Soft delete all comments in the conversation
    const deleteResult = await query(
      `UPDATE comment 
       SET soft_delete = true, updated_at = now()
       WHERE document_id = $1 AND conversation_uid = $2 AND user_id = $3 AND soft_delete = false`,
      [documentId, conversationUid, userId]
    );

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Comment delete API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 