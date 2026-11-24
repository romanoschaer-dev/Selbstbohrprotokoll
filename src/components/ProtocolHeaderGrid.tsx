import React from 'react';
import { Pencil, Check } from 'lucide-react';
import { Baustelle, ProtocolHeader } from '../types/protocol';

interface ProtocolHeaderGridProps {
  baustelle: Baustelle;
  header: ProtocolHeader;
  onChangeHeader: (key: keyof ProtocolHeader, value: string) => void;
  onEditBaustelle: () => void;
  onSyncToBaustelle: () => void;
}

export const ProtocolHeaderGrid: React.FC<ProtocolHeaderGridProps> = ({
  baustelle,
  header,
  onChangeHeader,
  onEditBaustelle,
  onSyncToBaustelle,
}) => {
  const hasDiffFromBaustelle =
    header.bohrgeraet !== baustelle.bohrgeraet ||
    header.injektionspumpe !== baustelle.injektionspumpe ||
    header.bohrmeister !== baustelle.bohrmeister ||
    header.bohrkroneDurchmesser !== baustelle.bohrkroneDurchmesser ||
    header.tragglied !== baustelle.tragglied ||
    header.bohrzweck !== baustelle.bohrzweck;

  return (
    <section
      aria-label="Protokoll Kopfdaten"
      className="bg-white border border-slate-200 rounded-lg overflow-hidden"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 bg-slate-50 border-b border-slate-200">
        <div className="flex items-center gap-3 min-w-0">
          <h2 className="text-sm font-semibold text-slate-900 whitespace-nowrap">
            Protokoll Selbstbohrend
          </h2>
          <span className="text-slate-300" aria-hidden="true">
            ·
          </span>
          <input
            type="text"
            value={header.firma}
            onChange={(e) => onChangeHeader('firma', e.target.value)}
            aria-label="Unternehmen"
            className="text-xs text-slate-600 bg-transparent border-b border-transparent hover:border-slate-300 focus:border-blue-700 focus:outline-none px-1 py-0.5 min-w-[160px]"
          />
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {hasDiffFromBaustelle && (
            <button
              type="button"
              onClick={onSyncToBaustelle}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-800 hover:text-blue-950 transition-colors whitespace-nowrap shrink-0"
              title="Geänderte Werte als neuen Standard für diese Baustelle speichern"
            >
              <Check className="w-3.5 h-3.5" />
              Als Baustellen-Standard speichern
            </button>
          )}
          <button
            type="button"
            onClick={onEditBaustelle}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 transition-colors whitespace-nowrap shrink-0"
          >
            <Pencil className="w-3.5 h-3.5" />
            Baustelle bearbeiten
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-slate-200">
        {/* Column 1: Baustelle */}
        <div className="divide-y divide-slate-100">
          <div className="flex items-center gap-2 px-4 py-2.5">
            <span className="w-24 text-xs font-medium text-slate-500 shrink-0">Projekt</span>
            <span className="text-sm font-semibold text-slate-900 truncate" title={baustelle.projekt}>
              {baustelle.projekt}
            </span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2.5">
            <span className="w-24 text-xs font-medium text-slate-500 shrink-0">KTR</span>
            <span className="text-sm font-mono tabular-nums font-medium text-slate-900">
              {baustelle.ktr}
            </span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2">
            <label htmlFor="hdr-bauteil" className="w-24 text-xs font-medium text-slate-500 shrink-0">
              Bauteil
            </label>
            <input
              id="hdr-bauteil"
              type="text"
              value={header.bauteil}
              onChange={(e) => onChangeHeader('bauteil', e.target.value)}
              placeholder="z.B. Kranpfähle"
              className="w-full h-8 px-2 text-sm text-slate-900 bg-slate-50/60 border border-slate-200 rounded focus:bg-white focus:outline-none focus:border-blue-700"
            />
          </div>
        </div>

        {/* Column 2: Gerät & Team (änderbar) */}
        <div className="divide-y divide-slate-100">
          <div className="flex items-center gap-2 px-4 py-2">
            <label htmlFor="hdr-bohrgeraet" className="w-32 text-xs font-medium text-slate-500 shrink-0">
              Bohrgerät
            </label>
            <input
              id="hdr-bohrgeraet"
              type="text"
              value={header.bohrgeraet}
              onChange={(e) => onChangeHeader('bohrgeraet', e.target.value)}
              placeholder="z.B. BB7000"
              className="w-full h-8 px-2 text-sm text-slate-900 bg-slate-50/60 border border-slate-200 rounded focus:bg-white focus:outline-none focus:border-blue-700"
            />
          </div>
          <div className="flex items-center gap-2 px-4 py-2">
            <label htmlFor="hdr-pumpe" className="w-32 text-xs font-medium text-slate-500 shrink-0">
              Injektionspumpe
            </label>
            <input
              id="hdr-pumpe"
              type="text"
              value={header.injektionspumpe}
              onChange={(e) => onChangeHeader('injektionspumpe', e.target.value)}
              placeholder="z.B. Mungg"
              className="w-full h-8 px-2 text-sm text-slate-900 bg-slate-50/60 border border-slate-200 rounded focus:bg-white focus:outline-none focus:border-blue-700"
            />
          </div>
          <div className="flex items-center gap-2 px-4 py-2">
            <label htmlFor="hdr-bohrmeister" className="w-32 text-xs font-medium text-slate-500 shrink-0">
              Bohrmeister
            </label>
            <input
              id="hdr-bohrmeister"
              type="text"
              value={header.bohrmeister}
              onChange={(e) => onChangeHeader('bohrmeister', e.target.value)}
              placeholder="Name Bohrmeister"
              className="w-full h-8 px-2 text-sm text-slate-900 bg-slate-50/60 border border-slate-200 rounded focus:bg-white focus:outline-none focus:border-blue-700"
            />
          </div>
        </div>

        {/* Column 3: Ankerdaten (änderbar) */}
        <div className="divide-y divide-slate-100">
          <div className="flex items-center gap-2 px-4 py-2">
            <label htmlFor="hdr-bohrkrone" className="w-28 text-xs font-medium text-slate-500 shrink-0">
              Bohrkrone Ø
            </label>
            <input
              id="hdr-bohrkrone"
              type="text"
              value={header.bohrkroneDurchmesser}
              onChange={(e) => onChangeHeader('bohrkroneDurchmesser', e.target.value)}
              placeholder="z.B. 90 mm"
              className="w-full h-8 px-2 text-sm font-mono text-slate-900 bg-slate-50/60 border border-slate-200 rounded focus:bg-white focus:outline-none focus:border-blue-700"
            />
          </div>
          <div className="flex items-center gap-2 px-4 py-2">
            <label htmlFor="hdr-tragglied" className="w-28 text-xs font-medium text-slate-500 shrink-0">
              Tragglied
            </label>
            <input
              id="hdr-tragglied"
              type="text"
              value={header.tragglied}
              onChange={(e) => onChangeHeader('tragglied', e.target.value)}
              placeholder="z.B. R51/15"
              className="w-full h-8 px-2 text-sm font-mono text-slate-900 bg-slate-50/60 border border-slate-200 rounded focus:bg-white focus:outline-none focus:border-blue-700"
            />
          </div>
          <div className="flex items-center gap-2 px-4 py-2">
            <label htmlFor="hdr-bohrzweck" className="w-28 text-xs font-medium text-slate-500 shrink-0">
              Bohrzweck
            </label>
            <input
              id="hdr-bohrzweck"
              type="text"
              value={header.bohrzweck}
              onChange={(e) => onChangeHeader('bohrzweck', e.target.value)}
              placeholder="z.B. Kranpfähle"
              className="w-full h-8 px-2 text-sm text-slate-900 bg-slate-50/60 border border-slate-200 rounded focus:bg-white focus:outline-none focus:border-blue-700"
            />
          </div>
        </div>
      </div>

      {/* Optional Bauführer line */}
      <div className="flex flex-wrap items-center justify-between gap-4 px-4 py-2 bg-slate-50/50 border-t border-slate-200 text-xs text-slate-600">
        <div className="flex items-center gap-2">
          <label htmlFor="hdr-baufuehrer" className="font-medium text-slate-500">
            Bauführer:
          </label>
          <input
            id="hdr-baufuehrer"
            type="text"
            value={header.baufuehrer}
            onChange={(e) => onChangeHeader('baufuehrer', e.target.value)}
            placeholder="Name eintragen (optional)"
            className="h-7 px-2 text-xs text-slate-900 bg-white border border-slate-200 rounded focus:outline-none focus:border-blue-700 w-52"
          />
        </div>
        <span className="text-slate-500">
          Hinweis: Bohrmeister, Bohrzweck, Tragglied, Bohrkrone Ø und Bohrgerät können hier jederzeit angepasst werden.
        </span>
      </div>
    </section>
  );
};
