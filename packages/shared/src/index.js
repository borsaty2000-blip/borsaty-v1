"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ARABIC_STOCK_ALIASES = void 0;
exports.resolveStockAlias = resolveStockAlias;
// API & Analysis Types
__exportStar(require("./types/api"), exports);
// Arabic Stock Aliases Map
exports.ARABIC_STOCK_ALIASES = {
    // EGX Stocks
    "comi": { symbol: "COMI", market: "EGX", nameAr: "البنك التجاري الدولي", nameEn: "Commercial International Bank" },
    "التجاري الدولي": { symbol: "COMI", market: "EGX", nameAr: "البنك التجاري الدولي", nameEn: "Commercial International Bank" },
    "البنك التجاري الدولي": { symbol: "COMI", market: "EGX", nameAr: "البنك التجاري الدولي", nameEn: "Commercial International Bank" },
    "cib": { symbol: "COMI", market: "EGX", nameAr: "البنك التجاري الدولي", nameEn: "Commercial International Bank" },
    "abuk": { symbol: "ABUK", market: "EGX", nameAr: "أبو قير للأسمدة", nameEn: "Abu Qir Fertilizers" },
    "أبو قير": { symbol: "ABUK", market: "EGX", nameAr: "أبو قير للأسمدة", nameEn: "Abu Qir Fertilizers" },
    "ابو قير": { symbol: "ABUK", market: "EGX", nameAr: "أبو قير للأسمدة", nameEn: "Abu Qir Fertilizers" },
    "أبو قير للأسمدة": { symbol: "ABUK", market: "EGX", nameAr: "أبو قير للأسمدة", nameEn: "Abu Qir Fertilizers" },
    "fwrx": { symbol: "FWRX", market: "EGX", nameAr: "فوري لتكنولوجيا البنوك", nameEn: "Fawry Banking & Payment" },
    "فوري": { symbol: "FWRX", market: "EGX", nameAr: "فوري لتكنولوجيا البنوك", nameEn: "Fawry Banking & Payment" },
    "esrs": { symbol: "ESRS", market: "EGX", nameAr: "حديد عز", nameEn: "Ezz Steel" },
    "حديد عز": { symbol: "ESRS", market: "EGX", nameAr: "حديد عز", nameEn: "Ezz Steel" },
    "عز": { symbol: "ESRS", market: "EGX", nameAr: "حديد عز", nameEn: "Ezz Steel" },
    "hrho": { symbol: "HRHO", market: "EGX", nameAr: "إي إف جي القابضة (هيرميس)", nameEn: "EFG Holding" },
    "هيرميس": { symbol: "HRHO", market: "EGX", nameAr: "إي إف جي القابضة (هيرميس)", nameEn: "EFG Holding" },
    "اي اف جي": { symbol: "HRHO", market: "EGX", nameAr: "إي إف جي القابضة (هيرميس)", nameEn: "EFG Holding" },
    "tmgh": { symbol: "TMGH", market: "EGX", nameAr: "مجموعة طلعت مصطفى القابضة", nameEn: "Talaat Moustafa Group" },
    "طلعت مصطفى": { symbol: "TMGH", market: "EGX", nameAr: "مجموعة طلعت مصطفى القابضة", nameEn: "Talaat Moustafa Group" },
    "ekho": { symbol: "EKHO", market: "EGX", nameAr: "الشركة المصرية الكويتية القابضة", nameEn: "Egypt Kuwait Holding" },
    "المصرية الكويتية": { symbol: "EKHO", market: "EGX", nameAr: "الشركة المصرية الكويتية القابضة", nameEn: "Egypt Kuwait Holding" },
    "swdy": { symbol: "SWDY", market: "EGX", nameAr: "السويدي إليكتريك", nameEn: "Elsewedy Electric" },
    "السويدي": { symbol: "SWDY", market: "EGX", nameAr: "السويدي إليكتريك", nameEn: "Elsewedy Electric" },
    "etel": { symbol: "ETEL", market: "EGX", nameAr: "المصرية للاتصالات (وي)", nameEn: "Telecom Egypt" },
    "المصرية للاتصالات": { symbol: "ETEL", market: "EGX", nameAr: "المصرية للاتصالات (وي)", nameEn: "Telecom Egypt" },
    "وي": { symbol: "ETEL", market: "EGX", nameAr: "المصرية للاتصالات (وي)", nameEn: "Telecom Egypt" },
    "mnhd": { symbol: "MNHD", market: "EGX", nameAr: "مدينة مصر للإسكان والتعمير", nameEn: "Madinet Masr Housing" },
    "مدينة مصر": { symbol: "MNHD", market: "EGX", nameAr: "مدينة مصر للإسكان والتعمير", nameEn: "Madinet Masr Housing" },
    // TASI Stocks
    "2222": { symbol: "2222", market: "TASI", nameAr: "أرامكو السعودية", nameEn: "Saudi Aramco" },
    "أرامكو": { symbol: "2222", market: "TASI", nameAr: "أرامكو السعودية", nameEn: "Saudi Aramco" },
    "ارامكو": { symbol: "2222", market: "TASI", nameAr: "أرامكو السعودية", nameEn: "Saudi Aramco" },
    "aramco": { symbol: "2222", market: "TASI", nameAr: "أرامكو السعودية", nameEn: "Saudi Aramco" },
    "1120": { symbol: "1120", market: "TASI", nameAr: "مصرف الراجحي", nameEn: "Al Rajhi Bank" },
    "الراجحي": { symbol: "1120", market: "TASI", nameAr: "مصرف الراجحي", nameEn: "Al Rajhi Bank" },
    "مصرف الراجحي": { symbol: "1120", market: "TASI", nameAr: "مصرف الراجحي", nameEn: "Al Rajhi Bank" },
    "alrajhi": { symbol: "1120", market: "TASI", nameAr: "مصرف الراجحي", nameEn: "Al Rajhi Bank" },
    "1180": { symbol: "1180", market: "TASI", nameAr: "البنك الأهلي السعودي (SNB)", nameEn: "Saudi National Bank" },
    "الأهلي السعودي": { symbol: "1180", market: "TASI", nameAr: "البنك الأهلي السعودي (SNB)", nameEn: "Saudi National Bank" },
    "snb": { symbol: "1180", market: "TASI", nameAr: "البنك الأهلي السعودي (SNB)", nameEn: "Saudi National Bank" },
    "2010": { symbol: "2010", market: "TASI", nameAr: "شركة سابك (سابك)", nameEn: "SABIC" },
    "سابك": { symbol: "2010", market: "TASI", nameAr: "شركة سابك (سابك)", nameEn: "SABIC" },
    "7010": { symbol: "7010", market: "TASI", nameAr: "إس تي سي (الاتصالات السعودية)", nameEn: "stc" },
    "الاتصالات السعودية": { symbol: "7010", market: "TASI", nameAr: "إس تي سي (الاتصالات السعودية)", nameEn: "stc" },
    "stc": { symbol: "7010", market: "TASI", nameAr: "إس تي سي (الاتصالات السعودية)", nameEn: "stc" },
    "1150": { symbol: "1150", market: "TASI", nameAr: "مصرف الإنماء", nameEn: "Alinma Bank" },
    "الإنماء": { symbol: "1150", market: "TASI", nameAr: "مصرف الإنماء", nameEn: "Alinma Bank" },
    "2380": { symbol: "2380", market: "TASI", nameAr: "بترو رابغ", nameEn: "Petro Rabigh" },
    "بترو رابغ": { symbol: "2380", market: "TASI", nameAr: "بترو رابغ", nameEn: "Petro Rabigh" },
    "2020": { symbol: "2020", market: "TASI", nameAr: "سافكو / سابك للمغذيات الزراعية", nameEn: "SABIC Agri-Nutrients" },
    "سابك للمغذيات": { symbol: "2020", market: "TASI", nameAr: "سافكو / سابك للمغذيات الزراعية", nameEn: "SABIC Agri-Nutrients" },
    "2280": { symbol: "2280", market: "TASI", nameAr: "شركة المراعي", nameEn: "Almarai" },
    "المراعي": { symbol: "2280", market: "TASI", nameAr: "شركة المراعي", nameEn: "Almarai" },
    "1010": { symbol: "1010", market: "TASI", nameAr: "بنك الرياض", nameEn: "Riyad Bank" },
    "بنك الرياض": { symbol: "1010", market: "TASI", nameAr: "بنك الرياض", nameEn: "Riyad Bank" },
    // Regional / Global test stocks
    "qnbk": { symbol: "QNBK", market: "QE", nameAr: "مجموعة بنك قطر الوطني", nameEn: "Qatar National Bank" },
    "بنك قطر الوطني": { symbol: "QNBK", market: "QE", nameAr: "مجموعة بنك قطر الوطني", nameEn: "Qatar National Bank" },
    "qnb": { symbol: "QNBK", market: "QE", nameAr: "مجموعة بنك قطر الوطني", nameEn: "Qatar National Bank" }
};
function resolveStockAlias(query) {
    const normalized = query.trim().toLowerCase();
    return exports.ARABIC_STOCK_ALIASES[normalized] || null;
}
__exportStar(require("./aliases/arabic-aliases"), exports);
