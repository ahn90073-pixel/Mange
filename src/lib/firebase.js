import { initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider, browserSessionPersistence, setPersistence, signInWithPopup, signOut } from 'firebase/auth'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

const isConfigured = Object.values(firebaseConfig).every((value) => typeof value === 'string' && value.trim())
const auth = isConfigured ? getAuth(initializeApp(firebaseConfig)) : null
const googleProvider = new GoogleAuthProvider()
googleProvider.setCustomParameters({ prompt: 'select_account' })

export async function signInWithGoogle() {
  if (!auth) throw new Error('تسجيل الدخول عبر Google غير مهيأ بعد. أضف إعدادات Firebase إلى متغيرات البيئة ثم أعد البناء.')
  await setPersistence(auth, browserSessionPersistence)
  const result = await signInWithPopup(auth, googleProvider)
  return result.user.getIdToken(true)
}

export async function signOutGoogle() {
  if (auth?.currentUser) await signOut(auth)
}
