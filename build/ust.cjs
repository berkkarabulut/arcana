// Bir JS dosyasının en üst seviyedeki ifadelerini (fonksiyon, sabit, kod) listeler
let ts; try { ts = require("typescript"); } catch (e) { ts = require("/opt/node22/lib/node_modules/typescript"); }
const fs = require("fs");
module.exports = function ust(file) {
  const text = fs.readFileSync(file, "utf8");
  const sf = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.JS);
  return sf.statements.map(st => {
    let names = [];
    if (ts.isFunctionDeclaration(st) && st.name) names = [st.name.text];
    else if (ts.isVariableStatement(st)) names = st.declarationList.declarations.map(d => d.name.getText(sf));
    else if (ts.isClassDeclaration(st) && st.name) names = [st.name.text];
    return { kind: ts.SyntaxKind[st.kind], names, start: st.getFullStart(), end: st.end, size: st.end - st.getFullStart(), text: text.slice(st.getFullStart(), st.end) };
  });
};
if (require.main === module) for (const f of process.argv.slice(2)) {
  console.log("== " + f);
  for (const s of module.exports(f)) console.log(`   ${s.kind.padEnd(20)} ${String(s.size).padStart(6)}  ${s.names.join(",") || s.text.trim().slice(0, 70).replace(/\n/g, " ")}`);
}
