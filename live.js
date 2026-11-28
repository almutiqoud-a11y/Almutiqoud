// البث المباشر للمزاد عبر Agora — المدير يبث من لوحة التحكم، والجميع يشاهد في الرئيسية وداخل القاعة
import { DEMO, hallOf, admin, HALLS } from './db.js';

const SDK = 'https://download.agora.io/sdk/release/AgoraRTC_N-4.22.2.js';
const CHANNEL = 'almutiqoud-live';
let sdkP = null;
function loadSDK() {
  if (window.AgoraRTC) return Promise.resolve(window.AgoraRTC);
  if (!sdkP) sdkP = new Promise((res, rej) => {
    const s = document.createElement('script'); s.src = SDK; s.async = true;
    s.onload = () => { try { window.AgoraRTC.setLogLevel(3); } catch {} res(window.AgoraRTC); };
    s.onerror = () => { sdkP = null; rej(new Error('sdk')); };
    document.head.appendChild(s);
  });
  return sdkP;
}

/* -------- حالة البث (مستند settings/live في Firestore) -------- */
let demoLive = { on: false };
const demoSubs = new Set();
export async function watchLive(cb) {
  if (DEMO) { const f = () => cb({ ...demoLive }); demoSubs.add(f); f(); return () => demoSubs.delete(f); }
  const { db, F } = await admin();
  return F.onSnapshot(F.doc(db, 'settings', 'live'), (s) => cb(s.exists() ? s.data() : { on: false }), () => cb({ on: false }));
}
async function setLive(data) {
  if (DEMO) { demoLive = { ...demoLive, ...data }; demoSubs.forEach((f) => f()); return; }
  const { db, F } = await admin();
  await F.setDoc(F.doc(db, 'settings', 'live'), { ...data, updatedAt: F.serverTimestamp() }, { merge: true });
}
// رموز الدخول تأتي من خدمة Cloudflare (الشهادة السرية محفوظة هناك وليست في الموقع)
const TOKEN_URL = 'https://agora-token.almutiqoud.workers.dev/token';
async function getToken(role) {
  const uid = Math.floor(Math.random() * 2e9) + 1000;
  const headers = {};
  if (role === 'host') {
    const fb = await admin(); const u = fb?.auth?.currentUser;
    if (!u) throw Object.assign(new Error('signin'), { code: 'signin' });
    headers.authorization = 'Bearer ' + (await u.getIdToken());
  }
  const r = await fetch(`${TOKEN_URL}?app=almutiqoud&channel=${CHANNEL}&uid=${uid}&role=${role}`, { headers });
  const d = await r.json().catch(() => ({}));
  if (!r.ok || !d.token) throw Object.assign(new Error(d.error || 'token'), { code: r.status === 403 ? 'notapproved' : r.status === 401 ? 'signin' : 'token' });
  return { appId: d.appId, token: d.token, uid };
}

const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

/* -------- المشاهد -------- */
// يركّب مشغّل البث داخل box ويظهره فقط وقت البث
export function mountViewer(box, { hall = null, compact = false } = {}) {
  let client = null, joined = false, audio = null, state = { on: false };
  box.classList.add('live-box', 'hidden');
  box.innerHTML = `<div class="live-head"><span class="live-dot"><i></i>بث مباشر</span><b class="live-title"></b><span class="live-hall"></span></div>
    <div class="live-stage"><div class="live-video"></div><div class="live-wait">جارِ الاتصال بالبث…</div>
    <button type="button" class="live-sound hidden">🔊 اضغط لتشغيل الصوت</button></div>
    ${compact ? '' : '<div class="live-foot"><a class="btn btn-gold btn-sm live-enter" href="#">ادخل القاعة وزايد</a></div>'}`;
  const vid = box.querySelector('.live-video'), wait = box.querySelector('.live-wait'), snd = box.querySelector('.live-sound');
  snd.onclick = () => { try { audio && audio.play(); snd.classList.add('hidden'); } catch {} };

  async function join() {
    if (joined) return; joined = true;
    if (DEMO) { wait.textContent = 'وضع العرض: يظهر هنا بث الكاميرا عند تشغيله من لوحة التحكم'; return; }
    try {
      const [A, tk] = await Promise.all([loadSDK(), getToken('audience')]);
      client = A.createClient({ mode: 'live', codec: 'vp8' });
      await client.setClientRole('audience', { level: 1 });
      client.on('user-published', async (u, type) => {
        await client.subscribe(u, type);
        if (type === 'video') { wait.classList.add('hidden'); u.videoTrack.play(vid, { fit: 'contain' }); }
        if (type === 'audio') { audio = u.audioTrack; try { audio.play(); } catch {} snd.classList.remove('hidden'); }
      });
      client.on('user-unpublished', (u, type) => { if (type === 'video') { wait.classList.remove('hidden'); wait.textContent = 'توقف البث مؤقتاً…'; } });
      await client.join(tk.appId, CHANNEL, tk.token, tk.uid);
      wait.textContent = 'بانتظار صورة البث…';
    } catch (e) { console.warn('live', e); wait.textContent = 'تعذّر تشغيل البث — حدّث الصفحة'; joined = false; }
  }
  async function leave() {
    if (!joined) return; joined = false;
    try { await client?.leave(); } catch {} client = null; audio = null;
    vid.innerHTML = ''; wait.classList.remove('hidden'); wait.textContent = 'جارِ الاتصال بالبث…'; snd.classList.add('hidden');
  }
  watchLive((l) => {
    state = l; const show = !!l.on && (!hall || !l.hall || l.hall === hall);
    box.classList.toggle('hidden', !show);
    if (!show) { leave(); return; }
    box.querySelector('.live-title').textContent = (l.title || 'مزاد المعتق للعود') + (l.hostName && l.hostUid !== 'admin' ? ' — ' + l.hostName : '');
    box.querySelector('.live-hall').textContent = l.hall ? hallOf(l.hall).name : '';
    const a = box.querySelector('.live-enter'); if (a) a.href = 'auction.html?hall=' + (l.hall || 'riyadh');
    join();
  });
}

/* -------- المذيع (لوحة التحكم) -------- */
export function mountBroadcaster(box, { hall, host = null, title = '', onEnd = null }) {
  // host = { uid, name } عند بث التاجر (بعد موافقة الإدارة)
  let client = null, cam = null, mic = null, facing = 'environment', live = false;
  const hostInfo = host ? { hostUid: host.uid, hostName: host.name || '' } : { hostUid: 'admin', hostName: 'المعتق للعود' };
  box.innerHTML = `<h3 style="margin-bottom:6px">البث المباشر — <span class="gold">${hallOf(hall).name}</span></h3>
    <p class="muted" style="margin:0 0 10px;font-size:13px">يظهر البث في الصفحة الرئيسية وداخل القاعة لكل التجار والعملاء. أبقِ هذه الصفحة مفتوحة طوال البث.</p>
    <label class="field">عنوان البث<input id="lvTitle" placeholder="مثال: مزاد عود كمبودي فاخر" maxlength="60" value="${esc(title)}"></label>
    <div class="live-stage" style="margin:10px 0"><div class="live-video" id="lvPrev"></div><div class="live-wait" id="lvWait">المعاينة تظهر هنا بعد بدء البث</div></div>
    <div style="display:flex;gap:8px;flex-wrap:wrap">
      <button type="button" class="btn btn-gold" id="lvGo">● ابدأ البث</button>
      <button type="button" class="btn btn-line hidden" id="lvFlip">🔄 تبديل الكاميرا</button>
      <button type="button" class="btn btn-line hidden" id="lvMic">🎙️ كتم الصوت</button>
    </div>
    <p class="msg hidden" id="lvMsg" role="alert"></p>`;
  const $ = (id) => box.querySelector('#' + id);
  if (host) box.querySelector('h3 .gold').textContent = hallOf(hall).name + ' — ' + (host.name || '');
  const msg = (t, ok) => { const m = $('lvMsg'); m.textContent = t; m.className = 'msg ' + (ok ? 'ok' : 'err'); };
  watchLive((l) => {
    if (!live && l.on) msg(host ? 'يوجد بث آخر شغّال الآن — انتظر انتهاءه' : `يوجد بث شغّال الآن في ${hallOf(l.hall).name}${l.hostName ? ' (' + l.hostName + ')' : ''}. بدء بث جديد يوقفه.`, false);
    // أوقفت الإدارة البث أو بدأ غيرك بثاً
    if (live && (!l.on || (l.hostUid && l.hostUid !== hostInfo.hostUid))) { stop(true); msg('أُوقف البث من الإدارة', false); }
  });

  async function start() {
    const b = $('lvGo'); b.disabled = true; b.textContent = 'جارِ التشغيل…';
    try {
      if (DEMO) {
        live = true; await setLive({ on: true, hall, title: $('lvTitle').value.trim(), ...hostInfo });
        $('lvWait').textContent = 'وضع العرض: البث الحقيقي يعمل على الموقع المنشور';
      } else {
        const [A, tk] = await Promise.all([loadSDK(), getToken('host')]);
        client = A.createClient({ mode: 'live', codec: 'vp8' });
        await client.setClientRole('host');
        await client.join(tk.appId, CHANNEL, tk.token, tk.uid);
        [mic, cam] = await A.createMicrophoneAndCameraTracks({ AEC: true, ANS: true }, { encoderConfig: '720p_1', facingMode: facing });
        cam.play($('lvPrev'), { fit: 'contain', mirror: facing === 'user' }); $('lvWait').classList.add('hidden');
        await client.publish([mic, cam]);
        live = true; await setLive({ on: true, hall, title: $('lvTitle').value.trim(), startedAt: Date.now(), ...hostInfo });
      }
      b.textContent = '■ إيقاف البث'; b.classList.replace('btn-gold', 'btn-line'); b.style.color = '#B3261E'; b.style.borderColor = '#B3261E';
      $('lvFlip').classList.toggle('hidden', DEMO); $('lvMic').classList.toggle('hidden', DEMO);
      msg('البث شغّال الآن — يشاهده الجميع في الرئيسية وداخل ' + hallOf(hall).name, true);
    } catch (e) {
      console.error(e); if (live) { try { await setLive({ on: false, ...hostInfo }); } catch {} } await stop(true);
      msg(e.code === 'signin' ? 'سجّل الدخول أولاً ثم حاول مرة أخرى' : e.code === 'notapproved' ? 'البث يحتاج موافقة الإدارة أولاً' : e.code === 'token' ? 'خدمة البث غير جاهزة بعد — تواصل مع الإدارة'
        : /PERMISSION|NotAllowed/i.test(String(e.name || e.code || e.message)) ? 'اسمح للمتصفح باستخدام الكاميرا والميكروفون ثم حاول مرة أخرى'
        : 'تعذّر بدء البث: ' + (e.code || e.message || e), false);
    } finally { b.disabled = false; if (!live) b.textContent = '● ابدأ البث'; }
  }
  async function stop(silent) {
    try { cam?.close(); mic?.close(); } catch {} cam = mic = null;
    try { await client?.leave(); } catch {} client = null;
    const wasLive = live; live = false;
    $('lvPrev').innerHTML = ''; $('lvWait').classList.remove('hidden'); $('lvWait').textContent = 'المعاينة تظهر هنا بعد بدء البث';
    const b = $('lvGo'); b.textContent = '● ابدأ البث'; b.classList.replace('btn-line', 'btn-gold'); b.style.color = ''; b.style.borderColor = '';
    $('lvFlip').classList.add('hidden'); $('lvMic').classList.add('hidden');
    if (wasLive && !silent) { try { await setLive({ on: false, hostUid: hostInfo.hostUid, hostName: hostInfo.hostName }); } catch {} }
    if (!silent) { msg('تم إيقاف البث', true); if (wasLive && onEnd) onEnd(); }
  }
  $('lvGo').onclick = () => (live ? stop(false) : start());
  $('lvMic').onclick = async () => { if (!mic) return; const m = !mic.muted; await mic.setMuted(m); $('lvMic').textContent = m ? '🎙️ تشغيل الصوت' : '🎙️ كتم الصوت'; };
  $('lvFlip').onclick = async () => {
    if (!cam) return; facing = facing === 'user' ? 'environment' : 'user';
    try {
      const A = await loadSDK(); const devs = await A.getCameras();
      const want = devs.find((d) => (facing === 'user' ? /front|أمام|user/i : /back|rear|خلف|environment/i).test(d.label));
      if (want) await cam.setDevice(want.deviceId); else await cam.setDevice({ facingMode: facing });
    } catch (e) { console.warn(e); }
  };
  // إيقاف البث عند إغلاق الصفحة
  window.addEventListener('pagehide', () => { if (live) { setLive({ on: false, ...hostInfo }); } });
}

/* -------- طلبات البث من التجار (موافقة الإدارة) -------- */
// المستند liveRequests/{uid}: status = pending | approved | rejected | used
const demoReq = {}; const reqSubs = new Set();
const reqEmit = () => reqSubs.forEach((f) => f());
export async function requestLive(user, { hall, title, when }) {
  const d = { uid: user.uid, name: user.company || user.name || '', paddle: user.paddle || null, hall: hallOf(hall).id, title: String(title || '').slice(0, 60), when: String(when || '').slice(0, 60), status: 'pending' };
  if (DEMO) { demoReq[user.uid] = { ...d, createdAt: Date.now() }; reqEmit(); return; }
  const { db, F } = await admin();
  await F.setDoc(F.doc(db, 'liveRequests', user.uid), { ...d, createdAt: F.serverTimestamp() });
}
export async function watchMyLiveReq(uid, cb) {
  if (DEMO) { const f = () => cb(demoReq[uid] || null); reqSubs.add(f); f(); return () => reqSubs.delete(f); }
  const { db, F } = await admin();
  return F.onSnapshot(F.doc(db, 'liveRequests', uid), (s) => cb(s.exists() ? s.data() : null), () => cb(null));
}
export async function markLiveUsed(uid) {
  if (DEMO) { if (demoReq[uid]) demoReq[uid].status = 'used'; reqEmit(); return; }
  const { db, F } = await admin();
  await F.updateDoc(F.doc(db, 'liveRequests', uid), { status: 'used' });
}
export async function watchLiveRequests(cb) {
  if (DEMO) { const f = () => cb(Object.values(demoReq)); reqSubs.add(f); f(); return () => reqSubs.delete(f); }
  const { db, F } = await admin();
  return F.onSnapshot(F.collection(db, 'liveRequests'), (q) => cb(q.docs.map((d) => ({ id: d.id, ...d.data() }))), () => cb([]));
}
export async function decideLive(uid, status) {
  if (DEMO) { if (demoReq[uid]) demoReq[uid].status = status; reqEmit(); return; }
  const { db, F } = await admin();
  await F.updateDoc(F.doc(db, 'liveRequests', uid), { status, decidedAt: F.serverTimestamp() });
}
export async function stopAnyLive() { await setLive({ on: false }); }

// لوحة التاجر: طلب بث ← انتظار الموافقة ← البث من الجوال
export function mountTraderLive(box, user) {
  let bc = false;
  watchMyLiveReq(user.uid, (r) => {
    const st = r?.status;
    if (st === 'approved') {
      if (bc) return; bc = true;
      box.innerHTML = '<p class="msg ok" style="margin:0 0 10px">وافقت الإدارة على طلب البث ✓ — اضغط «ابدأ البث» عندما تكون جاهزاً.</p><div id="trBc"></div>';
      mountBroadcaster(box.querySelector('#trBc'), { hall: r.hall, title: r.title, host: { uid: user.uid, name: r.name }, onEnd: () => markLiveUsed(user.uid).catch(() => {}) });
      return;
    }
    bc = false;
    const note = st === 'pending' ? '<p class="msg" style="margin:0 0 10px;background:#FBF6EC;color:#7A5A1E">طلبك بانتظار موافقة الإدارة… ستظهر لك أزرار البث هنا فور الموافقة.</p>'
      : st === 'rejected' ? '<p class="msg err" style="margin:0 0 10px">لم تتم الموافقة على طلبك السابق. يمكنك إرسال طلب جديد.</p>'
      : st === 'used' ? '<p class="msg ok" style="margin:0 0 10px">انتهى بثك السابق. لبث جديد أرسل طلباً آخر.</p>' : '';
    box.innerHTML = `<h3 style="margin-bottom:6px">البث المباشر لمزادك</h3>
      <p class="muted" style="margin:0 0 10px;font-size:13px">اعرض منتجاتك بالصوت والصورة من جوالك. يظهر بثك في الرئيسية وداخل القاعة بعد موافقة الإدارة.</p>${note}
      ${st === 'pending' ? '<button type="button" class="btn btn-line btn-sm" id="lrCancel">إلغاء الطلب</button>' : `<form class="form" id="lrF">
        <label class="field">القاعة<select name="hall">${HALLS.map((h) => `<option value="${h.id}">${h.name}</option>`).join('')}</select></label>
        <label class="field">عنوان البث<input name="title" required maxlength="60" placeholder="مثال: عرض دهن عود هندي معتّق"></label>
        <label class="field">الموعد المقترح<input name="when" maxlength="60" placeholder="مثال: الليلة 9 مساءً"></label>
        <button class="btn btn-gold">أرسل طلب البث للإدارة</button><p class="msg hidden" id="lrMsg"></p></form>`}`;
    const f = box.querySelector('#lrF');
    if (f) f.onsubmit = async (e) => { e.preventDefault(); const b = f.querySelector('button'); b.disabled = true;
      try { await requestLive(user, { hall: f.hall.value, title: f.title.value, when: f.when.value }); }
      catch (x) { console.error(x); const m = f.querySelector('#lrMsg'); m.className = 'msg err'; m.textContent = 'تعذّر إرسال الطلب، حاول مرة أخرى'; b.disabled = false; } };
    const c = box.querySelector('#lrCancel');
    if (c) c.onclick = async () => { try { if (DEMO) { delete demoReq[user.uid]; reqEmit(); } else { const { db, F } = await admin(); await F.deleteDoc(F.doc(db, 'liveRequests', user.uid)); } } catch (x) { console.error(x); } };
  });
}

// لوحة المدير: قائمة طلبات البث + إيقاف أي بث
export function mountLiveRequests(box) {
  let cur = { on: false };
  const draw = (rs) => {
    const list = rs.filter((r) => r.status === 'pending' || r.status === 'approved').sort((a, b) => (a.status === 'pending' ? -1 : 1));
    box.innerHTML = `<h3 style="margin-bottom:8px">طلبات البث من التجار</h3>
      ${cur.on && cur.hostUid && cur.hostUid !== 'admin' ? `<p class="msg" style="margin:0 0 10px;background:#FDECEA;color:#8A1F17">● يبث الآن: <b>${esc(cur.hostName)}</b> في ${hallOf(cur.hall).name} <button type="button" class="btn btn-line btn-sm" id="lvKill" style="margin-inline-start:8px;color:#B3261E;border-color:#B3261E">■ إيقاف بثه</button></p>` : ''}
      ${list.length ? `<div class="table-box"><table><thead><tr><th>التاجر</th><th>القاعة</th><th>العنوان</th><th>الموعد</th><th>الحالة</th><th></th></tr></thead><tbody>${list.map((r) => `<tr>
        <td>${esc(r.name)}${r.paddle ? `<div class="muted" style="font-size:12px">مضرب ${esc(r.paddle)}</div>` : ''}</td><td>${hallOf(r.hall).name}</td><td>${esc(r.title)}</td><td>${esc(r.when || '—')}</td>
        <td><span class="st">${r.status === 'pending' ? 'بانتظار الموافقة' : 'موافق عليه'}</span></td>
        <td style="white-space:nowrap">${r.status === 'pending' ? `<button type="button" class="btn btn-gold btn-sm" data-lv="approved" data-u="${esc(r.id || r.uid)}">موافقة</button> <button type="button" class="btn btn-line btn-sm" data-lv="rejected" data-u="${esc(r.id || r.uid)}">رفض</button>` : `<button type="button" class="btn btn-line btn-sm" data-lv="rejected" data-u="${esc(r.id || r.uid)}">إلغاء الموافقة</button>`}</td></tr>`).join('')}</tbody></table></div>`
      : '<p class="muted" style="margin:0">لا توجد طلبات بث جديدة.</p>'}`;
    const k = box.querySelector('#lvKill'); if (k) k.onclick = () => stopAnyLive();
  };
  let rs = [];
  watchLiveRequests((x) => { rs = x; draw(rs); });
  watchLive((l) => { cur = l; draw(rs); });
  box.addEventListener('click', async (e) => { const b = e.target.closest('[data-lv]'); if (!b) return; b.disabled = true; try { await decideLive(b.dataset.u, b.dataset.lv); } catch (x) { console.error(x); b.disabled = false; } });
}
