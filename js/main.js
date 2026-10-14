(() => {
  'use strict';

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const canObserve = 'IntersectionObserver' in window;

  const pluralizeYearsRu = (n) => {
    const mod10 = n % 10;
    const mod100 = n % 100;
    if (mod10 === 1 && mod100 !== 11) return 'год';
    if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return 'года';
    return 'лет';
  };

  const STRINGS = {
    ru: {
      title: 'Липовский Даниил — fullstack-разработчик',
      description: 'Fullstack-разработчик из Беларуси: веб-сайты на C#, Python и PHP, Android-приложения на Java, облачные сервисы Firebase и Cloudflare.',
      age: (n) => ` (${n} ${pluralizeYearsRu(n)})`,
      themeToDark: 'Включить тёмную тему',
      themeToLight: 'Включить светлую тему',
      switchLang: 'Switch to English',
      prevPage: 'Предыдущая страница',
      nextPage: 'Следующая страница',
      page: (n) => `Страница ${n}`,
      shownAll: (total) => `Показано проектов: ${total}`,
      shownRange: (from, to, total, page, pages) => `Проекты ${from}–${to} из ${total}, страница ${page} из ${pages}`,
    },
    en: {
      title: 'Daniil Lipouski — Fullstack Developer',
      description: 'Fullstack developer from Belarus: websites in C#, Python and PHP, Android apps in Java, Firebase and Cloudflare cloud services.',
      age: (n) => ` (${n} ${n === 1 ? 'year' : 'years'} old)`,
      themeToDark: 'Switch to dark theme',
      themeToLight: 'Switch to light theme',
      switchLang: 'Переключить на русский',
      prevPage: 'Previous page',
      nextPage: 'Next page',
      page: (n) => `Page ${n}`,
      shownAll: (total) => `Projects shown: ${total}`,
      shownRange: (from, to, total, page, pages) => `Projects ${from}–${to} of ${total}, page ${page} of ${pages}`,
    },
  };

  const lang = () => (window.siteLang ? window.siteLang.current() : 'ru');
  const t = () => STRINGS[lang()];
  const onLangChange = (callback) => document.addEventListener('langchange', callback);

  function initYear() {
    const year = document.getElementById('year');
    if (year) year.textContent = new Date().getFullYear();
  }

  function initDocumentText() {
    const description = document.querySelector('meta[name="description"]');
    document.querySelectorAll('[data-aria-en]').forEach((element) => {
      element.dataset.ariaRu = element.getAttribute('aria-label') || '';
    });

    const apply = () => {
      document.title = t().title;
      if (description) description.setAttribute('content', t().description);
      document.querySelectorAll('[data-aria-en]').forEach((element) => {
        element.setAttribute('aria-label', lang() === 'en' ? element.dataset.ariaEn : element.dataset.ariaRu);
      });
    };

    apply();
    onLangChange(apply);
  }

  function initAge() {
    const birth = document.getElementById('birth-date');
    const target = document.getElementById('age');
    if (!birth || !target) return;

    const [year, month, day] = birth.getAttribute('datetime').split('-').map(Number);
    const today = new Date();
    let age = today.getFullYear() - year;
    if (today.getMonth() + 1 < month || (today.getMonth() + 1 === month && today.getDate() < day)) age -= 1;

    const apply = () => { target.textContent = t().age(age); };
    apply();
    onLangChange(apply);
  }

  function initLangToggle() {
    const button = document.getElementById('lang-toggle');
    if (!button || !window.siteLang) return;

    const updateLabel = () => button.setAttribute('aria-label', t().switchLang);

    updateLabel();
    onLangChange(updateLabel);
    button.addEventListener('click', () => {
      window.siteLang.toggle();
      if (reducedMotion) return;
      button.classList.remove('is-switching');
      void button.offsetWidth;
      button.classList.add('is-switching');
    });
    button.addEventListener('animationend', (event) => {
      if (event.animationName === 'globe-spin') button.classList.remove('is-switching');
    });
  }

  function initThemeToggle() {
    const button = document.getElementById('theme-toggle');
    const theme = window.siteTheme;
    if (!button || !theme) return;

    const updateLabel = () => {
      const isDark = theme.current() === 'dark';
      button.setAttribute('aria-label', isDark ? t().themeToLight : t().themeToDark);
    };

    updateLabel();
    button.addEventListener('click', () => {
      theme.toggle();
      updateLabel();
    });
    theme.onSystemChange(updateLabel);
    onLangChange(updateLabel);
  }

  function initProjects() {
    const panel = document.getElementById('project-filters');
    const pager = document.getElementById('project-pagination');
    const status = document.getElementById('filter-status');
    const grid = document.getElementById('project-grid');
    const cards = [...document.querySelectorAll('#project-grid [data-category]')];
    if (!panel || !pager || !grid || !cards.length) return;

    const pageSize = () => {
      const columns = getComputedStyle(grid).gridTemplateColumns.split(' ').filter(Boolean).length;
      return columns > 1 ? 6 : 4;
    };

    const buttons = [...panel.querySelectorAll('[data-filter]')];
    const matches = (card, filter) => filter === 'all' || card.dataset.category === filter;
    const state = { filter: 'all', page: 1, size: pageSize() };

    const pageButton = (label, page, { current = false, disabled = false, ariaLabel } = {}) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'pagination__btn';
      button.textContent = label;
      button.disabled = disabled;
      if (ariaLabel) button.setAttribute('aria-label', ariaLabel);
      if (current) button.setAttribute('aria-current', 'page');
      button.addEventListener('click', () => {
        state.page = page;
        render();
        panel.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'start' });
      });
      return button;
    };

    const renderPager = (pages) => {
      pager.replaceChildren();
      pager.hidden = pages < 2;
      if (pages < 2) return;

      pager.append(pageButton('←', state.page - 1, { disabled: state.page === 1, ariaLabel: t().prevPage }));
      for (let page = 1; page <= pages; page += 1) {
        pager.append(pageButton(String(page), page, { current: page === state.page, ariaLabel: t().page(page) }));
      }
      pager.append(pageButton('→', state.page + 1, { disabled: state.page === pages, ariaLabel: t().nextPage }));
    };

    const render = () => {
      const visible = cards.filter((card) => matches(card, state.filter));
      const pages = Math.max(1, Math.ceil(visible.length / state.size));
      state.page = Math.min(state.page, pages);
      const start = (state.page - 1) * state.size;
      const shown = new Set(visible.slice(start, start + state.size));

      cards.forEach((card) => { card.hidden = !shown.has(card); });
      renderPager(pages);
      if (status) {
        status.textContent = pages > 1
          ? t().shownRange(start + 1, start + shown.size, visible.length, state.page, pages)
          : t().shownAll(visible.length);
      }
    };

    buttons.forEach((button) => {
      const { filter } = button.dataset;
      const counter = button.querySelector('.filter__count');
      if (counter) counter.textContent = cards.filter((card) => matches(card, filter)).length;

      button.addEventListener('click', () => {
        buttons.forEach((other) => other.setAttribute('aria-pressed', String(other === button)));
        state.filter = filter;
        state.page = 1;
        render();
      });
    });

    let resizeFrame = 0;
    window.addEventListener('resize', () => {
      cancelAnimationFrame(resizeFrame);
      resizeFrame = requestAnimationFrame(() => {
        const size = pageSize();
        if (size === state.size) return;
        const firstIndex = (state.page - 1) * state.size;
        state.size = size;
        state.page = Math.floor(firstIndex / size) + 1;
        render();
      });
    });

    panel.hidden = false;
    render();
    onLangChange(render);
  }

  function initReveal() {
    if (reducedMotion || !canObserve) return;

    const items = document.querySelectorAll('.featured, .card, .stack-row, .timeline__item, .lang, .contact-card');
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.12 });

    items.forEach((item) => {
      item.classList.add('reveal');
      observer.observe(item);
    });
  }

  function animateNumber(element, duration = 1200) {
    const target = Number(element.dataset.count);
    const start = performance.now();

    const step = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - (1 - progress) ** 3;
      element.textContent = Math.round(target * eased);
      if (progress < 1) requestAnimationFrame(step);
    };

    requestAnimationFrame(step);
  }

  function initCounters() {
    if (reducedMotion || !canObserve) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        animateNumber(entry.target);
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.6 });

    document.querySelectorAll('[data-count]').forEach((element) => observer.observe(element));
  }

  function initNavHighlight() {
    if (!canObserve) return;

    const links = [...document.querySelectorAll('.site-nav a')];
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        links.forEach((link) => {
          const active = link.hash === `#${entry.target.id}`;
          link.classList.toggle('is-active', active);
          if (active) link.setAttribute('aria-current', 'true');
          else link.removeAttribute('aria-current');
        });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });

    links.forEach((link) => {
      const section = document.querySelector(link.hash);
      if (section) observer.observe(section);
    });
  }

  initYear();
  initDocumentText();
  initAge();
  initLangToggle();
  initThemeToggle();
  initProjects();
  initReveal();
  initCounters();
  initNavHighlight();
})();
