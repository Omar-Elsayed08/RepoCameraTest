    (function () {
      const html = document.documentElement;
      const loader = document.getElementById('page-loader');
      if (!loader) return;

      const loaderT0 = window.__magnetLoaderT0 ?? performance.now();
      /** Slowest stroke: 666ms delay + 1333ms draw — one full forward pass */
      const MIN_DRAW_MS = 2350;

      function finishLoader() {
        html.classList.remove('page-loading');
        html.classList.add('page-loaded');
        loader.setAttribute('aria-busy', 'false');
      }

      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        window.addEventListener('load', () => requestAnimationFrame(finishLoader));
        return;
      }

      window.addEventListener('load', () => {
        const elapsed = performance.now() - loaderT0;
        const wait = Math.max(0, MIN_DRAW_MS - elapsed);
        window.setTimeout(finishLoader, wait);
      });
    })();

    (function () {
      const hamburger = document.getElementById('hamburger');
      const navLinks = document.getElementById('navLinks');
      if (!hamburger || !navLinks) return;

      const mobileNavQuery = window.matchMedia('(max-width: 900px)');
      const editionsToggle = document.getElementById('editionsToggle');
      const editionsDropdown = editionsToggle?.closest('.nav-dropdown');

      function closeEditionsDropdown() {
        if (!editionsDropdown || !editionsToggle) return;
        editionsDropdown.classList.remove('is-open');
        editionsToggle.setAttribute('aria-expanded', 'false');
      }

      function setMobileNav(open) {
        navLinks.classList.toggle('open', open);
        hamburger.classList.toggle('is-open', open);
        hamburger.setAttribute('aria-expanded', open ? 'true' : 'false');
        hamburger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
        document.body.classList.toggle('nav-open', open);
        if (!open) closeEditionsDropdown();
      }

      hamburger.addEventListener('click', () => {
        setMobileNav(!navLinks.classList.contains('open'));
      });

      document.addEventListener('keydown', (event) => {
        if (event.key !== 'Escape') return;
        if (editionsDropdown?.classList.contains('is-open')) {
          closeEditionsDropdown();
          editionsToggle?.focus();
          return;
        }
        if (navLinks.classList.contains('open')) {
          setMobileNav(false);
          hamburger.focus();
        }
      });

      document.addEventListener('click', (event) => {
        if (!editionsDropdown?.classList.contains('is-open')) return;
        const target = event.target;
        if (!(target instanceof Node)) return;
        if (!editionsDropdown.contains(target)) closeEditionsDropdown();
      });

      editionsToggle?.addEventListener('click', (event) => {
        event.stopPropagation();
        editionsDropdown?.classList.toggle('is-open');
        const open = Boolean(editionsDropdown?.classList.contains('is-open'));
        editionsToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      });

      navLinks.querySelectorAll('a').forEach((link) => {
        link.addEventListener('click', () => {
          setMobileNav(false);
          closeEditionsDropdown();
        });
      });

      mobileNavQuery.addEventListener('change', (event) => {
        if (!event.matches && navLinks.classList.contains('open')) {
          setMobileNav(false);
        }
        if (event.matches) closeEditionsDropdown();
      });
    })();

    (function () {
      const articles = document.querySelectorAll('.book-item--director');
      if (!articles.length) return;

      const isStackedCard = window.matchMedia('(max-width: 960px)');
      const prefersHoverExpand = window.matchMedia('(hover: hover) and (pointer: fine)');
      const refreshers = [];
      let resizeTimer;

      articles.forEach((article) => {
        const block = article.querySelector('.book-item-note');
        const clip = article.querySelector('.book-item-note-clip');
        const btn = article.querySelector('.book-read-more');
        const cover = article.querySelector('.book-item-cover');
        const body = article.querySelector('.book-item-body');
        const coverImg = cover?.querySelector('img');

        if (!block || !clip || !btn || !cover || !body) return;

        function measureExpandedHeight() {
          const inline = clip.style.maxHeight;
          clip.style.maxHeight = 'none';
          const full = clip.scrollHeight;
          clip.style.maxHeight = inline;
          block.style.setProperty('--note-expanded-h', full + 'px');
        }

        function applyBodyClamp() {
          if (!prefersHoverExpand.matches || isStackedCard.matches) {
            body.style.maxHeight = '';
            body.style.overflow = '';
            return;
          }
          if (block.classList.contains('book-item-note--open')) {
            body.style.maxHeight = '';
            body.style.overflow = '';
            return;
          }
          const h = cover.offsetHeight;
          if (h > 0) {
            body.style.maxHeight = h + 'px';
            body.style.overflow = 'hidden';
          } else {
            body.style.maxHeight = '';
            body.style.overflow = '';
          }
        }

        function setExpanded(open) {
          block.classList.toggle('book-item-note--open', open);
          btn.setAttribute('aria-expanded', open ? 'true' : 'false');
          btn.textContent = open ? 'Read less' : 'Read more';
          applyBodyClamp();
        }

        function refresh() {
          measureExpandedHeight();
          applyBodyClamp();
        }

        refreshers.push(refresh);
        refresh();

        if (coverImg && !coverImg.complete) {
          coverImg.addEventListener('load', refresh);
        }

        btn.addEventListener('click', (e) => {
          e.preventDefault();
          setExpanded(!block.classList.contains('book-item-note--open'));
        });

        if (prefersHoverExpand.matches && !isStackedCard.matches) {
          btn.addEventListener('mouseenter', () => {
            setExpanded(true);
          });

          block.addEventListener('mouseleave', () => {
            setTimeout(() => {
              if (document.activeElement !== btn) setExpanded(false);
            }, 140);
          });

          btn.addEventListener('focus', () => {
            setExpanded(true);
          });

          btn.addEventListener('blur', () => {
            setTimeout(() => {
              if (!block.matches(':hover')) setExpanded(false);
            }, 0);
          });
        }
      });

      function refreshAll() {
        refreshers.forEach((fn) => fn());
      }

      window.addEventListener('load', refreshAll);
      window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(refreshAll, 120);
      });
      if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(refreshAll);
      }

      isStackedCard.addEventListener('change', refreshAll);
    })();

    (function () {
      const backToTop = document.getElementById('backToTop');
      const progressEl = backToTop.querySelector('.back-to-top-progress');
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const showAfter = 380;

      function scrollProgress() {
        const el = document.documentElement;
        const scrollTop = window.scrollY || el.scrollTop;
        const max = el.scrollHeight - el.clientHeight;
        if (max <= 0) return 0;
        return Math.min(1, Math.max(0, scrollTop / max));
      }

      function onScroll() {
        const y = window.scrollY || document.documentElement.scrollTop;
        const p = scrollProgress();
        progressEl.style.strokeDashoffset = String(100 * (1 - p));

        const show = y > showAfter;
        backToTop.classList.toggle('is-visible', show);
        backToTop.setAttribute('aria-hidden', show ? 'false' : 'true');
        backToTop.tabIndex = show ? 0 : -1;
      }

      let ticking = false;
      window.addEventListener('scroll', () => {
        if (!ticking) {
          requestAnimationFrame(() => {
            onScroll();
            ticking = false;
          });
          ticking = true;
        }
      }, { passive: true });

      backToTop.addEventListener('click', () => {
        window.scrollTo({
          top: 0,
          behavior: prefersReducedMotion ? 'auto' : 'smooth'
        });
      });

      onScroll();
    })();

    // Scroll reveal animation
    (function () {
      const reveals = document.querySelectorAll('.reveal');
      if (!reveals.length) return;

      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (prefersReducedMotion) {
        reveals.forEach(el => el.classList.add('is-visible'));
        return;
      }

      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      }, {
        threshold: 0.1,
        rootMargin: '0px 0px -60px 0px'
      });

      reveals.forEach(el => observer.observe(el));
    })();
