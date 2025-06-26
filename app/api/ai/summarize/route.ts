import { NextRequest, NextResponse } from 'next/server';
import { verifyIdToken } from '@/lib/firebase/admin';
import { query } from '@/lib/db';
import { summarizeDocument } from '@/lib/openai';

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
    const { documentId, content, documentName } = body;

    if (!documentId || !content || !documentName) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get or create current user
    const currentUserResult = await query(
      `INSERT INTO "user" (email) VALUES ($1) 
       ON CONFLICT (email) DO UPDATE SET updated_at = now() 
       RETURNING id`,
      [userEmail]
    );
    const currentUserId = currentUserResult.rows[0].id;

    // Verify document exists and user has access
    const documentResult = await query(
      `SELECT d.id, d.name, d.content 
       FROM document d
       LEFT JOIN document_ownership doc_owner ON d.id = doc_owner.document_id
       WHERE d.id = $1 AND d.soft_delete = false 
       AND (d.created_by = $2 OR doc_owner.user_id = $2)`,
      [documentId, currentUserId]
    );

    if (documentResult.rows.length === 0) {
      return NextResponse.json({ error: 'Document not found or access denied' }, { status: 404 });
    }

    // Check if OpenAI API key is configured
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: 'OpenAI API key not configured' }, { status: 500 });
    }

    // Generate summary using OpenAI
    const summary = await summarizeDocument(content, documentName);

    return NextResponse.json({ summary });

  } catch (error) {
    console.error('AI summarization API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 