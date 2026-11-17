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
  const re = /<list>\s*<corp_code>(\d+)<\/corp_code>\s*<corp_name>([^<]*)<\/corp_name>\s*<stock_code>\s*([^<]*?)\s*<\/stock_code>/g;
  let m;
  while ((m = re.exec(xml))) if (m[3]) rows.push([m[1], m[2], m[3]]);
  if (rows.length === 0) throw new Error("상장사 0건");
  writeFileSync(new URL("../src/data/corps.json", import.meta.url), JSON.stringify(rows));
  console.log(`[build-corps] 상장사 ${rows.length}곳 저장`);
} catch (e) {
  console.log(`[build-corps] 실패(무시하고 계속): ${e.message}`);
}
