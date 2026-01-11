/* АвтоПостер — магазин без сервера.
   Корзина в localStorage. Оформление -> Telegram @artem_myuu
   Темы: dark/light (храним в localStorage)
*/

const TG_USERNAME = "artem_myuu";
const CART_KEY = "autoposter_cart_v2";
const THEME_KEY = "autoposter_theme_v1";

const PRODUCTS = [
  {
    id: "metal_uv_poster",
    title: "Постер на металле (УФ‑печать)",
    subtitle: "Металл 4 мм • УФ‑принтер • дизайн включён",
    description:
      "Премиальная печать на металле толщиной 4 мм. После оформления мы уточним стиль, текст и детали — и пришлём макет на согласование в Telegram.",
    thumb: "assets/examples/61172187-24DB-4B08-84A6-8BD3E0CD5D3A.jpeg",
    options: [
      { size: "60×80", price: 9404 },
      { size: "70×100", price: 12110 },
      { size: "80×120", price: 15308 },
      { size: "120×100", price: 18260 },
      { size: "100×150", price: 21950 },
    ],
    minOrder: 9404
  }
];

const fmtRub = (n) =>
  new Intl.NumberFormat("ru-RU", { style: "currency", currency: "RUB", maximumFractionDigits: 0 }).format(n);

const $ = (sel, root=document) => root.querySelector(sel);
const $$ = (sel, root=document) => Array.from(root.querySelectorAll(sel));

function toast(msg){
  const el = $("#toast");
  if(!el) return;
  el.textContent = msg;
  el.classList.add("show");
  setTimeout(()=> el.classList.remove("show"), 1700);
}

/* ---- theme ---- */
function getTheme(){
  const saved = localStorage.getItem(THEME_KEY);
  if(saved === "dark" || saved === "light") return saved;
  // default: dark for premium feel
  return "dark";
}

function setTheme(theme){
  const t = theme === "light" ? "light" : "dark";
  document.documentElement.setAttribute("data-theme", t);
  localStorage.setItem(THEME_KEY, t);
  const btn = $("#themeToggle");
  if(btn){
    btn.setAttribute("aria-label", t === "dark" ? "Переключить на светлую тему" : "Переключить на тёмную тему");
    btn.textContent = t === "dark" ? "☾" : "☀";
  }
}

function toggleTheme(){
  const current = document.documentElement.getAttribute("data-theme") || "dark";
  setTheme(current === "dark" ? "light" : "dark");
}

/* ---- cart state ---- */
function loadCart(){
  try{
    const raw = localStorage.getItem(CART_KEY);
    if(!raw) return [];
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data : [];
  }catch(e){
    return [];
  }
}

function saveCart(items){
  localStorage.setItem(CART_KEY, JSON.stringify(items));
  updateCartUI();
}

function cartCount(items){
  return items.reduce((s,it)=> s + (it.qty || 0), 0);
}

function cartTotal(items){
  return items.reduce((s,it)=> s + (it.price * it.qty), 0);
}

function addToCart(productId, size){
  const product = PRODUCTS.find(p=>p.id===productId);
  const opt = product.options.find(o=>o.size===size);
  const items = loadCart();
  const key = `${productId}__${size}`;
  const existing = items.find(i=>i.key===key);
  if(existing){
    existing.qty += 1;
  }else{
    items.push({
      key,
      productId,
      title: product.title,
      size,
      price: opt.price,
      thumb: product.thumb,
      qty: 1
    });
  }
  saveCart(items);
  toast("Добавлено в корзину");
}

function changeQty(key, delta){
  const items = loadCart();
  const it = items.find(i=>i.key===key);
  if(!it) return;
  it.qty += delta;
  if(it.qty <= 0){
    const idx = items.findIndex(i=>i.key===key);
    items.splice(idx, 1);
  }
  saveCart(items);
}

function clearCart(){
  saveCart([]);
  toast("Корзина очищена");
}

/* ---- render product ---- */
function renderProduct(){
  const product = PRODUCTS[0];
  $("#productTitle").textContent = product.title;
  $("#productSubtitle").textContent = product.subtitle;
  $("#productDesc").textContent = product.description;
  $("#productThumb").src = product.thumb;

  const select = $("#sizeSelect");
  select.innerHTML = "";
  product.options.forEach(o=>{
    const opt = document.createElement("option");
    opt.value = o.size;
    opt.textContent = `${o.size} — ${fmtRub(o.price)}`;
    select.appendChild(opt);
  });

  const min = Math.min(...product.options.map(o=>o.price));
  $("#priceFrom").innerHTML = `<strong>${fmtRub(min)}</strong> <span style="display:block; font-size:12px; opacity:.9;">минимальный заказ</span>`;
}

/* ---- cart drawer ---- */
function openDrawer(){
  $("#drawerOverlay").classList.add("open");
  $("#drawer").classList.add("open");
  document.body.style.overflow = "hidden";
}
function closeDrawer(){
  $("#drawerOverlay").classList.remove("open");
  $("#drawer").classList.remove("open");
  document.body.style.overflow = "";
}

function updateCartUI(){
  const items = loadCart();
  const count = cartCount(items);

  const cc = $("#cartCount");
  if(cc){
    cc.textContent = count;
    cc.style.display = count ? "inline-flex" : "none";
  }

  const list = $("#cartList");
  if(!list) return;
  list.innerHTML = "";
  if(items.length === 0){
    list.innerHTML = `<div class="empty">Корзина пустая. Выбери размер — и оформим заказ в Telegram.</div>`;
  }else{
    items.forEach(it=>{
      const row = document.createElement("div");
      row.className = "cartItem";
      row.innerHTML = `
        <img src="${it.thumb}" alt="">
        <div>
          <h4>${it.title}</h4>
          <div class="meta">Размер: <b>${it.size}</b> • ${fmtRub(it.price)} / шт</div>
        </div>
        <div class="right">
          <div class="qty">
            <button class="iconBtn" data-act="dec" aria-label="minus">−</button>
            <b>${it.qty}</b>
            <button class="iconBtn" data-act="inc" aria-label="plus">+</button>
          </div>
          <div class="price">${fmtRub(it.price * it.qty)}</div>
        </div>
      `;
      row.querySelector('[data-act="dec"]').addEventListener("click", ()=>changeQty(it.key, -1));
      row.querySelector('[data-act="inc"]').addEventListener("click", ()=>changeQty(it.key, +1));
      list.appendChild(row);
    });
  }

  const total = cartTotal(items);
  $("#cartTotal").textContent = fmtRub(total);

  // minimum order notice
  const min = PRODUCTS[0].minOrder;
  const warn = $("#minWarn");
  const checkout = $("#checkoutBtn");

  if(total > 0 && total < min){
    warn.style.display = "block";
    warn.innerHTML = `Минимальный заказ — <b>${fmtRub(min)}</b>. Выберите другой размер или добавьте ещё один постер.`;
    checkout.disabled = true;
  }else{
    warn.style.display = "none";
    checkout.disabled = items.length===0;
  }
}

/* ---- checkout to Telegram ---- */
function buildOrderMessage(){
  const items = loadCart();
  const total = cartTotal(items);

  const delivery = $("#deliverySelect").value; // "rf" | "by"
  const city = $("#cityInput").value.trim();
  const comment = $("#commentInput").value.trim();

  const lines = [];
  lines.push("Здравствуйте! Хочу оформить заказ в АвтоПостер:");
  lines.push("");

  items.forEach((it, idx)=>{
    lines.push(`${idx+1}) ${it.title}`);
    lines.push(`   • Размер: ${it.size}`);
    lines.push(`   • Кол-во: ${it.qty}`);
    lines.push(`   • Сумма: ${fmtRub(it.price * it.qty)}`);
  });

  lines.push("");
  lines.push(`Доставка: ${delivery === "by" ? "Республика Беларусь (с доплатой)" : "РФ (бесплатно)"}`);
  if(city) lines.push(`Город/адрес: ${city}`);
  if(comment) lines.push(`Пожелания по стилю/тексту: ${comment}`);
  lines.push("");
  lines.push(`Итого: ${fmtRub(total)}`);
  lines.push("");
  lines.push("Фото/референсы пришлю сюда. Жду макет на согласование 🙂");

  return lines.join("\n");
}

function openTelegramOrder(){
  const items = loadCart();
  if(items.length === 0) return;

  const total = cartTotal(items);
  const min = PRODUCTS[0].minOrder;
  if(total < min){
    toast("Сумма ниже минимального заказа");
    return;
  }

  const msg = buildOrderMessage();
  const encoded = encodeURIComponent(msg);

  const tgDeep = `tg://resolve?domain=${TG_USERNAME}&text=${encoded}`;
  const tgWeb  = `https://t.me/${TG_USERNAME}?text=${encoded}`;

  window.location.href = tgDeep;
  setTimeout(()=>{ window.open(tgWeb, "_blank"); }, 450);
}

/* ---- smooth scroll + offset for sticky header ---- */
function scrollToId(id){
  const el = document.querySelector(id);
  if(!el) return;
  const y = el.getBoundingClientRect().top + window.scrollY - 78;
  window.scrollTo({ top: y, behavior: "smooth" });
}

/* ---- scroll animations (adaptive) ---- */
function initScrollAnimations(){
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if(reduce){
    $$("[data-animate]").forEach(el => el.classList.add("in"));
    return;
  }

  const io = new IntersectionObserver((entries)=>{
    entries.forEach(ent=>{
      if(ent.isIntersecting){
        ent.target.classList.add("in");
        io.unobserve(ent.target);
      }
    });
  }, { threshold: 0.16 });

  $$("[data-animate]").forEach(el => io.observe(el));
}

/* ---- init ---- */
document.addEventListener("DOMContentLoaded", ()=>{
  setTheme(getTheme());
  renderProduct();
  updateCartUI();
  initScrollAnimations();

  $("#themeToggle")?.addEventListener("click", toggleTheme);

  $("#addBtn").addEventListener("click", ()=>{
    const size = $("#sizeSelect").value;
    addToCart(PRODUCTS[0].id, size);
  });

  $("#openCart").addEventListener("click", openDrawer);
  $("#drawerClose").addEventListener("click", closeDrawer);
  $("#drawerOverlay").addEventListener("click", closeDrawer);

  $("#clearBtn").addEventListener("click", clearCart);
  $("#checkoutBtn").addEventListener("click", openTelegramOrder);

  // nav anchors (with offset)
  $$('.navlinks a[href^="#"]').forEach(a=>{
    a.addEventListener("click",(e)=>{
      e.preventDefault();
      scrollToId(a.getAttribute("href"));
    });
  });

  // hero CTA
  $("#goCatalog")?.addEventListener("click", ()=> scrollToId("#catalog"));
  $("#goExamples")?.addEventListener("click", ()=> scrollToId("#examples"));
});