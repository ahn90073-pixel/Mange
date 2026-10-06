# DeviceStorage Native Plugin

أُضيفت إضافة Capacitor محلية باسم `DeviceStorage` إلى مشروع Mange دون تعديل أي مكوّن أو مسار في واجهة React.

## الملفات

- Android/Kotlin: `android/app/src/main/java/com/ahn90073/mange/DeviceStoragePlugin.kt`
- تسجيل Android: `android/app/src/main/java/com/ahn90073/mange/MainActivity.kt`
- iOS/Swift: `ios/App/App/DeviceStoragePlugin.swift`
- تسجيل iOS: `ios/App/App/MangeViewController.swift` و`SceneDelegate.swift`
- جسر JavaScript: `src/plugins/deviceStorage.js`

## الاستخدام من أي ميزة React جديدة

```js
import { DeviceStorage } from '../plugins/deviceStorage'

await DeviceStorage.set({ key: 'draft_id', value: '123' })
const { value } = await DeviceStorage.get({ key: 'draft_id' })
await DeviceStorage.remove({ key: 'draft_id' })
```

لم يتم استيراد الجسر في `App.jsx` أو أي صفحة حالية، لذلك تبقى الواجهة كما هي ولا يحدث أي سلوك جديد تلقائيًا.

## المزامنة والبناء

```bash
npm run build
npx cap sync
npx cap open android
npx cap open ios
```

`ios/App/App.xcodeproj/project.pbxproj` يتضمن الملفين Swift داخل Target، لذلك سيظهران في Xcode ضمن مصادر التطبيق.

## ملاحظة أمنية

هذا المثال يستخدم `SharedPreferences` على Android و`UserDefaults` على iOS لتوضيح الجسر فقط. لا تستخدمه لتخزين كلمات المرور أو رموز الدخول الحساسة في الإنتاج؛ استبدل التنفيذ بـ Android Keystore وApple Keychain أو استخدم إضافة تخزين آمن موثوقة.
