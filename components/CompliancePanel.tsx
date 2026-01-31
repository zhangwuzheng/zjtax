
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

  // AI Analysis State
  const [aiAnalysis, setAiAnalysis] = useState<string>('');
  const [loading, setLoading] = useState(false);

  // Clear AI analysis when key configuration changes to prevent stale advice
  useEffect(() => {
    setAiAnalysis('');
  }, [
    config.retailerTradeMode,
    config.cangjingTaxType,
    config.cangjingRegion,
    config.funderPaymentTermMonths,
    config.retailerPaymentTermDays,
    config.hasIntermediary,
    config.cangjingLogisticsCostPercent,
    config.funderLogisticsCostPercent
  ]);

  // --- Markdown Rendering Logic ---
  const parseInlineMarkdown = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} className="font-bold text-indigo-900 bg-indigo-50 px-1 rounded mx-0.5">{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };

  const renderMarkdown = (text: string) => {
    if (!text) return null;
    return text.split('\n').map((line, index) => {
      const trimmed = line.trim();
      
      // H3 (### Title)
      if (trimmed.startsWith('### ')) {
        return <h3 key={index} className="text-lg font-bold text-gray-800 mt-6 mb-3 flex items-center border-l-4 border-indigo-500 pl-3">{parseInlineMarkdown(trimmed.replace(/^###\s+/, ''))}</h3>;
      }

      // H4 (#### Title)
      if (trimmed.startsWith('#### ')) {
        return <h4 key={index} className="text-md font-bold text-indigo-700 mt-4 mb-2">{parseInlineMarkdown(trimmed.replace(/^####\s+/, ''))}</h4>;
      }
      
      // Bullet List (- Item)
      if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
        return (
          <div key={index} className="flex items-start mb-2 pl-1">
             <span className="text-indigo-400 mr-2 mt-1.5 text-[8px] flex-shrink-0">●</span>
             <div className="text-sm text-gray-700 leading-relaxed">{parseInlineMarkdown(trimmed.replace(/^[\-\*]\s+/, ''))}</div>
          </div>
        );
      }

      // Numbered List (1. Item)
      if (/^\d+\.\s/.test(trimmed)) {
          const match = trimmed.match(/^(\d+)\.\s/);
          const num = match ? match[1] : '•';
          const content = trimmed.replace(/^\d+\.\s+/, '');
          return (
            <div key={index} className="flex items-start mb-3 bg-gray-50 p-3 rounded-lg border border-gray-100/50 hover:bg-white hover:shadow-sm transition-all">
               <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center bg-white border border-indigo-100 text-indigo-600 rounded-full text-xs font-bold mr-3 shadow-sm">{num}</span>
               <div className="text-sm text-gray-700 leading-relaxed pt-0.5">{parseInlineMarkdown(content)}</div>
            </div>
          );
      }

      // Empty line
      if (!trimmed) return <div key={index} className="h-3" />;

      // Paragraph
      return <div key={index} className="text-sm text-gray-600 mb-2 leading-relaxed">{parseInlineMarkdown(line)}</div>;
    });
  };

  const handleAiAnalyze = async () => {
    setLoading(true);
    setAiAnalysis('');
    
    try {
        const cashFlowGap = config.funderPaymentTermMonths * 30 - config.retailerPaymentTermDays;
        const prompt = `
        【角色设定】
        你是**藏境山水（Cangjing Shanshui）的CFO兼首席税务官**。你的核心目标是保障公司的资金安全、税务合规及利润最大化。请基于以下数据，向CEO提供一份决策简报。

        【我方（藏境）核心画像】
        - 注册地：${isTibet ? '西藏（享受西部大开发15%所得税及地方返还）' : '内地（无特殊优惠）'}
        - 纳税身份：${isGeneralTaxpayer ? '一般纳税人 (13%税率)' : '小规模纳税人 (1%征收率)'}
        - 运营现状：${hasLogistics ? `已配置物流仓储成本（占比${config.cangjingLogisticsCostPercent}%），实质性运营证据较强` : '未配置显著物流仓储成本，存在被认定为“空壳贸易”的税务风险'}
        - 贸易架构：${config.hasIntermediary ? '下设中间贸易商' : '直连终端'}
        
        【上下游博弈格局】
        1. **上游（${funder.name}）**：给予我方 **${config.funderPaymentTermMonths}个月** 账期，但加价 **${config.funderMarkupPercent}%**。
        2. **下游（${retailer.name}）**：采用 **${isConsignment ? '代销模式（收佣金）' : '经销模式（赚差价）'}**，回款周期 **${config.retailerPaymentTermDays}天**。

        【请重点分析（必须站在藏境视角）】
        1. **发票与收入确认最佳实践（关键）**：
           - 鉴于我是${isGeneralTaxpayer ? '一般纳税人' : '小规模纳税人'}，且下游为${isConsignment ? '代销' : '经销'}模式：
           - 请列出**“开票负面清单”**（绝对不能做的操作，如提前开票等）。
           - ${!isGeneralTaxpayer ? '作为小规模纳税人，无法抵扣上游进项，如何通过合同或定价规避成本劣势？' : '作为一般纳税人，如何严格管理“三流一致”以确保进项抵扣安全？'}
        2. **现金流套利与风险**：我方对上游付款账期 vs 下游回款周期的差额（${cashFlowGap > 0 ? `资金沉淀 ${cashFlowGap}天` : `资金缺口 ${Math.abs(cashFlowGap)}天`}），如何最大化利用这笔红利或填补缺口？
        3. **税务合规生死线**：${isTibet ? '作为西藏企业，' : ''}如果税务局稽查“实质性运营”，我方目前的业务单据流、物流、资金流是否经得起穿透？(特别关注：${config.cangjingLogisticsCostPercent === 0 ? '物流缺失的巨大隐患' : '物流单据的闭环管理'})

        输出风格：
        - 第一人称“我方”。
        - 犀利、直接，不讲正确的废话。
        - 针对风险点给出“立刻执行”的动作建议。
        - 使用Markdown格式。
        `;

        const res = await fetch('https://api.deepseek.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer sk-5d5494bf6a3b4a36ad641a4432d14846'
            },
            body: JSON.stringify({
                model: "deepseek-chat",
                messages: [
                    { role: "system", content: "你是一位拥有20年经验的税务筹划总监，擅长处理复杂的供应链贸易与区域税收优惠落地。" },
                    { role: "user", content: prompt }
                ],
                temperature: 0.5,
                max_tokens: 1000
            })
        });
        
        const data = await res.json();
        if (data.choices && data.choices.length > 0) {
            setAiAnalysis(data.choices[0].message.content);
        } else {
            setAiAnalysis('未能获取有效建议，请稍后重试。');
        }

    } catch (e) {
        console.error(e);
        setAiAnalysis("连接 AI 服务失败，请检查网络设置。");
    } finally {
        setLoading(false);
    }
  };

  // Helper for Section Headers
  const SectionHeader = ({ icon, title }: { icon: string, title: string }) => (
    <h3 className="text-lg font-bold text-gray-800 border-b-2 border-tibet-gold pb-2 mb-4 flex items-center">
      <span className="bg-tibet-gold text-white w-8 h-8 rounded-lg flex items-center justify-center mr-3 text-lg shadow-sm">{icon}</span>
      {title}
    </h3>
  );

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden print:break-before-page">
      <div className="bg-gradient-to-r from-indigo-900 to-indigo-700 px-6 py-4 text-white flex justify-between items-center">
        <div>
           <h2 className="text-xl font-bold font-serif tracking-wide flex items-center">
             <span className="text-2xl mr-2">⚖️</span> 藏境山水 · 财税合规与纳税筹划方案
           </h2>
           <p className="text-indigo-200 text-xs mt-1 opacity-80">
             针对当前配置 ({isConsignment ? '委托代销模式' : '经销赊销模式'} / {isGeneralTaxpayer ? '一般纳税人' : '小规模'}) 的定制化建议
           </p>
        </div>
        <div className="text-right hidden md:block">
           <div className="text-xs bg-white/10 px-3 py-1 rounded border border-white/20">
             方案生成时间: {new Date().toLocaleDateString()}
           </div>
        </div>
      </div>

      <div className="p-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* SECTION 1: 纳税义务与开票时点 (Billing & Tax Liability) */}
        <div className="space-y-4">
          <SectionHeader icon="📅" title="纳税义务与开票时点规划" />
          
          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg">
             <h4 className="font-bold text-blue-800 mb-2">核心策略：递延纳税义务，匹配现金流</h4>
             <p className="text-sm text-blue-700 leading-relaxed">
               增值税纳税义务发生时间直接决定现金流压力。依据《增值税暂行条例实施细则》第38条，建议按以下节点操作：
             </p>
          </div>

          <div className="space-y-4 mt-4">
             {/* Tax Identity Specific Advice */}
             <div className={`border border-dashed p-3 rounded-lg ${isGeneralTaxpayer ? 'bg-indigo-50 border-indigo-200' : 'bg-yellow-50 border-yellow-200'}`}>
                <div className="text-xs font-bold uppercase mb-1 flex items-center">
                    <span className="mr-2 text-lg">{isGeneralTaxpayer ? '🛡️' : '⚠️'}</span>
                    {isGeneralTaxpayer ? '一般纳税人 (13%) 特别指引' : '小规模纳税人 (1%) 特别指引'}
                </div>
                <ul className="list-disc pl-5 text-xs text-gray-700 space-y-1">
                    {isGeneralTaxpayer ? (
                        <>
                           <li><strong>进项刚需：</strong> 必须取得上游（宸铭）开具的<span className="text-indigo-700 font-bold">13%增值税专用发票</span>，否则将承担全额13%的销项税负，导致巨额亏损。</li>
                           <li><strong>三流一致：</strong> 确保“合同签定方、付款方、发票接受方”均为藏境，避免进项抵扣被税务局剔除。</li>
                        </>
                    ) : (
                        <>
                           <li><strong>成本锁定：</strong> 无法抵扣上游进项税。上游开具的13%专票对藏境无抵扣意义，增值税直接计入采购成本。</li>
                           <li><strong>议价策略：</strong> 建议向上游争取“不含税价”供货，或要求其开具普通发票以降低采购单价（虽然上游可能拒绝）。</li>
                        </>
                    )}
                </ul>
             </div>

             {isConsignment ? (
               // Consignment Strategy
               <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm relative overflow-hidden">
                  <div className="absolute top-0 right-0 bg-blue-100 text-blue-600 text-[10px] px-2 py-1 font-bold">代销模式</div>
                  <ul className="space-y-3 text-sm text-gray-700">
                     <li className="flex items-start">
                        <span className="text-green-500 mr-2 text-lg">✓</span>
                        <span>
                           <strong>发货环节：</strong> 藏境向{retailer.name}发货时，<span className="text-red-600 font-bold">不确认收入，不开具发票</span>。需开具《委托代销发货单》作为物流凭证。
                        </span>
                     </li>
                     <li className="flex items-start">
                        <span className="text-green-500 mr-2 text-lg">✓</span>
                        <span>
                           <strong>纳税触发点：</strong> 收到{retailer.name}提供的<span className="font-bold underline">《代销清单》</span>之日。
                        </span>
                     </li>
                     <li className="flex items-start">
                        <span className="text-green-500 mr-2 text-lg">✓</span>
                        <span>
                           <strong>操作建议：</strong> 约定每月固定日期（如25日）由渠道方提供上月销售清单，藏境依据清单金额开具增值税发票。此举可确保税款缴纳发生在收到货款前后，避免垫税。
                        </span>
                     </li>
                  </ul>
               </div>
             ) : (
               // Sales Strategy
               <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm relative overflow-hidden">
                   <div className="absolute top-0 right-0 bg-orange-100 text-orange-600 text-[10px] px-2 py-1 font-bold">赊销模式</div>
                   <ul className="space-y-3 text-sm text-gray-700">
                     <li className="flex items-start">
                        <span className="text-orange-500 mr-2 text-lg">!</span>
                        <span>
                           <strong>关键风险：</strong> 若合同未明确约定付款日期，发货当天即产生全额增值税纳税义务，即便资金需{config.retailerPaymentTermDays}天后才回笼，将造成巨大资金压力。
                        </span>
                     </li>
                     <li className="flex items-start">
                        <span className="text-green-500 mr-2 text-lg">✓</span>
                        <span>
                           <strong>合同条款优化：</strong> 务必在销售合同中明确约定：<span className="font-bold text-gray-900">“付款日期为发货后第{config.retailerPaymentTermDays}天”</span>。
                        </span>
                     </li>
                     <li className="flex items-start">
                        <span className="text-green-500 mr-2 text-lg">✓</span>
                        <span>
                           <strong>合规收益：</strong> 据此条款，藏境的纳税义务发生时间递延至第{config.retailerPaymentTermDays}天，实现“先收款/同期收款，后缴税”。
                        </span>
                     </li>
                  </ul>
               </div>
             )}
          </div>
        </div>

        {/* SECTION 2: 收入确认与会计处理 (Revenue Recognition) */}
        <div className="space-y-4">
          <SectionHeader icon="📊" title="收入确认与账务处理" />
          
          <div className="grid grid-cols-1 gap-4">
             <div className="border border-gray-100 rounded-lg p-3 bg-gray-50">
                <div className="text-xs font-bold text-gray-500 uppercase mb-2">会计分录示意</div>
                {isConsignment ? (
                    <div className="font-mono text-xs space-y-2 bg-white p-3 rounded border border-gray-200 text-gray-600">
                        <div className="flex justify-between">
                           <span>借：应收账款-渠道方</span>
                           <span className="text-gray-400">{results.cangjing.outPriceInclTax.toFixed(0)} (总额)</span>
                        </div>
                         <div className="flex justify-between pl-4 text-green-700">
                           <span>贷：主营业务收入</span>
                           <span>{results.cangjing.outPriceExclTax.toFixed(0)}</span>
                        </div>
                        <div className="flex justify-between pl-4 text-green-700">
                           <span>贷：应交税费-应交增值税(销项)</span>
                           <span>{results.cangjing.vatOutput.toFixed(0)}</span>
                        </div>
                        <div className="border-t border-dashed my-1"></div>
                        <div className="flex justify-between text-orange-700">
                           <span>借：销售费用-代销佣金</span>
                           <span>{(results.retailer.grossProfit / 1.06).toFixed(0)}</span>
                        </div>
                        <div className="flex justify-between text-orange-700">
                           <span>借：应交税费-进项税额 (6%)</span>
                           {isGeneralTaxpayer ? (
                              <span>{(results.retailer.grossProfit - results.retailer.grossProfit / 1.06).toFixed(0)}</span>
                           ) : (
                              <span className="text-red-500 line-through">0 (小规模不可抵扣)</span>
                           )}
                        </div>
                         <div className="flex justify-between pl-4">
                           <span>贷：应收账款-渠道方 (冲抵)</span>
                           <span>{results.retailer.grossProfit.toFixed(0)}</span>
                        </div>
                    </div>
                ) : (
                    <div className="font-mono text-xs space-y-2 bg-white p-3 rounded border border-gray-200 text-gray-600">
                        <div className="flex justify-between">
                           <span>借：应收账款-渠道方</span>
                           <span>{results.cangjing.outPriceInclTax.toFixed(0)}</span>
                        </div>
                         <div className="flex justify-between pl-4 text-green-700">
                           <span>贷：主营业务收入</span>
                           <span>{results.cangjing.outPriceExclTax.toFixed(0)}</span>
                        </div>
                        <div className="flex justify-between pl-4 text-green-700">
                           <span>贷：应交税费-待转销项税额</span>
                           <span className="text-gray-400 italic">*(发货时)*</span>
                        </div>
                        <div className="flex justify-between pl-4 text-green-700">
                           <span>贷：应交税费-应交增值税(销项)</span>
                           <span className="text-gray-400 italic">*(约定付款日)*</span>
                        </div>
                    </div>
                )}
             </div>

             <div className="text-sm text-gray-600 bg-yellow-50 p-3 rounded border border-yellow-100">
                 <strong className="text-yellow-700">💡 成本结转提示：</strong>
                 <p className="mt-1">
                    无论何种模式，藏境需在确认收入的当月，同步结转主营业务成本。
                    当前单笔业务成本（含税）为 {new Intl.NumberFormat('zh-CN', { style: 'currency', currency: 'CNY' }).format(results.cangjing.inPriceInclTax)}。
                    {isGeneralTaxpayer && "注意获取宸铭开具的13%专用发票以抵扣进项。"}
                 </p>
             </div>
          </div>
        </div>

        {/* SECTION 3: 西藏区域优惠与风险 (Tibet Policy) */}
        {isTibet && (
        <div className="col-span-1 lg:col-span-2 mt-4 pt-6 border-t border-dashed border-gray-200">
           <SectionHeader icon="🏔️" title="西藏税收优惠落地与合规清单" />
           <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Policy 1 */}
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                 <div className="text-tibet-red font-bold text-sm mb-2">1. 企业所得税优惠 (15% vs 25%)</div>
                 <p className="text-xs text-gray-600 leading-relaxed">
                    藏境作为设在西藏的企业，依据西部大开发政策，主营业务符合《西部地区鼓励类产业目录》（农产品加工/流通），可减按15%税率征收。
                    <br/><span className="text-gray-400 mt-1 block">当前测算已应用此税率。</span>
                 </p>
              </div>

              {/* Policy 2 */}
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                 <div className="text-tibet-red font-bold text-sm mb-2">2. 地方留存返还 (财政扶持)</div>
                 <p className="text-xs text-gray-600 leading-relaxed">
                    拉萨/林芝等园区通常有“增值税、所得税地方留存部分”的返还政策。
                    <br/>建议：年纳税额超过50万时，与园区签订《产业扶持协议》，争取地方留存部分 70%-90% 的返还。
                 </p>
              </div>

              {/* Compliance Requirement */}
              <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                 <div className="text-red-700 font-bold text-sm mb-2">🛑 核心红线：实质性运营</div>
                 <p className="text-xs text-gray-600 leading-relaxed">
                    税务局严查“空壳公司”。要享受上述政策，必须满足：
                 </p>
                 <ul className="list-disc pl-4 mt-2 text-[10px] text-gray-500">
                    <li>有实际办公场所（租赁合同+水电发票）</li>
                    <li>有常驻西藏人员（3人以上社保+工资流水）</li>
                    <li>资产、财务账簿在西藏管理</li>
                    {config.cangjingLogisticsCostPercent > 0 && (
                        <li className="text-green-700 font-bold mt-1">✓ 已配置仓储物流成本 ({config.cangjingLogisticsCostPercent}%)，为实质性运营提供有力佐证。</li>
                    )}
                 </ul>
              </div>

           </div>
        </div>
        )}

        {/* SECTION 4: AI DeepSeek Integration */}
        <div className="col-span-1 lg:col-span-2 mt-6 pt-6 border-t-2 border-indigo-100 print:hidden">
            <SectionHeader icon="🤖" title="AI 智能税务专家 (DeepSeek)" />
            
            <div className="bg-indigo-50/50 rounded-xl p-6 border border-indigo-100">
                <div className="flex items-start justify-between mb-4">
                    <div>
                        <h4 className="font-bold text-indigo-900">个性化深度筹划 (CFO视角)</h4>
                        <p className="text-xs text-indigo-600 mt-1">
                            基于当前配置 ({isConsignment ? '代销' : '经销'} | {isGeneralTaxpayer ? '一般人' : '小规模'} | {hasLogistics ? '含物流成本' : '无物流'}) 生成实时决策建议。
                        </p>
                    </div>
                    <button 
                        onClick={handleAiAnalyze}
                        disabled={loading}
                        className={`px-5 py-2 rounded-lg font-bold text-white shadow-md transition-all ${
                            loading 
                            ? 'bg-gray-400 cursor-not-allowed' 
                            : 'bg-indigo-600 hover:bg-indigo-700 hover:shadow-lg transform hover:-translate-y-0.5'
                        }`}
                    >
                        {loading ? (
                            <span className="flex items-center">
                                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                正在分析链路...
                            </span>
                        ) : '✨ 开始深度分析'}
                    </button>
                </div>

                {aiAnalysis && (
                    <div className="bg-white rounded-lg p-6 shadow-sm border border-indigo-100 animate-fade-in">
                        <div className="prose prose-sm prose-indigo max-w-none">
                            {renderMarkdown(aiAnalysis)}
                        </div>
                        <div className="mt-4 text-right text-[10px] text-gray-400 border-t border-gray-50 pt-2">
                            由 DeepSeek V1 模型生成 · 仅供参考
                        </div>
                    </div>
                )}
                
                {!aiAnalysis && !loading && (
                    <div className="text-center py-8 text-gray-400 text-sm border-2 border-dashed border-indigo-100 rounded-lg">
                        点击“开始深度分析”获取基于当前参数的 AI 诊断报告
                    </div>
                )}
            </div>
        </div>

      </div>
    </div>
  );
};
