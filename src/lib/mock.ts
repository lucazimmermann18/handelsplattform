// Mock data for EastAfrica Export OS
import type {
  Supplier, Buyer, Product, Order, Deal, Alert, Task,
  Document, QualityCheck, InventoryItem, Offer, Complaint,
  Vessel, Port, RevTrendEntry, StatusBadgeMap, MockData, Lot, Communication,
  ServiceProvider, CalendarEvent, SetupTask, CompanyProfile,
  BuyerContact, BuyerRequirement,
} from './types';

const todayBase = new Date('2026-05-24T10:00:00Z');
const daysAgo = (n: number): string => { const d = new Date(todayBase); d.setDate(d.getDate() - n); return d.toISOString().slice(0, 10); };
const daysFromNow = (n: number): string => { const d = new Date(todayBase); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); };

const ports: Record<string, Port> = {
  DAR: { code: 'TZDAR', name: 'Dar es Salaam', country: 'TZ', lat: -6.82, lng: 39.28 },
  MOM: { code: 'KEMOM', name: 'Mombasa', country: 'KE', lat: -4.05, lng: 39.66 },
  JIB: { code: 'DJJIB', name: 'Djibouti', country: 'DJ', lat: 11.59, lng: 43.15 },
  HAM: { code: 'DEHAM', name: 'Hamburg', country: 'DE', lat: 53.55, lng: 9.99 },
  RTM: { code: 'NLRTM', name: 'Rotterdam', country: 'NL', lat: 51.95, lng: 4.14 },
  ANR: { code: 'BEANR', name: 'Antwerpen', country: 'BE', lat: 51.28, lng: 4.34 },
  GOA: { code: 'ITGOA', name: 'Genova', country: 'IT', lat: 44.41, lng: 8.93 },
  FXT: { code: 'GBFXT', name: 'Felixstowe', country: 'GB', lat: 51.96, lng: 1.35 },
  LEH: { code: 'FRLEH', name: 'Le Havre', country: 'FR', lat: 49.49, lng: 0.11 },
};

// Suppliers
const suppliers: Supplier[] = [
  { id: 'SUP-018', name: 'Kilimo Co-op Arusha', type: 'Kooperative', country: 'TZ', region: 'Arusha', city: 'Arusha', contact: 'J. Mollel', phone: '+255 754 219 887', email: 'j.mollel@kilimo-arusha.co.tz', whatsapp: '+255 754 219 887', language: 'sw / en', capacity: '40t/Monat', tier: 'A', score: 4.6, rel: 5, qual: 4, comm: 5, price: 4, docs: 5, risk: 'niedrig', certs: ['Organic EU', 'Fairtrade', 'GlobalG.A.P.'], products: ['Arabica Green Coffee', 'Macadamia'], lastDelivery: daysAgo(12), status: 'aktiv' },
  { id: 'SUP-024', name: 'Mtwara Cashew Producers Ltd.', type: 'Unternehmen', country: 'TZ', region: 'Mtwara', city: 'Mtwara', contact: 'A. Hassan', phone: '+255 783 441 220', email: 'a.hassan@mtwara-cashew.tz', capacity: '120t/Saison', tier: 'A', score: 4.4, rel: 4, qual: 5, comm: 4, price: 4, docs: 4, risk: 'niedrig', certs: ['Organic EU', 'HACCP'], products: ['Raw Cashew Nuts', 'Cashew Kernels W320', 'Cashew Kernels W240'], lastDelivery: daysAgo(4), status: 'aktiv' },
  { id: 'SUP-031', name: 'Mbeya Highland Farms', type: 'Bauer', country: 'TZ', region: 'Mbeya', city: 'Mbeya', contact: 'G. Mwaipopo', phone: '+255 762 110 884', email: 'gm@mbeya-highland.tz', capacity: '18t/Saison', tier: 'B', score: 3.9, rel: 4, qual: 4, comm: 3, price: 4, docs: 3, risk: 'mittel', certs: ['Rainforest Alliance'], products: ['Avocado Hass', 'Passionsfrucht'], lastDelivery: daysAgo(28), status: 'aktiv' },
  { id: 'SUP-040', name: 'Zanzibar Spice Traders', type: 'Händler', country: 'TZ', region: 'Zanzibar', city: 'Stone Town', contact: 'F. Said', phone: '+255 778 882 110', email: 'f.said@zspice.tz', capacity: '8t/Monat', tier: 'A', score: 4.7, rel: 5, qual: 5, comm: 5, price: 4, docs: 4, risk: 'niedrig', certs: ['Organic EU', 'FSSC 22000'], products: ['Cloves', 'Black Pepper', 'Cinnamon', 'Cardamom'], lastDelivery: daysAgo(6), status: 'aktiv' },
  { id: 'SUP-052', name: 'Dodoma Oilseed Union', type: 'Kooperative', country: 'TZ', region: 'Dodoma', city: 'Dodoma', contact: 'P. Lema', phone: '+255 715 339 022', email: 'p.lema@dodoma-oilseed.tz', capacity: '60t/Monat', tier: 'B', score: 4.0, rel: 4, qual: 4, comm: 4, price: 4, docs: 4, risk: 'mittel', certs: ['Organic EU'], products: ['Sesame Seeds', 'Sunflower Seeds'], lastDelivery: daysAgo(2), status: 'aktiv' },
  { id: 'SUP-061', name: 'Ruvuma Sugar Estates', type: 'Unternehmen', country: 'TZ', region: 'Ruvuma', city: 'Songea', contact: 'D. Komba', phone: '+255 769 220 110', email: 'd.komba@ruvuma-sugar.tz', capacity: '500t/Monat', tier: 'A', score: 4.2, rel: 4, qual: 4, comm: 5, price: 5, docs: 4, risk: 'niedrig', certs: ['ISO 22000'], products: ['Brown Sugar Raw', 'White Sugar'], lastDelivery: daysAgo(9), status: 'aktiv' },
  { id: 'SUP-072', name: 'Iringa Meat Co.', type: 'Verarbeiter', country: 'TZ', region: 'Iringa', city: 'Iringa', contact: 'S. Mwakatumbula', phone: '+255 744 882 661', email: 's.m@iringa-meat.tz', capacity: '90t/Monat', tier: 'B', score: 3.8, rel: 3, qual: 4, comm: 4, price: 4, docs: 3, risk: 'hoch', certs: ['EU Veterinary Approval (pending)'], products: ['Frozen Beef', 'Frozen Goat Meat'], lastDelivery: daysAgo(17), status: 'in Prüfung' },
  { id: 'SUP-085', name: 'Bagamoyo Brickworks', type: 'Unternehmen', country: 'TZ', region: 'Pwani', city: 'Bagamoyo', contact: 'E. Mushi', phone: '+255 786 110 442', email: 'e.mushi@bagamoyo-brick.tz', capacity: '20 Container/Monat', tier: 'B', score: 4.1, rel: 5, qual: 4, comm: 3, price: 5, docs: 4, risk: 'niedrig', certs: ['EN 771-1 in Prüfung'], products: ['Clay Bricks', 'Engineering Bricks'], lastDelivery: daysAgo(38), status: 'aktiv' },
  { id: 'SUP-094', name: 'Kenya Macadamia Coop', type: 'Kooperative', country: 'KE', region: "Murang'a", city: "Murang'a", contact: 'L. Kamau', phone: '+254 722 110 994', email: 'l.kamau@kenmac.co.ke', capacity: '30t/Monat', tier: 'A', score: 4.5, rel: 5, qual: 5, comm: 4, price: 4, docs: 5, risk: 'niedrig', certs: ['Organic EU', 'GlobalG.A.P.'], products: ['Macadamia Nuts'], lastDelivery: daysAgo(14), status: 'aktiv' },
  { id: 'SUP-101', name: 'Rwanda Specialty Coffee', type: 'Kooperative', country: 'RW', region: 'Western Province', city: 'Karongi', contact: 'B. Mukasine', phone: '+250 788 110 220', email: 'b@rwspecialty.rw', capacity: '12t/Monat', tier: 'A', score: 4.8, rel: 5, qual: 5, comm: 5, price: 3, docs: 5, risk: 'niedrig', certs: ['Specialty Cup ≥85', 'Organic EU'], products: ['Specialty Arabica'], lastDelivery: daysAgo(7), status: 'aktiv' },
];

// Products / variants
const products: Product[] = [
  { id: 'PRD-001', name: 'Arabica Green Coffee', cat: 'Kaffee', origin: 'TZ / KE / RW', hs: '0901.11.00', unit: 'kg', packaging: '60kg jute / GrainPro', moq: '1×20ft', buyPrice: 4.20, sellPrice: 6.10, margin: 31, exportReady: true, variants: [
    { v: 'Arabica AA Washed', grade: 'Grade A', stock: 18400 },
    { v: 'Arabica AB', grade: 'Grade B', stock: 9200 },
    { v: 'Specialty SCA 86+', grade: 'Specialty', stock: 4100 },
    { v: 'Organic Arabica', grade: 'Bio EU', stock: 6800 },
  ], certs: ['Organic EU', 'Fairtrade'], buyers: 18, suppliers: 4 },
  { id: 'PRD-002', name: 'Cashew Kernels W320', cat: 'Nüsse', origin: 'TZ', hs: '0801.32.00', unit: 'kg', packaging: '22.68kg vacuum tin', moq: '5t', buyPrice: 6.80, sellPrice: 9.40, margin: 27, exportReady: true, variants: [
    { v: 'W320 Conventional', grade: 'Grade I', stock: 12000 },
    { v: 'W240 Conventional', grade: 'Grade I', stock: 6500 },
    { v: 'Organic W320', grade: 'Bio EU', stock: 4200 },
    { v: 'Broken Pieces (LWP)', grade: 'Grade II', stock: 8200 },
  ], certs: ['Organic EU', 'HACCP'], buyers: 12, suppliers: 2 },
  { id: 'PRD-003', name: 'Sesame Seeds', cat: 'Saaten', origin: 'TZ', hs: '1207.40.90', unit: 'kg', packaging: '50kg PP bag', moq: '20t', buyPrice: 1.45, sellPrice: 2.20, margin: 34, exportReady: true, variants: [
    { v: 'Hulled Sesame 99.95%', grade: 'Premium', stock: 22000 },
    { v: 'Natural Sesame', grade: 'Standard', stock: 31000 },
    { v: 'Organic Hulled', grade: 'Bio EU', stock: 11500 },
  ], certs: ['Organic EU'], buyers: 9, suppliers: 1 },
  { id: 'PRD-004', name: 'Macadamia Nuts', cat: 'Nüsse', origin: 'TZ / KE', hs: '0802.62.00', unit: 'kg', packaging: '10kg carton', moq: '2t', buyPrice: 9.10, sellPrice: 13.80, margin: 34, exportReady: true, variants: [
    { v: 'Style 1L (whole)', grade: 'Premium', stock: 4800 },
    { v: 'Style 2 (half)', grade: 'Standard', stock: 3200 },
    { v: 'Organic Style 1L', grade: 'Bio EU', stock: 2100 },
  ], certs: ['Organic EU', 'GlobalG.A.P.'], buyers: 7, suppliers: 2 },
  { id: 'PRD-005', name: 'Avocado Hass', cat: 'Obst', origin: 'TZ', hs: '0804.40.00', unit: 'kg', packaging: '4kg carton', moq: '1×40ft RC', buyPrice: 1.10, sellPrice: 2.40, margin: 54, exportReady: true, variants: [
    { v: 'Size 18 (premium)', grade: 'Class I', stock: 9400 },
    { v: 'Size 20-22', grade: 'Class I', stock: 12200 },
  ], certs: ['GlobalG.A.P.'], buyers: 5, suppliers: 1 },
  { id: 'PRD-006', name: 'Passionsfrucht', cat: 'Obst', origin: 'TZ', hs: '0810.90.20', unit: 'kg', packaging: '2.5kg carton', moq: '1×20ft RC', buyPrice: 1.80, sellPrice: 3.40, margin: 47, exportReady: true, variants: [
    { v: 'Purple Standard', grade: 'Class I', stock: 1800 },
  ], certs: ['GlobalG.A.P.'], buyers: 3, suppliers: 1 },
  { id: 'PRD-007', name: 'Brown Sugar Raw', cat: 'Zucker', origin: 'TZ', hs: '1701.13.00', unit: 'kg', packaging: '50kg PP bag', moq: '25t', buyPrice: 0.62, sellPrice: 0.92, margin: 32, exportReady: true, variants: [
    { v: 'VHP Raw 99.3 pol', grade: 'Raw', stock: 65000 },
    { v: 'Demerara', grade: 'Specialty', stock: 14000 },
  ], certs: ['ISO 22000'], buyers: 6, suppliers: 1 },
  { id: 'PRD-008', name: 'Frozen Beef', cat: 'Fleisch', origin: 'TZ', hs: '0202.30.10', unit: 'kg', packaging: '20kg carton', moq: '1×40ft RC', buyPrice: 4.40, sellPrice: 6.30, margin: 25, exportReady: false, variants: [
    { v: 'Boneless Forequarter', grade: 'EU vet pending', stock: 2800 },
  ], certs: ['Halal IFANCA', 'EU vet approval (pending)'], buyers: 3, suppliers: 1 },
  { id: 'PRD-009', name: 'Clay Engineering Bricks', cat: 'Baustoffe', origin: 'TZ', hs: '6904.10.00', unit: 'Stk', packaging: 'Pallet 480 Stk', moq: '1×40ft HC', buyPrice: 0.32, sellPrice: 0.58, margin: 38, exportReady: true, variants: [
    { v: 'Standard 240×115×71', grade: 'Class A', stock: 188000 },
    { v: 'Engineering Class B', grade: 'Class B', stock: 92000 },
  ], certs: ['EN 771-1 (pending)'], buyers: 2, suppliers: 1 },
  { id: 'PRD-010', name: 'Cloves Whole', cat: 'Gewürze', origin: 'TZ Zanzibar', hs: '0907.10.00', unit: 'kg', packaging: '25kg PP bag', moq: '1t', buyPrice: 8.20, sellPrice: 11.60, margin: 25, exportReady: true, variants: [
    { v: 'Whole Cloves Premium', grade: 'Premium', stock: 3400 },
    { v: 'Organic Cloves', grade: 'Bio EU', stock: 1200 },
  ], certs: ['Organic EU', 'FSSC 22000'], buyers: 5, suppliers: 1 },
  { id: 'PRD-011', name: 'Black Pepper', cat: 'Gewürze', origin: 'TZ', hs: '0904.11.00', unit: 'kg', packaging: '25kg PP bag', moq: '1t', buyPrice: 4.90, sellPrice: 7.10, margin: 28, exportReady: true, variants: [
    { v: 'Black Pepper 550 G/L', grade: 'Premium', stock: 2100 },
  ], certs: ['Organic EU'], buyers: 4, suppliers: 1 },
  { id: 'PRD-012', name: 'Sunflower Seeds', cat: 'Saaten', origin: 'TZ', hs: '1206.00.99', unit: 'kg', packaging: '50kg PP bag', moq: '25t', buyPrice: 0.95, sellPrice: 1.45, margin: 33, exportReady: true, variants: [
    { v: 'Confectionery Grade', grade: 'Premium', stock: 18000 },
  ], certs: ['Organic EU'], buyers: 3, suppliers: 1 },
];

// Buyers
const buyers: Buyer[] = [
  { id: 'BUY-002', name: 'Bio-Importeur Deutschland GmbH', country: 'DE', city: 'Hamburg', industry: 'Importeur · Bio-Food', contact: 'Dr. K. Hoffmann', position: 'Head of Sourcing', email: 'k.hoffmann@bio-importeur.de', phone: '+49 40 778 1100', website: 'bio-importeur.de', interests: ['Organic Cashew', 'Sesame', 'Macadamia'], moq: 'min 5t', certs: ['Organic EU', 'IFS'], terms: '30% Anzahlung / 70% gegen Kopie BL', incoterm: 'CIF Hamburg', rating: 5, status: 'aktiv', revenue: 248000 },
  { id: 'BUY-007', name: 'Hanseatic Coffee Roasters', country: 'DE', city: 'Bremen', industry: 'Röster', contact: 'M. Krause', position: 'Green Buyer', email: 'krause@hanseatic-coffee.de', phone: '+49 421 552 4400', interests: ['Specialty Arabica', 'Organic Arabica'], moq: '1×20ft', certs: ['Specialty Cup ≥85'], terms: 'LC at sight', incoterm: 'FOB DAR', rating: 5, status: 'aktiv', revenue: 312000 },
  { id: 'BUY-011', name: 'Amsterdam Spice & Co.', country: 'NL', city: 'Amsterdam', industry: 'Distributor · Gewürze', contact: 'P. de Vries', position: 'Purchasing', email: 'p.devries@amsterdam-spice.nl', phone: '+31 20 555 8821', interests: ['Cloves', 'Black Pepper', 'Cardamom'], moq: '500kg', certs: ['Organic EU'], terms: 'Net 30', incoterm: 'CIF Rotterdam', rating: 4, status: 'aktiv', revenue: 86000 },
  { id: 'BUY-019', name: 'Nordic Nuts AB', country: 'SE', city: 'Göteborg', industry: 'Lebensmittelhersteller', contact: 'J. Lindqvist', position: 'Procurement Manager', email: 'j.lindqvist@nordicnuts.se', phone: '+46 31 442 7700', interests: ['Macadamia', 'Cashew W240'], moq: '2t', certs: ['BRC'], terms: '20% / 80% gegen Dokumente', incoterm: 'CIF Hamburg', rating: 4, status: 'in Verhandlung', revenue: 0 },
  { id: 'BUY-023', name: 'Mediterraneo Sugar Trading', country: 'IT', city: 'Genova', industry: 'Großhändler · Zucker', contact: 'L. Romano', position: 'Trader', email: 'l.romano@medsugar.it', phone: '+39 010 442 1190', interests: ['Brown Sugar Raw'], moq: '1×40ft', certs: [], terms: 'CAD', incoterm: 'CFR Genova', rating: 3, status: 'aktiv', revenue: 145000 },
  { id: 'BUY-031', name: 'Halal Foods France', country: 'FR', city: 'Marseille', industry: 'Importeur · Halal', contact: 'A. Benali', position: 'CEO', email: 'a.benali@halalfoods.fr', phone: '+33 4 91 110 884', interests: ['Frozen Beef Halal', 'Frozen Goat'], moq: '1×40ft RC', certs: ['IFANCA Halal'], terms: '50% Anzahlung', incoterm: 'CIF Le Havre', rating: 3, status: 'in Verhandlung', revenue: 0 },
  { id: 'BUY-040', name: 'Antwerpen Building Supplies NV', country: 'BE', city: 'Antwerpen', industry: 'Distributor · Baustoffe', contact: 'T. Janssens', position: 'Imports', email: 't.janssens@anv-supplies.be', phone: '+32 3 552 7711', interests: ['Clay Bricks'], moq: '2×40ft', certs: ['EN 771-1'], terms: 'Net 45', incoterm: 'CFR Antwerpen', rating: 3, status: 'in Verhandlung', revenue: 0 },
  { id: 'BUY-045', name: 'Frankfurter Bio-Markt eG', country: 'DE', city: 'Frankfurt', industry: 'Bio-Laden', contact: 'S. Walter', position: 'Einkauf', email: 's.walter@fr-biomarkt.de', phone: '+49 69 552 0011', interests: ['Organic Sesame', 'Organic Cashew', 'Organic Cloves'], moq: '500kg', certs: ['Organic EU', 'Fairtrade'], terms: 'Net 30', incoterm: 'DDP Frankfurt', rating: 4, status: 'aktiv', revenue: 64000 },
  { id: 'BUY-052', name: 'Provence Olive & Seeds', country: 'FR', city: 'Marseille', industry: 'Hersteller · Speiseöl', contact: 'C. Moreau', position: 'Sourcing', email: 'c.moreau@provence-os.fr', phone: '+33 4 91 220 884', interests: ['Sunflower Seeds', 'Sesame'], moq: '20t', certs: ['Organic EU'], terms: 'CAD', incoterm: 'CIF Le Havre', rating: 4, status: 'Muster angefragt', revenue: 0 },
  { id: 'BUY-061', name: 'British Avocado Imports Ltd.', country: 'GB', city: 'Felixstowe', industry: 'Importeur · Frischobst', contact: 'O. Whitfield', position: 'Trader', email: 'o.w@brit-avocado.co.uk', phone: '+44 1394 110 002', interests: ['Hass Avocado'], moq: '1×40ft RC', certs: ['GlobalG.A.P.', 'GRASP'], terms: 'Net 21', incoterm: 'CIF Felixstowe', rating: 5, status: 'aktiv', revenue: 92000 },
];

// Vessels for live tracking
const vessels: Vessel[] = [
  { name: 'MAERSK COPENHAGEN', voyage: '614W', imo: '9778742', operator: 'Maersk' },
  { name: 'MSC ANTONIA', voyage: 'EA518N', imo: '9839124', operator: 'MSC' },
  { name: 'CMA CGM JAGUAR', voyage: 'EXR221', imo: '9776223', operator: 'CMA CGM' },
  { name: 'HAPAG SAVANNAH', voyage: '0042E', imo: '9881102', operator: 'Hapag-Lloyd' },
  { name: 'ONE TRADITION', voyage: '108W', imo: '9806551', operator: 'ONE' },
];

// Orders — central spine
const orders: Order[] = [
  { id: 'ORD-2026-0144', buyerId: 'BUY-002', productId: 'PRD-002', productVariant: 'Organic W320', supplierId: 'SUP-024', qty: 10000, unit: 'kg', batch: 'CAS-2026-001', buyPrice: 4.20, sellPrice: 6.10, revenue: 61000, costGoods: 42000, costLogistics: 5800, costDocs: 1200, profit: 12000, incoterm: 'CIF Hamburg', portLoad: 'DAR', portDest: 'HAM', status: 'in_export', statusKey: 's_in_export', etd: daysFromNow(8), eta: daysFromNow(38), created: daysAgo(22), responsible: 'M. Kassim', vesselIdx: 0, paid: 30 },
  { id: 'ORD-2026-0142', buyerId: 'BUY-007', productId: 'PRD-001', productVariant: 'Specialty SCA 86+', supplierId: 'SUP-101', qty: 4000, unit: 'kg', batch: 'COF-2026-018', buyPrice: 9.40, sellPrice: 13.80, revenue: 55200, costGoods: 37600, costLogistics: 4400, costDocs: 980, profit: 12220, incoterm: 'FOB DAR', portLoad: 'DAR', portDest: 'HAM', status: 'in_transit', statusKey: 's_in_transit', etd: daysAgo(11), eta: daysFromNow(19), created: daysAgo(46), responsible: 'M. Kassim', vesselIdx: 1, paid: 100, progressPct: 36 },
  { id: 'ORD-2026-0139', buyerId: 'BUY-011', productId: 'PRD-010', productVariant: 'Whole Cloves Premium', supplierId: 'SUP-040', qty: 1500, unit: 'kg', batch: 'CLV-2026-009', buyPrice: 8.20, sellPrice: 11.60, revenue: 17400, costGoods: 12300, costLogistics: 2100, costDocs: 680, profit: 2320, incoterm: 'CIF Rotterdam', portLoad: 'DAR', portDest: 'RTM', status: 'arrived', statusKey: 's_arrived', etd: daysAgo(33), eta: daysAgo(3), created: daysAgo(60), responsible: 'A. Bauer', vesselIdx: 2, paid: 70, progressPct: 100 },
  { id: 'ORD-2026-0137', buyerId: 'BUY-023', productId: 'PRD-007', productVariant: 'VHP Raw 99.3 pol', supplierId: 'SUP-061', qty: 26000, unit: 'kg', batch: 'SUG-2026-022', buyPrice: 0.62, sellPrice: 0.92, revenue: 23920, costGoods: 16120, costLogistics: 3200, costDocs: 540, profit: 4060, incoterm: 'CFR Genova', portLoad: 'DAR', portDest: 'GOA', status: 'in_transit', statusKey: 's_in_transit', etd: daysAgo(20), eta: daysFromNow(8), created: daysAgo(48), responsible: 'A. Bauer', vesselIdx: 3, paid: 50, progressPct: 72 },
  { id: 'ORD-2026-0135', buyerId: 'BUY-061', productId: 'PRD-005', productVariant: 'Size 18 (premium)', supplierId: 'SUP-031', qty: 18000, unit: 'kg', batch: 'AVO-2026-014', buyPrice: 1.10, sellPrice: 2.40, revenue: 43200, costGoods: 19800, costLogistics: 6400, costDocs: 920, profit: 16080, incoterm: 'CIF Felixstowe', portLoad: 'MOM', portDest: 'FXT', status: 'in_transit', statusKey: 's_in_transit', etd: daysAgo(6), eta: daysFromNow(14), created: daysAgo(34), responsible: 'M. Kassim', vesselIdx: 4, paid: 100, progressPct: 24 },
  { id: 'ORD-2026-0133', buyerId: 'BUY-045', productId: 'PRD-003', productVariant: 'Organic Hulled', supplierId: 'SUP-052', qty: 22000, unit: 'kg', batch: 'SES-2026-031', buyPrice: 1.45, sellPrice: 2.20, revenue: 48400, costGoods: 31900, costLogistics: 4100, costDocs: 720, profit: 11680, incoterm: 'DDP Frankfurt', portLoad: 'DAR', portDest: 'HAM', status: 'quality', statusKey: 's_quality', etd: daysFromNow(12), eta: daysFromNow(42), created: daysAgo(14), responsible: 'N. Otieno', vesselIdx: 0, paid: 30 },
  { id: 'ORD-2026-0130', buyerId: 'BUY-019', productId: 'PRD-004', productVariant: 'Style 1L (whole)', supplierId: 'SUP-094', qty: 8000, unit: 'kg', batch: 'MAC-2026-008', buyPrice: 9.10, sellPrice: 13.80, revenue: 110400, costGoods: 72800, costLogistics: 7800, costDocs: 1100, profit: 28700, incoterm: 'CIF Hamburg', portLoad: 'MOM', portDest: 'HAM', status: 'procurement', statusKey: 's_procurement', etd: daysFromNow(22), eta: daysFromNow(56), created: daysAgo(8), responsible: 'N. Otieno', vesselIdx: 1, paid: 25 },
  { id: 'ORD-2026-0128', buyerId: 'BUY-002', productId: 'PRD-003', productVariant: 'Hulled Sesame 99.95%', supplierId: 'SUP-052', qty: 24000, unit: 'kg', batch: 'SES-2026-029', buyPrice: 1.45, sellPrice: 2.20, revenue: 52800, costGoods: 34800, costLogistics: 4300, costDocs: 760, profit: 12940, incoterm: 'CIF Hamburg', portLoad: 'DAR', portDest: 'HAM', status: 'delivered', statusKey: 's_delivered', etd: daysAgo(58), eta: daysAgo(8), created: daysAgo(82), responsible: 'M. Kassim', vesselIdx: 2, paid: 100, progressPct: 100 },
  { id: 'ORD-2026-0126', buyerId: 'BUY-040', productId: 'PRD-009', productVariant: 'Standard 240×115×71', supplierId: 'SUP-085', qty: 24000, unit: 'Stk', batch: 'BRK-2026-004', buyPrice: 0.32, sellPrice: 0.58, revenue: 13920, costGoods: 7680, costLogistics: 2900, costDocs: 480, profit: 2860, incoterm: 'CFR Antwerpen', portLoad: 'DAR', portDest: 'ANR', status: 'confirmed', statusKey: 's_confirmed', etd: daysFromNow(34), eta: daysFromNow(68), created: daysAgo(4), responsible: 'A. Bauer', vesselIdx: 3, paid: 0 },
  { id: 'ORD-2026-0122', buyerId: 'BUY-002', productId: 'PRD-001', productVariant: 'Organic Arabica', supplierId: 'SUP-018', qty: 5400, unit: 'kg', batch: 'COF-2026-016', buyPrice: 4.20, sellPrice: 6.10, revenue: 32940, costGoods: 22680, costLogistics: 3100, costDocs: 640, profit: 6520, incoterm: 'CIF Hamburg', portLoad: 'DAR', portDest: 'HAM', status: 'paid', statusKey: 's_paid', etd: daysAgo(74), eta: daysAgo(24), created: daysAgo(102), responsible: 'M. Kassim', vesselIdx: 4, paid: 100, progressPct: 100 },
  { id: 'ORD-2026-0118', buyerId: 'BUY-031', productId: 'PRD-008', productVariant: 'Boneless Forequarter', supplierId: 'SUP-072', qty: 18000, unit: 'kg', batch: 'BEF-2026-002', buyPrice: 4.40, sellPrice: 6.30, revenue: 113400, costGoods: 79200, costLogistics: 11200, costDocs: 2400, profit: 20600, incoterm: 'CIF Le Havre', portLoad: 'DAR', portDest: 'LEH', status: 'problem', statusKey: 's_problem', etd: daysFromNow(0), eta: daysFromNow(30), created: daysAgo(28), responsible: 'M. Kassim', vesselIdx: 0, paid: 25, problem: 'EU veterinary approval missing' },
  { id: 'ORD-2026-0115', buyerId: 'BUY-007', productId: 'PRD-001', productVariant: 'Arabica AA Washed', supplierId: 'SUP-018', qty: 12000, unit: 'kg', batch: 'COF-2026-015', buyPrice: 4.20, sellPrice: 6.10, revenue: 73200, costGoods: 50400, costLogistics: 5800, costDocs: 980, profit: 16020, incoterm: 'FOB DAR', portLoad: 'DAR', portDest: 'HAM', status: 'ready', statusKey: 's_ready', etd: daysFromNow(4), eta: daysFromNow(34), created: daysAgo(18), responsible: 'M. Kassim', vesselIdx: 1, paid: 30 },
];

// Deals (pre-order pipeline)
const deals: Deal[] = [
  { id: 'D-2026-0211', buyerId: 'BUY-019', productId: 'PRD-004', qty: 8000, targetPrice: 13.20, ourPrice: 13.80, value: 110400, stage: 'Verhandlung', prob: 70, nextFollow: daysFromNow(2), created: daysAgo(12) },
  { id: 'D-2026-0207', buyerId: 'BUY-040', productId: 'PRD-009', qty: 48000, targetPrice: 0.54, ourPrice: 0.58, value: 27840, stage: 'Angebot', prob: 50, nextFollow: daysFromNow(5), created: daysAgo(18) },
  { id: 'D-2026-0205', buyerId: 'BUY-031', productId: 'PRD-008', qty: 24000, targetPrice: 6.10, ourPrice: 6.30, value: 151200, stage: 'Muster', prob: 30, nextFollow: daysFromNow(3), created: daysAgo(22) },
  { id: 'D-2026-0202', buyerId: 'BUY-052', productId: 'PRD-012', qty: 25000, targetPrice: 1.42, ourPrice: 1.45, value: 36250, stage: 'Muster', prob: 40, nextFollow: daysFromNow(1), created: daysAgo(9) },
  { id: 'D-2026-0198', buyerId: 'BUY-061', productId: 'PRD-005', qty: 20000, targetPrice: 2.35, ourPrice: 2.40, value: 48000, stage: 'Vertrag', prob: 90, nextFollow: daysFromNow(0), created: daysAgo(28) },
  { id: 'D-2026-0192', buyerId: 'BUY-011', productId: 'PRD-011', qty: 2000, targetPrice: 7.00, ourPrice: 7.10, value: 14200, stage: 'Bedarf', prob: 20, nextFollow: daysFromNow(7), created: daysAgo(5) },
  { id: 'D-2026-0188', buyerId: 'BUY-002', productId: 'PRD-004', qty: 6000, targetPrice: 14.10, ourPrice: 13.80, value: 82800, stage: 'Lead', prob: 10, nextFollow: daysFromNow(4), created: daysAgo(3) },
  { id: 'D-2026-0184', buyerId: 'BUY-045', productId: 'PRD-010', qty: 1200, targetPrice: 11.50, ourPrice: 11.60, value: 13920, stage: 'Angebot', prob: 60, nextFollow: daysFromNow(2), created: daysAgo(16) },
  { id: 'D-2026-0179', buyerId: 'BUY-007', productId: 'PRD-001', qty: 18000, targetPrice: 6.00, ourPrice: 6.10, value: 109800, stage: 'Verhandlung', prob: 75, nextFollow: daysFromNow(1), created: daysAgo(20) },
  { id: 'D-2026-0175', buyerId: 'BUY-019', productId: 'PRD-002', qty: 4000, targetPrice: 9.20, ourPrice: 9.40, value: 37600, stage: 'Angebot', prob: 55, nextFollow: daysFromNow(6), created: daysAgo(11) },
];

// Alerts
const alerts: Alert[] = [
  { sev: 'r', t: 'Phytosanitary Certificate fehlt — ORD-2026-0144', m: 'Verschiffung in 8 Tagen', time: 'vor 12 Min', kind: 'order' },
  { sev: 'r', t: 'EU Veterinärfreigabe fehlt — SUP-072 Iringa Meat', m: 'ORD-2026-0118 blockiert', time: 'vor 1 Std', kind: 'supplier' },
  { sev: 'r', t: 'Zahlung überfällig — Mediterraneo Sugar Trading', m: '23.920 € · 18 Tage über Fälligkeit', time: 'vor 3 Std', kind: 'payment' },
  { sev: 'w', t: 'Container LMCU8814226 erreicht Rotterdam in 5 Tagen', m: 'ORD-2026-0137 · Importunterlagen vorbereiten', time: 'vor 4 Std', kind: 'shipment' },
  { sev: 'w', t: 'Organic-Zertifikat SUP-018 läuft in 14 Tagen ab', m: 'Erneuerung anstoßen', time: 'vor 6 Std', kind: 'supplier' },
  { sev: 'w', t: 'Angebot Q-2026-088 seit 10 Tagen unbeantwortet', m: 'Nordic Nuts AB · 110.400 €', time: 'vor 9 Std', kind: 'deal' },
  { sev: 'i', t: 'Qualitätsprüfung Charge SES-2026-031 läuft', m: 'Ergebnis erwartet morgen 14:00', time: 'vor 11 Std', kind: 'quality' },
  { sev: 'i', t: 'Neuer Lead aus EUMARK Messe', m: 'Polnischer Bio-Distributor · Cashew', time: 'gestern', kind: 'deal' },
];

// Tasks (today)
const tasks: Task[] = [
  { id: 'T-9921', t: 'Phyto-Cert beantragen', order: 'ORD-2026-0144', owner: 'M. Kassim', prio: 'hoch', due: daysFromNow(0), status: 'offen' },
  { id: 'T-9918', t: 'Spediteur Kühne+Nagel bestätigen', order: 'ORD-2026-0115', owner: 'A. Bauer', prio: 'mittel', due: daysFromNow(0), status: 'in_progress' },
  { id: 'T-9914', t: 'Anzahlung Antwerpen Building Supplies anfordern', order: 'ORD-2026-0126', owner: 'M. Kassim', prio: 'mittel', due: daysFromNow(0), status: 'offen' },
  { id: 'T-9908', t: 'Cup-Score Specialty SCA an Hanseatic senden', order: 'ORD-2026-0142', owner: 'N. Otieno', prio: 'niedrig', due: daysFromNow(0), status: 'offen' },
  { id: 'T-9902', t: 'Reklamation Cloves — Foto-Doku finalisieren', order: 'ORD-2026-0139', owner: 'M. Kassim', prio: 'hoch', due: daysFromNow(0), status: 'in_progress' },
  { id: 'T-9897', t: 'Halal-Anbieter EU vet approval Status klären', order: 'ORD-2026-0118', owner: 'M. Kassim', prio: 'hoch', due: daysFromNow(1), status: 'wartet' },
];

// Documents
const documents: Document[] = [
  { id: 'DOC-04412', name: 'Phytosanitary Cert TZ.pdf', type: 'Phytosanitary', order: 'ORD-2026-0142', status: 'gültig', issued: daysAgo(14), expires: daysFromNow(166), size: '412 KB' },
  { id: 'DOC-04408', name: 'Commercial Invoice 0144.pdf', type: 'Commercial Invoice', order: 'ORD-2026-0144', status: 'Entwurf', issued: daysAgo(2), expires: null, size: '89 KB' },
  { id: 'DOC-04401', name: 'Bill of Lading MAEU2284991.pdf', type: 'B/L', order: 'ORD-2026-0142', status: 'gültig', issued: daysAgo(11), expires: null, size: '267 KB' },
  { id: 'DOC-04388', name: 'Organic EU Cert SUP-024.pdf', type: 'Zertifikat', order: null, status: 'gültig', issued: daysAgo(180), expires: daysFromNow(184), size: '1.2 MB' },
  { id: 'DOC-04381', name: 'Organic EU Cert SUP-018.pdf', type: 'Zertifikat', order: null, status: 'läuft ab', issued: daysAgo(351), expires: daysFromNow(14), size: '1.1 MB' },
  { id: 'DOC-04372', name: 'Packing List 0137.xlsx', type: 'Packing List', order: 'ORD-2026-0137', status: 'gültig', issued: daysAgo(20), expires: null, size: '34 KB' },
  { id: 'DOC-04361', name: 'COA Lab SGS Cashew W320.pdf', type: 'Laborbericht', order: 'ORD-2026-0144', status: 'gültig', issued: daysAgo(8), expires: daysFromNow(82), size: '548 KB' },
  { id: 'DOC-04349', name: 'EU Vet Approval SUP-072.pdf', type: 'Behördendokument', order: 'ORD-2026-0118', status: 'fehlt', issued: null, expires: null, size: '—' },
  { id: 'DOC-04341', name: 'Certificate of Origin 0142.pdf', type: 'Ursprung', order: 'ORD-2026-0142', status: 'gültig', issued: daysAgo(13), expires: null, size: '78 KB' },
  { id: 'DOC-04335', name: 'Sales Contract Bio-Importeur.pdf', type: 'Vertrag', order: 'ORD-2026-0144', status: 'gültig', issued: daysAgo(22), expires: null, size: '1.8 MB' },
];

// Quality checks
const quality: QualityCheck[] = [
  { id: 'QC-2026-0078', batch: 'SES-2026-031', product: 'Sesame Seeds Organic Hulled', supplier: 'SUP-052', date: daysAgo(0), moisture: '5.8%', purity: '99.96%', foreign: '0.04%', oil: '49.2%', lab: 'SGS Dar', inspector: 'N. Otieno', status: 'in_progress', grade: '—', notes: 'Erste Probe ok, Feinanalyse läuft.' },
  { id: 'QC-2026-0077', batch: 'CAS-2026-001', product: 'Cashew Organic W320', supplier: 'SUP-024', date: daysAgo(1), moisture: '4.2%', purity: '99.5%', foreign: '0.5%', oil: '—', lab: 'Bureau Veritas', inspector: 'M. Kassim', status: 'released', grade: 'A', notes: 'Aflatoxin <2 ppb. Freigabe für Export.' },
  { id: 'QC-2026-0076', batch: 'COF-2026-018', product: 'Specialty Arabica SCA 86+', supplier: 'SUP-101', date: daysAgo(2), moisture: '11.2%', purity: '—', foreign: 'def. 4', oil: '—', lab: 'Q-Grader intern', inspector: 'M. Kassim', cup: 86.5, status: 'released', grade: 'Specialty', notes: 'Notes: Black tea, bergamot, dark chocolate.' },
  { id: 'QC-2026-0075', batch: 'AVO-2026-014', product: 'Avocado Hass Size 18', supplier: 'SUP-031', date: daysAgo(3), moisture: '—', dryMatter: '23.4%', firmness: 'OK', defects: '1.8%', lab: 'Intern', inspector: 'N. Otieno', status: 'released', grade: 'Class I', notes: 'Reifegrad korrekt für See-Transport.' },
  { id: 'QC-2026-0074', batch: 'BEF-2026-002', product: 'Frozen Beef Boneless', supplier: 'SUP-072', date: daysAgo(5), temp: '-18.4°C', pH: '5.6', microb: 'pending', lab: 'Bureau Veritas', inspector: 'M. Kassim', status: 'blocked', grade: '—', notes: 'EU vet approval erforderlich vor Freigabe.' },
  { id: 'QC-2026-0073', batch: 'CLV-2026-009', product: 'Cloves Whole Premium', supplier: 'SUP-040', date: daysAgo(7), moisture: '10.1%', purity: '99.2%', foreign: '0.8%', oil: '17.4%', lab: 'SGS Dar', inspector: 'N. Otieno', status: 'released', grade: 'Premium', notes: 'Vol. ätherisches Öl > 17%.' },
];

// Inventory
const inventory: InventoryItem[] = [
  { product: 'Cashew Kernels Organic W320', qty: 4200, unit: 'kg', location: 'Dar es Salaam · Hangar 3', status: 'reserved', batch: 'CAS-2026-001', received: daysAgo(8) },
  { product: 'Arabica AA Washed', qty: 12000, unit: 'kg', location: 'Arusha · Coffee Floor', status: 'released', batch: 'COF-2026-015', received: daysAgo(14) },
  { product: 'Specialty Arabica SCA 86+', qty: 4100, unit: 'kg', location: 'Arusha · Coffee Floor', status: 'reserved', batch: 'COF-2026-018', received: daysAgo(11) },
  { product: 'Sesame Organic Hulled', qty: 22000, unit: 'kg', location: 'Dodoma · Lager 1', status: 'quality_hold', batch: 'SES-2026-031', received: daysAgo(2) },
  { product: 'Cloves Whole Premium', qty: 1200, unit: 'kg', location: 'Stone Town · Lager', status: 'released', batch: 'CLV-2026-010', received: daysAgo(6) },
  { product: 'Brown Sugar VHP Raw', qty: 65000, unit: 'kg', location: 'Songea · Mühle', status: 'released', batch: 'SUG-2026-022', received: daysAgo(9) },
  { product: 'Avocado Hass Size 18', qty: 9400, unit: 'kg', location: 'Mbeya · Coldroom', status: 'released', batch: 'AVO-2026-015', received: daysAgo(2) },
  { product: 'Macadamia Style 1L', qty: 4800, unit: 'kg', location: "Murang'a · Lager", status: 'released', batch: 'MAC-2026-008', received: daysAgo(12) },
  { product: 'Clay Bricks Standard', qty: 188000, unit: 'Stk', location: 'Bagamoyo · Yard', status: 'released', batch: 'BRK-2026-004', received: daysAgo(20) },
  { product: 'Frozen Beef Boneless', qty: 2800, unit: 'kg', location: 'Iringa · Coldstore', status: 'blocked', batch: 'BEF-2026-002', received: daysAgo(5) },
];

// Offers
const offers: Offer[] = [
  { id: 'Q-2026-0094', buyer: 'BUY-019', product: 'PRD-004', qty: 8000, price: 13.80, value: 110400, status: 'sent', valid: daysFromNow(7), sent: daysAgo(3) },
  { id: 'Q-2026-0092', buyer: 'BUY-040', product: 'PRD-009', qty: 48000, price: 0.58, value: 27840, status: 'viewed', valid: daysFromNow(10), sent: daysAgo(2) },
  { id: 'Q-2026-0089', buyer: 'BUY-052', product: 'PRD-012', qty: 25000, price: 1.45, value: 36250, status: 'sent', valid: daysFromNow(12), sent: daysAgo(1) },
  { id: 'Q-2026-0088', buyer: 'BUY-019', product: 'PRD-002', qty: 4000, price: 9.40, value: 37600, status: 'viewed', valid: daysFromNow(5), sent: daysAgo(10) },
  { id: 'Q-2026-0084', buyer: 'BUY-061', product: 'PRD-005', qty: 20000, price: 2.40, value: 48000, status: 'accepted', valid: daysAgo(4), sent: daysAgo(15) },
  { id: 'Q-2026-0078', buyer: 'BUY-031', product: 'PRD-008', qty: 24000, price: 6.30, value: 151200, status: 'negotiation', valid: daysFromNow(2), sent: daysAgo(14) },
  { id: 'Q-2026-0072', buyer: 'BUY-007', product: 'PRD-001', qty: 18000, price: 6.10, value: 109800, status: 'sent', valid: daysFromNow(8), sent: daysAgo(4) },
  { id: 'Q-2026-0069', buyer: 'BUY-002', product: 'PRD-004', qty: 6000, price: 13.80, value: 82800, status: 'draft', valid: null, sent: null },
];

// Complaints
const complaints: Complaint[] = [
  { id: 'C-2026-0014', order: 'ORD-2026-0118', buyer: 'BUY-031', cat: 'Compliance', sev: 'kritisch', t: 'EU Veterinärfreigabe fehlt', owner: 'M. Kassim', status: 'in Bearbeitung', opened: daysAgo(4), impact: '113.400 €' },
  { id: 'C-2026-0012', order: 'ORD-2026-0139', buyer: 'BUY-011', cat: 'Qualität', sev: 'mittel', t: 'Cloves: Feuchte 12% statt 10%', owner: 'A. Bauer', status: 'gelöst', opened: daysAgo(11), impact: '1.800 € Gutschrift' },
  { id: 'C-2026-0009', order: 'ORD-2026-0122', buyer: 'BUY-002', cat: 'Lieferzeit', sev: 'niedrig', t: 'Container 4 Tage Verspätung Suezkanal', owner: 'M. Kassim', status: 'geschlossen', opened: daysAgo(28), impact: '0 €' },
  { id: 'C-2026-0007', order: 'ORD-2026-0128', buyer: 'BUY-002', cat: 'Dokument', sev: 'mittel', t: 'COA fehlerhaft datiert', owner: 'N. Otieno', status: 'gelöst', opened: daysAgo(56), impact: '0 €' },
];

// Status maps & helpers
const statusBadge: StatusBadgeMap = {
  new: 'neutral', confirmed: 'info', procurement: 'info', quality: 'warning',
  ready: 'success', in_export: 'warning', shipped: 'ocean', in_transit: 'ocean',
  arrived: 'success', delivered: 'success', paid: 'success', done: 'neutral', problem: 'danger',
};

const dealStages: string[] = ['Lead', 'Bedarf', 'Muster', 'Angebot', 'Verhandlung', 'Vertrag', 'Gewonnen'];

// 12-month revenue trend
const revTrend: RevTrendEntry[] = [
  { m: 'Jun', exp: 78, real: 82, margin: 28 },
  { m: 'Jul', exp: 82, real: 79, margin: 26 },
  { m: 'Aug', exp: 88, real: 86, margin: 29 },
  { m: 'Sep', exp: 76, real: 78, margin: 31 },
  { m: 'Okt', exp: 92, real: 94, margin: 30 },
  { m: 'Nov', exp: 102, real: 99, margin: 27 },
  { m: 'Dez', exp: 110, real: 112, margin: 31 },
  { m: 'Jan', exp: 88, real: 84, margin: 28 },
  { m: 'Feb', exp: 95, real: 91, margin: 30 },
  { m: 'Mär', exp: 108, real: 106, margin: 32 },
  { m: 'Apr', exp: 96, real: 99, margin: 33 },
  { m: 'Mai', exp: 85, real: 62, margin: 31 },
];

export const MOCK: MockData = {
  suppliers,
  buyers,
  products,
  orders,
  deals,
  alerts,
  tasks,
  documents,
  quality,
  inventory,
  offers,
  complaints,
  vessels,
  ports,
  statusBadge,
  dealStages,
  revTrend,
  todayBase,
  forwarders: [],
  samples: [],
  certifications: [],
  regulations: [],
  objectives: [],
  supplierNotes: [],
  fieldVisits: [],
  lots: [] as Lot[],
  communications: [] as Communication[],
  serviceProviders: [] as ServiceProvider[],
  calendarEvents: [] as CalendarEvent[],
  setupTasks: [] as SetupTask[],
  companyProfile: null as CompanyProfile | null,
  buyerContacts: [] as BuyerContact[],
  buyerRequirements: [] as BuyerRequirement[],
  harvestCalendar: [],
};
