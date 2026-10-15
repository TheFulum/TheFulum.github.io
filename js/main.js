(() => {
  'use strict';

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const wideScreen = window.matchMedia('(min-width: 960px)');
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
  const canObserve = 'IntersectionObserver' in window;

  const pluralRu = (n, one, few, many) => {
    const mod10 = n % 10;
    const mod100 = n % 100;
    if (mod10 === 1 && mod100 !== 11) return one;
    if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few;
    return many;
  };

  const STRINGS = {
    ru: {
      title: 'Липовский Даниил — fullstack-разработчик',
      description: 'Fullstack-разработчик из Беларуси: веб-сайты на C#, Python и PHP, Android-приложения на Java, облачные сервисы Firebase и Cloudflare.',
      age: (n) => `${n} ${pluralRu(n, 'год', 'года', 'лет')}`,
      themeToDark: 'Включить тёмную тему',
      themeToLight: 'Включить светлую тему',
      switchLang: 'Switch to English',
      projects: (n) => `${n} ${pluralRu(n, 'проект', 'проекта', 'проектов')}`,
      filtered: (name, count) => `${name}: ${count}.`,
      empty: (name) => `${name}: отдельного проекта с этой технологией в списке нет.`,
      onec: '1С:Предприятие: в колледже работал с версиями 7.7 и 8, отдельного проекта в списке нет.',
      mailSubject: 'Вакансия для Даниила Липовского',
      mailEmpty: 'Напишите пару слов или вставьте ссылку на вакансию.',
      mailOpened: 'Открываю почту с готовым письмом. Если ничего не произошло, напишите на lipouski.daniil@gmail.com.',
    },
    en: {
      title: 'Daniil Lipouski — Fullstack Developer',
      description: 'Fullstack developer from Belarus: websites in C#, Python and PHP, Android apps in Java, Firebase and Cloudflare cloud services.',
      age: (n) => String(n),
      themeToDark: 'Switch to dark theme',
      themeToLight: 'Switch to light theme',
      switchLang: 'Переключить на русский',
      projects: (n) => `${n} ${n === 1 ? 'project' : 'projects'}`,
      filtered: (name, count) => `${name}: ${count}.`,
      empty: (name) => `${name}: there is no separate project with it in this list.`,
      onec: '1C:Enterprise: I worked with versions 7.7 and 8 at college; there is no separate project in this list.',
      mailSubject: 'Job offer for Daniil Lipouski',
      mailEmpty: 'Write a few words or paste a link to the job post.',
      mailOpened: 'Opening your mail app with the letter ready. If nothing happens, write to lipouski.daniil@gmail.com.',
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
    const labelled = [...document.querySelectorAll('[data-aria-en]')];
    const images = [...document.querySelectorAll('img[data-alt-en]')];
    const fields = [...document.querySelectorAll('[data-placeholder-en]')];

    labelled.forEach((element) => { element.dataset.ariaRu = element.getAttribute('aria-label') || ''; });
    images.forEach((image) => { image.dataset.altRu = image.getAttribute('alt') || ''; });

    const apply = () => {
      const en = lang() === 'en';
      document.title = t().title;
      if (description) description.setAttribute('content', t().description);
      labelled.forEach((element) => element.setAttribute('aria-label', en ? element.dataset.ariaEn : element.dataset.ariaRu));
      images.forEach((image) => image.setAttribute('alt', en ? image.dataset.altEn : image.dataset.altRu));
      fields.forEach((field) => field.setAttribute('placeholder', en ? field.dataset.placeholderEn : field.dataset.placeholderRu));
    };

    apply();
    onLangChange(apply);
  }

  function initAge() {
    const targets = [...document.querySelectorAll('[data-age]')];
    if (!targets.length) return;

    const birth = new Date(2005, 5, 20);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    if (today.getMonth() < birth.getMonth() || (today.getMonth() === birth.getMonth() && today.getDate() < birth.getDate())) age -= 1;

    targets.forEach((target) => {
      const en = target.closest('[data-lang="en"]');
      target.textContent = en ? STRINGS.en.age(age) : STRINGS.ru.age(age);
    });
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
      button.setAttribute('aria-label', theme.current() === 'dark' ? t().themeToLight : t().themeToDark);
    };

    updateLabel();
    button.addEventListener('click', () => {
      theme.toggle();
      updateLabel();
    });
    theme.onSystemChange(updateLabel);
    onLangChange(updateLabel);
  }

  function initStage() {
    const layers = [...document.querySelectorAll('.stage__layer')];
    const sections = [...document.querySelectorAll('[data-stage]')];
    if (!layers.length || !sections.length || !canObserve) return;

    let current = 'map';

    const show = (name) => {
      if (name === current) return;
      current = name;
      layers.forEach((layer) => layer.classList.toggle('is-on', layer.dataset.layer === name));
      document.dispatchEvent(new CustomEvent('stagechange', { detail: name }));
    };

    const observer = new IntersectionObserver((entries) => {
      if (!wideScreen.matches) return;
      entries.forEach((entry) => {
        if (entry.isIntersecting) show(entry.target.dataset.stage);
      });
    }, { rootMargin: '-48% 0px -48% 0px' });

    sections.forEach((section) => observer.observe(section));
    wideScreen.addEventListener('change', () => { if (!wideScreen.matches) show('map'); });
  }

  function initShowcase() {
    const section = document.getElementById('traces');
    const tabs = [...document.querySelectorAll('.tab[data-shot]')];
    const shots = [...document.querySelectorAll('.shot[data-shot]')];
    const plates = [...document.querySelectorAll('.plate[data-plate]')];
    if (!section || !tabs.length) return;

    let index = 0;
    let timer = 0;
    let userChose = false;
    let inView = false;

    const videos = [...document.querySelectorAll('video.clip')];
    if (reducedMotion) videos.forEach((video) => { video.controls = true; });

    const syncVideos = () => {
      videos.forEach((video) => {
        const figure = video.closest('figure');
        const layer = video.closest('.stage__layer');
        const visible = figure && figure.classList.contains('is-on') && video.getClientRects().length > 0;
        const layerOn = layer ? layer.classList.contains('is-on') && wideScreen.matches : inView;
        if (!reducedMotion && visible && layerOn && !document.hidden) {
          if (video.paused) video.play().catch(() => {});
        } else if (!video.paused) {
          video.pause();
        }
      });
    };

    const select = (next) => {
      index = (next + tabs.length) % tabs.length;
      const name = tabs[index].dataset.shot;
      tabs.forEach((tab, i) => tab.setAttribute('aria-pressed', String(i === index)));
      shots.forEach((shot) => shot.classList.toggle('is-on', shot.dataset.shot === name));
      plates.forEach((plate) => plate.classList.toggle('is-on', plate.dataset.plate === name));
      if (name === 'route') videos.forEach((video) => { if (video.readyState > 0) video.currentTime = 0; });
      syncVideos();
    };

    document.addEventListener('stagechange', syncVideos);
    wideScreen.addEventListener('change', syncVideos);

    const holdFor = (name) => (name === 'route' ? 12000 : 5600);

    const stop = () => {
      clearTimeout(timer);
      timer = 0;
    };

    const schedule = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        select(index + 1);
        schedule();
      }, holdFor(tabs[index].dataset.shot));
    };

    const start = () => {
      if (timer || userChose || reducedMotion || !inView || document.hidden) return;
      schedule();
    };

    tabs.forEach((tab, i) => {
      tab.addEventListener('click', () => {
        userChose = true;
        stop();
        select(i);
      });
      tab.addEventListener('keydown', (event) => {
        if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return;
        event.preventDefault();
        userChose = true;
        stop();
        select(index + (event.key === 'ArrowRight' ? 1 : -1));
        tabs[index].focus();
      });
    });

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) stop();
      else start();
      syncVideos();
    });

    if (canObserve) {
      new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          inView = entry.isIntersecting;
          if (inView) start();
          else stop();
          syncVideos();
        });
      }, { threshold: 0.25 }).observe(section);
    }

    select(0);
  }

  function initMetro() {
    const stations = [...document.querySelectorAll('.station[data-tech], .station-btn[data-tech]')];
    const entries = [...document.querySelectorAll('.entry[data-tech]')];
    const groups = [...document.querySelectorAll('.ledger__group')];
    const status = document.getElementById('work-status');
    const statusText = document.getElementById('work-status-text');
    const reset = document.getElementById('work-reset');
    const work = document.getElementById('work');
    const svgStations = [...document.querySelectorAll('.station[data-tech]')];
    if (!stations.length || !entries.length) return;

    const metro = document.querySelector('.metro');
    if (metro && reducedMotion && typeof metro.pauseAnimations === 'function') metro.pauseAnimations();

    let active = null;

    const techOf = (entry) => entry.dataset.tech.split(/\s+/);

    const labelOf = (tech) => {
      const source = document.querySelector(`.station-btn[data-tech="${tech}"]`);
      if (!source) return tech;
      const localized = source.querySelector(`[data-lang="${lang()}"]`);
      return (localized || source).textContent.trim();
    };

    const render = () => {
      stations.forEach((station) => {
        const on = active !== null && station.dataset.tech === active;
        station.classList.toggle('is-active', on);
        station.setAttribute('aria-pressed', String(on));
      });

      const filtering = active !== null && active !== 'all';
      let count = 0;
      entries.forEach((entry) => {
        const match = !filtering || techOf(entry).includes(active);
        entry.hidden = !match;
        if (match) count += 1;
      });
      groups.forEach((group) => {
        group.hidden = filtering && !group.querySelector('.entry:not([hidden])');
      });

      if (!status || !statusText) return;
      status.hidden = !filtering;
      if (!filtering) return;
      const name = labelOf(active);
      if (count) statusText.textContent = t().filtered(name, t().projects(count));
      else statusText.textContent = active === 'onec' ? t().onec : t().empty(name);
    };

    const choose = (tech) => {
      active = active === tech || tech === 'all' ? null : tech;
      render();
      if (active === null || !work) return;
      const box = work.getBoundingClientRect();
      if (box.top > window.innerHeight * 0.6 || box.bottom < 0) {
        work.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'start' });
      }
    };

    stations.forEach((station) => {
      station.addEventListener('click', () => choose(station.dataset.tech));
      if (station.tagName.toLowerCase() === 'g') {
        station.addEventListener('keydown', (event) => {
          if (event.key !== 'Enter' && event.key !== ' ') return;
          event.preventDefault();
          choose(station.dataset.tech);
        });
      }
    });

    if (reset) {
      reset.addEventListener('click', () => {
        active = null;
        render();
      });
    }

    const light = (techs) => {
      svgStations.forEach((station) => station.classList.toggle('is-lit', techs.includes(station.dataset.tech)));
    };

    entries.forEach((entry) => {
      const row = entry.querySelector('.entry__row');
      if (!row) return;
      const techs = techOf(entry);
      row.addEventListener('mouseenter', () => { if (finePointer.matches) light(techs); });
      row.addEventListener('mouseleave', () => light([]));
      row.addEventListener('focus', () => light(techs));
      row.addEventListener('blur', () => light([]));
    });

    const jobs = [...document.querySelectorAll('.item[data-tech]')];
    if (jobs.length && canObserve) {
      const reading = new Set();
      const jobObserver = new IntersectionObserver((records) => {
        records.forEach((record) => {
          if (record.isIntersecting) reading.add(record.target);
          else reading.delete(record.target);
        });
        const current = [...reading].pop();
        light(current ? techOf(current) : []);
      }, { rootMargin: '-45% 0px -45% 0px' });
      jobs.forEach((job) => jobObserver.observe(job));
    }

    const updateLabels = () => {
      svgStations.forEach((station) => {
        const tech = station.dataset.tech;
        station.setAttribute('aria-label', tech === 'all' ? 'Fullstack' : labelOf(tech));
      });
      render();
    };

    updateLabels();
    onLangChange(updateLabels);
  }

  function initLedger() {
    document.querySelectorAll('.entry').forEach((entry) => {
      const row = entry.querySelector('.entry__row');
      if (!row) return;
      row.addEventListener('click', () => {
        const open = !entry.classList.contains('is-open');
        entry.classList.toggle('is-open', open);
        row.setAttribute('aria-expanded', String(open));
      });
    });
  }

  function initReveal() {
    const items = [...document.querySelectorAll('[data-reveal]')];
    if (!items.length || reducedMotion || !canObserve) return;

    const observer = new IntersectionObserver((entries) => {
      let order = 0;
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.style.transitionDelay = `${Math.min(order, 8) * 70}ms`;
        entry.target.classList.add('is-in');
        observer.unobserve(entry.target);
        order += 1;
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });

    document.documentElement.classList.add('reveal-ready');
    items.forEach((item) => observer.observe(item));
  }

  function initContact() {
    const form = document.getElementById('contact-form');
    const field = document.getElementById('contact-message');
    const hint = document.getElementById('contact-hint');
    if (!form || !field || !hint) return;

    const original = hint.innerHTML;

    form.addEventListener('submit', (event) => {
      event.preventDefault();
      const message = field.value.trim();
      if (!message) {
        hint.textContent = t().mailEmpty;
        hint.classList.add('is-error');
        field.focus();
        return;
      }
      hint.textContent = t().mailOpened;
      hint.classList.remove('is-error');
      const href = `mailto:lipouski.daniil@gmail.com?subject=${encodeURIComponent(t().mailSubject)}&body=${encodeURIComponent(message)}`;
      window.location.href = href;
    });

    field.addEventListener('input', () => {
      if (!hint.classList.contains('is-error')) return;
      hint.classList.remove('is-error');
      hint.innerHTML = original;
    });

    onLangChange(() => {
      hint.classList.remove('is-error');
      hint.innerHTML = original;
    });
  }

  initYear();
  initDocumentText();
  initAge();
  initLangToggle();
  initThemeToggle();
  initStage();
  initShowcase();
  initMetro();
  initLedger();
  initReveal();
  initContact();
})();
