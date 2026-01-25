import { NextRequest, NextResponse } from 'next/server'
import { adminDb, adminAuth } from '@/lib/firebase-admin'
import { Timestamp } from 'firebase-admin/firestore'

export async function POST(req: NextRequest) {
  try {
    const { chatId, text } = await req.json()
    const authHeader = req.headers.get('authorization')

    if (!authHeader || !chatId || !text) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Verify token
    const token = authHeader.replace('Bearer ', '')
    const decodedToken = await adminAuth.verifyIdToken(token)
    const userId = decodedToken.uid

    // Verify user is participant in this chat
    const chatSnapshot = await adminDb.collection('chats').doc(chatId).get()

    if (!chatSnapshot.exists) {
      return NextResponse.json(
        { success: false, error: 'Chat not found' },
        { status: 404 }
      )
    }

    const chatData = chatSnapshot.data()
    if (!chatData?.participantIds.includes(userId)) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      )
    }

    // Get sender's data
    const senderDoc = await adminDb.collection('users').doc(userId).get()
    const senderName = senderDoc.data()?.fullname || 'User'
    const senderRoles = senderDoc.data()?.roles || {}

    // Create message
    const messageRef = adminDb
      .collection('chats')
      .doc(chatId)
      .collection('messages')
      .doc()

    const batch = adminDb.batch()

    // Add message with sender details
    batch.set(messageRef, {
      senderId: userId,
      senderName: senderName,
      text: text.trim(),
      createdAt: Timestamp.now(),
      isSystemAdmin: senderRoles.isAdmin || false,
      isCreator: senderRoles.isCreator || false,
    })

    // Update chat's last message with sender name
    batch.update(adminDb.collection('chats').doc(chatId), {
      lastMessage: text.trim(),
      lastMessageTime: Timestamp.now(),
      lastMessageSenderName: senderName,
      updatedAt: Timestamp.now(),
    })

    await batch.commit()

    return NextResponse.json(
      {
        success: true,
        data: {
          id: messageRef.id,
          senderId: userId,
          text: text.trim(),
          createdAt: new Date(),
        },
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('Error sending message:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to send message' },
      { status: 500 }
    )
  }
}
