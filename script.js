/* ============================================================
   Pantry Lane — shared JS
   Cart, drawer, toast, filters, scroll reveals, image fallbacks
   In-memory cart only (no localStorage) — resets on reload.
   ============================================================ */

(function () {
  const $  = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const cart = [];

  const fmt = n => '$' + n.toFixed(2);

  // ---------- Toast ----------
  function toast(msg) {
    let el = $('.toast');
    if (!el) {
      el = document.createElement('div');
      el.className = 'toast';
      document.body.appendChild(el);
    }
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(el._t);
    el._t = setTimeout(() => el.classList.remove('show'), 1900);
  }

  // ---------- Cart UI ----------
  function updateCount() {
    const n = cart.reduce((s, i) => s + i.qty, 0);
    $$('.cart-count').forEach(el => {
      const prev = el.textContent;
      el.textContent = n;
      el.style.display = n > 0 ? 'inline-block' : 'none';
      if (n > 0 && prev !== String(n)) {
        el.classList.remove('bump');
        // force reflow to restart animation
        void el.offsetWidth;
        el.classList.add('bump');
      }
    });
  }

  function renderCart() {
    const list = $('.cart-items');
    const totalEl = $('.cart-total span:last-child');
    if (!list) return;

    if (!cart.length) {
      list.innerHTML = `
        <div class="cart-empty">
          <div class="icon">⌇</div>
          <div>Your cart is empty.</div>
          <div style="margin-top:8px; font-size:0.85rem;">Browse the shop to add items.</div>
        </div>`;
      if (totalEl) totalEl.textContent = '$0.00';
      return;
    }

    list.innerHTML = cart.map(i => `
      <div class="cart-item" data-id="${i.id}">
        <div class="cart-item-img" style="background-image:url('${i.img || ''}')"></div>
        <div class="cart-item-info">
          <p class="cart-item-name">${i.name}</p>
          <p class="cart-item-price">${fmt(i.price)} × ${i.qty}</p>
        </div>
        <button class="cart-item-remove" aria-label="Remove">remove</button>
      </div>
    `).join('');

    const total = cart.reduce((s, i) => s + i.price * i.qty, 0);
    if (totalEl) totalEl.textContent = fmt(total);

    $$('.cart-item-remove', list).forEach(btn => {
      btn.addEventListener('click', e => {
        const id = e.target.closest('.cart-item').dataset.id;
        const idx = cart.findIndex(i => i.id === id);
        if (idx > -1) cart.splice(idx, 1);
        updateCount();
        renderCart();
      });
    });
  }

  function addToCart(p) {
    const existing = cart.find(i => i.id === p.id);
    if (existing) existing.qty += 1;
    else cart.push({ ...p, qty: 1 });
    updateCount();
    renderCart();
    toast(`Added — ${p.name}`);
  }

  // ---------- Drawer ----------
  const openDrawer  = () => { $('.cart-drawer')?.classList.add('open'); $('.cart-overlay')?.classList.add('open'); };
  const closeDrawer = () => { $('.cart-drawer')?.classList.remove('open'); $('.cart-overlay')?.classList.remove('open'); };

  // ---------- Reveal-on-scroll ----------
  function setupReveals() {
    if (!('IntersectionObserver' in window)) {
      $$('.reveal').forEach(el => el.classList.add('in'));
      return;
    }
    const io = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -50px 0px' });
    $$('.reveal').forEach(el => io.observe(el));
  }

  // ---------- Image fallback ----------
  // If an Unsplash photo fails (network blip, etc.), hide the <img> so the
  // gradient swatch behind it shows through and the card still looks intentional.
  function setupImageFallback() {
    $$('.product-image img, .hero-visual img, .about-visual img').forEach(img => {
      img.addEventListener('error', () => { img.style.display = 'none'; }, { once: true });
    });
  }

  // ---------- Init ----------
  document.addEventListener('DOMContentLoaded', () => {
    // Quick-add buttons on product cards
    $$('.product-card').forEach(card => {
      const btn = card.querySelector('.product-quick-add');
      if (!btn) return;
      btn.addEventListener('click', e => {
        e.preventDefault();
        const img = card.querySelector('.product-image img');
        const product = {
          id:    card.dataset.id,
          name:  card.dataset.name,
          price: parseFloat(card.dataset.price),
          img:   img ? img.src : '',
        };
        addToCart(product);
        btn.classList.add('added');
        btn.textContent = '✓ Added';
        setTimeout(() => {
          btn.classList.remove('added');
          btn.textContent = 'Add to cart';
        }, 1300);
      });
    });

    // Cart drawer
    $$('.cart-btn').forEach(b => b.addEventListener('click', openDrawer));
    $('.cart-close')?.addEventListener('click', closeDrawer);
    $('.cart-overlay')?.addEventListener('click', closeDrawer);
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') closeDrawer();
    });

    // Fake checkout
    $('.checkout-btn')?.addEventListener('click', () => {
      if (!cart.length) { toast('Your cart is empty'); return; }
      toast('Proof of concept — checkout coming soon!');
    });

    // Filter chips on shop page
    const chips = $$('.filter-chip');
    if (chips.length) {
      chips.forEach(chip => {
        chip.addEventListener('click', () => {
          chips.forEach(c => c.classList.remove('active'));
          chip.classList.add('active');
          const f = chip.dataset.filter;
          $$('.product-card').forEach(card => {
            const cat = card.dataset.category;
            card.style.display = (f === 'all' || cat === f) ? '' : 'none';
          });
        });
      });
    }

    setupReveals();
    setupImageFallback();
    updateCount();
    renderCart();
  });
})();
