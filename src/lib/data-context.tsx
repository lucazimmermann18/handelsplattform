'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { MOCK } from '@/lib/mock';
import { isSupabaseConfigured } from '@/lib/supabase/client';
import type { MockData, Supplier, Buyer, Product, Order, Deal, Alert, Task, Document, QualityCheck, InventoryItem, Offer, Complaint, Vessel, Forwarder, Sample, Certification, Regulation, Objective, SupplierNote, FieldVisit, Lot, Communication, ServiceProvider, CalendarEvent, SetupTask, CompanyProfile, BuyerContact, BuyerRequirement } from '@/lib/types';

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
  ...((r.supplier_master ? { supplier_master: r.supplier_master } : {})),
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mapBuyer = (r: any): Buyer => ({
  id: r.id, name: r.name, country: r.country ?? '', city: r.city ?? '',
  industry: r.industry ?? '', contact: r.contact ?? '', position: r.position ?? '',
  email: r.email ?? '', phone: r.phone ?? '', website: r.website,
  interests: r.interests ?? [], moq: r.moq ?? '', certs: r.certs ?? [],
  terms: r.terms ?? '', incoterm: r.incoterm ?? '', rating: r.rating ?? 0,
  status: r.status ?? 'aktiv', revenue: r.revenue ?? 0,
  // Buyer Finder
  pipelineStage: r.pipeline_stage ?? 'recherchiert',
  priority: r.priority ?? 'mittel',
  source: r.source ?? undefined,
  buyerType: r.buyer_type ?? undefined,
  companySize: r.company_size ?? undefined,
  nextFollowUp: r.next_follow_up ?? undefined,
  nextAction: r.next_action ?? undefined,
  fitScore: r.fit_score ?? 0,
  commercialScore: r.commercial_score ?? 0,
  engagementScore: r.engagement_score ?? 0,
  riskScore: r.risk_score ?? 0,
  estimatedVolume: r.estimated_volume ?? undefined,
  ...((r.buyer_master ? { buyerMaster: r.buyer_master } : {})),
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mapBuyerContact = (r: any): BuyerContact => ({
  id: r.id, buyerId: r.buyer_id ?? '',
  firstName: r.first_name ?? undefined, lastName: r.last_name ?? '',
  role: r.role ?? undefined, department: r.department ?? undefined,
  email: r.email ?? undefined, phone: r.phone ?? undefined,
  linkedin: r.linkedin ?? undefined, language: r.language ?? undefined,
  decisionPower: r.decision_power ?? 'niedrig',
  preferredChannel: r.preferred_channel ?? 'email',
  contactQuality: r.contact_quality ?? 'unbekannt',
  lastContactedAt: r.last_contacted_at ?? undefined,
  notes: r.notes ?? undefined, createdAt: r.created_at ?? '',
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mapBuyerRequirement = (r: any): BuyerRequirement => ({
  id: r.id, buyerId: r.buyer_id ?? '',
  productCategory: r.product_category ?? undefined, productId: r.product_id ?? undefined,
  qualityNotes: r.quality_notes ?? undefined,
  quantitySample: r.quantity_sample ?? undefined,
  quantityFirst: r.quantity_first ?? undefined,
  quantityMonthly: r.quantity_monthly ?? undefined,
  targetPriceMin: r.target_price_min ?? undefined,
  targetPriceMax: r.target_price_max ?? undefined,
  currency: r.currency ?? 'EUR',
  incotermPref: r.incoterm_pref ?? undefined,
  deliveryLocation: r.delivery_location ?? undefined,
  paymentTerms: r.payment_terms ?? undefined,
  certRequirements: r.cert_requirements ?? [],
  docRequirements: r.doc_requirements ?? [],
  packagingNotes: r.packaging_notes ?? undefined,
  otherNotes: r.other_notes ?? undefined,
  status: r.status ?? 'offen',
  createdAt: r.created_at ?? '', updatedAt: r.updated_at ?? '',
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mapProduct = (r: any): Product => ({
  id: r.id, name: r.name, cat: r.cat ?? '', origin: r.origin ?? '',
  hs: r.hs ?? '', unit: r.unit ?? '', packaging: r.packaging ?? '',
  moq: r.moq ?? '', buyPrice: r.buy_price ?? 0, sellPrice: r.sell_price ?? 0,
  margin: r.margin ?? 0, exportReady: r.export_ready ?? false,
  variants: r.variants ?? [], qualSpec: r.qual_spec ?? null,
  certs: r.certs ?? [],
  buyers: r.buyers_count ?? 0, suppliers: r.suppliers_count ?? 0,
  eudrStatus: r.eudr_status ?? null,
  eudrCategory: r.eudr_category ?? null,
  productCerts: r.product_certs ?? null,
  importRestrictions: r.import_restrictions ?? null,
  packagingSpec: r.packaging_spec ?? null,
  storageConditions: r.storage_conditions ?? null,
  originRegions: r.origin_regions ?? null,
  harvestSeason: r.harvest_season ?? null,
  linkedSupplierIds: r.linked_supplier_ids ?? null,
  marketPrices: r.market_prices ?? null,
  defaultIncoterms: r.default_incoterms ?? null,
  requiredDocs: r.required_docs ?? null,
  // Product Master (JSONB — passed through as-is for the new PIM UI)
  ...((r.product_master ? { product_master: r.product_master } : {})),
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
  time: r.created_at && !isNaN(new Date(r.created_at).getTime()) ? new Date(r.created_at).toLocaleString('de-DE', { hour: '2-digit', minute: '2-digit' }) : '—',
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mapVessel = (r: any): Vessel => ({
  name: r.name, voyage: r.voyage ?? '', imo: r.imo ?? '', operator: r.operator ?? '',
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mapForwarder = (r: any): Forwarder => ({
  id: r.id, name: r.name, country: r.country ?? '', city: r.city ?? '',
  contact: r.contact ?? '', email: r.email ?? '', phone: r.phone ?? '',
  website: r.website, rating: r.rating ?? 0, routes: r.routes ?? [],
  services: r.services ?? [], status: r.status ?? 'aktiv', notes: r.notes,
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mapSample = (r: any): Sample => ({
  id: r.id, product: r.product ?? '', buyerId: r.buyer_id ?? '',
  qty: r.qty ?? '', supplierId: r.supplier_id ?? '',
  courier: r.courier ?? '', tracking: r.tracking ?? '',
  sent: r.sent_at ?? '', status: r.status ?? '', feedback: r.feedback ?? '',
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mapCertification = (r: any): Certification => ({
  id: String(r.id), name: r.name ?? '', scope: r.scope ?? '',
  status: r.status ?? 'planned', validUntil: r.valid_until ?? undefined,
  startDate: r.start_date ?? undefined, completionDate: r.completion_date ?? undefined,
  cost: r.cost ?? undefined, progress: r.progress ?? undefined,
  priority: r.priority ?? 'medium', rationale: r.rationale ?? '',
  blocker: r.blocker ?? undefined,
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mapRegulation = (r: any): Regulation => ({
  code: r.code ?? '', title: r.title ?? '', products: r.products ?? '',
  deadline: r.deadline ?? '', phase: r.phase ?? 'future',
  impact: r.impact ?? 'medium', readiness: r.readiness ?? 0,
  action: r.action ?? '', cost: r.cost ?? '',
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mapSupplierNote = (r: any): SupplierNote => ({
  id: r.id, supplier_id: r.supplier_id ?? '', author: r.author ?? '',
  content: r.content ?? '', type: r.type ?? 'note',
  created_at: r.created_at ?? '',
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mapFieldVisit = (r: any): FieldVisit => ({
  id: r.id, supplier_id: r.supplier_id ?? '', type: r.type ?? 'Field Visit',
  visit_date: r.visit_date ?? '', inspector: r.inspector ?? '',
  notes: r.notes ?? '', result: r.result ?? 'ausstehend',
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mapLot = (r: any): Lot => ({
  id: r.id, productId: r.product_id ?? '', productName: r.product_name ?? '',
  supplierId: r.supplier_id ?? '', harvestDate: r.harvest_date ?? '',
  processingDate: r.processing_date ?? '', qty: r.qty ?? 0, unit: r.unit ?? '',
  grade: r.grade ?? '', moisture: r.moisture ?? '', status: r.status ?? 'available',
  certRef: r.cert_ref ?? '', linkedOrders: r.linked_order_ids ?? [], notes: r.notes ?? '',
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mapCalendarEvent = (r: any): CalendarEvent => ({
  id: r.id, title: r.title ?? '', date: r.date ?? '',
  endDate: r.end_date ?? undefined, type: r.type ?? 'termin',
  color: r.color ?? undefined, description: r.description ?? undefined,
  owner: r.owner ?? 'Admin', linkedId: r.linked_id ?? undefined,
  linkedType: r.linked_type ?? undefined, allDay: r.all_day ?? true,
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mapServiceProvider = (r: any): ServiceProvider => ({
  id: r.id, companyName: r.company_name ?? '', displayName: r.display_name,
  category: r.category ?? '', subcategory: r.subcategory,
  country: r.country ?? '', city: r.city, region: r.region,
  status: r.status ?? 'lead', riskLevel: r.risk_level ?? 'niedrig',
  criticality: r.criticality ?? 'mittel', website: r.website,
  taxId: r.tax_id, registrationNumber: r.registration_number,
  overallRating: r.overall_rating ?? undefined, notes: r.notes,
  ...((r.provider_master ? { provider_master: r.provider_master } : {})),
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mapSetupTask = (r: any): SetupTask => ({
  id: r.id, section: r.section ?? '', title: r.title ?? '',
  description: r.description ?? undefined, whyImportant: r.why_important ?? undefined,
  required: r.required ?? false,
  priority: r.priority ?? 'mittel',
  phase: r.phase ?? 'setup', status: r.status ?? 'open',
  owner: r.owner ?? undefined, dueDate: r.due_date ?? undefined,
  blockerGoLive: r.blocker_go_live ?? false, blockerFirstDeal: r.blocker_first_deal ?? false,
  evidenceRequired: r.evidence_required ?? undefined, evidenceNotes: r.evidence_notes ?? undefined,
  docQuality: r.doc_quality ?? 'ungeprüft', externalAdvisor: r.external_advisor ?? undefined,
  notes: r.notes ?? undefined, sortOrder: r.sort_order ?? 0,
  createdAt: r.created_at ?? '',
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mapCompanyProfile = (r: any): CompanyProfile => ({
  id: r.id, legalName: r.legal_name ?? undefined, tradeName: r.trade_name ?? undefined,
  legalForm: r.legal_form ?? undefined, businessModel: r.business_model ?? undefined,
  businessPurpose: r.business_purpose ?? undefined, currentPhase: r.current_phase ?? 'idee',
  eoriNumber: r.eori_number ?? undefined, taxNumber: r.tax_number ?? undefined,
  vatId: r.vat_id ?? undefined, commercialRegisterNumber: r.commercial_register_number ?? undefined,
  foundingDate: r.founding_date ?? undefined, managingDirectors: r.managing_directors ?? undefined,
  website: r.website ?? undefined, notes: r.notes ?? undefined,
  profileData: r.profile_data ?? undefined,
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mapCommunication = (r: any): Communication => ({
  id: r.id, contactId: r.contact_id ?? '', contactType: r.contact_type ?? 'buyer',
  type: r.type ?? 'note', direction: r.direction ?? 'internal',
  date: r.date ?? '', subject: r.subject ?? '',
  body: r.body ?? '', author: r.author ?? '',
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
    { data: forwardersRaw },
    { data: samplesRaw },
    { data: certsRaw },
    { data: regsRaw },
    { data: okrsRaw },
    { data: krsRaw },
    { data: notesRaw },
    { data: visitsRaw },
    { data: lotsRaw },
    { data: commsRaw },
    { data: serviceProvidersRaw },
    { data: calendarEventsRaw },
    { data: setupTasksRaw },
    { data: companyProfileRaw },
    { data: buyerContactsRaw },
    { data: buyerRequirementsRaw },
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
    sb.from('forwarders').select('*').order('name'),
    sb.from('samples').select('*').order('created_at', { ascending: false }),
    sb.from('certifications').select('*').order('sort_order, created_at'),
    sb.from('regulations').select('*').order('sort_order, created_at'),
    sb.from('okrs').select('*').order('created_at'),
    sb.from('key_results').select('*').order('sort_order, created_at'),
    sb.from('supplier_notes').select('*').order('created_at'),
    sb.from('field_visits').select('*').order('visit_date', { ascending: false }),
    sb.from('lots').select('*').order('harvest_date', { ascending: false }),
    sb.from('communications').select('*').order('date', { ascending: false }),
    sb.from('service_providers').select('*').order('company_name'),
    sb.from('calendar_events').select('*').order('date'),
    sb.from('setup_tasks').select('*').order('sort_order, created_at'),
    sb.from('company_profile').select('*').limit(1),
    sb.from('buyer_contacts').select('*').order('last_name'),
    sb.from('buyer_requirements').select('*').order('created_at', { ascending: false }),
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
    lots:          (lotsRaw  ?? []).map(mapLot),
    communications: (commsRaw ?? []).map(mapCommunication),
    revTrend:   (revTrendRaw ?? []).map((r: { month: string; expected: number; actual: number; margin: number }) => ({
      m: r.month, exp: r.expected, real: r.actual, margin: r.margin,
    })),
    forwarders:    (forwardersRaw ?? []).map(mapForwarder),
    samples:       (samplesRaw    ?? []).map(mapSample),
    certifications:(certsRaw      ?? []).map(mapCertification),
    regulations:   (regsRaw       ?? []).map(mapRegulation),
    objectives:    (okrsRaw ?? []).map((o: { id: string; title: string; why: string; owner: string }) => ({
      id: o.id, title: o.title, why: o.why ?? '', owner: o.owner ?? '',
      krs: (krsRaw ?? [])
        .filter((kr: { okr_id: string }) => kr.okr_id === o.id)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .map((kr: any): import('@/lib/types').KeyResult => ({
          id: kr.id, text: kr.text, cur: Number(kr.cur),
          target: Number(kr.target), unit: kr.unit ?? '%',
        })),
    } satisfies Objective)),
    supplierNotes:    (notesRaw            ?? []).map(mapSupplierNote),
    fieldVisits:      (visitsRaw           ?? []).map(mapFieldVisit),
    serviceProviders:  (serviceProvidersRaw ?? []).map(mapServiceProvider),
    calendarEvents:    (calendarEventsRaw   ?? []).map(mapCalendarEvent),
    setupTasks:        (setupTasksRaw       ?? []).map(mapSetupTask),
    companyProfile:    companyProfileRaw?.[0] ? mapCompanyProfile(companyProfileRaw[0]) : null,
    buyerContacts:     (buyerContactsRaw     ?? []).map(mapBuyerContact),
    buyerRequirements: (buyerRequirementsRaw ?? []).map(mapBuyerRequirement),
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
