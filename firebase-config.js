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
  commission: 5                    // عمولة المنصة ثابتة 5% (المزاد + الجملة + التجزئة)
};

// بيانات التواصل
export const CONTACT = {
  whatsapp: "[رقم الواتساب]",
  whatsappIntl: "",               // رقم الواتساب بالصيغة الدولية بدون + مثل 9665XXXXXXXX
  email: "[البريد الإلكتروني]",
  cr: "[السجل التجاري]"
};

// رفع الصور والفيديو مجاناً عبر Cloudinary (بدون بطاقة)
// من لوحة Cloudinary: Cloud name + اسم Upload preset من نوع Unsigned
export const CLOUDINARY = {
  cloudName: "ea4rk7u2",
  uploadPreset: "almutiqoud"
};

// عمولة المنصة الثابتة على كل المبيعات: المزاد والجملة والتجزئة
export const COMMISSION = 5;

// قاعات المزاد — كل قاعة لها مزادها ومنتجاتها وحضورها
export const HALLS = [
  { id: 'riyadh', name: 'قاعة الرياض', img: 'hall-riyadh.jpg' },
  { id: 'hijaz',  name: 'قاعة الحجاز', img: 'hall-hijaz.jpg' },
  { id: 'east',   name: 'قاعة الشرق',  img: 'hall-east.jpg' },
  { id: 'south',  name: 'قاعة الجنوب', img: 'hall-south.jpg' },
  { id: 'north',  name: 'قاعة الشمال', img: 'hall-north.jpg' }
];
