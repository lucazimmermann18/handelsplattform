'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { MOCK } from '@/lib/mock';
import { isSupabaseConfigured } from '@/lib/supabase/client';
import type { MockData, Supplier, Buyer, Product, Order, Deal, Alert, Task, Document, QualityCheck, InventoryItem, Offer, Complaint, Vessel } from '@/lib/types';

// ─── DB Row → TypeScript interface mappers ────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mapSupplier = (r: any): Supplier => ({
  id: r.id, name: r.name, type: r.type ?? '', country: r.country ?? '',
  region: r.region ?? '', city: r.city ?? '', contact: r.contact ?? '',
  phone: r.phone ?? '', email: r.email ?? '', whatsapp: r.whatsapp,
  language: r.language, capacity: r.capacity ?? '', tier: r.tier,
  score: r.score ?? 0, rel: r.rel ?? 0, qual: r.qual ?? 0,
  comm: r.comm ?? 0, price: r.price ?? 0, docs: r.docs ?? 0,
  risk: r.risk ?? 'niedrig', certs: r.certs ?? [], products: r.products ?? [],
  lastDelivery: r.last_delivery ?? '', status: r.status ?? 'aktiv',
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mapBuyer = (r: any): Buyer => ({
  id: r.id, name: r.name, country: r.country ?? '', city: r.city ?? '',
  industry: r.industry ?? '', contact: r.contact ?? '', position: r.position ?? '',
  email: r.email ?? '', phone: r.phone ?? '', website: r.website,
  interests: r.interests ?? [], moq: r.moq ?? '', certs: r.certs ?? [],
  terms: r.terms ?? '', incoterm: r.incoterm ?? '', rating: r.rating ?? 0,
  status: r.status ?? 'aktiv', revenue: r.revenue ?? 0,
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mapProduct = (r: any): Product => ({
  id: r.id, name: r.name, cat: r.cat ?? '', origin: r.origin ?? '',
  hs: r.hs ?? '', unit: r.unit ?? '', packaging: r.packaging ?? '',
  moq: r.moq ?? '', buyPrice: r.buy_price ?? 0, sellPrice: r.sell_price ?? 0,
  margin: r.margin ?? 0, exportReady: r.export_ready ?? false,
  variants: r.variants ?? [], certs: r.certs ?? [],
  buyers: r.buyers_count ?? 0, suppliers: r.suppliers_count ?? 0,
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mapOrder = (r: any): Order => ({
  id: r.id, buyerId: r.buyer_id ?? '', productId: r.product_id ?? '',
  productVariant: r.product_variant ?? '', supplierId: r.supplier_id ?? '',
  qty: r.qty ?? 0, unit: r.unit ?? '', batch: r.batch ?? '',
  buyPrice: r.buy_price ?? 0, sellPrice: r.sell_price ?? 0,
  revenue: r.revenue ?? 0, costGoods: r.cost_goods ?? 0,
  costLogistics: r.cost_logistics ?? 0, costDocs: r.cost_docs ?? 0,
  profit: r.profit ?? 0, incoterm: r.incoterm ?? '',
  portLoad: r.port_load ?? '', portDest: r.port_dest ?? '',
  status: r.status ?? '', statusKey: r.status_key ?? '',
  etd: r.etd ?? '', eta: r.eta ?? '',
  created: r.created_at?.slice(0, 10) ?? '',
  responsible: r.responsible ?? '', vesselIdx: r.vessel_idx ?? 0,
  paid: r.paid ?? 0, progressPct: r.progress_pct ?? undefined,
  problem: r.problem ?? undefined,
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mapDeal = (r: any): Deal => ({
  id: r.id, buyerId: r.buyer_id ?? '', productId: r.product_id ?? '',
  qty: r.qty ?? 0, targetPrice: r.target_price ?? 0, ourPrice: r.our_price ?? 0,
  value: r.value ?? 0, stage: r.stage ?? '', prob: r.prob ?? 0,
  nextFollow: r.next_follow ?? '', created: r.created_at?.slice(0, 10) ?? '',
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mapOffer = (r: any): Offer => ({
  id: r.id, buyer: r.buyer_id ?? '', product: r.product_id ?? '',
  qty: r.qty ?? 0, price: r.price ?? 0, value: r.value ?? 0,
  status: r.status ?? 'draft', valid: r.valid_until ?? null, sent: r.sent_at ?? null,
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mapQuality = (r: any): QualityCheck => ({
  id: r.id, batch: r.batch ?? '', product: r.product ?? '', supplier: r.supplier_id ?? '',
  date: r.check_date ?? '', moisture: r.moisture, purity: r.purity,
  foreign: r.foreign_matter, oil: r.oil, cup: r.cup, dryMatter: r.dry_matter,
  firmness: r.firmness, defects: r.defects, temp: r.temp, pH: r.ph, microb: r.microb,
  lab: r.lab ?? '', inspector: r.inspector ?? '', status: r.status ?? '',
  grade: r.grade ?? '', notes: r.notes ?? '',
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mapDocument = (r: any): Document => ({
  id: r.id, name: r.name, type: r.type ?? '', order: r.order_id ?? null,
  status: r.status ?? '', issued: r.issued_at ?? null, expires: r.expires_at ?? null,
  size: r.file_size ?? '—',
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mapTask = (r: any): Task => ({
  id: r.id, t: r.title, order: r.order_id ?? '', owner: r.owner ?? '',
  prio: r.priority ?? 'mittel', due: r.due_date ?? '', status: r.status ?? 'offen',
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mapComplaint = (r: any): Complaint => ({
  id: r.id, order: r.order_id ?? '', buyer: r.buyer_id ?? '',
  cat: r.category ?? '', sev: r.severity ?? '', t: r.title ?? '',
  owner: r.owner ?? '', status: r.status ?? '', opened: r.opened_at ?? '',
  impact: r.impact ?? '',
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mapInventory = (r: any): InventoryItem => ({
  product: r.product, qty: r.qty ?? 0, unit: r.unit ?? '',
  location: r.location ?? '', status: r.status ?? '',
  batch: r.batch ?? '', received: r.received_at ?? '',
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mapAlert = (r: any): Alert => ({
  sev: r.sev, t: r.title, m: r.message ?? '', kind: r.kind ?? '',
  time: new Date(r.created_at).toLocaleString('de-DE', { hour: '2-digit', minute: '2-digit' }),
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mapVessel = (r: any): Vessel => ({
  name: r.name, voyage: r.voyage ?? '', imo: r.imo ?? '', operator: r.operator ?? '',
});

// ─── Context ─────────────────────────────────────────────────────────────────

interface DataContextType {
  data: MockData | null;
  loading: boolean;
  error: string | null;
  isConnected: boolean;
  lastSync: Date | null;
  supabaseUrl: string | null;
  refresh: () => void;
}

const DataContext = createContext<DataContextType>({
  data: null, loading: true, error: null,
  isConnected: false, lastSync: null, supabaseUrl: null,
  refresh: () => {},
});

async function fetchAllData(): Promise<MockData> {
  const { createClient } = await import('@/lib/supabase/client');
  const sb = createClient();

  const [
    { data: suppliersRaw },
    { data: buyersRaw },
    { data: productsRaw },
    { data: ordersRaw },
    { data: dealsRaw },
    { data: offersRaw },
    { data: qualityRaw },
    { data: documentsRaw },
    { data: tasksRaw },
    { data: complaintsRaw },
    { data: inventoryRaw },
    { data: alertsRaw },
    { data: revTrendRaw },
    { data: vesselsRaw },
    { data: portsRaw },
  ] = await Promise.all([
    sb.from('suppliers').select('*').order('name'),
    sb.from('buyers').select('*').order('name'),
    sb.from('products').select('*').order('name'),
    sb.from('orders').select('*').order('created_at', { ascending: false }),
    sb.from('deals').select('*').order('created_at', { ascending: false }),
    sb.from('offers').select('*').order('created_at', { ascending: false }),
    sb.from('quality_checks').select('*').order('check_date', { ascending: false }),
    sb.from('documents').select('*').order('created_at', { ascending: false }),
    sb.from('tasks').select('*').order('due_date'),
    sb.from('complaints').select('*').order('opened_at', { ascending: false }),
    sb.from('inventory').select('*').order('product'),
    sb.from('alerts').select('*').order('created_at', { ascending: false }),
    sb.from('rev_trend').select('*'),
    sb.from('vessels').select('*').order('idx'),
    sb.from('ports').select('*'),
  ]);

  const ports: MockData['ports'] = {};
  (portsRaw ?? []).forEach((p: { key: string; code: string; name: string; country: string; lat: number; lng: number }) => {
    ports[p.key] = { code: p.code, name: p.name, country: p.country, lat: p.lat, lng: p.lng };
  });

  return {
    suppliers:  (suppliersRaw  ?? []).map(mapSupplier),
    buyers:     (buyersRaw     ?? []).map(mapBuyer),
    products:   (productsRaw   ?? []).map(mapProduct),
    orders:     (ordersRaw     ?? []).map(mapOrder),
    deals:      (dealsRaw      ?? []).map(mapDeal),
    offers:     (offersRaw     ?? []).map(mapOffer),
    quality:    (qualityRaw    ?? []).map(mapQuality),
    documents:  (documentsRaw  ?? []).map(mapDocument),
    tasks:      (tasksRaw      ?? []).map(mapTask),
    complaints: (complaintsRaw ?? []).map(mapComplaint),
    inventory:  (inventoryRaw  ?? []).map(mapInventory),
    alerts:     (alertsRaw     ?? []).map(mapAlert),
    vessels:    (vesselsRaw    ?? []).map(mapVessel),
    ports,
    revTrend:   (revTrendRaw ?? []).map((r: { month: string; expected: number; actual: number; margin: number }) => ({
      m: r.month, exp: r.expected, real: r.actual, margin: r.margin,
    })),
    // Static data that doesn't change
    statusBadge: MOCK.statusBadge,
    dealStages:  MOCK.dealStages,
    todayBase:   new Date(),
  };
}

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<MockData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? null;

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (!isSupabaseConfigured()) {
        setError('Supabase nicht konfiguriert — bitte NEXT_PUBLIC_SUPABASE_URL und NEXT_PUBLIC_SUPABASE_ANON_KEY setzen.');
        setIsConnected(false);
        setData(null);
        return;
      }
      const result = await fetchAllData();
      setData(result);
      setIsConnected(true);
      setLastSync(new Date());
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Datenbankfehler';
      console.error('[DataContext] load error:', msg);
      setError(msg);
      setIsConnected(false);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <DataContext.Provider value={{ data, loading, error, isConnected, lastSync, supabaseUrl, refresh: load }}>
      {children}
    </DataContext.Provider>
  );
}

export const useData = () => useContext(DataContext);
