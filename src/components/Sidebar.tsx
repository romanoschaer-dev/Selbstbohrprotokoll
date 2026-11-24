import React, { useRef, useState } from 'react';
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  FileText,
  X,
  BarChart3,
  HardDriveDownload,
  Upload,
  CheckCircle2,
  Download,
} from 'lucide-react';
import { Baustelle, Protocol } from '../types/protocol';
import { isRowFilled } from '../utils/calculations';

interface SidebarProps {
  baustellen: Baustelle[];
  protocols: Protocol[];
  activeBaustelleId: string | null;
  activeProtocolId: string | null;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  onSelectBaustelle: (id: string) => void;
  onSelectProtocol: (id: string) => void;
  onCreateBaustelle: () => void;
  onEditBaustelle: (baustelle: Baustelle) => void;
  onDeleteBaustelle: (id: string) => void;
  onCreateProtocol: (baustelleId: string) => void;
  onDeleteProtocol: (id: string) => void;
  onOpenSiteSummary: (baustelleId: string) => void;
  onOpenBatchPdf: (baustelleId: string) => void;
  onExportLocalBackup: () => void;
  onImportLocalBackup: (file: File) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  baustellen,
  protocols,
  activeBaustelleId,
  activeProtocolId,
  isOpenMobile,
  onCloseMobile,
  onSelectBaustelle,
  onSelectProtocol,
  onCreateBaustelle,
  onEditBaustelle,
  onDeleteBaustelle,
  onCreateProtocol,
  onDeleteProtocol,
  onOpenSiteSummary,
  onOpenBatchPdf,
  onExportLocalBackup,
  onImportLocalBackup,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [confirmDeleteSiteId, setConfirmDeleteSiteId] = useState<string | null>(null);
  const [confirmDeleteProtocolId, setConfirmDeleteProtocolId] = useState<string | null>(null);

  const query = searchQuery.trim().toLowerCase();
  const filteredBaustellen = baustellen.filter(
    (b) =>
      b.projekt.toLowerCase().includes(query) ||
      b.ktr.toLowerCase().includes(query) ||
      b.bohrzweck.toLowerCase().includes(query)
  );

  const sidebarContent = (
    <div className="flex flex-col h-full bg-white border-r border-slate-200 w-[272px] shrink-0">
      {/* Brand Zone */}
      <div className="flex items-center justify-between px-5 h-16 border-b border-slate-200 shrink-0">
        <span className="font-display text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0">
          Ankerprotokoll
        </span>
        <button
          type="button"
          onClick={onCloseMobile}
          className="lg:hidden p-1.5 text-slate-500 hover:text-slate-900 rounded-md"
          aria-label="Seitenleiste schliessen"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Primary Action + Search */}
      <div className="p-4 space-y-3 border-b border-slate-200 shrink-0">
        <button
          type="button"
          onClick={() => {
            onCreateBaustelle();
            onCloseMobile();
          }}
          className="w-full inline-flex items-center justify-center gap-2 h-10 px-4 text-xs font-medium text-white bg-blue-800 rounded-md hover:bg-blue-900 transition-colors whitespace-nowrap shrink-0"
        >
          <Plus className="w-4 h-4" />
          Neue Baustelle erfassen
        </button>

        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Baustelle oder KTR suchen..."
            aria-label="Baustelle oder KTR suchen"
            className="w-full h-9 pl-8 pr-3 text-xs bg-slate-50 border border-slate-200 rounded-md text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-blue-700"
          />
        </div>
      </div>

      {/* Baustellen & Protocols List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
        {filteredBaustellen.length === 0 ? (
          <div className="px-3 py-8 text-center">
            <p className="text-xs text-slate-500">
              {baustellen.length === 0
                ? 'Noch keine Baustelle erfasst.'
                : 'Keine passende Baustelle gefunden.'}
            </p>
          </div>
        ) : (
          filteredBaustellen.map((site) => {
            const siteProtocols = protocols
              .filter((p) => p.baustelleId === site.id)
              .sort((a, b) => a.nummer - b.nummer);
            const isActive = site.id === activeBaustelleId;
            const isConfirmingSiteDelete = confirmDeleteSiteId === site.id;

            return (
              <div key={site.id} className="space-y-1">
                <div
                  className={`group rounded-md border transition-colors ${
                    isActive
                      ? 'bg-slate-100/90 border-slate-300'
                      : 'bg-white border-transparent hover:bg-slate-50 hover:border-slate-200'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 p-2.5">
                    <button
                      type="button"
                      onClick={() => {
                        onSelectBaustelle(site.id);
                        setConfirmDeleteSiteId(null);
                      }}
                      className="flex-1 text-left min-w-0 focus-visible:outline-2 focus-visible:outline-blue-700 rounded"
                    >
                      <div className="text-xs font-semibold text-slate-900 truncate">
                        {site.projekt}
                      </div>
                      <div className="mt-1 flex items-center gap-1.5 text-[11px] text-slate-500">
                        <span className="font-mono tabular-nums">KTR {site.ktr}</span>
                        <span aria-hidden="true">·</span>
                        <span>
                          {siteProtocols.length}{' '}
                          {siteProtocols.length === 1 ? 'Protokoll' : 'Protokolle'}
                        </span>
                      </div>
                    </button>

                    <div className="flex items-center gap-0.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => onEditBaustelle(site)}
                        className="p-1.5 text-slate-400 hover:text-slate-800 rounded transition-colors"
                        title="Baustelle bearbeiten"
                        aria-label={`${site.projekt} bearbeiten`}
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setConfirmDeleteSiteId(isConfirmingSiteDelete ? null : site.id)
                        }
                        className="p-1.5 text-slate-400 hover:text-red-700 rounded transition-colors"
                        title="Baustelle löschen"
                        aria-label={`${site.projekt} löschen`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {isConfirmingSiteDelete && (
                    <div className="px-2.5 pb-2.5 pt-1 border-t border-slate-200 flex items-center justify-between gap-2">
                      <span className="text-[11px] text-red-700 font-medium">
                        Baustelle löschen?
                      </span>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteSiteId(null)}
                          className="px-2 py-1 text-[11px] text-slate-600 hover:text-slate-900"
                        >
                          Nein
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            onDeleteBaustelle(site.id);
                            setConfirmDeleteSiteId(null);
                          }}
                          className="px-2 py-1 text-[11px] font-medium text-white bg-red-700 rounded hover:bg-red-800"
                        >
                          Löschen
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Protocols under active Baustelle */}
                {isActive && (
                  <div className="pl-3 pr-1 pb-2 space-y-1">
                    {siteProtocols.map((prot) => {
                      const isProtActive = prot.id === activeProtocolId;
                      const filled = prot.rows.filter(isRowFilled).length;
                      const isConfirmingProtDelete = confirmDeleteProtocolId === prot.id;

                      return (
                        <div key={prot.id} className="space-y-1">
                          <div
                            className={`flex items-center justify-between gap-2 px-2.5 py-2 rounded-md border text-xs transition-colors ${
                              isProtActive
                                ? 'bg-blue-50/70 border-blue-200 text-blue-950 font-medium'
                                : 'bg-white border-slate-200/70 text-slate-700 hover:bg-slate-50'
                            }`}
                          >
                            <button
                              type="button"
                              onClick={() => {
                                onSelectProtocol(prot.id);
                                onCloseMobile();
                              }}
                              className="flex items-center gap-2 flex-1 text-left min-w-0"
                            >
                              <FileText className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                              <span className="truncate">Protokoll Nr. {prot.nummer}</span>
                              {prot.pdfExportedAt && (
                                <span
                                  title="PDF bereits geladen"
                                  aria-label="PDF bereits geladen"
                                  className="inline-flex items-center text-emerald-700 shrink-0"
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                </span>
                              )}
                              <span className="ml-auto font-mono tabular-nums text-[11px] text-slate-500 shrink-0">
                                {filled}/16
                              </span>
                            </button>

                            {siteProtocols.length > 1 && (
                              <button
                                type="button"
                                onClick={() =>
                                  setConfirmDeleteProtocolId(
                                    isConfirmingProtDelete ? null : prot.id
                                  )
                                }
                                className="p-1 text-slate-400 hover:text-red-700 rounded shrink-0"
                                title="Protokoll löschen"
                                aria-label={`Protokoll ${prot.nummer} löschen`}
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            )}
                          </div>

                          {isConfirmingProtDelete && (
                            <div className="px-2.5 py-1.5 bg-red-50 border border-red-200 rounded flex items-center justify-between gap-2">
                              <span className="text-[11px] text-red-700">Löschen?</span>
                              <div className="flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => setConfirmDeleteProtocolId(null)}
                                  className="px-2 py-0.5 text-[11px] text-slate-600"
                                >
                                  Nein
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    onDeleteProtocol(prot.id);
                                    setConfirmDeleteProtocolId(null);
                                  }}
                                  className="px-2 py-0.5 text-[11px] font-medium text-white bg-red-700 rounded"
                                >
                                  Ja
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}

                    <button
                      type="button"
                      onClick={() => {
                        onCreateProtocol(site.id);
                        onCloseMobile();
                      }}
                      className="w-full flex items-center justify-center gap-1.5 py-2 px-2.5 text-xs font-medium text-blue-800 bg-white border border-dashed border-slate-300 rounded-md hover:border-blue-700 hover:bg-blue-50/40 transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Neues Protokoll (16 Anker)
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        onOpenBatchPdf(site.id);
                        onCloseMobile();
                      }}
                      className="w-full flex items-center justify-center gap-1.5 py-2 px-2.5 text-xs font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-md hover:bg-slate-100 hover:text-slate-900 transition-colors"
                    >
                      <Download className="w-3.5 h-3.5 text-slate-500" />
                      Protokolle als PDF wählen
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        onOpenSiteSummary(site.id);
                        onCloseMobile();
                      }}
                      className="w-full flex items-center justify-center gap-1.5 py-2 px-2.5 text-xs font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-md hover:bg-slate-100 hover:text-slate-900 transition-colors"
                    >
                      <BarChart3 className="w-3.5 h-3.5 text-slate-500" />
                      Baustellen-Zusammenfassung
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Local Storage & Backup Footer */}
      <div className="p-3 border-t border-slate-200 bg-slate-50/80 space-y-2 shrink-0">
        <div className="text-[11px] text-slate-500">
          Datenspeicherung: lokal auf diesem Gerät
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onExportLocalBackup}
            className="flex-1 inline-flex items-center justify-center gap-1.5 h-8 px-2 text-[11px] font-medium text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-100 transition-colors whitespace-nowrap"
          >
            <HardDriveDownload className="w-3.5 h-3.5" />
            Lokal sichern
          </button>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex-1 inline-flex items-center justify-center gap-1.5 h-8 px-2 text-[11px] font-medium text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-100 transition-colors whitespace-nowrap"
          >
            <Upload className="w-3.5 h-3.5" />
            Datei laden
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                onImportLocalBackup(file);
                e.target.value = '';
              }
            }}
          />
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop persistent sidebar */}
      <aside className="hidden lg:block h-screen sticky top-0 shrink-0">
        {sidebarContent}
      </aside>

      {/* Mobile slide-over */}
      {isOpenMobile && (
        <div className="fixed inset-0 z-40 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-950/40"
            onClick={onCloseMobile}
            aria-hidden="true"
          />
          <div className="relative z-10 h-full">{sidebarContent}</div>
        </div>
      )}
    </>
  );
};
