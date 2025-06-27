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

    // Get query parameters
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const unreadOnly = searchParams.get('unread_only') === 'true';
    const offset = (page - 1) * limit;

    // Get or create user
    const userResult = await query(
      `INSERT INTO "user" (email) VALUES ($1) 
       ON CONFLICT (email) DO UPDATE SET updated_at = now() 
       RETURNING id`,
      [userEmail]
    );
    const userId = userResult.rows[0].id;

    // Build the query
    let whereClause = 'WHERE n.recipient_id = $1';
    const params = [userId];
    const paramIndex = 2;

    if (unreadOnly) {
      whereClause += ` AND n.read_at IS NULL`;
    }

    // Fetch notifications with sender and document info
    const notificationsResult = await query(
      `SELECT 
        n.id,
        n.type,
        n.title,
        n.message,
        n.document_id,
        n.conversation_uid,
        n.read_at,
        n.created_at,
        n.updated_at,
        s.email as sender_email,
        d.name as document_name
       FROM notification n
       LEFT JOIN "user" s ON n.sender_id = s.id
       LEFT JOIN document d ON n.document_id = d.id
       ${whereClause}
       ORDER BY n.created_at DESC
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...params, limit, offset]
    );

    // Get total count for pagination
    const countResult = await query(
      `SELECT COUNT(*) as total
       FROM notification n
       ${whereClause}`,
      params
    );

    const total = parseInt(countResult.rows[0].total);
    const totalPages = Math.ceil(total / limit);

    const notifications = notificationsResult.rows.map((notification: any) => ({
      id: notification.id,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      documentId: notification.document_id,
      documentName: notification.document_name,
      conversationUid: notification.conversation_uid,
      senderEmail: notification.sender_email,
      readAt: notification.read_at,
      createdAt: notification.created_at,
      updatedAt: notification.updated_at
    }));

    return NextResponse.json({
      notifications,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    });

  } catch (error) {
    console.error('Notifications fetch API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

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

    // Get request body
    const body = await req.json();
    const { notificationIds, markAllAsRead } = body;

    // Get or create user
    const userResult = await query(
      `INSERT INTO "user" (email) VALUES ($1) 
       ON CONFLICT (email) DO UPDATE SET updated_at = now() 
       RETURNING id`,
      [userEmail]
    );
    const userId = userResult.rows[0].id;

    if (markAllAsRead) {
      // Mark all unread notifications as read
      await query(
        `UPDATE notification 
         SET read_at = now(), updated_at = now()
         WHERE recipient_id = $1 AND read_at IS NULL`,
        [userId]
      );
    } else if (notificationIds && Array.isArray(notificationIds)) {
      // Mark specific notifications as read
      await query(
        `UPDATE notification 
         SET read_at = now(), updated_at = now()
         WHERE id = ANY($1) AND recipient_id = $2`,
        [notificationIds, userId]
      );
    } else {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Notifications update API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 