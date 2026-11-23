// طبقة البيانات: Firebase عند وجود الإعدادات، وإلا «وضع العرض» ببيانات تجريبية
import { firebaseConfig, ADMIN_EMAILS, AUCTION } from './firebase-config.js';

export const DEMO = !firebaseConfig.apiKey;
const V = '10.12.2';
let fb = null; // { auth, db, m: modules }

async function init() {
  if (DEMO || fb) return fb;
  const [app, auth, fs] = await Promise.all([
    import(`https://www.gstatic.com/firebasejs/${V}/firebase-app.js`),
    import(`https://www.gstatic.com/firebasejs/${V}/firebase-auth.js`),
    import(`https://www.gstatic.com/firebasejs/${V}/firebase-firestore.js`)
  ]);
  const a = app.initializeApp(firebaseConfig);
  fb = { auth: auth.getAuth(a), db: fs.getFirestore(a), A: auth, F: fs };
  return fb;
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
  { id: 'p8', cat: 'oud', name: 'عود ماليزي', sub: 'عود • ماليزيا', unit: 'للجرام', price: null, image: 'oudpile.jpg' },
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
    l3: { id: 'l3', no: 3, name: 'عود كمبودي معتق — قطعة واحدة', origin: 'كمبوديا', weight: '[الوزن]', age: '[سنوات التعتيق]', openPrice: 5000, currentPrice: 12500, leaderPaddle: 215, leaderUid: 'x', endsAt: Date.now() + 154e3, status: 'live' },
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
export async function onUser(cb) {
  if (DEMO) { demo.subs.add(() => cb(demo.user)); cb(demo.user); return; }
  const { auth, A, db, F } = await init();
  A.onAuthStateChanged(auth, async (u) => {
    if (!u) return cb(null);
    const snap = await F.getDoc(F.doc(db, 'users', u.uid));
    const d = snap.exists() ? snap.data() : {};
    cb({ uid: u.uid, email: u.email, name: d.name || u.displayName || '', phone: d.phone || '', paddle: d.paddle || null, isAdmin: ADMIN_EMAILS.includes(u.email) });
  });
}

export async function signUp({ name, phone, email, password }) {
  if (DEMO) { demo.user = { uid: 'me', name, phone, email, paddle: 42, isAdmin: false }; demoEmit(); return demo.user; }
  const { auth, A, db, F } = await init();
  const cred = await A.createUserWithEmailAndPassword(auth, email, password);
  await A.updateProfile(cred.user, { displayName: name });
  // رقم مزايدة تسلسلي فريد
  await F.runTransaction(db, async (tx) => {
    const cRef = F.doc(db, 'counters', 'paddles');
    const c = await tx.get(cRef);
    const next = c.exists() ? c.data().next : 11;
    tx.set(cRef, { next: next + 1 });
    tx.set(F.doc(db, 'users', cred.user.uid), { name, phone, email, paddle: next, createdAt: F.serverTimestamp() });
  });
  return cred.user;
}

export async function signIn(email, password) {
  if (DEMO) { demo.user = { uid: 'me', name: 'زائر', email, paddle: 42, isAdmin: email.startsWith('admin') }; demoEmit(); return; }
  const { auth, A } = await init();
  await A.signInWithEmailAndPassword(auth, email, password);
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
export async function watchAuction(cb) {
  if (DEMO) { const f = () => cb({ ...demo.auction }); demo.subs.add(f); f(); return () => demo.subs.delete(f); }
  const { db, F } = await init();
  return F.onSnapshot(F.doc(db, 'auctions', 'current'), (s) => cb(s.exists() ? { ...s.data(), startAt: ms(s.data().startAt) } : null));
}

export async function watchLot(id, cb) {
  if (DEMO) { const f = () => cb(demo.lots[id] ? { ...demo.lots[id] } : null); demo.subs.add(f); f(); return () => demo.subs.delete(f); }
  const { db, F } = await init();
  return F.onSnapshot(F.doc(db, 'lots', id), (s) => cb(s.exists() ? { id: s.id, ...s.data(), endsAt: ms(s.data().endsAt) } : null));
}

export async function watchLots(cb) {
  if (DEMO) { const f = () => cb(Object.values(demo.lots).sort((a, b) => a.no - b.no)); demo.subs.add(f); f(); return () => demo.subs.delete(f); }
  const { db, F } = await init();
  return F.onSnapshot(F.query(F.collection(db, 'lots'), F.orderBy('no')), (q) => cb(q.docs.map((d) => ({ id: d.id, ...d.data(), endsAt: ms(d.data().endsAt) }))));
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
