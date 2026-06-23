// Shared data, utilities and cart persistence — SENTIDO Marketplace

const COMMISSION = 0.10;

const SEAL_MAP = {
  'Bienestar': 'seal-green', 'Liderazgo': 'seal-purple', 'Jefatura': 'seal-amber',
  'Circular': 'seal-teal', 'Producción Limpia': 'seal-green', 'Cero Plástico': 'seal-teal',
  'Rural': 'seal-amber', 'Inclusión': 'seal-blue', 'Ancestral': 'seal-pink',
  'Biocomercio': 'seal-green', 'Innovación': 'seal-blue', 'Adulto Mayor': 'seal-purple',
  'Comercio Justo': 'seal-teal',
};

function sealColor(s) {
  for (const k of Object.keys(SEAL_MAP)) { if (s.includes(k)) return SEAL_MAP[k]; }
  return 'seal-blue';
}

function cleanSeals(raw) {
  if (!raw) return [];
  return raw.split(';').map(s => s.trim()).filter(Boolean).map(s => {
    s = s.replace(/🧘|🪡|🤝|⚖️|🌿|📦|🍎|🧪|🌾/g, '').trim();
    if (s.includes('Bienestar')) return 'Bienestar Consciente';
    if (s.includes('Liderazgo')) return 'Liderazgo Femenino';
    if (s.includes('Jefatura')) return 'Jefatura de Hogar';
    if (s.includes('Economía Circular') || s.includes('Segunda Vida')) return 'Economía Circular';
    if (s.includes('Producción Limpia')) return 'Producción Limpia';
    if (s.includes('Cero Plástico') || s.includes('Empaque')) return 'Cero Plástico';
    if (s.includes('Origen Rural')) return 'Origen Rural';
    if (s.includes('Inclusión') || s.includes('Empleo Digno')) return 'Inclusión & Empleo';
    if (s.includes('Saberes')) return 'Saberes Ancestrales';
    if (s.includes('Biocomercio') || s.includes('Orgánico')) return 'Origen Orgánico';
    if (s.includes('Innovación')) return 'Innovación Sostenible';
    if (s.includes('Adulto Mayor')) return 'Adulto Mayor Activo';
    if (s.includes('Comercio Justo')) return 'Comercio Justo';
    return s.substring(0, 28);
  }).filter((v, i, a) => a.indexOf(v) === i).slice(0, 4);
}

function parsePrice(raw) {
  if (!raw) return null;
  const m = String(raw).match(/[\d]{3,}/g);
  if (!m) return null;
  const nums = m.map(Number).filter(n => n >= 1000);
  return nums.length ? Math.min(...nums) : null;
}

function fmt(n) { return '$ ' + Math.round(n).toLocaleString('es-CO'); }

function empEmoji(name) {
  const n = name.toLowerCase();
  if (n.includes('luzmar') || n.includes('shampoo') || n.includes('sal relajante')) return '🌿';
  if (n.includes('lekatta') || n.includes('galleta') || n.includes('salmón') || n.includes('cordero') || n.includes('búfalo')) return '🐾';
  if (n.includes('fundaci') || n.includes('renacer') || n.includes('gestión') || n.includes('crm')) return '🤝';
  if (n.includes('coraje') || n.includes('salchipapa') || n.includes('hamburguesa')) return '🌭';
  if (n.includes('monsie') || n.includes('oversize') || n.includes('conjunto')) return '👗';
  if (n.includes('sacha') || n.includes('aceite') || n.includes('harina') || n.includes('nueces')) return '🌱';
  if (n.includes('kattaleya') || n.includes('aretas') || n.includes('collar') || n.includes('brazalete')) return '💍';
  if (n.includes('itaka') || n.includes('blazer') || n.includes('chaqueta')) return '👚';
  if (n.includes('maxxi') || n.includes('detergente') || n.includes('lavaloza')) return '🧴';
  if (n.includes('linamar') || n.includes('botánico') || n.includes('crema')) return '🌸';
  if (n.includes('ritual') || n.includes('torta')) return '🎂';
  if (n.includes('potencial') || n.includes('ropa') || n.includes('juguetes')) return '♻️';
  if (n.includes('atracción') || n.includes('cobija')) return '🧶';
  if (n.includes('lylosart') || n.includes('cojín') || n.includes('bolso artesanal')) return '🪢';
  if (n.includes('turbante') || n.includes('balaca') || n.includes('satín')) return '🧕';
  if (n.includes('aikon') || n.includes('pupitre') || n.includes('silla')) return '🪑';
  if (n.includes('kupu') || n.includes('vela')) return '🕯️';
  if (n.includes('ecopeques') || n.includes('pañal')) return '👶';
  if (n.includes('mentes pensantes') || n.includes('festival') || n.includes('dispositivos lúdicos')) return '🎲';
  return '🌟';
}

function formalInfo(f) {
  if (!f) return ['no', '○ Sin NIT'];
  const v = f.toLowerCase();
  if (v.includes('sí') || v === 'si') return ['yes', '✓ Formalizado'];
  if (v.includes('proceso')) return ['process', '⏳ En proceso'];
  return ['no', '○ Sin NIT'];
}

const BASE_DATA = [
  { id:1, name:'Luzmar Brilla Natural', photo:'https://images.unsplash.com/photo-1608248597279-f99d160bfcbc?w=800&h=400&fit=crop', city:'Norte de Santander', formal:'SÍ', tagline:'Shampoo y jabones naturales artesanales con fórmulas ancestrales de nuestros abuelos.', seals:'Bienestar Consciente;Liderazgo que Inspira;Jefatura de Hogar;Producción Limpia', impact:'~400 personas/año beneficiadas. Emplea madres cabeza de familia en pedidos grandes. Fórmulas transmitidas por 3 generaciones.', whatsapp:'573001234561', products:[{name:'Shampoo Romero y Miel',price:'Litro $50.000 / Medio $27.000',rawPrice:'27000'},{name:'Jabón Glicerina de Arroz',price:'Grande $12.000 / Mediano $7.000',rawPrice:'7000'},{name:'Sal Relajante Eucalipto',price:'Tarro 120g $12.000',rawPrice:'12000'}]},
  { id:2, name:'Lekatta', photo:'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=800&h=400&fit=crop', city:'Medellín', formal:'NO', tagline:'Snacks horneados artesanalmente para mascotas con proteínas de alta calidad, sin conservantes.', seals:'Bienestar Consciente', impact:'Promovemos hábitos saludables en mascotas para prevenir obesidad y fortalecer el vínculo humano-animal.', whatsapp:'573002234562', products:[{name:'Galletas de Salmón',price:'$20.000 bolsa 100g',rawPrice:'20000'},{name:'Galleta de Cordero',price:'$18.000 bolsa 100g',rawPrice:'18000'},{name:'Galleta de Búfalo',price:'$20.000 bolsa 100g',rawPrice:'20000'}]},
  { id:3, name:'Fundación Renacer Sin Fronteras', photo:'https://images.unsplash.com/photo-1553877522-43269d4ea984?w=800&h=400&fit=crop', city:'Medellín', formal:'SÍ', tagline:'Apoyamos micro y pequeñas empresas en gestión humana y automatización de procesos.', seals:'Liderazgo que Inspira;Comercio Justo;Innovación Sostenible', impact:'3 emprendimientos gestionados con 16 empleados. Apoya formalización de migrantes venezolanos.', whatsapp:'573003234563', products:[{name:'Gestión Humana de Bolsillo',price:'$2.600.000/mes',rawPrice:'2600000'},{name:'Automatización de Procesos',price:'$150.000/hora',rawPrice:'150000'},{name:'CRM Integral con IA',price:'$1.000.000/mes',rawPrice:'1000000'}]},
  { id:4, name:'Coraje Dog', photo:'https://images.unsplash.com/photo-1565299507177-b0ac66763828?w=800&h=400&fit=crop', city:'Santa Marta', formal:'NO', tagline:'Comida rápida de calidad con sazón único y el amor que cada familia merece.', seals:'Jefatura de Hogar', impact:'Emprendimiento de madre cabeza de hogar. Ingredientes de calidad, sazón propio e innovación culinaria.', whatsapp:'573004234564', products:[{name:'Salchipapa Trifásica',price:'$23.000',rawPrice:'23000'},{name:'Hamburguesa Coraje',price:'$28.000',rawPrice:'28000'},{name:'Perro Coraje Familiar',price:'$35.000',rawPrice:'35000'}]},
  { id:5, name:'Monsie', photo:'https://images.unsplash.com/photo-1519278409-1f56ab241a7e?w=800&h=400&fit=crop', city:'Bogotá', formal:'En proceso', tagline:'Ropa infantil económica y de calidad, apoyando a jóvenes que estudian en Bogotá.', seals:'Jefatura de Hogar', impact:'Apoya estudiantes de diseño y ofrece ropa infantil a precio accesible para familias colombianas.', whatsapp:'573005234565', products:[{name:'Oversize Niño',price:'$32.000 al por mayor',rawPrice:'32000'},{name:'Conjunto Niña Ángel',price:'$28.000 al por mayor',rawPrice:'28000'},{name:'Conjunto Oversize Cuello Redondo',price:'$30.000 al por mayor',rawPrice:'30000'}]},
  { id:6, name:'TodoSacha', photo:'https://images.unsplash.com/photo-1519996529931-28324d5a630e?w=800&h=400&fit=crop', city:'Madrid, Cundinamarca', formal:'SÍ', tagline:'Productos de Sacha Inchi orgánicos con economía circular y cero residuos. Premio AVPA París 2021.', seals:'Adulto Mayor Activo;Origen Rural;Biocomercio;Economía Circular;Producción Limpia;Comercio Justo', impact:'369 agricultores beneficiados. 9 toneladas/mes. Certificados USDA, FDA. Premio AVPA París 2021. Cero residuos en producción.', whatsapp:'573006234566', products:[{name:"Aceite Omega-3 SachaD'Lux",price:'$79.900',rawPrice:'79900'},{name:'Harina de Sacha Inchi 250g',price:'$45.000',rawPrice:'45000'},{name:'Nueces Snack 50g',price:'$13.000',rawPrice:'13000'}]},
  { id:7, name:'Kattaleya Accesorios', photo:'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=800&h=400&fit=crop', city:'Medellín', formal:'NO', tagline:'Accesorios Miyuki ancestrales inspirados en fauna y flora colombiana. Red de 13 tejedoras.', seals:'Economía Circular;Producción Limpia;Cero Plástico;Inclusión & Empleo Digno', impact:'13 tejedoras + 15 embajadoras generan ingresos desde casa. 0% desperdicio de materia prima.', whatsapp:'573007234567', products:[{name:'Aretas Orquídea Dorada (miyuki)',price:'$290.000',rawPrice:'290000'},{name:'Collar Orquídea Kattaleya',price:'$260.000',rawPrice:'260000'},{name:'Brazalete Miyuki Ajustable',price:'$160.000',rawPrice:'160000'}]},
  { id:8, name:'ITAKA', photo:'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=800&h=400&fit=crop', city:'Medellín', formal:'NO', tagline:'Customizamos ropa de segunda mano para reducir el impacto ambiental de la industria de la moda.', seals:'Jefatura de Hogar;Economía Circular;Producción Limpia', impact:'3 costureras empleadas. 20 kg de ropa reutilizada semanal. Prendas únicas con identidad propia.', whatsapp:'573008234568', products:[{name:'Blazer Dama Customizado',price:'$80.000',rawPrice:'80000'},{name:'Blazer Men Customizado',price:'$150.000',rawPrice:'150000'},{name:'Chaqueta de Jean Intervenida',price:'$130.000',rawPrice:'130000'}]},
  { id:9, name:'Maxxi Clean', photo:'https://images.unsplash.com/photo-1563453392212-326f5e854473?w=800&h=400&fit=crop', city:'Medellín', formal:'SÍ', tagline:'Productos de aseo biodegradables sin derivados del petróleo, a precios iguales o menores que los tradicionales.', seals:'Jefatura de Hogar;Economía Circular;Producción Limpia;Cero Plástico;Bienestar Consciente', impact:'+10 toneladas/mes de productos biodegradables. +5.000 empaques reutilizados. Capacidad: 40 ton/mes.', whatsapp:'573009234569', products:[{name:'Detergente Maxxi Clean',price:'Litro $8.500',rawPrice:'8500'},{name:'Lavaloza Biodegradable',price:'Litro $7.500',rawPrice:'7500'},{name:'Línea Institucional',price:'Cotización por volumen',rawPrice:''}]},
  { id:10, name:'Linamar.skin', photo:'https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?w=800&h=400&fit=crop', city:'Campo de la Cruz, Atlántico', formal:'SÍ', tagline:'Productos botánicos para el bienestar con saberes ancestrales para el cuidado de piel y cabello.', seals:'Adulto Mayor Activo;Saberes Ancestrales;Inclusión & Empleo;Liderazgo Femenino;Jefatura de Hogar', impact:'Liderado por mujer visitadora médica. Ingredientes naturales y fórmulas ancestrales para toda la familia.', whatsapp:'573010234570', products:[{name:'Jabón Botánico Linamar',price:'Arroz, miel, soya, vit. C',rawPrice:''},{name:'Crema Facial Hidratante + SPF',price:'$45.000',rawPrice:'45000'},{name:'Shampoo Romero y Cebolla',price:'Anticaída y crecimiento',rawPrice:''}]},
  { id:11, name:'Ritual Repostería', photo:'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=400&fit=crop', city:'Medellín', formal:'NO', tagline:'Tortas artesanales con sabores locales colombianos para celebrar los momentos de la vida.', seals:'Adulto Mayor Activo;Inclusión & Empleo;Liderazgo Femenino;Cero Plástico', impact:'Liderado por mujer. Emplea madres cabeza de hogar. Empaques tipo regalo sin plástico.', whatsapp:'573011234571', products:[{name:'Torta Origen — Almojábana',price:'$99.000 (12 porciones)',rawPrice:'99000'},{name:'Torta de la Casa — Zanahoria',price:'$88.000 (12 porciones)',rawPrice:'88000'},{name:'Torta Victoria — Tres Leches',price:'$83.000 (12 porciones)',rawPrice:'83000'}]},
  { id:12, name:'Potencial — TransformaSion', photo:'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=800&h=400&fit=crop', city:'Medellín', formal:'SÍ', tagline:'Economía circular con impacto 360°. Maximizamos el potencial de las cosas para desarrollar el de las personas.', seals:'Inclusión & Empleo;Liderazgo Femenino;Jefatura de Hogar;Economía Circular;Producción Limpia', impact:'45 familias bajo el puente Madre Laura. 30 niños/mes en casa hogar. 80%+ del equipo: mujeres.', whatsapp:'573012234572', products:[{name:'Ropa Nueva y Segunda Mano',price:'Desde $10.000',rawPrice:'10000'},{name:'Artículos de Belleza y Cuidado',price:'Desde $10.000',rawPrice:'10000'},{name:'Juguetes Nuevos y Usados',price:'Desde $10.000',rawPrice:'10000'}]},
  { id:13, name:'Atracción Estratégica', photo:'https://images.unsplash.com/photo-1693387369575-df25ef8424e7?w=800&h=400&fit=crop', city:'Envigado', formal:'NO', tagline:'Tejemos cobijas artesanales para bebés recién nacidos que no tienen nada, con materiales hipoalergénicos.', seals:'Saberes Ancestrales', impact:'Nació como terapia de rehabilitación física y se convirtió en propósito social: cada cobija llega a una mamá sin recursos para su bebé recién nacido.', whatsapp:'573016499815', products:[{name:'Cobija para Bebé',price:'$20.000',rawPrice:'20000'}]},
  { id:14, name:'LylosArt', photo:'https://images.unsplash.com/photo-1527383214149-cb7be04ae387?w=800&h=400&fit=crop', city:'Rionegro, Antioquia', formal:'En proceso', tagline:'Tejido artesanal en crochet y telar vertical, usado como herramienta de bienestar emocional y generación de ingresos.', seals:'Saberes Ancestrales;Jefatura de Hogar;Origen Rural', impact:'Nació como terapia de recuperación emocional. Meta de impactar 10-20 personas mediante talleres de tejido. Produce 15-20 piezas artesanales/mes.', whatsapp:'573156667410', products:[{name:'Cojín Alma (Telar Vertical)',price:'$100.000',rawPrice:'100000'},{name:'Blusa Artesanal Tejida a Mano',price:'$260.000',rawPrice:'260000'},{name:'Bolso Artesanal Tejido a Mano',price:'$160.000',rawPrice:'160000'}]},
  { id:15, name:'Turbantes Masay', photo:'https://images.unsplash.com/photo-1763823133159-c6f8ec380e33?w=800&h=400&fit=crop', city:'Medellín', formal:'En proceso', tagline:'Turbantes, balacas y gorros de satín fabricados con telas africanas exclusivas, junto a grupos vulnerables.', seals:'Adulto Mayor Activo;Saberes Ancestrales;Jefatura de Hogar;Origen Rural', impact:'Nació de una sobreviviente de cáncer de cuello uterino. 3 mujeres empleadas. 300 kg de material reciclado. Beneficia a mujeres oncológicas y afro.', whatsapp:'573006228289', products:[{name:'Turbante',price:'$22.000',rawPrice:'22000'},{name:'Balaca',price:'$15.000',rawPrice:'15000'},{name:'Gorro de Satín',price:'$25.000',rawPrice:'25000'}]},
  { id:16, name:'Aikon Mobiliario', photo:'https://images.unsplash.com/photo-1541558869434-2840d308329a?w=800&h=400&fit=crop', city:'Medellín', formal:'SÍ', tagline:'Mobiliario escolar, de oficina y cafetería fabricado con materiales reciclados y aleaciones post-consumo.', seals:'Inclusión & Empleo Digno;Jefatura de Hogar;Economía Circular;Producción Limpia', impact:'5 empleos directos en la comuna 15 (desplazados y recicladores). 5 toneladas de desechos evitadas al año. 3.500 sillas y mesas/mes.', whatsapp:'573003551567', products:[{name:'Pupitre y Silla Escolar',price:'$650.000',rawPrice:'650000'},{name:'Silla de Oficina',price:'$180.000',rawPrice:'180000'},{name:'Silla Universitaria',price:'$220.000',rawPrice:'220000'}]},
  { id:17, name:'KUPU Candles', photo:'https://images.unsplash.com/photo-1603218678692-3967d7523bb0?w=800&h=400&fit=crop', city:'Medellín', formal:'NO', tagline:'Velas aromáticas, decorativas e hidratantes para masaje, elaboradas a mano con cera y materiales reciclables.', seals:'Jefatura de Hogar;Cero Plástico;Producción Limpia;Innovación Sostenible', impact:'Nació para trabajar desde casa sin dejar solas a sus hijas. Sustento de una madre cabeza de familia. 150-250 unidades/mes.', whatsapp:'573128314305', products:[{name:'Vela Aromática Mediana',price:'$20.000',rawPrice:'20000'},{name:'Vela Hidratante para Masaje',price:'$30.000',rawPrice:'30000'},{name:'Vela Decorativa con Figuras',price:'$12.000',rawPrice:'12000'}]},
  { id:18, name:'Productos Ecopeques', photo:'https://images.unsplash.com/photo-1552511762-898bfd9fb837?w=800&h=400&fit=crop', city:'Medellín', formal:'SÍ', tagline:'Pañales ecológicos reutilizables para bebés y adultos, con absorbentes intercambiables que ahorran hasta 80%.', seals:'Producción Limpia;Cero Plástico;Bienestar Consciente', impact:'Evita que cada bebé deseche 6.500-7.000 pañales desechables (400+ años en degradarse). Familias ahorran hasta 80%. +1.000 unidades/mes.', whatsapp:'573145848081', products:[{name:'Pañal Ecológico Broches (Bebé)',price:'$82.999',rawPrice:'82999'},{name:'Pañal Ecológico Adulto Talla M',price:'$168.000',rawPrice:'168000'},{name:'Pañal de Piscina para Niños',price:'$57.999',rawPrice:'57999'}]},
  { id:19, name:'De Mentes Pensantes', photo:'https://images.unsplash.com/photo-1646579886741-12b59840c63f?w=800&h=400&fit=crop', city:'Medellín', formal:'SÍ', tagline:'Diseñamos experiencias lúdicas que fortalecen el bienestar, la salud mental y el liderazgo en organizaciones y comunidades.', seals:'Liderazgo Femenino;Bienestar Consciente;Inclusión & Empleo Digno;Economía Circular', impact:'+1.800 personas impactadas mediante festivales y procesos organizacionales en empresas, comunidades e instituciones de Antioquia.', whatsapp:'573146672759', products:[{name:'Festival De Mentes',price:'Desde $1.800.000',rawPrice:'1800000'},{name:'Programa de Bienestar y Salud Mental',price:'Desde $3.800.000',rawPrice:'3800000'},{name:'Línea de Juegos y Dispositivos Lúdicos DMP',price:'Desde $320.000',rawPrice:'320000'}]},
];

function getAll() {
  try {
    const extra = JSON.parse(localStorage.getItem('sentido_extra') || '[]');
    return [...BASE_DATA, ...extra];
  } catch { return [...BASE_DATA]; }
}

function getExtra() {
  try { return JSON.parse(localStorage.getItem('sentido_extra') || '[]'); } catch { return []; }
}

function saveExtra(arr) {
  localStorage.setItem('sentido_extra', JSON.stringify(arr));
}

function getEmpById(id) {
  return getAll().find(e => String(e.id) === String(id));
}

function loadCart() {
  try { return JSON.parse(localStorage.getItem('sentido_cart') || '[]'); } catch { return []; }
}

function saveCart(cartArr) {
  localStorage.setItem('sentido_cart', JSON.stringify(cartArr));
}

function getCartCount() {
  return loadCart().reduce((s, i) => s + (i.qty || 1), 0);
}

// Render nav cart badge on any page that has #cart-count
function syncCartBadge() {
  const el = document.getElementById('cart-count');
  if (!el) return;
  const n = getCartCount();
  el.textContent = n;
  el.classList.toggle('hidden', n === 0);
}
