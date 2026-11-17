// 배포(빌드)할 때 DART 상장사 목록을 미리 받아 src/data/corps.json 으로 저장한다.
// 키가 없거나 실패해도 빌드는 멈추지 않는다(검색 시 실시간으로 받는 방식으로 대신 동작).
import { unzipSync, strFromU8 } from "fflate";
import { readFileSync, writeFileSync } from "node:fs";

const key = process.env.DART_API_KEY?.trim();
const testZip = process.env.DART_CORP_ZIP_FILE; // 점검용

try {
  let buf;
  if (testZip) {
    buf = new Uint8Array(readFileSync(testZip));
  } else if (key) {
    const res = await fetch(`https://opendart.fss.or.kr/api/corpCode.xml?crtfc_key=${key}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    buf = new Uint8Array(await res.arrayBuffer());
  } else {
    console.log("[build-corps] DART_API_KEY 없음 - 건너뜀");
    process.exit(0);
  }
  const files = unzipSync(buf);
  const name = Object.keys(files).find((n) => n.toLowerCase().endsWith(".xml"));
  if (!name) throw new Error("압축 안에 XML 없음 (인증키 오류일 수 있음)");
  const xml = strFromU8(files[name]);
  const rows = [];
  // 항목 순서(영문명 유무 등)에 상관없이 <list> 블록마다 필요한 값만 꺼낸다
  const field = (b, n) => (b.match(new RegExp(`<${n}>\\s*([^<]*?)\\s*</${n}>`)) || [])[1] || "";
  for (const m of xml.matchAll(/<list>([\s\S]*?)<\/list>/g)) {
    const stock = field(m[1], "stock_code");
    if (stock) rows.push([field(m[1], "corp_code"), field(m[1], "corp_name"), stock, field(m[1], "modify_date")]);
  }
  if (rows.length === 0) throw new Error("상장사 0건");
  // 합병·상장폐지로 사라진 옛 법인이 같은 이름으로 남아 있으면(예: 구 삼성물산) 데이터가 없어 화면이 비므로,
  // 같은 이름 중 정보 수정일이 1년 넘게 오래된 것은 뺀다. 수정일이 비슷하면 둘 다 둔다.
  const newest = new Map();
  for (const r of rows) if (r[3] > (newest.get(r[1]) ?? "")) newest.set(r[1], r[3]);
  const year = (d) => Number(d.slice(0, 4)) * 12 + Number(d.slice(4, 6));
  const kept = rows.filter((r) => !r[3] || year(newest.get(r[1])) - year(r[3]) < 12);
  const out = kept.map((r) => r.slice(0, 3));
  writeFileSync(new URL("../src/data/corps.json", import.meta.url), JSON.stringify(out));
  console.log(`[build-corps] 상장사 ${out.length}곳 저장 (옛 법인 ${rows.length - out.length}곳 제외)`);
} catch (e) {
  console.log(`[build-corps] 실패(무시하고 계속): ${e.message}`);
}
