/**
 * Seed script — populates Supabase with initial data from mock.ts
 * Run: npx tsx supabase/seed.ts
 */
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { MOCK } from '../src/lib/mock';

config({ path: '.env.local' });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error('❌  Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const sb = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });

async function upsert(table: string, rows: Record<string, unknown>[]) {
  const { error } = await sb.from(table).upsert(rows, { onConflict: 'id' });
  if (error) throw new Error(`${table}: ${error.message}`);
  console.log(`  ✓  ${table} (${rows.length} rows)`);
}

async function seed() {
  console.log('\n🌱  Seeding EastAfrica Export OS database…\n');

  // 1. Ports
  await upsert('ports', Object.entries(MOCK.ports).map(([key, p]) => ({
    key, code: p.code, name: p.name, country: p.country, lat: p.lat, lng: p.lng,
  })));

  // 2. Vessels
  const { error: vErr } = await sb.from('vessels').upsert(
    MOCK.vessels.map((v, i) => ({ idx: i, name: v.name, voyage: v.voyage, imo: v.imo, operator: v.operator })),
    { onConflict: 'idx' }
  );
  if (vErr) throw new Error(`vessels: ${vErr.message}`);
  console.log(`  ✓  vessels (${MOCK.vessels.length} rows)`);

  // 3. Suppliers
  await upsert('suppliers', MOCK.suppliers.map(s => ({
    id: s.id, name: s.name, type: s.type, country: s.country, region: s.region, city: s.city,
    contact: s.contact, phone: s.phone, email: s.email, whatsapp: s.whatsapp ?? null,
    language: s.language ?? null, capacity: s.capacity, tier: s.tier, score: s.score,
    rel: s.rel, qual: s.qual, comm: s.comm, price: s.price, docs: s.docs, risk: s.risk,
    certs: s.certs, products: s.products, last_delivery: s.lastDelivery, status: s.status,
  })));

  // 4. Buyers
  await upsert('buyers', MOCK.buyers.map(b => ({
    id: b.id, name: b.name, country: b.country, city: b.city, industry: b.industry,
    contact: b.contact, position: b.position, email: b.email, phone: b.phone,
    website: b.website ?? null, interests: b.interests, moq: b.moq, certs: b.certs,
    terms: b.terms, incoterm: b.incoterm, rating: b.rating, status: b.status, revenue: b.revenue,
  })));

  // 5. Products
  await upsert('products', MOCK.products.map(p => ({
    id: p.id, name: p.name, cat: p.cat, origin: p.origin, hs: p.hs, unit: p.unit,
    packaging: p.packaging, moq: p.moq, buy_price: p.buyPrice, sell_price: p.sellPrice,
    margin: p.margin, export_ready: p.exportReady, variants: p.variants, certs: p.certs,
    buyers_count: p.buyers, suppliers_count: p.suppliers,
  })));

  // 6. Orders
  await upsert('orders', MOCK.orders.map(o => ({
    id: o.id, buyer_id: o.buyerId, product_id: o.productId, supplier_id: o.supplierId,
    product_variant: o.productVariant, qty: o.qty, unit: o.unit, batch: o.batch,
    buy_price: o.buyPrice, sell_price: o.sellPrice, revenue: o.revenue,
    cost_goods: o.costGoods, cost_logistics: o.costLogistics, cost_docs: o.costDocs,
    profit: o.profit, incoterm: o.incoterm, port_load: o.portLoad, port_dest: o.portDest,
    status: o.status, status_key: o.statusKey, etd: o.etd, eta: o.eta,
    paid: o.paid, progress_pct: o.progressPct ?? null, problem: o.problem ?? null,
    vessel_idx: o.vesselIdx, responsible: o.responsible, created_at: o.created,
  })));

  // 7. Deals
  await upsert('deals', MOCK.deals.map(d => ({
    id: d.id, buyer_id: d.buyerId, product_id: d.productId, qty: d.qty,
    target_price: d.targetPrice, our_price: d.ourPrice, value: d.value,
    stage: d.stage, prob: d.prob, next_follow: d.nextFollow, created_at: d.created,
  })));

  // 8. Offers
  await upsert('offers', MOCK.offers.map(o => ({
    id: o.id, buyer_id: o.buyer, product_id: o.product, qty: o.qty,
    price: o.price, value: o.value, status: o.status,
    valid_until: o.valid ?? null, sent_at: o.sent ?? null,
  })));

  // 9. Quality checks
  await upsert('quality_checks', MOCK.quality.map(q => ({
    id: q.id, batch: q.batch, product: q.product, supplier_id: q.supplier,
    check_date: q.date, moisture: q.moisture ?? null, purity: q.purity ?? null,
    foreign_matter: q.foreign ?? null, oil: q.oil ?? null, cup: q.cup ?? null,
    dry_matter: q.dryMatter ?? null, firmness: q.firmness ?? null, defects: q.defects ?? null,
    temp: q.temp ?? null, ph: q.pH ?? null, microb: q.microb ?? null,
    lab: q.lab, inspector: q.inspector, status: q.status, grade: q.grade, notes: q.notes,
  })));

  // 10. Documents
  await upsert('documents', MOCK.documents.map(d => ({
    id: d.id, name: d.name, type: d.type, order_id: d.order ?? null,
    status: d.status, issued_at: d.issued ?? null, expires_at: d.expires ?? null,
    file_size: d.size,
  })));

  // 11. Tasks
  await upsert('tasks', MOCK.tasks.map(t => ({
    id: t.id, title: t.t, order_id: t.order ?? null, owner: t.owner,
    priority: t.prio, due_date: t.due, status: t.status,
  })));

  // 12. Complaints
  await upsert('complaints', MOCK.complaints.map(c => ({
    id: c.id, order_id: c.order ?? null, buyer_id: c.buyer ?? null,
    category: c.cat, severity: c.sev, title: c.t, owner: c.owner,
    status: c.status, opened_at: c.opened, impact: c.impact,
  })));

  // 13. Inventory (no string ID in mock — use batch+product as unique key)
  const { error: invErr } = await sb.from('inventory').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  if (!invErr) {
    const { error: invInsErr } = await sb.from('inventory').insert(MOCK.inventory.map(i => ({
      product: i.product, qty: i.qty, unit: i.unit, location: i.location,
      status: i.status, batch: i.batch, received_at: i.received,
    })));
    if (invInsErr) throw new Error(`inventory: ${invInsErr.message}`);
    console.log(`  ✓  inventory (${MOCK.inventory.length} rows)`);
  }

  // 14. Alerts
  const { error: alertDelErr } = await sb.from('alerts').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  if (!alertDelErr) {
    const { error: alertInsErr } = await sb.from('alerts').insert(MOCK.alerts.map(a => ({
      sev: a.sev, title: a.t, message: a.m, kind: a.kind,
    })));
    if (alertInsErr) throw new Error(`alerts: ${alertInsErr.message}`);
    console.log(`  ✓  alerts (${MOCK.alerts.length} rows)`);
  }

  // 15. Revenue trend
  const { error: rtDelErr } = await sb.from('rev_trend').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  if (!rtDelErr) {
    const { error: rtInsErr } = await sb.from('rev_trend').insert(MOCK.revTrend.map(r => ({
      month: r.m, expected: r.exp, actual: r.real, margin: r.margin,
    })));
    if (rtInsErr) throw new Error(`rev_trend: ${rtInsErr.message}`);
    console.log(`  ✓  rev_trend (${MOCK.revTrend.length} rows)`);
  }

  console.log('\n✅  Seed complete!\n');
}

seed().catch((err) => {
  console.error('\n❌  Seed failed:', err.message);
  process.exit(1);
});
