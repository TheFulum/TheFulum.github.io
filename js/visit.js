(function () {
  var ENDPOINT = 'https://thefulum-site.lipouski-daniil.workers.dev/v';
  var ID_KEY = 'visitor-id';
  var SKIP_KEY = 'visit-skip';
  var TOGGLE_HASH = '#toggle-visit';

  function storage(action, key, value) {
    try {
      if (action === 'get') return localStorage.getItem(key);
      if (action === 'set') localStorage.setItem(key, value);
      if (action === 'remove') localStorage.removeItem(key);
    } catch (e) {}
    return null;
  }

  if (location.hash === TOGGLE_HASH) {
    var skipping = storage('get', SKIP_KEY) === '1';
    if (skipping) storage('remove', SKIP_KEY);
    else storage('set', SKIP_KEY, '1');
    var english = document.documentElement.lang === 'en';
    alert(skipping
      ? (english ? 'Visit counting is enabled again in this browser.' : 'Подсчёт визитов в этом браузере снова включён.')
      : (english ? 'Your visits in this browser are no longer counted.' : 'Ваши визиты в этом браузере больше не учитываются.'));
    history.replaceState(null, '', location.pathname + location.search);
    return;
  }

  if (storage('get', SKIP_KEY) === '1') return;

  function visitorId() {
    var id = storage('get', ID_KEY);
    if (!id) {
      id = window.crypto && crypto.randomUUID
        ? crypto.randomUUID()
        : Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 12);
      storage('set', ID_KEY, id);
    }
    return id;
  }

  var timeZone = '';
  try { timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || ''; } catch (e) {}

  var body = JSON.stringify({
    vid: visitorId(),
    path: location.pathname + location.search,
    ref: document.referrer,
    lang: navigator.language || '',
    siteLang: document.documentElement.lang || '',
    screen: screen.width + 'x' + screen.height,
    tz: timeZone
  });

  if (navigator.sendBeacon && navigator.sendBeacon(ENDPOINT, new Blob([body], { type: 'text/plain' }))) return;
  if (window.fetch) fetch(ENDPOINT, { method: 'POST', body: body, mode: 'no-cors', keepalive: true }).catch(function () {});
})();
