// Full Product Master Data — stored in products.product_master (JSONB)

export type ProductStatus = 'draft' | 'active' | 'blocked' | 'discontinued';

export interface DutyRate     { country: string; rate: string; note?: string }
export interface VatRate      { country: string; rate: string }
export interface OriginRule   { agreement: string; rule: string }
export interface PriceTier    { qty: string; price: string }
export interface LabelReq     { country: string; requirement: string }
export interface AllowedCountry { country: string; blocked: boolean; note?: string }

export interface ProductMaster {
  // ── 1. Grunddaten extended ──────────────────────────────────────────────────
  productType?:      string;   // Kaffee | Rohstoff | Lebensmittel | Textil | Industrieprodukt | Sonstige
  productStatus?:    ProductStatus;
  nameInvoice?:      string;   // name on export documents / invoices
  descShort?:        string;
  descLong?:         string;
  brand?:            string;
  manufacturer?:     string;
  skuInternal?:      string;
  ean?:              string;
  internalNotes?:    string;

  // ── 2. Zoll & Klassifizierung ───────────────────────────────────────────────
  cnCode?:           string;   // 8-digit CN code (EU)
  taricCode?:        string;   // 10-digit TARIC
  customsDesc?:      string;   // official customs description
  dutyRates?:        DutyRate[];
  vatRates?:         VatRate[];
  exportRestrictions?: string;
  importRestrictions?: string;
  requiredLicenses?: string;
  antiDumping?:      string;
  sanctionsCheck?:   string;
  dualUse?:          boolean;
  preferenceEligibility?: string;
  originRules?:      OriginRule[];

  // ── 3. Ursprung & Lieferkette ───────────────────────────────────────────────
  productionCountry?:   string;
  manufacturerAddress?: string;
  farmCooperative?:     string;
  batchOrigin?:         string;
  nonPrefOrigin?:       string;
  prefOrigin?:          string;
  supplierDeclaration?: boolean;
  cooRequired?:         boolean;
  traceabilityNotes?:   string;

  // ── 4. Produkt-Spezifikationen ──────────────────────────────────────────────
  materials?:      string;
  ingredients?:    string;
  variety?:        string;
  processing?:     string;
  color?:          string;
  dimensions?:     string;
  weightNet?:      string;
  weightGross?:    string;
  volume?:         string;
  density?:        string;
  allergens?:      string;
  hasSds?:         boolean;
  qualityStandard?: string;
  hazardClass?:    string;

  // ── 5. Verpackung (extended) ────────────────────────────────────────────────
  singlePackaging?: string;
  innerPackaging?:  string;
  outerCarton?:     string;
  palletDimensions?: string;
  piecesPerCarton?: string;
  cartonsPerPallet?: string;
  piecesPerPallet?: string;
  container20?:     string;   // existing fcl20 mirrored here
  container40?:     string;   // existing fcl40 mirrored here
  container40hc?:   string;
  packagingMaterial?: string;
  packagingWeight?: string;
  recyclingInfo?:   string;
  labelingReqs?:    LabelReq[];
  labelLanguages?:  string;
  minLabeling?:     string;

  // ── 6. Preise & Kalkulation ─────────────────────────────────────────────────
  currency?:          string;
  priceTiers?:        PriceTier[];
  costPackaging?:     string;
  costInland?:        string;
  costExportCustoms?: string;
  costFreight?:       string;
  costInsurance?:     string;
  costDuties?:        string;
  costTaxes?:         string;
  costStorage?:       string;
  costFinancing?:     string;
  costCommission?:    string;
  targetSellPrice?:   string;
  marginAbs?:         string;
  marginPct?:         string;
  contributionMargin?: string;
  breakevenQty?:      string;

  // ── 7. Verkauf & Incoterms ──────────────────────────────────────────────────
  deliveryPlace?:    string;
  riskTransfer?:     string;
  paymentTerms?:     string;
  deliveryTime?:     string;
  sampleAvailable?:  boolean;
  allowedCountries?: AllowedCountry[];

  // ── 8. Dokumente (mirrors required_docs; extended) ──────────────────────────
  // Handled by existing required_docs column + products/tabs/Dokumente.tsx

  // ── 9. Compliance ───────────────────────────────────────────────────────────
  ceRequired?:        boolean;
  reachRelevant?:     boolean;
  rohsRelevant?:      boolean;
  foodLawRelevant?:   boolean;
  bioRegulation?:     boolean;
  eudrCompliance?:    boolean;
  productSafetyReqs?: string;
  ageRestriction?:    string;
  dangerousGoods?:    boolean;
  exportControl?:     boolean;
  sanctionsRelevant?: boolean;
  complianceNotes?:   string;

  // ── 10. Qualität & Prüfung (extended) ──────────────────────────────────────
  qualityClass?:         string;
  samplingRules?:        string;
  complaintRate?:        string;
  qualityReleaseStatus?: 'released' | 'blocked' | 'pending';
  warehouseLocation?:    string;
  minStock?:             string;
  stockMethod?:          'FIFO' | 'FEFO';
  bestBefore?:           string;
  stackable?:            boolean;
}

// ── Completeness score ────────────────────────────────────────────────────────

const SCORE_FIELDS: (keyof ProductMaster)[] = [
  'nameInvoice', 'descShort', 'productType', 'productStatus',
  'cnCode', 'taricCode', 'sanctionsCheck',
  'productionCountry', 'nonPrefOrigin', 'cooRequired',
  'materials', 'weightNet', 'qualityStandard',
  'outerCarton', 'container20', 'container40',
  'costFreight', 'targetSellPrice', 'marginPct',
  'paymentTerms', 'deliveryTime',
  'ceRequired', 'eudrCompliance',
  'qualityClass', 'qualityReleaseStatus',
];

export function calcReadinessScore(master: ProductMaster): number {
  const filled = SCORE_FIELDS.filter(k => {
    const v = master[k];
    return v !== undefined && v !== null && v !== '' && v !== false;
  }).length;
  return Math.round((filled / SCORE_FIELDS.length) * 100);
}

export const PRODUCT_TYPES = [
  'Kaffee', 'Kakao', 'Tee', 'Nüsse & Samen', 'Früchte & Gemüse',
  'Getreide & Hülsenfrüchte', 'Gewürze', 'Öle & Fette',
  'Holz & Holzprodukte', 'Textilien', 'Industrieprodukte', 'Sonstige',
];

export const STATUS_MAP: Record<string, { label: string; kind: string }> = {
  draft:        { label: 'Entwurf',     kind: 'neutral'  },
  active:       { label: 'Aktiv',       kind: 'success'  },
  blocked:      { label: 'Gesperrt',    kind: 'danger'   },
  discontinued: { label: 'Auslaufend', kind: 'warning'  },
};
