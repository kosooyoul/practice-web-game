const CACHE_NAME = 'webgame-v1';

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/andante/',
  '/andante/index.html',
  '/andante/src/main.js',
  '/andante/src/core/Game.js',
  '/andante/src/core/GameLoop.js',
  '/andante/src/core/Canvas.js',
  '/andante/src/core/Camera.js',
  '/andante/src/core/MapLoader.js',
  '/andante/src/core/BGMManager.js',
  '/andante/src/core/TransitionManager.js',
  '/andante/src/scenes/GameScene.js',
  '/andante/src/entities/Entity.js',
  '/andante/src/entities/Player.js',
  '/andante/src/entities/Platform.js',
  '/andante/src/entities/Item.js',
  '/andante/src/entities/TriggerZone.js',
  '/andante/src/entities/CharacterRenderer.js',
  '/andante/src/physics/PhysicsWorld.js',
  '/andante/src/physics/PhysicsBody.js',
  '/andante/src/physics/Collision.js',
  '/andante/src/input/InputManager.js',
  '/andante/src/input/Joypad.js',
  '/andante/src/background/BackgroundLayer.js',
  '/andante/src/animation/PendulumMotion.js',
  '/andante/src/assets/AssetManager.js',
  '/andante/src/assets/Assets.js',
  '/andante/src/config/constants.js',
  '/andante/src/config/itemTypes.js',
  '/andante/src/config/backgroundTypes.js',
  '/andante/src/config/recipes.js',
  '/andante/src/maps/index.js',
  '/andante/src/maps/stage1.js',
  '/andante/src/maps/stage2.js',
  '/andante/src/maps/stage3.js',
  '/andante/src/maps/stageLoop.js',
  '/andante/rsc/bgm/floatinggarden.mp3'
];

// Service Worker 설치 - 정적 에셋 캐싱
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] 캐시 열림');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('[SW] 모든 에셋 캐싱 완료');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('[SW] 캐싱 실패:', error);
      })
  );
});

// Service Worker 활성화 - 이전 캐시 정리
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((cacheName) => cacheName !== CACHE_NAME)
            .map((cacheName) => {
              console.log('[SW] 이전 캐시 삭제:', cacheName);
              return caches.delete(cacheName);
            })
        );
      })
      .then(() => {
        console.log('[SW] 활성화 완료');
        return self.clients.claim();
      })
  );
});

// 네트워크 요청 가로채기 - 캐시 우선 전략
self.addEventListener('fetch', (event) => {
  // 외부 리소스는 네트워크 우선
  if (!event.request.url.startsWith(self.location.origin)) {
    event.respondWith(
      fetch(event.request)
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // 내부 리소스는 캐시 우선, 네트워크 폴백
  event.respondWith(
    caches.match(event.request)
      .then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }

        return fetch(event.request)
          .then((networkResponse) => {
            // 유효한 응답만 캐싱
            if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
              return networkResponse;
            }

            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });

            return networkResponse;
          });
      })
      .catch(() => {
        // 오프라인 폴백 - HTML 요청시 메인 페이지 반환
        if (event.request.headers.get('accept')?.includes('text/html')) {
          return caches.match('/index.html');
        }
        return null;
      })
  );
});
