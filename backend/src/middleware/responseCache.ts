import { Request, Response, NextFunction } from 'express';

interface CacheEntry {
    data: any;
    expiry: number;
    etag: string;
}

const cache = new Map<string, CacheEntry>();
const DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Server-side response cache middleware for GET requests.
 * Caches master data endpoints (branches, service-types, rates, etc.)
 * Supports ETag-based conditional requests.
 */
export function responseCache(ttl: number = DEFAULT_TTL) {
    return (req: Request, res: Response, next: NextFunction): void => {
        // Only cache GET requests
        if (req.method !== 'GET') {
            // Invalidate cache for this resource on mutations
            if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
                const base = req.baseUrl || req.path;
                for (const key of cache.keys()) {
                    if (key.startsWith(base)) cache.delete(key);
                }
            }
            next();
            return;
        }

        const key = `${req.baseUrl}${req.path}?${JSON.stringify(req.query)}`;
        const entry = cache.get(key);

        // Check if client has a matching ETag
        if (entry && entry.expiry > Date.now()) {
            const clientEtag = req.headers['if-none-match'];
            if (clientEtag === entry.etag) {
                res.status(304).end();
                return;
            }
            res.set('ETag', entry.etag);
            res.set('X-Cache', 'HIT');
            res.set('Cache-Control', `private, max-age=${Math.floor(ttl / 1000)}`);
            res.json(entry.data);
            return;
        }

        // Override res.json to intercept and cache the response
        const originalJson = res.json.bind(res);
        res.json = function (body: any) {
            if (res.statusCode >= 200 && res.statusCode < 300) {
                const etag = `W/"${Date.now().toString(36)}"`;
                cache.set(key, { data: body, expiry: Date.now() + ttl, etag });
                res.set('ETag', etag);
                res.set('X-Cache', 'MISS');
                res.set('Cache-Control', `private, max-age=${Math.floor(ttl / 1000)}`);

                // Evict oldest entries if cache exceeds 500 entries
                if (cache.size > 500) {
                    const now = Date.now();
                    for (const [k, v] of cache) { if (v.expiry < now) cache.delete(k); }
                }
            }
            return originalJson(body);
        };

        next();
    };
}

/** Clear all cached responses */
export function clearResponseCache() {
    cache.clear();
}

/** Get cache stats */
export function getCacheStats() {
    return {
        size: cache.size,
        entries: Array.from(cache.keys()).slice(0, 20),
    };
}
