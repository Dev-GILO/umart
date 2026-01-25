export interface AuthResponse {
  success: boolean
  message: string
  redirect?: string
}

// Firebase error code mappings
const firebaseErrorMap: Record<string, string> = {
  'auth/email-already-in-use': 'This email is already in use. Please use a different email or log in.',
  'auth/invalid-email': 'Please enter a valid email address.',
  'auth/weak-password': 'Password should be at least 6 characters long.',
  'auth/user-not-found': 'No account found with this email. Please sign up first.',
  'auth/wrong-password': 'Incorrect password. Please try again.',
  'auth/too-many-requests': 'Too many failed login attempts. Please try again later.',
  'auth/account-exists-with-different-credential': 'An account already exists with this email.',
  'auth/invalid-credential': 'Invalid email or password. Please try again.',
  'auth/operation-not-allowed': 'Sign up is currently disabled. Please try again later.',
  'auth/network-request-failed': 'Network error. Please check your connection and try again.',
}

function parseFirebaseError(error: any): string {
  const errorMessage = error.message || ''

  // Extract Firebase error code
  const match = errorMessage.match(/Firebase: (.*?)\s*\(auth\/([^)]+)\)/)
  if (match) {
    const errorCode = `auth/${match[2]}`
    return firebaseErrorMap[errorCode] || match[1] || 'An authentication error occurred. Please try again.'
  }

  // Fallback for other Firebase errors
  if (errorMessage.includes('Firebase:')) {
    const messageMatch = errorMessage.match(/Firebase: (.*?)\s*\(/)
    if (messageMatch) {
      return messageMatch[1]
    }
  }

  return errorMessage || 'An unexpected error occurred. Please try again.'
}

export function signupResponse(error: any, redirect?: string): AuthResponse
export function signupResponse(error: null, redirect?: string): AuthResponse
export function signupResponse(error: any = null, redirect?: string): AuthResponse {
  if (!error) {
    return {
      success: true,
      message: 'Account created successfully! Redirecting...',
      redirect,
    }
  }

  return {
    success: false,
    message: parseFirebaseError(error),
  }
}

export function loginResponse(error: any, redirect?: string): AuthResponse
export function loginResponse(error: null, redirect?: string): AuthResponse
export function loginResponse(error: any = null, redirect?: string): AuthResponse {
  if (!error) {
    return {
      success: true,
      message: 'Logged in successfully! Redirecting...',
      redirect,
    }
  }

  return {
    success: false,
    message: parseFirebaseError(error),
  }
}
