/**
 * Empire Essence - Cart Manager Module
 * Handles cart persistence, recovery, and analytics
 */

(function(window) {
  'use strict';

  const CART_KEY = 'ee_cart';
  const CART_TIMESTAMP_KEY = 'ee_cart_timestamp';
  const CART_ABANDONED_KEY = 'ee_cart_abandoned';
  const SHIPPING_THRESHOLD = 80000;

  // Google Analytics 4 Event Tracking
  const Analytics = {
    gtag: function() {
      if (window.gtag) {
        window.gtag.apply(null, arguments);
      }
    },
    
    // E-commerce events
    viewItem: function(product) {
      this.gtag('event', 'view_item', {
        currency: 'COP',
        value: product.prices[30],
        items: [{
          item_id: product.id.toString(),
          item_name: product.name,
          item_category: product.cat,
          price: product.prices[30],
          quantity: 1
        }]
      });
    },

    addToCart: function(product, size, price) {
      this.gtag('event', 'add_to_cart', {
        currency: 'COP',
        value: price,
        items: [{
          item_id: `${product.id}_${size}ml`,
          item_name: product.name,
          item_category: product.cat,
          item_variant: `${size}ml`,
          price: price,
          quantity: 1
        }]
      });
    },

    removeFromCart: function(item) {
      this.gtag('event', 'remove_from_cart', {
        currency: 'COP',
        value: item.price * item.qty,
        items: [{
          item_id: `${item.id}_${item.size}ml`,
          item_name: item.name,
          item_variant: `${item.size}ml`,
          price: item.price,
          quantity: item.qty
        }]
      });
    },

    beginCheckout: function(cart, total) {
      this.gtag('event', 'begin_checkout', {
        currency: 'COP',
        value: total,
        items: cart.map(item => ({
          item_id: `${item.id}_${item.size}ml`,
          item_name: item.name,
          item_category: item.cat,
          item_variant: `${item.size}ml`,
          price: item.price,
          quantity: item.qty
        }))
      });
    },

    purchase: function(cart, total, transactionId) {
      this.gtag('event', 'purchase', {
        transaction_id: transactionId,
        value: total,
        currency: 'COP',
        items: cart.map(item => ({
          item_id: `${item.id}_${item.size}ml`,
          item_name: item.name,
          item_category: item.cat,
          item_variant: `${item.size}ml`,
          price: item.price,
          quantity: item.qty
        }))
      });
    }
  };

  // Cart Manager
  const CartManager = {
    cart: [],

    init: function() {
      this.loadCart();
      this.setupEventListeners();
      this.checkAbandonedCart();
    },

    loadCart: function() {
      try {
        const saved = localStorage.getItem(CART_KEY);
        if (saved) {
          this.cart = JSON.parse(saved);
          this.updateCartUI();
        }
      } catch (e) {
        console.error('Error loading cart:', e);
      }
    },

    saveCart: function() {
      try {
        localStorage.setItem(CART_KEY, JSON.stringify(this.cart));
        localStorage.setItem(CART_TIMESTAMP_KEY, Date.now().toString());
      } catch (e) {
        console.error('Error saving cart:', e);
      }
    },

    addItem: function(product, size, bottleId, bottleName) {
      const price = product.prices[size];
      const key = `${product.id}-${size}-${bottleId}`;

      const existing = this.cart.find(c => c.key === key);
      if (existing) {
        existing.qty++;
      } else {
        this.cart.push({
          key,
          id: product.id,
          name: product.name,
          size,
          price,
          bottleName,
          qty: 1
        });
      }

      this.saveCart();
      this.updateCartUI();
      this.updateShippingProgress();
      
      // Track analytics
      Analytics.addToCart(product, size, price);

      // Clear abandoned flag
      localStorage.removeItem(CART_ABANDONED_KEY);

      return this.cart;
    },

    removeItem: function(key) {
      const item = this.cart.find(c => c.key === key);
      if (item) {
        Analytics.removeFromCart(item);
        this.cart = this.cart.filter(c => c.key !== key);
        this.saveCart();
        this.updateCartUI();
        this.updateShippingProgress();
      }
    },

    clearCart: function() {
      this.cart = [];
      this.saveCart();
      this.updateCartUI();
      this.updateShippingProgress();
    },

    getTotal: function() {
      // Calculate promo discount for 30ml items
      const count30 = this.cart.filter(c => c.size === 30).reduce((s, c) => s + c.qty, 0);
      const promo = this.getPromoDiscount(count30);
      
      const subtotal = this.cart.reduce((sum, c) => sum + c.price * c.qty, 0);
      
      if (promo && promo.discount > 0) {
        const otherTotal = this.cart.filter(c => c.size !== 30).reduce((s, c) => s + c.price * c.qty, 0);
        return promo.total + otherTotal;
      }
      
      return subtotal;
    },

    getPromoDiscount: function(count30) {
      const tiers = [
        { min: 10, total: 240000, label: '10×30ml' },
        { min: 5, total: 128000, label: '5×30ml' },
        { min: 3, total: 80000, label: '3×30ml' }
      ];

      for (const tier of tiers) {
        if (count30 >= tier.min) {
          const fullPrice = count30 * 30000;
          const packs = Math.floor(count30 / tier.min);
          const remainder = count30 % tier.min;
          const discountedTotal = (packs * tier.total) + (remainder * 30000);
          return { discount: fullPrice - discountedTotal, total: discountedTotal, label: tier.label, tier };
        }
      }
      return null;
    },

    updateCartUI: function() {
      const count = this.cart.reduce((s, c) => s + c.qty, 0);
      const countEl = document.getElementById('cartCount');
      if (countEl) {
        countEl.textContent = count;
        countEl.style.display = count > 0 ? 'flex' : 'none';
      }

      const itemsEl = document.getElementById('cartItems');
      const totalEl = document.getElementById('cartTotal');
      const btn = document.getElementById('btnCheckout');

      if (!itemsEl) return;

      if (!this.cart.length) {
        itemsEl.innerHTML = '<p style="color:var(--gray);text-align:center;margin-top:3rem;">Tu carrito está vacío</p>';
        if (totalEl) totalEl.textContent = '';
        if (btn) btn.disabled = true;
        return;
      }

      if (btn) btn.disabled = false;
      
      let html = '';
      let total = 0;

      this.cart.forEach(c => {
        total += c.price * c.qty;
        const sub = c.bottleName ? ` · Frasco: ${c.bottleName}` : '';
        html += `
          <div class="cart-item">
            <div class="cart-item-info">
              <h4>${c.name} (${c.size}ml) × ${c.qty}</h4>
              <p>$${(c.price * c.qty).toLocaleString('es-CO')} COP${sub}</p>
            </div>
            <button class="cart-item-remove" onclick="CartManager.removeItem('${c.key}')">✕</button>
          </div>`;
      });

      // Calculate promo discount
      const count30 = this.cart.filter(c => c.size === 30).reduce((s, c) => s + c.qty, 0);
      const promo = this.getPromoDiscount(count30);
      
      if (promo && promo.discount > 0) {
        const otherTotal = this.cart.filter(c => c.size !== 30).reduce((s, c) => s + c.price * c.qty, 0);
        total = promo.total + otherTotal;
        html += `
          <div class="cart-item" style="border-top:1px solid rgba(184,151,106,0.2);padding-top:0.8rem;margin-top:0.5rem;">
            <div class="cart-item-info">
              <h4 style="color:var(--gold);">Descuento Combo ${count30}×30ml</h4>
              <p style="color:var(--gold-light);">-$${promo.discount.toLocaleString('es-CO')} COP</p>
            </div>
          </div>`;
      }

      itemsEl.innerHTML = html;
      if (totalEl) {
        totalEl.textContent = `Total: $${total.toLocaleString('es-CO')} COP`;
      }
    },

    updateShippingProgress: function() {
      const total = this.getTotal();
      const progressBar = document.getElementById('shippingProgressBar');
      const progressText = document.getElementById('shippingProgressText');
      
      if (!progressBar || !progressText) return;

      const progress = Math.min((total / SHIPPING_THRESHOLD) * 100, 100);
      progressBar.style.width = `${progress}%`;

      if (total === 0) {
        progressText.textContent = '🎁 Envío gratis en compras desde $80.000';
      } else if (total >= SHIPPING_THRESHOLD) {
        progressText.textContent = '✅ ¡Tienes envío GRATIS!';
        progressBar.style.background = '#4ade80';
      } else {
        const remaining = SHIPPING_THRESHOLD - total;
        progressText.textContent = `🎁 Agrega $${remaining.toLocaleString('es-CO')} más para envío gratis`;
        progressBar.style.background = 'var(--gold)';
      }
    },

    checkAbandonedCart: function() {
      const timestamp = localStorage.getItem(CART_TIMESTAMP_KEY);
      const wasAbandoned = localStorage.getItem(CART_ABANDONED_KEY);
      
      if (this.cart.length > 0 && timestamp && !wasAbandoned) {
        const timeSinceUpdate = Date.now() - parseInt(timestamp);
        const FIFTEEN_MINUTES = 15 * 60 * 1000;
        
        if (timeSinceUpdate > FIFTEEN_MINUTES) {
          // Mark as abandoned
          localStorage.setItem(CART_ABANDONED_KEY, 'true');
          localStorage.setItem('ee_cart_abandoned_at', Date.now().toString());
          
          // Show recovery toast
          this.showRecoveryToast();
        }
      }
    },

    showRecoveryToast: function() {
      const total = this.getTotal();
      const itemCount = this.cart.reduce((s, c) => s + c.qty, 0);
      
      // Use existing toast system
      if (window.showToast) {
        window.showToast(`🛒 Tienes ${itemCount} producto(s) en tu carrito ($${total.toLocaleString('es-CO')})`);
      }
    },

    setupEventListeners: function() {
      // Track beforeunload for abandoned cart detection
      window.addEventListener('beforeunload', () => {
        if (this.cart.length > 0) {
          localStorage.setItem(CART_ABANDONED_KEY, 'true');
        }
      });

      // Register checkout button
      const checkoutBtn = document.getElementById('btnCheckout');
      if (checkoutBtn) {
        checkoutBtn.addEventListener('click', () => {
          const total = this.getTotal();
          Analytics.beginCheckout(this.cart, total);
        });
      }
    },

    // Quick add functionality
    quickAdd: function(productId, size = 30) {
      if (typeof PRODUCTS === 'undefined') return;
      
      const product = PRODUCTS.find(p => p.id === productId);
      if (!product) return;

      // Get first available bottle for size
      const bottles = window.BOTTLES && window.BOTTLES[size];
      const bottle = bottles && bottles[0];
      
      if (bottle) {
        this.addItem(product, size, bottle.id, bottle.name);
        
        // Show success toast
        if (window.showToast) {
          window.showToast(`✨ ${product.name} (${size}ml) agregado al carrito`);
        }
      }
    }
  };

  // Expose to global scope
  window.CartManager = CartManager;
  window.Analytics = Analytics;

  // Initialize on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => CartManager.init());
  } else {
    CartManager.init();
  }

})(window);
