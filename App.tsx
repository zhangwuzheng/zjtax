
import React, { useState, useMemo } from 'react';
import { Manufacturer, Product, Funder, Retailer, CalculationConfig, SimulationResult, TaxType, PackageItem, Region, TradeMode } from './types';
import { calculateSimulation } from './utils/calculator';
import { InputSection } from './components/InputSection';
import { EntityCard } from './components/EntityCard';
import { FlowVisualizer } from './components/FlowVisualizer';
import { SettingsModal } from './components/SettingsModal';
import { CompliancePanel } from './components/CompliancePanel';
import { PrintSummary } from './components/PrintSummary';

// --- Initial Data ---
const initialManufacturers: Manufacturer[] = [
  { 
    id: 'm1', name: '拉萨特产总厂 (一般)', taxType: TaxType.GENERAL, 
    products: [
      { id: 'p1-1', name: '极品虫草 (5g)', basePrice: 800, msrp: 1388 },
      { id: 'p1-2', name: '藏红花礼盒', basePrice: 200, msrp: 398 }
    ] 
  },
  { 
    id: 'm2', name: '林芝松茸合作社 (小规模)', taxType: TaxType.SMALL, 
    products: [
      { id: 'p2-1', name: '干松茸 (250g)', basePrice: 150, msrp: 298 },
      { id: 'p2-2', name: '野生灵芝', basePrice: 300, msrp: 588 }
    ] 
  }
];

const initialFunders: Funder[] = [
  { id: 'f1', name: '宸铭供应链 (默认)', defaultMarkupPercent: 3, defaultPaymentTermMonths: 6 },
  { id: 'f2', name: '其它资方 (短期)', defaultMarkupPercent: 2, defaultPaymentTermMonths: 3 },
];

const initialRetailers: Retailer[] = [
  { id: 'r1', name: '德商渠道 (商超)', defaultMarkupPercent: 20, defaultPaymentTermDays: 45 },
  { id: 'r2', name: '电商直播渠道', defaultMarkupPercent: 35, defaultPaymentTermDays: 15 },
];

const App: React.FC = () => {
  // Database State
  const [manufacturers, setManufacturers] = useState<Manufacturer[]>(initialManufacturers);
  const [funders, setFunders] = useState<Funder[]>(initialFunders);
  const [retailers, setRetailers] = useState<Retailer[]>(initialRetailers);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Initialize with a default package containing one item
  const defaultPackageItem: PackageItem = {
    id: 'default-item-1',
    manufacturer: initialManufacturers[0],
    product: initialManufacturers[0].products[0],
    quantity: 1
  };

  // Active Configuration State
  const [config, setConfig] = useState<CalculationConfig>({
    packageItems: [defaultPackageItem],
    funder: initialFunders[0],
    retailer: initialRetailers[0],
    
    // Global Settings
    funderInterestRate: 6.0,
    cangjingInterestRate: 4.35,
    cangjingOperationalCostPercent: 2.0,
    defaultMainlandSurcharge: 12.0,
    defaultMainlandIncomeTax: 25.0,
    defaultTibetSurcharge: 1.0,
    defaultTibetIncomeTax: 15.0,

    // Transaction Links (New Flexible Structure)
    transactionLinks: [
        { 
            id: 'link-1', 
            name: '厂商到宸铭', 
            fromEntityId: 'manufacturer', 
            toEntityId: 'funder', 
            markupPercent: initialFunders[0].defaultMarkupPercent, 
            paymentTermDays: initialFunders[0].defaultPaymentTermMonths * 30,
            isEnabled: true
        },
        { 
            id: 'link-2', 
            name: '宸铭到藏境', 
            fromEntityId: 'funder', 
            toEntityId: 'cangjing', 
            markupPercent: 10, 
            paymentTermDays: 0,
            isEnabled: true
        },
        { 
            id: 'link-3', 
            name: '藏境到终端', 
            fromEntityId: 'cangjing', 
            toEntityId: 'retailer', 
            markupPercent: initialRetailers[0].defaultMarkupPercent, 
            paymentTermDays: initialRetailers[0].defaultPaymentTermDays,
            isEnabled: true
        }
    ],

    // Funder
    funderRegion: Region.TIBET, // Changed Default to Tibet
    funderMarkupPercent: initialFunders[0].defaultMarkupPercent,
    funderPaymentTermMonths: initialFunders[0].defaultPaymentTermMonths,
    funderVatSurchargeRate: 1.0, // Default Tibet Surcharge
    funderIncomeTaxRate: 15.0,   // Default Tibet Income Tax
    funderVatRefundRate: 0,
    funderIncomeTaxRefundRate: 0,
    funderLogisticsCostPercent: 0, // Default 0

    // Cangjing
    cangjingRegion: Region.TIBET,
    cangjingMarkupPercent: 10,
    cangjingTaxType: TaxType.GENERAL, 
    cangjingVatSurchargeRate: 1.0, 
    cangjingIncomeTaxRate: 15.0,
    cangjingVatRefundRate: 0,
    cangjingIncomeTaxRefundRate: 0,
    cangjingLogisticsCostPercent: 0, // Default 0

    // Intermediary (Default Inactive)
    hasIntermediary: false,
    traderRegion: Region.MAINLAND,
    traderTaxType: TaxType.GENERAL,
    traderMarkupPercent: 5.0,
    traderPaymentTermDays: 0,
    traderVatSurchargeRate: 12.0,
    traderIncomeTaxRate: 25.0,

    // Retailer
    retailerRegion: Region.MAINLAND,
    retailerTradeMode: TradeMode.SALES, 
    retailerMarkupPercent: initialRetailers[0].defaultMarkupPercent,
    retailerPaymentTermDays: initialRetailers[0].defaultPaymentTermDays,
    retailerVatSurchargeRate: 12.0,
    retailerIncomeTaxRate: 25.0
  });

  // Calculate results synchronously during render to ensure immediate updates
  const results = useMemo(() => calculateSimulation(config), [config]);

  const handleConfigChange = (updates: Partial<CalculationConfig>) => {
    setConfig(prev => ({ ...prev, ...updates }));
  };

  // --- Handlers for Data Management ---
  const handleAddManufacturer = (name: string, taxType: TaxType) => {
    const newId = `m-${Date.now()}`;
    setManufacturers(prev => [...prev, { id: newId, name, taxType, products: [] }]);
  };
  
  const handleDeleteManufacturer = (id: string) => {
     setManufacturers(prev => prev.filter(m => m.id !== id));
  };

  const handleAddProduct = (manufacturerId: string, name: string, basePrice: number, msrp: number) => {
    setManufacturers(prev => prev.map(m => {
      if (m.id === manufacturerId) {
        const newProduct: Product = { id: `p-${Date.now()}`, name, basePrice, msrp };
        return { ...m, products: [...m.products, newProduct] };
      }
      return m;
    }));
  };
  
  const handleDeleteProduct = (mfgId: string, prodId: string) => {
      setManufacturers(prev => prev.map(m => {
          if (m.id === mfgId) {
              return { ...m, products: m.products.filter(p => p.id !== prodId) };
          }
          return m;
      }));
  };

  const handleAddFunder = (name: string, markup: number, term: number) => {
      const newFunder: Funder = { 
          id: `f-${Date.now()}`, 
          name, 
          defaultMarkupPercent: markup, 
          defaultPaymentTermMonths: term 
      };
      setFunders(prev => [...prev, newFunder]);
  };
  
  const handleDeleteFunder = (id: string) => {
      setFunders(prev => prev.filter(f => f.id !== id));
  };

  const handleAddRetailer = (name: string, markup: number, term: number) => {
      const newRetailer: Retailer = { 
          id: `r-${Date.now()}`, 
          name, 
          defaultMarkupPercent: markup, 
          defaultPaymentTermDays: term 
      };
      setRetailers(prev => [...prev, newRetailer]);
  };
  
  const handleDeleteRetailer = (id: string) => {
      setRetailers(prev => prev.filter(r => r.id !== id));
  };

  const handlePrint = () => {
    window.print();
  };

  const gridColsClass = config.hasIntermediary 
    ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-5" // 5 cols for 5 entities (Mfg, Funder, CJ, Trader, Retailer)
    : "grid-cols-1 md:grid-cols-2 lg:grid-cols-4"; // 4 cols

  return (
    <div className="min-h-screen bg-[#FDFBF7] font-sans pb-20 text-gray-800">
      {/* Settings Modal */}
      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)}
        config={config}
        onConfigChange={handleConfigChange}
        
        manufacturers={manufacturers}
        funders={funders}
        retailers={retailers}
        
        onAddManufacturer={handleAddManufacturer}
        onDeleteManufacturer={handleDeleteManufacturer}
        onAddProduct={handleAddProduct}
        onDeleteProduct={handleDeleteProduct}
        onAddFunder={handleAddFunder}
        onDeleteFunder={handleDeleteFunder}
        onAddRetailer={handleAddRetailer}
        onDeleteRetailer={handleDeleteRetailer}
      />

      {/* Header */}
      <header className="bg-gradient-to-r from-tibet-sky via-tibet-dark to-tibet-red text-white shadow-xl border-b-4 border-tibet-gold relative overflow-hidden print:shadow-none print:bg-white print:text-black">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 print:hidden"></div>
        <div className="container mx-auto px-4 py-8 relative z-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between">
            <div>
               <h1 className="text-3xl md:text-4xl font-serif font-bold tracking-wide text-tibet-gold mb-2 print:text-tibet-red flex items-center">
                 <img 
                    src="https://zangjingtech.oss-cn-chengdu.aliyuncs.com/3.png" 
                    alt="藏境山水 Logo" 
                    className="h-16 w-auto mr-4 drop-shadow-md"
                 />
                 <span>藏境山水</span>
               </h1>
               <h2 className="text-xl md:text-2xl font-light opacity-90 print:text-gray-600 print:text-lg pl-2">交易链路财税计算方案</h2>
            </div>
            <div className="mt-4 md:mt-0 flex items-center gap-3 print:hidden">
              <button 
                onClick={() => setIsSettingsOpen(true)}
                className="bg-tibet-gold text-tibet-dark hover:bg-yellow-400 font-bold px-4 py-2 rounded shadow-lg flex items-center transform transition hover:scale-105 border-2 border-white/20"
              >
                <span className="mr-2 text-xl">⚙️</span> 系统参数与数据管理
              </button>
              <button 
                onClick={handlePrint}
                className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded shadow text-sm flex items-center transition-colors border border-white/20"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                导出方案 (PDF)
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 -mt-6 relative z-20 space-y-8 print:mt-0 print:pt-4">
        
        {/* Configuration Panel - Hidden in Print */}
        <InputSection 
          config={config} 
          manufacturers={manufacturers}
          funders={funders}
          retailers={retailers}
          onConfigChange={handleConfigChange}
        />

        {/* Read-Only Summary - Visible ONLY in Print */}
        <PrintSummary config={config} />

        {/* Visualizer */}
        {results && (
             <div className="print:break-inside-avoid">
                <FlowVisualizer results={results} config={config} />
             </div>
        )}

        {/* Results Grid */}
        {results && (
          <div className="print:break-before-auto">
            <div className="flex items-center space-x-2 mb-6 print:mb-4">
                <span className="bg-tibet-gold text-tibet-dark w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold print:border print:border-black">2</span>
                <h2 className="text-xl font-bold text-gray-800">财税利润拆解 (Financial Analysis)</h2>
            </div>
           
            <div className={`grid ${gridColsClass} gap-6 print:grid-cols-4 print:gap-4`}>
              <EntityCard data={results.manufacturer} />
              <EntityCard data={results.funder} isProfitWarning={results.funder.netProfit < 1} />
              <EntityCard data={results.cangjing} isProfitWarning={results.cangjing.netProfit < 0} />
              {results.trader && <EntityCard data={results.trader} />}
              <EntityCard data={results.retailer} />
            </div>
          </div>
        )}

        {/* Key Insights / Summary */}
        {results && (
            <div className="bg-white border-l-4 border-tibet-gold p-6 rounded-r-lg shadow-sm print:shadow-none print:border">
                <h3 className="font-bold text-lg text-gray-800 mb-3 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-tibet-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  方案核心洞察 (Executive Summary)
                </h3>
                <ul className="space-y-3 text-sm text-gray-600">
                    <li className="flex items-start">
                        <span className="text-tibet-red mr-2">•</span>
                        <span>
                           <strong>{results.funder.name}:</strong> 
                           合同总价 {new Intl.NumberFormat('zh-CN', { style: 'currency', currency: 'CNY' }).format(results.funder.outPriceInclTax)}。
                           资金成本 {new Intl.NumberFormat('zh-CN', { style: 'currency', currency: 'CNY' }).format(results.funder.financeCost)} (年化{config.funderInterestRate}%)。
                           {config.funderLogisticsCostPercent > 0 && <span> 物流成本占比 {config.funderLogisticsCostPercent}%。</span>}
                        </span>
                    </li>
                    <li className="flex items-start">
                        <span className="text-tibet-red mr-2">•</span>
                        <span>
                           <strong>藏境山水:</strong> 
                           {config.hasIntermediary ? (
                               <>下设<strong>中间贸易商</strong>，</>
                           ) : (
                               config.retailerTradeMode === TradeMode.CONSIGNMENT ? (
                                   <>采用<strong>委托代销模式</strong>，承担终端销售全额增值税，支付渠道佣金。</>
                               ) : (
                                   <>采用<strong>经销买卖模式</strong>，向下游开具全额货款发票。</>
                               )
                           )}
                           {config.cangjingTaxType === TaxType.GENERAL 
                             ? ' 身份：一般纳税人(13%)。' 
                             : ' 身份：小规模纳税人(1%)。'}
                        </span>
                    </li>
                    <li className="flex items-start">
                         <span className="text-tibet-red mr-2">•</span>
                        <span>
                           <strong>渠道利润:</strong> 
                           {results.retailer.name} 净利 {new Intl.NumberFormat('zh-CN', { style: 'currency', currency: 'CNY' }).format(results.retailer.netProfit)}。
                           {config.retailerTradeMode === TradeMode.CONSIGNMENT && ' (已扣除6%服务费增值税)'}
                           {results.retailer.warnings.some(w => w.includes('高于指导价')) && (
                               <strong className="text-red-600 ml-1 block">⚠️ 警告: 终端售价已超过商品建议零售价!</strong>
                           )}
                        </span>
                    </li>
                </ul>
            </div>
        )}

        {/* New Compliance Panel - Placed at the bottom */}
        {results && (
           <CompliancePanel config={config} results={results} />
        )}

      </main>
      
      <footer className="mt-16 py-8 bg-tibet-dark text-center text-gray-400 text-sm print:hidden">
        <p className="font-serif">藏境山水 · 财税合规计算系统</p>
        <p className="mt-2 text-xs opacity-50">© 2024 CANGJING SHANSHUI. Internal Use Only.</p>
      </footer>
    </div>
  );
};

export default App;
