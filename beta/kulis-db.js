// Kulis veritabanı katmanı: Firebase Auth + Firestore
// Site (index.html) bu dosyadaki window.KDB fonksiyonlarıyla gerçek veriye ulaşır.
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.8.0/firebase-app.js";
import {
  getAuth, onAuthStateChanged, signInAnonymously, GoogleAuthProvider, signInWithPopup,
  sendSignInLinkToEmail, isSignInWithEmailLink, signInWithEmailLink, signOut, linkWithPopup,
  deleteUser, reauthenticateWithPopup
} from "https://www.gstatic.com/firebasejs/12.8.0/firebase-auth.js";
import {
  initializeFirestore, persistentLocalCache, persistentMultipleTabManager,
  doc, getDoc, setDoc, addDoc, updateDoc, deleteDoc, collection, query, where, orderBy, limit,
  onSnapshot, serverTimestamp, increment, writeBatch, getDocs
} from "https://www.gstatic.com/firebasejs/12.8.0/firebase-firestore.js";

const app = initializeApp({
  apiKey: "AIzaSyDA7rTiYY8NZHbnXAoUt7u0LiWyXlPolDg",
  authDomain: "kulis-1647d.firebaseapp.com",
  projectId: "kulis-1647d",
  storageBucket: "kulis-1647d.firebasestorage.app",
  messagingSenderId: "165708007413",
  appId: "1:165708007413:web:7dd69b4ef7c40f01fb82bc"
});
const auth = getAuth(app);
auth.languageCode = "tr";
let db;
try { db = initializeFirestore(app, { localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }) }); }
catch (e) { db = initializeFirestore(app, {}); }

const ms = t => (t && t.toMillis) ? t.toMillis() : (typeof t === "number" ? t : Date.now());
const chatId = (a, b) => a < b ? a + "_" + b : b + "_" + a;
const unsubs = {};
function stop(key) { if (unsubs[key]) { unsubs[key](); delete unsubs[key]; } }
function stopAll() { Object.keys(unsubs).forEach(stop); }

const KDB = {
  ready: true,
  get uid() { return auth.currentUser ? auth.currentUser.uid : null; },
  get user() { return auth.currentUser; },

  // ---------- Giriş ----------
  onAuth(cb) { return onAuthStateChanged(auth, cb); },
  async google() {
    const p = new GoogleAuthProvider(); p.setCustomParameters({ prompt: "select_account" });
    if (auth.currentUser && auth.currentUser.isAnonymous) {
      try { return (await linkWithPopup(auth.currentUser, p)).user; } catch (e) { /* hesap zaten varsa normal giriş */ }
    }
    return (await signInWithPopup(auth, p)).user;
  },
  async anon() { return (await signInAnonymously(auth)).user; },
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
  async getProfile(uid) { const s = await getDoc(doc(db, "users", uid)); return s.exists() ? { id: s.id, ...s.data() } : null; },
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
    await wipe(query(collection(db, "likes"), where("from", "==", uid)));
    await wipe(query(collection(db, "chats"), where("members", "array-contains", uid)));
    await wipe(collection(db, "users", uid, "notifs"));
    await wipe(collection(db, "users", uid, "blocks"));
    await KDB.deleteAccount();
    const u = auth.currentUser;
    try { await deleteUser(u); }
    catch (e) {
      if (e.code === "auth/requires-recent-login" && u.providerData.some(p => p.providerId === "google.com")) {
        await reauthenticateWithPopup(u, new GoogleAuthProvider()); await deleteUser(u);
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
    const r = await addDoc(collection(db, "posts"), {
      uid: KDB.uid, t: p.t, cat: p.cat, r: { bende: 0, saril: 0, yok: 0 }, cm: 0, ts: serverTimestamp(),
      a: author // yazarın o anki herkese açık bilgileri (takma ad, burç, renk…)
    });
    return r.id;
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
    return addDoc(collection(db, "users", toUid, "notifs"), { from: KDB.uid, type, text: String(text).slice(0, 200), go: go || null, read: false, ts: serverTimestamp() }).catch(e => console.warn("notif", e));
  },
  listenNotifs(cb) {
    stop("notifs");
    unsubs.notifs = onSnapshot(query(collection(db, "users", KDB.uid, "notifs"), orderBy("ts", "desc"), limit(60)),
      s => cb(s.docs.map(d => ({ id: d.id, ...d.data(), ts: ms(d.data().ts) }))), e => console.warn("notifs", e));
  },
  async markNotifsRead(ids) { const b = writeBatch(db); ids.forEach(id => b.update(doc(db, "users", KDB.uid, "notifs", id), { read: true })); if (ids.length) await b.commit(); },

  // ---------- Şikâyet, engel ----------
  report(key, reason, preview) { return addDoc(collection(db, "reports"), { by: KDB.uid, key, reason, preview: preview || null, status: "bekliyor", ts: serverTimestamp() }); },
  listenReports(cb) {
    stop("reports");
    unsubs.reports = onSnapshot(query(collection(db, "reports"), orderBy("ts", "desc"), limit(100)),
      s => cb(s.docs.map(d => ({ id: d.id, ...d.data(), ts: ms(d.data().ts) }))), e => cb(null));
  },
  setReport(id, status) { return updateDoc(doc(db, "reports", id), { status }); },
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
    await setDoc(ref, { members: [KDB.uid, toUid].sort(), reqBy: KDB.uid, status: "wait", match: false, from: fromText || null, last: first, lastBy: KDB.uid, lastAt: serverTimestamp() });
    await addDoc(collection(db, "chats", cid, "messages"), { uid: KDB.uid, t: first, ts: serverTimestamp() });
    return cid;
  },
  acceptChat(cid) { return updateDoc(doc(db, "chats", cid), { status: "open" }); },
  declineChat(cid) { return deleteDoc(doc(db, "chats", cid)); },
  async sendMsg(cid, t) {
    await addDoc(collection(db, "chats", cid, "messages"), { uid: KDB.uid, t, ts: serverTimestamp() });
    await updateDoc(doc(db, "chats", cid), { last: t.slice(0, 120), lastBy: KDB.uid, lastAt: serverTimestamp() }).catch(() => {});
  },
  listenMsgs(cid, cb) {
    stop("msgs");
    unsubs.msgs = onSnapshot(query(collection(db, "chats", cid, "messages"), orderBy("ts", "asc"), limit(500)),
      s => cb(s.docs.map(d => ({ id: d.id, ...d.data(), ts: ms(d.data().ts) }))), e => console.warn("msgs", e));
  },
  stopMsgs() { stop("msgs"); },

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
