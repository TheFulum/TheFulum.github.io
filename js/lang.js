(function () {
  var STORAGE_KEY = 'lang';
  var SUPPORTED = ['ru', 'en'];
  var FALLBACK = 'en';
  var root = document.documentElement;

  function readSaved() {
    try { return localStorage.getItem(STORAGE_KEY); } catch (e) { return null; }
  }

  function save(lang) {
    try { localStorage.setItem(STORAGE_KEY, lang); } catch (e) {}
  }

  function detect() {
    var list = navigator.languages && navigator.languages.length ? navigator.languages : [navigator.language];
    for (var i = 0; i < list.length; i++) {
      var code = String(list[i] || '').toLowerCase().split('-')[0];
      if (SUPPORTED.indexOf(code) !== -1) return code;
    }
    return FALLBACK;
  }

  function current() {
    return root.lang === 'en' ? 'en' : 'ru';
  }

  function apply(lang) {
    root.lang = lang;
    document.dispatchEvent(new CustomEvent('langchange', { detail: lang }));
  }

  var saved = readSaved();
  root.lang = SUPPORTED.indexOf(saved) !== -1 ? saved : detect();

  window.siteLang = {
    current: current,

    toggle: function () {
      var next = current() === 'ru' ? 'en' : 'ru';
      save(next);
      apply(next);
      return next;
    }
  };
})();
