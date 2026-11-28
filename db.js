// طبقة البيانات: Firebase عند وجود الإعدادات، وإلا «وضع العرض» ببيانات تجريبية
import { firebaseConfig, ADMIN_EMAILS, AUCTION, CLOUDINARY, HALLS } from './firebase-config.js';

export const DEMO = !firebaseConfig.apiKey;
const V = '10.12.2';
let fb = null; // { auth, db, m: modules }

// تحميل Firebase مرة واحدة فقط (حتى لو طلبته عدة أجزاء من الصفحة في نفس اللحظة)
let initP = null;
async function init() {
  if (DEMO) return null;
  if (fb) return fb;
  if (!initP) initP = (async () => {
    const [app, auth, fs] = await Promise.all([
      import(`https://www.gstatic.com/firebasejs/${V}/firebase-app.js`),
      import(`https://www.gstatic.com/firebasejs/${V}/firebase-auth.js`),
      import(`https://www.gstatic.com/firebasejs/${V}/firebase-firestore.js`)
    ]);
    const a = app.getApps().length ? app.getApp() : app.initializeApp(firebaseConfig);
    let au;
    try { au = auth.initializeAuth(a, { persistence: [auth.indexedDBLocalPersistence, auth.browserLocalPersistence, auth.inMemoryPersistence] }); }
    catch { au = auth.getAuth(a); }
    fb = { auth: au, db: fs.getFirestore(a), A: auth, F: fs, app: a };
    return fb;
  })().catch((e) => { initP = null; throw e; });
  return initP;
}
// التخزين يُحمَّل عند الحاجة فقط، فلا يعطّل الدخول أو المزاد
async function initStorage() {
  const f = await init();
  if (!f.S) { f.S = await import(`https://www.gstatic.com/firebasejs/${V}/firebase-storage.js`); f.storage = f.S.getStorage(f.app); }
  return f;
}
// مهلة لأي عملية شبكة حتى لا «تعلق» الأزرار
export function withTimeout(p, ms = 20000) {
  return Promise.race([p, new Promise((_, rej) => setTimeout(() => rej(Object.assign(new Error('timeout'), { code: 'timeout' })), ms))]);
}

/* ---------------- بيانات العرض ---------------- */
const demoProducts = [
  { id: 'p1', cat: 'oud', name: 'عود كمبودي معتق', sub: 'عود • كمبوديا', unit: 'للتولة', price: null },
  { id: 'p2', cat: 'oil', name: 'دهن عود هندي', sub: 'دهن • الهند', unit: 'للتولة', price: null },
  { id: 'p3', cat: 'bakhoor', name: 'بخور معمول ملكي', sub: 'بخور • خلطة المعتق', unit: 'للعلبة', price: null },
  { id: 'p4', cat: 'oud', name: 'عود إندونيسي', sub: 'عود • إندونيسيا', unit: 'للتولة', price: null },
  { id: 'p5', cat: 'mabkhara', name: 'مبخرة المعتق', sub: 'مباخر', unit: 'للقطعة', price: null, image: 'mabkhara.jpg' },
  { id: 'p6', cat: 'oil', name: 'دهن عود كمبودي', sub: 'دهن • كمبوديا', unit: 'للتولة', price: null },
  { id: 'p7', cat: 'bakhoor', name: 'بخور عود مروكي', sub: 'بخور', unit: 'للعلبة', price: null },
  { id: 'p8', cat: 'oud', name: 'عود ماليزي', sub: 'عود • ماليزيا', unit: 'للجرام', price: null, image: 'mabkhara-stand.jpg' },
  { id: 'p9', cat: 'gift', name: 'صندوق هدية المعتق', sub: 'هدايا', unit: 'للصندوق', price: null }
];
const demoWholesale = [
  { id: 'w1', name: 'عود كمبودي', origin: 'درجة أولى', moq: '1 كجم' },
  { id: 'w2', name: 'عود هندي', origin: 'آسام', moq: '1 كجم' },
  { id: 'w3', name: 'عود إندونيسي', origin: 'كلمنتان', moq: '2 كجم' },
  { id: 'w4', name: 'عود ماليزي', origin: 'درجة ثانية', moq: '2 كجم' },
  { id: 'w5', name: 'دهن عود', origin: 'بالتولة — كرتون', moq: '50 تولة' },
  { id: 'w6', name: 'بخور معمول', origin: 'خلطة المعتق', moq: '24 علبة' }
];
const demo = {
  user: null,
  auction: { title: 'مزاد العود المعتق', status: 'live', startAt: Date.now() + 2 * 86400e3, currentLotId: 'l3', lotTotal: 12, watchers: 128 },
  lots: {
    l3: { id: 'l3', no: 3, name: 'عود كمبودي معتق — قطعة واحدة', origin: 'كمبوديا', weight: '[الوزن]', age: 'عود كمبودي فاخر، رائحة عميقة وثابتة، تعتيق طويل.', openPrice: 5000, currentPrice: 12500, leaderPaddle: 215, leaderUid: 'x', endsAt: Date.now() + 154e3, status: 'live' },
    l4: { id: 'l4', no: 4, name: 'دهن عود هندي معتق', status: 'queued', openPrice: null },
    l5: { id: 'l5', no: 5, name: 'عود ماليزي — قطعة', status: 'queued', openPrice: null },
    l6: { id: 'l6', no: 6, name: 'مبخرة نحاس يدوية', status: 'queued', openPrice: null },
    l7: { id: 'l7', no: 7, name: 'عود سيوفي فاخر', status: 'queued', openPrice: null }
  },
  bids: { l3: [
    { paddle: 215, amount: 12500, at: Date.now() - 20e3 },
    { paddle: 88, amount: 12000, at: Date.now() - 45e3 },
    { paddle: 31, amount: 11000, at: Date.now() - 60e3 },
    { paddle: 105, amount: 10500, at: Date.now() - 120e3 },
    { paddle: 63, amount: 9500, at: Date.now() - 180e3 }
  ] },
  subs: new Set()
};
function demoEmit() { demo.subs.forEach((f) => f()); }
// مزايد وهمي في وضع العرض حتى تظهر الحركة
if (DEMO) setInterval(() => {
  const l = demo.lots.l3;
  if (l.status !== 'live' || Date.now() > l.endsAt || Math.random() > 0.25) return;
  const ps = [31, 54, 63, 77, 88, 105, 215];
  const p = ps[Math.floor(Math.random() * ps.length)];
  if (demo.user && l.leaderUid === 'me' && Math.random() > 0.5) return;
  l.currentPrice += AUCTION.increments[Math.floor(Math.random() * AUCTION.increments.length)]; l.leaderPaddle = p; l.leaderUid = 'x';
  if (l.endsAt - Date.now() < AUCTION.antiSnipeSeconds * 1e3) l.endsAt = Date.now() + AUCTION.antiSnipeSeconds * 1e3;
  demo.bids.l3.unshift({ paddle: p, amount: l.currentPrice, at: Date.now() });
  demoEmit();
}, 4000);

const ms = (t) => (t && t.toMillis ? t.toMillis() : t);

/* ---------------- الحساب ---------------- */
let userCb = null, lastAuth = null;
async function emitUser() {
  if (!userCb) return;
  if (DEMO) return userCb(demo.user);
  const { db, F } = await init(); const u = lastAuth;
  if (!u) return userCb(null);
  let d = {};
  try { const snap = await withTimeout(F.getDoc(F.doc(db, 'users', u.uid)), 15000); d = snap.exists() ? snap.data() : {}; }
  catch (e) { console.error('profile read failed', e); }
  // حساب حذفته الإدارة: خروج فوري
  if (d.status === 'deleted') { try { const { auth, A } = await init(); await A.signOut(auth); } catch {} lastAuth = null; try { window.dispatchEvent(new CustomEvent('account-deleted')); } catch {} return userCb(null); }
  userCb({ uid: u.uid, email: u.email, name: d.name || u.displayName || '', phone: d.phone || '', paddle: d.paddle || null,
    type: d.type || '', docNo: d.docNo || '', company: d.company || '', country: d.country || '', city: d.city || '',
    status: d.status || '', pledgeAt: d.pledgeAt || null, pledgePct: d.pledgePct ?? null, isAdmin: ADMIN_EMAILS.includes(u.email) });
}
export async function onUser(cb) {
  userCb = cb;
  if (DEMO) { demo.subs.add(() => cb(demo.user)); cb(demo.user); return; }
  const { auth, A } = await init();
  A.onAuthStateChanged(auth, (u) => { lastAuth = u; emitUser(); });
}
export const refreshUser = () => emitUser();

// التسجيل المبسّط: الاسم + رقم الجوال + رمز دخول. البيانات الرسمية تُطلب فقط عند دخول قسم التجار
export const phoneKey = (p) => { p = String(p || '').replace(/[^\d]/g, ''); if (p.startsWith('00')) p = p.slice(2); if (/^05\d{8}$/.test(p)) p = '966' + p.slice(1); return p; };
const phoneEmail = (p) => 'p' + phoneKey(p) + '@almutiqoud.app';
export async function signUp({ name, phone, password }) {
  if (DEMO) { demo.user = { uid: 'me', name, phone, email: '', paddle: 42, isAdmin: false, type: '', status: 'basic' }; demoEmit(); return demo.user; }
  const { auth, A, db, F } = await withTimeout(init());
  const cred = await withTimeout(A.createUserWithEmailAndPassword(auth, phoneEmail(phone), password));
  await A.updateProfile(cred.user, { displayName: name });
  await F.runTransaction(db, async (tx) => {
    const cRef = F.doc(db, 'counters', 'paddles');
    const c = await tx.get(cRef);
    const next = c.exists() ? c.data().next : 11;
    tx.set(cRef, { next: next + 1 });
    tx.set(F.doc(db, 'users', cred.user.uid), { name, phone, paddle: next, type: '', status: 'basic', createdAt: F.serverTimestamp() });
  });
  lastAuth = cred.user; await emitUser();
  return cred.user;
}

// للأعضاء المسجلين قبل اشتراط الوثيقة
export async function completeProfile(uid, data) {
  if (DEMO) { Object.assign(demo.user, data, { status: 'approved' }); demoEmit(); return; }
  const { db, F } = await init();
  await F.updateDoc(F.doc(db, 'users', uid), { ...data, status: 'pending' });
  await emitUser();
}

// الدخول برقم الجوال (أو بالبريد لحساب المدير)
export async function signIn(id, password) {
  const email = String(id).includes('@') ? String(id).trim() : phoneEmail(id);
  if (DEMO) { demo.user = { uid: 'me', name: 'زائر', email, paddle: 42, isAdmin: email.startsWith('admin'), type: 'individual', docNo: 'FL-0000', country: 'السعودية', status: 'approved' }; demoEmit(); return; }
  const { auth, A } = await withTimeout(init());
  await withTimeout(A.signInWithEmailAndPassword(auth, email, password));
}

export async function resetPassword(email) {
  if (DEMO) return;
  const { auth, A } = await init();
  await A.sendPasswordResetEmail(auth, email);
}

export async function signOutUser() {
  if (DEMO) { demo.user = null; demoEmit(); return; }
  const { auth, A } = await init();
  await A.signOut(auth);
}

/* ---------------- المزاد ---------------- */
// قاعة الرياض تستخدم المستند القديم «current» حتى لا تضيع بيانات المزاد الحالي
export { HALLS };
export const hallOf = (id) => HALLS.find((h) => h.id === id) || HALLS[0];
export const hallDoc = (id) => (hallOf(id).id === 'riyadh' ? 'current' : hallOf(id).id);
const lotHall = (l) => l.hall || 'riyadh';
const demoHalls = { hijaz: { title: 'دار الكمبودي', status: 'upcoming', startAt: Date.now() + 1.2 * 86400e3 }, east: { title: 'عطور الخليج', status: 'upcoming', startAt: Date.now() + 2.3 * 86400e3 }, north: { title: 'عود حائل', status: 'upcoming', startAt: Date.now() + 3.1 * 86400e3 } };
export async function watchAuction(cb, hall = 'riyadh') {
  hall = hallOf(hall).id;
  if (DEMO) { const f = () => cb(hall === 'riyadh' ? { ...demo.auction } : demoHalls[hall] ? { ...demoHalls[hall] } : null); demo.subs.add(f); f(); return () => demo.subs.delete(f); }
  const { db, F } = await init();
  return F.onSnapshot(F.doc(db, 'auctions', hallDoc(hall)), (s) => cb(s.exists() ? { ...s.data(), startAt: ms(s.data().startAt) } : null));
}

export async function watchLot(id, cb) {
  if (DEMO) { const f = () => cb(demo.lots[id] ? { ...demo.lots[id] } : null); demo.subs.add(f); f(); return () => demo.subs.delete(f); }
  const { db, F } = await init();
  return F.onSnapshot(F.doc(db, 'lots', id), (s) => cb(s.exists() ? { id: s.id, ...s.data(), endsAt: ms(s.data().endsAt) } : null));
}

export async function watchLots(cb, hall = 'riyadh') {
  hall = hallOf(hall).id;
  if (DEMO) { const f = () => cb(Object.values(demo.lots).filter((l) => lotHall(l) === hall).sort((a, b) => a.no - b.no)); demo.subs.add(f); f(); return () => demo.subs.delete(f); }
  const { db, F } = await init();
  return F.onSnapshot(F.query(F.collection(db, 'lots'), F.orderBy('no')), (q) => cb(q.docs.map((d) => ({ id: d.id, ...d.data(), endsAt: ms(d.data().endsAt) })).filter((l) => lotHall(l) === hall)));
}

export async function watchBids(lotId, cb) {
  if (DEMO) { const f = () => cb((demo.bids[lotId] || []).slice(0, 12)); demo.subs.add(f); f(); return () => demo.subs.delete(f); }
  const { db, F } = await init();
  const q = F.query(F.collection(db, 'lots', lotId, 'bids'), F.orderBy('amount', 'desc'), F.limit(12));
  return F.onSnapshot(q, (s) => cb(s.docs.map((d) => ({ ...d.data(), at: ms(d.data().at) }))));
}

export async function placeBid(lotId, inc, user) {
  if (!user || !user.paddle) throw new Error('سجّل دخولك أولاً لتحصل على رقم مزايدة');
  if (DEMO) {
    const l = demo.lots[lotId];
    if (l.status !== 'live' || Date.now() > l.endsAt) throw new Error('انتهى وقت هذه القطعة');
    l.currentPrice += inc; l.leaderPaddle = user.paddle; l.leaderUid = user.uid;
    if (l.endsAt - Date.now() < AUCTION.antiSnipeSeconds * 1e3) l.endsAt = Date.now() + AUCTION.antiSnipeSeconds * 1e3;
    demo.bids[lotId].unshift({ paddle: user.paddle, amount: l.currentPrice, at: Date.now() });
    demoEmit(); return l.currentPrice;
  }
  const { db, F } = await init();
  return F.runTransaction(db, async (tx) => {
    const ref = F.doc(db, 'lots', lotId);
    const s = await tx.get(ref);
    if (!s.exists()) throw new Error('القطعة غير موجودة');
    const l = s.data();
    const ends = ms(l.endsAt);
    if (l.status !== 'live' || Date.now() > ends) throw new Error('انتهى وقت هذه القطعة');
    if (l.ownerUid && l.ownerUid === user.uid) throw new Error('لا يمكنك المزايدة على منتجك');
    const amount = (l.currentPrice || l.openPrice) + inc;
    const left = ends - Date.now();
    const newEnds = left < AUCTION.antiSnipeSeconds * 1e3 ? F.Timestamp.fromMillis(Date.now() + AUCTION.antiSnipeSeconds * 1e3) : l.endsAt;
    tx.update(ref, { currentPrice: amount, leaderUid: user.uid, leaderPaddle: user.paddle, endsAt: newEnds, bidCount: (l.bidCount || 0) + 1 });
    tx.set(F.doc(F.collection(db, 'lots', lotId, 'bids')), { uid: user.uid, paddle: user.paddle, amount, at: F.serverTimestamp() });
    return amount;
  });
}

/* ---------------- المتجر والجملة ---------------- */
export async function getProducts() {
  if (DEMO) return demoProducts;
  const { db, F } = await init();
  const s = await F.getDocs(F.query(F.collection(db, 'products'), F.where('active', '==', true)));
  return s.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function getWholesale() {
  if (DEMO) return demoWholesale;
  const { db, F } = await init();
  const s = await F.getDocs(F.query(F.collection(db, 'wholesale'), F.orderBy('order')));
  return s.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function submitQuote(data) {
  if (DEMO) return 'DEMO';
  const { db, F } = await init();
  const r = await F.addDoc(F.collection(db, 'quotes'), { ...data, status: 'new', createdAt: F.serverTimestamp() });
  return r.id;
}

export async function submitOrder(data) {
  if (DEMO) return 'DEMO-' + Math.floor(Math.random() * 9000 + 1000);
  const { db, F } = await init();
  const r = await F.addDoc(F.collection(db, 'orders'), { ...data, status: 'new', createdAt: F.serverTimestamp() });
  return r.id;
}

/* ---------------- لوحة التحكم ---------------- */
export async function admin() {
  if (DEMO) return null;
  return init();
}

/* ---------------- الحضور في القاعة ---------------- */
// كل مستخدم مسجّل يفتح صفحة المزاد يُسجَّل حاضراً ويأخذ مقعداً بمضربه، ويُحدَّث كل 25 ثانية
const demoPresence = [215, 88, 31, 105, 63].map((p, i) => ({ uid: 'd' + p, paddle: p, joinedAt: Date.now() - (10 - i) * 6e4, seenAt: Date.now() }));
let beat = null;
export async function joinRoom(user, hall = 'riyadh') {
  hall = hallOf(hall).id;
  clearInterval(beat);
  if (!user || !user.paddle) return;
  const joinedAt = Date.now();
  if (DEMO) {
    if (!demoPresence.find((x) => x.uid === user.uid)) { demoPresence.push({ uid: user.uid, paddle: user.paddle, hall, joinedAt, seenAt: Date.now() }); setTimeout(demoEmit, 0); }
    return;
  }
  const { db, F } = await init();
  const ref = F.doc(db, 'presence', user.uid);
  const ping = () => F.setDoc(ref, { uid: user.uid, paddle: user.paddle, hall, joinedAt, seenAt: Date.now() }).catch(() => {});
  ping(); beat = setInterval(ping, 25000);
  addEventListener('pagehide', () => F.deleteDoc(ref).catch(() => {}), { once: true });
}
export async function watchPresence(cb, hall = 'riyadh') {
  hall = hallOf(hall).id;
  if (DEMO) { const f = () => cb(demoPresence.filter((x) => (x.hall || 'riyadh') === hall)); demo.subs.add(f); f(); return () => demo.subs.delete(f); }
  const { db, F } = await init();
  let list = [];
  const emit = () => cb(list.filter((x) => Date.now() - x.seenAt < 70000 && (x.hall || 'riyadh') === hall));
  const un = F.onSnapshot(F.collection(db, 'presence'), (s) => { list = s.docs.map((d) => d.data()); emit(); });
  const t = setInterval(emit, 15000);
  return () => { un(); clearInterval(t); };
}

/* ---------------- الفائزون ---------------- */
const demoWins = {};
export async function watchMyWins(uid, cb) {
  if (DEMO) {
    const f = () => {
      const l = demo.lots.l3;
      if (l && l.status === 'live' && Date.now() > l.endsAt + 4000) { l.status = 'sold'; setTimeout(demoEmit, 0); }
      if (l && l.status === 'sold' && l.leaderUid === uid && !demoWins.l3) demoWins.l3 = { lotId: 'l3', lotName: l.name, lotNo: l.no, uid, paddle: l.leaderPaddle, amount: l.currentPrice, status: 'awaiting_payment', createdAt: Date.now() };
      cb(Object.values(demoWins).filter((w) => w.uid === uid));
    };
    demo.subs.add(f); f(); const t = setInterval(f, 2000); return () => { demo.subs.delete(f); clearInterval(t); };
  }
  const { db, F } = await init();
  return F.onSnapshot(F.query(F.collection(db, 'wins'), F.where('uid', '==', uid)), (s) => cb(s.docs.map((d) => ({ ...d.data(), createdAt: ms(d.data().createdAt), dueAt: ms(d.data().dueAt) }))), () => cb([]));
}
export async function uploadReceipt(lotId, dataUrl) {
  if (DEMO) { if (demoWins[lotId]) { demoWins[lotId].receipt = dataUrl; demoWins[lotId].status = 'receipt_uploaded'; demoEmit(); } return; }
  const { db, F } = await init();
  await F.updateDoc(F.doc(db, 'wins', lotId), { receipt: dataUrl, status: 'receipt_uploaded', receiptAt: Date.now() });
}

/* ---------------- إعدادات الموقع (البنك والتواصل) ---------------- */
// تُعبّأ من لوحة التحكم › الإعدادات، وتُستخدم قيم firebase-config.js إن كانت فارغة
import { PAYMENT as P0, CONTACT as C0 } from './firebase-config.js';
const defaults = () => ({ agoraAppId: '', commission: 5, bank: P0.bank, accountName: P0.accountName, iban: P0.iban, days: P0.days, whatsapp: C0.whatsapp, whatsappIntl: C0.whatsappIntl, email: C0.email, cr: C0.cr });
export async function watchSettings(cb) {
  if (DEMO) { cb(defaults()); return () => {}; }
  const { db, F } = await init();
  return F.onSnapshot(F.doc(db, 'settings', 'site'), (s) => { const d = s.exists() ? s.data() : {}; const o = defaults(); for (const k in d) if (d[k] !== '' && d[k] != null) o[k] = d[k]; cb(o); }, () => cb(defaults()));
}
export async function saveSettings(data) {
  if (DEMO) return;
  const { db, F } = await init();
  await F.setDoc(F.doc(db, 'settings', 'site'), data, { merge: true });
}


/* ---------------- قسم التجار: الدليل ومنتجات الأعضاء ---------------- */
const demoDir = [
  { uid: 'd215', name: 'أبو فهد', company: 'مؤسسة عود الشرق', type: 'trader', country: 'السعودية', city: 'جدة', phone: '0551112223' },
  { uid: 'd88', name: 'خالد', company: 'دار الكمبودي', type: 'trader', country: 'الإمارات', city: 'دبي', phone: '+971501234567' },
  { uid: 'd31', name: 'سالم', company: '', type: 'individual', country: 'الكويت', city: 'الكويت', phone: '+96550001111' }
];
const demoListings = [
  { id: 'L1', owner: 'd215', ownerName: 'مؤسسة عود الشرق', ownerType: 'trader', country: 'السعودية', name: 'عود كمبودي معتق — 1 كجم', desc: 'درجة أولى، تعتيق طويل.', price: null, unit: 'للكيلو', images: ['hero-oud.jpg', 'mabkhara.jpg'], video: '', createdAt: Date.now() - 3600e3 },
  { id: 'L2', owner: 'd88', ownerName: 'دار الكمبودي', ownerType: 'trader', country: 'الإمارات', name: 'دهن عود هندي', desc: 'بالتولة، جملة وتجزئة.', price: null, unit: 'للتولة', images: ['mabkhara-stand.jpg'], video: '', createdAt: Date.now() - 7200e3 }
];
export async function getDirectory() {
  if (DEMO) return demoDir;
  const { db, F } = await init();
  const s = await F.getDocs(F.collection(db, 'directory'));
  return s.docs.map((d) => ({ uid: d.id, ...d.data() }));
}
export async function getListings() {
  if (DEMO) return demoListings.slice().sort((a, b) => b.createdAt - a.createdAt);
  const { db, F } = await init();
  const s = await F.getDocs(F.collection(db, 'listings'));
  return s.docs.map((d) => ({ id: d.id, ...d.data(), createdAt: ms(d.data().createdAt) })).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
}
export async function saveListing(user, data, id) {
  const base = { ...data, owner: user.uid, ownerName: user.company || user.name, ownerType: user.type, country: user.country || '' };
  if (DEMO) { if (id) Object.assign(demoListings.find((x) => x.id === id), base); else demoListings.push({ ...base, id: 'L' + Date.now(), createdAt: Date.now() }); return; }
  const { db, F } = await init();
  if (id) await F.updateDoc(F.doc(db, 'listings', id), base);
  else await F.addDoc(F.collection(db, 'listings'), { ...base, createdAt: F.serverTimestamp() });
}
export async function deleteListing(id) {
  if (DEMO) { const i = demoListings.findIndex((x) => x.id === id); if (i > -1) demoListings.splice(i, 1); return; }
  const { db, F } = await init();
  await F.deleteDoc(F.doc(db, 'listings', id));
}

/* ---------------- المراسلة والأرشيف ---------------- */
// كل محادثة بين عضوين لها معرّف ثابت؛ والرسائل لا تُعدَّل ولا تُحذف لتبقى أرشيفاً
const demoChats = {}, demoMsgs = {};
const chatId = (a, b) => [a, b].sort().join('_');
export async function openChat(me, other, topic = '') {
  const id = chatId(me.uid, other.uid);
  const data = { members: [me.uid, other.uid].sort(), names: { [me.uid]: me.company || me.name, [other.uid]: other.company || other.name }, topic };
  if (DEMO) { demoChats[id] = demoChats[id] || { id, ...data, lastText: '', updatedAt: Date.now() }; return id; }
  const { db, F } = await init();
  const ref = F.doc(db, 'chats', id);
  const s = await F.getDoc(ref).catch(() => null);
  if (!s || !s.exists()) await F.setDoc(ref, { ...data, lastText: '', updatedAt: Date.now() });
  else if (topic) await F.updateDoc(ref, { topic });
  return id;
}
export async function watchChats(uid, cb) {
  if (DEMO) { const f = () => cb(Object.values(demoChats).sort((a, b) => b.updatedAt - a.updatedAt)); demo.subs.add(f); f(); return () => demo.subs.delete(f); }
  const { db, F } = await init();
  return F.onSnapshot(F.query(F.collection(db, 'chats'), F.where('members', 'array-contains', uid)), (s) => cb(s.docs.map((d) => ({ id: d.id, ...d.data() })).sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0))), () => cb([]));
}
export async function watchAllChats(cb) {
  const { db, F } = await init();
  return F.onSnapshot(F.collection(db, 'chats'), (s) => cb(s.docs.map((d) => ({ id: d.id, ...d.data() })).sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0))));
}
export async function watchMessages(id, cb) {
  if (DEMO) { const f = () => cb((demoMsgs[id] || []).slice()); demo.subs.add(f); f(); return () => demo.subs.delete(f); }
  const { db, F } = await init();
  return F.onSnapshot(F.query(F.collection(db, 'chats', id, 'messages'), F.orderBy('at')), (s) => cb(s.docs.map((d) => ({ id: d.id, ...d.data() }))));
}
export async function sendMessage(id, user, text) {
  text = String(text).trim().slice(0, 2000); if (!text) return;
  if (DEMO) { (demoMsgs[id] = demoMsgs[id] || []).push({ from: user.uid, text, at: Date.now() }); Object.assign(demoChats[id], { lastText: text, updatedAt: Date.now() }); demoEmit(); return; }
  const { db, F } = await init();
  await F.addDoc(F.collection(db, 'chats', id, 'messages'), { from: user.uid, text, at: Date.now() });
  await F.updateDoc(F.doc(db, 'chats', id), { lastText: text.slice(0, 120), lastFrom: user.uid, updatedAt: Date.now() });
}


/* ---------------- رفع الصور والفيديو إلى Firebase Storage ---------------- */
// الصور تُضغط قبل الرفع، والفيديو يُرفع كما هو (حتى 50 ميجا). يُعاد رابط مباشر للملف.
export const MAX_VIDEO_MB = 50;
function dataUrlToBlob(u) { const [h, b] = u.split(','); const mime = h.match(/:(.*?);/)[1]; const bin = atob(b); const a = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) a[i] = bin.charCodeAt(i); return new Blob([a], { type: mime }); }
export async function uploadMedia(folder, fileOrDataUrl, onProgress) {
  const blob = typeof fileOrDataUrl === 'string' ? dataUrlToBlob(fileOrDataUrl) : fileOrDataUrl;
  if (DEMO) return typeof fileOrDataUrl === 'string' ? fileOrDataUrl : URL.createObjectURL(blob);
  if (CLOUDINARY && CLOUDINARY.cloudName && CLOUDINARY.uploadPreset) return uploadCloudinary(folder, blob, onProgress);
  const { storage, S, auth } = await initStorage();
  const uid = auth.currentUser?.uid || 'anon';
  const ext = (blob.type.split('/')[1] || 'bin').replace('quicktime', 'mov').replace('jpeg', 'jpg');
  const path = `${folder}/${uid}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const task = S.uploadBytesResumable(S.ref(storage, path), blob, { contentType: blob.type });
  await new Promise((res, rej) => task.on('state_changed', (s) => onProgress && onProgress(Math.round(s.bytesTransferred / s.totalBytes * 100)), rej, res));
  return S.getDownloadURL(task.snapshot.ref);
}

// تحديث صورة/فيديو المنتج المعروض في المزاد مباشرة من صفحة المزاد (للمدير)
export async function updateLotMedia(lotId, field, url) {
  if (DEMO) { if (demo.lots[lotId]) { demo.lots[lotId][field] = url; demoEmit(); } return; }
  const { db, F } = await init();
  await F.updateDoc(F.doc(db, 'lots', lotId), { [field]: url });
}

// Cloudinary: رفع مباشر من المتصفح (مجاني) — يعيد رابط https للملف
function uploadCloudinary(folder, blob, onProgress) {
  return new Promise((res, rej) => {
    const kind = blob.type.startsWith('video/') ? 'video' : 'image';
    const fd = new FormData();
    fd.append('file', blob);
    fd.append('upload_preset', CLOUDINARY.uploadPreset);
    fd.append('folder', 'almutiqoud/' + folder);
    const x = new XMLHttpRequest();
    x.open('POST', `https://api.cloudinary.com/v1_1/${CLOUDINARY.cloudName}/${kind}/upload`);
    x.upload.onprogress = (e) => { if (e.lengthComputable && onProgress) onProgress(Math.round(e.loaded / e.total * 100)); };
    x.onload = () => { try { const r = JSON.parse(x.responseText); if (x.status < 300 && r.secure_url) res(kind === 'video' ? r.secure_url.replace('/upload/', '/upload/q_auto/').replace(/\.\w+$/, '.mp4') : r.secure_url.replace('/upload/', '/upload/f_auto,q_auto/')); else rej(new Error(r.error?.message || 'upload failed')); } catch (e) { rej(e); } };
    x.onerror = () => rej(new Error('network'));
    x.send(fd);
  });
}

// تعهد التاجر بدفع عمولة المنصة (يُحفظ في حسابه مع النسبة وتاريخ الموافقة)
export async function savePledge(user, pct) {
  if (DEMO) { Object.assign(demo.user || {}, { pledgeAt: Date.now(), pledgePct: pct }); demoEmit(); return; }
  const { db, F } = await init();
  await F.updateDoc(F.doc(db, 'users', user.uid), { pledgeAt: Date.now(), pledgePct: pct });
  user.pledgeAt = Date.now(); user.pledgePct = pct;
}

/* ---------------- مزاد التاجر: يعرض منتجه في «المنتجات التالية» ويبدأه بنفسه ---------------- */
// يضيف منتج التاجر إلى قائمة المنتجات التالية في القاعة التي يختارها
export async function submitToAuction(user, listing, { hall, openPrice, minutes }) {
  hall = hallOf(hall).id;
  const base = {
    name: listing.name, age: listing.desc || '', origin: '', weight: '', openPrice: +openPrice,
    image: (listing.images || [])[0] || '', image2: (listing.images || [])[1] || '', image3: (listing.images || [])[2] || '', image4: (listing.images || [])[3] || '',
    video: listing.video || '', hall, status: 'queued', currentPrice: null, bidCount: 0, endsAt: null, leaderUid: null, leaderPaddle: null,
    lotMinutes: Math.min(30, Math.max(1, Math.round(+minutes || 5))), ownerUid: user.uid, ownerName: user.company || user.name || '', listingId: listing.id
  };
  if (DEMO) { const id = 'u' + Date.now(); const no = Math.max(0, ...Object.values(demo.lots).map((l) => l.no || 0)) + 1; demo.lots[id] = { id, no, ...base }; demoEmit(); return id; }
  const { db, F } = await init();
  const s = await F.getDocs(F.query(F.collection(db, 'lots'), F.orderBy('no', 'desc'), F.limit(1)));
  const no = s.empty ? 1 : (+s.docs[0].data().no || 0) + 1;
  const r = await withTimeout(F.addDoc(F.collection(db, 'lots'), { ...base, no, createdAt: F.serverTimestamp() }));
  return r.id;
}
// منتجات التاجر في المزاد (لمعرفة حالتها: في الانتظار / مباشر / بيع)
export async function watchMyLots(uid, cb) {
  if (DEMO) { const f = () => cb(Object.values(demo.lots).filter((l) => l.ownerUid === uid)); demo.subs.add(f); f(); return () => demo.subs.delete(f); }
  const { db, F } = await init();
  return F.onSnapshot(F.query(F.collection(db, 'lots'), F.where('ownerUid', '==', uid)), (q) => cb(q.docs.map((d) => ({ id: d.id, ...d.data(), endsAt: ms(d.data().endsAt) }))), () => cb([]));
}
// سحب المنتج من المنتجات التالية (قبل بدئه فقط)
export async function withdrawLot(lotId) {
  if (DEMO) { delete demo.lots[lotId]; demoEmit(); return; }
  const { db, F } = await init();
  await withTimeout(F.deleteDoc(F.doc(db, 'lots', lotId)));
}
// بدء مزاد التاجر في قاعته — بشرط ألا يكون فيها مزاد مباشر الآن
export async function startMyLot(lot) {
  const min = Math.min(30, Math.max(1, +lot.lotMinutes || 5));
  if (DEMO) {
    const cur = demo.lots[demo.auction.currentLotId];
    if (lotHall(lot) === 'riyadh' && cur && cur.status === 'live' && cur.id !== lot.id && Date.now() < cur.endsAt) throw Object.assign(new Error('busy'), { code: 'busy' });
    Object.assign(demo.lots[lot.id], { status: 'live', currentPrice: lot.openPrice, endsAt: Date.now() + min * 6e4, leaderUid: null, leaderPaddle: null, bidCount: 0 });
    if (lotHall(lot) === 'riyadh') Object.assign(demo.auction, { currentLotId: lot.id, status: 'live', title: lot.ownerName });
    demo.bids[lot.id] = []; demoEmit(); return;
  }
  const { db, F } = await init();
  const auRef = F.doc(db, 'auctions', hallDoc(lotHall(lot)));
  const au = await F.getDoc(auRef);
  const curId = au.exists() ? au.data().currentLotId : null;
  if (curId && curId !== lot.id) {
    const c = await F.getDoc(F.doc(db, 'lots', curId));
    if (c.exists() && c.data().status === 'live') {
      // مزاد سابق انتهى وقته ولم يُغلق بعد: نغلقه أولاً
      if (Date.now() > ms(c.data().endsAt) + 4000) await closeIfExpired(curId); else throw Object.assign(new Error('busy'), { code: 'busy' });
    }
  }
  const b = F.writeBatch(db);
  b.update(F.doc(db, 'lots', lot.id), { status: 'live', currentPrice: lot.openPrice, endsAt: F.Timestamp.fromMillis(Date.now() + min * 6e4), leaderUid: null, leaderPaddle: null, bidCount: 0 });
  b.set(auRef, { currentLotId: lot.id, status: 'live', title: lot.ownerName || '' }, { merge: true });
  await withTimeout(b.commit());
}
// إغلاق تلقائي من أي متصفح مفتوح على القاعة بعد انتهاء الوقت: ترسية على صاحب أعلى مزايدة
export async function closeIfExpired(lotId) {
  if (DEMO) {
    const l = demo.lots[lotId]; if (!l || l.status !== 'live' || Date.now() < l.endsAt + 3000) return null;
    l.status = l.leaderUid ? 'sold' : 'unsold';
    if (l.leaderUid) demoWins[lotId] = { lotId, lotName: l.name, uid: l.leaderUid, paddle: l.leaderPaddle, amount: l.currentPrice, status: 'awaiting_payment' };
    demoEmit(); return l.status;
  }
  const { db, F } = await init();
  return F.runTransaction(db, async (tx) => {
    const ref = F.doc(db, 'lots', lotId); const s = await tx.get(ref); if (!s.exists()) return null;
    const d = s.data(); if (d.status !== 'live' || Date.now() < ms(d.endsAt) + 3000) return null;
    const sold = !!d.leaderUid;
    tx.update(ref, { status: sold ? 'sold' : 'unsold', closedBy: 'auto', closedAt: F.serverTimestamp() });
    if (sold) tx.set(F.doc(db, 'wins', lotId), { lotId, lotName: d.name, lotNo: d.no || 0, uid: d.leaderUid, paddle: d.leaderPaddle, amount: d.currentPrice, commissionPct: 5, seller: d.ownerName || '', sellerUid: d.ownerUid || '', hall: lotHall(d), status: 'awaiting_payment', createdAt: F.serverTimestamp(), dueAt: Date.now() + 2 * 864e5 });
    return sold ? 'sold' : 'unsold';
  });
}

/* ---------------- استعادة رمز الدخول + أدوات المدير ---------------- */
const ADMIN_API = 'https://agora-token.almutiqoud.workers.dev/admin/';
// العضو يطلب رمزاً جديداً برقم جواله (بدون تسجيل دخول)
export async function requestReset(phone) {
  phone = String(phone || '').replace(/[^\d]/g, '');
  if (!/^05\d{8}$/.test(phone)) throw new Error('phone');
  if (DEMO) return;
  const { db, F } = await init();
  await withTimeout(F.setDoc(F.doc(db, 'resetRequests', phone), { phone, createdAt: F.serverTimestamp() }));
}
// المدير: تعيين رمز دخول جديد أو حذف حساب (عبر خدمة Cloudflare)
export async function adminCall(action, body) {
  if (DEMO) return { ok: true };
  const { auth } = await init();
  const u = auth.currentUser; if (!u) throw new Error('signin');
  const r = await fetch(ADMIN_API + action, { method: 'POST', headers: { 'content-type': 'application/json', authorization: 'Bearer ' + (await u.getIdToken()) }, body: JSON.stringify({ app: 'almutiqoud', ...body }) });
  const d = await r.json().catch(() => ({}));
  if (!r.ok || !d.ok) throw Object.assign(new Error(d.error || 'failed'), { code: d.error || 'failed', detail: d.detail });
  return d;
}
