/* H4NDLE — mejora progresiva del formulario de producto.
   Sin este archivo el formulario ya funciona (POST normal a /cart/add). */
(function () {
  'use strict';

  var form = document.getElementById('st-product-form');
  if (!form) return;

  var money = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' });
  function fmt(cents) {
    return money.format((cents || 0) / 100);
  }

  var isTierForm = form.hasAttribute('data-tier-form');
  var tierOf = function (q) { return q >= 1000 ? 2 : q >= 250 ? 1 : 0; };
  /* 50 a 5,000 piezas por línea: el mismo límite que window.H4.MAXQ en assets/h4ndle.js */
  var MAXQ = (window.H4 && window.H4.MAXQ) || 5000;

  function clampQty(q) {
    if (isNaN(q)) q = 50;
    q = Math.round(q / 50) * 50;
    if (q < 50) q = 50;
    if (q > MAXQ) q = MAXQ;
    return q;
  }

  if (isTierForm) {
    var qty = document.getElementById('st-qty');
    var qtyOut = document.getElementById('st-qty-out');
    var qtyMinus = document.getElementById('st-qty-minus');
    var qtyPlus = document.getElementById('st-qty-plus');
    var tiersWrap = document.getElementById('st-tiers');
    var tierEls = tiersWrap ? Array.prototype.slice.call(tiersWrap.querySelectorAll('.st-tier')) : [];
    var variantIdInput = document.getElementById('st-variant-id');
    var unitPriceOut = document.getElementById('st-unit-price');
    var totalPriceOut = document.getElementById('st-total-price');
    var addPriceOut = document.getElementById('st-add-price');

    var render = function () {
      if (!qty || !tierEls.length) return;
      var q = clampQty(parseInt(qty.value, 10));
      if (String(q) !== qty.value) qty.value = String(q);
      if (qtyOut) qtyOut.textContent = q.toLocaleString('es-MX') + ' pzas';

      var tier = tierOf(q);
      var idx = Math.min(tier, tierEls.length - 1);
      var active = tierEls[idx];

      tierEls.forEach(function (el, i) {
        el.classList.toggle('is-on', i === idx);
      });

      var price = active ? parseInt(active.getAttribute('data-price'), 10) || 0 : 0;
      var variantId = active ? active.getAttribute('data-variant-id') : null;

      if (variantIdInput && variantId) variantIdInput.value = variantId;
      if (unitPriceOut) unitPriceOut.textContent = fmt(price);
      var total = price * q;
      if (totalPriceOut) totalPriceOut.textContent = fmt(total);
      if (addPriceOut) addPriceOut.textContent = fmt(total);
    };

    if (qty) {
      qty.addEventListener('input', render);
      qty.addEventListener('change', render);
    }
    if (qtyMinus) {
      qtyMinus.addEventListener('click', function () {
        if (!qty) return;
        qty.value = String(clampQty((parseInt(qty.value, 10) || 50) - 50));
        render();
      });
    }
    if (qtyPlus) {
      qtyPlus.addEventListener('click', function () {
        if (!qty) return;
        qty.value = String(clampQty((parseInt(qty.value, 10) || 50) + 50));
        render();
      });
    }

    render();
  }

  /* gallery thumbnails — optional enhancement, guarded */
  var mainImage = document.getElementById('st-mainImage');
  var thumbs = document.getElementById('st-thumbs');
  if (mainImage && thumbs) {
    thumbs.addEventListener('click', function (e) {
      var btn = e.target && e.target.closest ? e.target.closest('.st-thumb') : null;
      if (!btn) return;
      var full = btn.getAttribute('data-full');
      if (!full) return;
      mainImage.setAttribute('src', full);
      mainImage.removeAttribute('srcset');
      var all = thumbs.querySelectorAll('.st-thumb');
      for (var i = 0; i < all.length; i++) {
        all[i].classList.toggle('is-active', all[i] === btn);
      }
    });
  }

  /* submit: hand off to the Shopify AJAX cart when available */
  form.addEventListener('submit', function (e) {
    if (!window.H4Cart || typeof window.H4Cart.add !== 'function') return; // native submit, no JS cart

    e.preventDefault();

    var idEl = isTierForm ? document.getElementById('st-variant-id') : document.getElementById('st-variant');
    var qtyEl = isTierForm ? document.getElementById('st-qty') : document.getElementById('st-quantity-basic');
    var id = idEl ? idEl.value : null;
    var quantity = qtyEl ? (parseInt(qtyEl.value, 10) || 1) : 1;
    if (!id) return;

    var submitBtn = document.getElementById('st-add-btn');
    if (submitBtn) submitBtn.disabled = true;

    window.H4Cart.add([{ id: id, quantity: quantity }]).then(function () {
      if (submitBtn) submitBtn.disabled = false;
    }, function () {
      if (submitBtn) submitBtn.disabled = false;
      form.submit();
    });
  });
})();
