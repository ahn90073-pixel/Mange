import { Capacitor } from '@capacitor/core'
import { FirebaseAuthentication } from '@capacitor-firebase/authentication'
import { initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider, browserSessionPersistence, setPersistence, signInWithPopup, signOut } from 'firebase/auth'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyDnHE-oYAdjNkUckPUX2CSPtA4ZUiDCDLw',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'manger-301.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'manger-301',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:126525162731:web:71d43fefcbf75fffb56aae',
}

const isConfigured = Object.values(firebaseConfig).every((value) => typeof value === 'string' && value.trim())
const auth = isConfigured ? getAuth(initializeApp(firebaseConfig)) : null
const googleProvider = new GoogleAuthProvider()
googleProvider.setCustomParameters({ prompt: 'select_account' })
const useNativeGoogleAuth = Capacitor.getPlatform() === 'android'

export async function signInWithGoogle() {
  if (useNativeGoogleAuth) {
    if (!Capacitor.isPluginAvailable('FirebaseAuthentication')) {
      throw new Error('حدّث تطبيق Android إلى أحدث إصدار قبل تسجيل الدخول باستخدام Google.')
    }
    await FirebaseAuthentication.signInWithGoogle()
    const { token } = await FirebaseAuthentication.getIdToken()
    if (!token) throw new Error('تعذر استرجاع رمز Firebase من تسجيل Google.')
    return token
  }
  if (!auth) throw new Error('تسجيل الدخول عبر Google غير مهيأ بعد. أضف إعدادات Firebase إلى متغيرات البيئة ثم أعد البناء.')
  await setPersistence(auth, browserSessionPersistence)
  const result = await signInWithPopup(auth, googleProvider)
  return result.user.getIdToken(true)
}

export async function signOutGoogle() {
  if (useNativeGoogleAuth) {
    await FirebaseAuthentication.signOut()
    return
  }
  if (auth?.currentUser) await signOut(auth)
}
