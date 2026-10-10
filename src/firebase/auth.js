let authInstance
let authPromise

function getFirebaseAuth() {
  if (authPromise) return authPromise
  const config = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
  }
  if (Object.values(config).some((value) => typeof value !== 'string' || !value.trim())) {
    throw new Error('إعداد Firebase للواجهة غير مكتمل. أضف قيم VITE_FIREBASE_* ثم أعد بناء التطبيق.')
  }
  authPromise = Promise.all([import('firebase/app'), import('firebase/auth')]).then(([firebaseApp, firebaseAuth]) => {
    const app = firebaseApp.getApps().find((candidate) => candidate.name === 'mange-admin')
      || firebaseApp.initializeApp(config, 'mange-admin')
    try {
      authInstance = firebaseAuth.initializeAuth(app, { persistence: firebaseAuth.inMemoryPersistence })
    } catch (error) {
      if (error?.code !== 'auth/already-initialized') throw error
      authInstance = firebaseAuth.getAuth(app)
    }
    return { auth: authInstance, firebaseAuth }
  })
  return authPromise
}

export async function signInFirebaseAdmin(email, password) {
  const { auth, firebaseAuth } = await getFirebaseAuth()
  const credential = await firebaseAuth.signInWithEmailAndPassword(auth, email, password)
  return credential.user.getIdToken(true)
}

export async function sendFirebaseAdminPasswordReset(email) {
  const { auth, firebaseAuth } = await getFirebaseAuth()
  await firebaseAuth.sendPasswordResetEmail(auth, email)
}

export async function signOutFirebaseAdmin() {
  if (authInstance?.currentUser) {
    const { firebaseAuth } = await getFirebaseAuth()
    await firebaseAuth.signOut(authInstance)
  }
}

export function firebaseAuthErrorMessage(error) {
  const messages = {
    'auth/invalid-credential': 'البريد الإلكتروني أو كلمة المرور غير صحيحة.',
    'auth/user-not-found': 'البريد الإلكتروني أو كلمة المرور غير صحيحة.',
    'auth/wrong-password': 'البريد الإلكتروني أو كلمة المرور غير صحيحة.',
    'auth/invalid-email': 'أدخل بريدًا إلكترونيًا صالحًا.',
    'auth/user-disabled': 'تم إيقاف حساب Firebase هذا. تواصل مع مسؤول النظام.',
    'auth/too-many-requests': 'محاولات كثيرة. انتظر قليلًا ثم حاول مرة أخرى.',
    'auth/network-request-failed': 'تعذر الاتصال بخدمة Firebase. تحقق من اتصال الإنترنت.',
    'auth/operation-not-allowed': 'تسجيل البريد وكلمة المرور غير مفعّل في Firebase Authentication.',
    'auth/invalid-api-key': 'مفتاح Firebase غير صحيح. تحقق من إعدادات التطبيق.',
    'auth/missing-email': 'أدخل بريدك الإلكتروني أولًا.',
  }
  if (error?.message?.startsWith('إعداد Firebase للواجهة غير مكتمل')) return error.message
  return messages[error?.code] || error?.message || 'تعذر تسجيل الدخول. حاول مرة أخرى.'
}
