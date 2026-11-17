import { fetchMarketNews } from "@/lib/news";

export const maxDuration = 30;

export async function GET() {
  try {
    const items = await fetchMarketNews();
    return Response.json({ items });
  } catch (e) {
    return Response.json({ items: [], error: (e as Error).message });
  }
}
