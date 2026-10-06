# إعداد GitHub Actions للإصدارات الموقعة

Workflow الإصدار موجود في:

```text
.github/workflows/release.yml
```

يشغّل البناء من صفحة **Actions > Build and Release Mobile Apps > Run workflow**، أو تلقائيًا عند دفع Tag بصيغة `v1.0.1`.

بعد نجاح البناء ينشئ Release تلقائيًا على GitHub ويرفع:

- `Mange-<version>.apk`
- `Mange-<version>.aab`
- `Mange-<version>.ipa` عند تفعيل بناء iOS

## أسرار Android

من **Settings > Secrets and variables > Actions** أضف:

- `ANDROID_KEYSTORE_BASE64`: ناتج `base64 -w 0 mange-release.jks`
- `ANDROID_KEYSTORE_PASSWORD`
- `ANDROID_KEY_ALIAS`
- `ANDROID_KEY_PASSWORD`

أنشئ keystore خارج المستودع:

```bash
keytool -genkeypair -v -keystore mange-release.jks \
  -alias mange -keyalg RSA -keysize 2048 -validity 10000
base64 -w 0 mange-release.jks
```

## أسرار iOS

يحتاج Runner من نوع macOS وApple Developer signing:

- `BUILD_CERTIFICATE_BASE64`: شهادة `.p12` مشفرة بـ base64
- `P12_PASSWORD`
- `KEYCHAIN_PASSWORD`: كلمة مرور مؤقتة للـ keychain
- `PROVISIONING_PROFILE_BASE64`: ملف `.mobileprovision` مشفر بـ base64
- `IOS_PROFILE_NAME`: اسم ملف Provisioning Profile كما يظهر في Xcode
- `APPLE_TEAM_ID`
- `IOS_BUNDLE_ID`: غالبًا `com.ahn90073.mange`

لا تضع أي شهادة أو keystore أو كلمة مرور داخل Git.

## تشغيل الإصدار

تشغيل يدوي:

1. افتح تبويب **Actions**.
2. اختر **Build and Release Mobile Apps**.
3. اضغط **Run workflow**.
4. أدخل إصدارًا مثل `1.0.1`.
5. اختر بناء iOS أو إلغاءه إذا لم تضبط أسراره.

تشغيل عبر Tag:

```bash
git tag v1.0.1
git push origin v1.0.1
```

سيُنشئ الـ Workflow صفحة Release الجديدة تلقائيًا؛ لا يحتاج المستخدم إلى فتح `releases/new` يدويًا.
