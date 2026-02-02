const CACHE_NAME = 'andante-v1';

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/src/main.js',
  '/src/core/Game.js',
  '/src/core/GameLoop.js',
  '/src/core/Canvas.js',
  '/src/core/Camera.js',
  '/src/core/MapLoader.js',
  '/src/core/BGMManager.js',
  '/src/core/TransitionManager.js',
  '/src/scenes/GameScene.js',
  '/src/entities/Entity.js',
  '/src/entities/Player.js',
  '/src/entities/Platform.js',
  '/src/entities/Item.js',
  '/src/entities/TriggerZone.js',
  '/src/entities/CharacterRenderer.js',
  '/src/physics/PhysicsWorld.js',
  '/src/physics/PhysicsBody.js',
  '/src/physics/Collision.js',
  '/src/input/InputManager.js',
  '/src/input/Joypad.js',
  '/src/background/BackgroundLayer.js',
  '/src/animation/PendulumMotion.js',
  '/src/assets/AssetManager.js',
  '/src/assets/Assets.js',
  '/src/config/constants.js',
  '/src/config/itemTypes.js',
  '/src/config/backgroundTypes.js',
  '/src/config/recipes.js',
  '/src/maps/index.js',
  '/src/maps/stage1.js',
  '/src/maps/stage2.js',
  '/src/maps/stage3.js',
  '/src/maps/stageLoop.js',
  '/rsc/bgm/floatinggarden.mp3'
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
