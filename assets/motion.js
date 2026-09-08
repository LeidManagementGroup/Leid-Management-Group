(() => {
  'use strict';
  const root = document.documentElement;
  const hero = document.querySelector('.hero');
  const header = document.querySelector('.site-header');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const desktop = matchMedia('(min-width: 801px) and (hover: hover) and (pointer: fine)');
  const workflow = document.querySelector('#lead-workflow');
  const steps = [...document.querySelectorAll('[data-workflow-step]')];
  let cleanMotion = () => {}, cleanPointer = () => {};
  let scrollFrame = 0, pageHeight = 1, heroHeight = 1, heroVisible = true;

  function updateScroll() {
    scrollFrame = 0;
    const y = Math.max(0, scrollY);
    header?.classList.toggle('is-scrolled', y > 22);
    root.style.setProperty('--scroll-progress', Math.min(1, y / pageHeight).toFixed(4));
    if (!reduced.matches && desktop.matches && heroVisible) {
      const p = Math.min(1, y / heroHeight);
      hero?.style.setProperty('--hero-parallax', (p * 32).toFixed(1) + 'px');
      hero?.style.setProperty('--grid-parallax', (p * -20).toFixed(1) + 'px');
    }
  }
  function scheduleScroll() {
    if (!scrollFrame) scrollFrame = requestAnimationFrame(updateScroll);
  }
  function measure() {
    pageHeight = Math.max(1, root.scrollHeight - innerHeight);
    heroHeight = hero?.offsetHeight || innerHeight;
    scheduleScroll();
  }
  addEventListener('scroll', scheduleScroll, { passive: true });
  addEventListener('resize', measure, { passive: true });
  addEventListener('load', measure, { once: true });
  if ('ResizeObserver' in window) new ResizeObserver(measure).observe(document.body);
  document.addEventListener('visibilitychange', () => {
    root.classList.toggle('page-hidden', document.hidden);
    if (!document.hidden) scheduleScroll();
  });

  function setupMotion() {
    cleanMotion();
    if (reduced.matches || !('IntersectionObserver' in window)) return;
    const timers = new Set(), observers = [], targets = [];
    const later = (fn, ms) => {
      const id = setTimeout(() => { timers.delete(id); fn(); }, ms);
      timers.add(id);
    };
    const reveal = node => node.classList.add('is-visible');
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          reveal(entry.target);
          observer.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -7% 0px', threshold: .01 });
    observers.push(observer);
    const groups = [
      ['#services .section-heading', 'mask'], ['.service-card', 'rise'],
      ['.lead-workflow__header', 'left'], ['#pricing .section-heading', 'right'],
      ['.pricing-group-heading', 'rise'], ['.pricing-card', 'scale'],
      ['#portfolio .section-heading', 'mask'], ['.example-card', 'alternate'],
      ['#how-i-work .section-heading', 'left'], ['.steps-grid > li', 'rise'],
      ['.tools', 'mask'], ['.about-portrait', 'mask'], ['.about-copy', 'right'],
      ['.faq-intro', 'left'], ['.faq-item', 'rise'], ['.contact-inner', 'scale']
    ];
    groups.forEach(([selector, type]) => {
      document.querySelectorAll(selector).forEach((node, index) => {
        node.dataset.reveal = type === 'alternate' ? (index % 2 ? 'right' : 'left') : type;
        node.style.setProperty('--reveal-delay', (index % 3) * 85 + 'ms');
        node.classList.add('reveal-ready');
        targets.push(node);
        if (node.getBoundingClientRect().top < innerHeight * .90) reveal(node);
        else observer.observe(node);
      });
    });
    if (scrollY < 80 && (!location.hash || location.hash === '#home')) {
      hero?.classList.add('hero-enter');
      later(() => hero?.classList.remove('hero-enter'), 1900);
    }
    const atmosphereObserver = new IntersectionObserver(entries => {
      heroVisible = entries[0].isIntersecting;
      root.classList.toggle('hero-in-view', heroVisible);
      if (heroVisible) scheduleScroll();
    });
    if (hero) atmosphereObserver.observe(hero);
    observers.push(atmosphereObserver);
    workflow?.classList.add('motion-ready');
    const workflowObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const index = steps.indexOf(entry.target);
        later(() => {
          entry.target.classList.add('is-active');
          steps.slice(0, index).forEach(previous => previous.classList.add('is-connected'));
        }, desktop.matches ? index * 180 : 0);
        workflowObserver.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -15% 0px', threshold: .15 });
    observers.push(workflowObserver);
    steps.forEach(step => {
      if (step.getBoundingClientRect().bottom < 0) step.classList.add('is-active', 'is-connected');
      else workflowObserver.observe(step);
    });
    const focused = event => {
      let node = event.target;
      while (node && node !== document.body) {
        if (node.classList?.contains('reveal-ready')) { reveal(node); observer.unobserve(node); }
        node = node.parentElement;
      }
    };
    document.addEventListener('focusin', focused);
    cleanMotion = () => {
      timers.forEach(clearTimeout);
      observers.forEach(item => item.disconnect());
      document.removeEventListener('focusin', focused);
      targets.forEach(node => {
        node.classList.remove('reveal-ready', 'is-visible');
        delete node.dataset.reveal;
        node.style.removeProperty('--reveal-delay');
      });
      hero?.classList.remove('hero-enter');
      root.classList.remove('hero-in-view');
      workflow?.classList.remove('motion-ready');
      steps.forEach(step => step.classList.remove('is-active', 'is-connected'));
    };
  }

  function setupPointer() {
    cleanPointer();
    hero?.style.removeProperty('--hero-parallax');
    hero?.style.removeProperty('--grid-parallax');
    if (reduced.matches || !desktop.matches) return;
    const removers = [];
    function track(node, kind) {
      if (!node) return;
      let frame = 0, point, rect;
      const props = kind === 'card' ? ['--tilt-x', '--tilt-y', '--card-x', '--card-y'] : kind === 'button' ? ['--magnet-x', '--magnet-y'] : ['--glow-x', '--glow-y'];
      const reset = () => {
        cancelAnimationFrame(frame); frame = 0; rect = null;
        props.forEach(prop => node.style.removeProperty(prop));
        node.classList.remove('pointer-active');
      };
      const render = () => {
        frame = 0;
        if (!point || !rect) return;
        const x = Math.max(0, Math.min(1, (point.x - rect.left) / rect.width));
        const y = Math.max(0, Math.min(1, (point.y - rect.top) / rect.height));
        if (kind === 'card') {
          node.style.setProperty('--tilt-x', ((.5 - y) * 6).toFixed(2) + 'deg');
          node.style.setProperty('--tilt-y', ((x - .5) * 6).toFixed(2) + 'deg');
          node.style.setProperty('--card-x', x * 100 + '%');
          node.style.setProperty('--card-y', y * 100 + '%');
        } else if (kind === 'button') {
          node.style.setProperty('--magnet-x', ((x - .5) * 10).toFixed(1) + 'px');
          node.style.setProperty('--magnet-y', ((y - .5) * 8).toFixed(1) + 'px');
        } else {
          const target = kind === 'hero' ? node.querySelector('.hero-atmosphere') : node;
          const local = target.getBoundingClientRect();
          node.style.setProperty('--glow-x', point.x - local.left + 'px');
          node.style.setProperty('--glow-y', point.y - local.top + 'px');
          node.classList.add('pointer-active');
        }
      };
      const move = event => {
        if (event.pointerType === 'touch') return;
        rect ||= node.getBoundingClientRect();
        point = { x: event.clientX, y: event.clientY };
        if (!frame) frame = requestAnimationFrame(render);
      };
      node.addEventListener('pointermove', move, { passive: true });
      node.addEventListener('pointerleave', reset);
      const invalidate = () => { rect = null; };
      addEventListener('scroll', invalidate, { passive: true });
      removers.push(() => {
        reset();
        node.removeEventListener('pointermove', move);
        node.removeEventListener('pointerleave', reset);
        removeEventListener('scroll', invalidate);
      });
    }
    document.querySelectorAll('.service-card').forEach(node => track(node, 'card'));
    document.querySelectorAll('.button').forEach(node => track(node, 'button'));
    track(hero, 'hero');
    track(document.querySelector('.contact'), 'contact');
    cleanPointer = () => removers.forEach(remove => remove());
  }
  reduced.addEventListener('change', () => { setupMotion(); setupPointer(); measure(); });
  desktop.addEventListener('change', () => { setupPointer(); measure(); });
  addEventListener('hashchange', measure);
  setupMotion();
  setupPointer();
  measure();
})();

