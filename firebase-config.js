// ضع هنا إعدادات مشروع Firebase الخاص بـ«المعتق للعود»
// من: Firebase Console › Project settings › Your apps › Web app › SDK setup and configuration
// ما دامت القيم فارغة يعمل الموقع في «وضع العرض» ببيانات تجريبية.
export const firebaseConfig = {
  apiKey: "",
  authDomain: "",
  projectId: "",
  storageBucket: "",
  messagingSenderId: "",
  appId: ""
};

// بريد حساب المدير (يدخل لوحة التحكم)
export const ADMIN_EMAILS = ["admin@example.com"];

// إعدادات المزاد
export const AUCTION = {
  increments: [100, 500, 1000],   // مقادير الزيادة بالريال
  antiSnipeSeconds: 30           // أي مزايدة في آخر 30 ثانية تمدّد الوقت إلى 30 ثانية
};

// بيانات التواصل
export const CONTACT = {
  whatsapp: "[رقم الواتساب]",
  email: "[البريد الإلكتروني]",
  cr: "[السجل التجاري]"
};
