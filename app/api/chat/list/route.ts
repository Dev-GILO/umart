import { NextRequest, NextResponse } from 'next/server'
import { adminDb, adminAuth } from '@/lib/firebase-admin'

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization')

    if (!authHeader) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Verify token
    const token = authHeader.replace('Bearer ', '')
    const decodedToken = await adminAuth.verifyIdToken(token)
    const userId = decodedToken.uid

    // Get all chat IDs from user's chats subcollection
    const userChatsSnapshot = await adminDb
      .collection('users')
      .doc(userId)
      .collection('chats')
      .orderBy('createdAt', 'desc')
      .get()

    if (userChatsSnapshot.empty) {
      return NextResponse.json(
        { success: true, data: [] },
        { status: 200 }
      )
    }

    const chats = []

    for (const chatDoc of userChatsSnapshot.docs) {
      const chatRef = chatDoc.data()
      const chatSnapshot = await adminDb.collection('chats').doc(chatRef.chatId).get()

      if (chatSnapshot.exists) {
        const chatData = chatSnapshot.data()
        chats.push({
          chatId: chatRef.chatId,
          participantName: chatRef.participantName,
          participantId: chatRef.participantId,
          lastMessage: chatData?.lastMessage || '',
          lastMessageTime: chatData?.lastMessageTime,
          lastMessageSenderName: chatData?.lastMessageSenderName,
          createdAt: chatRef.createdAt,
        })
      }
    }

    return NextResponse.json(
      { success: true, data: chats },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('Error fetching chats:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch chats' },
      { status: 500 }
    )
  }
}
