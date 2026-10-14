/**
 * FairGig PWA Service Worker (Production-Grade & Financial-Safe)
 *
 * CRITICAL SECURITY & DATA INTEGRITY POLICIES:
 * - NEVER cache JWTs, credentials, or authentication responses.
 * - NEVER cache financial API endpoints (/api/v1/earnings, /api/v1/analytics).
 * - NEVER cache grievances, personal earnings records, or verification results.
 * - NEVER cache Supabase storage or private evidence attachments.
 * - NEVER intercept non-GET requests (POST, PUT, DELETE, PATCH always pass through).
 * - All navigation requests are Network-First with /offline fallback when offline.
 * - Only versioned, public static assets (icons, manifest, offline UI) are cached.
 */

const CACHE_NAME = 'fairgig-pwa-v2';

const STATIC_PRECACHE = [
  '/offline',
  '/manifest.webmanifest',
  '/favicon.ico',
  '/icons/icon.svg',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/icon-maskable-512.png',
  '/icons/apple-touch-icon.png',
];

// URLs/patterns that must NEVER be cached under any circumstances
function isRestrictedResource(url) {
  const path = url.pathname.toLowerCase();

  // Authentication endpoints
  if (path.includes('/auth') || path.includes('/login') || path.includes('/register')) {
    return true;
  }

  // Financial & analytics APIs
  if (
    path.includes('/api/') ||
    path.includes('/earnings') ||
    path.includes('/analytics') ||
    path.includes('/shifts') ||
    path.includes('/anomalies') ||
    path.includes('/grievances') ||
    path.includes('/certificates') ||
    path.includes('/verification') ||
    path.includes('/evidence')
  ) {
    return true;
  }

  // External APIs (Supabase, Render backend microservices, etc.)
  if (
    url.hostname.includes('supabase') ||
    url.hostname.includes('onrender.com') ||
    url.hostname.includes('api.') ||
    url.port === '4000' ||
    url.port === '4001' ||
    url.port === '4002' ||
    url.port === '4003' ||
    url.port === '4004' ||
    url.port === '4005'
  ) {
    return true;
  }

  return false;
}

// 1. Install Phase
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(STATIC_PRECACHE);
      })
      .then(() => self.skipWaiting())
      .catch((err) => {
        console.warn('[FairGig SW] Precaching error:', err);
      })
  );
});

// 2. Activate Phase (purge old caches)
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cache) => {
            if (cache !== CACHE_NAME) {
              return caches.delete(cache);
            }
          })
        );
      })
      .then(() => self.clients.claim())
  );
});

// 3. Fetch Event Handler
self.addEventListener('fetch', (event) => {
  const req = event.request;

  // Strict Rule 1: Only handle GET requests
  if (req.method !== 'GET') {
    return;
  }

  const url = new URL(req.url);

  // Strict Rule 2: Skip non-HTTP(S) schemes (e.g. chrome-extension)
  if (!url.protocol.startsWith('http')) {
    return;
  }

  // Strict Rule 3: Never cache restricted financial/auth/API requests
  if (isRestrictedResource(url)) {
    event.respondWith(
      fetch(req).catch(() => {
        // Return 503 JSON if offline for API
        return new Response(
          JSON.stringify({
            error: 'Offline',
            message: 'Internet connection required to access real-time financial ledger.',
          }),
          {
            status: 503,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      })
    );
    return;
  }

  // Strict Rule 4: Navigation requests (HTML pages) - Network-First with /offline fallback
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req).catch(async () => {
        const cache = await caches.open(CACHE_NAME);
        const offlinePage = await cache.match('/offline');
        if (offlinePage) {
          return offlinePage;
        }
        return new Response('Internet connection required to view FairGig ledger.', {
          status: 503,
          headers: { 'Content-Type': 'text/plain; charset=utf-8' },
        });
      })
    );
    return;
  }

  // Strict Rule 5: Static assets (/_next/static/*, /icons/*, fonts)
  // Stale-While-Revalidate strategy to prevent trapping users on old deployment bundles
  if (url.pathname.startsWith('/_next/static/') || url.pathname.startsWith('/icons/')) {
    event.respondWith(
      caches.match(req).then((cachedResponse) => {
        const fetchPromise = fetch(req)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              const resClone = networkResponse.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(req, resClone));
            }
            return networkResponse;
          })
          .catch(() => cachedResponse);

        return cachedResponse || fetchPromise;
      })
    );
    return;
  }

  // Default: Direct Network
  event.respondWith(fetch(req));
});

// 4. Message Handler
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
