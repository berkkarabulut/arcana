// Kulis veritabanı katmanı: Firebase Auth + Firestore
// Site (index.html) bu dosyadaki window.KDB fonksiyonlarıyla gerçek veriye ulaşır.
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.8.0/firebase-app.js";
import {
  initializeAuth, indexedDBLocalPersistence, browserLocalPersistence, browserPopupRedirectResolver, onAuthStateChanged, signInAnonymously, GoogleAuthProvider, signInWithPopup,
  sendSignInLinkToEmail, isSignInWithEmailLink, signInWithEmailLink, signOut, linkWithPopup,
  deleteUser, reauthenticateWithPopup
} from "https://www.gstatic.com/firebasejs/12.8.0/firebase-auth.js";
import {
  initializeFirestore, persistentLocalCache, persistentMultipleTabManager,
  doc, getDoc, setDoc, addDoc, updateDoc, deleteDoc, collection, query, where, orderBy, limit,
  onSnapshot, serverTimestamp, increment, writeBatch, getDocs, deleteField
} from "https://www.gstatic.com/firebasejs/12.8.0/firebase-firestore.js";
// Açılışta gerekmeyen Firebase parçaları (bildirim, sunucu fonksiyonları, dosya yükleme) ilk kullanıldıklarında indirilir
const gecYukle = u => { let p; return () => p || (p = import(u)); };
const fbMsg = gecYukle("https://www.gstatic.com/firebasejs/12.8.0/firebase-messaging.js");
const fbFns = gecYukle("https://www.gstatic.com/firebasejs/12.8.0/firebase-functions.js");
const fbSt = gecYukle("https://www.gstatic.com/firebasejs/12.8.0/firebase-storage.js");
let fnsInst = null;
// sunucu fonksiyonunu çağır (europe-west1)
const callFn = async (name, data) => { const m = await fbFns(); if (!fnsInst) fnsInst = m.getFunctions(app, "europe-west1"); return m.httpsCallable(fnsInst, name)(data); };

// /beta/ adresi ayrı test veritabanını kullanır; canlı kullanıcıların verisine dokunmaz
const IS_TEST = /\/beta\//.test(location.pathname);
const app = initializeApp(IS_TEST ? {
  apiKey: "AIzaSyBSjtqmNe7zLRyAkqLBP_ksoeuXXvKKkLQ",
  authDomain: "kulis-test.firebaseapp.com",
  projectId: "kulis-test",
  storageBucket: "kulis-test.firebasestorage.app",
  messagingSenderId: "631677972627",
  appId: "1:631677972627:web:d65bd63a3b9f4c5c509d66"
} : {
  apiKey: "AIzaSyDA7rTiYY8NZHbnXAoUt7u0LiWyXlPolDg",
  authDomain: "kulis-1647d.firebaseapp.com",
  projectId: "kulis-1647d",
  storageBucket: "kulis-1647d.firebasestorage.app",
  messagingSenderId: "165708007413",
  appId: "1:165708007413:web:7dd69b4ef7c40f01fb82bc"
});
// Google giriş penceresi altyapısı (~130 KB) açılışta değil, sadece "Google ile giriş"e basınca yüklensin
const auth = initializeAuth(app, { persistence: [indexedDBLocalPersistence, browserLocalPersistence] });
auth.languageCode = "tr";
let db;
// Reklam engelleyici, antivirüs ya da kurumsal ağ normal bağlantıyı bozarsa site "uzun sorgu" moduna geçer (kulis_lp)
const LP = (() => { try { return localStorage.getItem("kulis_lp") === "1"; } catch (e) { return false; } })();
const fsOpts = LP ? { experimentalForceLongPolling: true } : {};
try { db = initializeFirestore(app, { ...fsOpts, localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }) }); }
catch (e) { db = initializeFirestore(app, fsOpts); }

const VAPID = "BPuLRxoQfvz2-ml5JWzJFQd9qrKd-q7bXD-gtYbJOeg0gqxuoVL7MyQbZrEaXHOnaN9N_kK7d10PE4NDakgDcdo";
const ms = t => (t && t.toMillis) ? t.toMillis() : (typeof t === "number" ? t : Date.now());
const chatId = (a, b) => a < b ? a + "_" + b : b + "_" + a;
const unsubs = {};
function stop(key) { if (unsubs[key]) { unsubs[key](); delete unsubs[key]; } }
function stopAll() { Object.keys(unsubs).forEach(stop); }
// Hız sınırı damgası: sunucu kuralları her itiraf/yorum/mesajla birlikte bu belgenin güncellenmesini ister
const rlRef = () => doc(db, "users", auth.currentUser.uid, "meta", "rl");
const stamp = (b, ...keys) => b.set(rlRef(), Object.fromEntries(keys.map(k => [k, serverTimestamp()])), { merge: true });

const KDB = {
  ready: true,
  isTest: IS_TEST,
  get uid() { return auth.currentUser ? auth.currentUser.uid : null; },
  get user() { return auth.currentUser; },

  // ---------- Giriş ----------
  onAuth(cb) { return onAuthStateChanged(auth, cb); },
  async google() {
    const p = new GoogleAuthProvider(); p.setCustomParameters({ prompt: "select_account" });
    if (auth.currentUser && auth.currentUser.isAnonymous) {
      try { return (await linkWithPopup(auth.currentUser, p, browserPopupRedirectResolver)).user; } catch (e) { /* hesap zaten varsa normal giriş */ }
    }
    return (await signInWithPopup(auth, p, browserPopupRedirectResolver)).user;
  },
  async anon() { return (await signInAnonymously(auth)).user; },
  get email() { return (auth.currentUser && auth.currentUser.email) || ""; },
  async sendLink(email) {
    const url = location.origin + location.pathname;
    await sendSignInLinkToEmail(auth, email, { url, handleCodeInApp: true });
    localStorage.setItem("kulis_mail", email);
  },
  isLink() { return isSignInWithEmailLink(auth, location.href); },
  async finishLink(emailFallback) {
    const email = localStorage.getItem("kulis_mail") || emailFallback;
    if (!email) throw new Error("no-email");
    const r = await signInWithEmailLink(auth, email, location.href);
    localStorage.removeItem("kulis_mail");
    history.replaceState(null, "", location.pathname);
    return r.user;
  },
  async signOut() { stopAll(); await signOut(auth); },

  // ---------- Profil ----------
  async getProfile(uid) {
    const s = await Promise.race([getDoc(doc(db, "users", uid)), new Promise((_, rej) => setTimeout(() => rej(Object.assign(new Error("zaman aşımı"), { code: "timeout" })), 9000))]);
    return s.exists() ? { id: s.id, ...s.data() } : null;
  },
  longPolling: LP,
  // Yedek yol: profili Firestore'un düz REST adresinden oku (SDK bağlantısı engellendiğinde teşhis için)
  async profileExistsREST(uid) {
    const t = await auth.currentUser.getIdToken();
    const r = await fetch(`https://firestore.googleapis.com/v1/projects/kulis-1647d/databases/(default)/documents/users/${uid}?mask.fieldPaths=n`, { headers: { Authorization: "Bearer " + t } });
    if (r.status === 404) return false;
    if (!r.ok) throw Object.assign(new Error("rest " + r.status), { code: "rest-" + r.status });
    return true;
  },
  async nickFree(n) { const s = await getDoc(doc(db, "nicks", n.toLocaleLowerCase("tr"))); return !s.exists() || s.data().uid === KDB.uid; },
  async createProfile(pub, priv) {
    const uid = KDB.uid, b = writeBatch(db);
    b.set(doc(db, "users", uid), { ...pub, createdAt: serverTimestamp(), lastSeen: serverTimestamp() });
    b.set(doc(db, "users", uid, "private", "info"), priv);
    b.set(doc(db, "nicks", pub.n.toLocaleLowerCase("tr")), { uid });
    await b.commit();
  },
  async updateProfile(fields, oldNick) {
    const uid = KDB.uid, b = writeBatch(db);
    b.update(doc(db, "users", uid), fields);
    if (fields.n && oldNick && fields.n.toLocaleLowerCase("tr") !== oldNick.toLocaleLowerCase("tr")) {
      b.set(doc(db, "nicks", fields.n.toLocaleLowerCase("tr")), { uid });
      b.delete(doc(db, "nicks", oldNick.toLocaleLowerCase("tr")));
    }
    await b.commit();
  },
  async getPrivate() { const s = await getDoc(doc(db, "users", KDB.uid, "private", "info")); return s.exists() ? s.data() : null; },
  listenUsers(cb) {
    stop("users");
    unsubs.users = onSnapshot(query(collection(db, "users"), orderBy("createdAt", "desc"), limit(200)),
      s => cb(s.docs.map(d => { const x = d.data(); return { id: d.id, ...x, createdAt: x.createdAt ? ms(x.createdAt) : 0, lastSeen: x.lastSeen ? ms(x.lastSeen) : 0 }; })), e => console.warn("users", e));
  },
  // Hesabı ve kullanıcının bütün verisini sil (Google Play hesap silme zorunluluğu)
  async deleteEverything() {
    const uid = KDB.uid; if (!uid) return;
    stopAll();
    const wipe = async q => { const s = await getDocs(q).catch(() => null); if (s) for (const d of s.docs) await deleteDoc(d.ref).catch(() => {}); };
    await wipe(query(collection(db, "posts"), where("uid", "==", uid)));
    const an = await getDocs(collection(db, "users", uid, "anon")).catch(() => null);
    if (an) for (const d of an.docs) { await deleteDoc(doc(db, "posts", d.id)).catch(() => {}); await deleteDoc(d.ref).catch(() => {}); }
    await wipe(collection(db, "users", uid, "push"));
    await wipe(query(collection(db, "likes"), where("from", "==", uid)));
    await wipe(query(collection(db, "chats"), where("members", "array-contains", uid)));
    await wipe(collection(db, "users", uid, "notifs"));
    await wipe(collection(db, "users", uid, "blocks"));
    await deleteDoc(doc(db, "users", uid, "settings", "main")).catch(() => {});
    await deleteDoc(doc(db, "users", uid, "gizli", "foto")).catch(() => {});
    await wipe(query(collection(db, "perde"), where("members", "array-contains", uid)));
    await KDB.deleteAccount();
    const u = auth.currentUser;
    try { await deleteUser(u); }
    catch (e) {
      if (e.code === "auth/requires-recent-login" && u.providerData.some(p => p.providerId === "google.com")) {
        await reauthenticateWithPopup(u, new GoogleAuthProvider(), browserPopupRedirectResolver); await deleteUser(u);
      } else { await signOut(auth); }
    }
  },
  // Yönetici: bir kullanıcının profilini ve itiraflarını sil
  async adminDeleteUser(uid, nick) {
    const s = await getDocs(query(collection(db, "posts"), where("uid", "==", uid)));
    for (const d of s.docs) await deleteDoc(d.ref);
    await deleteDoc(doc(db, "users", uid, "private", "info")).catch(() => {});
    if (nick) await deleteDoc(doc(db, "nicks", nick.toLocaleLowerCase("tr"))).catch(() => {});
    await deleteDoc(doc(db, "users", uid));
  },
  async adminPrivate(uid) { const s = await getDoc(doc(db, "users", uid, "private", "info")); return s.exists() ? s.data() : null; },
  // "son görülme" zamanını güncelle
  touch() { if (KDB.uid) return updateDoc(doc(db, "users", KDB.uid), { lastSeen: serverTimestamp() }).catch(() => {}); },
  async deleteAccount() {
    const uid = KDB.uid; const me = await KDB.getProfile(uid);
    const b = writeBatch(db);
    if (me && me.n) b.delete(doc(db, "nicks", me.n.toLocaleLowerCase("tr")));
    b.delete(doc(db, "users", uid, "private", "info"));
    b.delete(doc(db, "users", uid));
    await b.commit();
  },

  // ---------- İtiraflar ----------
  listenPosts(cb) {
    stop("posts");
    unsubs.posts = onSnapshot(query(collection(db, "posts"), orderBy("ts", "desc"), limit(150)),
      s => cb(s.docs.map(d => ({ id: d.id, ...d.data(), ts: ms(d.data().ts) }))), e => console.warn("posts", e));
  },
  async addPost(p, author) {
    const b = writeBatch(db), ref = doc(collection(db, "posts"));
    b.set(ref, {
      uid: KDB.uid, t: p.t, cat: p.cat, ...(p.q ? { q: String(p.q).slice(0, 200) } : {}), r: { bende: 0, saril: 0, yok: 0 }, cm: 0, ts: serverTimestamp(),
      a: author // yazarın o anki herkese açık bilgileri (takma ad, burç, renk…)
    });
    stamp(b, "postAt");
    await b.commit();
    return ref.id;
  },
  deletePost(pid) { return deleteDoc(doc(db, "posts", pid)); },
  async react(pid, newK, oldK) {
    const b = writeBatch(db), pref = doc(db, "posts", pid), rref = doc(db, "posts", pid, "reactions", KDB.uid);
    const upd = {};
    if (oldK) upd["r." + oldK] = increment(-1);
    if (newK) upd["r." + newK] = increment(1);
    if (Object.keys(upd).length) b.update(pref, upd);
    if (newK) b.set(rref, { k: newK, uid: KDB.uid }); else b.delete(rref);
    await b.commit();
  },
  listenComments(pid, cb) {
    stop("cm");
    unsubs.cm = onSnapshot(query(collection(db, "posts", pid, "comments"), orderBy("ts", "asc"), limit(200)),
      s => cb(s.docs.map(d => ({ id: d.id, ...d.data(), ts: ms(d.data().ts) }))), e => console.warn("cm", e));
  },
  stopComments() { stop("cm"); },
  async addComment(pid, t, author) {
    const b = writeBatch(db);
    b.set(doc(collection(db, "posts", pid, "comments")), { uid: KDB.uid, t, ts: serverTimestamp(), a: author });
    b.update(doc(db, "posts", pid), { cm: increment(1) });
    stamp(b, "cmAt");
    await b.commit();
  },
  async deleteComment(pid, cid) {
    const b = writeBatch(db);
    b.delete(doc(db, "posts", pid, "comments", cid));
    b.update(doc(db, "posts", pid), { cm: increment(-1) });
    await b.commit();
  },

  // ---------- Bildirimler ----------
  notify(toUid, type, text, go) {
    if (!toUid || toUid === KDB.uid) return Promise.resolve();
    const b = writeBatch(db);
    b.set(doc(collection(db, "users", toUid, "notifs")), { from: KDB.uid, type, text: String(text).slice(0, 200), go: go || null, read: false, ts: serverTimestamp() });
    stamp(b, "ntAt");
    return b.commit().catch(e => console.warn("notif", e));
  },
  listenNotifs(cb) {
    stop("notifs");
    unsubs.notifs = onSnapshot(query(collection(db, "users", KDB.uid, "notifs"), orderBy("ts", "desc"), limit(60)),
      s => cb(s.docs.map(d => ({ id: d.id, ...d.data(), ts: ms(d.data().ts) }))), e => console.warn("notifs", e));
  },
  async markNotifsRead(ids) { const b = writeBatch(db); ids.forEach(id => b.update(doc(db, "users", KDB.uid, "notifs", id), { read: true })); if (ids.length) await b.commit(); },

  // ---------- Şikâyet, engel ----------
  report(key, reason, preview, extra) {
    const d = { by: KDB.uid, key, reason, preview: preview || null, status: "bekliyor", ts: serverTimestamp() };
    if (extra) { if (extra.target) d.target = extra.target; if (extra.cid) d.cid = extra.cid; if (extra.mids && extra.mids.length) d.mids = extra.mids.slice(-20); if (extra.msgs && extra.msgs.length) d.msgs = extra.msgs.slice(-30); }
    return addDoc(collection(db, "reports"), d);
  },
  listenReports(cb) {
    stop("reports");
    unsubs.reports = onSnapshot(query(collection(db, "reports"), orderBy("ts", "desc"), limit(100)),
      s => cb(s.docs.map(d => ({ id: d.id, ...d.data(), ts: ms(d.data().ts) }))), e => cb(null));
  },
  setReport(id, status) { return updateDoc(doc(db, "reports", id), { status, doneBy: KDB.uid, doneAt: serverTimestamp() }); },
  // Moderatör: bildirilen mesajları sil (yerine "moderatör tarafından silindi" yazısı çıkar)
  async modDeleteMsgs(cid, mids) {
    const b = writeBatch(db);
    mids.forEach(id => b.update(doc(db, "chats", cid, "messages", id), { t: "", mod: true, img: deleteField(), aud: deleteField(), dur: deleteField() }));
    await b.commit();
  },
  async ban(uid, reason) { const r = await callFn("banla", { uid, reason }); return r.data; },
  async unban(uid) { const r = await callFn("banKaldir", { uid }); return r.data; },
  listenBans(cb) { stop("bans"); unsubs.bans = onSnapshot(collection(db, "bans"), s => cb(s.docs.map(d => ({ id: d.id, ...d.data() }))), e => cb([])); },
  async myBan() { try { const s = await getDoc(doc(db, "bans", KDB.uid)); return s.exists() ? s.data() : null; } catch (e) { return null; } },
  async isAdmin() { try { const s = await getDoc(doc(db, "config", "admins")); return s.exists() && (s.data().uids || []).includes(KDB.uid); } catch (e) { return false; } },
  block(uid) { return setDoc(doc(db, "users", KDB.uid, "blocks", uid), { ts: serverTimestamp() }); },
  listenBlocks(cb) { stop("blocks"); unsubs.blocks = onSnapshot(collection(db, "users", KDB.uid, "blocks"), s => cb(s.docs.map(d => d.id)), e => console.warn("blocks", e)); },

  // ---------- Sohbet ----------
  chatId,
  listenChats(cb) {
    stop("chats");
    unsubs.chats = onSnapshot(query(collection(db, "chats"), where("members", "array-contains", KDB.uid)),
      s => cb(s.docs.map(d => ({ id: d.id, ...d.data(), lastAt: ms(d.data().lastAt) }))), e => console.warn("chats", e));
  },
  async startChat(toUid, fromText, first) {
    const cid = chatId(KDB.uid, toUid), ref = doc(db, "chats", cid);
    const ex = await getDoc(ref).catch(() => null);
    if (ex && ex.exists()) { await KDB.sendMsg(cid, first); return cid; }
    const b = writeBatch(db);
    b.set(ref, { members: [KDB.uid, toUid].sort(), reqBy: KDB.uid, status: "wait", match: false, from: fromText || null, last: first, lastBy: KDB.uid, lastAt: serverTimestamp() });
    b.set(doc(collection(db, "chats", cid, "messages")), { uid: KDB.uid, t: first, ts: serverTimestamp() });
    stamp(b, "chAt", "msgAt");
    await b.commit();
    return cid;
  },
  acceptChat(cid) { return updateDoc(doc(db, "chats", cid), { status: "open" }); },
  declineChat(cid) { return deleteDoc(doc(db, "chats", cid)); },
  // ---------- Kulis Ekibi yazışması ----------
  listenEkipThread(cb) { stop("ekipT"); unsubs.ekipT = onSnapshot(doc(db, "ekip", KDB.uid), s => cb(s.exists() ? { ...s.data(), lastAt: s.data().lastAt ? ms(s.data().lastAt) : Date.now() } : null), e => cb(null)); },
  listenEkipThreads(cb) { stop("ekipL"); unsubs.ekipL = onSnapshot(query(collection(db, "ekip"), orderBy("lastAt", "desc"), limit(100)), s => cb(s.docs.map(d => ({ id: d.id, ...d.data(), lastAt: d.data().lastAt ? ms(d.data().lastAt) : Date.now() }))), e => cb([])); },
  listenEkipMsgs(uid, cb) { stop("ekipM"); unsubs.ekipM = onSnapshot(query(collection(db, "ekip", uid, "m"), orderBy("ts", "asc"), limit(300)), s => cb(s.docs.map(d => ({ id: d.id, ...d.data(), ts: d.data().ts ? ms(d.data().ts) : Date.now() }))), e => cb([])); },
  stopEkipMsgs() { stop("ekipM"); },
  // staff: yönetici/moderatör olarak yaz; değilse kullanıcı kendi yazışmasına cevap verir
  ekipSend(uid, t, role) {
    const staff = !!role, b = writeBatch(db), m = { from: KDB.uid, staff, t, ts: serverTimestamp() };
    if (staff) m.role = role;
    b.set(doc(collection(db, "ekip", uid, "m")), m);
    b.set(doc(db, "ekip", uid), { uid, last: t.slice(0, 120), lastAt: serverTimestamp(), lastBy: KDB.uid, lastStaff: staff, staffUnread: !staff, userUnread: staff }, { merge: true });
    if (!staff) stamp(b, "msgAt");
    return b.commit();
  },
  ekipRead(uid, staff) { return updateDoc(doc(db, "ekip", uid), staff ? { staffUnread: false } : { userUnread: false }).catch(() => {}); },
  // ---------- Perde ----------
  listenPerde(cb) {
    stop("perde");
    unsubs.perde = onSnapshot(query(collection(db, "perde"), where("members", "array-contains", KDB.uid)),
      s => cb(s.docs.map(d => ({ id: d.id, ...d.data(), ts: d.data().ts ? ms(d.data().ts) : Date.now() }))), e => console.warn("perde", e));
  },
  perdeIste(other) {
    const m = [KDB.uid, other].sort(), b = writeBatch(db);
    b.set(doc(db, "perde", m.join("_")), { members: m, by: KDB.uid, status: "istek", ts: serverTimestamp() });
    return b.commit();
  },
  perdeKabul(other) { return updateDoc(doc(db, "perde", chatId(KDB.uid, other)), { status: "acik", ts: serverTimestamp() }); },
  perdeKapat(other) { return deleteDoc(doc(db, "perde", chatId(KDB.uid, other))); },
  async perdeFoto(uid) { const r = await callFn("perdeFoto", { uid }); return r.data || {}; },
  async getReal() { const s = await getDoc(doc(db, "users", KDB.uid, "gizli", "foto")); return s.exists() ? s.data() : null; },
  saveReal(av, banner) { return setDoc(doc(db, "users", KDB.uid, "gizli", "foto"), { av: av || null, banner: banner || null, ts: serverTimestamp() }); },
  adminDelReal(uid) { return deleteDoc(doc(db, "users", uid, "gizli", "foto")); },
  async getTurn() { const s = await getDoc(doc(db, "config", "turn")); return s.exists() ? s.data() : null; },
  // Dosya yükle: dir "p" (profil görselleri) ya da "m" (mesaj ekleri). İndirme bağlantısını döndürür.
  async upload(dir, blob, ext) {
    const { getStorage, ref: sRef, uploadBytes, getDownloadURL } = await fbSt(); const st = getStorage(app);
    const name = Date.now().toString(36) + Math.random().toString(36).slice(2, 10) + "." + ext;
    const r = sRef(st, `${dir}/${KDB.uid}/${name}`);
    await uploadBytes(r, blob, { contentType: blob.type, cacheControl: "public,max-age=31536000" });
    return await getDownloadURL(r);
  },
  // Perde arkası görsel: herkese açık bağlantı OLUŞTURULMAZ, sadece depodaki yol döner
  async uploadReal(blob) {
    const { getStorage, ref: sRef, uploadBytes, getDownloadURL } = await fbSt(); const st = getStorage(app);
    const path = `r/${KDB.uid}/${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}.jpg`;
    await uploadBytes(sRef(st, path), blob, { contentType: "image/jpeg" });
    return path;
  },
  // Fotoğraf ya da sesli mesaj gönder
  async sendMedia(cid, m) {
    const b = writeBatch(db), d = { uid: KDB.uid, t: m.t || "", ts: serverTimestamp() };
    if (m.img) d.img = m.img;
    if (m.aud) { d.aud = m.aud; d.dur = Math.max(1, Math.min(120, Math.round(m.dur || 1))); }
    b.set(doc(collection(db, "chats", cid, "messages")), d);
    b.update(doc(db, "chats", cid), { last: m.img ? "📷 Fotoğraf" : "🎤 Sesli mesaj", lastBy: KDB.uid, lastAt: serverTimestamp(), n: increment(1) });
    stamp(b, "msgAt");
    await b.commit();
  },
  async sendMsg(cid, t) {
    const b = writeBatch(db);
    b.set(doc(collection(db, "chats", cid, "messages")), { uid: KDB.uid, t, ts: serverTimestamp() });
    // sohbet sayacı: sunucu, ücretsiz üyelikte sohbet başına mesaj sınırını buna göre uygular
    b.update(doc(db, "chats", cid), { last: t.slice(0, 120), lastBy: KDB.uid, lastAt: serverTimestamp(), n: increment(1) });
    stamp(b, "msgAt");
    await b.commit();
  },
  listenMsgs(cid, cb) {
    stop("msgs");
    unsubs.msgs = onSnapshot(query(collection(db, "chats", cid, "messages"), orderBy("ts", "asc"), limit(500)),
      s => cb(s.docs.map(d => ({ id: d.id, ...d.data(), ts: ms(d.data().ts) }))), e => console.warn("msgs", e));
  },
  stopMsgs() { stop("msgs"); },

  // ---------- Telefona bildirim ----------
  async pushSupported() { try { return !IS_TEST && "Notification" in window && "serviceWorker" in navigator && await (await fbMsg()).isSupported(); } catch (e) { return false; } },
  async enablePush() {
    const reg = await navigator.serviceWorker.register("sw.js");
    await navigator.serviceWorker.ready;
    const { getMessaging, getToken } = await fbMsg();
    const token = await getToken(getMessaging(app), { vapidKey: VAPID, serviceWorkerRegistration: reg });
    if (!token) throw new Error("anahtar alınamadı");
    await setDoc(doc(db, "users", KDB.uid, "push", token), { ts: serverTimestamp(), ua: navigator.userAgent.slice(0, 160) });
    try { localStorage.setItem("kulis_push", token); } catch (e) {}
    return token;
  },
  async disablePush() {
    let t = null; try { t = localStorage.getItem("kulis_push"); localStorage.removeItem("kulis_push"); } catch (e) {}
    if (t) await deleteDoc(doc(db, "users", KDB.uid, "push", t)).catch(() => {});
    try { const { getMessaging, deleteToken } = await fbMsg(); await deleteToken(getMessaging(app)); } catch (e) {}
  },
  // her açılışta anahtarı tazele (Google zamanla yeniler)
  async refreshPush() {
    try { if (Notification.permission !== "granted" || !localStorage.getItem("kulis_push")) return; const old = localStorage.getItem("kulis_push"); const t = await KDB.enablePush(); if (old && old !== t) await deleteDoc(doc(db, "users", KDB.uid, "push", old)).catch(() => {}); } catch (e) {}
  },

  // ---------- Anonim itiraf (sunucu yazar) ----------
  async anonPost(t, cat) { const r = await callFn("anonimItiraf", { t, cat }); return r.data.id; },
  listenMyAnon(cb) { stop("anon"); unsubs.anon = onSnapshot(collection(db, "users", KDB.uid, "anon"), s => cb(s.docs.map(d => d.id)), e => cb([])); },

  // ---------- Davet ----------
  async refInfo() { const s = await getDoc(doc(db, "users", KDB.uid, "private", "ref")).catch(() => null); return s && s.exists() ? s.data() : { count: 0 }; },

  // ---------- Moderatörler ve öne çıkarma ----------
  async isMod() { try { const s = await getDoc(doc(db, "config", "mods")); return s.exists() && (s.data().uids || []).includes(KDB.uid); } catch (e) { return false; } },
  listenMods(cb) { stop("mods"); unsubs.mods = onSnapshot(doc(db, "config", "mods"), s => cb(s.exists() ? (s.data().uids || []) : []), e => cb([])); },
  setMods(uids) { return setDoc(doc(db, "config", "mods"), { uids, updatedAt: serverTimestamp() }); },
  setFeature(pid, until) { return updateDoc(doc(db, "posts", pid), { feat: until || null }); },

  // ---------- Yasaklı kelimeler (sunucu filtresi) ----------
  listenModeration(cb) { stop("mod"); unsubs.mod = onSnapshot(doc(db, "config", "moderation"), s => cb(s.exists() ? s.data() : null), e => cb(null)); },
  setModeration(words, re) { return setDoc(doc(db, "config", "moderation"), { words, re, updatedAt: serverTimestamp() }); },

  // ---------- Hata kaydı ----------
  logError(msg, where) {
    if (!auth.currentUser) return Promise.resolve();
    const b = writeBatch(db);
    b.set(doc(collection(db, "errors")), { uid: auth.currentUser.uid, msg: String(msg).slice(0, 600), where: String(where || "").slice(0, 200), ua: navigator.userAgent.slice(0, 200), v: document.documentElement.dataset.v || "", ts: serverTimestamp() });
    stamp(b, "errAt");
    return b.commit().catch(() => {});
  },
  listenErrors(cb) { stop("errs"); unsubs.errs = onSnapshot(query(collection(db, "errors"), orderBy("ts", "desc"), limit(50)), s => cb(s.docs.map(d => ({ id: d.id, ...d.data(), ts: ms(d.data().ts) }))), e => cb(null)); },
  deleteError(id) { return deleteDoc(doc(db, "errors", id)); },

  // ---------- Ayarlar ----------
  listenSettings(cb) { stop("set"); unsubs.set = onSnapshot(doc(db, "users", KDB.uid, "settings", "main"), s => cb(s.exists() ? s.data() : {}), e => cb({})); },
  async getSettings(uid) { try { const s = await getDoc(doc(db, "users", uid, "settings", "main")); return s.exists() ? s.data() : {}; } catch (e) { return {}; } },
  saveSettings(d) { return setDoc(doc(db, "users", KDB.uid, "settings", "main"), { ...d, updatedAt: serverTimestamp() }, { merge: true }); },

  // ---------- Sesli / görüntülü arama (WebRTC sinyalleşme) ----------
  async callStart(to, type, offer) {
    const ref = doc(collection(db, "calls")), b = writeBatch(db);
    b.set(ref, { from: KDB.uid, to, members: [KDB.uid, to], type, status: "ring", offer, ts: serverTimestamp() });
    stamp(b, "callAt");
    await b.commit();
    return ref.id;
  },
  callUpdate(id, d) { return updateDoc(doc(db, "calls", id), d); },
  async getCall(id) { const s = await getDoc(doc(db, "calls", id)); return s.exists() ? { id: s.id, ...s.data(), ts: ms(s.data().ts) } : null; },
  listenCall(id, cb) { stop("call"); unsubs.call = onSnapshot(doc(db, "calls", id), s => cb(s.exists() ? { id: s.id, ...s.data() } : null), e => cb(null)); },
  addCand(id, side, c) { return addDoc(collection(db, "calls", id, side), { c: JSON.stringify(c) }).catch(() => {}); },
  listenCand(id, side, cb) {
    stop("cand");
    unsubs.cand = onSnapshot(collection(db, "calls", id, side), s => s.docChanges().forEach(ch => { if (ch.type === "added") { try { cb(JSON.parse(ch.doc.data().c)); } catch (e) {} } }), e => {});
  },
  stopCall() { stop("call"); stop("cand"); },
  listenIncoming(cb) {
    stop("inc");
    unsubs.inc = onSnapshot(query(collection(db, "calls"), where("to", "==", KDB.uid), where("status", "==", "ring")),
      s => cb(s.docs.map(d => ({ id: d.id, ...d.data(), ts: ms(d.data().ts) }))), e => console.warn("inc", e));
  },

  // ---------- 5651 erişim kaydı (IP sunucuda tutulur) ----------
  logAccess(act) { if (IS_TEST || !auth.currentUser) return Promise.resolve(); return callFn("erisimKaydi", { act }).catch(() => {}); },

  // ---------- Premium (Google Play) ----------
  listenPremium(cb) {
    stop("prem");
    unsubs.prem = onSnapshot(doc(db, "users", KDB.uid, "private", "premium"), s => cb(s.exists() ? s.data() : null), e => cb(null));
  },
  async verifyPurchase(productId, purchaseToken) {
    const t = await auth.currentUser.getIdToken();
    const r = await fetch("https://europe-west1-kulis-1647d.cloudfunctions.net/verifyPurchase", {
      method: "POST", headers: { "Content-Type": "application/json", Authorization: "Bearer " + t },
      body: JSON.stringify({ productId, purchaseToken })
    });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw Object.assign(new Error(j.error || "sunucu"), { code: j.error || r.status });
    return j;
  },

  // ---------- Eşleş ----------
  async like(toUid, pid) {
    await setDoc(doc(db, "likes", KDB.uid + "_" + toUid), { from: KDB.uid, to: toUid, pid: pid || null, ts: serverTimestamp() });
    const back = await getDoc(doc(db, "likes", toUid + "_" + KDB.uid)).catch(() => null);
    if (back && back.exists()) {
      const cid = chatId(KDB.uid, toUid), ref = doc(db, "chats", cid);
      const ex = await getDoc(ref).catch(() => null);
      if (!ex || !ex.exists()) {
        await setDoc(ref, { members: [KDB.uid, toUid].sort(), reqBy: KDB.uid, status: "open", match: true, from: null, last: null, lastBy: KDB.uid, lastAt: serverTimestamp() });
      }
      return cid;
    }
    return null;
  },
  listenLikesToMe(cb) {
    stop("likesIn");
    unsubs.likesIn = onSnapshot(query(collection(db, "likes"), where("to", "==", KDB.uid)), s => cb(s.docs.map(d => d.data())), e => console.warn("likesIn", e));
  },
  listenMyLikes(cb) {
    stop("likesOut");
    unsubs.likesOut = onSnapshot(query(collection(db, "likes"), where("from", "==", KDB.uid)), s => cb(s.docs.map(d => d.data())), e => console.warn("likesOut", e));
  }
};
window.KDB = KDB;
window.dispatchEvent(new Event("kdb-ready"));
