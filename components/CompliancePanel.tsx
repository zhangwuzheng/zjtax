
import React, { useState, useEffect } from 'react';
import { CalculationConfig, SimulationResult, TradeMode, TaxType, Region } from '../types';

interface Props {
  config: CalculationConfig;
  results: SimulationResult;
}

export const CompliancePanel: React.FC<Props> = ({ config, results }) => {
  const { cangjing, retailer, funder } = results;
  const isConsignment = config.retailerTradeMode === TradeMode.CONSIGNMENT;
  const isGeneralTaxpayer = config.cangjingTaxType === TaxType.GENERAL;
  const isTibet = config.cangjingRegion === Region.TIBET;
  const hasLogistics = config.cangjingLogisticsCostPercent > 0 || config.funderLogisticsCostPercent > 0;

  // --- Helper: Dynamic Strategy based on Payment Term ---
  // This acts as the "Expert System" logic
  const getPaymentTermStrategy = (days: number) => {
      if (days <= 30) {
          return {
              level: 'SHORT',
              title: '短账期 (≤30天) · 快速流转策略',
              color: 'bg-emerald-50 border-emerald-200 text-emerald-800',
              icon: '⚡',
              points: [
                  { label: '合同条款优化', text: '建议约定“货到验收合格后即付款”或“见票即付”。避免复杂的验收结算流程拖延时间。' },
                  { label: '税务节奏', text: '发货/验收确认后立即开票，以发票驱动快速结算。因周期短，垫税压力小。' },
                  { label: '资金流', text: '重点提升周转率。若上游账期>30天，可实现“无本生意”的正向现金流。' }
              ]
          };
      } else if (days <= 90) {
           return {
              level: 'MEDIUM',
              title: '中账期 (31-90天) · 资金平衡策略',
              color: 'bg-amber-50 border-amber-200 text-amber-800',
              icon: '⚖️',
              points: [
                  { label: '合同条款优化', text: '争取“预收+尾款”模式 (如30%预付)。合同需明确“付款前X日提供发票”，避免过早开票导致税款空转过久。' },
                  { label: '税务节奏', text: '增值税需在次月申报缴纳。若账期90天，意味着需垫付3个月税款。需确保毛利覆盖此资金成本。' },
                  { label: '供应链金融', text: '合同建议包含“配合确权”条款，以便使用应收账款进行保理融资。' }
              ]
          };
      } else {
           return {
              level: 'LONG',
              title: '长账期 (>90天) · 风险风控策略',
              color: 'bg-rose-50 border-rose-200 text-rose-800',
              icon: '🛡️',
              points: [
                  { label: '合同条款优化', text: '必须约定“逾期违约金” (建议日万分之五) 及“所有权保留”条款。考虑加入“价格调整机制”应对资金成本波动。' },
                  { label: '税务节奏', text: '极高垫税风险。如可能，合同约定“分期收款”方式，按合同约定的收款日期产生纳税义务 (实务操作需税务局认可，难度较大)。' },
                  { label: '风险定价', text: '定价必须包含 3-5% 以上的资金溢价。建议要求渠道方提供即期商业承兑汇票，便于贴现。' }
              ]
          };
      }
  };

  const termStrategy = getPaymentTermStrategy(config.retailerPaymentTermDays);

  return (
    <div className="bg-white rounded-xl shadow-lg border border-tibet-gold/30 overflow-hidden mt-8 print:break-inside-avoid animate-fade-in">
      <div className="bg-tibet-dark text-tibet-gold px-6 py-4 flex justify-between items-center">
        <h2 className="text-lg font-bold flex items-center">
          <span className="text-2xl mr-2">⚖️</span> 合规与风控建议 (Compliance & Risk)
        </h2>
        <span className="text-xs bg-white/10 px-2 py-1 rounded border border-white/20">Smart Analysis</span>
      </div>

      <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Left Column: Core Compliance */}
        <div className="space-y-6">
            
            {/* 1. Invoice Flow */}
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 shadow-sm">
                <h3 className="text-sm font-bold text-gray-800 mb-3 uppercase tracking-wide border-b border-gray-200 pb-2">发票流合规 (Invoice Flow)</h3>
                <ul className="space-y-3 text-xs text-gray-600">
                    <li className="flex items-start">
                        <span className={`mr-2 mt-0.5 w-2 h-2 rounded-full ${isGeneralTaxpayer ? 'bg-green-500' : 'bg-orange-500'}`}></span>
                        <span>
                            <strong>藏境身份:</strong> {isGeneralTaxpayer ? '一般纳税人' : '小规模纳税人'}。
                            {isGeneralTaxpayer 
                                ? ' 向下游开具 13% 专票，链条完整，下游抵扣无障碍。' 
                                : ' 只能开具 1% 专票/普票，下游抵扣链条断裂 (13%进 -> 1%出)，需警惕下游压价风险。'}
                        </span>
                    </li>
                    <li className="flex items-start">
                        <span className="mr-2 mt-0.5 w-2 h-2 rounded-full bg-blue-500"></span>
                        <span>
                            <strong>三流一致:</strong> 务必确保 合同(藏境-渠道)、发票(藏境-渠道)、资金(渠道-藏境) 三者主体完全一致。禁止第三方代收代付。
                        </span>
                    </li>
                    {isConsignment && (
                         <li className="flex items-start">
                            <span className="mr-2 mt-0.5 w-2 h-2 rounded-full bg-purple-500"></span>
                            <span>
                                <strong>代销特殊性:</strong> 代销模式下，藏境收到代销清单时发生纳税义务。需建立严格的《代销清单》定期对账机制，避免税务滞后确认风险。
                            </span>
                        </li>
                    )}
                </ul>
            </div>

            {/* 2. Tibet Specifics */}
            {isTibet && (
                <div className="bg-tibet-cream/30 p-4 rounded-lg border border-tibet-gold/40 shadow-sm">
                    <h3 className="text-sm font-bold text-tibet-red mb-3 uppercase tracking-wide border-b border-tibet-gold/20 pb-2">西藏园区合规 (Tibet Compliance)</h3>
                    <ul className="space-y-2 text-xs text-gray-700">
                        <li className="flex gap-2">
                             <span>🏔️</span>
                             <span><strong>实质性运营:</strong> 必须在藏区有实际办公场所、人员社保缴纳记录及真实的账务处理，严禁纯空壳开票。</span>
                        </li>
                         <li className="flex gap-2">
                             <span>🚚</span>
                             <span><strong>物流轨迹:</strong> {hasLogistics ? '已有物流成本预算，合规度较高。' : '当前未配置物流成本，需补充物流合同/运单以证明贸易真实性。'} 建议保留完整的运输单据备查。</span>
                        </li>
                        <li className="flex gap-2">
                             <span>💰</span>
                             <span><strong>税返兑现:</strong> 预估税返 {new Intl.NumberFormat('zh-CN').format(cangjing.taxRefunds)} 元。需注意财政兑付周期通常滞后 3-6 个月，不可作为短期流动资金依赖。</span>
                        </li>
                    </ul>
                </div>
            )}
        </div>

        {/* Right Column: Strategic Advice (Dynamic) */}
        <div className="space-y-6">
            
            {/* Dynamic Strategy Card */}
            <div className={`p-4 rounded-lg border ${termStrategy.color} shadow-sm transition-all duration-500`}>
                <div className="flex items-center justify-between mb-3 border-b border-black/5 pb-2">
                     <h3 className="text-sm font-bold flex items-center">
                        <span className="mr-2">{termStrategy.icon}</span> {termStrategy.title}
                     </h3>
                     <span className="text-[10px] uppercase font-bold px-2 py-0.5 bg-white/50 rounded shadow-sm">
                        Payment Term: {config.retailerPaymentTermDays} Days
                     </span>
                </div>
                <div className="space-y-3">
                    {termStrategy.points.map((point, idx) => (
                        <div key={idx} className="text-xs">
                            <span className="font-bold block mb-0.5 opacity-90">{point.label}:</span>
                            <span className="opacity-80 leading-relaxed">{point.text}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Profit & Risk Warning */}
            <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                <h3 className="text-sm font-bold text-gray-800 mb-3 uppercase tracking-wide">利润与现金流风控</h3>
                 <div className="grid grid-cols-2 gap-4 text-xs">
                    <div className="bg-gray-50 p-2 rounded">
                        <div className="text-gray-500 mb-1 font-medium">资金占用成本 (Finance Cost)</div>
                        <div className="font-mono text-base font-bold text-orange-600">
                            {new Intl.NumberFormat('zh-CN', { style: 'currency', currency: 'CNY' }).format(cangjing.financeCost)}
                        </div>
                        <p className="text-[9px] text-gray-400 mt-1">需确保毛利足以覆盖此隐性成本</p>
                    </div>
                     <div className="bg-gray-50 p-2 rounded">
                        <div className="text-gray-500 mb-1 font-medium">综合税负率 (Tax Burden)</div>
                        <div className="font-mono text-base font-bold text-blue-600">
                            {(cangjing.taxBurdenRate * 100).toFixed(2)}%
                        </div>
                        <p className="text-[9px] text-gray-400 mt-1">营收的实际纳税比例</p>
                    </div>
                </div>
                
                {cangjing.netProfit < 0 && (
                     <div className="mt-3 bg-red-50 text-red-700 px-3 py-2 rounded text-xs font-bold border border-red-100 flex items-center animate-pulse">
                        <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                        当前模型亏损，建议：1. 提高加价率; 2. 压缩账期; 3. 申请更高税返。
                     </div>
                )}
            </div>

        </div>
      </div>
    </div>
  );
};
