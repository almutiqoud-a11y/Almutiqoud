// الهيدر والفوتر ونافذة الدخول والسلة — مشتركة بين كل الصفحات
import { onUser, signIn, signUp, signOutUser, submitOrder, DEMO, watchSettings, completeProfile } from './db.js';
import { CONTACT } from './firebase-config.js';

export const icons = {
  gavel: '<svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="m14 4 6 6"/><path d="m11 7 6 6"/><path d="m12.5 5.5-5 5 3 3 5-5"/><path d="M9 12 3 18"/><path d="M13 21h8"/></svg>',
  layers: '<svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 8 12 3l9 5-9 5-9-5Z"/><path d="m3 13 9 5 9-5"/><path d="m3 17.5 9 5 9-5"/></svg>',
  bag: '<svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M6 7h12l-1.2 12.2a1 1 0 0 1-1 .8H8.2a1 1 0 0 1-1-.8L6 7Z"/><path d="M9 7a3 3 0 0 1 6 0"/></svg>',
  shield: '<svg aria-hidden="true" width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#C9A45C" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3 4 6v6c0 4.5 3.4 8.2 8 9 4.6-.8 8-4.5 8-9V6l-8-3Z"/><path d="m8.5 12 2.5 2.5 4.5-5"/></svg>',
  smoke: '<svg aria-hidden="true" width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#C9A45C" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21V11"/><path d="M12 11c0-3 2-4 2-6s-2-2-2-2"/><path d="M9 11c0-2 1.2-3 1.2-4.5"/><path d="M6 21h12"/><path d="M8 15h8l-1 6H9l-1-6Z"/></svg>',
  hands: '<svg aria-hidden="true" width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#C9A45C" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><path d="m11 17 2 2a1.4 1.4 0 0 0 2-2"/><path d="m14 14 2.5 2.5a1.4 1.4 0 0 0 2-2L15 11"/><path d="m2 13 6-6 4 1 3-2 7 7-3 3"/><path d="m6 15 3 3a1.4 1.4 0 0 0 2-2"/></svg>',
  x: '<svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg>'
};

export const fmt = (n) => (n == null ? '[السعر]' : Number(n).toLocaleString('en-US'));
export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export function toast(t) {
  const el = document.createElement('div'); el.className = 'toast'; el.textContent = t;
  document.body.appendChild(el); setTimeout(() => el.remove(), 2600);
}

/* ---------- المستخدم ---------- */
export let currentUser = null;
const userSubs = new Set();
export function onCurrentUser(f) { userSubs.add(f); f(currentUser); }
onUser((u) => { currentUser = u; userSubs.forEach((f) => f(u)); renderUserArea(); });

/* ---------- السلة (تُحفظ في المتصفح) ---------- */
const CART_KEY = 'muataq_cart';
export function getCart() { try { return JSON.parse(localStorage.getItem(CART_KEY)) || []; } catch { return []; } }
function saveCart(c) { try { localStorage.setItem(CART_KEY, JSON.stringify(c)); } catch {} renderCartCount(); renderCart(); }
export function addToCart(p) {
  const c = getCart(); const i = c.find((x) => x.id === p.id);
  if (i) i.qty += 1; else c.push({ id: p.id, name: p.name, unit: p.unit, price: p.price ?? null, qty: 1 });
  saveCart(c); toast('أُضيف إلى السلة');
}
function setQty(id, d) { const c = getCart(); const i = c.find((x) => x.id === id); if (!i) return; i.qty += d; saveCart(c.filter((x) => x.qty > 0)); }

/* ---------- الهيدر والفوتر ---------- */
const page = document.body.dataset.page;
const nav = [['index.html', 'home', 'الرئيسية'], ['auction.html', 'auction', 'المزاد المباشر'], ['traders.html', 'traders', 'التجار'], ['wholesale.html', 'wholesale', 'الجملة'], ['retail.html', 'retail', 'القطاعي']];

document.body.insertAdjacentHTML('afterbegin', `
${DEMO ? '<div class="topbar" style="background:#2A1C10;color:#fff">وضع العرض: البيانات تجريبية حتى تُضاف إعدادات Firebase</div>' : ''}
<div class="topbar">مزاد مباشر • أسعار خاصة للتجار والمحلات • طلبات القطاعي لجميع مناطق المملكة</div>
<header class="site-header"><div class="wrap">
  <a class="brand" href="index.html"><img src="mark_gold.png" alt="شعار المعتق للعود"><span><b>المعتق للعود</b><small>رائحة تكتمل بها الفخامة</small></span></a>
  <nav class="main-nav" aria-label="القائمة الرئيسية">${nav.map(([h, k, l]) => `<a href="${h}" class="${page === k ? 'active' : ''}">${k === 'auction' ? '<span class="dot"></span>' : ''}${l}</a>`).join('')}</nav>
  <div class="header-actions">
    <button class="icon-btn" id="cartBtn" aria-label="السلة">${icons.bag}<span class="badge-count hidden" id="cartCount">0</span></button>
    <span id="userArea"></span>
  </div>
</div></header>`);

document.body.insertAdjacentHTML('beforeend', `
<footer class="site-footer" style="border-top:1px solid var(--line);margin-top:64px"><div class="wrap">
  <div class="col" style="flex:1 1 260px"><img src="logo_gold.png" alt="المعتق للعود"><span class="muted">رائحة تكتمل بها الفخامة.</span></div>
  <div class="col"><b>تسوّق</b><a href="auction.html">المزاد المباشر</a><a href="wholesale.html">الجملة</a><a href="retail.html">القطاعي</a></div>
  <div class="col"><b>المساعدة</b><a href="terms.html">شروط المزاد</a><a href="terms.html#shipping">الشحن والاسترجاع</a></div>
  <div class="col"><b>تواصل</b><span id="ftWa">واتساب: ${esc(CONTACT.whatsapp)}</span><span id="ftEm">${esc(CONTACT.email)}</span><span id="ftCr">السجل التجاري: ${esc(CONTACT.cr)}</span></div>
</div><div class="copy">© ${new Date().getFullYear()} المعتق للعود — جميع الحقوق محفوظة</div></footer>`);

function renderUserArea() {
  const el = document.getElementById('userArea'); if (!el) return;
  const u = currentUser;
  if (!u) { el.innerHTML = '<span style="display:flex;gap:8px;align-items:center"><span class="visitor-chip" title="أنت تتصفح كزائر"><svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="8" r="4"/><path d="M4 21c1-4 4-6 8-6s7 2 8 6"/></svg>زائر</span><button class="btn btn-gold btn-sm" id="loginBtn">دخول / تسجيل</button></span>'; el.querySelector('#loginBtn').onclick = () => openAuth(); return; }
  el.innerHTML = `<span style="display:flex;gap:8px;align-items:center">
    ${u.paddle ? `<span class="paddle-chip" title="رقم مزايدتك"><b>${u.paddle}</b>رقمك</span>` : ''}
    <a class="icon-btn" href="messages.html" aria-label="الرسائل" title="الرسائل"><svg aria-hidden="true" width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M4 5h16v11H9l-5 4V5Z"/></svg></a>
    ${u.status === 'pending' ? '<span class="pend-chip" title="حسابك قيد المراجعة">بانتظار الاعتماد</span>' : ''}
    ${u.isAdmin ? '<a class="btn btn-line btn-sm" href="admin.html">التحكم</a>' : ''}
    <button class="btn btn-line btn-sm" id="logoutBtn">خروج</button></span>`;
  el.querySelector('#logoutBtn').onclick = () => signOutUser();
}

/* ---------- نافذة الدخول ---------- */
export const COUNTRIES = ['السعودية', 'الإمارات', 'الكويت', 'قطر', 'البحرين', 'عُمان', 'اليمن', 'العراق', 'الأردن', 'مصر', 'الهند', 'كمبوديا', 'إندونيسيا', 'ماليزيا', 'تايلاند', 'فيتنام', 'لاوس', 'بنغلاديش', 'سريلانكا', 'ميانمار', 'بابوا غينيا الجديدة', 'أخرى'];
const phoneOk = (p) => /^(05\d{8}|\+?\d{9,15})$/.test(String(p || '').replace(/[\s-]/g, ''));

// حقول الهوية التجارية — مشتركة بين التسجيل واستكمال البيانات
function idFields() {
  return `<fieldset class="field" style="border:0;padding:0;margin:0"><legend style="margin-bottom:6px">نوع الحساب</legend>
      <div class="row2"><label class="chip-radio"><input type="radio" name="type" value="individual" checked> فرد — وثيقة العمل الحر</label>
      <label class="chip-radio"><input type="radio" name="type" value="trader"> تاجر — سجل تجاري</label></div></fieldset>
    <label class="field"><span class="docLbl">رقم وثيقة العمل الحر</span><input name="docNo" inputmode="numeric" autocomplete="off"></label>
    <label class="field trOnly hidden">اسم المنشأة<input name="company"></label>
    <div class="row2"><label class="field">الدولة<select name="country">${COUNTRIES.map((c) => `<option>${c}</option>`).join('')}</select></label>
    <label class="field">المدينة<input name="city"></label></div>`;
}
function bindIdFields(f) {
  const sync = () => { const t = f.type.value; f.querySelector('.docLbl').textContent = t === 'trader' ? 'رقم السجل التجاري' : 'رقم وثيقة العمل الحر'; f.querySelectorAll('.trOnly').forEach((e) => e.classList.toggle('hidden', t !== 'trader')); };
  f.querySelectorAll('[name=type]').forEach((r) => (r.onchange = sync)); sync();
}
function idInvalid(d) {
  if (!d.type) return 'اختر نوع الحساب';
  if (!/^[\w\-\/]{5,20}$/.test(String(d.docNo || '').trim())) return d.type === 'trader' ? 'اكتب رقم السجل التجاري' : 'اكتب رقم وثيقة العمل الحر';
  if (d.type === 'trader' && !String(d.company || '').trim()) return 'اكتب اسم المنشأة';
  return '';
}

export function openAuth(mode = 'in') {
  const o = document.createElement('div'); o.className = 'overlay';
  o.innerHTML = `<div class="modal" role="dialog" aria-modal="true" aria-labelledby="authT">
    <button class="icon-btn close" aria-label="إغلاق">${icons.x}</button>
    <h2 id="authT">حسابك في المعتق</h2>
    <div class="tabs2"><button class="chip" data-m="in">دخول</button><button class="chip" data-m="up">حساب جديد</button></div>
    <form class="form" novalidate>
      <label class="field up">الاسم<input name="name" autocomplete="name"></label>
      <label class="field"><span class="idLbl">رقم الجوال</span><input name="phone" type="tel" placeholder="05xxxxxxxx" autocomplete="tel" dir="ltr" style="text-align:right"></label>
      <label class="field">رمز الدخول<input name="password" type="password" minlength="6" placeholder="6 أحرف أو أرقام على الأقل" autocomplete="current-password"></label>
      <div class="msg err hidden"></div>
      <button class="btn btn-gold" type="submit">دخول</button>
      <p class="muted in" style="margin:0;font-size:13px;text-align:center">نسيت رمز الدخول؟ تواصل معنا على واتساب.</p>
      <p class="muted up" style="margin:0;font-size:13px">يُخصص لك رقم مزايدة دائم فور التسجيل.</p>
    </form></div>`;
  document.body.appendChild(o);
  const f = o.querySelector('form'), err = o.querySelector('.msg.err'), sub = f.querySelector('[type=submit]');
  const set = (m) => { mode = m; o.querySelectorAll('.tabs2 .chip').forEach((b) => b.setAttribute('aria-pressed', b.dataset.m === m));
    o.querySelectorAll('.up').forEach((e) => e.classList.toggle('hidden', m !== 'up')); o.querySelectorAll('.in').forEach((e) => e.classList.toggle('hidden', m !== 'in'));
    o.querySelector('.idLbl').textContent = m === 'up' ? 'رقم الجوال' : 'رقم الجوال (أو بريد المدير)';
    f.phone.type = m === 'up' ? 'tel' : 'text';
    sub.textContent = m === 'up' ? 'إنشاء الحساب' : 'دخول'; };
  set(mode);
  o.querySelectorAll('.tabs2 .chip').forEach((b) => (b.onclick = () => set(b.dataset.m)));
  const close = () => o.remove();
  o.querySelector('.close').onclick = close; o.onclick = (e) => { if (e.target === o) close(); };
  f.onsubmit = async (e) => {
    e.preventDefault(); err.classList.add('hidden');
    const d = Object.fromEntries(new FormData(f)); d.phone = String(d.phone || '').trim();
    const isMail = d.phone.includes('@');
    let bad = '';
    if (mode === 'up' && !String(d.name || '').trim()) bad = 'اكتب الاسم';
    else if (!(isMail && mode === 'in') && !phoneOk(d.phone)) bad = 'رقم الجوال غير صحيح';
    else if (!d.password || d.password.length < 6) bad = 'رمز الدخول 6 أحرف أو أرقام على الأقل';
    if (bad) { err.textContent = bad; err.classList.remove('hidden'); return; }
    sub.disabled = true;
    try {
      if (mode === 'up') { await signUp({ name: d.name.trim(), phone: d.phone.replace(/[\s-]/g, ''), password: d.password }); close(); toast('أهلاً بك في المعتق'); }
      else { await signIn(d.phone, d.password); close(); toast('تم الدخول'); }
    } catch (x) { console.error(x); err.textContent = authMsg(x) + (x.code ? ` (${x.code})` : ''); err.classList.remove('hidden'); }
    finally { sub.disabled = false; }
  };
}

// استكمال بيانات الأعضاء القدامى (قبل اشتراط الوثيقة)
var askedProfile = false;
export function openCompleteProfile() {
  if (!currentUser || document.querySelector('.overlay.prof')) return;
  const o = document.createElement('div'); o.className = 'overlay prof';
  o.innerHTML = `<div class="modal" role="dialog" aria-modal="true" aria-labelledby="pfT">
    <button class="icon-btn close" aria-label="إغلاق">${icons.x}</button>
    <h2 id="pfT">استكمل بيانات حسابك</h2>
    <p class="muted" style="margin:0 0 14px">العضوية في المنصة للأفراد بوثيقة العمل الحر وللتجار بالسجل التجاري.</p>
    <form class="form" novalidate>${idFields()}<div class="msg err hidden"></div><button class="btn btn-gold" type="submit">حفظ وإرسال للاعتماد</button></form></div>`;
  document.body.appendChild(o);
  const f = o.querySelector('form'), err = o.querySelector('.msg.err'); bindIdFields(f);
  o.querySelector('.close').onclick = () => o.remove();
  f.onsubmit = async (e) => {
    e.preventDefault(); const d = Object.fromEntries(new FormData(f)); const bad = idInvalid(d);
    if (bad) { err.textContent = bad; err.classList.remove('hidden'); return; }
    try { await completeProfile(currentUser.uid, { type: d.type, docNo: d.docNo.trim(), company: d.company || '', country: d.country, city: d.city || '' }); o.remove(); toast('أُرسلت بياناتك للاعتماد'); }
    catch (x) { err.textContent = 'تعذّر الحفظ، حاول مرة أخرى'; err.classList.remove('hidden'); console.error(x); }
  };
}
function authMsg(x) {
  const c = x.code || '';
  if (c.includes('email-already')) return 'هذا الرقم مسجل مسبقاً — جرّب الدخول';
  if (c.includes('invalid-credential') || c.includes('wrong-password') || c.includes('user-not-found')) return 'رقم الجوال أو رمز الدخول غير صحيح';
  if (c.includes('weak-password')) return 'رمز الدخول ضعيف';
  if (c === 'timeout' || c.includes('network')) return 'الاتصال بطيء أو مقطوع — تأكد من الإنترنت وحاول مرة أخرى';
  if (c.includes('too-many-requests')) return 'محاولات كثيرة — انتظر دقيقة ثم حاول';
  if (c.includes('invalid-email')) return 'البريد أو الرقم غير صحيح';
  return x.message || 'حدث خطأ، حاول مرة أخرى';
}

/* ---------- السلة ---------- */
let drawer = null;
function renderCartCount() {
  const n = getCart().reduce((a, b) => a + b.qty, 0); const el = document.getElementById('cartCount');
  if (el) { el.textContent = n; el.classList.toggle('hidden', !n); }
}
function renderCart() {
  if (!drawer) return;
  const c = getCart(); const box = drawer.querySelector('.items');
  const known = c.every((i) => i.price != null);
  const total = c.reduce((a, i) => a + (i.price || 0) * i.qty, 0);
  box.innerHTML = c.length ? c.map((i) => `<div class="cart-item"><div><b>${esc(i.name)}</b><div class="muted" style="font-size:14px">${fmt(i.price)} ${i.price != null ? 'ريال' : ''} ${esc(i.unit)}</div></div>
    <div class="qty"><button aria-label="إنقاص" data-d="-1" data-id="${i.id}">−</button><span>${i.qty}</span><button aria-label="زيادة" data-d="1" data-id="${i.id}">+</button></div></div>`).join('') : '<p class="muted">السلة فارغة.</p>';
  box.querySelectorAll('button[data-id]').forEach((b) => (b.onclick = () => setQty(b.dataset.id, +b.dataset.d)));
  drawer.querySelector('.total').textContent = known ? fmt(total) + ' ريال' : 'يُحدَّد عند التأكيد';
  drawer.querySelector('.checkout').classList.toggle('hidden', !c.length);
}
function openCart() {
  if (drawer) return;
  const o = document.createElement('div'); o.className = 'overlay'; o.style.justifyContent = 'flex-start';
  o.innerHTML = `<aside class="drawer" role="dialog" aria-modal="true" aria-label="السلة">
    <header><h2 style="font-size:24px;color:var(--gold-dark)">السلة</h2><button class="icon-btn" aria-label="إغلاق">${icons.x}</button></header>
    <div class="items"></div>
    <footer><div style="display:flex;justify-content:space-between"><span class="muted">الإجمالي</span><b class="total"></b></div>
      <form class="form checkout">
        <div class="row2"><label class="field">الاسم<input name="name" required></label><label class="field">الجوال<input name="phone" type="tel" required placeholder="05xxxxxxxx"></label></div>
        <div class="row2"><label class="field">المدينة<input name="city" required></label><label class="field">الحي / العنوان<input name="address" required></label></div>
        <div class="msg err hidden"></div>
        <button class="btn btn-gold" type="submit">تأكيد الطلب</button>
      </form></footer></aside>`;
  document.body.appendChild(o); drawer = o;
  const close = () => { o.remove(); drawer = null; };
  o.querySelector('header .icon-btn').onclick = close; o.onclick = (e) => { if (e.target === o) close(); };
  const f = o.querySelector('.checkout');
  if (currentUser) { f.name.value = currentUser.name || ''; f.phone.value = currentUser.phone || ''; }
  f.onsubmit = async (e) => {
    e.preventDefault(); const d = Object.fromEntries(new FormData(f)); const er = f.querySelector('.msg');
    if (!d.name || !/^05\d{8}$/.test(d.phone) || !d.city || !d.address) { er.textContent = 'أكمل البيانات (الجوال بصيغة 05xxxxxxxx)'; er.classList.remove('hidden'); return; }
    f.querySelector('[type=submit]').disabled = true;
    try {
      const id = await submitOrder({ ...d, uid: currentUser?.uid || null, items: getCart() });
      saveCart([]); close(); toast('تم استلام طلبك رقم ' + id.slice(0, 8) + ' وسنتواصل معك');
    } catch (x) { er.textContent = 'تعذّر إرسال الطلب، حاول مرة أخرى'; er.classList.remove('hidden'); f.querySelector('[type=submit]').disabled = false; }
  };
  renderCart();
}
document.getElementById('cartBtn').onclick = openCart;
watchSettings((c) => {
  const set = (id, t) => { const e = document.getElementById(id); if (e) e.textContent = t; };
  set('ftWa', 'واتساب: ' + (c.whatsapp || '')); set('ftEm', c.email || ''); set('ftCr', 'السجل التجاري: ' + (c.cr || ''));
});
renderCartCount(); renderUserArea();

// تصغير صورة من الجهاز إلى JPEG خفيف (للإيصالات وصور المنتجات)
export function shrinkImage(file, max = 1000, q = 0.72) {
  return new Promise((res, rej) => {
    const img = new Image(); const url = URL.createObjectURL(file);
    img.onload = () => { const s = Math.min(1, max / Math.max(img.width, img.height)); const c = document.createElement('canvas');
      c.width = Math.round(img.width * s); c.height = Math.round(img.height * s); c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url); let d = c.toDataURL('image/jpeg', q); if (d.length > 700000) d = c.toDataURL('image/jpeg', 0.5); res(d); };
    img.onerror = () => rej(new Error('تعذّر قراءة الصورة')); img.src = url;
  });
}
