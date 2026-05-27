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
  certs: string[];
  buyers: number;
  suppliers: number;
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
}
