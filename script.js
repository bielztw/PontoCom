
// ===== DATA =====
const stores = [
  { id:1, name:'TechZone BR', cat:'tecnologia', emoji:'💻', cover:'https://images.unsplash.com/photo-1518770660439-4636190af475?w=400&h=120&fit=crop', rating:4.9, reviews:312, badge:'🏆 Top', tags:['Eletrônicos','Gadgets','Acessórios'], desc:'Especializada em gadgets e eletrônicos para o dia a dia.', products:[{n:'Fone Bluetooth',p:'R$189',e:'🎧',old:'R$249'},{n:'Mouse Gamer',p:'R$139',e:'🖱️',old:'R$199'},{n:'Webcam HD',p:'R$229',e:'📷',old:'R$299'}], comments:[{u:'Maria S.',t:5,c:'Produtos incríveis e entrega rápida!'},{u:'João P.',t:5,c:'Melhor loja de tecnologia da plataforma.'}] },
  { id:2, name:'FarmaVida', cat:'farmacia', emoji:'💊', cover:'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=400&h=120&fit=crop', rating:4.8, reviews:198, badge:'✅ Verificado', tags:['Medicamentos','Vitaminas','Higiene'], desc:'Farmácia com produtos de saúde e bem-estar.', products:[{n:'Vitamina C 1g',p:'R$29',e:'🍊',old:'R$39'},{n:'Protetor Solar',p:'R$45',e:'🧴',old:'R$65'},{n:'Termômetro',p:'R$35',e:'🌡️',old:'R$49'}], comments:[{u:'Ana R.',t:5,c:'Medicamentos de qualidade e preço justo!'},{u:'Carlos M.',t:4,c:'Bom atendimento e entrega pontual.'}] },
  { id:3, name:'Sabor da Vó', cat:'alimentacao', emoji:'🍰', cover:'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=400&h=120&fit=crop', rating:5.0, reviews:547, badge:'⭐ Favorito', tags:['Doces','Salgados','Artesanal'], desc:'Comida artesanal feita com amor e ingredientes frescos.', products:[{n:'Bolo de Cenoura',p:'R$55',e:'🥕',old:''},{n:'Coxinhas 12un',p:'R$38',e:'🍗',old:''},{n:'Pão de Queijo',p:'R$28',e:'🧀',old:'R$35'}], comments:[{u:'Lucia F.',t:5,c:'Simplesmente incrível! Bolo de cenoura perfeito!'},{u:'Rafael T.',t:5,c:'Melhor comida artesanal que já provei!'}] },
  { id:4, name:'ModaFácil', cat:'moda', emoji:'👗', cover:'https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=400&h=120&fit=crop', rating:4.7, reviews:203, badge:'🆕 Novo', tags:['Roupas','Acessórios','Plus Size'], desc:'Moda para todos os estilos e tamanhos.', products:[{n:'Vestido Floral',p:'R$89',e:'👗',old:'R$129'},{n:'Bolsa Tote',p:'R$79',e:'👜',old:'R$109'},{n:'Óculos de Sol',p:'R$59',e:'🕶️',old:''}], comments:[{u:'Fernanda L.',t:5,c:'Roupas lindas e tamanhos inclusivos!'},{u:'Bruna S.',t:4,c:'Boa qualidade pelo preço.'}] },
  { id:5, name:'Bela & Cia', cat:'beleza', emoji:'💄', cover:'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=400&h=120&fit=crop', rating:4.8, reviews:421, badge:'🌸 Premium', tags:['Maquiagem','Skincare','Cabelos'], desc:'Beleza e autocuidado para você brilhar.', products:[{n:'Batom Matte',p:'R$35',e:'💄',old:'R$49'},{n:'Sérum Facial',p:'R$129',e:'✨',old:'R$179'},{n:'Paleta Sombras',p:'R$89',e:'🎨',old:'R$119'}], comments:[{u:'Camila R.',t:5,c:'Produtos incríveis! Minha pele agradece!'},{u:'Isabella M.',t:5,c:'Maquiagem de longa duração e ótimo preço.'}] },
  { id:6, name:'PetAmor', cat:'pets', emoji:'🐾', cover:'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400&h=120&fit=crop', rating:4.9, reviews:189, badge:'🐶 Especialista', tags:['Rações','Brinquedos','Acessórios'], desc:'Tudo para o bem-estar e felicidade do seu pet.', products:[{n:'Ração Premium 10kg',p:'R$189',e:'🐕',old:'R$239'},{n:'Arranhador Gato',p:'R$149',e:'🐈',old:''},{n:'Coleira LED',p:'R$45',e:'💡',old:'R$69'}], comments:[{u:'Pedro A.',t:5,c:'Meu cachorro ama a ração daqui!'},{u:'Sandra B.',t:5,c:'Excelente qualidade nos produtos!'}] },
];

const products = [
  { name:'Fone Bluetooth Pro', price:'R$189', old:'R$249', emoji:'🎧', store:'TechZone BR', cat:'tecnologia', discount:'-24%' },
  { name:'Mouse Gamer RGB', price:'R$139', old:'R$199', emoji:'🖱️', store:'TechZone BR', cat:'tecnologia', discount:'-30%' },
  { name:'Vitamina C 1g', price:'R$29', old:'R$39', emoji:'🍊', store:'FarmaVida', cat:'farmacia', discount:'-25%' },
  { name:'Bolo de Cenoura 1kg', price:'R$55', old:'', emoji:'🥕', store:'Sabor da Vó', cat:'alimentacao', discount:'' },
  { name:'Vestido Floral M', price:'R$89', old:'R$129', emoji:'👗', store:'ModaFácil', cat:'moda', discount:'-31%' },
  { name:'Sérum Facial 30ml', price:'R$129', old:'R$179', emoji:'✨', store:'Bela & Cia', cat:'beleza', discount:'-28%' },
  { name:'Ração Premium 10kg', price:'R$189', old:'R$239', emoji:'🐕', store:'PetAmor', cat:'pets', discount:'-21%' },
  { name:'Webcam HD 1080p', price:'R$229', old:'R$299', emoji:'📷', store:'TechZone BR', cat:'tecnologia', discount:'-23%' },
  { name:'Protetor Solar FPS60', price:'R$45', old:'R$65', emoji:'🧴', store:'FarmaVida', cat:'farmacia', discount:'-30%' },
  { name:'Coxinhas Artesanais 12un', price:'R$38', old:'', emoji:'🍗', store:'Sabor da Vó', cat:'alimentacao', discount:'' },
];

const coupons = [
  { code:'BEMVINDO20', desc:'20% OFF na primeira compra', expiry:'31/12/2025', color:'var(--rosa)' },
  { code:'FRETEFACIL', desc:'Frete grátis acima de R$99', expiry:'31/01/2026', color:'var(--laranja)' },
  { code:'SAUDE10', desc:'10% OFF em Farmácias', expiry:'28/02/2026', color:'#10b981' },
  { code:'TECH15', desc:'15% OFF em Tecnologia', expiry:'15/01/2026', color:'#2563eb' },
  { code:'PET25', desc:'25% OFF em Pet Shop', expiry:'28/02/2026', color:'#7c3aed' },
];

const orders = [
  { id:'#001234', client:'Maria Silva', product:'Fone Bluetooth', val:'R$189', status:'pago', date:'10/01/2025' },
  { id:'#001235', client:'João Pereira', product:'Vitamina C 1g', val:'R$29', status:'enviado', date:'11/01/2025' },
  { id:'#001236', client:'Ana Souza', product:'Bolo de Cenoura', val:'R$55', status:'pendente', date:'12/01/2025' },
  { id:'#001237', client:'Carlos Lima', product:'Vestido Floral', val:'R$89', status:'pago', date:'12/01/2025' },
  { id:'#001238', client:'Fernanda Costa', product:'Sérum Facial', val:'R$129', status:'enviado', date:'13/01/2025' },
  { id:'#001239', client:'Ricardo Alves', product:'Ração Premium', val:'R$189', status:'cancelado', date:'13/01/2025' },
];

let cartItems = [];
let currentTab = 'inicio';
let mapInstance = null;

// ===== RENDER FUNCTIONS =====
function renderStores(list, targetId) {
  const el = document.getElementById(targetId);
  if (!el) return;
  el.innerHTML = list.map(s => `
    <div class="store-card" onclick="openStoreModal(${s.id})">
      <div class="store-cover">
        <img src="${s.cover}" alt="${s.name}" onerror="this.style.display='none';this.parentElement.style.background='var(--grad1)'">
        <span class="store-badge">${s.badge}</span>
        <div class="store-avatar">${s.emoji}</div>
      </div>
      <div class="store-body">
        <div class="store-name">${s.name}</div>
        <div class="store-cat">${s.cat.charAt(0).toUpperCase()+s.cat.slice(1)}</div>
        <div class="stars">${'★'.repeat(Math.floor(s.rating))}${'☆'.repeat(5-Math.floor(s.rating))} <span>${s.rating} (${s.reviews})</span></div>
        <div class="store-tags">${s.tags.map((t,i)=>`<span class="tag ${i===1?'laranja':i===2?'amarelo':''}">${t}</span>`).join('')}</div>
        <div class="store-stats">
          <span><i class="fas fa-box"></i> ${s.products.length} produtos</span>
          <span><i class="fas fa-star"></i> ${s.rating}/5</span>
          <span><i class="fas fa-comment"></i> ${s.comments.length}</span>
        </div>
      </div>
    </div>
  `).join('');
}

function renderProducts(list, targetId) {
  const el = document.getElementById(targetId);
  if (!el) return;
  el.innerHTML = list.map((p,i) => `
    <div class="product-card">
      <div class="product-img">
        ${p.discount ? `<span class="product-discount-badge">${p.discount}</span>` : ''}
        <button class="wishlist-btn" onclick="event.stopPropagation();this.classList.toggle('liked');showToast(this.classList.contains('liked')?'Adicionado aos favoritos! ❤️':'Removido dos favoritos')"><i class="fas fa-heart"></i></button>
        <span style="font-size:56px;transition:transform 0.3s" onmouseover="this.style.transform='scale(1.2) rotate(5deg)'" onmouseout="this.style.transform=''">${p.emoji}</span>
      </div>
      <div class="product-body">
        <div class="product-title">${p.name}</div>
        <div class="product-store"><i class="fas fa-store" style="color:var(--rosa);font-size:10px"></i> ${p.store}</div>
        <div class="stars" style="font-size:11px">★★★★★</div>
        <div style="display:flex;align-items:baseline;gap:4px;margin-top:4px;">
          <div class="product-price">${p.price}</div>
          ${p.old ? `<div class="product-price-old">${p.old}</div>` : ''}
        </div>
        <button class="add-cart-btn" onclick="addToCart(${JSON.stringify(p).replace(/"/g,'&quot;')},this)">
          <i class="fas fa-cart-plus"></i> Adicionar
        </button>
      </div>
    </div>
  `).join('');
}

function renderCoupons() {
  const el = document.getElementById('couponsGrid');
  if (!el) return;
  el.innerHTML = coupons.map(c => `
    <div style="background:${c.color}15;border:2px dashed ${c.color};border-radius:16px;padding:16px;margin-bottom:12px;display:flex;align-items:center;justify-content:space-between;gap:12px;">
      <div>
        <div style="font-size:18px;font-weight:900;color:${c.color};letter-spacing:2px;">${c.code}</div>
        <div style="font-size:13px;font-weight:700;margin-top:4px;">${c.desc}</div>
        <div style="font-size:11px;color:var(--gray);margin-top:2px;">Válido até ${c.expiry}</div>
      </div>
      <button style="background:${c.color};color:white;border:none;padding:8px 14px;border-radius:10px;font-family:'Nunito',sans-serif;font-weight:800;font-size:12px;cursor:pointer;white-space:nowrap;" onclick="copyCoupon('${c.code}')">Copiar</button>
    </div>
  `).join('');
}

function renderOrders() {
  const el = document.getElementById('ordersTable');
  if (!el) return;
  el.innerHTML = orders.map(o => `
    <tr>
      <td style="font-weight:800;color:var(--rosa)">${o.id}</td>
      <td>${o.client}</td>
      <td>${o.product}</td>
      <td style="font-weight:800">${o.val}</td>
      <td><span class="status-badge status-${o.status}">${o.status.charAt(0).toUpperCase()+o.status.slice(1)}</span></td>
      <td>${o.date}</td>
      <td>
        <button style="background:var(--rosa-pale);color:var(--rosa);border:none;padding:5px 10px;border-radius:8px;font-size:11px;font-weight:800;cursor:pointer;margin-right:4px;" onclick="showToast('Pedido ${o.id} atualizado!')">Ver</button>
        <button style="background:var(--laranja-pale);color:var(--laranja);border:none;padding:5px 10px;border-radius:8px;font-size:11px;font-weight:800;cursor:pointer;" onclick="showToast('Status atualizado!')">Editar</button>
      </td>
    </tr>
  `).join('');
}

function renderChart() {
  const data = [1840, 2310, 1950, 2680, 1790, 2450, 3120];
  const labels = ['Seg','Ter','Qua','Qui','Sex','Sáb','Dom'];
  const max = Math.max(...data);
  const barsEl = document.getElementById('chartBars');
  const lblEl = document.getElementById('chartLabels');
  if (!barsEl) return;
  barsEl.innerHTML = data.map((v,i) => `
    <div class="chart-bar-wrap">
      <div style="font-size:10px;font-weight:800;color:var(--rosa);margin-bottom:4px">R$${(v/1000).toFixed(1)}k</div>
      <div class="chart-bar" style="height:${Math.round((v/max)*100)}%;transition-delay:${i*0.1}s"></div>
    </div>
  `).join('');
  lblEl.innerHTML = labels.map(l => `<div style="flex:1;text-align:center;font-size:10px;font-weight:700;color:var(--gray)">${l}</div>`).join('');
}

// ===== STORE MODAL =====
function openStoreModal(id) {
  const s = stores.find(x => x.id===id);
  if (!s) return;
  const el = document.getElementById('storeModalContent');
  el.innerHTML = `
    <div class="store-modal-header">
      <div class="store-modal-avatar">${s.emoji}</div>
      <div class="store-modal-name">${s.name}</div>
      <div class="store-modal-cat">${s.cat.charAt(0).toUpperCase()+s.cat.slice(1)} · ${s.badge}</div>
    </div>
    <div style="margin-top:48px;">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">
        <div>
          <div class="stars" style="font-size:16px">${'★'.repeat(Math.floor(s.rating))} <span style="font-size:14px;color:var(--gray)">${s.rating} (${s.reviews} avaliações)</span></div>
        </div>
        <div class="store-tags">${s.tags.map(t=>`<span class="tag">${t}</span>`).join('')}</div>
      </div>
      <p style="font-size:14px;color:var(--gray);margin-bottom:16px;">${s.desc}</p>
      <div class="store-tabs">
        <button class="store-tab active" onclick="switchStoreTab(this,'products','${s.id}')">Produtos</button>
        <button class="store-tab" onclick="switchStoreTab(this,'reviews','${s.id}')">Avaliações</button>
        <button class="store-tab" onclick="switchStoreTab(this,'info','${s.id}')">Informações</button>
      </div>
      <div id="storeTabContent_${s.id}">
        <div class="store-products-mini">
          ${s.products.map(p=>`
            <div class="store-product-mini" onclick="addToCart({name:'${p.n}',price:'${p.p}',emoji:'${p.e}',store:'${s.name}'},null)">
              <div class="emoji">${p.e}</div>
              <div class="name">${p.n}</div>
              <div class="price">${p.p}</div>
              ${p.old?`<div style="font-size:10px;text-decoration:line-through;color:#bbb">${p.old}</div>`:''}
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  `;
  openModal('modal-store');
}

function switchStoreTab(btn, tab, storeId) {
  btn.parentElement.querySelectorAll('.store-tab').forEach(t=>t.classList.remove('active'));
  btn.classList.add('active');
  const s = stores.find(x=>x.id==storeId);
  const el = document.getElementById('storeTabContent_'+storeId);
  if (tab==='products') {
    el.innerHTML = `<div class="store-products-mini">${s.products.map(p=>`
      <div class="store-product-mini" onclick="addToCart({name:'${p.n}',price:'${p.p}',emoji:'${p.e}',store:'${s.name}'},null)">
        <div class="emoji">${p.e}</div><div class="name">${p.n}</div><div class="price">${p.p}</div>
      </div>`).join('')}</div>`;
  } else if (tab==='reviews') {
    el.innerHTML = s.comments.map(c=>`
      <div class="review-item">
        <div class="review-avatar">${c.u.charAt(0)}</div>
        <div><div class="review-name">${c.u}</div><div class="stars" style="font-size:12px">${'★'.repeat(c.t)}</div><div class="review-text">${c.c}</div></div>
      </div>`).join('');
  } else {
    el.innerHTML = `
      <div style="font-size:14px;color:var(--gray);line-height:1.8">
        <p><strong>📍 Categoria:</strong> ${s.cat}</p>
        <p><strong>⭐ Avaliação:</strong> ${s.rating}/5</p>
        <p><strong>📦 Produtos:</strong> ${s.products.length} disponíveis</p>
        <p><strong>🚚 Entrega:</strong> 1-3 dias úteis</p>
        <p><strong>💳 Pagamento:</strong> Pix, Cartão, Boleto</p>
        <p><strong>🔒 Loja:</strong> ${s.badge}</p>
      </div>`;
  }
}

// ===== CART =====
function addToCart(product, btn) {
  const existing = cartItems.find(i=>i.name===product.name);
  if (existing) {
    existing.qty++;
  } else {
    cartItems.push({ ...product, qty:1 });
  }
  updateCart();
  showToast('🛒 ' + product.name + ' adicionado!');
  if (btn) { btn.classList.add('added'); setTimeout(()=>btn.classList.remove('added'),400); }
}

function updateCart() {
  const count = cartItems.reduce((a,i)=>a+i.qty,0);
  document.getElementById('cartCount').textContent = count;
  const el = document.getElementById('cartItems');
  if (cartItems.length===0) {
    el.innerHTML = '<div style="text-align:center;padding:60px 20px;color:var(--gray);"><i class="fas fa-shopping-bag" style="font-size:48px;margin-bottom:12px;opacity:0.3;display:block;"></i><p style="font-weight:700;">Carrinho vazio</p></div>';
  } else {
    el.innerHTML = cartItems.map((item,i) => `
      <div class="cart-item">
        <div class="cart-item-img">${item.emoji||'📦'}</div>
        <div class="cart-item-info">
          <div class="cart-item-name">${item.name}</div>
          <div style="font-size:11px;color:var(--gray)">${item.store||''}</div>
          <div class="cart-item-price">${item.price}</div>
          <div class="cart-qty">
            <button class="qty-btn" onclick="changeQty(${i},-1)">−</button>
            <span>${item.qty}</span>
            <button class="qty-btn" onclick="changeQty(${i},1)">+</button>
            <button onclick="removeItem(${i})" style="margin-left:auto;background:none;border:none;cursor:pointer;color:#dc2626;font-size:13px;"><i class="fas fa-trash"></i></button>
          </div>
        </div>
      </div>
    `).join('');
  }
  const total = cartItems.reduce((a,i)=>a+parseFloat(i.price.replace('R$','').replace(',','.'))*i.qty,0);
  document.getElementById('cartTotal').textContent = 'R$ ' + total.toFixed(2).replace('.',',');
}

function changeQty(i, delta) {
  cartItems[i].qty += delta;
  if (cartItems[i].qty <= 0) cartItems.splice(i,1);
  updateCart();
}

function removeItem(i) { cartItems.splice(i,1); updateCart(); }

function toggleCart() {
  const panel = document.getElementById('cartPanel');
  const overlay = document.getElementById('cartOverlay');
  panel.classList.toggle('open');
  overlay.classList.toggle('open');
}

function applyCoupon() {
  const val = document.getElementById('couponField').value.toUpperCase();
  const valid = coupons.find(c=>c.code===val);
  if (valid) {
    showToast('✅ Cupom ' + val + ' aplicado! ' + valid.desc);
  } else {
    showToast('❌ Cupom inválido ou expirado.');
  }
}

function checkout() {
  if (cartItems.length===0) { showToast('Seu carrinho está vazio!'); return; }
  cartItems = [];
  updateCart();
  toggleCart();
  showToast('🎉 Pedido realizado com sucesso! Obrigado pela compra!');
}

// ===== UI =====
function openModal(id) { document.getElementById(id).classList.add('open'); }
function closeModal(id) { document.getElementById(id).classList.remove('open'); }

document.querySelectorAll('.modal-overlay').forEach(el => {
  el.addEventListener('click', function(e) {
    if (e.target===this) this.classList.remove('open');
  });
});

function toggleMenu() {
  document.getElementById('menuPanel').classList.toggle('open');
  document.getElementById('menuOverlay').classList.toggle('open');
}

function showToast(msg) {
  const t = document.getElementById('toast');
  document.getElementById('toastMsg').textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 3000);
}

function selectType(type) {
  document.getElementById('typeComprador').classList.toggle('selected', type==='comprador');
  document.getElementById('typeVendedor').classList.toggle('selected', type==='vendedor');
  document.getElementById('vendedorFields').style.display = type==='vendedor' ? 'block' : 'none';
}

function copyCoupon(code) {
  navigator.clipboard.writeText(code).catch(()=>{});
  showToast('✅ Cupom ' + code + ' copiado!');
}

function scrollToTop() { window.scrollTo({top:0,behavior:'smooth'}); }

// ===== TABS =====
function showTab(tab) {
  document.querySelectorAll('.tab-content').forEach(el=>el.classList.remove('active'));
  document.querySelectorAll('.main-tab').forEach(el=>el.classList.remove('active'));
  const el = document.getElementById('tab-'+tab);
  if (el) el.classList.add('active');
  const tabs = document.querySelectorAll('.main-tab');
  tabs.forEach(t => {
    if (t.textContent.toLowerCase().includes(tab.toLowerCase().replace('logistica','logíst'))) t.classList.add('active');
  });
  if (tab==='mapa') initMap();
  if (tab==='logistica') { renderChart(); renderOrders(); }
  currentTab = tab;
  window.scrollTo({top:0,behavior:'smooth'});
}

// ===== FILTER =====
function filterCat(cat, btn, switchTab) {
  if (btn) {
    document.querySelectorAll('.nav-cat').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
  }
  const list = cat==='todos' ? stores : stores.filter(s=>s.cat===cat);
  renderStores(list, 'storesAll');
  const info = document.getElementById('storeFilterInfo');
  if (info) info.textContent = cat==='todos' ? `Mostrando todas as ${stores.length} lojas` : `${list.length} lojas em "${cat}"`;
  if (switchTab) showTab('lojas');
  document.querySelectorAll('.cat-card').forEach(c=>c.classList.remove('active'));
}

// ===== SEARCH =====
function handleSearch(val) {}
function doSearch() {
  const q = document.getElementById('searchInput').value.toLowerCase();
  if (!q) return;
  const filtered = stores.filter(s => s.name.toLowerCase().includes(q) || s.cat.toLowerCase().includes(q) || s.tags.some(t=>t.toLowerCase().includes(q)));
  renderStores(filtered, 'storesAll');
  showTab('lojas');
  const info = document.getElementById('storeFilterInfo');
  if (info) info.textContent = `${filtered.length} resultado(s) para "${q}"`;
}

document.getElementById('searchInput').addEventListener('keypress', e => { if (e.key==='Enter') doSearch(); });

// ===== MAP =====
function initMap() {
  if (mapInstance) return;
  setTimeout(() => {
    mapInstance = L.map('map').setView([-21.1767, -47.8208], 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '© OpenStreetMap contributors' }).addTo(mapInstance);
    const markerStyle = color => `<div style="background:${color};width:36px;height:36px;border-radius:50%;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;font-size:16px;">`;
    const positions = [
      [-21.175, -47.820, '💻', 'TechZone BR', '#FF6B9D'],
      [-21.178, -47.825, '💊', 'FarmaVida', '#FF8C42'],
      [-21.182, -47.815, '🍰', 'Sabor da Vó', '#FFD166'],
      [-21.170, -47.830, '👗', 'ModaFácil', '#FF6B9D'],
      [-21.185, -47.812, '💄', 'Bela & Cia', '#FF8C42'],
      [-21.173, -47.818, '🐾', 'PetAmor', '#FFD166'],
    ];
    positions.forEach(([lat,lng,emoji,name,color]) => {
      const icon = L.divIcon({ html: `<div style="background:${color};width:40px;height:40px;border-radius:50%;border:3px solid white;box-shadow:0 3px 10px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;font-size:20px;">${emoji}</div>`, className:'', iconSize:[40,40], iconAnchor:[20,20] });
      L.marker([lat,lng],{icon}).addTo(mapInstance).bindPopup(`<b>${name}</b><br>Clique para ver loja`);
    });
  }, 200);
}

function locateUser() {
  if (!mapInstance) return;
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(pos => {
      mapInstance.setView([pos.coords.latitude, pos.coords.longitude], 14);
      showToast('📍 Localização encontrada!');
    }, () => {
      showToast('Não foi possível obter sua localização.');
    });
  }
}

// ===== INIT =====
renderStores(stores.slice(0,6), 'storesHome');
renderStores(stores, 'storesAll');
renderProducts(products.slice(0,8), 'productsHome');
renderProducts(products, 'productsAll');
renderCoupons();
renderOrders();
renderChart();
updateCart();
