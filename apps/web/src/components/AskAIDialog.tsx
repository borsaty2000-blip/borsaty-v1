"use client";

import React, { useState } from "react";
import { Sparkles, Bot, Send, X, ShieldCheck, RefreshCw } from "lucide-react";

interface AskAIDialogProps {
  symbol: string;
  nameAr: string;
  currentPrice: number;
  confluenceScore: number;
  certainty: string;
  targets: Array<{ level: number; price: number; method: string }>;
  stopLoss: { price: number; method: string };
  fairValue: { mid: number; verdictAr: string };
  dataQuality: { provider: string; isDelayed: boolean };
}

export default function AskAIDialog({
  symbol,
  nameAr,
  currentPrice,
  confluenceScore,
  certainty,
  targets,
  stopLoss,
  fairValue,
  dataQuality,
}: AskAIDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [conversation, setConversation] = useState<Array<{ sender: "user" | "ai"; text: string }>>([
    {
      sender: "ai",
      text: `أهلاً بك! أنا المساعد الذكي لبورصتي (Narrator Agent). أقوم بتحليل سهم **${nameAr} (${symbol})** بالاعتماد الحصري على المحركات الحتمية (Elliott, Gann, Fair Value, Confluence). لا أختلق أي أرقام من عندي، وكل رقم معلن له أساسه الرياضي. يمكنك سؤالي مثل: "إيه رأيك في ${symbol}؟" أو "ما هي الأهداف الفنية ووقف الخسارة؟"`,
    },
  ]);

  const handleAsk = async (userPrompt?: string) => {
    const q = userPrompt || question;
    if (!q.trim() || loading) return;

    const newConvo = [...conversation, { sender: "user" as const, text: q }];
    setConversation(newConvo);
    setQuestion("");
    setLoading(true);

    try {
      const res = await fetch("/api/ai-narrator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          symbol,
          nameAr,
          currentPrice,
          confluenceScore,
          certainty,
          targets,
          stopLoss,
          fairValue,
          dataQuality,
          prompt: q,
        }),
      });

      const data = await res.json();
      setConversation((prev) => [...prev, { sender: "ai", text: data.reply }]);
    } catch {
      setConversation((prev) => [
        ...prev,
        {
          sender: "ai",
          text: `بناءً على المحركات الحتمية لسهم ${nameAr} (${symbol}): السعر الحالي ${currentPrice}، توافق الأدوات ${confluenceScore}/100 بتصنيف ${certainty}. الهدف الأول عند ${targets[0]?.price} (${targets[0]?.method}) ووقف الخسارة الحتمي عند ${stopLoss?.price} (${stopLoss?.method}). القيمة العادلة المرجحة: ${fairValue.mid} (${fairValue.verdictAr}).`,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const sampleQuestions = [
    `إيه رأيك في ${symbol} اليوم؟`,
    `ما هي الأهداف الفنية ومستوى وقف الخسارة؟`,
    `هل سعر السهم أقل من قيمته العادلة؟`,
  ];

  return (
    <>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-semibold text-sm shadow-lg shadow-emerald-500/25 transition-all hover:scale-105 active:scale-95"
      >
        <Sparkles className="w-4 h-4" />
        <span>اسأل الذكاء الاصطناعي (Ask AI)</span>
      </button>

      {/* Modal Dialog */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-2xl bg-[#111827] border border-[#232e48] rounded-2xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 bg-[#141c2e] border-b border-[#232e48] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">مساعد بورصتي للتحليل المالي</h3>
                  <p className="text-xs text-gray-400 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span>مرتبط بمحرك التحليل الحتمي — صفر هلوسة</span>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-[#1a2337] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Conversation Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 text-sm">
              {conversation.map((msg, i) => (
                <div
                  key={i}
                  className={`flex gap-3 ${
                    msg.sender === "user" ? "flex-row-reverse" : "flex-row"
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-lg shrink-0 flex items-center justify-center text-xs font-bold ${
                      msg.sender === "user"
                        ? "bg-emerald-600 text-white"
                        : "bg-[#1c263c] text-emerald-400 border border-[#283552]"
                    }`}
                  >
                    {msg.sender === "user" ? "أنت" : "بورصتي"}
                  </div>
                  <div
                    className={`max-w-[80%] rounded-2xl p-3.5 leading-relaxed text-xs sm:text-sm ${
                      msg.sender === "user"
                        ? "bg-emerald-600 text-white"
                        : "bg-[#151e30] border border-[#232e48] text-gray-200 whitespace-pre-line"
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex items-center gap-2 text-xs text-emerald-400 p-2">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>المساعد يراجع مخرجات محركات Elliott و Gann والقيمة العادلة...</span>
                </div>
              )}
            </div>

            {/* Quick Suggestions */}
            <div className="px-4 py-2 bg-[#0e1424] border-t border-[#1a2337] flex flex-wrap gap-2 text-xs">
              {sampleQuestions.map((sq, i) => (
                <button
                  key={i}
                  onClick={() => handleAsk(sq)}
                  className="px-2.5 py-1 rounded-lg bg-[#182337] hover:bg-[#202e48] text-gray-300 hover:text-white transition-colors border border-[#232e48]"
                >
                  {sq}
                </button>
              ))}
            </div>

            {/* Input Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleAsk();
              }}
              className="p-3 bg-[#141c2e] border-t border-[#232e48] flex items-center gap-2"
            >
              <input
                type="text"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="اكتب استفسارك هنا (مثلاً: ما هي أدلة الشراء أو البيع؟)..."
                className="flex-1 bg-[#0b0f19] border border-[#232e48] rounded-xl px-4 py-2.5 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:border-emerald-500"
              />
              <button
                type="submit"
                disabled={loading || !question.trim()}
                className="p-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white transition-colors"
              >
                <Send className="w-4 h-4 rotate-180" />
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
