const API = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://localhost:8080/api/v1'
  : 'https://shoplux-api.onrender.com/api/v1';


const state = {
  page:      'login',
  user:      JSON.parse(localStorage.getItem('user') || 'null'),
  token:     localStorage.getItem('token') || null,
  cart:      JSON.parse(localStorage.getItem('cart') || '[]'),
  wishlist:  JSON.parse(localStorage.getItem('wishlist') || '[]'),
  history:   [],
  slideIdx:  0,
  slideTimer: null,
};

let allProds      = [];
let filteredProds = [];
let detailQty     = 1;

document.addEventListener('DOMContentLoaded', () => {
  updateBadge();
  navigate(state.token ? 'home' : 'login');
});

const PAGES = ['login','register','home','products','productDetails','cart','checkout','account','ordersuccess'];

function navigate(page, data = {}) {

  if (state.page && state.page !== page) state.history.push(state.page);

  PAGES.forEach(p => {
    const el = document.getElementById(`page-${p}`);
    if (el) el.style.display = 'none';
  });

  const target = document.getElementById(`page-${page}`);
  if (target) target.style.display = 'block';

  state.page = page;
  window.scrollTo(0, 0);

  const isAuth = page === 'login' || page === 'register';
  const navbar     = document.getElementById('navbar');
  const footer     = document.getElementById('footer');
  const bottomNav  = document.getElementById('bottomNav');
  if (navbar)    navbar.style.display    = isAuth ? 'none' : '';
  if (footer)    footer.style.display    = isAuth ? 'none' : 'block';
  if (bottomNav) bottomNav.style.display = isAuth ? 'none' : 'flex';

  document.querySelectorAll('.nav-link').forEach(l => l.classList.toggle('on', l.dataset.page === page));
  document.querySelectorAll('.bottom-nav button').forEach(b => b.classList.toggle('on', b.dataset.page === page));

  const mm = document.getElementById('mobMenu');
  if (mm) mm.classList.remove('open');

  if (page === 'home')           initHome();
  if (page === 'products')       initProducts();
  if (page === 'cart')           renderCart();
  if (page === 'checkout')       initCheckout();
  if (page === 'account')        initAccount();
  if (page === 'productDetails') initDetail(data.id);
}

function goBack() {
  const prev = state.history.pop();
  navigate(prev || 'home');
}

async function handleLogin() {
  const email    = val('loginEmail');
  const password = val('loginPassword');
  const msgEl    = document.getElementById('loginMsg');
  const btn      = document.getElementById('loginBtn');

  hideMsg(msgEl);
  if (!email || !password) { showMsg(msgEl, '⚠ Please enter email and password.'); return; }

  btn.classList.add('btn-loading');
  btn.textContent = 'Signing in…';

  try {
    const data = await post(`${API}/user/login`, { email, password });
    state.token = data.token;
    state.user  = data.user;
    localStorage.setItem('token', data.token);
    localStorage.setItem('user',  JSON.stringify(data.user));
    toast('Welcome back! 🎉', 'ok');
    navigate('home');
  } catch (e) {
    showMsg(msgEl, '✗ ' + e.message);
  } finally {
    btn.classList.remove('btn-loading');
    btn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Sign In';
  }
}

async function handleRegister() {
  const name     = val('regName');
  const email    = val('regEmail');
  const password = val('regPassword');
  const phone    = val('regPhone');
  const address  = val('regAddress');
  const city     = val('regCity');
  const country  = val('regCountry') || 'India';
  const answer   = val('regAnswer');
  const msgEl    = document.getElementById('registerMsg');
  const btn      = document.getElementById('registerBtn');

  hideMsg(msgEl);

  if (!name || !email || !password || !phone || !address || !city) {
    showMsg(msgEl, '⚠ Please fill in all required fields.'); return;
  }
  if (password.length < 6) {
    showMsg(msgEl, '⚠ Password must be at least 6 characters.'); return;
  }

  btn.classList.add('btn-loading');
  btn.textContent = 'Creating account…';

  try {
    await post(`${API}/user/register`, { name, email, password, phone, address, city, answer: 'default' });
    showMsg(msgEl, '✓ Account created! Redirecting to login…', 'ok');
    setTimeout(() => navigate('login'), 1800);
  } catch (e) {
    showMsg(msgEl, '✗ ' + e.message);
  } finally {
    btn.classList.remove('btn-loading');
    btn.innerHTML = '<i class="fas fa-user-plus"></i> Create Account';
  }
}

async function handleLogout() {
  state.token = null;
  state.user  = null;
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  toast('Logged out successfully');
  navigate('login');
}

async function initHome() {
  startSlider();
  await Promise.all([loadCategories(), loadFeaturedProducts()]);
}

function startSlider() {
  if (state.slideTimer) clearInterval(state.slideTimer);
  state.slideTimer = setInterval(() => moveSlide(1), 5500);
}
function moveSlide(dir) {
  const slides = document.querySelectorAll('.slide');
  const dots   = document.querySelectorAll('.sdot');
  if (!slides.length) return;
  slides[state.slideIdx].classList.remove('active');
  dots[state.slideIdx].classList.remove('active');
  state.slideIdx = (state.slideIdx + dir + slides.length) % slides.length;
  slides[state.slideIdx].classList.add('active');
  dots[state.slideIdx].classList.add('active');
}
function goSlide(i) {
  const slides = document.querySelectorAll('.slide');
  const dots   = document.querySelectorAll('.sdot');
  if (!slides.length) return;
  slides[state.slideIdx].classList.remove('active');
  dots[state.slideIdx].classList.remove('active');
  state.slideIdx = i;
  slides[i].classList.add('active');
  dots[i].classList.add('active');
  startSlider();
}
function scrollTo(id) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
}

const CAT_ICONS = ['🛍️','📱','👗','🏠','💄','🎮','👟','📚','⌚','🎒','🍕','🎨'];

async function loadCategories() {
  const grid = document.getElementById('catGrid');
  if (!grid) return;
  try {
    const data = await apiFetch(`${API}/product/get-all`);
    if (data.success && data.categories?.length) {
      grid.innerHTML = data.categories.map((c, i) => `
        <div class="cat-card" onclick="filterByCat('${c._id}','${c.category || c.name}')">
          <span class="cat-icon">${CAT_ICONS[i % CAT_ICONS.length]}</span>
          <h4>${c.category || c.name || 'Category'}</h4>
          <span>Explore →</span>
        </div>`).join('');
      return;
    }
  } catch {}

  const demos = [['Electronics','📱'],['Fashion','👗'],['Home & Living','🏠'],['Beauty','💄'],['Sports','👟'],['Books','📚']];
  grid.innerHTML = demos.map(([n, ico]) => `
    <div class="cat-card" onclick="navigate('products')">
      <span class="cat-icon">${ico}</span><h4>${n}</h4><span>Explore →</span>
    </div>`).join('');
}

function filterByCat(id, name) {
  navigate('products');
  setTimeout(() => {
    const radio = document.querySelector(`input[name="cf"][value="${name}"]`);
    if (radio) { radio.checked = true; applyFilters(); }
  }, 350);
}

async function loadFeaturedProducts() {
  const grid = document.getElementById('featGrid');
  if (!grid) return;
  grid.innerHTML = `<div class="loading-box" style="grid-column:1/-1"><div class="spinner"></div></div>`;
  try {
    const data = await apiFetch(`${API}/product/get-all`);
    if (data.success && data.products?.length) {
      allProds = data.products;
      grid.innerHTML = data.products.slice(0, 4).map(prodCardHTML).join('');
      return;
    }
  } catch {}
  const demos = getDemoProducts(4);
  allProds = demos;
  grid.innerHTML = demos.map(prodCardHTML).join('');
}

async function initProducts() {
  const grid = document.getElementById('prodGrid');
  if (!grid) return;
  grid.innerHTML = `<div class="loading-box" style="grid-column:1/-1"><div class="spinner"></div><p>Loading products…</p></div>`;

  try {
    const data = await apiFetch(`${API}/product/get-all`);
    allProds = (data.success && data.products?.length) ? data.products : getDemoProducts(16);
  } catch {
    allProds = getDemoProducts(16);
  }

  filteredProds = [...allProds];
  buildCatFilters();
  renderProducts();
}

function buildCatFilters() {
  const el = document.getElementById('catFilters');
  if (!el) return;
  const cats = [...new Set(allProds.map(p => (typeof p.category === 'string') ? p.category : (p.category?.category || p.category?.name || 'General')).filter(Boolean))];
  el.innerHTML = `
    <label class="f-opt"><input type="radio" name="cf" value="" checked onchange="applyFilters()"> All Products</label>
    ${cats.map(c => `<label class="f-opt"><input type="radio" name="cf" value="${c}" onchange="applyFilters()"> ${c}</label>`).join('')}`;
}

function applyFilters() {
  const cat      = document.querySelector('input[name="cf"]:checked')?.value || '';
  const maxPrice = parseInt(document.getElementById('priceSlider')?.value || 10000);
  const sort     = document.getElementById('sortBy')?.value || '';

  filteredProds = allProds.filter(p => {
    const catName = (typeof p.category === 'string') ? p.category : (p.category?.category || p.category?.name || 'General'); const catOk = !cat || catName === cat;
    const priceOk = (p.price || 0) <= maxPrice;
    return catOk && priceOk;
  });

  if (sort === 'low')    filteredProds.sort((a, b) => a.price - b.price);
  if (sort === 'high')   filteredProds.sort((a, b) => b.price - a.price);
  if (sort === 'rating') filteredProds.sort((a, b) => (b.rating || 0) - (a.rating || 0));
  if (sort === 'newest') filteredProds.reverse();

  renderProducts();
}

function onPriceSlide(el) {
  const num = parseInt(el.value);
  const lbl = document.getElementById('priceVal');
  if (lbl) lbl.textContent = `₹${num.toLocaleString('en-IN')}`;
  applyFilters();
}

function clearFilters() {
  const all = document.querySelector('input[name="cf"][value=""]');
  if (all) all.checked = true;
  const sl = document.getElementById('priceSlider');
  if (sl) { sl.value = 10000; document.getElementById('priceVal').textContent = '₹10,000'; }
  const sb = document.getElementById('sortBy');
  if (sb) sb.value = '';
  filteredProds = [...allProds];
  renderProducts();
}

function renderProducts() {
  const grid  = document.getElementById('prodGrid');
  const count = document.getElementById('prodCount');
  if (!grid) return;
  if (count) count.textContent = `${filteredProds.length} product${filteredProds.length !== 1 ? 's' : ''} found`;
  if (!filteredProds.length) {
    grid.innerHTML = `<div class="empty-st" style="grid-column:1/-1">
      <i class="fas fa-search-minus"></i><p>No products match your filters.</p>
      <button class="btn-outline" onclick="clearFilters()">Clear Filters</button></div>`;
    return;
  }
  grid.innerHTML = filteredProds.map(prodCardHTML).join('');
}

function toggleSidebar() {
  document.getElementById('sidebar')?.classList.toggle('open');
}

function prodCardHTML(p) {
  const img      = p.image || p.images?.[0]?.url || `https://picsum.photos/seed/${p._id || p.name || 'x'}/400/400`;
  const catName  = (typeof p.category === 'string') ? p.category : (p.category?.category || p.category?.name || 'General');
  const price    = p.price || 999;
  const oldPrice = Math.round(price * 1.28);
  const disc     = Math.round(((oldPrice - price) / oldPrice) * 100);
  const rating   = Number(p.rating || 4).toFixed(1);
  const stars    = '★'.repeat(Math.round(rating)) + '☆'.repeat(5 - Math.round(rating));
  const wished   = state.wishlist.includes(p._id);
  const pJson    = JSON.stringify(p).replace(/"/g, '&quot;');

  return `
    <div class="prod-card">
      <div class="prod-img">
        <img src="${img}" alt="${esc(p.name)}" loading="lazy" onerror="this.src='https://picsum.photos/seed/${Math.random()}/400/400'"/>
        <span class="prod-badge">New</span>
        <button class="wish-btn ${wished ? 'on' : ''}" onclick="toggleWishlist('${p._id}', this)" title="Wishlist">
          <i class="${wished ? 'fas' : 'far'} fa-heart"></i>
        </button>
      </div>
      <div class="prod-body">
        <div class="prod-cat">${catName}</div>
        <div class="prod-name">${esc(p.name)}</div>
        <div class="prod-desc">${esc(p.description || 'Premium quality product.')}</div>
        <div class="prod-stars">${stars} <span>(${p.numReviews || 0})</span></div>
        <div class="prod-price-row">
          <div>
            <div class="prod-price">₹${price.toLocaleString('en-IN')}</div>
            <div class="prod-old">₹${oldPrice.toLocaleString('en-IN')}</div>
          </div>
          <span class="prod-disc">${disc}% off</span>
        </div>
        <div class="prod-actions">
          <button class="btn-gold" onclick='addToCart(${pJson})'>
            <i class="fas fa-cart-plus"></i> Add
          </button>
          <button class="btn-outline" onclick="viewProduct('${p._id}')">
            <i class="fas fa-eye"></i>
          </button>
        </div>
      </div>
    </div>`;
}

function handleSearch() {
  const q = document.getElementById('searchInput')?.value?.trim();
  if (!q) return;
  if (state.page !== 'products') navigate('products');
  setTimeout(() => {
    filteredProds = allProds.filter(p =>
      p.name?.toLowerCase().includes(q.toLowerCase()) ||
      (p.description || '').toLowerCase().includes(q.toLowerCase())
    );
    renderProducts();
  }, 120);
}

function viewProduct(id) {
  navigate('productDetails', { id });
}

async function initDetail(id) {
  const wrap  = document.getElementById('detailContent');
  const revSec = document.getElementById('reviewsWrap');
  if (!wrap) return;
  detailQty = 1;
  wrap.innerHTML = `<div class="loading-box"><div class="spinner"></div></div>`;
  if (revSec) revSec.style.display = 'none';

  let p = allProds.find(x => x._id === id) || filteredProds.find(x => x._id === id);

  if (!p && id) {
    try {
      const data = await apiFetch(`${API}/product/${id}`);
      if (data.success) p = data.product;
    } catch {}
  }
  if (!p) { p = getDemoProducts(1)[0]; }

  const img     = p.image || p.images?.[0]?.url || `https://picsum.photos/seed/${p._id}/600/600`;
  const price   = p.price || 999;
  const catName = p.category?.category || p.category?.name || 'General';
  const stars   = '★'.repeat(Math.round(p.rating || 4)) + '☆'.repeat(5 - Math.round(p.rating || 4));
  const inStock = (p.stock || 0) > 0;
  const pJson   = JSON.stringify(p).replace(/"/g, '&quot;');

  wrap.innerHTML = `
    <div class="detail-grid">
      <div class="detail-gallery">
        <img src="${img}" alt="${esc(p.name)}" onerror="this.src='https://picsum.photos/600/600?r=${Date.now()}'"/>
      </div>
      <div class="detail-info">
        <div class="detail-cat">${catName}</div>
        <h1 class="detail-name">${esc(p.name)}</h1>
        <div class="prod-stars" style="font-size:.9rem">${stars} <span style="color:var(--muted);font-size:.82rem">(${p.numReviews || 0} reviews)</span></div>
        <div class="detail-price">₹${price.toLocaleString('en-IN')}</div>
        <p class="detail-desc">${esc(p.description || 'No description available.')}</p>
        <span class="stock-badge ${inStock ? 'in-stock' : 'out-stock'}">
          <i class="fas fa-${inStock ? 'check-circle' : 'times-circle'}"></i>
          ${inStock ? `In Stock (${p.stock} units left)` : 'Out of Stock'}
        </span>
        <div class="qty-row">
          <label>Quantity</label>
          <div class="qty-ctrl">
            <button onclick="changeQty(-1)">−</button>
            <span id="qtyDisplay">1</span>
            <button onclick="changeQty(1)">+</button>
          </div>
        </div>
        <div class="detail-acts">
          <button class="btn-gold" onclick='addToCartQty(${pJson})' ${inStock ? '' : 'disabled style="opacity:.5"'}>
            <i class="fas fa-shopping-bag"></i> Add to Cart
          </button>
          <button class="btn-outline" onclick="toggleWishlist('${p._id}', this)">
            <i class="${state.wishlist.includes(p._id) ? 'fas' : 'far'} fa-heart"></i>
          </button>
        </div>
      </div>
    </div>`;

  if (p.reviews?.length && revSec) {
    revSec.style.display = 'block';
    document.getElementById('reviewsList').innerHTML = p.reviews.map(r => `
      <div class="review-card">
        <div class="review-top">
          <div class="r-avatar">${(r.name || 'U')[0].toUpperCase()}</div>
          <div class="r-meta">
            <h5>${esc(r.name || 'Anonymous')}</h5>
            <span>${'★'.repeat(r.rating || 5)}</span>
          </div>
        </div>
        <p style="font-size:.88rem;color:rgba(255,255,255,.72)">${esc(r.comment || '')}</p>
      </div>`).join('');
  }
}

function changeQty(dir) {
  detailQty = Math.max(1, Math.min(20, detailQty + dir));
  const el = document.getElementById('qtyDisplay');
  if (el) el.textContent = detailQty;
}

function addToCartQty(p) {
  for (let i = 0; i < detailQty; i++) addToCart(p);
  detailQty = 1;
  const el = document.getElementById('qtyDisplay');
  if (el) el.textContent = '1';
}

function addToCart(p) {
  const existing = state.cart.find(i => i._id === p._id);
  if (existing) existing.qty = (existing.qty || 1) + 1;
  else          state.cart.push({ ...p, qty: 1 });
  saveCart();
  toast(`✓ ${p.name} added to cart`, 'ok');
}

function removeFromCart(id) {
  state.cart = state.cart.filter(i => i._id !== id);
  saveCart();
  renderCart();
}

function updateQty(id, dir) {
  const item = state.cart.find(i => i._id === id);
  if (!item) return;
  item.qty = Math.max(1, (item.qty || 1) + dir);
  saveCart();
  renderCart();
}

function saveCart() {
  localStorage.setItem('cart', JSON.stringify(state.cart));
  updateBadge();
}

function updateBadge() {
  const total = state.cart.reduce((s, i) => s + (i.qty || 1), 0);
  const b1 = document.getElementById('cartBadge');
  const b2 = document.getElementById('mobBadge');
  if (b1) b1.textContent = total;
  if (b2) b2.textContent = total;
}

function renderCart() {
  const el = document.getElementById('cartContent');
  if (!el) return;

  if (!state.cart.length) {
    el.innerHTML = `<div class="empty-cart">
      <i class="fas fa-shopping-bag"></i>
      <h3>Your Cart is Empty</h3>
      <p>Looks like you haven't added anything yet.</p>
      <button class="btn-gold" onclick="navigate('products')"><i class="fas fa-store"></i> Start Shopping</button>
    </div>`;
    return;
  }

  const sub      = state.cart.reduce((s, i) => s + (i.price || 0) * (i.qty || 1), 0);
  const tax      = Math.round(sub * 0.18);
  const shipping = sub >= 999 ? 0 : 99;
  const total    = sub + tax + shipping;

  el.innerHTML = `
    <div class="cart-grid">
      <div class="cart-items">
        ${state.cart.map(item => {
          const img   = item.image || item.images?.[0]?.url || `https://picsum.photos/seed/${item._id}/200/200`;
          const iTotal = (item.price || 0) * (item.qty || 1);
          return `
            <div class="cart-card">
              <div class="cart-thumb"><img src="${img}" alt="${esc(item.name)}" onerror="this.src='https://picsum.photos/200/200'"/></div>
              <div class="cart-info">
                <h4>${esc(item.name)}</h4>
                <p>${item.category?.category || item.category?.name || 'Product'}</p>
                <div class="qty-ctrl">
                  <button onclick="updateQty('${item._id}', -1)">−</button>
                  <span>${item.qty || 1}</span>
                  <button onclick="updateQty('${item._id}', 1)">+</button>
                </div>
              </div>
              <div class="cart-right">
                <div class="cart-price">₹${iTotal.toLocaleString('en-IN')}</div>
                <button class="btn-del" onclick="removeFromCart('${item._id}')">
                  <i class="fas fa-trash-alt"></i> Remove
                </button>
              </div>
            </div>`;
        }).join('')}
      </div>
      <div class="cart-summary-box">
        <h3>Order Summary</h3>
        <div class="sum-row"><span>Items (${state.cart.length})</span><span>₹${sub.toLocaleString('en-IN')}</span></div>
        <div class="sum-row"><span>GST (18%)</span><span>₹${tax.toLocaleString('en-IN')}</span></div>
        <div class="sum-row"><span>Shipping</span><span>${shipping === 0 ? '<span style="color:var(--green)">FREE</span>' : '₹' + shipping}</span></div>
        <div class="sum-row grand"><span>Grand Total</span><span>₹${total.toLocaleString('en-IN')}</span></div>
        <div class="coupon-row">
          <input type="text" id="couponIn" placeholder="Enter coupon code"/>
          <button class="btn-outline" onclick="applyCoupon()">Apply</button>
        </div>
        <button class="btn-gold full" onclick="navigate('checkout')"><i class="fas fa-lock"></i> Secure Checkout</button>
        <button class="btn-ghost full" style="margin-top:10px" onclick="navigate('products')">Continue Shopping</button>
      </div>
    </div>`;
}

function applyCoupon() {
  const code = document.getElementById('couponIn')?.value?.trim()?.toUpperCase();
  if (code === 'WELCOME20') toast('🎉 20% discount applied!', 'ok');
  else toast('Invalid or expired coupon code', 'err');
}

function initCheckout() {
  const itemsEl  = document.getElementById('coItems');
  const totalsEl = document.getElementById('coTotals');
  if (!itemsEl || !totalsEl) return;

  if (!state.cart.length) { navigate('cart'); return; }

  const u = state.user || {};
  setVal('shName',    u.name);
  setVal('shPhone',   u.phone);
  setVal('shAddress', u.address);
  setVal('shCity',    u.city);

  const sub      = state.cart.reduce((s, i) => s + (i.price || 0) * (i.qty || 1), 0);
  const tax      = Math.round(sub * 0.18);
  const shipping = sub >= 999 ? 0 : 99;
  const total    = sub + tax + shipping;

  itemsEl.innerHTML = state.cart.map(i => `
    <div class="co-item">
      <span>${esc(i.name)} × ${i.qty || 1}</span>
      <span>₹${((i.price || 0) * (i.qty || 1)).toLocaleString('en-IN')}</span>
    </div>`).join('');

  totalsEl.innerHTML = `
    <div class="co-totals">
      <div class="tot-row"><span>Subtotal</span><span>₹${sub.toLocaleString('en-IN')}</span></div>
      <div class="tot-row"><span>GST (18%)</span><span>₹${tax.toLocaleString('en-IN')}</span></div>
      <div class="tot-row"><span>Shipping</span><span>${shipping === 0 ? 'FREE' : '₹' + shipping}</span></div>
      <div class="tot-row grand"><span>Total</span><span>₹${total.toLocaleString('en-IN')}</span></div>
    </div>`;

  document.querySelectorAll('.pay-opt').forEach(opt => {
    opt.addEventListener('click', () => {
      document.querySelectorAll('.pay-opt').forEach(o => o.classList.remove('selected'));
      opt.classList.add('selected');
    });
  });
}

async function placeOrder() {
  const name    = val('shName');
  const phone   = val('shPhone');
  const address = val('shAddress');
  const city    = val('shCity');
  const country = val('shCountry') || 'India';

  if (!name || !phone || !address || !city) {
    toast('⚠ Please fill in all shipping details', 'err'); return;
  }
  if (!state.cart.length) {
    toast('⚠ Your cart is empty', 'err'); return;
  }
  if (!state.token) {
    toast('⚠ Please login to place an order', 'err');
    navigate('login'); return;
  }

  const btn = document.getElementById('placeOrderBtn');
  btn.classList.add('btn-loading');
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Placing Order…';

  const sub      = state.cart.reduce((s, i) => s + (i.price || 0) * (i.qty || 1), 0);
  const tax      = Math.round(sub * 0.18);
  const shipping = sub >= 999 ? 0 : 99;
  const total    = sub + tax + shipping;
  const pm       = document.querySelector('input[name="pm"]:checked')?.value || 'COD';

  const body = {
    shippingInfo: {
      address,
      city,
      country,
      phone,
    },
    orderItems: state.cart.map(i => ({
      product:  i._id,
      name:     i.name,
      price:    i.price || 0,
      quantity: i.qty  || 1,
      image:    i.image || i.images?.[0]?.url || '',
    })),
    paymentMethod:   pm,
    paymentInfo:     { id: '', status: pm === 'COD' ? 'pending' : 'paid' },
    itemPrice:       sub,
    tax:             tax,
    shippingCharges: shipping,
    totalAmount:     total,
  };

  try {
    const data = await post(`${API}/order/create`, body);
    if (data.success) {
      state.cart = [];
      saveCart();
      updateBadge();
      showOrderSuccess(data.order?._id || '', total, pm);
    } else {
      throw new Error(data.message || 'Order failed');
    }
  } catch (e) {
    toast('Order error: ' + e.message, 'err');
  } finally {
    btn.classList.remove('btn-loading');
    btn.innerHTML = '<i class="fas fa-lock"></i> Place Order';
  }
}

function showOrderSuccess(orderId, total, pm) {
  state.lastOrderId = orderId;
  const idEl  = document.getElementById('successOrderId');
  const totEl = document.getElementById('successTotal');
  const pmEl  = document.getElementById('successPayment');
  if (idEl)  idEl.textContent  = orderId ? '#' + String(orderId).slice(-8).toUpperCase() : '#ORD' + Date.now().toString().slice(-6);
  if (totEl) totEl.textContent = '₹' + (total || 0).toLocaleString('en-IN');
  if (pmEl)  pmEl.textContent  = pm === 'ONLINE' ? '💳 Paid Online' : '💵 Cash on Delivery';
  navigate('ordersuccess');
}

function selectPay(radio) {
  document.querySelectorAll('.pay-opt').forEach(o => o.classList.remove('selected'));
  radio.closest('.pay-opt').classList.add('selected');
}

async function initAccount() {
  const u = state.user || {};
  const nameEl  = document.getElementById('accName');
  const emailEl = document.getElementById('accEmail');
  const avEl    = document.getElementById('avatarEl');
  if (nameEl)  nameEl.textContent  = u.name  || 'User';
  if (emailEl) emailEl.textContent = u.email || '';
  if (avEl)    avEl.textContent    = (u.name || 'U')[0].toUpperCase();

  setVal('pName',    u.name);
  setVal('pEmail',   u.email);
  setVal('pPhone',   u.phone);
  setVal('pCity',    u.city);
  setVal('pAddress', u.address);

  try {
    const data = await apiFetch(`${API}/user/profile`);
    if (data.success && data.user) {
      state.user = data.user;
      localStorage.setItem('user', JSON.stringify(data.user));
      if (nameEl)  nameEl.textContent  = data.user.name  || 'User';
      if (emailEl) emailEl.textContent = data.user.email || '';
      if (avEl)    avEl.textContent    = (data.user.name || 'U')[0].toUpperCase();
      setVal('pName', data.user.name);
      setVal('pEmail', data.user.email);
      setVal('pPhone', data.user.phone);
      setVal('pCity', data.user.city);
      setVal('pAddress', data.user.address);

      if (data.user.role === 'admin' || data.user.role === 1) {
        const ac = document.getElementById('adminCard');
        if (ac) { ac.style.display = 'block'; loadAdminStats(); }
      }
    }
  } catch {}

  loadMyOrders();
}

async function loadAdminStats() {
  try {
    const pd = await apiFetch(`${API}/product/get-all`);
    if (pd.success) setText('sTotalProducts', pd.totalProducts || pd.products?.length || 0);
  } catch {}
  try {
    const od = await apiFetch(`${API}/order/admin/get-all-orders`);
    if (od.success) {
      setText('sTotalOrders', od.totalOrders || od.orders?.length || 0);
      const rev = (od.orders || []).reduce((s, o) => s + (o.totalAmount || 0), 0);
      setText('sTotalRevenue', `₹${rev.toLocaleString('en-IN')}`);
    }
  } catch {}
}

async function loadMyOrders() {
  const el = document.getElementById('ordersList');
  if (!el) return;

  el.innerHTML = '<div style="text-align:center;padding:30px;color:#888"><div class="spinner"></div><p>Loading your orders…</p></div>';

  try {
    const data = await apiFetch(`${API}/order/my-orders`);
    if (data.success && data.orders?.length) {
      const STEPS = [
        { key: 'processing', label: 'Order Placed', icon: '📦' },
        { key: 'shipped',    label: 'Shipped',       icon: '🚚' },
        { key: 'deliverd',   label: 'Delivered',     icon: '✅' },
      ];

      el.innerHTML = data.orders.map(o => {
        const status  = (o.orderStatus || o.status || 'processing').toLowerCase();
        const stepIdx = STEPS.findIndex(s => s.key === status);
        const current = stepIdx === -1 ? 0 : stepIdx;
        const date    = new Date(o.createdAt).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' });
        const total   = o.totalAmount || o.total || 0;
        const pm      = o.paymentMethod || 'COD';

        const statusColors = { processing: '#f59e0b', shipped: '#3b82f6', deliverd: '#10b981' };
        const sColor = statusColors[status] || '#f59e0b';

        const trackBar = STEPS.map((step, i) => {
          const done    = i < current;
          const active  = i === current;
          const dotBg   = done ? '#10b981' : active ? sColor : 'transparent';
          const dotBord = done ? '#10b981' : active ? sColor : '#555';
          const dotClr  = done || active ? '#fff' : '#777';
          const lineBg  = i < current ? '#10b981' : '#333';
          return `
            <div style="display:flex;flex-direction:column;align-items:center;flex:1;position:relative">
              ${i > 0 ? `<div style="position:absolute;top:16px;right:50%;width:100%;height:3px;background:${lineBg};z-index:0"></div>` : ''}
              <div style="width:34px;height:34px;border-radius:50%;border:2px solid ${dotBord};background:${dotBg};color:${dotClr};display:flex;align-items:center;justify-content:center;font-size:.85rem;font-weight:700;z-index:1;position:relative">
                ${done ? '✓' : step.icon}
              </div>
              <div style="font-size:.7rem;margin-top:6px;text-align:center;color:${active ? sColor : done ? '#10b981' : '#666'};font-weight:${active ? '700' : '400'}">
                ${step.label}
              </div>
            </div>`;
        }).join('');

        const itemsList = (o.orderItems || o.items || []).map(item =>
          `<div style="display:flex;justify-content:space-between;font-size:.83rem;padding:4px 0;color:rgba(255,255,255,.72)">
            <span>${esc(item.name)} × ${item.quantity || 1}</span>
            <span>₹${((item.price||0)*(item.quantity||1)).toLocaleString('en-IN')}</span>
          </div>`
        ).join('');

        return `
          <div style="background:var(--card);border:1px solid var(--border);border-radius:14px;padding:18px;margin-bottom:16px">
            <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:14px">
              <div>
                <div style="font-weight:700;font-size:.95rem">Order #${(o._id||'').slice(-8).toUpperCase()}</div>
                <div style="font-size:.78rem;color:#888;margin-top:2px">${date}</div>
              </div>
              <div style="text-align:right">
                <span style="background:${sColor}22;color:${sColor};border:1px solid ${sColor}55;padding:3px 10px;border-radius:20px;font-size:.75rem;font-weight:600;text-transform:capitalize">${STEPS[current]?.label || status}</span>
                <div style="font-size:.75rem;color:#888;margin-top:4px">${pm === 'ONLINE' ? '💳 Paid Online' : '💵 COD'}</div>
              </div>
            </div>

            <div style="display:flex;justify-content:space-between;margin:16px 0 20px;position:relative">
              ${trackBar}
            </div>

            <div style="border-top:1px solid var(--border);padding-top:10px">${itemsList}</div>

            <div style="display:flex;justify-content:space-between;align-items:center;border-top:1px solid var(--border);padding-top:10px;margin-top:10px">
              <span style="font-size:.82rem;color:#888">Total Amount</span>
              <span style="font-weight:700;font-size:1rem;color:var(--gold)">₹${total.toLocaleString('en-IN')}</span>
            </div>
          </div>`;
      }).join('');
      return;
    }
  } catch(e) { console.error('Orders error:', e); }

  el.innerHTML = `
    <div class="empty-st">
      <i class="fas fa-box-open"></i>
      <p>No orders yet. Start shopping!</p>
      <button class="btn-gold" onclick="navigate('products')">Browse Products</button>
    </div>`;
}


function saveProfile() {
  const u = state.user || {};
  u.name    = val('pName');
  u.phone   = val('pPhone');
  u.city    = val('pCity');
  u.address = val('pAddress');
  state.user = u;
  localStorage.setItem('user', JSON.stringify(u));

  post(`${API}/user/profile-update`, { name: u.name, phone: u.phone, city: u.city, address: u.address })
    .catch(() => {});

  const nameEl = document.getElementById('accName');
  const avEl   = document.getElementById('avatarEl');
  if (nameEl) nameEl.textContent = u.name || 'User';
  if (avEl)   avEl.textContent   = (u.name || 'U')[0].toUpperCase();
  toast('✓ Profile updated!', 'ok');
}

function showTab(tabName, linkEl) {
  document.querySelectorAll('.acc-tab').forEach(t => t.style.display = 'none');
  document.querySelectorAll('.acc-link').forEach(l => l.classList.remove('active'));
  const tab = document.getElementById(`tab-${tabName}`);
  if (tab) tab.style.display = 'flex';
  if (linkEl) linkEl.classList.add('active');
  else {
    document.querySelectorAll('.acc-link').forEach(l => {
      if (l.getAttribute('onclick')?.includes(`'${tabName}'`)) l.classList.add('active');
    });
  }
}

function toggleWishlist(id, btn) {
  const idx = state.wishlist.indexOf(id);
  if (idx === -1) {
    state.wishlist.push(id);
    if (btn) { btn.classList.add('on'); const i = btn.querySelector('i'); if (i) i.className = 'fas fa-heart'; }
    toast('Added to wishlist ♥', 'ok');
  } else {
    state.wishlist.splice(idx, 1);
    if (btn) { btn.classList.remove('on'); const i = btn.querySelector('i'); if (i) i.className = 'far fa-heart'; }
    toast('Removed from wishlist');
  }
  localStorage.setItem('wishlist', JSON.stringify(state.wishlist));
}

function toggleMenu() {
  document.getElementById('mobMenu')?.classList.toggle('open');
}

function togglePw(id, btn) {
  const inp  = document.getElementById(id);
  const icon = btn.querySelector('i');
  if (!inp) return;
  if (inp.type === 'password') { inp.type = 'text'; icon.className = 'fas fa-eye-slash'; }
  else                         { inp.type = 'password'; icon.className = 'fas fa-eye'; }
}

function showMsg(el, msg, type = 'err') {
  if (!el) return;
  el.className  = `msg ${type}`;
  el.textContent = msg;
  el.style.display = 'flex';
}
function hideMsg(el) { if (el) el.style.display = 'none'; }

let _toastTimer;
function toast(msg, type = '') {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.className = `toast show ${type}`;
  clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => t.classList.remove('show'), 3500);
}

function val(id) { return (document.getElementById(id)?.value || '').trim(); }
function setVal(id, v) { const e = document.getElementById(id); if (e && v) e.value = v; }
function setText(id, v) { const e = document.getElementById(id); if (e) e.textContent = v; }
function esc(s) { return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

async function apiFetch(url, opts = {}) {
  const headers = { 'Content-Type': 'application/json', ...opts.headers };
  if (state.token) headers['Authorization'] = `Bearer ${state.token}`;
  const res  = await fetch(url, { ...opts, headers });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || `Error ${res.status}`);
  return data;
}

async function post(url, body) {
  return apiFetch(url, { method: 'POST', body: JSON.stringify(body) });
}

function getDemoProducts(n = 8) {
  const names = [
    'Wireless Noise-Cancelling Headphones', 'Smart Watch Series 5', 'Premium Leather Handbag',
    'Running Shoes Pro Elite', 'Vitamin C Serum 30ml', 'Mechanical Gaming Keyboard',
    'Silk Blend Formal Shirt', 'Insulated Steel Water Bottle', 'Portable Bluetooth Speaker',
    '4K Ultra HD Webcam', 'Slim Leather Wallet', 'Professional Yoga Mat',
    'Stainless Steel Cookware Set', 'Wireless Charging Pad', 'Canvas Backpack',
    'Digital Air Fryer 5L'
  ];
  const descs = [
    'Experience premium sound with active noise cancellation and 30-hour battery life.',
    'Track fitness, sleep, and health metrics with this advanced smartwatch.',
    'Genuine full-grain leather with gold-tone hardware. Spacious and stylish.',
    'Engineered for performance athletes. Lightweight, responsive, and durable.',
    'Brightens skin and reduces dark spots with 20% pure Vitamin C formula.',
    'Tactile mechanical switches, RGB backlighting, and anti-ghosting technology.',
  ];
  const cats  = ['Electronics','Fashion','Beauty','Sports','Home','Gaming'];
  const prices = [1499,2999,3499,1199,599,2199,899,449,1299,3999,349,799,4999,999,1099,5499];

  return Array.from({ length: n }, (_, i) => ({
    _id:         `demo-${i + 1}`,
    name:        names[i % names.length],
    description: descs[i % descs.length],
    price:       prices[i % prices.length],
    stock:       Math.floor(Math.random() * 50) + 5,
    rating:      parseFloat((3.6 + Math.random() * 1.3).toFixed(1)),
    numReviews:  Math.floor(Math.random() * 300) + 10,
    category:    cats[i % cats.length],
    image:       `https://picsum.photos/seed/product${i + 1}/400/400`,
    images:      [{ url: `https://picsum.photos/seed/product${i + 1}/400/400` }],
  }));
}