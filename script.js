/* ═══════════════════════════════════════════
   BANCO DE DADOS GLOBAL (Supabase — via fetch puro,
   sem SDK externo, para não interferir no resto do JS)
   ═══════════════════════════════════════════
   Isso é o que faz o cadastro de lojas/produtos valer
   para QUALQUER pessoa no mundo, e não só para o
   navegador de quem cadastrou.

   COMO ATIVAR (grátis, leva ~3 minutos):
   1. Acesse https://supabase.com e crie uma conta/projeto
      gratuito (fica pronto em ~2 min).
   2. No menu lateral do projeto, vá em "SQL Editor" →
      "New query", cole o SQL abaixo e clique em "Run":

      create table if not exists users (
        email text primary key,
        data jsonb not null,
        updated_at timestamptz default now()
      );
      create table if not exists stores (
        owner_email text primary key,
        data jsonb not null,
        updated_at timestamptz default now()
      );
      alter table users enable row level security;
      alter table stores enable row level security;
      create policy "public read users"   on users  for select using (true);
      create policy "public write users"  on users  for insert with check (true);
      create policy "public update users" on users  for update using (true);
      create policy "public read stores"   on stores for select using (true);
      create policy "public write stores"  on stores for insert with check (true);
      create policy "public update stores" on stores for update using (true);

   3. Vá em "Project Settings" (ícone de engrenagem) → "API".
   4. Copie o "Project URL" e a chave "anon public".
   5. Cole os dois valores no objeto DB_CONFIG logo abaixo,
      substituindo os textos "COLE_AQUI_...".
   6. Salve e recarregue a página — pronto, o cadastro de
      lojas passa a ser global (todo mundo vê as lojas de
      todo mundo, atualizado automaticamente a cada 30s).

   Enquanto isso não for configurado, o site continua
   funcionando normalmente, só que cada cadastro fica salvo
   apenas no navegador de quem cadastrou (modo local).

   Se algo der errado aqui (chave errada, sem internet etc.),
   o resto do site continua funcionando normalmente — todo
   este bloco é protegido com try/catch.
═══════════════════════════════════════════ */
const DB_CONFIG = {
  url: "https://pvyjpdhwungounbocwel.supabase.co",     // ex: https://xxxxxxxx.supabase.co
  key: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB2eWpwZGh3dW5nb3VuYm9jd2VsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODcwMTQyMDMsImV4cCI6MjEwMjU5MDIwM30.8WR9BPZ08gKAlK9ymvp6TeErNlW6hkmk1kj2gSvC6KA"     // Project Settings → API → anon public
};

let dbGlobalOK = false;
let globalSyncInterval = null;

function initGlobalDB() {
  try {
    if (!DB_CONFIG.url || DB_CONFIG.url.indexOf('https://pvyjpdhwungounbocwel.supabase.co') === 0 ||
        !DB_CONFIG.key || DB_CONFIG.key.indexOf('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB2eWpwZGh3dW5nb3VuYm9jd2VsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODcwMTQyMDMsImV4cCI6MjEwMjU5MDIwM30.8WR9BPZ08gKAlK9ymvp6TeErNlW6hkmk1kj2gSvC6KA') === 0) {
      console.warn('⚠️ Banco global não configurado ainda. Veja as instruções no topo do script.js.');
      dbGlobalOK = false;
      return false;
    }
    dbGlobalOK = true;
    return true;
  } catch (e) {
    console.error('Erro ao iniciar o banco global:', e);
    dbGlobalOK = false;
    return false;
  }
}

function dbHeaders(extra) {
  return Object.assign({
    'apikey': DB_CONFIG.key,
    'Authorization': 'Bearer ' + DB_CONFIG.key,
    'Content-Type': 'application/json'
  }, extra || {});
}

async function dbGlobalUpsert(table, row) {
  try {
    const res = await fetch(DB_CONFIG.url + '/rest/v1/' + table, {
      method: 'POST',
      headers: dbHeaders({ 'Prefer': 'resolution=merge-duplicates' }),
      body: JSON.stringify([row])
    });
    if (!res.ok) { console.error('Erro ao salvar no banco global (' + table + '):', await res.text()); return false; }
    return true;
  } catch (e) { console.error('Erro de rede no banco global:', e); return false; }
}

async function dbGlobalGet(table, filterCol, filterVal) {
  try {
    const url = DB_CONFIG.url + '/rest/v1/' + table + '?' + filterCol + '=eq.' + encodeURIComponent(filterVal) + '&select=data';
    const res = await fetch(url, { headers: dbHeaders() });
    if (!res.ok) { console.error('Erro ao ler banco global:', await res.text()); return null; }
    const rows = await res.json();
    return rows.length ? rows[0].data : null;
  } catch (e) { console.error('Erro de rede no banco global:', e); return null; }
}

async function dbGlobalGetAll(table) {
  try {
    const res = await fetch(DB_CONFIG.url + '/rest/v1/' + table + '?select=data', { headers: dbHeaders() });
    if (!res.ok) { console.error('Erro ao listar banco global:', await res.text()); return []; }
    const rows = await res.json();
    return rows.map(r => r.data);
  } catch (e) { console.error('Erro de rede no banco global:', e); return []; }
}

// Busca periodicamente as lojas cadastradas por qualquer pessoa, em qualquer lugar do
// mundo, e mantém o catálogo do site sincronizado automaticamente (a cada 30 segundos).
function startGlobalSync() {
  if (!dbGlobalOK || globalSyncInterval) return;
  globalSyncInterval = setInterval(async () => {
    try {
      const globalStores = await dbGlobalGetAll('stores');
      mergeGlobalStoresIntoCatalog(globalStores);
    } catch (e) { console.error('Erro ao sincronizar lojas globais:', e); }
  }, 30000);
}

// Insere/atualiza no catálogo em memória as lojas vindas do banco global
function mergeGlobalStoresIntoCatalog(storeRecords) {
  storeRecords.forEach(rec => {
    if (!rec || !rec.ownerEmail) return;
    const idx = stores.findIndex(s => s.ownerEmail === rec.ownerEmail);
    const storeId = idx >= 0 ? stores[idx].id : Math.max(0, ...stores.map(s => s.id)) + 1;
    if (idx >= 0) stores.splice(idx, 1);
    for (let i = products.length - 1; i >= 0; i--) {
      if (products[i].ownerEmail === rec.ownerEmail) products.splice(i, 1);
    }

    stores.push({
      id: storeId, ownerEmail: rec.ownerEmail, name: rec.name, cat: rec.cat, emoji: rec.emoji,
      cover: 'https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=400&h=120&fit=crop',
      rating: 5.0, reviews: 0, badge: '🌍 Global', tags: [],
      desc: rec.desc || ('Loja de ' + rec.name),
      products: (rec.products || []).map(p => ({ n: p.name, p: fmtPrice(p.price), e: p.emoji, old: '' })),
      comments: []
    });
    (rec.products || []).forEach(p => {
      const newId = Math.max(0, ...products.map(x => x.id)) + 1;
      products.push({
        id: newId, name: p.name, price: p.price, emoji: p.emoji, store: rec.name,
        cat: rec.cat, discount: '', old: 0, desc: p.desc, ownerEmail: rec.ownerEmail
      });
    });
  });

  renderStores(stores.slice(0, 6), 'storesHome');
  renderStores(stores, 'storesAll');
  renderProducts(products.slice(0, 8), 'productsHome');
  renderProducts(products, 'productsAll');
}

/* ═══════════════════════════════════════════
   INDEXEDDB — Cache/fallback local no browser
   Usado quando o banco global não está configurado,
   e como cache rápido de sessão/usuário.
═══════════════════════════════════════════ */
const DB_NAME = 'MercadoFacilDB';
const DB_VERSION = 2;
let db = null;

function initDB() {
  return new Promise((resolve, reject) => {
    if (!window.indexedDB) {
      console.warn('IndexedDB não suportado, usando fallback em memória.');
      resolve(null); return;
    }
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = e => {
      const d = e.target.result;
      // store de usuários: chave = email
      if (!d.objectStoreNames.contains('users')) {
        const us = d.createObjectStore('users', { keyPath: 'email' });
        us.createIndex('email', 'email', { unique: true });
      }
      // store de sessão: chave fixa 'session'
      if (!d.objectStoreNames.contains('session')) {
        d.createObjectStore('session', { keyPath: 'id' });
      }
      // store das lojas/produtos cadastrados pelos vendedores: chave = e-mail do dono
      if (!d.objectStoreNames.contains('stores')) {
        d.createObjectStore('stores', { keyPath: 'ownerEmail' });
      }
    };
    req.onsuccess = e => { db = e.target.result; resolve(db); };
    req.onerror   = e => { console.error('DB error', e); resolve(null); };
  });
}

// ── Helpers genéricos ──
function dbPut(store, data)   { return new Promise((res,rej)=>{ if(!db){res();return;} const tx=db.transaction(store,'readwrite'); tx.objectStore(store).put(data).onsuccess=()=>res(); tx.onerror=rej; }); }
function dbGet(store, key)    { return new Promise((res,rej)=>{ if(!db){res(null);return;} const tx=db.transaction(store,'readonly'); const r=tx.objectStore(store).get(key); r.onsuccess=()=>res(r.result||null); r.onerror=rej; }); }
function dbDelete(store, key) { return new Promise((res,rej)=>{ if(!db){res();return;} const tx=db.transaction(store,'readwrite'); tx.objectStore(store).delete(key).onsuccess=()=>res(); tx.onerror=rej; }); }
function dbGetAll(store)      { return new Promise((res,rej)=>{ if(!db){res([]);return;} const tx=db.transaction(store,'readonly'); const r=tx.objectStore(store).getAll(); r.onsuccess=()=>res(r.result||[]); r.onerror=rej; }); }

// ── Auth API (global via Supabase, com cache local em IndexedDB) ──
async function dbSaveUser(user) {
  // Nunca salvar a senha em texto puro numa app real — aqui é simulação educacional
  await dbPut('users', user); // cache local, funciona offline
  if (dbGlobalOK) await dbGlobalUpsert('users', { email: user.email, data: user });
}
async function dbGetUser(email) {
  if (dbGlobalOK) {
    const data = await dbGlobalGet('users', 'email', email);
    if (data) { await dbPut('users', data); return data; }
  }
  return dbGet('users', email);
}
async function dbCheckEmail(email) { return !!(await dbGetUser(email)); }
// A sessão (quem está logado NESTE navegador) permanece local — não faz sentido ser global.
async function dbSaveSession(user) { await dbPut('session', { id: 'session', email: user.email }); }
async function dbGetSession()      { return dbGet('session', 'session'); }
async function dbClearSession()    { return dbDelete('session', 'session'); }

// ── Lojas/produtos dos vendedores (globais — visíveis para o mundo todo) ──
async function dbSaveStore(storeRecord) {
  await dbPut('stores', storeRecord); // cache local imediato
  if (dbGlobalOK) {
    const ok = await dbGlobalUpsert('stores', { owner_email: storeRecord.ownerEmail, data: storeRecord });
    if (!ok) showToast('Loja salva neste navegador, mas houve um erro ao publicar globalmente. Verifique sua conexão.', 'error');
  }
}
async function dbGetStoreByOwner(email) {
  if (dbGlobalOK) {
    const data = await dbGlobalGet('stores', 'owner_email', email);
    if (data) return data;
  }
  return dbGet('stores', email);
}
async function dbGetAllStores() {
  if (dbGlobalOK) return dbGlobalGetAll('stores');
  return dbGetAll('stores');
}

// ── Flash DB pill ──
function flashDB(msg) {
  const pill = document.getElementById('dbPill');
  document.getElementById('dbPillMsg').textContent = msg;
  pill.classList.add('show');
  setTimeout(() => pill.classList.remove('show'), 2600);
}

/* ═══════════════════════════════════════════
   STATE
═══════════════════════════════════════════ */
let currentUser = null;
let cartItems   = [];
let appliedCoupon = null;  // { code, type, value, desc }
let mapInstance = null;
let vendorMarkers = {};    // email -> L.marker, evita duplicar pin no mapa

// Emoji do pin no mapa de acordo com a categoria escolhida no cadastro
const CAT_EMOJI = {
  'Tecnologia':'💻','Farmácia':'💊','Alimentação':'🍔','Moda':'👗',
  'Beleza':'💄','Pet Shop':'🐾','Casa':'🏠','Esportes':'⚽','Outro':'🏪'
};
const CAT_COLOR = {
  'Tecnologia':'#FF6B9D','Farmácia':'#FF8C42','Alimentação':'#FFD166','Moda':'#FF6B9D',
  'Beleza':'#FF8C42','Pet Shop':'#FFD166','Casa':'#FF6B9D','Esportes':'#FF8C42','Outro':'#FFD166'
};

/* ═══════════════════════════════════════════
   STATIC DATA
═══════════════════════════════════════════ */
const stores = [
  {id:1,name:'TechZone BR',cat:'tecnologia',emoji:'💻',cover:'https://images.unsplash.com/photo-1518770660439-4636190af475?w=400&h=120&fit=crop',rating:4.9,reviews:312,badge:'🏆 Top',tags:['Eletrônicos','Gadgets','Acessórios'],desc:'Especializada em gadgets e eletrônicos para o dia a dia.',products:[{n:'Fone Bluetooth',p:'R$189',e:'🎧',old:'R$249'},{n:'Mouse Gamer',p:'R$139',e:'🖱️',old:'R$199'},{n:'Webcam HD',p:'R$229',e:'📷',old:'R$299'}],comments:[{u:'Maria S.',t:5,c:'Produtos incríveis e entrega rápida!'},{u:'João P.',t:5,c:'Melhor loja de tecnologia da plataforma.'}]},
  {id:2,name:'FarmaVida',cat:'farmacia',emoji:'💊',cover:'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=400&h=120&fit=crop',rating:4.8,reviews:198,badge:'✅ Verificado',tags:['Medicamentos','Vitaminas','Higiene'],desc:'Farmácia com produtos de saúde e bem-estar.',products:[{n:'Vitamina C 1g',p:'R$29',e:'🍊',old:'R$39'},{n:'Protetor Solar',p:'R$45',e:'🧴',old:'R$65'},{n:'Termômetro',p:'R$35',e:'🌡️',old:'R$49'}],comments:[{u:'Ana R.',t:5,c:'Medicamentos de qualidade e preço justo!'},{u:'Carlos M.',t:4,c:'Bom atendimento e entrega pontual.'}]},
  {id:3,name:'Sabor da Vó',cat:'alimentacao',emoji:'🍰',cover:'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=400&h=120&fit=crop',rating:5.0,reviews:547,badge:'⭐ Favorito',tags:['Doces','Salgados','Artesanal'],desc:'Comida artesanal feita com amor e ingredientes frescos.',products:[{n:'Bolo de Cenoura',p:'R$30',e:'🥕',old:''},{n:'Coxinhas 12un',p:'R$38',e:'🍗',old:''},{n:'Pão de Queijo',p:'R$28',e:'🧀',old:'R$35'}],comments:[{u:'Lucia F.',t:5,c:'Incrível! Bolo perfeito!'},{u:'Rafael T.',t:5,c:'Melhor comida artesanal!'}]},
  {id:4,name:'ModaFácil',cat:'moda',emoji:'👗',cover:'https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=400&h=120&fit=crop',rating:4.7,reviews:203,badge:'🆕 Novo',tags:['Roupas','Acessórios','Plus Size'],desc:'Moda para todos os estilos e tamanhos.',products:[{n:'Vestido Floral',p:'R$89',e:'👗',old:'R$129'},{n:'Bolsa Tote',p:'R$79',e:'👜',old:'R$109'},{n:'Óculos de Sol',p:'R$59',e:'🕶️',old:''}],comments:[{u:'Fernanda L.',t:5,c:'Roupas lindas e tamanhos inclusivos!'},{u:'Bruna S.',t:4,c:'Boa qualidade pelo preço.'}]},
  {id:5,name:'Bela & Cia',cat:'beleza',emoji:'💄',cover:'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=400&h=120&fit=crop',rating:4.8,reviews:421,badge:'🌸 Premium',tags:['Maquiagem','Skincare','Cabelos'],desc:'Beleza e autocuidado para você brilhar.',products:[{n:'Batom Matte',p:'R$35',e:'💄',old:'R$49'},{n:'Sérum Facial',p:'R$129',e:'✨',old:'R$179'},{n:'Paleta Sombras',p:'R$89',e:'🎨',old:'R$119'}],comments:[{u:'Camila R.',t:5,c:'Produtos incríveis! Minha pele agradece!'},{u:'Isabella M.',t:5,c:'Maquiagem de longa duração.'}]},
  {id:6,name:'PetAmor',cat:'pets',emoji:'🐾',cover:'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400&h=120&fit=crop',rating:4.9,reviews:189,badge:'🐶 Especialista',tags:['Rações','Brinquedos','Acessórios'],desc:'Tudo para o bem-estar e felicidade do seu pet.',products:[{n:'Ração Premium 10kg',p:'R$189',e:'🐕',old:'R$239'},{n:'Arranhador Gato',p:'R$149',e:'🐈',old:''},{n:'Coleira LED',p:'R$45',e:'💡',old:'R$69'}],comments:[{u:'Pedro A.',t:5,c:'Meu cachorro ama a ração daqui!'},{u:'Sandra B.',t:5,c:'Excelente qualidade!'}]},
];

const products = [
  {id:1,name:'Fone Bluetooth Pro',price:189,emoji:'🎧',store:'TechZone BR',cat:'tecnologia',discount:'-24%',old:249,desc:'Fone Bluetooth 5.0 com cancelamento de ruído, 30h de bateria e microfone embutido.'},
  {id:2,name:'Mouse Gamer RGB',price:139,emoji:'🖱️',store:'TechZone BR',cat:'tecnologia',discount:'-30%',old:199,desc:'Mouse gamer 7200 DPI, iluminação RGB e 6 botões programáveis. Design ergonômico.'},
  {id:3,name:'Vitamina C 1g',price:29,emoji:'🍊',store:'FarmaVida',cat:'farmacia',discount:'-25%',old:39,desc:'Vitamina C efervescente 1000mg sabor laranja. Fortalece a imunidade. Caixa c/ 10.'},
  {id:4,name:'Bolo de Cenoura 1kg',price:30,emoji:'🥕',store:'Sabor da Vó',cat:'alimentacao',discount:'',old:0,desc:'Bolo de cenoura artesanal com cobertura de chocolate belga. Sem conservantes.'},
  {id:5,name:'Vestido Floral M',price:89,emoji:'👗',store:'ModaFácil',cat:'moda',discount:'-31%',old:129,desc:'Vestido floral manga longa, tecido leve. Disponível nos tamanhos P ao G3.'},
  {id:6,name:'Sérum Facial 30ml',price:129,emoji:'✨',store:'Bela & Cia',cat:'beleza',discount:'-28%',old:179,desc:'Sérum com vitamina C e ácido hialurônico para pele iluminada e hidratada.'},
  {id:7,name:'Ração Premium 10kg',price:189,emoji:'🐕',store:'PetAmor',cat:'pets',discount:'-21%',old:239,desc:'Ração para cães adultos com frango e arroz. Sem corantes artificiais.'},
  {id:8,name:'Webcam HD 1080p',price:229,emoji:'📷',store:'TechZone BR',cat:'tecnologia',discount:'-23%',old:299,desc:'Webcam Full HD com microfone embutido, ajuste automático de luz. Plug and Play.'},
  {id:9,name:'Protetor Solar FPS60',price:45,emoji:'🧴',store:'FarmaVida',cat:'farmacia',discount:'-30%',old:65,desc:'Protetor solar FPS 60 textura fluida, não oleosa. Resistente à água e suor.'},
  {id:10,name:'Coxinhas Artesanais 12un',price:38,emoji:'🍗',store:'Sabor da Vó',cat:'alimentacao',discount:'',old:0,desc:'Coxinhas artesanais com massa fina e recheio de frango e catupiry. Feitas na hora.'},
];

// ── CUPONS: type = 'percent' | 'fixed' | 'frete' ──
const coupons = [
  { code:'BEMVINDO20', desc:'20% OFF em toda a compra',         type:'percent', value:20,  expiry:'31/12/2025', color:'var(--rosa)',    minOrder:0    },
  { code:'FRETEFACIL', desc:'Frete grátis (desconto de R$15)',  type:'fixed',   value:15,  expiry:'31/01/2026', color:'var(--laranja)', minOrder:99   },
  { code:'SAUDE10',    desc:'10% OFF em Farmácia',              type:'percent', value:10,  expiry:'28/02/2026', color:'#10b981',        minOrder:0    },
  { code:'TECH15',     desc:'15% OFF em Tecnologia',            type:'percent', value:15,  expiry:'15/01/2026', color:'#2563eb',        minOrder:0    },
  { code:'PET25',      desc:'25% OFF em Pet Shop',              type:'percent', value:25,  expiry:'28/02/2026', color:'#7c3aed',        minOrder:0    },
  { code:'VALE50',     desc:'R$ 50 OFF acima de R$ 200',        type:'fixed',   value:50,  expiry:'31/03/2026', color:'#c2410c',        minOrder:200  },
];

const orders = [
  {id:'#001234',client:'Maria Silva',product:'Fone Bluetooth',val:'R$189',status:'pago',date:'10/01/2025',qty:1,pay:'Pix',addr:'Rua das Flores, 120 — Franca/SP',store:'TechZone BR'},
  {id:'#001235',client:'João Pereira',product:'Vitamina C 1g',val:'R$29',status:'enviado',date:'11/01/2025',qty:2,pay:'Cartão de Crédito',addr:'Av. Brasil, 890 — Franca/SP',store:'FarmaVida'},
  {id:'#001236',client:'Ana Souza',product:'Bolo de Cenoura',val:'R$30',status:'pendente',date:'12/01/2025',qty:1,pay:'Boleto',addr:'Rua 7 de Setembro, 45 — Franca/SP',store:'Sabor da Vó'},
  {id:'#001237',client:'Carlos Lima',product:'Vestido Floral',val:'R$89',status:'pago',date:'12/01/2025',qty:1,pay:'Pix',addr:'Rua Minas Gerais, 310 — Franca/SP',store:'ModaFácil'},
  {id:'#001238',client:'Fernanda Costa',product:'Sérum Facial',val:'R$129',status:'enviado',date:'13/01/2025',qty:1,pay:'Cartão de Crédito',addr:'Rua Paraná, 77 — Franca/SP',store:'Bela & Cia'},
  {id:'#001239',client:'Ricardo Alves',product:'Ração Premium',val:'R$189',status:'cancelado',date:'13/01/2025',qty:1,pay:'Pix',addr:'Rua Bahia, 512 — Franca/SP',store:'PetAmor'},
];

/* ═══════════════════════════════════════════
   AUTH
═══════════════════════════════════════════ */
async function doRegister() {
  const name  = document.getElementById('regName').value.trim();
  const email = document.getElementById('regEmail').value.trim().toLowerCase();
  const pass  = document.getElementById('regPassword').value;
  let ok = true;
  ['regNameErr','regEmailErr','regPassErr'].forEach(id => document.getElementById(id).classList.remove('show'));
  if (!name)                   { document.getElementById('regNameErr').classList.add('show'); ok=false; }
  if (!email||!email.includes('@')) { document.getElementById('regEmailErr').textContent='E-mail inválido.'; document.getElementById('regEmailErr').classList.add('show'); ok=false; }
  if (ok && await dbCheckEmail(email)) { document.getElementById('regEmailErr').textContent='E-mail já cadastrado.'; document.getElementById('regEmailErr').classList.add('show'); ok=false; }
  if (pass.length < 6)         { document.getElementById('regPassErr').classList.add('show'); ok=false; }
  if (!ok) return;

  const type      = document.getElementById('typeVendedor').classList.contains('selected') ? 'vendedor' : 'comprador';
  const storeName = document.getElementById('regStore')?.value||'';
  const doc       = document.getElementById('regDoc')?.value||'';
  const catSel    = document.getElementById('regCat')?.value||'';
  const user = { email, name, password:pass, type, avatar:name.charAt(0).toUpperCase(), storeName, doc, catSel, createdAt: new Date().toISOString() };

  // Se for vendedor, tenta capturar a localização para posicionar a loja no mapa
  if (type === 'vendedor') {
    user.lat = null;
    user.lng = null;
    try { await geolocateStore(user); } catch(e) { /* segue sem coordenadas exatas */ }
  }

  await dbSaveUser(user);
  await dbSaveSession(user);
  flashDB('Usuário salvo no IndexedDB ✓');

  closeModal('modal-register');
  loginUser(user);

  if (type === 'vendedor') {
    addStoreToMap(user);
    showToast('🎉 Conta criada! Falta pouco: cadastre sua loja e produtos.','success');
    setTimeout(() => openStoreSetupModal(), 500);
  } else {
    showToast('🎉 Conta criada! Bem-vindo(a), '+name.split(' ')[0]+'!','success');
  }
}

// Tenta obter a localização do navegador para posicionar o pin da loja.
// Se o usuário negar ou não houver suporte, usa uma posição próxima ao centro do mapa.
function geolocateStore(user) {
  return new Promise(resolve => {
    if (!navigator.geolocation) { setFallbackLocation(user); resolve(); return; }
    navigator.geolocation.getCurrentPosition(
      pos => { user.lat = pos.coords.latitude; user.lng = pos.coords.longitude; resolve(); },
      ()  => { setFallbackLocation(user); resolve(); },
      { timeout: 4000 }
    );
  });
}
function setFallbackLocation(user) {
  const baseLat = -21.1767, baseLng = -47.8208;
  user.lat = baseLat + (Math.random()-0.5)*0.02;
  user.lng = baseLng + (Math.random()-0.5)*0.02;
}

async function doLogin() {
  const email = document.getElementById('loginEmail').value.trim().toLowerCase();
  const pass  = document.getElementById('loginPassword').value;
  document.getElementById('loginEmailErr').classList.remove('show');
  document.getElementById('loginPassErr').classList.remove('show');

  const user = await dbGetUser(email);
  if (!user) { document.getElementById('loginEmailErr').classList.add('show'); return; }
  if (user.password !== pass) { document.getElementById('loginPassErr').classList.add('show'); return; }

  await dbSaveSession(user);
  flashDB('Sessão restaurada do IndexedDB ✓');
  closeModal('modal-login');
  loginUser(user);
  showToast('✅ Olá, '+user.name.split(' ')[0]+'! Login realizado.','success');
}

function loginUser(user) {
  currentUser = user;
  document.getElementById('authButtons').style.display = 'none';
  document.getElementById('userChip').classList.add('visible');
  document.getElementById('userAvatarSm').textContent = user.avatar;
  document.getElementById('userChipName').textContent = user.name.split(' ')[0];
  document.getElementById('menuLoginItem').style.display    = 'none';
  document.getElementById('menuRegisterItem').style.display = 'none';
  document.getElementById('menuLogoutItem').style.display   = 'flex';
  updatePedidosTab();
  updateUIForUserType();
}

async function doLogout() {
  await dbClearSession();
  currentUser = null;
  document.getElementById('authButtons').style.display = 'flex';
  document.getElementById('userChip').classList.remove('visible');
  document.getElementById('menuLoginItem').style.display    = 'flex';
  document.getElementById('menuRegisterItem').style.display = 'flex';
  document.getElementById('menuLogoutItem').style.display   = 'none';
  updatePedidosTab();
  updateUIForUserType();
  const logisticaTab = document.getElementById('tab-logistica');
  if (logisticaTab && logisticaTab.classList.contains('active')) { showTab('inicio'); }
  showToast('👋 Você saiu da conta.','info');
}

function openUserMenu() {
  if (!currentUser) return;
  const u = currentUser;
  document.getElementById('userMenuContent').innerHTML = `
    <div style="text-align:center;margin-bottom:20px;">
      <div style="width:64px;height:64px;border-radius:50%;background:var(--grad1);display:flex;align-items:center;justify-content:center;font-size:28px;font-weight:900;color:white;margin:0 auto 10px;">${u.avatar}</div>
      <h3 style="font-size:17px;font-weight:900;">${u.name}</h3>
      <p style="font-size:12px;color:var(--gray);margin-bottom:6px;">${u.email}</p>
      <span style="background:var(--rosa-pale);color:var(--rosa);border-radius:20px;padding:3px 12px;font-size:11px;font-weight:800;">${u.type==='vendedor'?'🏪 Vendedor':'🛒 Comprador'}</span>
    </div>
    ${u.type==='vendedor'?`<div style="background:var(--gray-light);border-radius:12px;padding:12px;margin-bottom:14px;text-align:center;"><p style="font-size:10px;color:var(--gray);">Loja</p><p style="font-weight:800;font-size:14px;">${u.storeName||u.name+' Store'}</p><p style="font-size:10px;color:var(--gray);">CNPJ/MEI: ${u.doc||'—'}</p></div>`:''}
    <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:10px 12px;margin-bottom:14px;font-size:11px;font-weight:700;color:#15803d;display:flex;align-items:center;gap:6px;"><i class="fas fa-database"></i> Dados salvos no IndexedDB</div>
    ${u.type==='vendedor'?`<button class="form-submit" style="margin-bottom:10px;background:var(--grad1);" onclick="closeModal('modal-user');openStoreSetupModal()"><i class="fas fa-store"></i> Cadastrar/Gerenciar Loja e Produtos</button>`:''}
    <button class="form-submit" style="margin-bottom:10px;" onclick="closeModal('modal-user');showTab('pedidos')"><i class="fas fa-box"></i> Meus Pedidos</button>
    <button style="width:100%;background:#fef2f2;color:#dc2626;border:none;padding:12px;border-radius:50px;font-family:'Nunito',sans-serif;font-weight:800;font-size:13px;cursor:pointer;" onclick="closeModal('modal-user');doLogout()"><i class="fas fa-sign-out-alt"></i> Sair da Conta</button>
  `;
  openModal('modal-user');
}

function updatePedidosTab() {
  const el = document.getElementById('pedidosContent');
  if (!currentUser) {
    el.innerHTML = `<h2><i class="fas fa-box-open" style="color:var(--rosa)"></i> Meus Pedidos</h2><div class="empty-state"><span class="big-icon"><i class="fas fa-user-lock"></i></span><h3>Faça login para ver seus pedidos</h3><p>Acompanhe todas as suas compras em tempo real</p><button class="btn btn-primary" style="margin:16px auto 0;display:flex;" onclick="openModal('modal-login')"><i class="fas fa-sign-in-alt"></i> Entrar</button></div>`;
  } else {
    el.innerHTML = `
      <h2><i class="fas fa-box-open" style="color:var(--rosa)"></i> Pedidos — Olá, ${currentUser.name.split(' ')[0]}!</h2>
      <div style="overflow-x:auto;margin-top:8px;">
        <table class="orders-table"><thead><tr><th>Pedido</th><th>Produto</th><th>Valor</th><th>Status</th><th>Data</th></tr></thead>
        <tbody>${orders.map(o=>`<tr><td style="font-weight:800;color:var(--rosa)">${o.id}</td><td>${o.product}</td><td style="font-weight:800">${o.val}</td><td><span class="status-badge status-${o.status}">${o.status.charAt(0).toUpperCase()+o.status.slice(1)}</span></td><td>${o.date}</td></tr>`).join('')}</tbody>
        </table>
      </div>`;
  }
}

/* ═══════════════════════════════════════════
   RENDER
═══════════════════════════════════════════ */
function fmtPrice(n) { return 'R$ '+n.toFixed(2).replace('.',','); }

/* ── CARROSSEL INTERATIVO (página inicial) ── */
const CAROUSEL_SLIDES = 4;
let carouselIndex = 0;
let carouselTimer = null;

function renderCarouselDots() {
  const dotsEl = document.getElementById('carouselDots');
  if (!dotsEl) return;
  dotsEl.innerHTML = '';
  for (let i = 0; i < CAROUSEL_SLIDES; i++) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'carousel-dot' + (i === carouselIndex ? ' active' : '');
    b.setAttribute('aria-label', 'Ir para o slide ' + (i + 1));
    b.onclick = () => carouselGoTo(i);
    dotsEl.appendChild(b);
  }
}

function carouselGoTo(i) {
  carouselIndex = (i + CAROUSEL_SLIDES) % CAROUSEL_SLIDES;
  const track = document.getElementById('carouselTrack');
  if (track) track.style.transform = 'translateX(-' + (carouselIndex * (100 / CAROUSEL_SLIDES)) + '%)';
  renderCarouselDots();
  restartCarouselAutoplay();
}

function carouselMove(dir) { carouselGoTo(carouselIndex + dir); }

function startCarouselAutoplay() {
  carouselTimer = setInterval(() => carouselGoTo(carouselIndex + 1), 5000);
}
function stopCarouselAutoplay() { if (carouselTimer) { clearInterval(carouselTimer); carouselTimer = null; } }
function restartCarouselAutoplay() { stopCarouselAutoplay(); startCarouselAutoplay(); }

function initCarousel() {
  const el = document.getElementById('heroCarousel');
  if (!el) return;
  renderCarouselDots();
  startCarouselAutoplay();

  // Pausa o autoplay enquanto o mouse está sobre o carrossel
  el.addEventListener('mouseenter', stopCarouselAutoplay);
  el.addEventListener('mouseleave', startCarouselAutoplay);

  // Suporte a arrastar/deslizar (swipe) no celular
  let touchStartX = 0;
  el.addEventListener('touchstart', e => { touchStartX = e.touches[0].clientX; }, { passive: true });
  el.addEventListener('touchend', e => {
    const dx = e.changedTouches[0].clientX - touchStartX;
    if (Math.abs(dx) > 40) carouselMove(dx > 0 ? -1 : 1);
  }, { passive: true });
}


function renderStores(list, targetId) {
  const el = document.getElementById(targetId); if (!el) return;
  el.innerHTML = list.map(s => `
    <div class="store-card" onclick="openStoreModal(${s.id})">
      <div class="store-cover">
        <img src="${s.cover}" alt="${s.name}" onerror="this.style.display='none'">
        <span class="store-badge">${s.badge}</span>
        <div class="store-avatar">${s.emoji}</div>
      </div>
      <div class="store-body">
        <div class="store-name">${s.name}</div>
        <div class="store-cat">${s.cat.charAt(0).toUpperCase()+s.cat.slice(1)}</div>
        <div class="stars">${'★'.repeat(Math.floor(s.rating))}${'☆'.repeat(5-Math.floor(s.rating))} <span>${s.rating} (${s.reviews})</span></div>
        <div class="store-tags">${s.tags.map((t,i)=>`<span class="tag ${i===1?'laranja':i===2?'amarelo':''}">${t}</span>`).join('')}</div>
        <div class="store-stats"><span><i class="fas fa-box"></i> ${s.products.length} produtos</span><span><i class="fas fa-star"></i> ${s.rating}/5</span><span><i class="fas fa-comment"></i> ${s.comments.length}</span></div>
      </div>
    </div>`).join('');
}

function renderProducts(list, targetId) {
  const el = document.getElementById(targetId); if (!el) return;
  el.innerHTML = list.map(p => `
    <div class="product-card">
      <div class="product-img">
        ${p.discount?`<span class="product-discount-badge">${p.discount}</span>`:''}
        <span style="font-size:50px;transition:transform .3s;display:block;" onmouseover="this.style.transform='scale(1.2) rotate(5deg)'" onmouseout="this.style.transform=''">${p.emoji}</span>
      </div>
      <div class="product-body">
        <div class="product-title">${p.name}</div>
        <div class="product-store"><i class="fas fa-store" style="color:var(--rosa);font-size:9px"></i> ${p.store}</div>
        <div class="stars" style="font-size:10px">★★★★★</div>
        <div style="display:flex;align-items:baseline;gap:3px;margin-top:3px;">
          <div class="product-price">${fmtPrice(p.price)}</div>
          ${p.old?`<div class="product-price-old">${fmtPrice(p.old)}</div>`:''}
        </div>
        <button class="view-btn" onclick="openProductModal(${p.id})"><i class="fas fa-eye"></i> Ver detalhes</button>
        <button class="add-cart-btn" onclick="addToCart(${p.id},this)"><i class="fas fa-cart-plus"></i> Adicionar</button>
      </div>
    </div>`).join('');
}

/* ═══════════════════════════════════════════
   STORE MODAL
═══════════════════════════════════════════ */
function openStoreModal(id) {
  const s = stores.find(x=>x.id===id); if (!s) return;
  document.getElementById('storeModalContent').innerHTML = `
    <div class="store-modal-top">
      <div class="store-modal-cover"><img src="${s.cover}" alt="${s.name}" onerror="this.parentElement.style.background='var(--grad1)'"></div>
      <div class="store-modal-identity">
        <div class="store-modal-avatar">${s.emoji}</div>
        <div class="store-modal-info"><h2>${s.name}</h2><p>${s.cat.charAt(0).toUpperCase()+s.cat.slice(1)} · ${s.badge}</p></div>
      </div>
    </div>
    <div class="store-modal-body">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;flex-wrap:wrap;gap:6px;">
        <div class="stars" style="font-size:14px">${'★'.repeat(Math.floor(s.rating))} <span>${s.rating} (${s.reviews} avaliações)</span></div>
        <div class="store-tags">${s.tags.map(t=>`<span class="tag">${t}</span>`).join('')}</div>
      </div>
      <p style="font-size:13px;color:var(--gray);margin-bottom:14px;">${s.desc}</p>
      <div class="store-tabs">
        <button class="store-tab active" onclick="switchStoreTab(this,'products',${s.id})">Produtos</button>
        <button class="store-tab" onclick="switchStoreTab(this,'reviews',${s.id})">Avaliações</button>
        <button class="store-tab" onclick="switchStoreTab(this,'info',${s.id})">Informações</button>
      </div>
      <div id="storeTabContent_${s.id}">
        <div class="store-products-mini">${s.products.map((p,idx)=>`
          <div class="store-product-mini" onclick="openMiniProductModal(${s.id},${idx})">
            <div class="emoji">${p.e}</div><div class="sname">${p.n}</div><div class="sprice">${p.p}</div>
            ${p.old?`<div style="font-size:9px;text-decoration:line-through;color:#bbb">${p.old}</div>`:''}
          </div>`).join('')}
        </div>
      </div>
    </div>`;
  openModal('modal-store');
}

function switchStoreTab(btn, tab, storeId) {
  btn.parentElement.querySelectorAll('.store-tab').forEach(t=>t.classList.remove('active'));
  btn.classList.add('active');
  const s  = stores.find(x=>x.id===storeId);
  const el = document.getElementById('storeTabContent_'+storeId);
  if (tab==='products') {
    el.innerHTML = `<div class="store-products-mini">${s.products.map((p,idx)=>`
      <div class="store-product-mini" onclick="openMiniProductModal(${s.id},${idx})">
        <div class="emoji">${p.e}</div><div class="sname">${p.n}</div><div class="sprice">${p.p}</div>
      </div>`).join('')}</div>`;
  } else if (tab==='reviews') {
    el.innerHTML = s.comments.map(c=>`
      <div class="review-item">
        <div class="review-avatar">${c.u.charAt(0)}</div>
        <div><div class="review-name">${c.u}</div><div class="stars" style="font-size:11px">${'★'.repeat(c.t)}</div><div class="review-text">${c.c}</div></div>
      </div>`).join('');
  } else {
    el.innerHTML = `<div style="font-size:13px;color:var(--gray);line-height:2;">
      <p><strong>📍 Categoria:</strong> ${s.cat.charAt(0).toUpperCase()+s.cat.slice(1)}</p>
      <p><strong>⭐ Avaliação:</strong> ${s.rating}/5 · ${s.reviews} avaliações</p>
      <p><strong>📦 Produtos:</strong> ${s.products.length} disponíveis</p>
      <p><strong>🚚 Entrega:</strong> 1–3 dias úteis</p>
      <p><strong>💳 Pagamento:</strong> Pix, Cartão, Boleto</p>
      <p><strong>🔒 Verificação:</strong> ${s.badge}</p>
    </div>`;
  }
}

/* ═══════════════════════════════════════════
   PRODUCT MODAL
═══════════════════════════════════════════ */
function openProductModal(pid) {
  const p = products.find(x=>x.id===pid); if (!p) return;
  document.getElementById('productModalContent').innerHTML = `
    <div class="product-modal-img">${p.emoji}</div>
    <h2 style="font-size:20px;font-weight:900;margin-bottom:4px;">${p.name}</h2>
    <div style="font-size:11px;color:var(--gray);margin-bottom:8px;"><i class="fas fa-store" style="color:var(--rosa)"></i> ${p.store} &nbsp;•&nbsp; ${p.cat.charAt(0).toUpperCase()+p.cat.slice(1)}</div>
    <div class="stars" style="font-size:14px;margin-bottom:10px;">★★★★★ <span style="color:var(--gray);font-size:12px;font-weight:700;">(127 avaliações)</span></div>
    <div style="display:flex;align-items:baseline;gap:8px;">
      <div class="product-modal-price">${fmtPrice(p.price)}</div>
      ${p.old?`<div class="product-modal-old">${fmtPrice(p.old)}</div>`:''}
      ${p.discount?`<span style="background:var(--rosa);color:white;border-radius:6px;padding:2px 8px;font-size:11px;font-weight:800;">${p.discount}</span>`:''}
    </div>
    <div class="product-modal-desc">${p.desc}</div>
    <div class="product-modal-store">
      <span style="font-size:20px;">${stores.find(s=>s.name===p.store)?.emoji||'🏪'}</span>
      <div><span style="font-size:11px;color:var(--gray);display:block;">Vendido por</span><span style="font-size:13px;font-weight:700;">${p.store}</span></div>
    </div>
    <button class="form-submit" onclick="addToCart(${p.id},null);closeModal('modal-product')"><i class="fas fa-cart-plus"></i> Adicionar ao Carrinho</button>`;
  openModal('modal-product');
}

// Escapa aspas simples para uso seguro dentro de atributos onclick
function escapeJs(str) { return String(str).replace(/'/g, "\\'"); }

// Abre o modal de detalhes de um produto listado dentro da página da loja
// (em vez de adicionar direto ao carrinho ao clicar)
function openMiniProductModal(storeId, idx) {
  const s = stores.find(x=>x.id===storeId); if (!s) return;
  const p = s.products[idx]; if (!p) return;
  const priceNum = parseFloat(String(p.p).replace('R$','').replace(',','.').trim());
  const oldNum   = p.old ? parseFloat(String(p.old).replace('R$','').replace(',','.').trim()) : null;

  document.getElementById('productModalContent').innerHTML = `
    <div class="product-modal-img">${p.e}</div>
    <h2 style="font-size:20px;font-weight:900;margin-bottom:4px;">${p.n}</h2>
    <div style="font-size:11px;color:var(--gray);margin-bottom:8px;"><i class="fas fa-store" style="color:var(--rosa)"></i> ${s.name} &nbsp;•&nbsp; ${s.cat.charAt(0).toUpperCase()+s.cat.slice(1)}</div>
    <div class="stars" style="font-size:14px;margin-bottom:10px;">${'★'.repeat(Math.floor(s.rating))}${'☆'.repeat(5-Math.floor(s.rating))} <span style="color:var(--gray);font-size:12px;font-weight:700;">${s.rating} (${s.reviews} avaliações da loja)</span></div>
    <div style="display:flex;align-items:baseline;gap:8px;">
      <div class="product-modal-price">${fmtPrice(priceNum)}</div>
      ${oldNum?`<div class="product-modal-old">${fmtPrice(oldNum)}</div>`:''}
    </div>
    <div class="product-modal-desc">Produto vendido por ${s.name}. ${s.desc}</div>
    <div class="product-modal-store">
      <span style="font-size:20px;">${s.emoji}</span>
      <div><span style="font-size:11px;color:var(--gray);display:block;">Vendido por</span><span style="font-size:13px;font-weight:700;">${s.name}</span></div>
    </div>
    <button class="form-submit" onclick="addToCartByName('${escapeJs(p.n)}','${p.p}','${p.e}','${escapeJs(s.name)}');closeModal('modal-product')"><i class="fas fa-cart-plus"></i> Adicionar ao Carrinho</button>`;
  openModal('modal-product');
}

/* ═══════════════════════════════════════════
   CART
═══════════════════════════════════════════ */
function addToCart(pid, btn) {
  const p = products.find(x=>x.id===pid); if (!p) return;
  const ex = cartItems.find(i=>i.pid===pid);
  if (ex) ex.qty++; else cartItems.push({pid, name:p.name, price:p.price, emoji:p.emoji, store:p.store, qty:1});
  updateCart();
  showToast('🛒 '+p.name+' adicionado!','success');
  if (btn) { btn.classList.add('added'); setTimeout(()=>btn.classList.remove('added'),400); }
}

function addToCartByName(name, priceStr, emoji, store) {
  const price = parseFloat(priceStr.replace('R$','').replace(',','.'));
  const ex = cartItems.find(i=>i.name===name);
  if (ex) ex.qty++; else cartItems.push({pid:Math.random(), name, price, emoji, store, qty:1});
  updateCart();
  showToast('🛒 '+name+' adicionado!','success');
  closeModal('modal-store');
}

function updateCart() {
  const count = cartItems.reduce((a,i)=>a+i.qty, 0);
  document.getElementById('cartCount').textContent = count;
  const el = document.getElementById('cartItems');
  if (cartItems.length === 0) {
    el.innerHTML = '<div style="text-align:center;padding:50px 16px;color:var(--gray);"><i class="fas fa-shopping-bag" style="font-size:44px;margin-bottom:10px;opacity:.25;display:block;"></i><p style="font-weight:700;">Carrinho vazio</p><p style="font-size:12px;">Adicione produtos incríveis!</p></div>';
  } else {
    el.innerHTML = cartItems.map((item,i) => `
      <div class="cart-item">
        <div class="cart-item-img">${item.emoji||'📦'}</div>
        <div class="cart-item-info">
          <div class="cart-item-name">${item.name}</div>
          <div style="font-size:10px;color:var(--gray)">${item.store||''}</div>
          <div class="cart-item-price">${fmtPrice(item.price)}</div>
          <div class="cart-qty">
            <button class="qty-btn" onclick="changeQty(${i},-1)">−</button>
            <span>${item.qty}</span>
            <button class="qty-btn" onclick="changeQty(${i},1)">+</button>
            <button onclick="removeItem(${i})" style="margin-left:auto;background:none;border:none;cursor:pointer;color:#dc2626;font-size:12px;"><i class="fas fa-trash"></i></button>
          </div>
        </div>
      </div>`).join('');
  }
  recalcCart();
}

function recalcCart() {
  const subtotal = cartItems.reduce((a,i)=>a+(i.price*i.qty), 0);
  document.getElementById('cartSubtotal').textContent = fmtPrice(subtotal);

  let discount = 0;
  let discountLabel = 'Desconto:';
  const discRow = document.getElementById('cartDiscountRow');

  if (appliedCoupon) {
    const c = appliedCoupon;
    if (c.type === 'percent') {
      discount = subtotal * (c.value / 100);
      discountLabel = `Desconto (${c.value}%):`;
    } else if (c.type === 'fixed') {
      discount = Math.min(c.value, subtotal);
      discountLabel = `Desconto fixo:`;
    }
    if (discount > 0) {
      discRow.style.display = 'flex';
      document.getElementById('cartDiscountLabel').textContent = discountLabel;
      document.getElementById('cartDiscountAmt').textContent = '-'+fmtPrice(discount);
    } else {
      discRow.style.display = 'none';
    }
  } else {
    discRow.style.display = 'none';
  }

  const total = Math.max(0, subtotal - discount);
  document.getElementById('cartTotal').textContent = fmtPrice(total);
}

function changeQty(i, delta) { cartItems[i].qty += delta; if (cartItems[i].qty<=0) cartItems.splice(i,1); updateCart(); }
function removeItem(i) { cartItems.splice(i,1); updateCart(); }
function toggleCart() { document.getElementById('cartPanel').classList.toggle('open'); document.getElementById('cartOverlay').classList.toggle('open'); }

/* ── COUPONS ── */
function applyCoupon() {
  const raw = document.getElementById('couponField').value.toUpperCase().trim();
  const found = coupons.find(c => c.code === raw);
  if (!found) { showToast('❌ Cupom inválido ou expirado.','error'); return; }

  const subtotal = cartItems.reduce((a,i)=>a+(i.price*i.qty), 0);
  if (subtotal < found.minOrder) {
    showToast(`⚠️ Pedido mínimo de ${fmtPrice(found.minOrder)} para este cupom.`,'error'); return;
  }

  appliedCoupon = found;
  document.getElementById('couponField').value = '';

  const banner = document.getElementById('couponBanner');
  banner.classList.add('show');
  document.getElementById('couponBannerText').textContent = `✅ ${found.code} — ${found.desc}`;

  recalcCart();
  showToast('🎉 Cupom '+found.code+' aplicado! '+found.desc,'success');
}

function removeCoupon() {
  appliedCoupon = null;
  document.getElementById('couponBanner').classList.remove('show');
  document.getElementById('couponField').value = '';
  recalcCart();
  showToast('Cupom removido.','info');
}

function checkout() {
  if (cartItems.length===0) { showToast('Seu carrinho está vazio!','error'); return; }
  if (!currentUser) { toggleCart(); openModal('modal-login'); return; }
  cartItems = [];
  appliedCoupon = null;
  document.getElementById('couponBanner').classList.remove('show');
  updateCart();
  toggleCart();
  showToast('🎉 Pedido realizado! Obrigado, '+currentUser.name.split(' ')[0]+'!','success');
}

/* ── Render coupons modal ── */
function renderCoupons() {
  document.getElementById('couponsGrid').innerHTML = coupons.map(c => `
    <div style="background:${c.color}15;border:2px dashed ${c.color};border-radius:14px;padding:14px;margin-bottom:10px;">
      <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;">
        <div>
          <div style="font-size:16px;font-weight:900;color:${c.color};letter-spacing:2px;">${c.code}</div>
          <div style="font-size:12px;font-weight:700;margin-top:3px;">${c.desc}</div>
          ${c.minOrder>0?`<div style="font-size:10px;color:var(--gray);margin-top:2px;">Pedido mínimo: ${fmtPrice(c.minOrder)}</div>`:''}
          <div style="font-size:10px;color:var(--gray);margin-top:1px;">Válido até ${c.expiry}</div>
        </div>
        <div style="display:flex;flex-direction:column;gap:5px;">
          <button style="background:${c.color};color:white;border:none;padding:7px 14px;border-radius:9px;font-family:'Nunito',sans-serif;font-weight:800;font-size:11px;cursor:pointer;" onclick="copyCoupon('${c.code}')">Copiar</button>
          <button style="background:white;color:${c.color};border:2px solid ${c.color};padding:5px 14px;border-radius:9px;font-family:'Nunito',sans-serif;font-weight:800;font-size:11px;cursor:pointer;" onclick="applyCouponDirect('${c.code}')">Aplicar</button>
        </div>
      </div>
    </div>`).join('');
}

function copyCoupon(code) { navigator.clipboard.writeText(code).catch(()=>{}); showToast('✅ Cupom '+code+' copiado!','success'); }
function applyCouponDirect(code) {
  document.getElementById('couponField').value = code;
  closeModal('modal-coupon');
  toggleCart();
  applyCoupon();
}

/* ═══════════════════════════════════════════
   SUPPORT FORM
═══════════════════════════════════════════ */
function sendSupport() {
  const name = document.getElementById('supName').value.trim();
  const email = document.getElementById('supEmail').value.trim();
  const msg   = document.getElementById('supMsg').value.trim();
  if (!name||!email||!msg) { showToast('Preencha todos os campos obrigatórios.','error'); return; }
  // Em produção, enviaria para um backend. Aqui mostramos feedback.
  showToast('✉️ Mensagem enviada! Responderemos em até 24h.','success');
  document.getElementById('supName').value='';
  document.getElementById('supEmail').value='';
  document.getElementById('supPhone').value='';
  document.getElementById('supMsg').value='';
}

/* ═══════════════════════════════════════════
   LOGISTICS
═══════════════════════════════════════════ */
function renderOrders() {
  const el = document.getElementById('ordersTable'); if (!el) return;
  el.innerHTML = orders.map(o => `
    <tr>
      <td style="font-weight:800;color:var(--rosa)">${o.id}</td>
      <td>${o.client}</td>
      <td>${o.product}</td>
      <td style="font-weight:800">${o.val}</td>
      <td><span class="status-badge status-${o.status}">${o.status.charAt(0).toUpperCase()+o.status.slice(1)}</span></td>
      <td>${o.date}</td>
      <td style="white-space:nowrap;">
        <button style="background:var(--rosa-pale);color:var(--rosa);border:none;padding:4px 9px;border-radius:7px;font-size:10px;font-weight:800;cursor:pointer;margin-right:3px;" onclick="viewOrder('${o.id}')">Ver</button>
        <button style="background:var(--laranja-pale);color:var(--laranja);border:none;padding:4px 9px;border-radius:7px;font-size:10px;font-weight:800;cursor:pointer;" onclick="showToast('Pedido atualizado!','success')">Editar</button>
      </td>
    </tr>`).join('');
}

// Abre o modal com os detalhes completos de um pedido da gestão de logística
function viewOrder(id) {
  const o = orders.find(x => x.id === id);
  if (!o) { showToast('Pedido não encontrado.', 'error'); return; }

  const statusLabel = o.status.charAt(0).toUpperCase() + o.status.slice(1);

  // Define em qual etapa da entrega o pedido está, conforme o status
  const stepsAll = [
    {key:'pendente',  icon:'fa-receipt',      label:'Recebido'},
    {key:'pago',      icon:'fa-dollar-sign',  label:'Pago'},
    {key:'enviado',   icon:'fa-truck',        label:'Enviado'},
    {key:'entregue',  icon:'fa-box-open',     label:'Entregue'},
  ];
  const order = ['pendente','pago','enviado','entregue'];
  const isCanceled = o.status === 'cancelado';
  const currentIdx = order.indexOf(o.status);

  const trackHTML = isCanceled
    ? `<div style="display:flex;align-items:center;gap:10px;color:#dc2626;font-weight:800;font-size:12px;"><i class="fas fa-times-circle" style="font-size:18px;"></i> Este pedido foi cancelado.</div>`
    : `<div class="track-steps">${stepsAll.map((s,i)=>`
        <div class="track-step ${i<=currentIdx?'done':''}">
          <div class="dot"><i class="fas ${s.icon}"></i></div>
          <span>${s.label}</span>
        </div>`).join('')}</div>`;

  document.getElementById('orderModalContent').innerHTML = `
    <div class="order-detail-head">
      <div>
        <div class="order-detail-id">${o.id}</div>
        <div style="font-size:11px;color:var(--gray);font-weight:700;">Realizado em ${o.date}</div>
      </div>
      <span class="status-badge status-${o.status}" style="font-size:11px;padding:5px 14px;">${statusLabel}</span>
    </div>
    <div class="order-detail-track">
      <h4><i class="fas fa-route" style="color:var(--rosa)"></i> Rastreamento</h4>
      ${trackHTML}
    </div>
    <div class="order-detail-grid">
      <div class="order-detail-item"><span>Cliente</span><strong>${o.client}</strong></div>
      <div class="order-detail-item"><span>Loja</span><strong>${o.store||'—'}</strong></div>
      <div class="order-detail-item"><span>Produto</span><strong>${o.product} ${o.qty?('(x'+o.qty+')'):''}</strong></div>
      <div class="order-detail-item"><span>Valor Total</span><strong>${o.val}</strong></div>
      <div class="order-detail-item"><span>Pagamento</span><strong>${o.pay||'—'}</strong></div>
      <div class="order-detail-item"><span>Endereço de Entrega</span><strong style="font-size:12px;">${o.addr||'—'}</strong></div>
    </div>
    <div style="display:flex;gap:10px;flex-wrap:wrap;">
      <button class="btn btn-primary" onclick="showToast('Pedido atualizado!','success')"><i class="fas fa-edit"></i> Atualizar Status</button>
      <button class="btn btn-outline" onclick="closeModal('modal-order')">Fechar</button>
    </div>
  `;
  openModal('modal-order');
}

function renderChart() {
  const data   = [1840,2310,1950,2680,1790,2450,3120];
  const labels = ['Seg','Ter','Qua','Qui','Sex','Sáb','Dom'];
  const max    = Math.max(...data);
  const barsEl = document.getElementById('chartBars');
  const lblEl  = document.getElementById('chartLabels');
  if (!barsEl) return;
  barsEl.innerHTML = data.map((v,i) => `
    <div class="chart-bar-wrap">
      <div style="font-size:9px;font-weight:800;color:var(--rosa);margin-bottom:3px;">R$${(v/1000).toFixed(1)}k</div>
      <div class="chart-bar" style="height:${Math.round((v/max)*88)}%;transition-delay:${i*.1}s"></div>
    </div>`).join('');
  lblEl.innerHTML = labels.map(l => `<div style="flex:1;text-align:center;font-size:9px;font-weight:700;color:var(--gray)">${l}</div>`).join('');
}

/* ═══════════════════════════════════════════
   UI HELPERS
═══════════════════════════════════════════ */
function openModal(id)  { document.getElementById(id).classList.add('open'); }
function closeModal(id) { document.getElementById(id).classList.remove('open'); }
document.querySelectorAll('.modal-overlay').forEach(el => {
  el.addEventListener('click', function(e) { if (e.target===this) this.classList.remove('open'); });
});
function toggleMenu() { document.getElementById('menuPanel').classList.toggle('open'); document.getElementById('menuOverlay').classList.toggle('open'); }
function closeMenu()  { document.getElementById('menuPanel').classList.remove('open');  document.getElementById('menuOverlay').classList.remove('open'); }

function showToast(msg, type='success') {
  const t = document.getElementById('toast');
  const icon = document.getElementById('toastIcon');
  document.getElementById('toastMsg').textContent = msg;
  t.className = 'toast ' + type;
  if (type==='success') icon.className='fas fa-check-circle';
  else if (type==='error') icon.className='fas fa-times-circle';
  else icon.className='fas fa-info-circle';
  t.classList.add('show');
  clearTimeout(t._timer);
  t._timer = setTimeout(() => t.classList.remove('show'), 3400);
}

function selectType(type) {
  document.getElementById('typeComprador').classList.toggle('selected', type==='comprador');
  document.getElementById('typeVendedor').classList.toggle('selected', type==='vendedor');
  document.getElementById('vendedorFields').style.display = type==='vendedor' ? 'block' : 'none';
}
function scrollToTop() { window.scrollTo({top:0,behavior:'smooth'}); }

// Clique na logo: leva para a página inicial, não importa em qual tela o usuário esteja
function goHome() {
  document.querySelectorAll('.modal-overlay.open').forEach(m => m.classList.remove('open'));
  closeMenu();
  document.getElementById('cartPanel').classList.remove('open');
  document.getElementById('cartOverlay').classList.remove('open');
  document.querySelectorAll('.mbb-item').forEach(b=>b.classList.remove('active'));
  const mbbHome = document.querySelector('.mobile-bottom-bar .mbb-item');
  if (mbbHome) mbbHome.classList.add('active');
  showTab('inicio');
}
function setActiveMbb(el) { document.querySelectorAll('.mbb-item').forEach(b=>b.classList.remove('active')); el.classList.add('active'); }

function showTab(tab) {
  // Painel Logístico é exclusivo para contas do tipo "vendedor"
  if (tab === 'logistica' && !canAccessLogistica()) {
    if (!currentUser) {
      showToast('🔒 Faça login como vendedor para acessar a Logística.','info');
      openModal('modal-login');
    } else {
      showToast('🔒 O Painel Logístico é exclusivo para lojistas (vendedores).','error');
    }
    return;
  }

  document.querySelectorAll('.tab-content').forEach(el=>el.classList.remove('active'));
  document.querySelectorAll('.main-tab').forEach(el=>el.classList.remove('active'));
  const el = document.getElementById('tab-'+tab);
  if (el) el.classList.add('active');
  const mt = document.getElementById('mtab-'+tab);
  if (mt) mt.classList.add('active');
  if (tab==='mapa')      initMap();
  if (tab==='logistica') { renderChart(); renderOrders(); }
  window.scrollTo({top:0,behavior:'smooth'});
}

function choosePlan(planName) {
  showToast(`Plano ${planName} selecionado! Redirecionando para o pagamento... 🎉`, 'success');
}

function canAccessLogistica() { return !!currentUser && currentUser.type === 'vendedor'; }

// Atualiza a aparência dos atalhos de Logística conforme o tipo de usuário logado
function updateUIForUserType() {
  const allowed = canAccessLogistica();
  document.querySelectorAll('[data-logistica-link]').forEach(elmt => {
    elmt.classList.toggle('locked-feature', !allowed);
    elmt.title = allowed ? '' : 'Exclusivo para vendedores';
  });
}

function filterCat(cat, btn) {
  if (btn) { document.querySelectorAll('.nav-cat').forEach(b=>b.classList.remove('active')); btn.classList.add('active'); }
  showTab('lojas');
  const list = cat==='todos' ? stores : stores.filter(s=>s.cat===cat);
  renderStores(list, 'storesAll');
  const info = document.getElementById('storeFilterInfo');
  if (info) info.textContent = cat==='todos' ? `Mostrando todas as ${stores.length} lojas` : `${list.length} loja(s) em "${cat}"`;
}

function doSearch() {
  const q = document.getElementById('searchInput').value.toLowerCase().trim();
  if (!q) return;

  const filteredStores = stores.filter(s =>
    s.name.toLowerCase().includes(q) || s.cat.toLowerCase().includes(q) || s.tags.some(t=>t.toLowerCase().includes(q))
  );
  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(q) || p.cat.toLowerCase().includes(q) || p.store.toLowerCase().includes(q) || p.desc.toLowerCase().includes(q)
  );

  renderStores(filteredStores, 'searchStoresGrid');
  renderProducts(filteredProducts, 'searchProductsGrid');

  document.getElementById('searchStoresSection').style.display   = filteredStores.length   ? 'block' : 'none';
  document.getElementById('searchProductsSection').style.display = filteredProducts.length ? 'block' : 'none';
  document.getElementById('searchEmptyState').style.display      = (!filteredStores.length && !filteredProducts.length) ? 'block' : 'none';
  document.getElementById('searchResultsTitle').textContent = `Resultados para "${q}" — ${filteredStores.length} loja(s), ${filteredProducts.length} produto(s)`;

  showTab('busca');
}
document.getElementById('searchInput').addEventListener('keypress', e => { if (e.key==='Enter') doSearch(); });

/* ═══════════════════════════════════════════
   MAP
═══════════════════════════════════════════ */
function initMap() {
  if (mapInstance) return;
  setTimeout(async () => {
    mapInstance = L.map('map').setView([-21.1767,-47.8208],13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{attribution:'© OpenStreetMap'}).addTo(mapInstance);
    [[-21.175,-47.820,'💻','TechZone BR','#FF6B9D'],
     [-21.178,-47.825,'💊','FarmaVida','#FF8C42'],
     [-21.182,-47.815,'🍰','Sabor da Vó','#FFD166'],
     [-21.170,-47.830,'👗','ModaFácil','#FF6B9D'],
     [-21.185,-47.812,'💄','Bela & Cia','#FF8C42'],
     [-21.173,-47.818,'🐾','PetAmor','#FFD166'],
    ].forEach(([lat,lng,emoji,name,color]) => {
      const icon = L.divIcon({html:`<div style="background:${color};width:38px;height:38px;border-radius:50%;border:3px solid white;box-shadow:0 3px 10px rgba(0,0,0,.3);display:flex;align-items:center;justify-content:center;font-size:18px;">${emoji}</div>`,className:'',iconSize:[38,38],iconAnchor:[19,19]});
      L.marker([lat,lng],{icon}).addTo(mapInstance).bindPopup(`<b>${name}</b>`);
    });

    // Carrega as lojas de todos os vendedores já cadastrados (persistidos no IndexedDB)
    const allUsers = await dbGetAll('users');
    allUsers
      .filter(u => u.type === 'vendedor' && u.lat && u.lng)
      .forEach(u => addStoreToMap(u, /*skipFly*/ true));
  }, 200);
}

// Adiciona (ou atualiza) o pin da loja de um vendedor no mapa.
// Chamada automaticamente quando o usuário se cadastra como vendedor.
function addStoreToMap(user, skipFly) {
  if (!user || user.type !== 'vendedor' || !user.lat || !user.lng) return;
  if (!mapInstance) return; // o mapa ainda não foi aberto; será carregado do DB na próxima vez que initMap() rodar

  const emoji = CAT_EMOJI[user.catSel] || '🏪';
  const color = CAT_COLOR[user.catSel] || '#FF6B9D';
  const storeName = user.storeName || (user.name + ' Store');

  // Remove o marcador anterior desse vendedor, se existir, para evitar duplicidade
  if (vendorMarkers[user.email]) { mapInstance.removeLayer(vendorMarkers[user.email]); }

  const icon = L.divIcon({html:`<div style="background:${color};width:38px;height:38px;border-radius:50%;border:3px solid white;box-shadow:0 3px 10px rgba(0,0,0,.3);display:flex;align-items:center;justify-content:center;font-size:18px;">${emoji}</div>`,className:'',iconSize:[38,38],iconAnchor:[19,19]});
  const marker = L.marker([user.lat, user.lng],{icon}).addTo(mapInstance)
    .bindPopup(`<b>${storeName}</b><br><span style="font-size:11px;color:#888;">${user.catSel||'Loja de vendedor'}</span>`);
  vendorMarkers[user.email] = marker;

  if (!skipFly) { mapInstance.setView([user.lat, user.lng], 14); marker.openPopup(); }
}
/* ═══════════════════════════════════════════
   CADASTRO DE LOJA E PRODUTOS (vendedor)
═══════════════════════════════════════════ */
let ssProductRowCount = 0;

function ensureUserIsSeller() {
  if (!currentUser || currentUser.type !== 'vendedor') {
    showToast('Você precisa estar logado como vendedor para cadastrar uma loja.','error');
    return false;
  }
  return true;
}

async function openStoreSetupModal() {
  if (!ensureUserIsSeller()) return;

  // Se já existe uma loja salva para esse vendedor, pré-preenche os campos (modo edição)
  const existing = await dbGetStoreByOwner(currentUser.email);

  document.getElementById('ssStoreName').value = existing?.name  || currentUser.storeName || '';
  document.getElementById('ssCat').value       = existing?.cat   || currentUser.catSel     || 'outro';
  document.getElementById('ssEmoji').value     = existing?.emoji || CAT_EMOJI[currentUser.catSel] || '🏪';
  document.getElementById('ssDesc').value      = existing?.desc  || '';

  document.getElementById('ssProductsList').innerHTML = '';
  ssProductRowCount = 0;
  if (existing && existing.products && existing.products.length) {
    existing.products.forEach(p => addProductRow(p));
  } else {
    addProductRow(); // começa com uma linha de produto em branco
  }

  openModal('modal-store-setup');
}

function addProductRow(data) {
  data = data || {};
  ssProductRowCount++;
  const rowId = 'ssrow' + ssProductRowCount;
  const wrap = document.createElement('div');
  wrap.className = 'ss-product-row';
  wrap.id = rowId;
  const esc = s => String(s || '').replace(/"/g, '&quot;');
  wrap.innerHTML = `
    <button type="button" class="ss-row-remove" onclick="removeProductRow('${rowId}')" title="Remover produto"><i class="fas fa-times"></i></button>
    <div class="ss-row-grid">
      <input type="text" class="ss-p-emoji" placeholder="🎧" maxlength="4" value="${esc(data.emoji)}">
      <input type="text" class="ss-p-name" placeholder="Nome do produto" value="${esc(data.name)}">
      <input type="number" class="ss-p-price" placeholder="Preço (R$)" min="0" step="0.01" value="${data.price != null ? data.price : ''}">
    </div>
    <input type="text" class="ss-p-desc" placeholder="Descrição do produto (opcional)" value="${esc(data.desc)}">`;
  document.getElementById('ssProductsList').appendChild(wrap);
}

function removeProductRow(rowId) {
  const el = document.getElementById(rowId);
  if (el) el.remove();
}

async function saveStoreSetup() {
  if (!ensureUserIsSeller()) return;

  const storeName = document.getElementById('ssStoreName').value.trim();
  const cat        = document.getElementById('ssCat').value;
  const emoji      = document.getElementById('ssEmoji').value.trim() || '🏪';
  const desc       = document.getElementById('ssDesc').value.trim();

  if (!storeName) {
    showToast('Informe o nome da loja.', 'error');
    document.getElementById('ssStoreName').focus();
    return;
  }

  // Coleta os produtos preenchidos nas linhas do formulário
  const rows = document.querySelectorAll('#ssProductsList .ss-product-row');
  const newProducts = [];
  let hasInvalidRow = false;
  rows.forEach(row => {
    const name   = row.querySelector('.ss-p-name').value.trim();
    const price  = parseFloat(row.querySelector('.ss-p-price').value);
    const pEmoji = row.querySelector('.ss-p-emoji').value.trim() || emoji;
    const pDesc  = row.querySelector('.ss-p-desc').value.trim();
    if (!name && isNaN(price)) return; // linha em branco, ignora
    if (!name || isNaN(price) || price <= 0) { hasInvalidRow = true; return; }
    newProducts.push({ name, price, emoji: pEmoji, desc: pDesc });
  });

  if (hasInvalidRow) {
    showToast('Preencha nome e um preço válido para todos os produtos adicionados.', 'error');
    return;
  }

  // Salva a loja no IndexedDB
  const storeRecord = {
    ownerEmail: currentUser.email,
    name: storeName, cat, emoji, desc,
    products: newProducts,
    updatedAt: new Date().toISOString()
  };
  await dbSaveStore(storeRecord);
  flashDB('Loja salva no IndexedDB ✓');

  // Atualiza os dados do usuário logado
  currentUser.storeName = storeName;
  currentUser.catSel    = cat;
  await dbSaveUser(currentUser);
  await dbSaveSession(currentUser);

  // Remove versão anterior dessa loja/produtos das listas em memória (evita duplicar ao editar)
  const existingStoreIdx = stores.findIndex(s => s.ownerEmail === currentUser.email);
  const storeId = existingStoreIdx >= 0 ? stores[existingStoreIdx].id : Math.max(0, ...stores.map(s => s.id)) + 1;
  if (existingStoreIdx >= 0) stores.splice(existingStoreIdx, 1);
  for (let i = products.length - 1; i >= 0; i--) {
    if (products[i].ownerEmail === currentUser.email) products.splice(i, 1);
  }

  // Adiciona a loja atualizada ao catálogo em memória
  stores.push({
    id: storeId, ownerEmail: currentUser.email, name: storeName, cat, emoji,
    cover: 'https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=400&h=120&fit=crop',
    rating: 5.0, reviews: 0, badge: '🆕 Novo', tags: [],
    desc: desc || ('Loja de ' + storeName),
    products: newProducts.map(p => ({ n: p.name, p: fmtPrice(p.price), e: p.emoji, old: '' })),
    comments: []
  });

  newProducts.forEach(p => {
    const newId = Math.max(0, ...products.map(x => x.id)) + 1;
    products.push({
      id: newId, name: p.name, price: p.price, emoji: p.emoji, store: storeName,
      cat, discount: '', old: 0, desc: p.desc, ownerEmail: currentUser.email
    });
  });

  // Atualiza o pin da loja no mapa, se o mapa já estiver aberto
  addStoreToMap(currentUser, true);

  // Re-renderiza as vitrines de lojas e produtos
  renderStores(stores.slice(0, 6), 'storesHome');
  renderStores(stores, 'storesAll');
  renderProducts(products.slice(0, 8), 'productsHome');
  renderProducts(products, 'productsAll');

  closeModal('modal-store-setup');
  showToast('🎉 Loja e produtos salvos com sucesso!', 'success');
}

function locateUser() {
  if (!mapInstance) return;
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      pos => { mapInstance.setView([pos.coords.latitude,pos.coords.longitude],14); showToast('📍 Localização encontrada!','success'); },
      ()  => { showToast('Não foi possível obter sua localização.','error'); }
    );
  }
}

/* ═══════════════════════════════════════════
   BOOT — inicializa DB e restaura sessão
═══════════════════════════════════════════ */
async function boot() {
  await initDB();
  initGlobalDB();

  if (dbGlobalOK) {
    flashDB('🌍 Banco de dados global conectado ✓');
    try {
      const globalStores = await dbGlobalGetAll('stores');
      mergeGlobalStoresIntoCatalog(globalStores); // traz lojas cadastradas por qualquer pessoa, em qualquer lugar
    } catch (e) { console.error('Erro ao carregar lojas globais:', e); }
    startGlobalSync(); // mantém tudo sincronizado a partir daqui (a cada 30s)
  } else if (db) {
    flashDB('⚠️ Modo local (configure o banco global em script.js)');
  } else {
    flashDB('Usando memória (sem banco de dados)');
  }

  if (db) {
    // Restaurar sessão salva neste navegador
    const sess = await dbGetSession();
    if (sess) {
      const user = await dbGetUser(sess.email);
      if (user) { loginUser(user); showToast('👋 Bem-vindo de volta, '+user.name.split(' ')[0]+'!','success'); }
    }
  }

  // Render inicial
  renderStores(stores.slice(0,6), 'storesHome');
  renderStores(stores, 'storesAll');
  renderProducts(products.slice(0,8), 'productsHome');
  renderProducts(products, 'productsAll');
  renderCoupons();
  renderOrders();
  renderChart();
  updateCart();
  updatePedidosTab();
  updateUIForUserType();
  initCarousel();
}

boot();