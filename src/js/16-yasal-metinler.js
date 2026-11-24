/* ============ YASAL METİNLER ============ */
const CONTACT_EMAIL="mberkarabulut@gmail.com";
document.addEventListener("click",e=>{const a=e.target.closest("[data-legal]");if(a){e.preventDefault();e.stopPropagation();showLegal(a.dataset.legal)}},true);

