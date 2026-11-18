// 공시 위험 이름표(classify.ts의 label)에 관련 법령을 연결합니다.
// 국가법령정보센터(law.go.kr)의 공식 주소 형식을 쓰므로 인증키가 필요 없습니다.
// 법령 이름은 공백 없이, 조문은 "제416조"처럼 씁니다. 조문이 없으면 법령 전체 화면으로 갑니다.

export interface LawRef {
  /** 화면에 보이는 짧은 이름 (예: 상법 제416조) */
  text: string;
  url: string;
}

const CMA = "자본시장과금융투자업에관한법률";
const CMA_SHORT = "자본시장법";

function ref(law: string, article?: string, shortName?: string): LawRef {
  const base = `https://www.law.go.kr/법령/${encodeURIComponent(law)}`;
  return {
    text: `${shortName ?? law}${article ? ` ${article}` : ""}`,
    url: article ? `${base}/${encodeURIComponent(article)}` : base,
  };
}

const cma = (article: string) => ref(CMA, article, CMA_SHORT);

const MAP: Record<string, LawRef[]> = {
  "횡령·배임": [ref("형법", "제355조"), ref("특정경제범죄가중처벌등에관한법률", "제3조", "특정경제범죄법")],
  "상장 위험": [cma("제390조")],
  "감사의견": [ref("주식회사등의외부감사에관한법률", undefined, "외부감사법")],
  "도산 위험": [ref("채무자회생및파산에관한법률", undefined, "채무자회생법")],
  "불성실공시": [cma("제391조")],
  "유상증자": [ref("상법", "제416조"), cma("제165조의6")],
  "감자": [ref("상법", "제438조")],
  "메자닌 발행": [ref("상법", "제513조"), ref("상법", "제516조의2"), cma("제165조의10")],
  "소송": [cma("제161조")],
  "최대주주·경영권": [cma("제147조")],
  "손실·영업정지": [cma("제161조")],
  "담보·보증": [cma("제161조")],
  "참고": [cma("제165조의3"), cma("제173조")],
};

/** 이름표들에 해당하는 관련 법령 (중복 제거) */
export function lawsFor(labels: string[]): LawRef[] {
  const seen = new Set<string>();
  const out: LawRef[] = [];
  for (const l of labels) {
    for (const r of MAP[l] ?? []) {
      if (!seen.has(r.url)) {
        seen.add(r.url);
        out.push(r);
      }
    }
  }
  return out;
}
