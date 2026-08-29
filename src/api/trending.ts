/**
 * Trending feed — DEFERRED.
 *
 * The types and the client surface are settled so the rest of the app can be
 * written against them; the fetch itself is not wired up yet. When it is, the
 * only change here is replacing the body of `fetchTrending`.
 *
 * Design rules this file exists to enforce:
 *   1. The app never calls a search provider directly — keys live on the proxy.
 *   2. An item with an empty `sources` array is dropped, not rendered.
 *   3. A stale cache is shown with its date, never disguised as current.
 */

export interface TrendingSource {
  title: string;
  publisher: string;
  url: string;
  publishedAt: string | null;
}

export interface TrendingDrink {
  id: string;
  rank: number;
  name: string;
  whyTrending: string;
  ingredientHints: string[];
  sources: TrendingSource[];
  /** 'single-source' items render with a caveat rather than being hidden. */
  confidence: 'multi-source' | 'single-source';
}

export interface TrendingFeed {
  generatedAt: string;
  ttlSeconds: number;
  region: string;
  items: TrendingDrink[];
  /** True when upstream failed and this is cached data past its TTL. */
  degraded: boolean;
}

/** Set once the proxy exists. Until then the tab shows its "not connected" state. */
export const TRENDING_ENDPOINT: string | null = null;

export type TrendingState =
  | { status: 'not-configured' }
  | { status: 'loading' }
  | { status: 'ok'; feed: TrendingFeed }
  | { status: 'stale'; feed: TrendingFeed }
  | { status: 'offline' }
  | { status: 'error'; message: string };

/** Drops anything the proxy let through without a citation. */
export function stripUncited(items: TrendingDrink[]): TrendingDrink[] {
  return items.filter((i) => i.sources.length > 0);
}

export async function fetchTrending(region = 'global'): Promise<TrendingState> {
  if (!TRENDING_ENDPOINT) return { status: 'not-configured' };

  try {
    const res = await fetch(`${TRENDING_ENDPOINT}?region=${encodeURIComponent(region)}`);
    if (!res.ok) return { status: 'error', message: `Feed returned ${res.status}` };

    const feed = (await res.json()) as TrendingFeed;
    feed.items = stripUncited(feed.items);
    return { status: feed.degraded ? 'stale' : 'ok', feed };
  } catch {
    return { status: 'offline' };
  }
}
