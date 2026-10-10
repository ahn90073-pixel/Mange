# تطبيق إدارة Mange

واجهة React وVite عربية لإدارة المنصة، متصلة بـBackend الإدارة المستقل على Cloudflare Workers.

## فتح التطبيق

يبدأ التطبيق بشاشة دخول تفصل بين الأدمن العام والموظفين. الأدمن يسجل عبر Firebase Authentication، والموظف يستخدم الحساب الذي أنشأه الأدمن العام. بعد نجاح تسجيل Firebase، يتحقق Backend من ID token ويربط البريد بدور مخزن في Neon.

> **الأمان:** لا يمنح تسجيل Firebase وحده دور أدمن. يتحقق الخادم من البريد الموثق ومطابقته لقائمة `FIREBASE_ADMIN_EMAILS`، ويحفظ دور `super_admin` في Neon. العدد الأقصى ثلاثة. لا تُرسل Firebase ID token أو مفاتيح الخادم إلى السجلات.

## تشغيل محلي

```bash
npm ci
cp .env.example .env.local
npm run dev
```

الإعدادات في `.env.local` تضم إعداد Firebase Web العام وعنوان API؛ لا تضع فيها أسرار قاعدة البيانات أو رموز الجلسات أو service-account keys:

```env
VITE_ADMIN_API_BASE_URL=https://mangerbackend.ahn90073.workers.dev/api/admin
VITE_CURRENCY=EGP
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project
VITE_FIREBASE_APP_ID=...
```

فعّل مزود **Email/Password** في Firebase Authentication وأنشئ حسابات الأدمن هناك مع توثيق عناوين البريد. لا توجد شاشة لإنشاء أدمن من Firebase داخل الواجهة. الموظفون يبقون على المصادقة الحالية.

قبل نشر تغيير إلى `main`، أضف إعدادات تطبيق الويب الأربع في GitHub **Actions variables** بالأسماء `FIREBASE_API_KEY` و`FIREBASE_AUTH_DOMAIN` و`FIREBASE_PROJECT_ID` و`FIREBASE_APP_ID`. يحقنها Workflow بناء OTA داخل Vite كمتغيرات `VITE_FIREBASE_*`.

عنوان API الافتراضي والعملة `EGP` مضمّنان في التطبيق.

## البيانات والعمليات المتصلة

تُحمّل لوحة المؤشرات والتجار والمنتجات والسدادات من API مع pagination. تشمل العمليات المرسلة للخادم اعتماد المنتج أو رفضه، الإبقاء على منتج منشور أو أرشفته، تحديث حالة التاجر ونوع العمولة، وإنشاء سند سداد. الخادم يحسب العمولة والرصيد ويتحقق من حد السداد.

تضم الصفحة **طلبات المتجر** قائمة الطلبات الفعلية الواردة من Tagerbackend. تعرض تفاصيل الطلب العميل وعنوان التوصيل والعناصر والأسعار والتاجر المرتبط بها، وتتيح تحديث حالة الطلب والشحنة ورسوم الشحن ورقم التتبع. زر نسخ الملخص يساعد الإدارة على توجيه الطلب للتاجر يدويًا؛ لا يوجد تكامل إرسال تلقائي أو ربط بشركة شحن حتى الآن. إلغاء طلب غير مشحون يعيد الكميات إلى مخزون التاجر.

## النطاقات وCORS

يرسل Worker ترويسة CORS عامة (`*`) من دون اعتماد credentials حتى تعمل الواجهة على المتصفح وAndroid WebView. بيانات الإدارة تبقى محمية بمصادقة API وصلاحيات Neon؛ CORS ليس بديلًا عن المصادقة.

## Android OTA

نشر تغيير إلى `main` يشغّل GitHub Actions لإنشاء/تحديث حزمة الواجهة `ota-latest`. تطبيق Android يفحص التحديث وينزله؛ تُطبق الحزمة بعد إعادة فتح التطبيق. هذا لا ينشئ APK جديدًا.

## الفحوص

```bash
npm run lint
npm run build
```
