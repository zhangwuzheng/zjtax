
import React from 'react';
import { SimulationResult, CalculationConfig, TradeMode, TaxType } from '../types';

interface Props {
  results: SimulationResult;
  config: CalculationConfig;
}

export const FlowVisualizer: React.FC<Props> = ({ results, config }) => {
  const formatMoney = (val: number) => new Intl.NumberFormat('zh-CN', { style: 'currency', currency: 'CNY', maximumFractionDigits: 0 }).format(val);
  
  // Helper to determine invoice label
  const getInvoiceLabel = (taxType: TaxType) => {
    if (taxType === TaxType.GENERAL) return '13% 专票';
    if (taxType === TaxType.SMALL) return '1% 普/专';
    return '普票';
  };

  // --- Components ---

  const EntityNode = ({ data, icon, color, subLabel }: any) => (
    <div className="flex flex-col items-center z-10 w-32 shrink-0">
      <div className={`w-14 h-14 rounded-xl shadow-md flex items-center justify-center ${color} text-white mb-2 ring-2 ring-white`}>
        <div className="text-2xl">{icon}</div>
      </div>
      <div className="text-center bg-white/90 backdrop-blur border border-gray-200 rounded px-2 py-1 w-full shadow-sm">
        <div className="font-bold text-gray-800 text-[10px] truncate">{data.name}</div>
        <div className="text-[9px] text-gray-500 mb-0.5">{subLabel}</div>
        <div className="font-mono font-bold text-tibet-red text-[10px]">{formatMoney(data.outPriceInclTax)}</div>
      </div>
    </div>
  );

  const ConnectionLines = ({ goods, invoice, funds }: { goods: string, invoice: string, funds: string }) => (
    <div className="flex-1 min-w-[120px] flex flex-col justify-center space-y-3 px-2">
      
      {/* Goods Flow (Right) */}
      <div className="group relative h-px bg-gray-300 w-full">
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-[8px] text-gray-500 bg-gray-50 px-1 rounded border border-gray-200 flex items-center gap-1 whitespace-nowrap">
           <span>📦</span> {goods}
        </div>
        <div className="absolute right-0 -top-[3px] w-0 h-0 border-t-[3px] border-t-transparent border-l-[6px] border-l-gray-300 border-b-[3px] border-b-transparent"></div>
      </div>

      {/* Invoice Flow (Right) */}
      <div className="group relative h-px border-t border-dashed border-orange-300 w-full">
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-[8px] text-orange-600 bg-orange-50 px-1 rounded border border-orange-100 flex items-center gap-1 whitespace-nowrap font-medium">
           <span>🧾</span> {invoice}
        </div>
        <div className="absolute right-0 -top-[4px] w-0 h-0 border-t-[3px] border-t-transparent border-l-[6px] border-l-orange-300 border-b-[3px] border-b-transparent"></div>
      </div>

      {/* Funds Flow (Left) */}
      <div className="group relative h-px border-t border-dotted border-green-400 w-full">
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-[8px] text-green-700 bg-green-50 px-1 rounded border border-green-100 flex items-center gap-1 whitespace-nowrap font-bold">
           <span>💰</span> {funds}
        </div>
        {/* Arrow pointing Left */}
        <div className="absolute left-0 -top-[4px] w-0 h-0 border-t-[3px] border-t-transparent border-r-[6px] border-r-green-400 border-b-[3px] border-b-transparent"></div>
      </div>

    </div>
  );

  // --- Build Flow Sequence ---
  const sequence = [];

  // 1. Manufacturer Node
  sequence.push({
    type: 'node',
    id: 'mfg',
    component: <EntityNode 
      data={results.manufacturer} 
      icon="🏭" 
      color="bg-gray-500" 
      subLabel="源头 (Source)" 
    />
  });

  // 2. Link: Mfg -> Funder
  const mfgTaxType = config.packageItems[0]?.manufacturer.taxType || TaxType.GENERAL;
  sequence.push({
    type: 'conn',
    id: 'c1',
    component: <ConnectionLines 
      goods="现货/物流交付" 
      invoice={getInvoiceLabel(mfgTaxType)} 
      funds="现结 (T+0)" 
    />
  });

  // 3. Funder Node
  sequence.push({
    type: 'node',
    id: 'funder',
    component: <EntityNode 
      data={results.funder} 
      icon="🏦" 
      color="bg-orange-500" 
      subLabel="垫资 (Funder)" 
    />
  });

  // 4. Link: Funder -> Cangjing
  sequence.push({
    type: 'conn',
    id: 'c2',
    component: <ConnectionLines 
      goods="货权转移" 
      invoice="13% 专票" 
      funds={`${config.funderPaymentTermMonths}个月 账期`} 
    />
  });

  // 5. Cangjing Node
  sequence.push({
    type: 'node',
    id: 'cangjing',
    component: <EntityNode 
      data={results.cangjing} 
      icon="🏔️" 
      color="bg-tibet-gold" 
      subLabel="藏境 (Platform)" 
    />
  });

  let lastTaxType = config.cangjingTaxType;

  // 6. Optional: Trader
  if (config.hasIntermediary && results.trader) {
    sequence.push({
      type: 'conn',
      id: 'c3',
      component: <ConnectionLines 
        goods="调拨" 
        invoice={getInvoiceLabel(lastTaxType)} 
        funds={config.traderPaymentTermDays ? `${config.traderPaymentTermDays}天` : '现结'} 
      />
    });

    sequence.push({
      type: 'node',
      id: 'trader',
      component: <EntityNode 
        data={results.trader} 
        icon="🚢" 
        color="bg-purple-500" 
        subLabel="贸易 (Trader)" 
      />
    });
    
    lastTaxType = config.traderTaxType;
  }

  // 7. Link: Last -> Retailer
  const isConsignment = config.retailerTradeMode === TradeMode.CONSIGNMENT;
  sequence.push({
    type: 'conn',
    id: 'c4',
    component: <ConnectionLines 
      goods="终端交付" 
      invoice={isConsignment ? '代销清单结算' : getInvoiceLabel(lastTaxType)} 
      funds={`${config.retailerPaymentTermDays}天 回款`} 
    />
  });

  // 8. Retailer Node
  sequence.push({
    type: 'node',
    id: 'retailer',
    component: <EntityNode 
      data={results.retailer} 
      icon="🏪" 
      color="bg-blue-600" 
      subLabel="渠道 (Retailer)" 
    />
  });

  return (
    <div className="mt-8 mb-8 p-6 bg-gradient-to-b from-gray-50 to-white rounded-xl border border-gray-100 overflow-x-auto print:overflow-visible print:border-none print:shadow-none print:mt-4 print:p-0">
       <div className="min-w-[800px] flex items-center justify-between mx-auto max-w-6xl print:w-full print:min-w-0">
          {sequence.map((item) => (
            <React.Fragment key={item.id}>
              {item.component}
            </React.Fragment>
          ))}
       </div>
       <div className="flex justify-center gap-6 mt-6 text-[10px] text-gray-400 print:hidden">
          <div className="flex items-center"><span className="w-4 h-px bg-gray-300 mr-2"></span> 📦 实物/货权流</div>
          <div className="flex items-center"><span className="w-4 h-px border-t border-dashed border-orange-300 mr-2"></span> 🧾 发票流</div>
          <div className="flex items-center"><span className="w-4 h-px border-t border-dotted border-green-400 mr-2"></span> 💰 资金流 (回款方向)</div>
       </div>
    </div>
  );
};
