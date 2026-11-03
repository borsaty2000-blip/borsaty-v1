'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { ValidatedUnifiedAnalysis } from '@/lib/schemas';

export interface ChartHighlightPoint {
  time: string | number;
  price: number;
  label: string; // e.g., 'X', 'A', 'B', 'C', 'D' or '1', '2', '3', '4', '5' or 'Target'
  color?: string;
}

export interface ChartHighlight {
  id: string;
  name: string;
  type: 'harmonic' | 'elliott' | 'trade_plan' | 'classical' | 'confluence';
  points: ChartHighlightPoint[];
  description?: string;
  priceLevels?: {
    entry?: number[];
    stopLoss?: number;
    targets?: number[];
  };
}

interface BorsatyContextType {
  activeSymbol: string | null;
  setActiveSymbol: (symbol: string | null) => void;
  activeAnalysis: ValidatedUnifiedAnalysis | null;
  setActiveAnalysis: (analysis: ValidatedUnifiedAnalysis | null) => void;
  activeHighlight: ChartHighlight | null;
  setActiveHighlight: (highlight: ChartHighlight | null) => void;
  clearHighlight: () => void;
  isCommandPaletteOpen: boolean;
  setIsCommandPaletteOpen: (open: boolean) => void;
  toggleCommandPalette: () => void;
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (open: boolean) => void;
}

const BorsatyContext = createContext<BorsatyContextType | undefined>(undefined);

export function BorsatyProvider({ children }: { children: ReactNode }) {
  const [activeSymbol, setActiveSymbol] = useState<string | null>(null);
  const [activeAnalysis, setActiveAnalysis] = useState<ValidatedUnifiedAnalysis | null>(null);
  const [activeHighlight, setActiveHighlight] = useState<ChartHighlight | null>(null);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const clearHighlight = useCallback(() => {
    setActiveHighlight(null);
  }, []);

  const toggleCommandPalette = useCallback(() => {
    setIsCommandPaletteOpen((prev) => !prev);
  }, []);

  return (
    <BorsatyContext.Provider
      value={{
        activeSymbol,
        setActiveSymbol,
        activeAnalysis,
        setActiveAnalysis,
        activeHighlight,
        setActiveHighlight,
        clearHighlight,
        isCommandPaletteOpen,
        setIsCommandPaletteOpen,
        toggleCommandPalette,
        isMobileMenuOpen,
        setIsMobileMenuOpen,
      }}
    >
      {children}
    </BorsatyContext.Provider>
  );
}

export function useBorsaty() {
  const context = useContext(BorsatyContext);
  if (!context) {
    throw new Error('useBorsaty must be used within a BorsatyProvider');
  }
  return context;
}
