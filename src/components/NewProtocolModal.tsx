import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { Baustelle, Protocol } from '../types/protocol';

export interface ProtocolCopyOptions {
  sourceProtocolId: string;
  // Header fields (unchecked falls back to Baustellen-Standard)
  copyBohrgeraet: boolean;
  copyInjektionspumpe: boolean;
  copyBohrmeister: boolean;
  copyBohrkrone: boolean;
  copyTragglied: boolean;
  copyBohrzweck: boolean;
  // Row fields
  rowCopyMode: 'row-by-row' | 'first-to-all' | 'first-only';
  copyDatum: boolean;
  continueNr: boolean;
  copyNeigung: boolean;
  copyLaengen: boolean;
  copyBaugrund: boolean;
  copyKuemixAndStd: boolean;
}

interface NewProtocolModalProps {
  isOpen: boolean;
  baustelle: Baustelle;
  existingProtocols: Protocol[];
  nextNummer: number;
  onClose: () => void;
  onConfirm: (options: ProtocolCopyOptions) => void;
}

export const NewProtocolModal: React.FC<NewProtocolModalProps> = ({
  isOpen,
  baustelle,
  existingProtocols,
  nextNummer,
  onClose,
  onConfirm,
}) => {
  const sortedProtocols = [...existingProtocols].sort((a, b) => a.nummer - b.nummer);
  const firstProtocol = sortedProtocols[0];

  const [sourceProtocolId, setSourceProtocolId] = useState<string>(
    firstProtocol?.id ?? ''
  );

  // Header options
  const [copyBohrgeraet, setCopyBohrgeraet] = useState(true);
  const [copyInjektionspumpe, setCopyInjektionspumpe] = useState(true);
  const [copyBohrmeister, setCopyBohrmeister] = useState(true);
  const [copyBohrkrone, setCopyBohrkrone] = useState(true);
  const [copyTragglied, setCopyTragglied] = useState(true);
  const [copyBohrzweck, setCopyBohrzweck] = useState(true);

  // Row options
  const [rowCopyMode, setRowCopyMode] = useState<
    'row-by-row' | 'first-to-all' | 'first-only'
  >('first-to-all');
  const [copyDatum, setCopyDatum] = useState(true);
  const [continueNr, setContinueNr] = useState(true);
  const [copyNeigung, setCopyNeigung] = useState(true);
  const [copyLaengen, setCopyLaengen] = useState(true);
  const [copyBaugrund, setCopyBaugrund] = useState(false);
  const [copyKuemixAndStd, setCopyKuemixAndStd] = useState(false);

  useEffect(() => {
    if (isOpen && firstProtocol) {
      setSourceProtocolId(firstProtocol.id);
    }
  }, [isOpen, firstProtocol]);

  if (!isOpen || !firstProtocol) return null;

  const selectedSource =
    sortedProtocols.find((p) => p.id === sourceProtocolId) ?? firstProtocol;

  const setAllRows = (checked: boolean) => {
    setCopyDatum(checked);
    setContinueNr(checked);
    setCopyNeigung(checked);
    setCopyLaengen(checked);
    setCopyBaugrund(checked);
    setCopyKuemixAndStd(checked);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirm({
      sourceProtocolId: selectedSource.id,
      copyBohrgeraet,
      copyInjektionspumpe,
      copyBohrmeister,
      copyBohrkrone,
      copyTragglied,
      copyBohrzweck,
      rowCopyMode,
      copyDatum,
      continueNr,
      copyNeigung,
      copyLaengen,
      copyBaugrund,
      copyKuemixAndStd,
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="new-protocol-title"
    >
      <div className="w-full max-w-2xl bg-white border border-slate-200 rounded-lg shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-b border-slate-200">
          <div>
            <h2 id="new-protocol-title" className="text-lg font-semibold text-slate-900">
              Protokoll Nr. {nextNummer} erstellen
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {baustelle.projekt} · Datenübernahme aus bestehendem Protokoll wählen
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-200/60 rounded-md transition-colors"
            aria-label="Dialog schliessen"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[82vh] overflow-y-auto">
          {/* Source Protocol Selection */}
          <div>
            <label
              htmlFor="source-protocol-select"
              className="block text-xs font-semibold text-slate-700 mb-1.5"
            >
              Daten übernehmen von:
            </label>
            <select
              id="source-protocol-select"
              value={selectedSource.id}
              onChange={(e) => setSourceProtocolId(e.target.value)}
              className="w-full h-10 px-3 text-sm bg-white border border-slate-300 rounded-md text-slate-900 focus:outline-none focus:border-blue-700"
            >
              {sortedProtocols.map((p) => (
                <option key={p.id} value={p.id}>
                  Protokoll Nr. {p.nummer} ({p.header.bohrzweck} · Bohrmeister:{' '}
                  {p.header.bohrmeister || '—'})
                </option>
              ))}
            </select>
          </div>

          {/* Header fields */}
          <div className="border-t border-slate-200 pt-4">
            <div className="flex items-center justify-between mb-2.5">
              <h3 className="text-xs font-semibold text-slate-800">
                1. Kopfdaten vom Protokoll Nr. {selectedSource.nummer} übernehmen
              </h3>
              <span className="text-[11px] text-slate-500">
                (abgewählte Felder nutzen Baustellen-Standard)
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <label className="flex items-center gap-2.5 p-2 border border-slate-200 rounded-md hover:bg-slate-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={copyBohrgeraet}
                  onChange={(e) => setCopyBohrgeraet(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-blue-800 focus:ring-blue-700"
                />
                <span className="text-slate-800 font-medium">Bohrgerät</span>
                <span className="ml-auto text-slate-500 truncate max-w-[120px]">
                  {selectedSource.header.bohrgeraet || '—'}
                </span>
              </label>

              <label className="flex items-center gap-2.5 p-2 border border-slate-200 rounded-md hover:bg-slate-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={copyInjektionspumpe}
                  onChange={(e) => setCopyInjektionspumpe(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-blue-800 focus:ring-blue-700"
                />
                <span className="text-slate-800 font-medium">Injektionspumpe</span>
                <span className="ml-auto text-slate-500 truncate max-w-[120px]">
                  {selectedSource.header.injektionspumpe || '—'}
                </span>
              </label>

              <label className="flex items-center gap-2.5 p-2 border border-slate-200 rounded-md hover:bg-slate-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={copyBohrmeister}
                  onChange={(e) => setCopyBohrmeister(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-blue-800 focus:ring-blue-700"
                />
                <span className="text-slate-800 font-medium">Bohrmeister &amp; Bauführer</span>
                <span className="ml-auto text-slate-500 truncate max-w-[120px]">
                  {selectedSource.header.bohrmeister || '—'}
                </span>
              </label>

              <label className="flex items-center gap-2.5 p-2 border border-slate-200 rounded-md hover:bg-slate-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={copyBohrkrone}
                  onChange={(e) => setCopyBohrkrone(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-blue-800 focus:ring-blue-700"
                />
                <span className="text-slate-800 font-medium">Bohrkrone Ø</span>
                <span className="ml-auto font-mono text-slate-500 truncate max-w-[120px]">
                  {selectedSource.header.bohrkroneDurchmesser || '—'}
                </span>
              </label>

              <label className="flex items-center gap-2.5 p-2 border border-slate-200 rounded-md hover:bg-slate-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={copyTragglied}
                  onChange={(e) => setCopyTragglied(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-blue-800 focus:ring-blue-700"
                />
                <span className="text-slate-800 font-medium">Tragglied</span>
                <span className="ml-auto font-mono text-slate-500 truncate max-w-[120px]">
                  {selectedSource.header.tragglied || '—'}
                </span>
              </label>

              <label className="flex items-center gap-2.5 p-2 border border-slate-200 rounded-md hover:bg-slate-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={copyBohrzweck}
                  onChange={(e) => setCopyBohrzweck(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-blue-800 focus:ring-blue-700"
                />
                <span className="text-slate-800 font-medium">Bohrzweck &amp; Bauteil</span>
                <span className="ml-auto text-slate-500 truncate max-w-[120px]">
                  {selectedSource.header.bohrzweck || '—'}
                </span>
              </label>
            </div>
          </div>

          {/* Anchor row fields */}
          <div className="border-t border-slate-200 pt-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold text-slate-800">
                2. Anker-Angaben aus Protokoll Nr. {selectedSource.nummer} übernehmen
              </h3>
              <div className="flex items-center gap-3 text-xs">
                <button
                  type="button"
                  onClick={() => setAllRows(true)}
                  className="text-blue-800 hover:underline font-medium"
                >
                  Alle wählen
                </button>
                <button
                  type="button"
                  onClick={() => setAllRows(false)}
                  className="text-slate-500 hover:underline"
                >
                  Keine
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <label className="flex items-center gap-2.5 p-2 border border-slate-200 rounded-md hover:bg-slate-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={copyDatum}
                  onChange={(e) => setCopyDatum(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-blue-800 focus:ring-blue-700"
                />
                <span className="text-slate-800">Datum übernehmen</span>
              </label>

              <label className="flex items-center gap-2.5 p-2 border border-slate-200 rounded-md hover:bg-slate-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={continueNr}
                  onChange={(e) => setContinueNr(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-blue-800 focus:ring-blue-700"
                />
                <span className="text-slate-800">Anker-Nummern fortlaufend weiterführen</span>
              </label>

              <label className="flex items-center gap-2.5 p-2 border border-slate-200 rounded-md hover:bg-slate-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={copyNeigung}
                  onChange={(e) => setCopyNeigung(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-blue-800 focus:ring-blue-700"
                />
                <span className="text-slate-800">Neigung (α)</span>
              </label>

              <label className="flex items-center gap-2.5 p-2 border border-slate-200 rounded-md hover:bg-slate-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={copyLaengen}
                  onChange={(e) => setCopyLaengen(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-blue-800 focus:ring-blue-700"
                />
                <span className="text-slate-800">Totale &amp; freie Ankerlänge</span>
              </label>

              <label className="flex items-center gap-2.5 p-2 border border-slate-200 rounded-md hover:bg-slate-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={copyBaugrund}
                  onChange={(e) => setCopyBaugrund(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-blue-800 focus:ring-blue-700"
                />
                <span className="text-slate-800">Bodenbeschaffenheit (inkl. von–bis)</span>
              </label>

              <label className="flex items-center gap-2.5 p-2 border border-slate-200 rounded-md hover:bg-slate-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={copyKuemixAndStd}
                  onChange={(e) => setCopyKuemixAndStd(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-blue-800 focus:ring-blue-700"
                />
                <span className="text-slate-800">Gruppenstunden &amp; Kümix</span>
              </label>
            </div>

            <div className="pt-1">
              <span className="block text-[11px] font-medium text-slate-600 mb-1.5">
                Wie sollen die gewählten Anker-Angaben eingefügt werden?
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                <label className="flex items-center gap-2 p-2 border border-slate-200 rounded-md cursor-pointer hover:bg-slate-50">
                  <input
                    type="radio"
                    name="rowCopyMode"
                    checked={rowCopyMode === 'first-to-all'}
                    onChange={() => setRowCopyMode('first-to-all')}
                    className="text-blue-800 focus:ring-blue-700"
                  />
                  <span>Pos. 1 auf alle 16 Zeilen</span>
                </label>

                <label className="flex items-center gap-2 p-2 border border-slate-200 rounded-md cursor-pointer hover:bg-slate-50">
                  <input
                    type="radio"
                    name="rowCopyMode"
                    checked={rowCopyMode === 'row-by-row'}
                    onChange={() => setRowCopyMode('row-by-row')}
                    className="text-blue-800 focus:ring-blue-700"
                  />
                  <span>Zeile 1–16 direkt kopieren</span>
                </label>

                <label className="flex items-center gap-2 p-2 border border-slate-200 rounded-md cursor-pointer hover:bg-slate-50">
                  <input
                    type="radio"
                    name="rowCopyMode"
                    checked={rowCopyMode === 'first-only'}
                    onChange={() => setRowCopyMode('first-only')}
                    className="text-blue-800 focus:ring-blue-700"
                  />
                  <span>Nur in Pos. 1 übernehmen</span>
                </label>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 transition-colors"
            >
              Abbrechen
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-800 rounded-md hover:bg-blue-900 transition-colors"
            >
              Protokoll Nr. {nextNummer} anlegen
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
