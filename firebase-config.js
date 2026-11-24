// ضع هنا إعدادات مشروع Firebase الخاص بـ«المعتق للعود»
// من: Firebase Console › Project settings › Your apps › Web app › SDK setup and configuration
// ما دامت القيم فارغة يعمل الموقع في «وضع العرض» ببيانات تجريبية.
export const firebaseConfig = {
  apiKey: "AIzaSyBqwEBon2EilcLxSlkU8UF49fR_bL0lKsA",
  authDomain: "almutiqoud-6ccdd.firebaseapp.com",
  projectId: "almutiqoud-6ccdd",
  storageBucket: "almutiqoud-6ccdd.firebasestorage.app",
  messagingSenderId: "561002137969",
  appId: "1:561002137969:web:0aaf48fe40254a1626ced0"
};

// بريد حساب المدير (يدخل لوحة التحكم)
export const ADMIN_EMAILS = ["almutiqoud@gmail.com"];

// إعدادات المزاد
export const AUCTION = {
  increments: [50, 100],          // مقادير الزيادة بالريال
  antiSnipeSeconds: 30           // أي مزايدة في آخر 30 ثانية تمدّد الوقت إلى 30 ثانية
};

// بيانات التحويل للفائز في المزاد
export const PAYMENT = {
  bank: "[اسم البنك]",
  accountName: "[اسم صاحب الحساب]",
  iban: "[رقم الآيبان SA...]",
  days: 2,                         // مهلة التحويل بالأيام
  commission: 10                   // نسبة المنصة % على التاجر عند البيع
};

// بيانات التواصل
export const CONTACT = {
  whatsapp: "[رقم الواتساب]",
  whatsappIntl: "",               // رقم الواتساب بالصيغة الدولية بدون + مثل 9665XXXXXXXX
  email: "[البريد الإلكتروني]",
  cr: "[السجل التجاري]"
};
