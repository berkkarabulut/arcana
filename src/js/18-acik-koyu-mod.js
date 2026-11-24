/* ============ AÇIK / KOYU MOD ============ */
const temaPref=()=>{try{return localStorage.getItem("kulis_tema")||"sistem"}catch(e){return "sistem"}};
const lightMQ=matchMedia("(prefers-color-scheme: light)");
function applyTheme(){
  const t=temaPref(),light=t==="acik"||(t==="sistem"&&lightMQ.matches);
  document.documentElement.toggleAttribute("data-theme",false);if(light)document.documentElement.setAttribute("data-theme","light");
  const m=$("#themeColor");if(m)m.setAttribute("content",light?"#F1F7F5":"#0B1220");
}
function setTheme(t){try{localStorage.setItem("kulis_tema",t)}catch(e){}applyTheme();track("tema_"+t);if(state.me&&state.tab==="ben")render()}
lightMQ.addEventListener?lightMQ.addEventListener("change",applyTheme):lightMQ.addListener(applyTheme);
applyTheme();
const SUN='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>';
const MOON='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z"/></svg>';
const AUTO='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="13" rx="2"/><path d="M8 21h8M12 17v4"/></svg>';
function themePicker(){const t=temaPref();return `<div class="ayar-h">Görünüm</div><div class="theme-pick" role="group" aria-label="Görünüm">${[["sistem",AUTO,"Sistem"],["acik",SUN,"Açık"],["koyu",MOON,"Koyu"]].map(([k,ic,l])=>`<button data-tema="${k}" aria-pressed="${t===k}">${ic}${l}</button>`).join("")}</div>`}
document.addEventListener("click",e=>{const b=e.target.closest("[data-tema]");if(b){setTheme(b.dataset.tema)}});
