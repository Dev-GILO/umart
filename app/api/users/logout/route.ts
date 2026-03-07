import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    
    // Delete the Firebase session cookie
    cookieStore.delete('__session')
    
    // Also clear any other auth-related cookies if they exist
    cookieStore.delete('token')
    
    return NextResponse.json({ 
      success: true,
      message: 'Signed out successfully' 
    })
  } catch (error) {
    console.error('Error clearing cookies:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to clear session' 
      },
      { status: 500 }
    )
  }
}