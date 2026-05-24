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
  statusBadge: StatusBadgeMap;
  dealStages: string[];
  revTrend: RevTrendEntry[];
  todayBase: Date;
}
