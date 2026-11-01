import { AssetClass, Market } from "@borsaty/shared";
import { SeedInstrument, buildInstrumentUniverse } from "./instruments-data";

export type ResolutionMethod =
  | "symbol_exact"
  | "provider_symbol_exact"
  | "name_ar_exact"
  | "name_en_exact"
  | "alias_ar_exact"
  | "name_ar_fuzzy"
  | "name_en_fuzzy";

export interface ResolvedInstrument {
  symbol: string;
  nameAr: string;
  nameEn: string;
  market: Market;
  assetClass: AssetClass;
  confidence: number;
  method: ResolutionMethod;
}

export interface AlternativeMatch {
  symbol: string;
  nameAr: string;
  nameEn: string;
  market: Market;
  assetClass: AssetClass;
  confidence: number;
}

export interface ResolutionResponse {
  resolved: ResolvedInstrument | null;
  alternatives: AlternativeMatch[];
}

export function normalizeArabic(text: string): string {
  if (!text) return "";
  return text
    .replace(/[\u064B-\u065F\u0670]/g, "") // tashkeel
    .replace(/\u0640/g, "") // tatweel
    .replace(/[إأآاٱ]/g, "ا") // normalize alef
    .replace(/ة/g, "ه") // normalize teh marbuta
    .replace(/ى/g, "ي") // normalize alef maksura
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

export function levenshteinDistance(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;

  // Optimize memory with single array
  const row: number[] = Array.from({ length: n + 1 }, (_, i) => i);

  for (let i = 1; i <= m; i++) {
    let prev = i - 1;
    row[0] = i;
    for (let j = 1; j <= n; j++) {
      const temp = row[j];
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      row[j] = Math.min(
        row[j] + 1,       // deletion
        row[j - 1] + 1,   // insertion
        prev + cost       // substitution
      );
      prev = temp;
    }
  }

  return row[n];
}

class InstrumentResolver {
  private instruments: SeedInstrument[];
  private symbolIndex: Map<string, SeedInstrument> = new Map();
  private providerIndex: Map<string, SeedInstrument> = new Map();
  private nameArIndex: Map<string, SeedInstrument> = new Map();
  private nameEnIndex: Map<string, SeedInstrument> = new Map();
  private aliasIndex: Map<string, SeedInstrument[]> = new Map();

  constructor(instruments?: SeedInstrument[]) {
    this.instruments = instruments || buildInstrumentUniverse();
    this.indexInstruments();
  }

  private indexInstruments() {
    for (const inst of this.instruments) {
      // 1. Symbol Index
      this.symbolIndex.set(inst.symbol.toUpperCase(), inst);

      // 2. Provider Symbol Index
      this.providerIndex.set(inst.providerSymbol.toUpperCase(), inst);

      // 3. Exact Arabic Name Index (verbatim trimmed)
      if (inst.nameAr) {
        this.nameArIndex.set(inst.nameAr.trim(), inst);
      }

      // 4. Exact English Name Index (case-insensitive)
      if (inst.nameEn) {
        this.nameEnIndex.set(inst.nameEn.trim().toLowerCase(), inst);
      }

      // 5. Aliases Index
      if (inst.aliases && Array.isArray(inst.aliases)) {
        for (const alias of inst.aliases) {
          const key = alias.trim().toLowerCase();
          if (!this.aliasIndex.has(key)) {
            this.aliasIndex.set(key, []);
          }
          this.aliasIndex.get(key)!.push(inst);
        }
      }
    }
  }

  public resolve(query: string): ResolutionResponse {
    if (!query || typeof query !== "string") {
      return { resolved: null, alternatives: [] };
    }

    const cleanQuery = query.trim();
    if (!cleanQuery) {
      return { resolved: null, alternatives: [] };
    }

    const queryUpper = cleanQuery.toUpperCase();
    const queryLower = cleanQuery.toLowerCase();
    const queryNormAr = normalizeArabic(cleanQuery);

    // ==========================================
    // 1. Exact Canonical Symbol Match
    // ==========================================
    if (this.symbolIndex.has(queryUpper)) {
      const inst = this.symbolIndex.get(queryUpper)!;
      return {
        resolved: {
          symbol: inst.symbol,
          nameAr: inst.nameAr,
          nameEn: inst.nameEn,
          market: inst.market,
          assetClass: inst.assetClass,
          confidence: 1.0,
          method: "symbol_exact",
        },
        alternatives: this.findAlternatives(cleanQuery, inst.symbol),
      };
    }

    // ==========================================
    // 2. Exact Provider Symbol Match
    // ==========================================
    if (this.providerIndex.has(queryUpper)) {
      const inst = this.providerIndex.get(queryUpper)!;
      return {
        resolved: {
          symbol: inst.symbol,
          nameAr: inst.nameAr,
          nameEn: inst.nameEn,
          market: inst.market,
          assetClass: inst.assetClass,
          confidence: 1.0,
          method: "provider_symbol_exact",
        },
        alternatives: this.findAlternatives(cleanQuery, inst.symbol),
      };
    }

    // ==========================================
    // 3. Exact Arabic Name Match
    // ==========================================
    if (this.nameArIndex.has(cleanQuery)) {
      const inst = this.nameArIndex.get(cleanQuery)!;
      return {
        resolved: {
          symbol: inst.symbol,
          nameAr: inst.nameAr,
          nameEn: inst.nameEn,
          market: inst.market,
          assetClass: inst.assetClass,
          confidence: 0.99,
          method: "name_ar_exact",
        },
        alternatives: this.findAlternatives(cleanQuery, inst.symbol),
      };
    }

    // ==========================================
    // 4. Exact English Name Match (case-insensitive)
    // ==========================================
    if (this.nameEnIndex.has(queryLower)) {
      const inst = this.nameEnIndex.get(queryLower)!;
      return {
        resolved: {
          symbol: inst.symbol,
          nameAr: inst.nameAr,
          nameEn: inst.nameEn,
          market: inst.market,
          assetClass: inst.assetClass,
          confidence: 0.99,
          method: "name_en_exact",
        },
        alternatives: this.findAlternatives(cleanQuery, inst.symbol),
      };
    }

    // ==========================================
    // 5. Exact Arabic / Curated Alias Match
    // ==========================================
    if (this.aliasIndex.has(queryLower)) {
      const matches = this.aliasIndex.get(queryLower)!;
      const inst = matches[0];
      const otherMatches = matches.slice(1).map((m) => ({
        symbol: m.symbol,
        nameAr: m.nameAr,
        nameEn: m.nameEn,
        market: m.market,
        assetClass: m.assetClass,
        confidence: 0.95,
      }));

      return {
        resolved: {
          symbol: inst.symbol,
          nameAr: inst.nameAr,
          nameEn: inst.nameEn,
          market: inst.market,
          assetClass: inst.assetClass,
          confidence: 0.98,
          method: "alias_ar_exact",
        },
        alternatives: [
          ...otherMatches,
          ...this.findAlternatives(cleanQuery, inst.symbol, otherMatches.map((o) => o.symbol)),
        ].slice(0, 3),
      };
    }

    // ==========================================
    // 6. Fuzzy Arabic Name Match (Levenshtein <= 2)
    // ==========================================
    let bestFuzzyAr: { inst: SeedInstrument; distance: number } | null = null;
    let bestFuzzyEn: { inst: SeedInstrument; distance: number } | null = null;

    const isArabicQuery = /[\u0600-\u06FF]/.test(cleanQuery);

    if (isArabicQuery) {
      for (const inst of this.instruments) {
        if (!inst.nameAr) continue;
        const normName = normalizeArabic(inst.nameAr);
        const dist = levenshteinDistance(queryNormAr, normName);
        if (dist <= 2) {
          if (!bestFuzzyAr || dist < bestFuzzyAr.distance) {
            bestFuzzyAr = { inst, distance: dist };
            if (dist === 0) break; // Perfect normalized match
          }
        }
      }

      if (bestFuzzyAr) {
        return {
          resolved: {
            symbol: bestFuzzyAr.inst.symbol,
            nameAr: bestFuzzyAr.inst.nameAr,
            nameEn: bestFuzzyAr.inst.nameEn,
            market: bestFuzzyAr.inst.market,
            assetClass: bestFuzzyAr.inst.assetClass,
            confidence: 0.85,
            method: "name_ar_fuzzy",
          },
          alternatives: this.findAlternatives(cleanQuery, bestFuzzyAr.inst.symbol),
        };
      }
    }

    // ==========================================
    // 7. Fuzzy English Name Match (Levenshtein <= 2)
    // ==========================================
    if (!isArabicQuery) {
      for (const inst of this.instruments) {
        if (!inst.nameEn) continue;
        const enLower = inst.nameEn.toLowerCase();
        const dist = levenshteinDistance(queryLower, enLower);
        if (dist <= 2) {
          if (!bestFuzzyEn || dist < bestFuzzyEn.distance) {
            bestFuzzyEn = { inst, distance: dist };
            if (dist === 0) break;
          }
        }
      }

      if (bestFuzzyEn) {
        return {
          resolved: {
            symbol: bestFuzzyEn.inst.symbol,
            nameAr: bestFuzzyEn.inst.nameAr,
            nameEn: bestFuzzyEn.inst.nameEn,
            market: bestFuzzyEn.inst.market,
            assetClass: bestFuzzyEn.inst.assetClass,
            confidence: 0.85,
            method: "name_en_fuzzy",
          },
          alternatives: this.findAlternatives(cleanQuery, bestFuzzyEn.inst.symbol),
        };
      }
    }

    // ==========================================
    // 8. Confidences < 0.80 -> Return null + Top 3
    // ==========================================
    const topAlternatives = this.findAlternatives(cleanQuery);
    return {
      resolved: null,
      alternatives: topAlternatives.slice(0, 3),
    };
  }

  private findAlternatives(
    query: string,
    excludeSymbol?: string,
    additionalExcludes?: string[]
  ): AlternativeMatch[] {
    const excludes = new Set([
      ...(excludeSymbol ? [excludeSymbol.toUpperCase()] : []),
      ...(additionalExcludes ? additionalExcludes.map((s) => s.toUpperCase()) : []),
    ]);

    const queryLower = query.toLowerCase();
    const queryNormAr = normalizeArabic(query);
    const isArabic = /[\u0600-\u06FF]/.test(query);

    const scored: Array<{ inst: SeedInstrument; score: number }> = [];

    for (const inst of this.instruments) {
      if (excludes.has(inst.symbol.toUpperCase())) continue;

      let score = 0;

      if (isArabic && inst.nameAr) {
        const normName = normalizeArabic(inst.nameAr);
        if (normName.includes(queryNormAr) || queryNormAr.includes(normName)) {
          score = 0.76;
        } else {
          const dist = levenshteinDistance(queryNormAr, normName);
          const maxLen = Math.max(queryNormAr.length, normName.length);
          const sim = 1 - dist / maxLen;
          if (sim > 0.4) {
            score = Math.min(0.74, Math.max(0.2, Number((sim * 0.75).toFixed(2))));
          }
        }
      } else if (inst.nameEn) {
        const enLower = inst.nameEn.toLowerCase();
        if (enLower.includes(queryLower) || queryLower.includes(enLower)) {
          score = 0.75;
        } else {
          const dist = levenshteinDistance(queryLower, enLower);
          const maxLen = Math.max(queryLower.length, enLower.length);
          const sim = 1 - dist / maxLen;
          if (sim > 0.4) {
            score = Math.min(0.74, Math.max(0.2, Number((sim * 0.75).toFixed(2))));
          }
        }
      }

      if (score > 0.2) {
        scored.push({ inst, score });
      }
    }

    scored.sort((a, b) => b.score - a.score);

    // If no scored matches found, pick 3 representative instruments
    if (scored.length === 0) {
      return this.instruments.slice(0, 3).map((inst) => ({
        symbol: inst.symbol,
        nameAr: inst.nameAr,
        nameEn: inst.nameEn,
        market: inst.market,
        assetClass: inst.assetClass,
        confidence: 0.1,
      }));
    }

    return scored.slice(0, 3).map((s) => ({
      symbol: s.inst.symbol,
      nameAr: s.inst.nameAr,
      nameEn: s.inst.nameEn,
      market: s.inst.market,
      assetClass: s.inst.assetClass,
      confidence: s.score,
    }));
  }
}

// Singleton Resolver instance
let defaultResolver: InstrumentResolver | null = null;

export function getInstrumentResolver(): InstrumentResolver {
  if (!defaultResolver) {
    defaultResolver = new InstrumentResolver();
  }
  return defaultResolver;
}

export function resolveInstrument(query: string): ResolutionResponse {
  return getInstrumentResolver().resolve(query);
}
