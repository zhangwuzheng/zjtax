
export enum TaxType {
  GENERAL = 0.13,
  SMALL = 0.01,
  SERVICE = 0.06, // Added for Consignment/Service
}

export enum Region {
  TIBET = 'tibet',
  MAINLAND = 'mainland',
}

export enum TradeMode {
  SALES = 'sales',         // 经销 (Buy/Sell)
  CONSIGNMENT = 'consignment' // 代销 (Commission/Service)
}

// Data Models
export interface Product {
  id: string;
  name: string;
  basePrice: number; // Tax Inclusive Cost
  msrp: number;      // Manufacturer Suggested Retail Price
}

export interface Manufacturer {
  id: string;
  name: string;
  taxType: TaxType;
  products: Product[];
}

export interface Funder {
  id: string;
  name: string;
  defaultMarkupPercent: number;
  defaultPaymentTermMonths: number;
}

export interface Retailer {
  id: string;
  name: string;
  defaultMarkupPercent: number;
  defaultPaymentTermDays: number;
}

export interface PackageItem {
  id: string;
  manufacturer: Manufacturer;
  product: Product;
  quantity: number;
}

export interface GlobalSettings {
  // Global Financial Params
  funderInterestRate: number;
  cangjingInterestRate: number;
  cangjingOperationalCostPercent: number;
  
  // Tax Policy Defaults (for auto-filling)
  defaultMainlandSurcharge: number;
  defaultMainlandIncomeTax: number;
  
  defaultTibetSurcharge: number;
  defaultTibetIncomeTax: number;
  defaultTibetVatRefund: number;     // % of VAT Paid refunded
  defaultTibetIncomeTaxRefund: number; // % of Income Tax Paid refunded
}

// New Interface for flexible transaction steps
export interface TransactionLinkConfig {
  id: string;
  name: string;         // e.g. "厂商到宸铭"
  fromEntityId: string; // Source ID or Role
  toEntityId: string;   // Target ID or Role
  markupPercent: number;
  paymentTermDays: number;
  description?: string;
  isEnabled: boolean;
}

// The configuration for a specific calculation run
export interface CalculationConfig extends GlobalSettings {
  packageItems: PackageItem[]; 
  
  funder: Funder;
  retailer: Retailer;

  // Flexible Flow Definition
  transactionLinks: TransactionLinkConfig[];
  
  // Legacy Config Fields (kept for backward compatibility during refactor)
  // Funder Config
  funderRegion: Region;
  funderMarkupPercent: number;
  funderPaymentTermMonths: number;
  funderVatSurchargeRate: number;
  funderIncomeTaxRate: number;
  funderVatRefundRate: number;       
  funderIncomeTaxRefundRate: number; 
  funderLogisticsCostPercent: number; // New: Logistics/Warehousing Cost %
  
  // Cangjing Config
  cangjingRegion: Region;
  cangjingMarkupPercent: number;
  cangjingTaxType: TaxType; 
  cangjingVatSurchargeRate: number;
  cangjingIncomeTaxRate: number;
  cangjingVatRefundRate: number;       
  cangjingIncomeTaxRefundRate: number; 
  cangjingLogisticsCostPercent: number; // New: Logistics/Warehousing Cost %
  
  // Intermediary (Trader) Config
  hasIntermediary: boolean;
  traderRegion: Region;
  traderTaxType: TaxType;
  traderMarkupPercent: number;
  traderPaymentTermDays: number; 
  traderVatSurchargeRate: number;
  traderIncomeTaxRate: number;
  
  // Retailer Config
  retailerRegion: Region;
  retailerTradeMode: TradeMode; 
  retailerMarkupPercent: number;
  retailerPaymentTermDays: number;
  retailerVatSurchargeRate: number;
  retailerIncomeTaxRate: number;
}

export interface ProductPriceDetail {
  productName: string;
  quantity: number;
  unitPriceInclTax: number;
  totalPriceInclTax: number;
}

export interface EntityResult {
  id: string;
  name: string;
  role: string;
  region: Region; 
  tradeMode?: TradeMode; 
  inPriceExclTax: number;
  inPriceInclTax: number;
  outPriceExclTax: number;
  outPriceInclTax: number;
  vatInput: number;
  vatOutput: number;
  vatPayable: number;
  surcharges: number;
  taxRefunds: number; // New field for total tax refunds
  financeCost: number;
  operationalCost: number;
  grossProfit: number;
  netProfit: number;
  cashOutflow: number;
  taxBurdenRate: number;
  notes: string[];
  warnings: string[]; // New for specific alerts like "Missing Invoice"
  complianceTips?: string[]; // New field for optimization advice
  isCentralNode?: boolean;
  priceBreakdown: ProductPriceDetail[]; 
}

export interface SimulationResult {
  manufacturer: EntityResult;
  funder: EntityResult;
  cangjing: EntityResult;
  trader?: EntityResult; 
  retailer: EntityResult;
}
