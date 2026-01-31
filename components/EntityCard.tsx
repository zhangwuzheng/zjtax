import React from 'react';
import { EntityResult, Region, TradeMode } from '../types';

interface Props {
  data: EntityResult;
  isProfitWarning?: boolean;
}

export const EntityCard: React.FC<Props> = ({ data, isProfitWarning }) => {
  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('zh-CN', { style: 'currency', currency: 'CNY' }).format(val);

  return (
    <div className={`rounded-xl shadow-sm border ${isProfitWarning ? 'border-red-400 bg-red-50' : 'border-gray-200 bg-white'} overflow-hidden flex flex-col h-full hover:shadow-md transition-shadow relative`}>
      
      {/* Warning Badges */}
      {data.warnings && data.warnings.length > 0 && (
          <div className="absolute top-0 right-0 p-1 flex flex-col items-end gap-1 z-10">
              {data.warnings.map((w, idx) => (
                  <span key={idx} className="text-[10px] bg-red-100 text-red-600 border border-red-200 px-1.5 py-0.5 rounded shadow-sm font-bold animate-pulse">
                      {w}
                  </span>
              ))}
          </div>
      )}

      <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
        <div className="flex justify-between items-start mb-2">
             <div>
                <h3 className="font-bold text-lg text-gray-800">{data.name}</h3>
                <p className="text-xs text-gray-500">{data.role}</p>
             </div>
             <div className="flex flex-col items-end gap-1 mt-4 md:mt-0">
                 <span className={`text-[9px] px-1.5 py-0.5 rounded border uppercase ${data.region === Region.TIBET ? 'bg-tibet-red text-white border-tibet-red' : 'bg-white text-gray-500 border-gray-300'}`}>
                    {data.region === Region.TIBET ? '西藏主体' : '内地主体'}
                 </span>
                 {data.tradeMode && (
                     <span className={`text-[9px] px-1.5 py-0.5 rounded border uppercase ${data.tradeMode === TradeMode.CONSIGNMENT ? 'bg-blue-100 text-blue-800 border-blue-200' : 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                        {data.tradeMode === TradeMode.CONSIGNMENT ? '代销模式' : '经销模式'}
                     </span>
                 )}
             </div>
        </div>
        <div className="flex flex-wrap justify-end gap-1">
             {data.notes.map((note, idx) => (
               <span key={idx} className={`text-[9px] px-1.5 py-0.5 rounded ${idx === 0 ? 'bg-gray-200 font-bold' : 'bg-yellow-100 text-yellow-800'}`}>
                 {note}
               </span>
             ))}
        </div>
      </div>

      <div className="p-4 space-y-4 flex-grow">
        
        {/* Contract Price - Table View */}
        <div className="bg-blue-50 border border-blue-100 rounded p-2">
            <div className="text-[10px] text-blue-500 uppercase tracking-wider font-bold mb-1 text-center">
                {data.tradeMode === TradeMode.CONSIGNMENT ? '结算明细 (佣金制)' : '销售合同明细 (含税)'}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-[10px]">
                <thead>
                  <tr className="border-b border-blue-200 text-blue-400">
                    <th className="text-left py-1 font-normal">商品</th>
                    <th className="text-right py-1 font-normal">单价</th>
                    <th className="text-right py-1 font-normal">总价</th>
                  </tr>
                </thead>
                <tbody>
                  {data.priceBreakdown.map((item, idx) => (
                    <tr key={idx} className="border-b border-blue-100 last:border-0">
                      <td className="py-1 text-gray-700 truncate max-w-[80px]">{item.productName} <span className="text-gray-400">x{item.quantity}</span></td>
                      <td className="py-1 text-right text-gray-600">{item.unitPriceInclTax.toLocaleString('zh-CN', {minimumFractionDigits: 0, maximumFractionDigits: 0})}</td>
                      <td className="py-1 text-right font-bold text-blue-800">{item.totalPriceInclTax.toLocaleString('zh-CN', {minimumFractionDigits: 0, maximumFractionDigits: 0})}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t border-blue-200">
                     <td colSpan={2} className="py-1 text-right font-bold text-blue-600">合计</td>
                     <td className="py-1 text-right font-bold text-blue-800">{data.outPriceInclTax.toLocaleString('zh-CN', {style:'currency', currency:'CNY'})}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
        </div>

        {/* Detailed Price Flow */}
        <div className="grid grid-cols-2 gap-2 text-sm mt-2">
          <div className="text-gray-500 text-xs">采购成本 (含税)</div>
          <div className="text-right font-medium font-mono text-xs">{formatCurrency(data.inPriceInclTax)}</div>
          
          <div className="text-gray-500 text-xs">不含税收入 (净额)</div>
          <div className="text-right font-medium font-mono text-xs">{formatCurrency(data.outPriceExclTax)}</div>
        </div>

        <div className="h-px bg-gray-100"></div>

        {/* Tax Breakdown */}
        <div className="space-y-1">
          <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">税负详情 (Tax)</h4>
          <div className="flex justify-between text-sm">
            <span>应缴增值税</span>
            <span className="text-gray-700">{formatCurrency(data.vatPayable)}</span>
          </div>
          <div className="flex justify-between text-xs text-gray-400">
             <span className="pl-2">↳ 进项 Input</span>
             <span>-{formatCurrency(data.vatInput)}</span>
          </div>
           <div className="flex justify-between text-xs text-gray-400">
             <span className="pl-2">↳ 销项 Output</span>
             <span>{formatCurrency(data.vatOutput)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>附加税</span>
            <span className="text-gray-700">{formatCurrency(data.surcharges)}</span>
          </div>
          {data.taxRefunds > 0 && (
              <div className="flex justify-between text-sm text-green-600 font-bold border-t border-dashed border-gray-200 pt-1 mt-1">
                  <span>税收返还 (Refund)</span>
                  <span>+{formatCurrency(data.taxRefunds)}</span>
              </div>
          )}
        </div>

        <div className="h-px bg-gray-100"></div>

        {/* Cost Analysis */}
        <div className="space-y-1">
          <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">成本拆解 (Costs)</h4>
           <div className="flex justify-between text-sm">
            <span>资金成本</span>
            <span className={`${data.financeCost > 0 ? 'text-orange-600' : 'text-gray-400'}`}>{formatCurrency(data.financeCost)}</span>
          </div>
          {data.operationalCost > 0 && (
             <div className="flex justify-between text-sm">
              <span>运营成本</span>
              <span className="text-orange-600">{formatCurrency(data.operationalCost)}</span>
            </div>
          )}
        </div>
      </div>

      <div className={`p-4 border-t ${isProfitWarning ? 'bg-red-100' : 'bg-gray-50'}`}>
        <div className="flex justify-between items-end">
          <div>
            <div className="text-xs text-gray-500">毛利 (Gross)</div>
            <div className="text-sm font-semibold text-gray-700">{formatCurrency(data.grossProfit)}</div>
          </div>
          <div className="text-right">
            <div className="text-xs text-gray-500">净利 (Net Profit)</div>
            <div className={`text-xl font-bold ${data.netProfit < 0 ? 'text-red-600' : 'text-green-600'}`}>
              {formatCurrency(data.netProfit)}
            </div>
          </div>
        </div>
        {data.netProfit < 0 && (
            <div className="mt-2 text-xs text-red-600 font-bold flex items-center">
                <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                亏损预警
            </div>
        )}
      </div>
    </div>
  );
};