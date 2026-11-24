import React from 'react';
import { BarChart3 } from 'lucide-react';
import { ProtocolTotals } from '../types/protocol';
import { formatNumber } from '../utils/calculations';

interface ProtocolSummaryProps {
  totals: ProtocolTotals;
  onOpenSiteSummary: () => void;
}

export const ProtocolSummary: React.FC<ProtocolSummaryProps> = ({
  totals,
  onOpenSiteSummary,
}) => {
  const baugrundSum =
    totals.lockergestein + totals.fels + totals.bloecke + totals.beton;
  const baugrundMatchesBohrmeter =
    totals.bohrmeter === 0 || Math.abs(baugrundSum - totals.bohrmeter) <= 0.01;

  return (
    <section
      aria-label="Zusammenrechnung der Gegebenheiten"
      className="bg-white border border-slate-200 rounded-lg overflow-hidden"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 bg-slate-50 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <h3 className="text-sm font-semibold text-slate-900">
            Zusammenrechnung (Protokoll-Total)
          </h3>
          <span className="text-slate-300" aria-hidden="true">
            ·
          </span>
          <span className="text-xs font-mono tabular-nums text-slate-600">
            {totals.completeRows} / 16 komplett ausgefüllt
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600">
          {!baugrundMatchesBohrmeter && (
            <span className="text-amber-700 font-medium">
              Baugrund-Summe ({formatNumber(baugrundSum)} m) ≠ Bohrmeter ({formatNumber(totals.bohrmeter)} m)
            </span>
          )}
          <button
            type="button"
            onClick={onOpenSiteSummary}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-blue-800 bg-white border border-slate-300 rounded-md hover:bg-slate-100 transition-colors whitespace-nowrap shrink-0"
          >
            <BarChart3 className="w-3.5 h-3.5" />
            Ganze Baustelle zusammenfassen
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-slate-200">
        {/* Column 1: Anker & Längen */}
        <div className="divide-y divide-slate-100">
          <div className="flex items-center justify-between px-4 py-3">
            <span className="text-xs font-medium text-slate-600">Anzahl</span>
            <span className="text-sm font-mono tabular-nums font-semibold text-slate-900">
              {formatNumber(totals.anzahl, 0)} St
            </span>
          </div>
          <div className="flex items-center justify-between px-4 py-3">
            <span className="text-xs font-medium text-slate-600">Bohrmeter (total)</span>
            <span className="text-sm font-mono tabular-nums font-semibold text-slate-900">
              {formatNumber(totals.bohrmeter)} m
            </span>
          </div>
          <div className="flex items-center justify-between px-4 py-3">
            <span className="text-xs font-medium text-slate-600">Freie Ankerlänge</span>
            <span className="text-sm font-mono tabular-nums font-semibold text-slate-900">
              {formatNumber(totals.freieAnkerlaenge)} m
            </span>
          </div>
        </div>

        {/* Column 2: Bodenbeschaffenheit */}
        <div className="divide-y divide-slate-100">
          <div className="flex items-center justify-between px-4 py-2.5">
            <span className="text-xs font-medium text-slate-600">
              <span className="inline-block w-7 font-mono text-slate-400">///</span>
              Lockergestein
            </span>
            <span className="text-sm font-mono tabular-nums font-semibold text-slate-900">
              {formatNumber(totals.lockergestein)} m
            </span>
          </div>
          <div className="flex items-center justify-between px-4 py-2.5">
            <span className="text-xs font-medium text-slate-600">
              <span className="inline-block w-7 font-mono text-slate-400">X</span>
              Fels
            </span>
            <span className="text-sm font-mono tabular-nums font-semibold text-slate-900">
              {formatNumber(totals.fels)} m
            </span>
          </div>
          <div className="flex items-center justify-between px-4 py-2.5">
            <span className="text-xs font-medium text-slate-600">
              <span className="inline-block w-7 font-mono text-slate-400">0</span>
              Blöcke / Findlinge
            </span>
            <span className="text-sm font-mono tabular-nums font-semibold text-slate-900">
              {formatNumber(totals.bloecke)} m
            </span>
          </div>
          <div className="flex items-center justify-between px-4 py-2.5">
            <span className="text-xs font-medium text-slate-600">
              <span className="inline-block w-7 font-mono text-slate-400">=</span>
              Beton
            </span>
            <span className="text-sm font-mono tabular-nums font-semibold text-slate-900">
              {formatNumber(totals.beton)} m
            </span>
          </div>
        </div>

        {/* Column 3: Gruppenstunden & Injektionsgut */}
        <div className="divide-y divide-slate-100">
          <div className="flex items-center justify-between px-4 py-3">
            <span className="text-xs font-medium text-slate-600">Gruppenstunden</span>
            <span className="text-sm font-mono tabular-nums font-semibold text-slate-900">
              {formatNumber(totals.gruppenstunden)} h
            </span>
          </div>
          <div className="flex items-center justify-between px-4 py-3">
            <span className="text-xs font-medium text-slate-600">Injektionsgut (Kümix)</span>
            <span className="text-base font-mono tabular-nums font-bold text-blue-900">
              {formatNumber(totals.injektionsgut)} kg
            </span>
          </div>
          <div className="flex items-center justify-between px-4 py-3">
            <span className="text-xs font-medium text-slate-600">Baugrund-Total</span>
            <span className="text-sm font-mono tabular-nums font-semibold text-slate-900">
              {formatNumber(baugrundSum)} m
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};
