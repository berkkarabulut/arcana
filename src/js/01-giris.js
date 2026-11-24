// davet linkiyle gelindiyse davet edeni hatırla (kayıtta sunucuya iletilir)
try{const rf=new URLSearchParams(location.search).get("ref");if(rf&&/^[A-Za-z0-9]{10,40}$/.test(rf)&&!localStorage.getItem("kulis_ref"))localStorage.setItem("kulis_ref",rf)}catch(e){}
const REMOTE=(()=>{try{return localStorage.getItem("kulis_remote")!=="0"}catch(e){return true}})();