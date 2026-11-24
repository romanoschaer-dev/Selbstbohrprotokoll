import { useEffect, useMemo, useState } from 'react';
import {
  Download,
  Eye,
  Menu,
  Plus,
  Building2,
  CheckCircle2,
} from 'lucide-react';
import {
  AnchorRow,
  Baustelle,
  GroundRange,
  Protocol,
  ProtocolHeader,
} from './types/protocol';
import {
  cloneRanges,
  computeProtocolTotals,
  createEmptyRange,
  createEmptyRow,
  createEmptyRows,
  incrementAnchorNumber,
  isRowFilled,
} from './utils/calculations';
import {
  downloadLocalBackup,
  loadWorkspaceData,
  parseLocalBackup,
  saveWorkspaceData,
} from './utils/storage';
import {
  downloadCombinedProtocolsPdf,
  downloadProtocolPdf,
} from './utils/pdfExport';
import { Sidebar } from './components/Sidebar';
import { BaustelleModal, BaustelleFormValues } from './components/BaustelleModal';
import { ProtocolHeaderGrid } from './components/ProtocolHeaderGrid';
import { AnchorTable } from './components/AnchorTable';
import { ProtocolSummary } from './components/ProtocolSummary';
import { PdfPreviewModal } from './components/PdfPreviewModal';
import { BaustelleSummaryModal } from './components/BaustelleSummaryModal';
import {
  NewProtocolModal,
  ProtocolCopyOptions,
} from './components/NewProtocolModal';
import { BatchPdfModal } from './components/BatchPdfModal';

function createHeaderFromBaustelle(site: Baustelle): ProtocolHeader {
  return {
    firma: site.firma,
    bauteil: site.bauteil || site.bohrzweck,
    baufuehrer: site.baufuehrer,
    bohrgeraet: site.bohrgeraet,
    injektionspumpe: site.injektionspumpe,
    bohrmeister: site.bohrmeister,
    bohrmeisterUnterschrift: site.bohrmeisterUnterschrift,
    bohrkroneDurchmesser: site.bohrkroneDurchmesser,
    tragglied: site.tragglied,
    bohrzweck: site.bohrzweck,
  };
}

function cloneAnchorRows(rows: AnchorRow[]): AnchorRow[] {
  return rows.map((r) => ({
    ...r,
    bloeckeRanges: cloneRanges(r.bloeckeRanges),
    betonRanges: cloneRanges(r.betonRanges),
  }));
}

export default function App() {
  const initialData = useMemo(() => loadWorkspaceData(), []);
  const [baustellen, setBaustellen] = useState<Baustelle[]>(initialData.baustellen);
  const [protocols, setProtocols] = useState<Protocol[]>(initialData.protocols);

  const [activeBaustelleId, setActiveBaustelleId] = useState<string | null>(
    initialData.baustellen[0]?.id ?? null
  );
  const [activeProtocolId, setActiveProtocolId] = useState<string | null>(() => {
    const firstSite = initialData.baustellen[0];
    if (!firstSite) return null;
    const siteProtocols = initialData.protocols
      .filter((p) => p.baustelleId === firstSite.id)
      .sort((a, b) => a.nummer - b.nummer);
    return siteProtocols[0]?.id ?? null;
  });

  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isBaustelleModalOpen, setIsBaustelleModalOpen] = useState(false);
  const [editingBaustelle, setEditingBaustelle] = useState<Baustelle | null>(null);
  const [isPdfPreviewOpen, setIsPdfPreviewOpen] = useState(false);
  const [siteSummaryBaustelleId, setSiteSummaryBaustelleId] = useState<string | null>(null);
  const [newProtocolTargetSiteId, setNewProtocolTargetSiteId] = useState<string | null>(null);
  const [batchPdfBaustelleId, setBatchPdfBaustelleId] = useState<string | null>(null);

  const [undoSnapshot, setUndoSnapshot] = useState<{
    protocolId: string;
    rows: AnchorRow[];
  } | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<string>('');

  // Local persistence in browser localStorage
  useEffect(() => {
    saveWorkspaceData(baustellen, protocols);
  }, [baustellen, protocols]);

  useEffect(() => {
    if (!feedbackMessage) return;
    const timer = window.setTimeout(() => setFeedbackMessage(''), 3500);
    return () => window.clearTimeout(timer);
  }, [feedbackMessage]);

  const activeBaustelle = useMemo(
    () => baustellen.find((b) => b.id === activeBaustelleId) ?? null,
    [baustellen, activeBaustelleId]
  );

  const activeProtocol = useMemo(
    () => protocols.find((p) => p.id === activeProtocolId) ?? null,
    [protocols, activeProtocolId]
  );

  const totals = useMemo(
    () =>
      activeProtocol
        ? computeProtocolTotals(activeProtocol.rows)
        : computeProtocolTotals([]),
    [activeProtocol]
  );

  const summaryBaustelle = useMemo(
    () => baustellen.find((b) => b.id === siteSummaryBaustelleId) ?? null,
    [baustellen, siteSummaryBaustelleId]
  );

  const summaryProtocols = useMemo(
    () =>
      siteSummaryBaustelleId
        ? protocols.filter((p) => p.baustelleId === siteSummaryBaustelleId)
        : [],
    [protocols, siteSummaryBaustelleId]
  );

  const newProtocolTargetSite = useMemo(
    () => baustellen.find((b) => b.id === newProtocolTargetSiteId) ?? null,
    [baustellen, newProtocolTargetSiteId]
  );

  const newProtocolExistingList = useMemo(
    () =>
      newProtocolTargetSiteId
        ? protocols.filter((p) => p.baustelleId === newProtocolTargetSiteId)
        : [],
    [protocols, newProtocolTargetSiteId]
  );

  const batchPdfBaustelle = useMemo(
    () => baustellen.find((b) => b.id === batchPdfBaustelleId) ?? null,
    [baustellen, batchPdfBaustelleId]
  );

  const batchPdfProtocols = useMemo(
    () =>
      batchPdfBaustelleId
        ? protocols.filter((p) => p.baustelleId === batchPdfBaustelleId)
        : [],
    [protocols, batchPdfBaustelleId]
  );

  const handleSelectBaustelle = (siteId: string) => {
    setActiveBaustelleId(siteId);
    const siteProtocols = protocols
      .filter((p) => p.baustelleId === siteId)
      .sort((a, b) => a.nummer - b.nummer);
    setActiveProtocolId(siteProtocols[0]?.id ?? null);
    setUndoSnapshot(null);
  };

  const handleSelectProtocol = (protocolId: string) => {
    setActiveProtocolId(protocolId);
    setUndoSnapshot(null);
  };

  const handleOpenNewBaustelle = () => {
    setEditingBaustelle(null);
    setIsBaustelleModalOpen(true);
  };

  const handleOpenEditBaustelle = (site: Baustelle) => {
    setEditingBaustelle(site);
    setIsBaustelleModalOpen(true);
  };

  const handleSaveBaustelle = (values: BaustelleFormValues) => {
    const now = new Date().toISOString();

    if (editingBaustelle) {
      const oldSite = editingBaustelle;
      const updatedSite: Baustelle = {
        ...oldSite,
        ...values,
        updatedAt: now,
      };

      setBaustellen((prev) =>
        prev.map((b) => (b.id === oldSite.id ? updatedSite : b))
      );

      setProtocols((prev) =>
        prev.map((p) => {
          if (p.baustelleId !== oldSite.id) return p;
          const h = p.header;
          return {
            ...p,
            updatedAt: now,
            header: {
              firma: h.firma === oldSite.firma ? updatedSite.firma : h.firma,
              bauteil: h.bauteil === oldSite.bauteil ? updatedSite.bauteil : h.bauteil,
              baufuehrer:
                h.baufuehrer === oldSite.baufuehrer
                  ? updatedSite.baufuehrer
                  : h.baufuehrer,
              bohrgeraet:
                h.bohrgeraet === oldSite.bohrgeraet
                  ? updatedSite.bohrgeraet
                  : h.bohrgeraet,
              injektionspumpe:
                h.injektionspumpe === oldSite.injektionspumpe
                  ? updatedSite.injektionspumpe
                  : h.injektionspumpe,
              bohrmeister:
                h.bohrmeister === oldSite.bohrmeister
                  ? updatedSite.bohrmeister
                  : h.bohrmeister,
              bohrmeisterUnterschrift:
                h.bohrmeisterUnterschrift === oldSite.bohrmeisterUnterschrift ||
                !h.bohrmeisterUnterschrift
                  ? updatedSite.bohrmeisterUnterschrift
                  : h.bohrmeisterUnterschrift,
              bohrkroneDurchmesser:
                h.bohrkroneDurchmesser === oldSite.bohrkroneDurchmesser
                  ? updatedSite.bohrkroneDurchmesser
                  : h.bohrkroneDurchmesser,
              tragglied:
                h.tragglied === oldSite.tragglied ? updatedSite.tragglied : h.tragglied,
              bohrzweck:
                h.bohrzweck === oldSite.bohrzweck ? updatedSite.bohrzweck : h.bohrzweck,
            },
          };
        })
      );

      setIsBaustelleModalOpen(false);
      setEditingBaustelle(null);
      setFeedbackMessage(`Baustelle "${updatedSite.projekt}" aktualisiert.`);
      return;
    }

    const newSiteId = `bs-${Date.now()}`;
    const newSite: Baustelle = {
      id: newSiteId,
      ...values,
      createdAt: now,
      updatedAt: now,
    };

    const newProtocolId = `pr-${Date.now()}`;
    const firstProtocol: Protocol = {
      id: newProtocolId,
      baustelleId: newSiteId,
      nummer: 1,
      titel: values.bohrzweck,
      header: createHeaderFromBaustelle(newSite),
      rows: createEmptyRows(),
      createdAt: now,
      updatedAt: now,
    };

    setBaustellen((prev) => [newSite, ...prev]);
    setProtocols((prev) => [...prev, firstProtocol]);
    setActiveBaustelleId(newSiteId);
    setActiveProtocolId(newProtocolId);
    setUndoSnapshot(null);
    setIsBaustelleModalOpen(false);
    setFeedbackMessage(`Baustelle "${newSite.projekt}" lokal erfasst.`);
  };

  const handleDeleteBaustelle = (siteId: string) => {
    const remainingSites = baustellen.filter((b) => b.id !== siteId);
    const remainingProtocols = protocols.filter((p) => p.baustelleId !== siteId);

    setBaustellen(remainingSites);
    setProtocols(remainingProtocols);

    if (activeBaustelleId === siteId) {
      const nextSite = remainingSites[0] ?? null;
      setActiveBaustelleId(nextSite?.id ?? null);
      if (nextSite) {
        const nextProt = remainingProtocols
          .filter((p) => p.baustelleId === nextSite.id)
          .sort((a, b) => a.nummer - b.nummer)[0];
        setActiveProtocolId(nextProt?.id ?? null);
      } else {
        setActiveProtocolId(null);
      }
      setUndoSnapshot(null);
    }
  };

  const handleRequestCreateProtocol = (siteId: string) => {
    const site = baustellen.find((b) => b.id === siteId);
    if (!site) return;

    const existingForSite = protocols.filter((p) => p.baustelleId === siteId);
    if (existingForSite.length > 0) {
      setNewProtocolTargetSiteId(siteId);
      return;
    }

    const now = new Date().toISOString();
    const newProtocol: Protocol = {
      id: `pr-${Date.now()}`,
      baustelleId: siteId,
      nummer: 1,
      titel: site.bohrzweck,
      header: createHeaderFromBaustelle(site),
      rows: createEmptyRows(),
      createdAt: now,
      updatedAt: now,
    };

    setProtocols((prev) => [...prev, newProtocol]);
    setActiveBaustelleId(siteId);
    setActiveProtocolId(newProtocol.id);
    setUndoSnapshot(null);
    setFeedbackMessage('Protokoll Nr. 1 erstellt.');
  };

  const handleConfirmNewProtocol = (options: ProtocolCopyOptions) => {
    if (!newProtocolTargetSite) return;
    const site = newProtocolTargetSite;
    const siteProtocols = protocols.filter((p) => p.baustelleId === site.id);
    const nextNummer =
      siteProtocols.length > 0
        ? Math.max(...siteProtocols.map((p) => p.nummer)) + 1
        : 1;

    const sourceProt =
      siteProtocols.find((p) => p.id === options.sourceProtocolId) ?? siteProtocols[0];
    const now = new Date().toISOString();

    const baseHeader = createHeaderFromBaustelle(site);
    const header: ProtocolHeader = sourceProt
      ? {
          firma: sourceProt.header.firma || baseHeader.firma,
          bohrgeraet: options.copyBohrgeraet
            ? sourceProt.header.bohrgeraet
            : baseHeader.bohrgeraet,
          injektionspumpe: options.copyInjektionspumpe
            ? sourceProt.header.injektionspumpe
            : baseHeader.injektionspumpe,
          bohrmeister: options.copyBohrmeister
            ? sourceProt.header.bohrmeister
            : baseHeader.bohrmeister,
          bohrmeisterUnterschrift: options.copyBohrmeister
            ? sourceProt.header.bohrmeisterUnterschrift ||
              baseHeader.bohrmeisterUnterschrift
            : baseHeader.bohrmeisterUnterschrift,
          baufuehrer: options.copyBohrmeister
            ? sourceProt.header.baufuehrer
            : baseHeader.baufuehrer,
          bohrkroneDurchmesser: options.copyBohrkrone
            ? sourceProt.header.bohrkroneDurchmesser
            : baseHeader.bohrkroneDurchmesser,
          tragglied: options.copyTragglied
            ? sourceProt.header.tragglied
            : baseHeader.tragglied,
          bohrzweck: options.copyBohrzweck
            ? sourceProt.header.bohrzweck
            : baseHeader.bohrzweck,
          bauteil: options.copyBohrzweck
            ? sourceProt.header.bauteil
            : baseHeader.bauteil,
        }
      : baseHeader;

    const rows = createEmptyRows();

    if (sourceProt) {
      const sourceTemplate =
        sourceProt.rows.find((r) => isRowFilled(r)) ?? sourceProt.rows[0];
      // Find last non-empty anchor number in source protocol to continue numbering seamlessly
      const filledWithNr = sourceProt.rows.filter((r) => r.nr.trim() !== '');
      const lastSourceNr =
        filledWithNr.length > 0 ? filledWithNr[filledWithNr.length - 1].nr : '';

      for (let i = 0; i < 16; i += 1) {
        const shouldApply =
          options.rowCopyMode === 'first-to-all' ||
          options.rowCopyMode === 'row-by-row' ||
          (options.rowCopyMode === 'first-only' && i === 0);

        if (!shouldApply) continue;

        const src =
          options.rowCopyMode === 'row-by-row'
            ? sourceProt.rows[i]
            : sourceTemplate;

        const hasSourceData =
          options.rowCopyMode === 'row-by-row' ? isRowFilled(src) : true;

        if (!hasSourceData) continue;

        rows[i] = {
          pos: i + 1,
          datum: options.copyDatum ? src.datum : '',
          nr: options.continueNr
            ? lastSourceNr
              ? incrementAnchorNumber(lastSourceNr, i + 1)
              : String(i + 1)
            : '',
          neigung: options.copyNeigung ? src.neigung : '',
          totaleLaenge: options.copyLaengen ? src.totaleLaenge : '',
          freieLaenge: options.copyLaengen ? src.freieLaenge : '',
          lockergestein: options.copyBaugrund ? src.lockergestein : '',
          fels: options.copyBaugrund ? src.fels : '',
          bloeckeRanges: options.copyBaugrund
            ? cloneRanges(src.bloeckeRanges)
            : [createEmptyRange()],
          betonRanges: options.copyBaugrund
            ? cloneRanges(src.betonRanges)
            : [createEmptyRange()],
          gruppenstunden: options.copyKuemixAndStd ? src.gruppenstunden : '',
          kuemix: options.copyKuemixAndStd ? src.kuemix : '',
        };
      }
    }

    const newProtocol: Protocol = {
      id: `pr-${Date.now()}`,
      baustelleId: site.id,
      nummer: nextNummer,
      titel: header.bohrzweck,
      header,
      rows,
      createdAt: now,
      updatedAt: now,
    };

    setProtocols((prev) => [...prev, newProtocol]);
    setActiveBaustelleId(site.id);
    setActiveProtocolId(newProtocol.id);
    setNewProtocolTargetSiteId(null);
    setUndoSnapshot(null);
    setFeedbackMessage(
      `Protokoll Nr. ${nextNummer} mit gewählten Angaben aus Protokoll Nr. ${sourceProt?.nummer ?? 1} erstellt.`
    );
  };

  const handleDeleteProtocol = (protocolId: string) => {
    const target = protocols.find((p) => p.id === protocolId);
    if (!target) return;

    const remaining = protocols.filter((p) => p.id !== protocolId);
    setProtocols(remaining);

    if (activeProtocolId === protocolId) {
      const nextForSite = remaining
        .filter((p) => p.baustelleId === target.baustelleId)
        .sort((a, b) => a.nummer - b.nummer)[0];
      setActiveProtocolId(nextForSite?.id ?? null);
      setUndoSnapshot(null);
    }
  };

  const handleChangeProtocolHeader = (key: keyof ProtocolHeader, value: string) => {
    if (!activeProtocol) return;
    const now = new Date().toISOString();
    setProtocols((prev) =>
      prev.map((p) =>
        p.id === activeProtocol.id
          ? {
              ...p,
              updatedAt: now,
              header: {
                ...p.header,
                [key]: value,
              },
            }
          : p
      )
    );
  };

  const handleSyncHeaderToBaustelle = () => {
    if (!activeBaustelle || !activeProtocol) return;
    const now = new Date().toISOString();
    setBaustellen((prev) =>
      prev.map((b) =>
        b.id === activeBaustelle.id
          ? {
              ...b,
              firma: activeProtocol.header.firma,
              bauteil: activeProtocol.header.bauteil,
              baufuehrer: activeProtocol.header.baufuehrer,
              bohrgeraet: activeProtocol.header.bohrgeraet,
              injektionspumpe: activeProtocol.header.injektionspumpe,
              bohrmeister: activeProtocol.header.bohrmeister,
              bohrkroneDurchmesser: activeProtocol.header.bohrkroneDurchmesser,
              tragglied: activeProtocol.header.tragglied,
              bohrzweck: activeProtocol.header.bohrzweck,
              updatedAt: now,
            }
          : b
      )
    );
    setFeedbackMessage('Kopfdaten als Baustellen-Standard gespeichert.');
  };

  const handleChangeAnchorRow = (
    pos: number,
    key: keyof AnchorRow,
    value: string
  ) => {
    if (!activeProtocol) return;
    const now = new Date().toISOString();
    setProtocols((prev) =>
      prev.map((p) =>
        p.id === activeProtocol.id
          ? {
              ...p,
              updatedAt: now,
              rows: p.rows.map((r) => (r.pos === pos ? { ...r, [key]: value } : r)),
            }
          : p
      )
    );
  };

  const handleChangeRanges = (
    pos: number,
    key: 'bloeckeRanges' | 'betonRanges',
    ranges: GroundRange[]
  ) => {
    if (!activeProtocol) return;
    const now = new Date().toISOString();
    setProtocols((prev) =>
      prev.map((p) =>
        p.id === activeProtocol.id
          ? {
              ...p,
              updatedAt: now,
              rows: p.rows.map((r) => (r.pos === pos ? { ...r, [key]: ranges } : r)),
            }
          : p
      )
    );
  };

  const handleCopyToAllExceptDateAndNr = (
    sourcePos: number,
    onlyEmpty: boolean
  ) => {
    if (!activeProtocol) return;
    const source = activeProtocol.rows.find((r) => r.pos === sourcePos);
    if (!source) return;

    setUndoSnapshot({
      protocolId: activeProtocol.id,
      rows: cloneAnchorRows(activeProtocol.rows),
    });

    const now = new Date().toISOString();
    setProtocols((prev) =>
      prev.map((p) => {
        if (p.id !== activeProtocol.id) return p;
        const nextRows = p.rows.map((row) => {
          if (row.pos === sourcePos) return row;
          if (onlyEmpty && isRowFilled(row)) return row;

          return {
            ...row,
            neigung: source.neigung,
            totaleLaenge: source.totaleLaenge,
            freieLaenge: source.freieLaenge,
            lockergestein: source.lockergestein,
            fels: source.fels,
            bloeckeRanges: cloneRanges(source.bloeckeRanges),
            betonRanges: cloneRanges(source.betonRanges),
            gruppenstunden: source.gruppenstunden,
            kuemix: source.kuemix,
          };
        });
        return {
          ...p,
          updatedAt: now,
          rows: nextRows,
        };
      })
    );

    setFeedbackMessage(
      onlyEmpty
        ? `Werte von Pos. ${sourcePos} in leere Zeilen übernommen (Datum & Nr. unverändert).`
        : `Werte von Pos. ${sourcePos} auf alle 16 Anker übernommen (Datum & Nr. unverändert).`
    );
  };

  const handleCopyDateToAll = (sourcePos: number, onlyEmpty: boolean) => {
    if (!activeProtocol) return;
    const sourceRow = activeProtocol.rows.find((r) => r.pos === sourcePos);
    const fallbackDateRow = activeProtocol.rows.find((r) => r.datum.trim() !== '');
    const dateToCopy = sourceRow?.datum.trim() || fallbackDateRow?.datum.trim() || '';
    if (!dateToCopy) return;

    setUndoSnapshot({
      protocolId: activeProtocol.id,
      rows: cloneAnchorRows(activeProtocol.rows),
    });

    const now = new Date().toISOString();
    setProtocols((prev) =>
      prev.map((p) => {
        if (p.id !== activeProtocol.id) return p;
        return {
          ...p,
          updatedAt: now,
          rows: p.rows.map((row) => {
            if (onlyEmpty && row.datum.trim() !== '') return row;
            return { ...row, datum: dateToCopy };
          }),
        };
      })
    );

    setFeedbackMessage(
      onlyEmpty
        ? 'Datum in alle leeren Datumsfelder übernommen.'
        : 'Datum für alle 16 Anker übernommen.'
    );
  };

  const handleFillConsecutiveNumbers = (sourcePos: number) => {
    if (!activeProtocol) return;
    const sourceRow = activeProtocol.rows.find((r) => r.pos === sourcePos);
    const pos1Row = activeProtocol.rows[0];
    // Start from source row if it has a number and is Pos. 1, or Pos. 1 if set, else source row, else "1"
    const startBase =
      (sourceRow?.nr.trim() ? sourceRow.nr.trim() : pos1Row?.nr.trim()) || '1';
    const startIndex = sourceRow?.nr.trim() ? sourcePos - 1 : 0;

    setUndoSnapshot({
      protocolId: activeProtocol.id,
      rows: cloneAnchorRows(activeProtocol.rows),
    });

    const now = new Date().toISOString();
    setProtocols((prev) =>
      prev.map((p) => {
        if (p.id !== activeProtocol.id) return p;
        return {
          ...p,
          updatedAt: now,
          rows: p.rows.map((row, idx) => {
            const offset = idx - startIndex;
            if (offset < 0) return row;
            return {
              ...row,
              nr: incrementAnchorNumber(startBase, offset),
            };
          }),
        };
      })
    );

    setFeedbackMessage('Anker-Nummern fortlaufend ausgefüllt.');
  };

  const handleUndoBulk = () => {
    if (
      !undoSnapshot ||
      !activeProtocol ||
      undoSnapshot.protocolId !== activeProtocol.id
    ) {
      return;
    }
    const now = new Date().toISOString();
    setProtocols((prev) =>
      prev.map((p) =>
        p.id === activeProtocol.id
          ? {
              ...p,
              updatedAt: now,
              rows: undoSnapshot.rows,
            }
          : p
      )
    );
    setUndoSnapshot(null);
    setFeedbackMessage('Letzte Übernahme rückgängig gemacht.');
  };

  const handleClearRow = (pos: number) => {
    if (!activeProtocol) return;
    const now = new Date().toISOString();
    setProtocols((prev) =>
      prev.map((p) =>
        p.id === activeProtocol.id
          ? {
              ...p,
              updatedAt: now,
              rows: p.rows.map((r) => (r.pos === pos ? createEmptyRow(pos) : r)),
            }
          : p
      )
    );
  };

  const handleExportPdf = () => {
    if (!activeBaustelle || !activeProtocol) return;
    downloadProtocolPdf(activeBaustelle, activeProtocol);
    const exportedAt = new Date().toISOString();
    setProtocols((prev) =>
      prev.map((p) =>
        p.id === activeProtocol.id ? { ...p, pdfExportedAt: exportedAt } : p
      )
    );
    setFeedbackMessage(
      `PDF für Protokoll Nr. ${activeProtocol.nummer} heruntergeladen.`
    );
  };

  const handleExportBatchPdf = (selectedIds: string[]) => {
    if (!batchPdfBaustelle || selectedIds.length === 0) return;
    const selected = batchPdfProtocols.filter((p) => selectedIds.includes(p.id));
    if (selected.length === 0) return;

    downloadCombinedProtocolsPdf(batchPdfBaustelle, selected);
    const exportedAt = new Date().toISOString();
    setProtocols((prev) =>
      prev.map((p) =>
        selectedIds.includes(p.id) ? { ...p, pdfExportedAt: exportedAt } : p
      )
    );
    setBatchPdfBaustelleId(null);
    setFeedbackMessage(
      `${selected.length} ${
        selected.length === 1 ? 'Protokoll' : 'Protokolle'
      } zusammen als PDF heruntergeladen.`
    );
  };

  const handleExportLocalBackup = () => {
    downloadLocalBackup(baustellen, protocols);
    setFeedbackMessage('Lokale Datensicherung als JSON-Datei heruntergeladen.');
  };

  const handleImportLocalBackup = async (file: File) => {
    try {
      const text = await file.text();
      const parsed = parseLocalBackup(text);
      if (!parsed) {
        setFeedbackMessage('Ungültige Backup-Datei.');
        return;
      }
      setBaustellen(parsed.baustellen);
      setProtocols(parsed.protocols);
      const firstSite = parsed.baustellen[0] ?? null;
      setActiveBaustelleId(firstSite?.id ?? null);
      if (firstSite) {
        const firstProt = parsed.protocols
          .filter((p) => p.baustelleId === firstSite.id)
          .sort((a, b) => a.nummer - b.nummer)[0];
        setActiveProtocolId(firstProt?.id ?? null);
      } else {
        setActiveProtocolId(null);
      }
      setUndoSnapshot(null);
      setFeedbackMessage('Lokale Daten erfolgreich geladen.');
    } catch {
      setFeedbackMessage('Fehler beim Laden der Datei.');
    }
  };

  return (
    <div className="min-h-screen flex bg-slate-50 text-slate-900">
      <Sidebar
        baustellen={baustellen}
        protocols={protocols}
        activeBaustelleId={activeBaustelleId}
        activeProtocolId={activeProtocolId}
        isOpenMobile={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
        onSelectBaustelle={handleSelectBaustelle}
        onSelectProtocol={handleSelectProtocol}
        onCreateBaustelle={handleOpenNewBaustelle}
        onEditBaustelle={handleOpenEditBaustelle}
        onDeleteBaustelle={handleDeleteBaustelle}
        onCreateProtocol={handleRequestCreateProtocol}
        onDeleteProtocol={handleDeleteProtocol}
        onOpenSiteSummary={(siteId) => setSiteSummaryBaustelleId(siteId)}
        onOpenBatchPdf={(siteId) => setBatchPdfBaustelleId(siteId)}
        onExportLocalBackup={handleExportLocalBackup}
        onImportLocalBackup={handleImportLocalBackup}
      />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        <header className="sticky top-0 z-30 h-16 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setIsMobileSidebarOpen(true)}
              className="lg:hidden p-2 -ml-2 text-slate-600 hover:text-slate-900 rounded-md hover:bg-slate-100"
              aria-label="Baustellen-Menü öffnen"
            >
              <Menu className="w-5 h-5" />
            </button>

            {activeBaustelle && activeProtocol ? (
              <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm min-w-0">
                <span className="text-slate-500 hidden sm:inline whitespace-nowrap">
                  Baustellen
                </span>
                <span className="text-slate-300 hidden sm:inline" aria-hidden="true">
                  /
                </span>
                <span className="font-semibold text-slate-900 truncate max-w-[180px] sm:max-w-[320px]">
                  {activeBaustelle.projekt}
                </span>
                <span className="text-slate-300" aria-hidden="true">
                  /
                </span>
                <span className="text-slate-700 font-medium whitespace-nowrap">
                  Protokoll Nr. {activeProtocol.nummer}
                </span>
                <span className="hidden md:inline text-slate-300" aria-hidden="true">
                  ·
                </span>
                <span className="hidden md:inline text-xs font-mono tabular-nums text-slate-500 whitespace-nowrap">
                  {totals.anzahl} / 16 erfasst
                </span>
                {activeProtocol.pdfExportedAt && (
                  <>
                    <span className="hidden xl:inline text-slate-300" aria-hidden="true">
                      ·
                    </span>
                    <span className="hidden xl:inline-flex items-center gap-1 text-xs font-medium text-emerald-700 whitespace-nowrap">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      PDF geladen
                    </span>
                  </>
                )}
              </nav>
            ) : (
              <span className="text-sm font-semibold text-slate-900">
                Baustellenübersicht
              </span>
            )}
          </div>

          {activeBaustelle && activeProtocol && (
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setIsPdfPreviewOpen(true)}
                className="inline-flex items-center gap-1.5 h-9 px-3 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0"
              >
                <Eye className="w-3.5 h-3.5" />
                PDF-Vorschau
              </button>
              <button
                type="button"
                onClick={() => setBatchPdfBaustelleId(activeBaustelle.id)}
                className="hidden sm:inline-flex items-center gap-1.5 h-9 px-3 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0"
              >
                <Download className="w-3.5 h-3.5" />
                Sammel-PDF
              </button>
              <button
                type="button"
                onClick={handleExportPdf}
                className="inline-flex items-center gap-1.5 h-9 px-4 text-xs font-medium text-white bg-blue-800 rounded-md hover:bg-blue-900 transition-colors whitespace-nowrap shrink-0"
              >
                <Download className="w-3.5 h-3.5" />
                PDF exportieren
              </button>
            </div>
          )}
        </header>

        {/* Main Workspace */}
        <main className="flex-1 p-4 sm:p-6 max-w-[1440px] w-full mx-auto space-y-5">
          {feedbackMessage && (
            <div
              role="status"
              className="flex items-center gap-2 px-4 py-2.5 text-xs font-medium text-slate-800 bg-white border border-slate-300 rounded-md shadow-xs"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
              <span>{feedbackMessage}</span>
            </div>
          )}

          {!activeBaustelle ? (
            <div className="bg-white border border-slate-200 rounded-lg p-12 text-center max-w-xl mx-auto mt-10">
              <div className="w-11 h-11 mx-auto mb-4 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600">
                <Building2 className="w-5 h-5" />
              </div>
              <h1 className="text-lg font-semibold text-slate-900">
                Keine Baustelle ausgewählt
              </h1>
              <p className="text-sm text-slate-600 mt-1.5 mb-6">
                Erfassen Sie zuerst eine Baustelle mit Projektname, KTR-Nummer, Bohrgerät,
                Injektionspumpe, Bohrmeister, Bohrkrone Ø, Tragglied und Bohrzweck.
              </p>
              <button
                type="button"
                onClick={handleOpenNewBaustelle}
                className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-blue-800 rounded-md hover:bg-blue-900 transition-colors whitespace-nowrap"
              >
                <Plus className="w-4 h-4" />
                Erste Baustelle erfassen
              </button>
            </div>
          ) : !activeProtocol ? (
            <div className="bg-white border border-slate-200 rounded-lg p-10 text-center max-w-xl mx-auto mt-8">
              <h1 className="text-lg font-semibold text-slate-900">
                {activeBaustelle.projekt}
              </h1>
              <p className="text-sm text-slate-600 mt-1.5 mb-5">
                Für diese Baustelle existiert noch kein Protokoll.
              </p>
              <button
                type="button"
                onClick={() => handleRequestCreateProtocol(activeBaustelle.id)}
                className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-blue-800 rounded-md hover:bg-blue-900 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Protokoll Nr. 1 anlegen
              </button>
            </div>
          ) : (
            <>
              <ProtocolHeaderGrid
                baustelle={activeBaustelle}
                header={activeProtocol.header}
                onChangeHeader={handleChangeProtocolHeader}
                onEditBaustelle={() => handleOpenEditBaustelle(activeBaustelle)}
                onSyncToBaustelle={handleSyncHeaderToBaustelle}
              />

              <AnchorTable
                rows={activeProtocol.rows}
                onChangeRow={handleChangeAnchorRow}
                onChangeRanges={handleChangeRanges}
                onCopyToAllExceptDateAndNr={handleCopyToAllExceptDateAndNr}
                onCopyDateToAll={handleCopyDateToAll}
                onFillConsecutiveNumbers={handleFillConsecutiveNumbers}
                onClearRow={handleClearRow}
                canUndoBulk={Boolean(
                  undoSnapshot && undoSnapshot.protocolId === activeProtocol.id
                )}
                onUndoBulk={handleUndoBulk}
              />

              <ProtocolSummary
                totals={totals}
                onOpenSiteSummary={() => setSiteSummaryBaustelleId(activeBaustelle.id)}
              />
            </>
          )}
        </main>
      </div>

      <BaustelleModal
        isOpen={isBaustelleModalOpen}
        editingBaustelle={editingBaustelle}
        onClose={() => {
          setIsBaustelleModalOpen(false);
          setEditingBaustelle(null);
        }}
        onSave={handleSaveBaustelle}
      />

      {activeBaustelle && activeProtocol && (
        <PdfPreviewModal
          isOpen={isPdfPreviewOpen}
          baustelle={activeBaustelle}
          protocol={activeProtocol}
          onClose={() => setIsPdfPreviewOpen(false)}
          onDownload={handleExportPdf}
        />
      )}

      {summaryBaustelle && (
        <BaustelleSummaryModal
          isOpen={Boolean(summaryBaustelle)}
          baustelle={summaryBaustelle}
          protocols={summaryProtocols}
          onClose={() => setSiteSummaryBaustelleId(null)}
          onSelectProtocol={(protId) => {
            setActiveBaustelleId(summaryBaustelle.id);
            setActiveProtocolId(protId);
          }}
        />
      )}

      {newProtocolTargetSite && newProtocolExistingList.length > 0 && (
        <NewProtocolModal
          isOpen={Boolean(newProtocolTargetSite)}
          baustelle={newProtocolTargetSite}
          existingProtocols={newProtocolExistingList}
          nextNummer={
            Math.max(...newProtocolExistingList.map((p) => p.nummer)) + 1
          }
          onClose={() => setNewProtocolTargetSiteId(null)}
          onConfirm={handleConfirmNewProtocol}
        />
      )}

      {batchPdfBaustelle && (
        <BatchPdfModal
          isOpen={Boolean(batchPdfBaustelle)}
          baustelle={batchPdfBaustelle}
          protocols={batchPdfProtocols}
          onClose={() => setBatchPdfBaustelleId(null)}
          onExportSelected={handleExportBatchPdf}
        />
      )}
    </div>
  );
}
