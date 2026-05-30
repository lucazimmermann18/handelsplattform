// TypeScript interfaces for EastAfrica Export OS

export interface Port {
  code: string;
  name: string;
  country: string;
  lat: number;
  lng: number;
}

export interface ProductVariant {
  v: string;
  grade: string;
  stock: number;
}

export interface ProductQcRow {
  p: string;
  min: string;
  tgt: string;
  max: string;
  eu: string;
}

export interface ProductCert {
  name: string;
  issuer: string;
  certNo: string;
  validUntil: string;
}

export interface ImportRestriction {
  country: string;
  requirement: string;
  mandatory: boolean;
}

export interface ProductPackaging {
  bagType: string;
  fillWeight: string;
  palletizing: string;
  fcl20: string;
  fcl40: string;
}

export interface ProductStorage {
  tempRange: string;
  humidity: string;
  shelfLife: string;
  notes: string;
}

export interface OriginRegion {
  country: string;
  region: string;
  share: string;
}

export interface MarketPrice {
  market: string;
  price: string;
  currency: string;
  incoterm: string;
  validUntil: string;
}

export interface RequiredDoc {
  docType: string;
  markets: string;
  mandatory: boolean;
  notes: string;
}

export interface Supplier {
  id: string;
  name: string;
  type: string;
  country: string;
  region: string;
  city: string;
  contact: string;
  phone: string;
  email: string;
  whatsapp?: string;
  language?: string;
  capacity: string;
  tier: 'A' | 'B' | 'C';
  score: number;
  rel: number;
  qual: number;
  comm: number;
  price: number;
  docs: number;
  risk: 'niedrig' | 'mittel' | 'hoch';
  certs: string[];
  products: string[];
  lastDelivery: string;
  status: string;
  supplier_master?: Record<string, unknown>;
}

export interface Product {
  id: string;
  name: string;
  cat: string;
  origin: string;
  hs: string;
  unit: string;
  packaging: string;
  moq: string;
  buyPrice: number;
  sellPrice: number;
  margin: number;
  exportReady: boolean;
  variants: ProductVariant[];
  qualSpec?: ProductQcRow[] | null;
  certs: string[];
  buyers: number;
  suppliers: number;
  // Zoll & Regulatorik
  eudrStatus?: 'relevant' | 'nicht_relevant' | 'unklar' | null;
  eudrCategory?: string | null;
  productCerts?: ProductCert[] | null;
  importRestrictions?: ImportRestriction[] | null;
  // Logistik & Verpackung
  packagingSpec?: ProductPackaging | null;
  storageConditions?: ProductStorage | null;
  // Herkunft & Beschaffung
  originRegions?: OriginRegion[] | null;
  harvestSeason?: string | null;
  linkedSupplierIds?: string[] | null;
  // Preise & Konditionen
  marketPrices?: MarketPrice[] | null;
  defaultIncoterms?: string[] | null;
  // Pflichtdokumente
  requiredDocs?: RequiredDoc[] | null;
}

export interface Buyer {
  id: string;
  name: string;
  country: string;
  city: string;
  industry: string;
  contact: string;
  position: string;
  email: string;
  phone: string;
  website?: string;
  interests: string[];
  moq: string;
  certs: string[];
  terms: string;
  incoterm: string;
  rating: number;
  status: string;
  revenue: number;
  // Buyer Finder fields
  pipelineStage?: string;
  priority?: string;
  source?: string;
  buyerType?: string;
  companySize?: string;
  nextFollowUp?: string;
  nextAction?: string;
  fitScore?: number;
  commercialScore?: number;
  engagementScore?: number;
  riskScore?: number;
  estimatedVolume?: string;
  buyerMaster?: Record<string, unknown>;
}

export interface BuyerContact {
  id: string;
  buyerId: string;
  firstName?: string;
  lastName: string;
  role?: string;
  department?: string;
  email?: string;
  phone?: string;
  linkedin?: string;
  language?: string;
  decisionPower: 'niedrig' | 'mittel' | 'hoch' | 'entscheidend';
  preferredChannel: string;
  contactQuality: 'sicher' | 'wahrscheinlich' | 'unklar' | 'ungültig' | 'unbekannt';
  lastContactedAt?: string;
  notes?: string;
  createdAt: string;
}

export interface BuyerRequirement {
  id: string;
  buyerId: string;
  productCategory?: string;
  productId?: string;
  qualityNotes?: string;
  quantitySample?: string;
  quantityFirst?: string;
  quantityMonthly?: string;
  targetPriceMin?: number;
  targetPriceMax?: number;
  currency: string;
  incotermPref?: string;
  deliveryLocation?: string;
  paymentTerms?: string;
  certRequirements: string[];
  docRequirements: string[];
  packagingNotes?: string;
  otherNotes?: string;
  status: 'offen' | 'teilweise' | 'vollständig';
  createdAt: string;
  updatedAt: string;
}

export interface Vessel {
  name: string;
  voyage: string;
  imo: string;
  operator: string;
}

export interface Order {
  id: string;
  buyerId: string;
  productId: string;
  productVariant: string;
  supplierId: string;
  qty: number;
  unit: string;
  batch: string;
  buyPrice: number;
  sellPrice: number;
  revenue: number;
  costGoods: number;
  costLogistics: number;
  costDocs: number;
  profit: number;
  incoterm: string;
  portLoad: string;
  portDest: string;
  status: string;
  statusKey: string;
  etd: string;
  eta: string;
  created: string;
  responsible: string;
  vesselIdx: number;
  paid: number;
  progressPct?: number;
  problem?: string;
}

export interface Deal {
  id: string;
  buyerId: string;
  productId: string;
  qty: number;
  targetPrice: number;
  ourPrice: number;
  value: number;
  stage: string;
  prob: number;
  nextFollow: string;
  created: string;
}

export interface Alert {
  sev: 'r' | 'w' | 'i';
  t: string;
  m: string;
  time: string;
  kind: string;
}

export interface Task {
  id: string;
  t: string;
  order: string;
  owner: string;
  prio: 'hoch' | 'mittel' | 'niedrig';
  due: string;
  status: string;
}

export interface Document {
  id: string;
  name: string;
  type: string;
  order: string | null;
  status: string;
  issued: string | null;
  expires: string | null;
  size: string;
}

export interface QualityCheck {
  id: string;
  batch: string;
  product: string;
  supplier: string;
  date: string;
  moisture?: string;
  purity?: string;
  foreign?: string;
  oil?: string;
  lab: string;
  inspector: string;
  status: string;
  grade: string;
  notes: string;
  cup?: number;
  dryMatter?: string;
  firmness?: string;
  defects?: string;
  temp?: string;
  pH?: string;
  microb?: string;
}

export interface InventoryItem {
  product: string;
  qty: number;
  unit: string;
  location: string;
  status: string;
  batch: string;
  received: string;
}

export interface Offer {
  id: string;
  buyer: string;
  product: string;
  qty: number;
  price: number;
  value: number;
  status: string;
  valid: string | null;
  sent: string | null;
}

export interface Complaint {
  id: string;
  order: string;
  buyer: string;
  cat: string;
  sev: string;
  t: string;
  owner: string;
  status: string;
  opened: string;
  impact: string;
}

export interface RevTrendEntry {
  m: string;
  exp: number;
  real: number;
  margin: number;
}

export type StatusBadgeMap = Record<string, string>;

export interface Forwarder {
  id: string; name: string; country: string; city: string;
  contact: string; email: string; phone: string; website?: string;
  rating: number; routes: string[]; services: string[];
  status: string; notes?: string;
}

export interface Sample {
  id: string; product: string; buyerId: string; qty: string;
  supplierId: string; courier: string; tracking: string;
  sent: string; status: string; feedback: string;
}

export interface Certification {
  id: string; name: string; scope: string; status: string;
  validUntil?: string; startDate?: string; completionDate?: string;
  cost?: string; progress?: number; priority: string;
  rationale: string; blocker?: string;
}

export interface Regulation {
  code: string; title: string; products: string; deadline: string;
  phase: string; impact: string; readiness: number; action: string; cost: string;
}

export interface KeyResult {
  id: string; text: string; cur: number; target: number; unit: string;
}

export interface Objective {
  id: string; title: string; why: string; owner: string; krs: KeyResult[];
}

export interface SupplierNote {
  id: string; supplier_id: string; author: string;
  content: string; type: string; created_at: string;
}

export interface FieldVisit {
  id: string; supplier_id: string; type: string;
  visit_date: string; inspector: string; notes: string; result: string;
}

export interface Lot {
  id: string;
  productId: string;
  productName: string;
  supplierId: string;
  harvestDate: string;
  processingDate: string;
  qty: number;
  unit: string;
  grade: string;
  moisture: string;
  status: 'available' | 'reserved' | 'shipped' | 'consumed';
  certRef: string;
  linkedOrders: string[];
  notes: string;
}

export interface Communication {
  id: string;
  contactId: string;
  contactType: 'buyer' | 'supplier';
  type: 'email' | 'call' | 'meeting' | 'note' | 'whatsapp';
  direction: 'in' | 'out' | 'internal';
  date: string;
  subject: string;
  body: string;
  author: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  endDate?: string;
  type: string;
  color?: string;
  description?: string;
  owner: string;
  linkedId?: string;
  linkedType?: string;
  allDay: boolean;
}

export interface ServiceProvider {
  id: string;
  companyName: string;
  displayName?: string;
  category: string;
  subcategory?: string;
  country: string;
  city?: string;
  region?: string;
  status: string;
  riskLevel: string;
  criticality: string;
  website?: string;
  taxId?: string;
  registrationNumber?: string;
  overallRating?: number;
  notes?: string;
  provider_master?: Record<string, unknown>;
}

export interface SetupTask {
  id: string;
  section: string;
  title: string;
  description?: string;
  whyImportant?: string;
  required: boolean;
  priority: 'kritisch' | 'hoch' | 'mittel' | 'niedrig';
  phase: string;
  status: 'open' | 'in_progress' | 'submitted' | 'waiting' | 'done' | 'not_relevant';
  owner?: string;
  dueDate?: string;
  blockerGoLive: boolean;
  blockerFirstDeal: boolean;
  evidenceRequired?: string;
  evidenceNotes?: string;
  docQuality: string;
  externalAdvisor?: string;
  notes?: string;
  sortOrder: number;
  createdAt: string;
}

export interface CompanyProfile {
  id: string;
  legalName?: string;
  tradeName?: string;
  legalForm?: string;
  businessModel?: string;
  businessPurpose?: string;
  currentPhase: string;
  eoriNumber?: string;
  taxNumber?: string;
  vatId?: string;
  commercialRegisterNumber?: string;
  foundingDate?: string;
  managingDirectors?: string;
  website?: string;
  notes?: string;
  profileData?: Record<string, unknown>;
}

export interface HarvestCalendar {
  id: string;
  productId: string;
  originCountry: string;
  harvestMonths: number[];      // 1-12
  processingWeeks: number;
  exportStartMonth: number;     // 1-12
  exportEndMonth: number;       // 1-12
  processingTypes: string[];
  typicalQtyMt: number | null;
  priceIndex: Record<string, number> | null;  // {"1":100,...}
  notes: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface TeamProfile {
  id: string;
  email: string;
  displayName: string;
  role: string;
  avatarColor: string;
  createdAt: string;
}

export interface TeamMeeting {
  id: string;
  title: string;
  meetingType: string;   // 'weekly' | 'strategy' | 'customer' | 'supplier' | 'other'
  scheduledAt: string;   // ISO timestamp
  durationMinutes: number;
  location: string;
  attendeeIds: string[]; // profile UUIDs
  agenda: string;
  status: string;        // 'planned' | 'completed' | 'cancelled'
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface MeetingNotes {
  id: string;
  meetingId: string;
  content: string;
  decisions: string[];
  updatedBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ActionItem {
  id: string;
  meetingId: string | null;
  title: string;
  description: string;
  assigneeId: string | null;   // profile UUID
  dueDate: string | null;
  priority: string;            // 'high' | 'medium' | 'low'
  status: string;              // 'open' | 'in_progress' | 'done' | 'cancelled'
  sortOrder: number;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ActionItemUpdate {
  id: string;
  actionItemId: string;
  content: string;
  authorId: string | null;
  authorName: string;
  createdAt: string;
}

export interface MockData {
  suppliers: Supplier[];
  buyers: Buyer[];
  products: Product[];
  orders: Order[];
  deals: Deal[];
  alerts: Alert[];
  tasks: Task[];
  documents: Document[];
  quality: QualityCheck[];
  inventory: InventoryItem[];
  offers: Offer[];
  complaints: Complaint[];
  vessels: Vessel[];
  ports: Record<string, Port>;
  forwarders: Forwarder[];
  samples: Sample[];
  certifications: Certification[];
  regulations: Regulation[];
  objectives: Objective[];
  supplierNotes: SupplierNote[];
  fieldVisits: FieldVisit[];
  statusBadge: StatusBadgeMap;
  dealStages: string[];
  revTrend: RevTrendEntry[];
  todayBase: Date;
  lots: Lot[];
  communications: Communication[];
  serviceProviders: ServiceProvider[];
  calendarEvents: CalendarEvent[];
  setupTasks: SetupTask[];
  companyProfile: CompanyProfile | null;
  buyerContacts: BuyerContact[];
  buyerRequirements: BuyerRequirement[];
  harvestCalendar: HarvestCalendar[];
  profiles: TeamProfile[];
  teamMeetings: TeamMeeting[];
  meetingNotes: MeetingNotes[];
  actionItems: ActionItem[];
  actionItemUpdates: ActionItemUpdate[];
}
