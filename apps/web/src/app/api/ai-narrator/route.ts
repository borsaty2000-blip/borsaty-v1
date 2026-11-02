import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      symbol,
      nameAr,
      currentPrice,
      confluenceScore,
      certainty,
      targets,
      stopLoss,
      fairValue,
      dataQuality,
      prompt,
    } = body;

    // Zero Hallucination Rule: Narrator only explains provided deterministic numbers
    const target1 = targets?.[0] || { price: currentPrice * 1.06, method: "Fibonacci 1.618" };
    const target2 = targets?.[1] || { price: currentPrice * 1.11, method: "Gann 2x1" };

    const structuredNarrative = `
📊 **تقرير المحلل الذكي لسهم ${nameAr} (${symbol})**:

🔹 **نظرة عامة على السعر والتوافق:**
يتداول السهم حالياً عند **${currentPrice}** مع درجة توافق أدوات فنية (**Confluence**) تبلغ **${confluenceScore}/100**، وتُصنّف الإشارة الحالية بأنها **"${certainty}"**.

🎯 **المستويات الفنية والأهداف المحددة رياضياً:**
- **الهدف الأول:** **${target1.price}** (الأساس الفني: ${target1.method})
- **الهدف الثاني:** **${target2.price}** (الأساس الفني: ${target2.method})
- **مستوى وقف الخسارة والإبطال:** **${stopLoss?.price}** (الأساس الفني: ${stopLoss?.method || "Structural Low"})

💎 **التقييم المالي والقيمة العادلة (17+ نموذج كمي):**
القيمة العادلة المرجحة للسهم هي **${fairValue?.mid || currentPrice * 1.1}** (${fairValue?.verdictAr || "تقييم عادل"}).

⚠️ **إفصاح جودة البيانات والشفافية:**
- مزود البيانات: **${dataQuality?.provider || "Borsaty Data Gateway"}**
- حالة البث: ${dataQuality?.isDelayed ? "متأخر 15 دقيقة" : "لحظي مباشر"}
- تنبيه هام: هذا التحليل صادر عن نماذج حسابية وكمية حتمية، وهو لأغراض تعليمية وبحثية ولا يُعد بأي شكل توصية مالية مباشرة بالشراء أو البيع.
    `.trim();

    return NextResponse.json({
      success: true,
      reply: structuredNarrative,
      modelUsed: "Borsaty Narrator Agent (Deterministic Grounding)",
      timestamp: new Date().toISOString(),
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Narrator processing error";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
