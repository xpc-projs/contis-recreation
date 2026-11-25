
const DATA = { products: [], collections: [], branches: [] };
if (!document.querySelector('link[rel~="icon"]')) {
  const favicon = document.createElement('link');
  favicon.rel = 'icon';
  favicon.type = 'image/png';
  favicon.href = '/assets/images/brand/contis-logo.png';
  document.head.append(favicon);
}
const STORE = {
  get(key, fallback){ try{return JSON.parse(localStorage.getItem('contis_'+key)) ?? fallback}catch{return fallback} },
  set(key,value){ localStorage.setItem('contis_'+key,JSON.stringify(value)); },
  id(prefix='CT'){ return prefix+'-'+Date.now().toString(36).toUpperCase()+'-'+Math.random().toString(36).slice(2,7).toUpperCase(); }
};
const money = n => new Intl.NumberFormat('en-PH',{style:'currency',currency:'PHP',maximumFractionDigits:2}).format(n);
const esc = s => String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const requestedPath = decodeURI(location.pathname.replace(/\/+$/,'') || '/');
const path = requestedPath === '/index.html' ? '/' : requestedPath;
const app = document.querySelector('#app');
const productUrl = p => `/products/${p.id}`;
function toast(message, { title, action, error = false } = {}) {
  const area = document.getElementById('toast-area');
  const previousFocus = document.activeElement;
  const notice = document.createElement('div');
  notice.className = error ? 'site-toast site-toast-error' : 'site-toast';
  notice.innerHTML = `
    <div class="site-toast-content">
      ${title ? `<strong>${esc(title)}</strong>` : ''}
      <p>${esc(message)}</p>
      ${action?.href ? `<a class="site-toast-action" href="${esc(action.href)}">${esc(action.label)}</a>` :
        action ? `<button class="site-toast-action" type="button">${esc(action.label)}</button>` : ''}
    </div>
    <button class="site-toast-close" type="button" aria-label="Dismiss notification">×</button>
  `;

  let timer;
  function dismiss() {
    clearTimeout(timer);
    if (notice.contains(document.activeElement)) previousFocus?.focus();
    notice.remove();
  }

  function resumeTimeout() {
    clearTimeout(timer);
    if (!error && notice.isConnected && !notice.matches(':hover, :focus-within')) {
      timer = setTimeout(dismiss, action ? 7000 : 4500);
    }
  }

  notice.querySelector('.site-toast-close').addEventListener('click', dismiss);
  notice.querySelector('button.site-toast-action')?.addEventListener('click', action.run);
  notice.addEventListener('pointerenter', () => clearTimeout(timer));
  notice.addEventListener('pointerleave', resumeTimeout);
  notice.addEventListener('focusin', () => clearTimeout(timer));
  notice.addEventListener('focusout', () => queueMicrotask(resumeTimeout));
  area.setAttribute('aria-atomic', 'false');
  area.append(notice);
  area.scrollTop = area.scrollHeight;
  resumeTimeout();
  return dismiss;
}
function updateCounts(){const cartCount=document.querySelector('#cart-count');if(cartCount)cartCount.textContent=STORE.get('cart',[]).reduce((s,x)=>s+x.qty,0);const wishlistCount=document.querySelector('#wishlist-count');if(wishlistCount)wishlistCount.textContent=STORE.get('wishlist',[]).length}
function findProductById(id){return DATA.products.find(product=>product.id===id||(product.aliases||[]).includes(id))}
function searchProducts(query) {
  const normalize = text => text.toLowerCase().normalize('NFD')
    .replace(/\p{M}/gu, '').replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
  const phrase = normalize(query);
  if (!phrase) return [];

  const words = phrase.split(' ');
  return DATA.products.flatMap(product => {
    const name = normalize(product.name);
    const text = `${name} ${normalize([product.category, product.subcategory, product.description].join(' '))}`;
    if (!words.every(word => text.includes(word))) return [];
    const rank = name === phrase ? 0 : name.startsWith(phrase) ? 1 :
      words.every(word => name.includes(word)) ? 2 : 3;
    return [{ product, rank }];
  }).sort((a, b) => a.rank - b.rank).map(match => match.product);
}
function addCart(id,qty=1,priceOverride){const p=findProductById(id);if(!p)return;const cart=STORE.get('cart',[]);const line=cart.find(x=>x.id===p.id);const price=Number.isFinite(priceOverride)?priceOverride:p.price;if(line)line.qty+=qty;else cart.push({id:p.id,qty,price});STORE.set('cart',cart);updateCounts();toast(`${p.name} × ${qty}`, {
  title: 'Added to cart',
  action: { label: 'View cart', href: '/cart' }
})}
function isWishlisted(id){return STORE.get('wishlist',[]).includes(id)}
function toggleWishlist(id){const wishlist=STORE.get('wishlist',[]);const next=wishlist.includes(id)?wishlist.filter(item=>item!==id):[...wishlist,id];STORE.set('wishlist',next);updateCounts();document.querySelectorAll('[data-wishlist]').forEach(button=>{if(button.dataset.wishlist!==id)return;const active=next.includes(id);button.setAttribute('aria-pressed',String(active));button.setAttribute('aria-label',active?'Remove from wishlist':'Add to wishlist');button.classList.toggle('is-wishlisted',active);if(button.classList.contains('product-detail-wishlist'))button.innerHTML=`${active?'♥':'♡'} <span>${active?'Saved to wishlist':'Add to wishlist'}</span>`;else button.innerHTML=`<span aria-hidden="true">${active?'♥':'♡'}</span>`});if(path==='/pages/wishlist')renderWishlist()}
function scheduleLabel(){const schedule=STORE.get('schedule',null);return schedule?.date?new Date(`${schedule.date}T00:00:00`).toLocaleDateString('en-PH',{month:'short',day:'numeric'}):'Select schedule'}
function localDateInputValue() {
 const now = new Date();
 return new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}
function openSchedule(productId){const product=findProductById(productId);if(!product)return;let dialog=document.querySelector('#schedule-dialog');if(!dialog){dialog=document.createElement('dialog');dialog.id='schedule-dialog';dialog.className='schedule-dialog';dialog.innerHTML='<form method="dialog" class="schedule-dialog-form"><button class="product-image-dialog-close" type="submit" aria-label="Close">×</button><div class="eyebrow">Plan your order</div><h2 class="page-title">Select a schedule</h2><p class="muted" id="schedule-product-name"></p><label class="form-label" for="schedule-fulfillment">Fulfillment</label><select class="form-select mb-3" id="schedule-fulfillment"><option>Pick-up</option><option>Delivery</option></select><label class="form-label" for="schedule-date">Preferred date</label><input class="form-control mb-4" type="date" id="schedule-date" required><div class="d-flex gap-2"><button class="btn btn-outline-contis" type="button" data-schedule-cancel>Cancel</button><button class="btn btn-contis" type="submit">Save schedule</button></div><p class="small muted mt-3 mb-0">This choice is saved in this browser and does not place an order.</p></form>';document.body.append(dialog);dialog.querySelector('[data-schedule-cancel]').addEventListener('click',()=>dialog.close());dialog.querySelector('form').addEventListener('submit',event=>{event.preventDefault();const date=dialog.querySelector('#schedule-date').value;if(!date)return;const fulfillment=dialog.querySelector('#schedule-fulfillment').value;STORE.set('schedule',{date,fulfillment});dialog.close();document.querySelectorAll('.product-schedule-badge').forEach(button=>button.textContent=scheduleLabel());const formattedDate=new Date(`${date}T00:00:00`).toLocaleDateString('en-PH',{dateStyle:'long'});toast(`${fulfillment} · ${formattedDate}`,{title:'Schedule saved'})})}const schedule=STORE.get('schedule',null);dialog.querySelector('#schedule-product-name').textContent=product.name;dialog.querySelector('#schedule-date').value=schedule?.date||'';dialog.querySelector('#schedule-date').min=localDateInputValue();dialog.querySelector('#schedule-fulfillment').value=schedule?.fulfillment||'Pick-up';dialog.showModal()}
function recordView(p){let a=STORE.get('recent',[]).filter(x=>x!==p.id);a.unshift(p.id);STORE.set('recent',a.slice(0,8))}
function slugify(value){return String(value).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')}
function subcategoryLabel(category,subcategory){if(category!=='Food Trays')return subcategory;return ({'Large Food Order':'Packed Meals','Lunch/Dinner Set Menu':'Set Menu','Soups':'Hearty Soups'})[subcategory]||subcategory}
function subcategorySlug(category,subcategory){if(category!=='Food Trays')return slugify(subcategory);return ({'Large Food Order':'packed-meals','Lunch/Dinner Set Menu':'set-menu','Soups':'hearty-soups'})[subcategory]||slugify(subcategory)}
function catalogLayout(){const layout=STORE.get('catalog-layout','grid-6');return layout==='list'||/^grid-[2-6]$/.test(layout)?layout:'grid-6'}
function layoutControls(layout){return `<div class="catalog-view-controls" role="group" aria-label="Product layout">${[{id:'list',label:'List view',columns:0},...Array.from({length:5},(_,i)=>({id:`grid-${i+2}`,label:`${i+2} columns`,columns:i+2}))].map(option=>`<button class="catalog-view-button ${layout===option.id?'active':''}" type="button" data-layout="${option.id}" aria-label="${option.label}" aria-pressed="${layout===option.id}"><span class="catalog-view-icon ${option.id==='list'?'list-icon':`grid-icon grid-icon-${option.columns}`}" aria-hidden="true">${option.id==='list'?'<i></i><i></i><i></i>':'<i></i>'.repeat(option.columns*2)}</span></button>`).join('')}</div>`}
function setupNavigation(){
 const nav=document.querySelector('.navbar-nav');
 if(!nav)return;
 const helpItem=nav.querySelector('a.nav-link[href="/a/self-faq"]')?.closest('.nav-item');
 nav.querySelector('a.nav-link[href="/pages/take-out-nook"]')?.closest('.nav-item')?.remove();
 const headerActions=document.querySelector('.header-actions');
 const accountLink=headerActions?.querySelector('a[href="/account/login"]');
 if(headerActions&&accountLink&&!headerActions.querySelector('.header-wishlist'))accountLink.insertAdjacentHTML('afterend','<a class="header-wishlist" href="/pages/wishlist" aria-label="Wishlist"><span aria-hidden="true">♡</span><span id="wishlist-count">0</span></a>');
 const menuItem=Array.from(nav.querySelectorAll('.nav-item.dropdown')).find(item=>item.querySelector('.nav-link')?.getAttribute('href')==='/collections/all');
 if(menuItem){
  const link=menuItem.querySelector('.nav-link');
  link.textContent='Menu';
  link.classList.remove('dropdown-toggle');
  link.removeAttribute('data-bs-toggle');
  link.removeAttribute('role');
  link.setAttribute('href','/collections/all');
  if(!menuItem.querySelector('.nav-dropdown-toggle')){
   const toggle=document.createElement('button');
   toggle.className='nav-dropdown-toggle d-lg-none';
   toggle.type='button';
   toggle.setAttribute('data-bs-toggle','dropdown');
   toggle.setAttribute('aria-label','Show menu categories');
   toggle.setAttribute('aria-expanded','false');
   toggle.innerHTML='<span aria-hidden="true">⌄</span>';
   link.after(toggle);
  }
  const dropdown=menuItem.querySelector('.dropdown-menu');
  if(dropdown&&DATA.collections.length){
   dropdown.innerHTML=DATA.collections.filter(collection=>collection.menuItem).map(collection=>`<li><a class="dropdown-item" href="${esc(collection.path)}">${esc(collection.title)}</a></li>`).join('');
  }
 }
 if(!nav.querySelector('.nav-services')){
  const item=document.createElement('li');
  item.className='nav-item dropdown nav-services';
  item.innerHTML='<a class="nav-link" href="/pages/services">Services</a><button class="nav-dropdown-toggle d-lg-none" type="button" data-bs-toggle="dropdown" aria-label="Show services" aria-expanded="false"><span aria-hidden="true">⌄</span></button><ul class="dropdown-menu"><li><a class="dropdown-item" href="/pages/delivery">Delivery &amp; Pick-up</a></li><li><a class="dropdown-item" href="/pages/dine-in">Dine In</a></li><li><a class="dropdown-item" href="/pages/catering">Catering</a></li><li><a class="dropdown-item" href="/pages/celebration-venues">Celebration Venues</a></li><li><a class="dropdown-item" href="/pages/take-out-nook">Take-Out Nook</a></li></ul>';
  if(helpItem)helpItem.before(item);
  else nav.append(item);
 }
 const searchLink=document.querySelector('.header-actions a[aria-label="Search"]');
 if(searchLink&&!document.querySelector('.header-search')){
  const search=document.createElement('div');
  search.className='header-search';
  search.innerHTML='<button class="header-search-toggle" type="button" aria-expanded="false" aria-controls="header-search-panel">Search</button><div class="header-search-panel" id="header-search-panel" hidden><form action="/search" method="get" role="search"><label class="visually-hidden" for="header-search-input">Search products</label><input id="header-search-input" class="form-control" type="search" name="q" placeholder="Search products" autocomplete="off" required><button class="btn btn-contis" type="submit">Search</button></form><div class="search-preview" id="header-search-preview" aria-live="polite"></div></div>';
  searchLink.replaceWith(search);
  const toggle=search.querySelector('.header-search-toggle');
  const panel=search.querySelector('.header-search-panel');
  const input=search.querySelector('#header-search-input');
  const preview=search.querySelector('#header-search-preview');
  toggle.addEventListener('click',()=>{
   const open=panel.hidden;
   panel.hidden=!open;
   toggle.setAttribute('aria-expanded',String(open));
   if(open)input.focus();
  });
  input.addEventListener('input',()=>{
   const query=input.value.trim().toLowerCase();
   if(!query){preview.innerHTML='';return}
   const matches=searchProducts(query).slice(0,5);
   preview.innerHTML=matches.length?`${matches.map(product=>`<a class="search-preview-item" href="${productUrl(product)}"><span>${esc(product.name)}</span><small>${esc(product.category)} · ${esc(product.priceLabel||money(product.price))}</small></a>`).join('')}<a class="search-preview-all" href="/search/?q=${encodeURIComponent(input.value.trim())}">See all results for “${esc(input.value.trim())}”</a>`:'<p class="search-preview-empty">No matching products found.</p>';
  });
  search.querySelector('form').addEventListener('submit',event=>{
   event.preventDefault();
   const query=input.value.trim();
   if(query)location.href=`/search/?q=${encodeURIComponent(query)}`;
  });
  input.addEventListener('keydown',event=>{
   if(event.key==='Escape'){panel.hidden=true;toggle.setAttribute('aria-expanded','false');toggle.focus()}
  });
  document.addEventListener('click',event=>{
   if(!search.contains(event.target)){panel.hidden=true;toggle.setAttribute('aria-expanded','false')}
  });
 }
}
function productCard(p){
 const image=p.image?`<img src="${esc(p.image)}" alt="${esc(p.name)}" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'"><div class="asset-pending" style="display:none"><strong>${esc(p.name)}</strong><br><small>Product photo unavailable</small></div>`:`<div class="asset-pending"><strong>${esc(p.name)}</strong><br><small>Product photo unavailable</small></div>`;
 const favorite=isWishlisted(p.id);
 const price=p.price>0?`<div class="product-price">${esc(p.priceLabel||money(p.price))}</div>`:'<div class="product-price">Price unavailable</div>';
 const actions=p.price>0?`<div class="quick-quantity"><button type="button" data-card-qty-delta="-1" aria-label="Decrease quantity">−</button><input type="number" min="1" value="1" inputmode="numeric" aria-label="${esc(p.name)} quantity"><button type="button" data-card-qty-delta="1" aria-label="Increase quantity">+</button></div><button class="quick-add-button" type="button" data-add="${esc(p.id)}" data-add-quantity="1">Add to cart</button>`:'<button class="quick-add-button" type="button" disabled>Price unavailable</button>';
 return `<article class="product-card"><div class="product-card-visual"><a class="product-card-image" href="${productUrl(p)}">${image}</a><button class="product-schedule-badge" type="button" data-open-schedule="${esc(p.id)}">${esc(scheduleLabel())}</button><button class="product-wishlist ${favorite?'is-wishlisted':''}" type="button" data-wishlist="${esc(p.id)}" aria-label="${favorite?'Remove from wishlist':'Add to wishlist'}" aria-pressed="${favorite}"><span aria-hidden="true">${favorite?'♥':'♡'}</span></button></div><div class="product-info"><div class="product-category">${esc(subcategoryLabel(p.category,p.subcategory)||p.category)}</div><a href="${productUrl(p)}" class="product-title d-block">${esc(p.name)}</a>${price}<p class="product-list-description">${esc(p.description||'')}</p></div><div class="product-card-actions">${actions}</div></article>`;
}
function grid(items,layout='grid-4'){const columns=layout.startsWith('grid-')?Number(layout.slice(5)):4;return `<div class="product-grid ${layout==='list'?'layout-list':`layout-grid layout-grid-${columns}`}">${items.map(productCard).join('')}</div>`}
function categoryCard({title,count,image,path}){const media=image?`<img src="${esc(image)}" alt="" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.hidden=false"><span class="category-tile-placeholder" hidden>${esc(title)}</span>`:`<span class="category-tile-placeholder">${esc(title)}</span>`;return `<a class="subcategory-tile" href="${esc(path)}"><span class="subcategory-tile-media">${media}<span class="subcategory-tile-title">${esc(title)}</span></span><span class="subcategory-tile-count">${count} ${count===1?'product':'products'}</span></a>`}
function layoutPickerHtml(layout){return `<div class="catalog-listing-toolbar"><span class="muted">View as</span>${layoutControls(layout)}</div>`}
function crumb(label){return `<nav aria-label="breadcrumb"><ol class="breadcrumb"><li class="breadcrumb-item"><a href="/">Home</a></li><li class="breadcrumb-item active">${esc(label)}</li></ol></nav>`}
function section(title,desc,items,link){return `<section class="mb-5"><div class="section-heading"><div><h2>${title}</h2><p>${desc}</p></div>${link?`<a href="${link}" class="btn btn-outline-contis">View all</a>`:''}</div>${grid(items)}</section>`}
function renderHome(){
 const picks=['mango-bravo','improved-cheese-roll','ube-custard'].map(findProductById).filter(Boolean);
 const cakes=DATA.products.filter(product=>product.collections.includes('Fabulous Cakes')).slice(0,4);
 const goodies=DATA.products.filter(product=>product.collections.includes('Baked Goodies')).slice(0,4);
 const slides=[
  {theme:'gifts',image:'/assets/images/banners/gift-sets.png',imageAlt:'Gift bags and assorted bakery treats arranged for sharing',eyebrow:'Thoughtful gifts',title:'Make a gift feel personal.',description:'Explore three curated bundles of bakery treats, then make the selection your own.',highlights:['Gift A','Gift B','Gift C','Customizable'],action:'Browse gift sets',href:'/collections/take-out-nook/gift-sets'},
  {theme:'treats',image:'/assets/images/banners/whoopie-crunch-pie.png',imageAlt:'Three filled whoopie pies in different flavors',eyebrow:'Whoopie Crunch Pies',title:'Try a new twist on a sweet treat.',description:'Pick from pistachio, ube, or chocolate-forward varieties for a playful mix of crisp and soft.',highlights:['Pistachio','Ube','Chocolate'],action:'Browse sweet treats',href:'/collections/take-out-nook/sweet-treats'},
  {theme:'gatherings',image:'/assets/images/banners/dining-packages.png',imageAlt:'A spread of dishes prepared for a group meal',eyebrow:'Food for the whole group',title:'Plan something good for everyone.',description:'Choose an in-branch celebration package or practical packed meals for your guests.',highlights:['Private functions','Curated dining','Packed meals'],action:'Browse packed meals',href:'/collections/large-food-order',secondaryAction:'Find a venue',secondaryHref:'/pages/celebration-venues'},
  {theme:'cakes',image:'/assets/images/banners/moca-latte.png',imageAlt:'A chocolate mocha cake with a plated slice',eyebrow:'New cake favorites',title:'A new centerpiece for your next celebration.',description:'Explore the coffee-rich Mocha Latte and the chilled Frozen Brazo, alongside more cakes to share.',highlights:['Mocha Latte','Frozen Brazo','Celebration cakes'],action:'Explore cakes',href:'/collections/fabulous-cakes'}
 ];
 const hero=`<section id="home-featured-carousel" class="home-carousel carousel slide" aria-label="Featured collections">
  <div class="carousel-inner" aria-live="off">
   ${slides.map((slide,index)=>`<div class="carousel-item ${index===0?'active':''}" role="group" aria-roledescription="slide" aria-label="${index+1} of ${slides.length}">
    <div class="home-carousel-slide home-carousel-slide--${slide.theme}">
     <div class="home-carousel-copy">
      <div class="eyebrow">${esc(slide.eyebrow)}</div>
      <h1>${esc(slide.title)}</h1>
      <p>${esc(slide.description)}</p>
      <div class="home-carousel-highlights">${slide.highlights.map(highlight=>`<span>${esc(highlight)}</span>`).join('')}</div>
      <div class="home-carousel-actions">
       <a class="btn btn-contis" href="${esc(slide.href)}">${esc(slide.action)}<span aria-hidden="true"> →</span></a>
       ${slide.secondaryAction?`<a class="btn btn-outline-contis" href="${esc(slide.secondaryHref)}">${esc(slide.secondaryAction)}</a>`:''}
      </div>
     </div>
     <div class="home-carousel-art home-carousel-art--${slide.theme}">
      <img class="home-carousel-art-image" src="${esc(slide.image)}" alt="${esc(slide.imageAlt)}" loading="${index===0?'eager':'lazy'}" ${index===0?'fetchpriority="high"':''}>
     </div>
    </div>
   </div>`).join('')}
  </div>
  <div class="home-carousel-footer">
   <div class="carousel-indicators" role="group" aria-label="Choose featured slide">${slides.map((slide,index)=>`<button type="button" data-bs-target="#home-featured-carousel" data-bs-slide-to="${index}" class="${index===0?'active':''}" ${index===0?'aria-current="true"':''} aria-label="Show slide ${index+1}"></button>`).join('')}</div>
   <div class="home-carousel-controls" role="group" aria-label="Carousel controls"><button type="button" class="home-carousel-control" data-bs-target="#home-featured-carousel" data-bs-slide="prev" aria-label="Previous slide"><span aria-hidden="true">‹</span></button><button type="button" class="home-carousel-control" data-bs-target="#home-featured-carousel" data-bs-slide="next" aria-label="Next slide"><span aria-hidden="true">›</span></button></div>
  </div>
 </section>`;
 app.innerHTML=`${hero}
 ${section('Most Loved Picks','A selection of customer favorites.',picks,'/collections/all')}
 <section class="content-panel"><div class="row align-items-center g-4"><div class="col-md-8"><div class="eyebrow">Made for every occasion</div><h2 class="page-title">A little something for every gathering.</h2><p class="muted mb-0">Explore cakes, baked goodies, restaurant favorites, and large food orders.</p></div><div class="col-md-4 text-md-end"><a href="/collections/large-food-order" class="btn btn-contis">Explore large food orders</a></div></div></section>
 ${section('Fabulous Cakes','Celebrate with Conti’s signature cakes.',cakes,'/collections/fabulous-cakes')}
 ${section('Baked Goodies','Sweet treats, breads, pies and pastries.',goodies,'/collections/take-out-nook')}
 <section class="row g-3 mb-5"><div class="col-md-4"><a class="content-panel d-block h-100" href="/pages/restaurant-menu"><div class="eyebrow">Dine with us</div><h3 class="page-title">Restaurant Menu</h3><p class="muted">Browse familiar favorites and signature dishes.</p></a></div><div class="col-md-4"><a class="content-panel d-block h-100" href="/tools/locations/directory"><div class="eyebrow">Find a branch</div><h3 class="page-title">Our Stores</h3><p class="muted">Explore the branch directory and store information.</p></a></div><div class="col-md-4"><a class="content-panel d-block h-100" href="/a/self-faq"><div class="eyebrow">Need assistance?</div><h3 class="page-title">Help Center</h3><p class="muted">Find answers about ordering, products and delivery.</p></a></div></section>
 ${recentSection()}`;
 const carouselElement=document.querySelector('#home-featured-carousel');
 const prefersReducedMotion=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
 const carousel=bootstrap.Carousel.getOrCreateInstance(carouselElement,{interval:prefersReducedMotion?false:10000,pause:false,touch:true,keyboard:true});
 if(prefersReducedMotion)carousel.pause();else carousel.cycle();
 if (!prefersReducedMotion && 'IntersectionObserver' in window) {
  const observer = new IntersectionObserver(entries => {
   for (const entry of entries) {
    if (!entry.isIntersecting) continue;
    entry.target.classList.add('home-section-enter');
    observer.unobserve(entry.target);
   }
  });
  app.querySelectorAll(':scope > section:not(.home-carousel)').forEach(section => observer.observe(section));
 }
}
function recentSection(){const ids=STORE.get('recent',[]);const items=ids.map(findProductById).filter(Boolean);return items.length?section('Recently Viewed Products','Pick up where you left off.',items):''}
function renderWishlist(){const items=STORE.get('wishlist',[]).map(findProductById).filter(Boolean);app.classList.remove('product-page');app.innerHTML=`${crumb('Wishlist')}<div class="collection-heading"><div><div class="eyebrow">Saved for later</div><h1 class="page-title">My Wishlist</h1><p class="muted mb-0">${items.length} saved ${items.length===1?'product':'products'}</p></div>${items.length?layoutControls(catalogLayout()):''}</div>${items.length?grid(items,catalogLayout()):'<div class="empty-state"><h2 class="page-title">Your wishlist is empty</h2><p>Save products with the heart button to find them here.</p><a class="btn btn-contis" href="/collections/all">Browse the menu</a></div>'}`}
function renderCollection(slug){
 const routeParts=path.startsWith('/collections/')?path.split('/').filter(Boolean).slice(1):[];
 const collectionSlug=routeParts[0]||slug;
 const collection=DATA.collections.find(item=>item.slug===collectionSlug)||DATA.collections.find(item=>item.slug===slug)||DATA.collections[0];
 const isAll=collection.slug==='all';
 const menuCollections=DATA.collections.filter(item=>item.menuItem);
 const category=collection.category||collection.title;
 const collectionItems=DATA.products.filter(product=>isAll||product.collections.includes(collection.title)||(collection.subcategory&&product.subcategory===collection.subcategory)||product.category===category);
 const isSupportedMenu=['Restaurant Menu','Food Trays','Baked Goodies'].includes(category);
 const menuRoot=isSupportedMenu&&!collection.subcategory&&!routeParts.slice(1).length;
 let selectedSubcategory=collection.subcategory||'';
 let nestedSelection='';
 if(routeParts.length>1){
  const nestedSlugs=routeParts.slice(1);
  const subcategory=collectionItems.find(product=>product.subcategory&&subcategorySlug(product.category,product.subcategory)===nestedSlugs[0])?.subcategory;
  if(subcategory)selectedSubcategory=subcategory;
  if(nestedSlugs.length>1)nestedSelection=nestedSlugs[1];
 }
 if(collection.subcategory)selectedSubcategory=collection.subcategory;
 const selectedLabel=selectedSubcategory?subcategoryLabel(category,selectedSubcategory):'';
 const nestedItems=collectionItems.filter(product=>product.subcategory===selectedSubcategory);
 const nestedCategories=[...new Set(nestedItems.map(product=>product.nestedCategory).filter(Boolean))].sort((a,b)=>['Snack Sets','Lunch Sets'].indexOf(a)-['Snack Sets','Lunch Sets'].indexOf(b));
 const nestedRoot=selectedSubcategory==='Large Food Order'&&!nestedSelection&&nestedCategories.length>0;
 const selectedNestedCategory=nestedSelection?nestedCategories.find(item=>slugify(item)===nestedSelection)||'':'';
 const displayTitle=selectedNestedCategory||selectedLabel||collection.title;
 const items=selectedSubcategory?nestedItems:collectionItems;
 const availableItems=selectedNestedCategory?items.filter(product=>product.nestedCategory===selectedNestedCategory):items;
 const productCount=menuRoot?collectionItems.length:nestedRoot?nestedItems.length:availableItems.length;
 const supportedOrder=['Large Food Order','Lunch/Dinner Set Menu','Salad Entrées','Great Appetizers','Noodles Entrées','Signature Pasta','Seafood Entrées','Beef Entrées','Pork & Chicken','Vegetable Entrées','Rice','Soups'];
 const categoryTileMarkup=(source,basePath)=>{let groups=[...new Set(source.map(product=>product.subcategory).filter(Boolean))];if(category==='Food Trays')groups.sort((a,b)=>{const aIndex=supportedOrder.indexOf(a);const bIndex=supportedOrder.indexOf(b);return (aIndex<0?99:aIndex)-(bIndex<0?99:bIndex)});else groups.sort((a,b)=>subcategoryLabel(category,a).localeCompare(subcategoryLabel(category,b)));return groups.map(group=>{const groupProducts=source.filter(product=>product.subcategory===group);const product=groupProducts.find(item=>item.image);return categoryCard({title:subcategoryLabel(category,group),count:groupProducts.length,image:product?.image,path:`${basePath}/${subcategorySlug(category,group)}`})}).join('')};
 const nestedTileMarkup=nestedCategories.map(group=>{const groupProducts=nestedItems.filter(product=>product.nestedCategory===group);const product=groupProducts.find(item=>item.image);return categoryCard({title:group,count:groupProducts.length,image:product?.image,path:`/collections/${collection.slug}/packed-meals/${slugify(group)}`})}).join('');
 const showTiles=menuRoot||nestedRoot;
 const parentPath=selectedNestedCategory?`/collections/${collection.slug}/packed-meals`: `/collections/${collection.slug}`;
 const parentLabel=selectedNestedCategory?'Packed Meals':collection.title;
 app.innerHTML=`${crumb(displayTitle)}<div class="collection-heading"><div><div class="eyebrow">Shop Conti's</div><h1 class="page-title">${esc(displayTitle)}</h1><p class="muted mb-0"><span id="collection-result-count">${productCount}</span> products</p></div>${!showTiles?`<div class="d-flex gap-2 collection-tools"><input class="form-control" id="collection-search" placeholder="Search products" aria-label="Search products"><select class="form-select" id="sort-products" aria-label="Sort products"><option value="featured">Featured</option><option value="low">Price: low to high</option><option value="high">Price: high to low</option></select></div>`:''}</div>${isAll?`<section class="catalog-categories" id="collection-filters" aria-label="Browse menu categories"></section>`:''}${showTiles?`<div class="subcategory-grid">${menuRoot?categoryTileMarkup(collectionItems,`/collections/${collection.slug}`):nestedTileMarkup}</div>`:`${!isAll?`<div class="catalog-browse-back"><a href="${parentPath}">← ${esc(parentLabel)}</a>${selectedNestedCategory?`<span>/ ${esc(displayTitle)}</span>`:selectedLabel?`<span>/ ${esc(selectedLabel)}</span>`:''}</div>`:''}<div class="collection-listing-toolbar">${!isAll?`<p class="muted mb-0">Showing <span id="collection-result-count">${productCount}</span> products</p>`:''}${layoutPickerHtml(catalogLayout())}</div><div id="collection-grid"></div><p class="small muted mt-4">Catalog information and prices are from Conti's public product listings and may change.</p>`}`;
 if(showTiles)return;
 const filterContainer=document.querySelector('#collection-filters');
 const update=()=>{
  const query=document.querySelector('#collection-search').value.trim().toLowerCase();
  const allCategory=filterContainer?filterContainer.dataset.activeCategory||'All Products':'All Products';
  const categoryItems=allCategory==='All Products'?collectionItems:collectionItems.filter(product=>product.category===allCategory||product.collections.includes(allCategory));
  let list=categoryItems.filter(product=>(!selectedSubcategory||product.subcategory===selectedSubcategory)&&(!selectedNestedCategory||product.nestedCategory===selectedNestedCategory)&&`${product.name} ${product.category} ${product.subcategory} ${product.description}`.toLowerCase().includes(query));
  const sort=document.querySelector('#sort-products').value;
  if(sort==='low')list=list.slice().sort((a,b)=>a.price-b.price);
  if(sort==='high')list=list.slice().sort((a,b)=>b.price-a.price);
  document.querySelector('#collection-grid').innerHTML=list.length?grid(list,catalogLayout()):'<div class="empty-state"><p>No products match those filters.</p><button class="btn btn-outline-contis" type="button" data-reset-catalog>Clear filters</button></div>';
  document.querySelectorAll('#collection-result-count').forEach(element=>element.textContent=list.length);
  if(filterContainer)filterContainer.innerHTML=`<div class="catalog-categories-heading"><span class="eyebrow">Browse by menu</span><span class="category-divider"></span></div><div class="category-chips"><button class="category-chip ${allCategory==='All Products'?'active':''}" type="button" data-category-filter="All Products">All Products<span>${collectionItems.length}</span></button>${menuCollections.map(menu=>`<button class="category-chip ${allCategory===menu.title?'active':''}" type="button" data-category-filter="${esc(menu.title)}">${esc(menu.title)}<span>${collectionItems.filter(product=>product.collections.includes(menu.title)).length}</span></button>`).join('')}</div>`;
 };
 if(filterContainer)filterContainer.dataset.activeCategory='All Products';
 update();
 if(filterContainer)filterContainer.addEventListener('click',event=>{const button=event.target.closest('[data-category-filter]');if(button){filterContainer.dataset.activeCategory=button.dataset.categoryFilter;update()}});
 const reset=document.querySelector('#collection-grid');
 if(reset)reset.addEventListener('click',event=>{if(event.target.closest('[data-reset-catalog]')){document.querySelector('#collection-search').value='';if(filterContainer)filterContainer.dataset.activeCategory='All Products';update()}});
 document.querySelector('#collection-search').addEventListener('input',update);
 document.querySelector('#sort-products').addEventListener('change',update);
 document.querySelectorAll('[data-layout]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.layout===catalogLayout())));
}
function productAllergens(product){
 const labels={
  celery:'Celery',dairy:'Milk',egg:'Eggs',eggs:'Eggs',fish:'Fish',gluten:'Gluten',milk:'Milk',mustard:'Mustard',
  peanut:'Peanuts',peanuts:'Peanuts',sesame:'Sesame',shellfish:'Shellfish',soy:'Soybeans',soybean:'Soybeans',
  soybeans:'Soybeans',sulphite:'Sulphites',sulphites:'Sulphites',tree:'Tree Nuts',treenut:'Tree Nuts',
  treenuts:'Tree Nuts',wheat:'Wheat'
 };
 return [...new Set((product.tags||[]).map(tag=>String(tag).toLowerCase().replace(/[^a-z]/g,'')).map(tag=>labels[tag]).filter(Boolean))];
}
function renderProduct(id){
 const p=findProductById(id);
 if(!p){render404();return}
 app.classList.add('product-page');
 recordView(p);
 const variants=p.variantPrices||[];
 let selectedPrice=variants.length?variants[0].price:p.price;
 const allergens=productAllergens(p);
 const gallery=[...new Set([p.image,...(p.galleryImages||[])].filter(Boolean))];
 const favorite=isWishlisted(p.id);
 const photo=gallery.length?`<img id="product-main-image" src="${esc(gallery[0])}" alt="${esc(p.name)}" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'"><div class="asset-pending" style="display:none"><strong>${esc(p.name)}</strong><br><small>Product photo unavailable</small></div>`:`<div class="asset-pending"><strong>${esc(p.name)}</strong><br><small>Product photo unavailable</small></div>`;
 const galleryButtons=gallery.length>1?`<div class="product-gallery-thumbnails" aria-label="Product images">${gallery.map((image,index)=>`<button type="button" class="product-gallery-thumbnail ${index===0?'active':''}" data-gallery-image="${index}" aria-label="Show product image ${index+1}" aria-pressed="${index===0}"><img src="${esc(image)}" alt="" loading="lazy"></button>`).join('')}</div><button class="gallery-arrow gallery-previous" type="button" data-gallery-step="-1" aria-label="Previous image">‹</button><button class="gallery-arrow gallery-next" type="button" data-gallery-step="1" aria-label="Next image">›</button>`:'';
 const zoomMarkup=gallery.length?`<span class="product-zoom-lens" aria-hidden="true"></span><div class="product-zoom-preview" aria-hidden="true"><img src="${esc(gallery[0])}" alt=""></div>`:'';
 const related=DATA.products.filter(item=>item.id!==p.id&&item.category===p.category).slice(0,4);
 app.innerHTML=`${crumb(p.name)}<section class="product-detail"><div class="product-gallery">${galleryButtons}<figure class="product-detail-media">${photo}${gallery.length?'<button class="product-zoom-button" type="button" data-gallery-zoom aria-label="Zoom product image">⌕</button>':''}</figure>${zoomMarkup}</div><div class="product-detail-copy">
  <div class="eyebrow">${esc(p.category)}${p.subcategory?` · ${esc(subcategoryLabel(p.category,p.subcategory))}`:''}</div>
  <h1 class="page-title">${esc(p.name)}</h1>
  <p class="product-detail-price" id="product-price">${money(selectedPrice)}</p>
  ${variants.length>1?`<div class="product-variant"><span class="form-label d-block">Choose an option</span><div class="variant-options" role="group" aria-label="Product size">${variants.map((variant,index)=>`<button type="button" class="variant-option ${index===0?'active':''}" data-variant="${index}" aria-pressed="${index===0}">${esc(variant.title)}</button>`).join('')}</div></div>`:''}
  <div class="product-purchase-row">${p.price>0?`<div class="product-quantity"><button class="product-quantity-button" type="button" data-quantity-delta="-1" aria-label="Decrease quantity">−</button><input id="qty" type="number" min="1" step="1" value="1" inputmode="numeric" aria-label="Quantity"><button class="product-quantity-button" type="button" data-quantity-delta="1" aria-label="Increase quantity">+</button></div><button class="btn btn-contis" id="product-add" type="button">Add to cart</button>`:`<div class="product-quantity product-quantity-disabled" aria-hidden="true">—</div><button class="btn btn-outline-secondary" type="button" disabled>Price unavailable</button>`}</div>
  <p class="notice product-detail-notice">Price shown is from Conti's current product listing and may vary by branch or ordering channel.</p>
  <div class="product-detail-links">
   <a class="product-allergen-link" href="#product-allergens">Allergen information</a>
   <button class="product-detail-wishlist ${favorite?'is-wishlisted':''}" type="button" data-wishlist="${esc(p.id)}" aria-label="${favorite?'Remove from wishlist':'Add to wishlist'}" aria-pressed="${favorite}">${favorite?'♥':'♡'} <span>${favorite?'Saved to wishlist':'Add to wishlist'}</span></button>
  </div>
  <p class="product-detail-description">${esc(p.description)}</p>
  <section class="product-allergens" id="product-allergens" tabindex="-1" aria-label="Allergen information"><p>Contains the following allergens:</p>${allergens.length?`<ul>${allergens.map(allergen=>`<li>${esc(allergen)}</li>`).join('')}</ul>`:'<p class="product-allergens-unavailable">Allergen information is not listed for this product.</p>'}</section>
 </div></section>${gallery.length?`<dialog class="product-image-dialog" id="product-image-dialog" aria-label="Product image enlarged"><button type="button" class="product-image-dialog-close" data-gallery-close aria-label="Close image">×</button><img src="${esc(gallery[0])}" alt="${esc(p.name)}"></dialog>`:''}${related.length?section('You may also like','More from this menu.',related):''}${recentSection()}`;
 let currentImage=0;
 const setImage=index=>{
  if(!gallery.length)return;
  currentImage=(index+gallery.length)%gallery.length;
  const image=gallery[currentImage];
  const main=document.querySelector('#product-main-image');
  if(main)main.src=image;
  const zoom=document.querySelector('#product-image-dialog img');
  if(zoom)zoom.src=image;
  const preview=document.querySelector('.product-zoom-preview img');
  if(preview)preview.src=image;
  document.querySelectorAll('[data-gallery-image]').forEach(button=>{
   const active=Number(button.dataset.galleryImage)===currentImage;
   button.classList.toggle('active',active);
   button.setAttribute('aria-pressed',String(active));
  });
 };
 document.querySelectorAll('[data-gallery-image]').forEach(button=>button.addEventListener('click',()=>setImage(Number(button.dataset.galleryImage))));
 document.querySelectorAll('[data-gallery-step]').forEach(button=>button.addEventListener('click',()=>setImage(currentImage+Number(button.dataset.galleryStep))));
 const zoomDialog=document.querySelector('#product-image-dialog');
 document.querySelector('[data-gallery-zoom]')?.addEventListener('click',()=>zoomDialog?.showModal());
 document.querySelector('[data-gallery-close]')?.addEventListener('click',()=>zoomDialog?.close());
 const zoomMedia=document.querySelector('.product-detail-media');
 const zoomLens=document.querySelector('.product-zoom-lens');
 const zoomPreview=document.querySelector('.product-zoom-preview');
 const zoomPreviewImage=zoomPreview?.querySelector('img');
 const zoomMainImage=document.querySelector('#product-main-image');
 if(zoomMedia&&zoomLens&&zoomPreview&&zoomPreviewImage&&zoomMainImage){
  const canHover=window.matchMedia('(hover: hover) and (pointer: fine)');
  const clamp=(value,min,max)=>Math.min(max,Math.max(min,value));
  zoomMedia.addEventListener('pointermove',event=>{
   if(event.pointerType==='touch'||!canHover.matches)return;
   const bounds=zoomMedia.getBoundingClientRect();
   const imageStyle=getComputedStyle(zoomMainImage);
   const insetLeft=Number.parseFloat(imageStyle.paddingLeft)||0;
   const insetRight=Number.parseFloat(imageStyle.paddingRight)||0;
   const insetTop=Number.parseFloat(imageStyle.paddingTop)||0;
   const insetBottom=Number.parseFloat(imageStyle.paddingBottom)||0;
   const imageWidth=Math.max(1,bounds.width-insetLeft-insetRight);
   const imageHeight=Math.max(1,bounds.height-insetTop-insetBottom);
   const lensWidth=imageWidth/2;
   const lensHeight=imageHeight/2;
   const left=clamp(event.clientX-bounds.left-insetLeft-lensWidth/2,0,imageWidth-lensWidth);
   const top=clamp(event.clientY-bounds.top-insetTop-lensHeight/2,0,imageHeight-lensHeight);
   zoomLens.style.width=`${lensWidth}px`;
   zoomLens.style.height=`${lensHeight}px`;
   zoomLens.style.left=`${insetLeft+left}px`;
   zoomLens.style.top=`${insetTop+top}px`;
   zoomPreviewImage.style.left=`-${((left+lensWidth/2)/imageWidth)*100}%`;
   zoomPreviewImage.style.top=`-${((top+lensHeight/2)/imageHeight)*100}%`;
   zoomLens.classList.add('is-active');
   zoomPreview.classList.add('is-active');
  });
  zoomMedia.addEventListener('pointerleave',()=>{
   zoomLens.classList.remove('is-active');
   zoomPreview.classList.remove('is-active');
  });
 }
 const quantityInput=document.querySelector('#qty');
 document.querySelectorAll('[data-quantity-delta]').forEach(button=>button.addEventListener('click',()=>{quantityInput.value=Math.max(1,(Number.parseInt(quantityInput.value,10)||1)+Number(button.dataset.quantityDelta))}));
 quantityInput?.addEventListener('change',()=>{quantityInput.value=Math.max(1,Number.parseInt(quantityInput.value,10)||1)});
 document.querySelectorAll('[data-variant]').forEach(button=>button.addEventListener('click',()=>{
  selectedPrice=variants[Number(button.dataset.variant)].price;
  document.querySelector('#product-price').textContent=money(selectedPrice);
  document.querySelectorAll('[data-variant]').forEach(option=>{
   const active=option===button;
   option.classList.toggle('active',active);
   option.setAttribute('aria-pressed',String(active));
  });
 }));
 const addButton=document.querySelector('#product-add');
 if(addButton)addButton.onclick=()=>addCart(p.id,Math.max(1,Number.parseInt(quantityInput.value,10)||1),selectedPrice);
}
function renderCart(){const cart=STORE.get('cart',[]);const rows=cart.map(x=>({...x,p:findProductById(x.id)})).filter(x=>x.p);const total=rows.reduce((s,x)=>s+x.price*x.qty,0);
 const itemCount=rows.reduce((sum,x)=>sum+x.qty,0);
 app.innerHTML=`${crumb('Cart')}<div class="cart-heading"><div><div class="eyebrow">Shopping bag</div><h1 class="page-title">Your Cart</h1></div><a href="/collections/all">Continue shopping <span aria-hidden="true">→</span></a></div>${rows.length?`<div class="cart-layout"><section class="cart-items" aria-label="Cart items"><div class="cart-items-heading"><span>${itemCount} ${itemCount===1?'item':'items'}</span><span>Subtotal</span></div>${rows.map(x=>`<article class="cart-item"><a class="cart-item-image" href="${productUrl(x.p)}">${x.p.image?`<img src="${esc(x.p.image)}" alt="${esc(x.p.name)}" onerror="this.style.display='none';this.nextElementSibling.style.display='grid'"><span style="display:none">${esc(x.p.name.charAt(0))}</span>`:`<span>${esc(x.p.name.charAt(0))}</span>`}</a><div class="cart-item-copy"><div class="cart-item-category">${esc(x.p.category)}</div><a class="cart-item-name" href="${productUrl(x.p)}">${esc(x.p.name)}</a><button class="cart-remove" type="button" data-remove="${esc(x.id)}">Remove</button></div><div class="cart-item-price"><small>Price</small><strong>${money(x.price)}</strong></div><div class="cart-item-quantity"><small>Quantity</small><div class="cart-quantity-control"><button type="button" data-qty="${esc(x.id)}" data-delta="-1" aria-label="Decrease ${esc(x.p.name)} quantity">−</button><span>${x.qty}</span><button type="button" data-qty="${esc(x.id)}" data-delta="1" aria-label="Increase ${esc(x.p.name)} quantity">+</button></div></div><div class="cart-item-total"><small>Total</small><strong>${money(x.price*x.qty)}</strong></div></article>`).join('')}</section><aside class="cart-summary"><div class="eyebrow">Order summary</div><h2>Subtotal</h2><div class="cart-summary-lines"><div><span>Items (${itemCount})</span><strong>${money(total)}</strong></div><div><span>Delivery</span><strong>Calculated at checkout</strong></div></div><div class="cart-summary-total"><span>Total</span><strong>${money(total)}</strong></div><a class="btn cart-checkout-button" href="/checkout">Proceed to checkout <span aria-hidden="true">→</span></a><p>Delivery and applicable charges are not included until checkout.</p></aside></div>`:`<div class="empty-state cart-empty"><h2 class="page-title">Your cart is empty</h2><p>Browse our products and add your favorites.</p><a class="btn btn-contis" href="/collections/all">Continue shopping</a></div>`}`;
}
function renderCheckout(){const cart=STORE.get('cart',[]);const rows=cart.map(x=>({...x,p:findProductById(x.id)})).filter(x=>x.p);const total=rows.reduce((s,x)=>s+x.price*x.qty,0);if(!rows.length){app.innerHTML=`${crumb('Checkout')}<div class="empty-state"><h1 class="page-title">Your cart is empty</h1><a class="btn btn-contis" href="/collections/all">Browse products</a></div>`;return}
 const profile=STORE.get('user',null);
 const profileName=profile?.name?.trim().split(/\s+/)||[];
 const firstName=esc(profileName.shift()||'');
 const lastName=esc(profileName.join(' ')||'');
 const email=esc(profile?.email||'');
 const branchOptions = [...DATA.branches]
  .sort((a, b) => a.city.localeCompare(b.city) || a.name.localeCompare(b.name))
  .map(branch => {
   const label = `${branch.city} — ${branch.name}`;
   return `<option value="${esc(label)}">${esc(label)}</option>`;
  }).join('');
 app.innerHTML=`${crumb('Checkout')}<div class="checkout-heading"><div><div class="eyebrow">Secure checkout</div><h1 class="page-title" id="checkout-heading" tabindex="-1">Complete your order</h1></div><ol class="checkout-progress" aria-label="Checkout progress"><li class="active" aria-current="step"><span>1</span>Details</li><li><span>2</span>Review</li></ol></div><div class="checkout-layout"><div class="checkout-form-column"><form id="checkout-form" class="checkout-form"><section class="checkout-section"><div class="checkout-section-heading"><span class="checkout-section-number">01</span><div><h2>Contact details</h2><p>Where should we send your demo order?</p></div></div><div class="checkout-fields"><div class="checkout-field"><label for="checkout-first">First name</label><input id="checkout-first" class="form-control" name="first" autocomplete="given-name" value="${firstName}" placeholder="Name" required></div><div class="checkout-field"><label for="checkout-last">Last name</label><input id="checkout-last" class="form-control" name="last" autocomplete="family-name" value="${lastName}" placeholder="Surname" required></div><div class="checkout-field checkout-field-full"><label for="checkout-email">Email address</label><input id="checkout-email" class="form-control" name="email" type="email" autocomplete="email" value="${email}" placeholder="you@example.com" required></div></div></section><section class="checkout-section"><div class="checkout-section-heading"><span class="checkout-section-number">02</span><div><h2>Fulfillment</h2><p>Choose how you would receive this order.</p></div></div><fieldset class="fulfillment-options"><legend class="visually-hidden">Fulfillment method</legend><label class="fulfillment-option active"><input type="radio" name="fulfillment" value="Pick-up" checked><span class="fulfillment-icon" aria-hidden="true">▣</span><span><strong>Pick-up</strong><small>Collect from a Conti's branch</small></span></label><label class="fulfillment-option"><input type="radio" name="fulfillment" value="Delivery"><span class="fulfillment-icon" aria-hidden="true">◇</span><span><strong>Delivery</strong><small>Have your order brought to you</small></span></label></fieldset><div class="checkout-field mb-3" id="checkout-pickup-field"><label for="checkout-pickup-branch">Pickup branch</label><select id="checkout-pickup-branch" class="form-select" name="pickupBranch" required><option value="">Choose a branch</option>${branchOptions}</select></div><div class="checkout-fields checkout-date-row"><div class="checkout-field"><label for="checkout-date">Preferred date</label><input id="checkout-date" class="form-control" name="date" type="date" required></div><div class="checkout-field checkout-field-note"><span>Planning ahead</span><p>Availability and branch hours may vary.</p></div></div></section><section class="checkout-section"><div class="checkout-section-heading"><span class="checkout-section-number">03</span><div><h2>Payment</h2><p>Select a payment option.</p></div></div><div class="checkout-fields"><div class="checkout-field checkout-field-full"><label for="checkout-payment">Payment method</label><select id="checkout-payment" class="form-select" name="payment"><option>Cash on Delivery</option><option>Visa/Mastercard</option><option>Bank Transfer (BPI)</option><option>Gcash</option><option>Maya</option><option>GrabPay</option><option>ShopeePay</option></select></div></div></section><section class="checkout-section"><div class="checkout-field"><label for="checkout-note">Order note (optional)</label><textarea id="checkout-note" class="form-control checkout-note" name="note" rows="3" maxlength="500" placeholder="Add a note for this order"></textarea></div></section><div class="checkout-demo-note"><span aria-hidden="true">i</span><p><strong>Local demonstration</strong><br>Your details stay in this browser. No real order or payment is submitted.</p></div></form><section class="checkout-section" id="checkout-review" aria-labelledby="checkout-review-heading" hidden></section></div><aside class="checkout-summary" aria-label="Order summary"><div class="checkout-summary-heading"><div><div class="eyebrow">Your order</div><h2>Order summary</h2></div><a href="/cart">Edit</a></div><div class="checkout-items">${rows.map(x=>`<article class="checkout-item"><div class="checkout-item-image">${x.p.image?`<img src="${esc(x.p.image)}" alt="${esc(x.p.name)}" onerror="this.style.display='none';this.nextElementSibling.style.display='grid'"><span style="display:none">${esc(x.p.name.charAt(0))}</span>`:`<span>${esc(x.p.name.charAt(0))}</span>`}</div><div class="checkout-item-copy"><h3>${esc(x.p.name)}</h3><p>Qty ${x.qty}</p></div><strong>${money(x.price*x.qty)}</strong></article>`).join('')}</div><div class="checkout-totals"><div><span>Subtotal</span><strong>${money(total)}</strong></div><div><span>Delivery / pick-up</span><strong>Calculated later</strong></div><div class="checkout-total"><span>Total</span><strong>${money(total)}</strong></div></div><button class="btn checkout-place-order" type="submit" form="checkout-form"><span class="checkout-submit-label">Review order</span><span aria-hidden="true">→</span></button><p class="checkout-summary-safe">No card details are collected</p></aside></div>`;
 const form = document.getElementById('checkout-form');
 const review = document.getElementById('checkout-review');
 const submit = app.querySelector('.checkout-place-order');
 const submitLabel = submit.querySelector('.checkout-submit-label');
 const steps = app.querySelectorAll('.checkout-progress li');
 const options = form.querySelectorAll('.fulfillment-option');
 const pickupField = document.getElementById('checkout-pickup-field');
 const pickupBranch = form.elements.pickupBranch;
 const dateInput = form.elements.date;
 const schedule = STORE.get('schedule', null);
 dateInput.min = localDateInputValue();
 if (schedule?.date >= dateInput.min) dateInput.value = schedule.date;
 if (schedule?.fulfillment === 'Delivery') form.elements.fulfillment.value = 'Delivery';

 function updateFulfillment() {
  const pickup = form.elements.fulfillment.value === 'Pick-up';
  pickupField.hidden = !pickup;
  pickupBranch.disabled = !pickup;
  pickupBranch.required = pickup;
  options.forEach(option => option.classList.toggle('active', option.querySelector('input').checked));
 }
 options.forEach(option => option.addEventListener('change', updateFulfillment));
 updateFulfillment();

 let details;
 function showStep(reviewing) {
  form.hidden = reviewing;
  review.hidden = !reviewing;
  steps.forEach((step, index) => {
   const active = index === Number(reviewing);
   step.classList.toggle('active', active);
   if (active) step.setAttribute('aria-current', 'step');
   else step.removeAttribute('aria-current');
  });
  submitLabel.textContent = reviewing ? 'Place demo order' : 'Review order';
  if (reviewing) submit.removeAttribute('form');
  else submit.setAttribute('form', form.id);
  document.getElementById(reviewing ? 'checkout-review-heading' : 'checkout-heading').focus();
 }

 form.addEventListener('submit', event => {
  event.preventDefault();
  if (form.hidden) return;
  const fields = new FormData(form);
  details = {
   customer: { first: fields.get('first'), last: fields.get('last'), email: fields.get('email') },
   fulfillment: fields.get('fulfillment'),
   pickupBranch: fields.get('pickupBranch'),
   date: fields.get('date'),
   payment: fields.get('payment'),
   note: fields.get('note').trim()
  };
  const date = new Date(`${details.date}T00:00:00`).toLocaleDateString('en-PH', { dateStyle: 'long' });
  review.innerHTML = `
   <h2 id="checkout-review-heading" tabindex="-1">Review your order</h2>
   <dl class="checkout-review-details">
    <dt>Contact</dt><dd>${esc(details.customer.first)} ${esc(details.customer.last)}<br>${esc(details.customer.email)}</dd>
    <dt>Fulfillment</dt><dd>${esc(details.fulfillment)} · ${esc(date)}</dd>
    ${details.pickupBranch ? `<dt>Pickup branch</dt><dd>${esc(details.pickupBranch)}</dd>` : ''}
    <dt>Payment method</dt><dd>${esc(details.payment)}</dd>
    ${details.note ? `<dt>Order note</dt><dd class="checkout-review-note">${esc(details.note)}</dd>` : ''}
   </dl>
   <p class="muted">This demo saves the order in this browser and does not process a payment.</p>
   <button type="button" class="btn btn-outline-contis">Edit details</button>
  `;
  review.querySelector('button').addEventListener('click', () => {
   details = undefined;
   showStep(false);
  });
  showStep(true);
 });

 submit.addEventListener('click', () => {
  if (!form.hidden || !details || submit.disabled) return;
  if (JSON.stringify(STORE.get('cart', [])) !== JSON.stringify(cart)) {
   renderCheckout();
   document.querySelector('#checkout-heading, #app .empty-state h1')?.scrollIntoView();
   toast('Check the updated items before placing your demo order.', { title: 'Cart updated' });
   return;
  }
  submit.disabled = true;
  const order = {
   ...details,
   id: STORE.id('CONTIS'),
   created: new Date().toISOString(),
   paymentStatus: 'paid',
   items: rows.map(x => ({ id: x.id, name: x.p.name, qty: x.qty, price: x.price })),
   total,
   status: 'Order Placed',
   demo: true
  };
  STORE.set('orders', [order, ...STORE.get('orders', [])]);
  STORE.set('cart', []);
  updateCounts();
  sessionStorage.setItem('contis-checkout-success', order.id);
  location.href = '/pages/order-confirmation/?ref=' + encodeURIComponent(order.id);
 });
}
function renderConfirmation() {
 const ref = new URLSearchParams(location.search).get('ref');
 const order = STORE.get('orders', []).find(item => item.id === ref);
 if (!order) {
  renderTracking();
  return;
 }

 const date = order.date ? new Date(`${order.date}T00:00:00`) : null;
 const preferredDate = date && !Number.isNaN(date.getTime()) ?
  date.toLocaleDateString('en-PH', { dateStyle: 'long' }) : '';
 const orderRef = encodeURIComponent(order.id);
 app.innerHTML = `
  ${crumb('Order confirmation')}
  <div class="demo-banner">SIMULATED ORDER — This is not an order placed with Conti's.</div>
  <section class="content-panel">
   <div class="eyebrow">Order reference</div>
   <div class="order-confirmation-actions">
    <h1 class="page-title mb-0" id="confirmation-reference">${esc(order.id)}</h1>
    <button class="btn btn-outline-contis" id="copy-order-reference" type="button">Copy order reference</button>
   </div>
   <p class="mt-3">Payment successful! Your demo order has been placed.</p>
   <dl class="order-confirmation-details">
    <dt>Order status</dt><dd>${esc(order.status)}</dd>
    <dt>Total</dt><dd>${money(order.total)}</dd>
    ${order.fulfillment ? `<dt>Fulfillment</dt><dd>${esc(order.fulfillment)}</dd>` : ''}
    ${order.pickupBranch ? `<dt>Pickup branch</dt><dd>${esc(order.pickupBranch)}</dd>` : ''}
    ${preferredDate ? `<dt>Preferred date</dt><dd>${esc(preferredDate)}</dd>` : ''}
    ${order.note ? `<dt>Order note</dt><dd class="order-confirmation-note">${esc(order.note)}</dd>` : ''}
   </dl>
   <div class="order-confirmation-actions">
    <a class="btn btn-contis" href="/pages/order-receipt/?ref=${orderRef}">View downloadable receipt</a>
    <a class="btn btn-outline-contis" href="/pages/order-tracking/?ref=${orderRef}">Track order</a>
   </div>
  </section>
 `;

 document.getElementById('copy-order-reference').addEventListener('click', async () => {
  try {
   await navigator.clipboard.writeText(order.id);
   toast('Order reference copied.');
  } catch {
   const selection = window.getSelection();
   const range = document.createRange();
   range.selectNodeContents(document.getElementById('confirmation-reference'));
   selection.removeAllRanges();
   selection.addRange(range);
   toast('The order reference is selected. Use your browser or keyboard to copy it.');
  }
 });

 if (sessionStorage.getItem('contis-checkout-success') === order.id) {
  sessionStorage.removeItem('contis-checkout-success');
  toast('Payment successful! Your demo order is confirmed.');
 }
}
function renderTracking(){const ref=new URLSearchParams(location.search).get('ref')||'';const orders=STORE.get('orders',[]);const o=orders.find(x=>x.id.toLowerCase()===ref.toLowerCase());app.innerHTML=`${crumb('Order tracking')}<div class="demo-banner">ORDER TRACKING SIMULATOR — Progress is local demonstration data only.</div><h1 class="page-title">Track your order</h1><form id="track-form" class="row g-2 mb-4"><div class="col-md-8"><input class="form-control" name="ref" value="${esc(ref)}" placeholder="Enter your demo order reference" required></div><div class="col-md-4"><button class="btn btn-contis w-100">Find order</button></div></form>${o?trackingDetails(o):'<p class="muted">Enter an order reference generated by the demo checkout.</p>'}<h2 class="h4 mt-5">Recent demo orders</h2>${orders.length?`<ul>${orders.slice(0,5).map(x=>`<li><a href="/pages/order-tracking/?ref=${encodeURIComponent(x.id)}">${esc(x.id)}</a> — ${esc(x.status)}</li>`).join('')}</ul>`:'<p class="muted">No local demo orders yet.</p>'}`;
 document.querySelector('#track-form').onsubmit=e=>{e.preventDefault();location.href='/pages/order-tracking/?ref='+encodeURIComponent(new FormData(e.currentTarget).get('ref'))}
}
function trackingDetails(o){const steps=['Order Placed','Order Confirmed','Preparing',o.fulfillment.startsWith('Pick')?'Ready for Pickup':'Out for Delivery','Completed'];const idx=steps.indexOf(o.status);return `<div class="content-panel"><h2 class="h4">${esc(o.id)}</h2><p>${esc(o.fulfillment)} · ${esc(o.paymentStatus)} · ${money(o.total)}</p><div class="timeline">${steps.map((s,i)=>`<div class="timeline-step ${i<=(idx<0?0:idx)?'done':''}"><strong>${s}</strong>${i===0?'<div class="small muted">Demo order created</div>':''}</div>`).join('')}</div><label class="form-label">Demonstration status control</label><select class="form-select" id="status-control" data-order="${o.id}">${[...steps,'Cancelled'].map(s=>`<option ${s===o.status?'selected':''}>${s}</option>`).join('')}</select><p class="small muted mt-2">Changing this control updates only the local demo record.</p><a class="btn btn-outline-contis mt-2" href="/pages/order-receipt/?ref=${encodeURIComponent(o.id)}">Open receipt</a></div>`}
function receiptDetails(order) {
 const customer = order.customer || {};
 const placed = new Date(order.created);
 const preferred = order.date ? new Date(`${order.date}T00:00:00`) : null;
 return [
  ['Order reference', order.id],
  ['Order placed', Number.isNaN(placed.getTime()) ? '' : placed.toLocaleString('en-PH', { dateStyle: 'medium', timeStyle: 'short' })],
  ['Customer', [customer.first, customer.last].filter(Boolean).join(' ')],
  ['Email', customer.email],
  ['Fulfillment', order.fulfillment],
  ['Preferred date', preferred && !Number.isNaN(preferred.getTime()) ? preferred.toLocaleDateString('en-PH', { dateStyle: 'long' }) : ''],
  ['Pickup branch', order.pickupBranch],
  ['Payment method', [order.payment, order.paymentStatus].filter(Boolean).join(' · ')]
 ].filter(([, value]) => value);
}

function wrapReceiptText(context, value, width) {
 const lines = [];
 for (const paragraph of String(value).split(/\r?\n/)) {
  let line = '';
  for (const word of paragraph.split(/\s+/).filter(Boolean)) {
   const next = line ? `${line} ${word}` : word;
   if (context.measureText(next).width <= width) {
    line = next;
    continue;
   }
   if (line) lines.push(line);
   line = '';
   for (const char of word) {
    if (line && context.measureText(line + char).width > width) {
     lines.push(line);
     line = '';
    }
    line += char;
   }
  }
  lines.push(line);
 }
 return lines;
}

async function downloadReceipt(order) {
 const logo = new Image();
 logo.src = '/assets/images/brand/contis-logo.png';
 await logo.decode();

 const canvas = document.createElement('canvas');
 const context = canvas.getContext('2d');
 if (!context) throw new Error('Image export is unavailable.');
 const width = 960;
 const left = 64;
 const right = width - left;
 const contentWidth = right - left;
 const green = '#234a31';
 const ink = '#252820';
 const muted = '#555f55';
 const paper = '#f7f5ef';
 const line = '#e0e3db';

 context.font = '21px Arial';
 const half = contentWidth / 2;
 const details = receiptDetails(order).map(([label, value]) => [label, wrapReceiptText(context, value, half - 26)]);
 const detailRows = [];
 for (let index = 0; index < details.length; index += 2) {
  detailRows.push(details.slice(index, index + 2));
 }
 const detailHeight = row => 46 + Math.max(...row.map(([, lines]) => lines.length)) * 27;
 const items = order.items.map(item => ({ ...item, nameLines: wrapReceiptText(context, item.name, 370) }));
 const itemHeight = item => 24 + item.nameLines.length * 28;
 const note = order.note ? wrapReceiptText(context, order.note, contentWidth - 40) : [];
 const height = Math.max(1160, 598 + detailRows.reduce((sum, row) => sum + detailHeight(row), 0)
  + items.reduce((sum, item) => sum + itemHeight(item), 0) + (note.length ? 80 + note.length * 28 : 0));
 canvas.width = width;
 canvas.height = height;

 function fill(color, x, y, w, h) {
  context.fillStyle = color;
  context.fillRect(x, y, w, h);
 }

 function text(value, x, y, { font = '21px Arial', color = ink, align = 'left' } = {}) {
  context.font = font;
  context.fillStyle = color;
  context.textAlign = align;
  context.textBaseline = 'top';
  context.fillText(value, x, y);
 }

 fill('#fff', 0, 0, width, height);
 fill(green, 0, 0, width, 12);
 fill('#b89a62', 0, 12, width, 4);
 const logoScale = Math.min(172 / logo.naturalWidth, 84 / logo.naturalHeight);
 const logoWidth = logo.naturalWidth * logoScale;
 context.drawImage(logo, (width - logoWidth) / 2, 46, logoWidth, logo.naturalHeight * logoScale);
 text('Order Receipt', width / 2, 151, { font: '48px Georgia', color: green, align: 'center' });
 text("Conti’s Bakeshop & Restaurant", width / 2, 211, { color: muted, align: 'center' });
 fill(paper, left, 256, contentWidth, 48);
 text('DEMO RECEIPT  ·  NOT A TAX INVOICE', width / 2, 270, { font: 'bold 18px Arial', color: green, align: 'center' });

 let y = 337;
 for (const row of detailRows) {
  row.forEach(([label, lines], index) => {
   const x = left + index * half;
   text(label.toUpperCase(), x, y, { font: 'bold 16px Arial', color: muted });
   lines.forEach((value, lineIndex) => text(value, x, y + 25 + lineIndex * 27));
  });
  y += detailHeight(row);
 }

 fill(green, left, y, contentWidth, 48);
 const columns = [left + 16, left + 445, right - 176, right - 16];
 ['Item', 'Qty', 'Unit price', 'Amount'].forEach((label, index) => {
  text(label, columns[index], y + 14, { font: 'bold 18px Arial', color: '#fff', align: ['left', 'center', 'right', 'right'][index] });
 });
 y += 48;
 for (const item of items) {
  item.nameLines.forEach((name, index) => text(name, columns[0], y + 12 + index * 28));
  text(String(item.qty), columns[1], y + 12, { align: 'center' });
  text(money(item.price), columns[2], y + 12, { align: 'right' });
  text(money(item.price * item.qty), columns[3], y + 12, { align: 'right' });
  y += itemHeight(item);
  fill(line, left, y - 1, contentWidth, 1);
 }

 y += 22;
 fill(paper, left, y, contentWidth, 58);
 text('Order total', left + 16, y + 16, { font: 'bold 23px Arial', color: green });
 text(money(order.total), right - 16, y + 13, { font: 'bold 30px Arial', color: green, align: 'right' });
 y += 58;
 if (note.length) {
  y += 26;
  fill(paper, left, y, contentWidth, 48 + note.length * 28);
  text('ORDER NOTE', left + 20, y + 16, { font: 'bold 16px Arial', color: muted });
  note.forEach((value, index) => text(value, left + 20, y + 38 + index * 28));
 }

 const footer = height - 104;
 fill(line, left, footer, contentWidth, 1);
 text("Thank you for choosing Conti’s.", width / 2, footer + 18, { color: green, align: 'center' });
 text('Academic demonstration · No real transaction was processed.', width / 2, footer + 51, { font: '17px Arial', color: muted, align: 'center' });

 const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
 if (!blob) throw new Error('Unable to generate the receipt image.');
 const url = URL.createObjectURL(blob);
 const link = document.createElement('a');
 link.href = url;
 link.download = `${String(order.id).replace(/[^a-z0-9_-]/gi, '-')}-receipt.png`;
 document.body.append(link);
 link.click();
 link.remove();
 setTimeout(() => URL.revokeObjectURL(url), 1000);
 toast(`Your demo receipt for ${order.id} is downloading.`, { title: 'Download started' });
}

function renderReceipt() {
 const ref = new URLSearchParams(location.search).get('ref');
 const order = STORE.get('orders', []).find(item => item.id === ref);
 if (!order) {
  app.innerHTML = `${crumb('Receipt')}<div class="empty-state">Receipt not found in local demo orders.</div>`;
  return;
 }

 app.innerHTML = `
  ${crumb('Order receipt')}
  <div class="receipt-page-heading">
   <h1 class="page-title">Order receipt</h1>
   <button class="btn receipt-preview-button receipt-image-download" id="download-receipt" type="button">
    Download PNG <span aria-hidden="true">↓</span>
   </button>
  </div>
  <article class="receipt-document" aria-labelledby="receipt-title">
   <header class="receipt-document-header">
    <img class="receipt-document-logo" src="/assets/images/brand/contis-logo.png" alt="">
    <h2 id="receipt-title">Order Receipt</h2>
    <p>Conti’s Bakeshop &amp; Restaurant</p>
   </header>
   <p class="receipt-document-demo">Demo receipt · Not a tax invoice</p>
   <dl class="receipt-document-details">
    ${receiptDetails(order).map(([label, value]) => `<div><dt>${esc(label)}</dt><dd>${esc(value)}</dd></div>`).join('')}
   </dl>
   <table class="receipt-document-table">
    <thead><tr><th scope="col">Item</th><th scope="col">Qty</th><th scope="col">Unit price</th><th scope="col">Amount</th></tr></thead>
    <tbody>${order.items.map(item => `<tr><th scope="row">${esc(item.name)}</th><td>${item.qty}</td><td>${money(item.price)}</td><td>${money(item.price * item.qty)}</td></tr>`).join('')}</tbody>
   </table>
   <div class="receipt-document-total"><span>Order total</span><strong>${money(order.total)}</strong></div>
   ${order.note ? `<div class="receipt-document-note"><h3>Order note</h3><p>${esc(order.note)}</p></div>` : ''}
   <footer class="receipt-document-footer">
    <p>Thank you for choosing Conti’s.</p>
    <small>Academic demonstration · No real transaction was processed.</small>
   </footer>
  </article>
 `;
 const downloadButton = document.getElementById('download-receipt');
 let dismissError;
 let downloading = false;
 async function startDownload() {
  if (downloading) return;
  downloading = true;
  dismissError?.();
  dismissError = undefined;
  downloadButton.setAttribute('aria-disabled', 'true');
  try {
   await downloadReceipt(order);
  } catch (error) {
   console.error(error);
   dismissError = toast('Try downloading your demo receipt again.', {
    title: 'Receipt download failed',
    error: true,
    action: { label: 'Try again', run: startDownload }
   });
  } finally {
   downloading = false;
   downloadButton.removeAttribute('aria-disabled');
  }
 }
 downloadButton.addEventListener('click', startDownload);
}
function renderSearch(){const q=(new URLSearchParams(location.search).get('q')||'').trim();const items=searchProducts(q);app.innerHTML=`${crumb('Search')}<h1 class="page-title">Search</h1><form class="d-flex gap-2 mb-4" id="search-form"><label class="visually-hidden" for="search-page-input">Search products</label><input class="form-control" id="search-page-input" name="q" value="${esc(q)}" placeholder="Search products"><button class="btn btn-contis" type="submit">Search</button></form>${q?`<p class="muted">${items.length} matching products for “${esc(q)}”</p>${items.length?grid(items):'<div class="empty-state"><p>No products match your search. Try a product name or category.</p><a class="btn btn-outline-contis" href="/collections/all">Explore the catalog</a></div>'}`:'<p class="muted">Search the local product catalog by name, category or description.</p>'}`;document.querySelector('#search-form').onsubmit=e=>{e.preventDefault();const query=new FormData(e.currentTarget).get('q').toString().trim();if(query)location.href='/search/?q='+encodeURIComponent(query)}}
function renderStory(){app.innerHTML=`${crumb('Our Story')}<section class="story-layout"><div class="story-copy"><div class="eyebrow">Our Story</div><h1 class="page-title">Forever sharing joy from our home to yours.</h1><p>A passion to create and serve delectable food reminiscent of the convenience and comforting warmth of one's own home, this is what we at Conti's are all about.</p><p>Since opening its doors to families and friends in Parañaque in 1997, Conti's Bakeshop and Restaurant has created and shared memories of togetherness to people who have come to love its wide selection of products, including signature dishes such as Baked Salmon, Chicken Pie, and the well-loved Mango Bravo.</p><p>With the joy and satisfaction of every guest who walks into its stores in mind, this food haven which began as a simple family restaurant now brings the familiar feelings of home and carefully prepared products to thousands of homes across the country through continuous product innovation and service expansion. Today, Conti's Bakeshop &amp; Restaurant serves guests in communities across the Philippines.</p><p>Conti's is committed to making every guest experience memorable and to continuing to share its story in every product it creates and serves.</p><a class="btn btn-contis mt-2" href="/collections/all">Discover the menu</a></div><figure class="story-photo"><img src="https://www.contis.ph/cdn/shop/files/Conti-sisters.jpg?v=1693811410&amp;width=1400" alt="The Conti sisters, whose family restaurant began in Parañaque in 1997" loading="lazy"><figcaption>The Conti sisters — the family story behind Conti's.</figcaption></figure></section><p class="small muted mt-3">Story and photograph are linked from Conti's official Our Story page. This local recreation is not an official Conti's website.</p>`}
function renderServices(){const services=[['Online ordering','Browse cakes, baked goodies, restaurant favorites and party trays in the local catalog. This demo does not place real orders.','/collections/all','Explore the menu'],['Delivery & pick-up','Delivery and self pick-up options depend on the serving branch, date and order details. Confirm current availability with Conti’s.','/pages/delivery','Delivery information'],['Dine in','Visit a Bakeshop & Restaurant branch for dine-in service. Product and menu availability may vary by location.','/pages/dine-in','Find a restaurant'],['Take-Out Nook','Shop bakery favorites, frozen entrees and other take-home items at participating locations.','/pages/take-out-nook','Browse Take-Out Nook'],['Catering','Ask the customer care team about catering options for your gathering.','/pages/catering','Catering inquiries'],['Celebration venues','Selected locations may have function rooms. Contact the team to confirm venue availability and packages.','/pages/celebration-venues','Venue information'],['Drive-thru & park-thru','Some listed locations offer drive-thru or park-thru service. Check with the branch before visiting.','/tools/locations/directory','Check participating stores'],['Gift certificates & cake accessories','Ask a store about current gift certificate denominations, toppers and greeting cards. Availability may vary.','/collections/cake-accessories','Browse accessories'],['Third-party delivery','Delivery-platform menus and coverage can differ from Conti’s direct ordering. Check the delivery app for current options.','https://www.contis.ph/a/self-faq','Ordering help']];app.innerHTML=`${crumb('Services')}<div class="eyebrow">How we serve</div><h1 class="page-title">Services for every gathering</h1><p class="muted mb-4">From a quick pick-up to a celebration shared around the table, explore ways to enjoy Conti’s. Details and availability can vary by location.</p><div class="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-4">${services.map(([title,description,href,label])=>`<div class="col"><article class="service-card h-100"><div class="eyebrow">Conti's services</div><h2>${esc(title)}</h2><p>${esc(description)}</p><a href="${href}" ${href.startsWith('http')?'target="_blank" rel="noopener"':''}>${esc(label)} <span aria-hidden="true">→</span></a></article></div>`).join('')}</div><div class="content-panel mt-5"><h2 class="page-title">Need help planning?</h2><p class="muted">For current store, delivery or catering information, contact customer care or browse the store directory.</p><a class="btn btn-contis me-2" href="tel:85808888">Call 8580-8888</a><a class="btn btn-outline-contis" href="/tools/locations/directory">Find a store</a></div>`}
function renderBranches(){
 const coverage=Object.entries(DATA.branchCoverage||{});
 const count=coverage.reduce((sum,[,info])=>sum+Number(info.count||0),0);
 const branches=DATA.branches||[];
 const makeCoverageCards=entries=>entries.map(([region,info])=>`<article class="col-md-6 col-xl-4"><div class="coverage-card h-100"><div class="d-flex justify-content-between align-items-start gap-2"><h2>${esc(region)}</h2><span class="coverage-count">${info.count} ${info.count===1?'store':'stores'}</span></div><div class="coverage-cities">${Object.entries(info.cities).map(([city,number])=>`<span>${esc(city)} <b>${number}</b></span>`).join('')}</div><a href="https://www.contis.ph/tools/locations/regions/${region.toLowerCase().replace(/\s+/g,'-')}" target="_blank" rel="noopener">Open official ${esc(region)} directory <span aria-hidden="true">→</span></a></div></article>`).join('');
 app.innerHTML=`${crumb('Our Stores')}<div class="eyebrow">Find us across the Philippines</div><h1 class="page-title">Our Stores</h1><p class="muted">Browse all ${branches.length} branches listed in Conti’s official directory across ${coverage.length} regions. Search by branch name, city, region or address.</p><div class="row g-3 align-items-center mt-3"><div class="col-md-6"><label class="visually-hidden" for="branch-search">Search branches by name, city, region or address</label><input class="form-control" id="branch-search" type="search" placeholder="Search branches, cities or addresses"></div><div class="col-md-6 text-md-end"><a class="btn btn-contis" href="https://www.contis.ph/tools/locations/directory" target="_blank" rel="noopener">Open official store locator</a></div></div><section aria-labelledby="all-branches-heading"><div class="d-flex justify-content-between align-items-baseline gap-3 flex-wrap mt-5 mb-3"><h2 id="all-branches-heading" class="h3 mb-0">All branches</h2><span id="branch-result-count" role="status" class="small muted">${branches.length} branches</span></div><div id="branch-list" class="row g-3">${branchCards(branches)}</div></section><section aria-labelledby="regional-coverage-heading"><h2 id="regional-coverage-heading" class="h3 mt-5 mb-3">Browse by region</h2><div id="coverage-list" class="row g-3">${makeCoverageCards(coverage)}</div></section><p class="notice mt-4">Branch names and addresses are from Conti’s official location directory. Store details and hours may change; confirm with Conti’s before visiting. The directory summary reports ${count} branches.</p>`;
 document.querySelector('#branch-search').oninput=event=>{
  const query=event.target.value.trim().toLowerCase();
  document.querySelector('#coverage-list').closest('section').hidden=Boolean(query);
  document.querySelector('#all-branches-heading').textContent=query?'Matching branches':'All branches';
  const filteredBranches=branches.filter(branch=>`${branch.name} ${branch.city} ${branch.region} ${branch.address}`.toLowerCase().includes(query));
  document.querySelector('#branch-list').innerHTML=branchCards(filteredBranches);
  document.querySelector('#branch-result-count').textContent=`${filteredBranches.length} ${filteredBranches.length===1?'branch':'branches'}`;
 };
}
function branchCards(list){return list.map(b=>`<div class="col-md-6 col-xl-4"><article class="branch-card h-100"><h3>${esc(b.name)}</h3><p class="branch-card-location">${esc(b.city)} · ${esc(b.region)}</p><p class="branch-card-address">${esc(b.address)}</p><a href="${esc(b.source)}" target="_blank" rel="noopener">View official listing <span aria-hidden="true">→</span></a></article></div>`).join('')||'<p class="muted">No branches match that search.</p>'}
function renderFaq(){
 const faqs=[
  ['Orders & Checkout','How do I place an order online?','Choose Pick-up or Delivery, select a store, date and time, enter your details, choose your items, add them to cart, and proceed to checkout. The official Help Center describes this process.'],
  ['Delivery','What is the standard delivery fee?','The official Help Center currently describes a standard delivery rate of ₱105 up to 5 kilometers, with an additional ₱25 for each succeeding kilometer, and a maximum delivery distance of 12 kilometers. Confirm current details with Conti’s.'],
  ['Cakes & Products','Can I customize a cake?','The Help Center says cake inscriptions are not available, but edible cake toppers and greeting cards are offered.'],
  ['Orders & Checkout','Where can I find the restaurant menu?','Visit the Restaurant Menu page on the official website.'],
  ['Contact','How can I contact Conti’s?','Email wecare@contis.ph or call 8580-8888.']
 ];
 const categories=[['All topics','All topics'],['Orders & Checkout','Orders'],['Delivery','Delivery'],['Cakes & Products','Cakes'],['Contact','Contact']];
 app.innerHTML=`${crumb('Help Center')}<section class="help-hero"><div class="help-hero-copy"><div class="eyebrow">Conti's Help Center</div><h1>How can we help?</h1><p>Find answers about ordering, delivery, cakes and customer care.</p></div><form class="help-search" id="faq-search-form" role="search"><label class="visually-hidden" for="faq-search">Search help topics</label><span aria-hidden="true">⌕</span><input id="faq-search" type="search" autocomplete="off" placeholder="Search for help topics"><button type="submit" aria-label="Search">Search</button></form></section><section class="help-layout"><aside class="help-sidebar"><div class="help-sidebar-heading"><span>Browse by topic</span></div><div class="help-categories">${categories.map(([label,short],index)=>`<button type="button" class="help-category ${index===0?'active':''}" data-help-category="${esc(label)}"><span>${esc(short)}</span><b aria-hidden="true">›</b></button>`).join('')}</div><div class="help-sidebar-contact"><div class="eyebrow">Still need help?</div><p>Our customer care team is ready to assist.</p><a href="tel:85808888">8580-8888</a><a href="mailto:wecare@contis.ph">wecare@contis.ph</a></div></aside><div class="help-content"><div class="help-content-heading"><div><div class="eyebrow" id="help-category-label">All topics</div><h2>Frequently asked questions</h2></div><span id="help-result-count">${faqs.length} answers</span></div><div class="faq-list">${faqs.map((f,i)=>`<details class="faq-item" data-help-category="${esc(f[0])}" data-help-text="${esc((f[1]+' '+f[2]).toLowerCase())}" ${i===0?'open':''}><summary><span>${esc(f[1])}</span><b aria-hidden="true">${i===0?'−':'+'}</b></summary><div class="faq-answer"><p>${esc(f[2])}</p><div class="faq-feedback"><span>Was this helpful?</span><button type="button" data-feedback="yes" aria-label="Yes, this was helpful">Yes</button><button type="button" data-feedback="no" aria-label="No, this was not helpful">No</button></div></div></details>`).join('')}</div><p class="help-no-results" id="help-no-results" hidden>No answers match your search.</p></div></section><section class="help-official"><div><div class="eyebrow">Official information</div><h2>Looking for more details?</h2><p>Visit Conti’s official Help Center for the latest policies and ordering information.</p></div><a class="btn help-official-button" href="https://www.contis.ph/a/self-faq" target="_blank" rel="noopener">Visit official Help Center <span aria-hidden="true">→</span></a></section>`;
 const search=document.querySelector('#faq-search');
 let activeCategory='All topics';
 const filterFaq=()=>{
  const query=search.value.trim().toLowerCase();
  let visible=0;
  document.querySelectorAll('.faq-item').forEach(item=>{
   const categoryMatch=activeCategory==='All topics'||item.dataset.helpCategory===activeCategory;
   const queryMatch=!query||item.dataset.helpText.includes(query);
   const show=categoryMatch&&queryMatch;
   item.hidden=!show;
   if(show)visible++;
  });
  document.querySelector('#help-result-count').textContent=`${visible} ${visible===1?'answer':'answers'}`;
  document.querySelector('#help-category-label').textContent=activeCategory;
  document.querySelector('#help-no-results').hidden=visible!==0;
 };
 search.addEventListener('input',filterFaq);
 document.querySelector('#faq-search-form').addEventListener('submit',event=>{event.preventDefault();filterFaq();document.querySelector('.help-content').scrollIntoView({behavior:'smooth',block:'start'})});
 document.querySelectorAll('.help-category[data-help-category]').forEach(button=>{
  button.addEventListener('click',()=>{
   activeCategory=button.dataset.helpCategory;
   document.querySelectorAll('.help-category').forEach(item=>item.classList.toggle('active',item===button));
   filterFaq();
  });
 });
 document.querySelectorAll('.faq-item summary').forEach(summary=>{
  summary.addEventListener('click',()=>{
   const item=summary.closest('.faq-item');
   setTimeout(()=>summary.parentElement.querySelector('b').textContent=item.open?'−':'+',0);
  });
 });
}
function renderAccount(){
 const user=STORE.get('user',null);
 const registering=path=== '/account/register';
 if(user){
  app.innerHTML=`<nav aria-label="breadcrumb"><ol class="breadcrumb"><li class="breadcrumb-item"><a href="/">Home</a></li><li class="breadcrumb-item active">My Account</li></ol></nav><section class="account-dashboard"><aside class="account-welcome"><div class="account-monogram">${esc((user.name||'Conti').trim().charAt(0).toUpperCase())}</div><div><div class="eyebrow">Welcome back</div><h1>${esc(user.name)}</h1><p>${esc(user.email)}</p></div></aside><div class="account-dashboard-content"><div><div class="eyebrow">My account</div><h2 class="page-title">Good to see you.</h2><p class="muted">Manage your local demo profile and view orders created during this visit.</p></div><div class="account-action-grid"><a class="account-action-card" href="/pages/order-history"><span>01</span><h3>Order history</h3><p>View your recent demo orders.</p><b aria-hidden="true">→</b></a><a class="account-action-card" href="/pages/wishlist"><span>02</span><h3>My wishlist</h3><p>Return to your saved products.</p><b aria-hidden="true">→</b></a></div><div class="account-dashboard-footer"><p class="small muted mb-0">Your profile is stored only in this browser.</p><button class="btn btn-outline-contis" id="logout" type="button">Sign out</button></div></div></section>`;
  const logout=document.querySelector('#logout');
  if(logout)logout.onclick=()=>{STORE.set('user',null);renderAccount()};
  return;
 }
 app.innerHTML=`<section class="auth-shell"><div class="auth-visual"><a class="auth-brand" href="/" aria-label="Conti's home"><span>Conti's</span><small>Bakeshop &amp; Restaurant</small></a><div class="auth-visual-copy"><div class="eyebrow">Delightfully yours</div><h1>${registering?'Create moments worth sharing.':'Welcome back to your table.'}</h1><p>${registering?'Save your favorites and keep track of demo orders from one convenient place.':'Sign in to revisit saved treats and continue planning your next gathering.'}</p></div><div class="auth-visual-footer">A little sweetness, always.</div></div><div class="auth-panel"><div class="auth-panel-inner"><div class="auth-tabs" role="tablist" aria-label="Account options"><a role="tab" aria-selected="${!registering}" class="${!registering?'active':''}" href="/account/login">Sign in</a><a role="tab" aria-selected="${registering}" class="${registering?'active':''}" href="/account/register">Create account</a></div><div class="auth-heading"><div class="eyebrow">${registering?'Join the Conti’s community':'Member sign in'}</div><h2>${registering?'Create your account':'Sign in to your account'}</h2><p>${registering?'A few details and you are ready to begin.':'Enter your details to continue.'}</p></div><form id="${registering?'register-form':'login-form'}" class="auth-form">${registering?'<div class=\"auth-field\"><label for=\"auth-name\">Full name</label><input id=\"auth-name\" class=\"form-control\" name=\"name\" autocomplete=\"name\" placeholder=\"Your name\" required></div>':'<div class=\"auth-field\"><label for=\"auth-name\">Name</label><input id=\"auth-name\" class=\"form-control\" name=\"name\" autocomplete=\"name\" placeholder=\"Your name\" required></div>'}<div class="auth-field"><label for="auth-email">Email address</label><input id="auth-email" class="form-control" name="email" type="email" autocomplete="email" placeholder="you@example.com" required></div>${registering?'<div class=\"auth-field\"><label for=\"auth-password\">Create password</label><div class=\"auth-password\"><input id=\"auth-password\" class=\"form-control\" name=\"password\" type=\"password\" autocomplete=\"new-password\" minlength=\"6\" placeholder=\"At least 6 characters\" required><button type=\"button\" data-password-toggle aria-label=\"Show password\"><span aria-hidden=\"true\">Show</span></button></div></div><label class=\"auth-check\"><input type=\"checkbox\" required><span>I agree to the <a href=\"/policies/terms-of-service\">Terms and Conditions</a> and <a href=\"/policies/privacy-policy\">Privacy Policy</a>.</span></label>':'<div class=\"auth-options\"><label class=\"auth-check\"><input type=\"checkbox\" name=\"remember\"><span>Remember me</span></label><a href=\"/a/self-faq\">Need help?</a></div>'}<button class="btn auth-submit" type="submit">${registering?'Create account':'Sign in'} <span aria-hidden="true">→</span></button></form><p class="auth-demo-note">Demo experience: profile details stay in this browser. Passwords are never stored.</p></div></div></section>`;
 const form=document.querySelector(registering?'#register-form':'#login-form');
 if(form)form.onsubmit=e=>{
  e.preventDefault();
  const data=new FormData(form);
  const name=String(data.get('name')||'').trim();
  const email=String(data.get('email')||'').trim();
  if(!name||!email)return;
  STORE.set('user',{name,email});
  renderAccount();
 };
 document.querySelectorAll('[data-password-toggle]').forEach(button=>{
  button.addEventListener('click',()=>{
   const input=button.parentElement.querySelector('input');
   const show=input.type==='password';
   input.type=show?'text':'password';
   button.querySelector('span').textContent=show?'Hide':'Show';
   button.setAttribute('aria-label',show?'Hide password':'Show password');
  });
 });
}
function renderHistory(){const orders=STORE.get('orders',[]);app.innerHTML=`${crumb('Order History')}<h1 class="page-title">Order History</h1><div class="demo-banner">Local simulated order history only.</div>${orders.length?orders.map(o=>`<div class="content-panel mb-3"><strong>${esc(o.id)}</strong> · ${new Date(o.created).toLocaleDateString()} · ${money(o.total)}<p>${esc(o.status)} / ${esc(o.paymentStatus)}</p><a href="/pages/order-tracking/?ref=${encodeURIComponent(o.id)}">Track</a> · <a href="/pages/order-receipt/?ref=${encodeURIComponent(o.id)}">Receipt</a></div>`).join(''):'<div class="empty-state">No demo orders yet.</div>'}`}
function renderInfo(title,body){app.innerHTML=`${crumb(title)}<div class="content-panel"><h1 class="page-title">${esc(title)}</h1>${body}</div>`}
function render404(){app.innerHTML=`<div class="empty-state"><h1 class="page-title">Page not found</h1><p>This route has not been recreated or is not part of the verified route inventory.</p><a class="btn btn-contis" href="/">Return home</a></div>`}
function render(){updateCounts();if(path==='/')return renderHome();if(path==='/cart')return renderCart();if(path==='/checkout')return renderCheckout();if(path==='/search')return renderSearch();if(path.startsWith('/collections/'))return renderCollection(path.split('/').pop());if(path.startsWith('/products/'))return renderProduct(path.split('/').pop());if(path==='/pages/our-story')return renderStory();if(path==='/pages/services')return renderServices();if(path==='/tools/locations'||path==='/tools/locations/directory'||path==='/tools/locations/countries/philippines')return renderBranches();if(path==='/a/self-faq')return renderFaq();if(path==='/account/login'||path==='/account/register'||path==='/account')return renderAccount();if(path==='/pages/order-history')return renderHistory();if(path==='/pages/order-tracking')return renderTracking();if(path==='/pages/order-receipt')return renderReceipt();if(path==='/pages/order-confirmation')return renderConfirmation();if(path==='/pages/restaurant-menu')return renderCollection('restaurant-menu');if(path==='/pages/take-out-nook')return renderCollection('take-out-nook');if(path==='/pages/large-food-orders')return renderCollection('large-food-order');if(path==='/pages/contact')return renderInfo('Contact',`<p>Customer care: <a href="mailto:wecare@contis.ph">wecare@contis.ph</a></p><p>Hotline: <a href="tel:85808888">8580-8888</a></p><p><a href="/a/self-faq">Visit Help Center</a></p>`);if(path==='/pages/delivery')return renderInfo('Delivery',`<p>Conti’s delivery arrangements depend on branch coverage and order details. The supplied reference notes website ordering, branch orders and third-party delivery platforms.</p><p>For current availability, use the <a href="/tools/locations">store locator</a> or contact <a href="mailto:wecare@contis.ph">wecare@contis.ph</a>.</p>`);if(path==='/pages/dine-in')return renderInfo('Dine In',`<p>Visit a Conti’s Bakeshop & Restaurant branch for dine-in service. Menu availability may vary by branch.</p><a href="/tools/locations/directory">Browse store directory</a>`);if(path==='/pages/catering')return renderInfo('Catering',`<p>For catering inquiries, contact Conti’s at <a href="tel:85808888">8580-8888</a> or <a href="mailto:wecare@contis.ph">wecare@contis.ph</a>.</p>`);if(path==='/pages/celebration-venues')return renderInfo('Celebration Venues',`<p>Selected branches offer function rooms. Availability, packages and reservations are handled by the operations team. Contact the hotline for current details.</p><a href="/tools/locations/directory">Find a branch</a>`);if(path==='/tools/locations/regions/laguna')return renderInfo('Laguna Stores',`<p>The supplied directory reference lists 7 Laguna branches across Biñan, Calamba, San Pablo, San Pedro and Santa Rosa. Individual address records require confirmation through the official locator.</p><a href="/tools/locations/directory">View directory coverage</a>`);if(path==='/tools/locations/locations/san-pablo-mainstreet')return renderInfo('Conti’s San Pablo – Mainstreet',`<p>Address reference: Mainstreet, San Pablo City, Laguna, Philippines.</p><p>Confirm current operating hours and exact directions with the official store locator.</p><a href="https://www.contis.ph/tools/locations/locations/san-pablo-mainstreet" target="_blank" rel="noopener">Official branch listing</a>`);if(path==='/policies/privacy-policy')return renderInfo('Privacy Policy',`<p>Refer to the <a href="https://www.contis.ph/policies/privacy-policy" target="_blank" rel="noopener">official Conti's Privacy Policy</a> for the current legal text. Full text has not yet been captured for local reproduction.</p>`);if(path==='/policies/terms-of-service')return renderInfo('Terms and Conditions',`<p>Refer to the <a href="https://www.contis.ph/policies/terms-of-service" target="_blank" rel="noopener">official Conti's Terms and Conditions</a> for the current legal text. Full text has not yet been captured for local reproduction.</p>`);render404()}
function render(){updateCounts();app.classList.remove('product-page');if(path==='/')return renderHome();if(path==='/cart')return renderCart();if(path==='/checkout')return renderCheckout();if(path==='/search')return renderSearch();if(path==='/pages/wishlist')return renderWishlist();if(path.startsWith('/collections/'))return renderCollection(path.split('/').pop());if(path.startsWith('/products/'))return renderProduct(path.split('/').pop());if(path==='/pages/our-story')return renderStory();if(path==='/pages/services')return renderServices();if(path==='/tools/locations'||path==='/tools/locations/directory'||path==='/tools/locations/countries/philippines')return renderBranches();if(path==='/a/self-faq')return renderFaq();if(path==='/account/login'||path==='/account/register'||path==='/account')return renderAccount();if(path==='/pages/order-history')return renderHistory();if(path==='/pages/order-tracking')return renderTracking();if(path==='/pages/order-receipt')return renderReceipt();if(path==='/pages/order-confirmation')return renderConfirmation();if(path==='/pages/restaurant-menu')return renderCollection('restaurant-menu');if(path==='/pages/take-out-nook')return renderCollection('take-out-nook');if(path==='/pages/large-food-orders')return renderCollection('large-food-order');if(path==='/pages/contact')return renderInfo('Contact',`<p>Customer care: <a href="mailto:wecare@contis.ph">wecare@contis.ph</a></p><p>Hotline: <a href="tel:85808888">8580-8888</a></p><p><a href="/a/self-faq">Visit Help Center</a></p>`);if(path==='/pages/delivery')return renderInfo('Delivery',`<p>Conti’s delivery arrangements depend on branch coverage and order details. The supplied reference notes website ordering, branch orders and third-party delivery platforms.</p><p>For current availability, use the <a href="/tools/locations">store locator</a> or contact <a href="mailto:wecare@contis.ph">wecare@contis.ph</a>.</p>`);if(path==='/pages/dine-in')return renderInfo('Dine In',`<p>Visit a Conti’s Bakeshop & Restaurant branch for dine-in service. Menu availability may vary by branch.</p><a href="/tools/locations/directory">Browse store directory</a>`);if(path==='/pages/catering')return renderInfo('Catering',`<p>For catering inquiries, contact Conti’s at <a href="tel:85808888">8580-8888</a> or <a href="mailto:wecare@contis.ph">wecare@contis.ph</a>.</p>`);if(path==='/pages/celebration-venues')return renderInfo('Celebration Venues',`<p>Selected branches offer function rooms. Availability, packages and reservations are handled by the operations team. Contact the hotline for current details.</p><a href="/tools/locations/directory">Find a branch</a>`);if(path==='/tools/locations/regions/laguna')return renderInfo('Laguna Stores',`<p>The supplied directory reference lists 7 Laguna branches across Biñan, Calamba, San Pablo, San Pedro and Santa Rosa. Individual address records require confirmation through the official locator.</p><a href="/tools/locations/directory">View directory coverage</a>`);if(path==='/tools/locations/locations/san-pablo-mainstreet')return renderInfo('Conti’s San Pablo – Mainstreet',`<p>Address reference: Mainstreet, San Pablo City, Laguna, Philippines.</p><p>Confirm current operating hours and exact directions with the official store locator.</p><a href="https://www.contis.ph/tools/locations/locations/san-pablo-mainstreet" target="_blank" rel="noopener">Official branch listing</a>`);if(path==='/policies/privacy-policy')return renderInfo('Privacy Policy',`<p>Refer to the <a href="https://www.contis.ph/policies/privacy-policy" target="_blank" rel="noopener">official Conti's Privacy Policy</a> for the current legal text. Full text has not yet been captured for local reproduction.</p>`);if(path==='/policies/terms-of-service')return renderInfo('Terms and Conditions',`<p>Refer to the <a href="https://www.contis.ph/policies/terms-of-service" target="_blank" rel="noopener">official Conti's Terms and Conditions</a> for the current legal text. Full text has not yet been captured for local reproduction.</p>`);render404()}
document.addEventListener('click',e=>{const a=e.target.closest('[data-add]');if(a){const input=a.closest('.product-card-actions')?.querySelector('.quick-quantity input');addCart(a.dataset.add,Math.max(1,Number.parseInt(input?.value||a.dataset.addQuantity||'1',10)||1))}const favorite=e.target.closest('[data-wishlist]');if(favorite)toggleWishlist(favorite.dataset.wishlist);const schedule=e.target.closest('[data-open-schedule]');if(schedule)openSchedule(schedule.dataset.openSchedule);const cardQty=e.target.closest('[data-card-qty-delta]');if(cardQty){const input=cardQty.closest('.quick-quantity').querySelector('input');input.value=Math.max(1,(Number.parseInt(input.value,10)||1)+Number(cardQty.dataset.cardQtyDelta))}const layout=e.target.closest('[data-layout]');if(layout){STORE.set('catalog-layout',layout.dataset.layout);document.querySelectorAll('[data-layout]').forEach(button=>{const active=button.dataset.layout===layout.dataset.layout;button.classList.toggle('active',active);button.setAttribute('aria-pressed',String(active))});document.querySelectorAll('.product-grid').forEach(productGrid=>{productGrid.className=`product-grid ${layout.dataset.layout==='list'?'layout-list':`layout-grid layout-grid-${layout.dataset.layout.slice(5)}`}`})}const rm=e.target.closest('[data-remove]');if(rm){STORE.set('cart',STORE.get('cart',[]).filter(x=>x.id!==rm.dataset.remove));updateCounts();renderCart()}const q=e.target.closest('[data-qty]');if(q){let c=STORE.get('cart',[]);let x=c.find(y=>y.id===q.dataset.qty);if(x){x.qty=Math.max(1,x.qty+Number(q.dataset.delta));STORE.set('cart',c);renderCart();updateCounts()}}if(e.target.closest('[data-feedback]'))toast('Thank you for your feedback. (Local demo)')});
document.addEventListener('change',e=>{if(e.target.matches('.quick-quantity input'))e.target.value=Math.max(1,Number.parseInt(e.target.value,10)||1);if(e.target.id==='status-control'){let orders=STORE.get('orders',[]);let o=orders.find(x=>x.id===e.target.dataset.order);if(o){o.status=e.target.value;STORE.set('orders',orders);renderTracking();toast('Demo tracking status updated')}}});
function loadChatbot() {
  const stylesheet = document.createElement('link');
  stylesheet.rel = 'stylesheet';
  stylesheet.href = '/css/chatbot.css';
  stylesheet.addEventListener('load', () => {
    const script = document.createElement('script');
    script.src = '/js/chatbot.js';
    document.head.appendChild(script);
  }, { once: true });
  document.head.appendChild(stylesheet);
}

loadChatbot();
setupNavigation();
Promise.all(['/data/products.json','/data/collections.json','/data/branches.json','/data/branch-coverage.json'].map(u=>fetch(u).then(r=>{if(!r.ok)throw new Error(`Unable to load ${u}: ${r.status}`);return r.json()}))).then(([p,c,b,bc])=>{const products=Array.isArray(p)?p:p?.value;if(!Array.isArray(products))throw new Error('Product catalog JSON must contain a product array.');for(const product of products){for(const key of ['collections','tags','aliases','sourceCollections','galleryImages','variants','variantPrices']){if(!Array.isArray(product[key]))product[key]=product[key]==null?[]:[product[key]]}}DATA.products=products;DATA.collections=c;DATA.branches=b;DATA.branchCoverage=bc;setupNavigation();render()}).catch(err=>{console.error(err);app.innerHTML='<div class="notice">Local data could not load. Check the project data files and open the root index.html using Live Server.</div>'});
