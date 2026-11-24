/* ============ HAZIR GÖRSELLER ============ */
const BANNERS=[
 {id:"b1",n:"Gece",svg:()=>{let st="";let sd=11;const r=()=>(sd=(sd*16807)%2147483647)/2147483647;for(let i=0;i<90;i++)st+=`<circle cx="${(r()*900).toFixed(0)}" cy="${(r()*300).toFixed(0)}" r="${(r()*1.6+.3).toFixed(1)}" fill="#fff" opacity="${(r()*.7+.2).toFixed(2)}"/>`;return `<defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0B1230"/><stop offset="1" stop-color="#3B2357"/></linearGradient></defs><rect width="900" height="300" fill="url(#g)"/>${st}<circle cx="720" cy="80" r="38" fill="#F4E6C8"/><circle cx="736" cy="70" r="36" fill="#15183A"/>`}},
 {id:"b2",n:"Gün batımı",svg:()=>`<defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3A1C4A"/><stop offset=".55" stop-color="#E8505B"/><stop offset="1" stop-color="#F6B26B"/></linearGradient></defs><rect width="900" height="300" fill="url(#g)"/><circle cx="450" cy="230" r="90" fill="#FFD9A0" opacity=".9"/><path d="M0 240 Q150 200 300 235 T600 230 T900 225 V300 H0Z" fill="#2B1430"/><path d="M0 270 Q200 245 450 268 T900 260 V300 H0Z" fill="#1C0E22"/>`},
 {id:"b3",n:"Deniz",svg:()=>`<rect width="900" height="300" fill="#0E3A5B"/><path d="M0 90 Q112 60 225 90 T450 90 T675 90 T900 90 V300 H0Z" fill="#14557F"/><path d="M0 150 Q112 120 225 150 T450 150 T675 150 T900 150 V300 H0Z" fill="#1C72A3"/><path d="M0 210 Q112 180 225 210 T450 210 T675 210 T900 210 V300 H0Z" fill="#2B90C2"/><path d="M0 260 Q112 235 225 260 T450 260 T675 260 T900 260 V300 H0Z" fill="#9FD3E8"/>`},
 {id:"b4",n:"Dağlar",svg:()=>`<defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F2C6B4"/><stop offset="1" stop-color="#B47FA6"/></linearGradient></defs><rect width="900" height="300" fill="url(#g)"/><path d="M0 200 L140 90 L260 190 L400 60 L560 200 L700 100 L900 210 V300 H0Z" fill="#7A4E7E"/><path d="M0 250 L180 150 L330 240 L520 140 L700 250 L820 190 L900 230 V300 H0Z" fill="#4C2D55"/><path d="M0 285 L260 230 L480 280 L720 235 L900 280 V300 H0Z" fill="#2A1830"/>`},
 {id:"b5",n:"Pamuk",svg:()=>`<rect width="900" height="300" fill="#F7D6E0"/><circle cx="120" cy="60" r="130" fill="#F2B5C9"/><circle cx="420" cy="320" r="170" fill="#E8A0BF"/><circle cx="760" cy="40" r="150" fill="#C9B6F2"/><circle cx="880" cy="260" r="110" fill="#F6C1A6"/>`},
 {id:"b6",n:"Ay evreleri",svg:()=>{let m="";for(let i=0;i<7;i++){const x=120+i*110,f=Math.abs(3-i)/3;m+=`<circle cx="${x}" cy="150" r="34" fill="#2A2342"/><ellipse cx="${x}" cy="150" rx="${(34*f).toFixed(1)}" ry="34" fill="#F1E4C6"/>${i===3?`<circle cx="${x}" cy="150" r="34" fill="#F1E4C6"/>`:""}`}return `<rect width="900" height="300" fill="#14101F"/>${m}`}},
 {id:"b7",n:"Çizgiler",svg:()=>{let l="";for(let i=-6;i<20;i++)l+=`<rect x="${i*70}" y="-50" width="34" height="420" fill="${["#E8505B","#E9B96E","#2A2233"][(i+30)%3]}" transform="rotate(25 ${i*70} 150)"/>`;return `<rect width="900" height="300" fill="#1F1926"/>${l}`}},
 {id:"b8",n:"Orman",svg:()=>{let t="";for(let i=0;i<14;i++){const x=i*70+20,h=90+((i*37)%60);t+=`<path d="M${x} ${300-h} L${x-28} 300 L${x+28} 300Z" fill="#1F4D3A"/>`}return `<defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#CFE8D5"/><stop offset="1" stop-color="#7DB59A"/></linearGradient></defs><rect width="900" height="300" fill="url(#g)"/><path d="M0 220 Q225 170 450 210 T900 200 V300 H0Z" fill="#3E7D5E"/>${t}`}},
];
const AVATARS=[
 {id:"a1",svg:()=>`<rect width="200" height="200" fill="#1B2350"/><circle cx="100" cy="100" r="52" fill="#F4E6C8"/><circle cx="122" cy="86" r="50" fill="#1B2350"/><circle cx="50" cy="50" r="3" fill="#fff"/><circle cx="150" cy="150" r="2.5" fill="#fff"/><circle cx="160" cy="45" r="2" fill="#fff"/>`},
 {id:"a2",svg:()=>`<rect width="200" height="200" fill="#F6B26B"/><circle cx="100" cy="100" r="44" fill="#FFE3A3"/>${Array.from({length:12},(_,i)=>`<rect x="96" y="22" width="8" height="24" rx="4" fill="#FFE3A3" transform="rotate(${i*30} 100 100)"/>`).join("")}`},
 {id:"a3",svg:()=>`<rect width="200" height="200" fill="#5B3B8C"/><path d="M100 38 L117 82 L164 84 L127 113 L140 158 L100 132 L60 158 L73 113 L36 84 L83 82Z" fill="#F2C6E0"/>`},
 {id:"a4",svg:()=>`<rect width="200" height="200" fill="#7CC6A4"/><path d="M52 150 V80 L70 50 L88 78 H112 L130 50 L148 80 V150Z" fill="#1F3B30"/><circle cx="82" cy="108" r="7" fill="#7CC6A4"/><circle cx="118" cy="108" r="7" fill="#7CC6A4"/><path d="M94 124 h12 l-6 6z" fill="#F29A7C"/>`},
 {id:"a5",svg:()=>`<rect width="200" height="200" fill="#F7D6E0"/>${Array.from({length:6},(_,i)=>`<ellipse cx="100" cy="62" rx="22" ry="38" fill="#E8505B" opacity=".9" transform="rotate(${i*60} 100 100)"/>`).join("")}<circle cx="100" cy="100" r="18" fill="#E9B96E"/>`},
 {id:"a6",svg:()=>`<rect width="200" height="200" fill="#0E3A5B"/><path d="M0 110 Q25 90 50 110 T100 110 T150 110 T200 110 V200 H0Z" fill="#1C72A3"/><path d="M0 145 Q25 125 50 145 T100 145 T150 145 T200 145 V200 H0Z" fill="#9FD3E8"/>`},
 {id:"a7",svg:()=>`<rect width="200" height="200" fill="#F2C6B4"/><path d="M0 160 L60 70 L100 130 L140 60 L200 150 V200 H0Z" fill="#7A4E7E"/><path d="M128 78 L140 60 L152 78Z" fill="#fff"/>`},
 {id:"a8",svg:()=>`<rect width="200" height="200" fill="#2A2233"/><path d="M100 160s-55-34-55-78a30 30 0 0 1 55-17a30 30 0 0 1 55 17c0 44-55 78-55 78z" fill="#E8505B"/>`},
 {id:"a9",svg:()=>`<rect width="200" height="200" fill="#E9B96E"/><path d="M50 90 h86 v34 a40 40 0 0 1 -40 40 h-6 a40 40 0 0 1 -40 -40z" fill="#4B2E22"/><path d="M136 100 h12 a14 14 0 0 1 0 28 h-12" fill="none" stroke="#4B2E22" stroke-width="9"/><path d="M75 55 q8 -10 0 -20 M95 55 q8 -10 0 -20 M115 55 q8 -10 0 -20" stroke="#fff" stroke-width="5" fill="none" stroke-linecap="round"/>`},
 {id:"a10",svg:()=>`<rect width="200" height="200" fill="#86A8F0"/><circle cx="70" cy="80" r="34" fill="#fff" opacity=".85"/><circle cx="110" cy="70" r="40" fill="#fff" opacity=".95"/><circle cx="140" cy="95" r="30" fill="#fff" opacity=".85"/><rect x="40" y="92" width="130" height="30" rx="15" fill="#fff"/>`},
];

// çizim insan avatarları
function personSVG(o){
  const sk=o.skin, sd=o.skinD, hc=o.hair, sh=o.shirt, bg=o.bg;
  let back="",front="",extra="",face="";
  const head=`<ellipse cx="66" cy="98" rx="7" ry="9" fill="${sk}"/><ellipse cx="134" cy="98" rx="7" ry="9" fill="${sk}"/><ellipse cx="100" cy="94" rx="34" ry="40" fill="${sk}"/>`;
  const eyes=o.f?`<ellipse cx="87" cy="96" rx="3.2" ry="3.8" fill="#2A1C18"/><ellipse cx="113" cy="96" rx="3.2" ry="3.8" fill="#2A1C18"/><path d="M82 92 l-3 -2 M118 92 l3 -2" stroke="#2A1C18" stroke-width="1.6" stroke-linecap="round"/>`:`<ellipse cx="87" cy="96" rx="3" ry="3.4" fill="#2A1C18"/><ellipse cx="113" cy="96" rx="3" ry="3.4" fill="#2A1C18"/>`;
  const brows=`<path d="M80 ${o.f?86:85} q7 -${o.f?4:3} 14 0 M106 ${o.f?86:85} q7 -${o.f?4:3} 14 0" stroke="${o.brow||hc}" stroke-width="${o.f?2.4:3.2}" fill="none" stroke-linecap="round"/>`;
  const nose=`<path d="M100 100 q-4 9 1 10" stroke="${sd}" stroke-width="2" fill="none" stroke-linecap="round"/>`;
  const mouth=o.f?`<path d="M91 116 q9 7 18 0 q-9 3 -18 0z" fill="#C4535E"/>`:`<path d="M91 115 q9 6 18 0" stroke="#7A3A33" stroke-width="2.6" fill="none" stroke-linecap="round"/>`;
  const blush=o.f?`<circle cx="80" cy="108" r="6" fill="#E8505B" opacity=".14"/><circle cx="120" cy="108" r="6" fill="#E8505B" opacity=".14"/>`:"";
  const body=`<path d="M34 200 Q38 150 100 142 Q162 150 166 200Z" fill="${sh}"/><path d="M88 120 h24 v22 q-12 9 -24 0z" fill="${sd}"/>`;
  switch(o.style){
    case "long": back=`<path d="M60 96 Q54 42 100 40 Q146 42 140 96 L152 172 Q100 186 48 172Z" fill="${hc}"/>`;front=`<path d="M66 96 Q64 50 100 50 Q136 50 134 96 Q128 70 108 66 Q96 78 66 96Z" fill="${hc}"/>`;break;
    case "bob": back=`<path d="M58 100 Q54 44 100 42 Q146 44 142 100 Q144 124 134 132 L66 132 Q56 124 58 100Z" fill="${hc}"/>`;front=`<path d="M64 98 Q62 50 100 48 Q138 50 136 98 Q132 72 100 68 Q72 70 64 98Z" fill="${hc}"/>`;break;
    case "curlyF": back=`<g fill="${hc}">${[[62,70],[74,52],[94,44],[116,46],[134,58],[142,80],[60,96],[144,104],[58,120],[146,126],[64,142],[140,146]].map(([x,y])=>`<circle cx="${x}" cy="${y}" r="17"/>`).join("")}</g>`;front=`<g fill="${hc}">${[[76,62],[96,56],[118,60],[132,74],[68,78]].map(([x,y])=>`<circle cx="${x}" cy="${y}" r="12"/>`).join("")}</g>`;break;
    case "bun": back=`<circle cx="100" cy="40" r="18" fill="${hc}"/>`;front=`<path d="M64 96 Q62 52 100 52 Q138 52 136 96 Q130 64 100 62 Q70 64 64 96Z" fill="${hc}"/>`;break;
    case "hijab": back=`<path d="M50 130 Q44 40 100 38 Q156 40 150 130 L166 200 H34Z" fill="${hc}"/>`;extra=`<path d="M64 100 Q62 56 100 54 Q138 56 136 100 Q136 132 100 138 Q64 132 64 100Z" fill="none" stroke="${o.hijab2||"#00000022"}" stroke-width="5"/>`;break;
    case "short": front=`<path d="M66 90 Q62 50 100 50 Q140 50 134 90 Q130 70 112 66 Q96 72 78 68 Q70 74 66 90Z" fill="${hc}"/>`;break;
    case "side": front=`<path d="M66 92 Q60 48 102 48 Q142 50 134 90 Q128 66 96 64 Q76 66 66 92Z" fill="${hc}"/><path d="M96 50 q-6 10 -2 18" stroke="${sd}" stroke-width="1.5" fill="none" opacity=".4"/>`;break;
    case "curlyM": front=`<g fill="${hc}">${[[70,72],[82,58],[98,52],[114,54],[128,62],[134,78],[66,86]].map(([x,y])=>`<circle cx="${x}" cy="${y}" r="13"/>`).join("")}</g>`;break;
    case "buzz": front=`<path d="M67 86 Q66 54 100 54 Q134 54 133 86 Q118 74 100 74 Q82 74 67 86Z" fill="${hc}" opacity=".85"/>`;break;
    case "mid": back=`<path d="M62 100 Q58 46 100 44 Q142 46 138 100 L140 130 L60 130Z" fill="${hc}"/>`;front=`<path d="M66 94 Q64 50 100 50 Q136 50 134 94 Q124 68 100 66 Q76 68 66 94Z" fill="${hc}"/>`;break;
  }
  if(o.beard)extra+=`<path d="M68 102 Q70 142 100 142 Q130 142 132 102 Q128 124 100 126 Q72 124 68 102Z" fill="${hc}"/><path d="M88 112 q12 -6 24 0" stroke="${hc}" stroke-width="5" fill="none" stroke-linecap="round"/>`;
  if(o.mustache)extra+=`<path d="M87 111 q13 -7 26 0" stroke="${hc}" stroke-width="5" fill="none" stroke-linecap="round"/>`;
  if(o.glasses)extra+=`<g fill="none" stroke="#1E1A22" stroke-width="2.6"><rect x="75" y="87" width="22" height="17" rx="7"/><rect x="103" y="87" width="22" height="17" rx="7"/><path d="M97 94 h6"/></g>`;
  face=eyes+brows+nose+(o.beard?"":mouth)+(o.beard?`<path d="M93 120 q7 4 14 0" stroke="#7A3A33" stroke-width="2.4" fill="none" stroke-linecap="round"/>`:"")+blush;
  return `<rect width="200" height="200" fill="${bg}"/><g transform="translate(-28 -8) scale(1.28)">${back}${body}${head}${front}${face}${extra}</g>`;
}
const PEOPLE=[
 {id:"k1",g:"Kadın",o:{f:1,style:"long",skin:"#F3D2BC",skinD:"#D9AC92",hair:"#2B1D17",shirt:"#E8505B",bg:"#F7D6E0"}},
 {id:"k2",g:"Kadın",o:{f:1,style:"bob",skin:"#E2B48F",skinD:"#C08E6B",hair:"#6B3E26",shirt:"#7CC6A4",bg:"#FCE9C8"}},
 {id:"k3",g:"Kadın",o:{f:1,style:"curlyF",skin:"#9C6644",skinD:"#7A4C31",hair:"#21150F",shirt:"#E9B96E",bg:"#C9B6F2"}},
 {id:"k4",g:"Kadın",o:{f:1,style:"bun",skin:"#F6DDCB",skinD:"#DDB59B",hair:"#D9A65B",brow:"#A9773C",shirt:"#86A8F0",bg:"#D9EEF2"}},
 {id:"k5",g:"Kadın",o:{f:1,style:"hijab",skin:"#E8BE9C",skinD:"#C9967A",hair:"#B97A8E",hijab2:"#00000018",brow:"#3B2A22",shirt:"#B97A8E",bg:"#F3E3D3"}},
 {id:"k6",g:"Kadın",o:{f:1,style:"long",skin:"#F4D5C2",skinD:"#DBAE97",hair:"#A3401F",shirt:"#2A2233",bg:"#F2C6B4",glasses:1}},
 {id:"e1",g:"Erkek",o:{style:"short",skin:"#F0CDB4",skinD:"#D4A78C",hair:"#2B1D17",shirt:"#2F4A6B",bg:"#CFE3F7"}},
 {id:"e2",g:"Erkek",o:{style:"side",skin:"#D7A57E",skinD:"#B5835F",hair:"#241812",shirt:"#7A4E7E",bg:"#F2D7B8",beard:1}},
 {id:"e3",g:"Erkek",o:{style:"curlyM",skin:"#8A5A3C",skinD:"#6C442C",hair:"#18100B",shirt:"#E8505B",bg:"#BFE3CF"}},
 {id:"e4",g:"Erkek",o:{style:"side",skin:"#F2D3BE",skinD:"#D7AC94",hair:"#6B3E26",shirt:"#E9B96E",bg:"#D8D2F2",glasses:1}},
 {id:"e5",g:"Erkek",o:{style:"buzz",skin:"#E0B08C",skinD:"#BE8D6A",hair:"#3A2A22",shirt:"#1F4D3A",bg:"#F7E3B0",mustache:1}},
 {id:"e6",g:"Erkek",o:{style:"mid",skin:"#F5D9C6",skinD:"#DCB39C",hair:"#C9954F",brow:"#9A6A33",shirt:"#86A8F0",bg:"#F7D6E0",beard:1}},
];
PEOPLE.forEach(p=>AVATARS.push({id:p.id,g:p.g,svg:()=>personSVG(p.o)}));

const _pc={};
function presetURI(ref){if(!ref||!ref.startsWith("preset:"))return ref;if(_pc[ref])return _pc[ref];const id=ref.slice(7);
  const b=BANNERS.find(x=>x.id===id),a=AVATARS.find(x=>x.id===id);
  const svg=b?`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 300" preserveAspectRatio="xMidYMid slice">${b.svg()}</svg>`:a?`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">${a.svg()}</svg>`:"";
  return _pc[ref]="data:image/svg+xml;charset=utf-8,"+encodeURIComponent(svg)}
const isUpload=v=>!!v&&!String(v).startsWith("preset:");
const CONST={
 koc:[[[10,30],[38,20],[60,18],[78,26]],[[0,1],[1,2],[2,3]]],
 boga:[[[20,12],[40,28],[48,34],[56,28],[88,10],[30,42],[52,30]],[[0,1],[1,2],[2,3],[3,4],[2,5]]],
 ikizler:[[[22,8],[26,22],[30,38],[46,6],[50,22],[56,40],[14,46],[66,46]],[[0,1],[1,2],[3,4],[4,5],[1,4],[2,6],[5,7]]],
 yengec:[[[50,24],[46,6],[28,42],[72,40],[62,14]],[[0,1],[0,2],[0,3],[0,4]]],
 aslan:[[[20,32],[24,16],[34,8],[46,12],[44,24],[34,30],[72,26],[90,38],[68,40]],[[4,3],[3,2],[2,1],[4,5],[5,0],[4,6],[6,7],[7,8],[8,5]]],
 basak:[[[8,10],[26,16],[40,24],[56,22],[70,30],[62,44],[86,20],[40,42]],[[0,1],[1,2],[2,3],[3,4],[4,5],[3,6],[2,7]]],
 terazi:[[[50,6],[32,22],[68,22],[28,42],[72,42]],[[0,1],[0,2],[1,2],[1,3],[2,4]]],
 akrep:[[[16,8],[20,18],[30,24],[40,28],[48,36],[56,44],[68,46],[80,42],[88,34],[84,26],[8,24]],[[0,1],[1,2],[2,3],[3,4],[4,5],[5,6],[6,7],[7,8],[8,9],[1,10]]],
 yay:[[[30,30],[46,22],[60,26],[54,40],[38,42],[70,12],[78,30],[18,22]],[[0,1],[1,2],[2,3],[3,4],[4,0],[1,5],[5,2],[2,6],[0,7]]],
 oglak:[[[8,12],[30,32],[52,42],[74,36],[92,14],[60,22]],[[0,1],[1,2],[2,3],[3,4],[4,5],[5,0]]],
 kova:[[[8,14],[22,22],[36,16],[50,26],[64,20],[76,34],[90,28],[48,42]],[[0,1],[1,2],[2,3],[3,4],[4,5],[5,6],[3,7]]],
 balik:[[[10,40],[30,32],[50,24],[68,14],[86,6],[44,42],[66,44],[86,36],[92,26]],[[0,1],[1,2],[2,3],[3,4],[0,5],[5,6],[6,7],[7,8]]]
};
const constCache={};
function constellationURI(sign){
  if(constCache[sign])return constCache[sign];
  const c=CONST[sign];if(!c)return "";
  const [pts,ed]=c,X=x=>(62+x*.92).toFixed(1),Y=y=>(6+y).toFixed(1);
  let seed=hsh(sign);const r=()=>{seed=(Math.imul(seed,1103515245)+12345)>>>0;return (seed%10000)/10000};
  let bg="";for(let i=0;i<34;i++)bg+=`<circle cx="${(r()*160).toFixed(1)}" cy="${(r()*60).toFixed(1)}" r="${(.25+r()*.45).toFixed(2)}" fill="#F4ECE4" opacity="${(.2+r()*.4).toFixed(2)}"/>`;
  const ln=ed.map(([a,b])=>`<line x1="${X(pts[a][0])}" y1="${Y(pts[a][1])}" x2="${X(pts[b][0])}" y2="${Y(pts[b][1])}"/>`).join("");
  const st=pts.map(([x,y],i)=>{const big=i%3===0;return `<circle cx="${X(x)}" cy="${Y(y)}" r="${big?3.4:2.6}" fill="#F4ECE4" opacity=".14"/><circle cx="${X(x)}" cy="${Y(y)}" r="${big?1.5:1.1}" fill="#F4ECE4"/>`}).join("");
  const svg=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 60" preserveAspectRatio="xMaxYMid meet">${bg}<g stroke="#F4ECE4" stroke-opacity=".5" stroke-width=".5" stroke-linecap="round">${ln}</g>${st}</svg>`;
  return constCache[sign]="data:image/svg+xml,"+encodeURIComponent(svg);
}
function coverCSS(u){
  const bn=(u!==state.me&&u.realBn)||u.banner;
  if(bn)return `background:#2A2233 url('${presetURI(bn)}') center/cover no-repeat`;
  const g=`radial-gradient(120% 160% at 100% 0%,color-mix(in srgb,${u.c||"#E8505B"} 45%,transparent),transparent 65%),linear-gradient(160deg,#1C2945,#0B1220 70%)`;
  const cu=u.s&&constellationURI(u.s);
  return cu?`background:url('${cu}') right 4% center/auto 92% no-repeat,${g}`:`background:${g}`;
}
