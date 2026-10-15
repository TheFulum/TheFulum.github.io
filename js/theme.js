(function () {
  var STORAGE_KEY = 'theme';
  var THEME_COLORS = { light: '#ecebe6', dark: '#141311' };
  var root = document.documentElement;
  var systemDark = window.matchMedia('(prefers-color-scheme: dark)');

  function readSaved() {
    try { return localStorage.getItem(STORAGE_KEY); } catch (e) { return null; }
  }

  function save(theme) {
    try { localStorage.setItem(STORAGE_KEY, theme); } catch (e) {}
  }

  function apply(theme) {
    root.dataset.theme = theme;
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', THEME_COLORS[theme]);
  }

  function current() {
    return root.dataset.theme === 'dark' ? 'dark' : 'light';
  }

  apply(readSaved() || (systemDark.matches ? 'dark' : 'light'));

  window.siteTheme = {
    current: current,

    toggle: function () {
      var next = current() === 'dark' ? 'light' : 'dark';
      apply(next);
      save(next);
      return next;
    },

    onSystemChange: function (callback) {
      systemDark.addEventListener('change', function (event) {
        if (readSaved()) return;
        apply(event.matches ? 'dark' : 'light');
        if (callback) callback();
      });
    }
  };
})();
