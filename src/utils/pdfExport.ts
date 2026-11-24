import { jsPDF } from 'jspdf';
import { Baustelle, Protocol } from '../types/protocol';
import {
  buildGroundSegments,
  computeProtocolTotals,
  formatDateDE,
  formatNumber,
  formatRangesSummary,
  getRangesTotal,
  isRowFilled,
  parseDecimal,
} from './calculations';

function sanitizeFilename(input: string): string {
  return input
    .trim()
    .replace(/[^a-zA-Z0-9äöüÄÖÜß_-]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 60);
}

function formatCellNum(val: string): string {
  if (!val.trim()) return '';
  return formatNumber(parseDecimal(val));
}

function renderProtocolPage(
  doc: jsPDF,
  baustelle: Baustelle,
  protocol: Protocol
): void {
  const pageW = 297;
  const marginX = 11;
  const contentW = pageW - marginX * 2; // 275mm
  const totals = computeProtocolTotals(protocol.rows);

  const slate900: [number, number, number] = [15, 23, 42];
  const slate700: [number, number, number] = [51, 65, 85];
  const slate500: [number, number, number] = [100, 116, 139];
  const borderLight: [number, number, number] = [180, 190, 204];
  const borderDark: [number, number, number] = [71, 85, 105];
  const headerFill: [number, number, number] = [241, 245, 249];
  const zebraFill: [number, number, number] = [248, 250, 252];

  // --- Title Row ---
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(...slate900);
  doc.text('Protokoll Selbstbohrend', marginX, 14.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(...slate700);
  const firmaText =
    protocol.header.firma || baustelle.firma || 'Ghelma AG Spezialtiefbau';
  doc.text(firmaText, marginX + 68, 14.5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...slate900);
  doc.text(`Protokoll Nr. ${protocol.nummer}`, pageW - marginX, 14.5, {
    align: 'right',
  });

  // --- 3x3 Header Metadata Box ---
  const metaY = 18;
  const metaRowH = 6.2;
  const metaH = metaRowH * 3;
  const colWidthsMeta = [105, 90, 80]; // 275mm

  doc.setDrawColor(...borderDark);
  doc.setLineWidth(0.35);
  doc.rect(marginX, metaY, contentW, metaH);

  doc.setDrawColor(...borderLight);
  doc.setLineWidth(0.2);
  doc.line(marginX, metaY + metaRowH, marginX + contentW, metaY + metaRowH);
  doc.line(marginX, metaY + metaRowH * 2, marginX + contentW, metaY + metaRowH * 2);
  doc.line(
    marginX + colWidthsMeta[0],
    metaY,
    marginX + colWidthsMeta[0],
    metaY + metaH
  );
  doc.line(
    marginX + colWidthsMeta[0] + colWidthsMeta[1],
    metaY,
    marginX + colWidthsMeta[0] + colWidthsMeta[1],
    metaY + metaH
  );

  const metaCells: Array<[number, number, string, string]> = [
    [0, 0, 'Projekt:', baustelle.projekt],
    [1, 0, 'KTR:', baustelle.ktr],
    [2, 0, 'Bauteil:', protocol.header.bauteil || protocol.header.bohrzweck],

    [0, 1, 'Bohrgerät:', protocol.header.bohrgeraet],
    [1, 1, 'Injektionspumpe:', protocol.header.injektionspumpe],
    [2, 1, 'Bohrmeister:', protocol.header.bohrmeister],

    [0, 2, 'Bohrkrone Ø:', protocol.header.bohrkroneDurchmesser],
    [1, 2, 'Tragglied:', protocol.header.tragglied],
    [2, 2, 'Bohrzweck:', protocol.header.bohrzweck],
  ];

  const colOffsetsMeta = [
    marginX,
    marginX + colWidthsMeta[0],
    marginX + colWidthsMeta[0] + colWidthsMeta[1],
  ];

  for (const [r, c, label, val] of metaCells) {
    const x = colOffsetsMeta[c] + 2;
    const y = metaY + r * metaRowH + 4.3;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(...slate500);
    doc.text(label, x, y);

    const labelOffset = c === 0 ? 18 : c === 1 ? 30 : 24;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(...slate900);
    const maxValW = colWidthsMeta[c] - labelOffset - 3;
    const clipped = doc.splitTextToSize(val || '—', maxValW)[0] || '—';
    doc.text(clipped, x + labelOffset, y);
  }

  // --- Main 16-Row Table ---
  const tableY = 39.5;
  const headerH = 11;
  const rowH = 6.2;

  const cols = {
    pos: 7,
    datum: 19,
    nr: 11,
    neigung: 12,
    total: 12,
    frei: 12,
    lock: 11,
    fels: 10,
    bloecke: 19,
    beton: 19,
    grid: 112, // 40 x 2.8mm
    std: 13,
    kuemix: 18,
  };

  const xPos: Record<string, number> = {};
  let cursorX = marginX;
  for (const [key, w] of Object.entries(cols)) {
    xPos[key] = cursorX;
    cursorX += w;
  }

  doc.setFillColor(...headerFill);
  doc.rect(marginX, tableY, contentW, headerH, 'F');

  doc.setDrawColor(...borderDark);
  doc.setLineWidth(0.35);
  doc.rect(marginX, tableY, contentW, headerH + rowH * 16);

  doc.setDrawColor(...borderLight);
  doc.setLineWidth(0.2);
  doc.line(xPos.grid, tableY + 5.5, xPos.grid + cols.grid, tableY + 5.5);
  doc.line(marginX, tableY + headerH, marginX + contentW, tableY + headerH);

  for (const key of Object.keys(cols)) {
    const x = xPos[key];
    if (x > marginX) {
      doc.setDrawColor(...borderLight);
      doc.setLineWidth(0.2);
      doc.line(x, tableY, x, tableY + headerH + rowH * 16);
    }
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.1);
  doc.setTextColor(...slate900);

  const centerText = (text: string, x: number, w: number, y: number) => {
    doc.text(text, x + w / 2, y, { align: 'center' });
  };

  centerText('Pos', xPos.pos, cols.pos, tableY + 6.8);
  centerText('Datum', xPos.datum, cols.datum, tableY + 6.8);
  centerText('Nr.', xPos.nr, cols.nr, tableY + 6.8);
  centerText('Neigung', xPos.neigung, cols.neigung, tableY + 4.8);
  centerText('α', xPos.neigung, cols.neigung, tableY + 8.8);
  centerText('l Tot.', xPos.total, cols.total, tableY + 4.8);
  centerText('(m)', xPos.total, cols.total, tableY + 8.8);
  centerText('lf Frei', xPos.frei, cols.frei, tableY + 4.8);
  centerText('(m)', xPos.frei, cols.frei, tableY + 8.8);

  centerText('Locker', xPos.lock, cols.lock, tableY + 4.8);
  centerText('/// (m)', xPos.lock, cols.lock, tableY + 8.8);
  centerText('Fels', xPos.fels, cols.fels, tableY + 4.8);
  centerText('X (m)', xPos.fels, cols.fels, tableY + 8.8);
  centerText('Blöcke / Findl.', xPos.bloecke, cols.bloecke, tableY + 4.8);
  centerText('0 (von–bis / m)', xPos.bloecke, cols.bloecke, tableY + 8.8);
  centerText('Beton', xPos.beton, cols.beton, tableY + 4.8);
  centerText('= (von–bis / m)', xPos.beton, cols.beton, tableY + 8.8);

  centerText(
    'Grobe Beschreibung des Baugrunds (0.50 m – 20.00 m)',
    xPos.grid,
    cols.grid,
    tableY + 3.9
  );

  const cellW = cols.grid / 40; // 2.8mm
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(5.2);
  doc.setTextColor(...slate500);
  for (let i = 0; i < 40; i += 1) {
    const cx = xPos.grid + i * cellW;
    if (i > 0) {
      doc.setDrawColor(220, 226, 234);
      doc.setLineWidth(0.12);
      doc.line(cx, tableY + 5.5, cx, tableY + headerH + rowH * 16);
    }
    if (i % 2 === 1) {
      const meterLabel = String((i + 1) / 2);
      doc.text(meterLabel, cx + cellW / 2, tableY + 9.4, { align: 'center' });
    }
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.1);
  doc.setTextColor(...slate900);
  centerText('Gr.-Std', xPos.std, cols.std, tableY + 4.8);
  centerText('(h)', xPos.std, cols.std, tableY + 8.8);
  centerText('Kümix', xPos.kuemix, cols.kuemix, tableY + 4.8);
  centerText('(kg)', xPos.kuemix, cols.kuemix, tableY + 8.8);

  // --- 16 Rows ---
  for (let rIdx = 0; rIdx < 16; rIdx += 1) {
    const row = protocol.rows[rIdx];
    const ry = tableY + headerH + rIdx * rowH;

    if (rIdx % 2 === 1) {
      doc.setFillColor(...zebraFill);
      doc.rect(marginX, ry, contentW, rowH, 'F');
    }

    doc.setDrawColor(...borderLight);
    doc.setLineWidth(0.2);
    doc.line(marginX, ry + rowH, marginX + contentW, ry + rowH);

    for (const key of Object.keys(cols)) {
      const x = xPos[key];
      if (x > marginX) {
        doc.setDrawColor(...borderLight);
        doc.setLineWidth(0.2);
        doc.line(x, ry, x, ry + rowH);
      }
    }
    for (let i = 1; i < 40; i += 1) {
      const cx = xPos.grid + i * cellW;
      doc.setDrawColor(228, 233, 240);
      doc.setLineWidth(0.1);
      doc.line(cx, ry, cx, ry + rowH);
    }

    const textY = ry + 4.25;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.4);
    doc.setTextColor(...slate500);
    centerText(String(row.pos), xPos.pos, cols.pos, textY);

    if (isRowFilled(row)) {
      doc.setTextColor(...slate900);
      centerText(formatDateDE(row.datum), xPos.datum, cols.datum, textY);
      doc.setFont('helvetica', 'bold');
      centerText(row.nr, xPos.nr, cols.nr, textY);
      doc.setFont('helvetica', 'normal');

      const neigungStr = row.neigung.trim()
        ? row.neigung.includes('°')
          ? row.neigung.trim()
          : `${row.neigung.trim()}°`
        : '';
      centerText(neigungStr, xPos.neigung, cols.neigung, textY);

      doc.text(formatCellNum(row.totaleLaenge), xPos.total + cols.total - 1.5, textY, {
        align: 'right',
      });
      doc.text(formatCellNum(row.freieLaenge), xPos.frei + cols.frei - 1.5, textY, {
        align: 'right',
      });

      doc.text(formatCellNum(row.lockergestein), xPos.lock + cols.lock - 1.3, textY, {
        align: 'right',
      });
      doc.text(formatCellNum(row.fels), xPos.fels + cols.fels - 1.3, textY, {
        align: 'right',
      });

      const bloeckeTotal = getRangesTotal(row.bloeckeRanges);
      const bloeckeText = formatRangesSummary(row.bloeckeRanges);
      if (bloeckeTotal > 0 && bloeckeText) {
        doc.setFontSize(6.6);
        doc.setTextColor(...slate900);
        doc.text(
          `${formatNumber(bloeckeTotal)}m`,
          xPos.bloecke + cols.bloecke - 1.2,
          ry + 2.8,
          { align: 'right' }
        );
        doc.setFontSize(5.4);
        doc.setTextColor(...slate500);
        const clippedB =
          doc.splitTextToSize(bloeckeText, cols.bloecke - 2.4)[0] || bloeckeText;
        doc.text(clippedB, xPos.bloecke + cols.bloecke - 1.2, ry + 5.2, {
          align: 'right',
        });
      } else {
        doc.setFontSize(7.4);
        doc.setTextColor(...slate900);
        doc.text('0', xPos.bloecke + cols.bloecke - 1.3, textY, {
          align: 'right',
        });
      }

      const betonTotal = getRangesTotal(row.betonRanges);
      const betonText = formatRangesSummary(row.betonRanges);
      if (betonTotal > 0 && betonText) {
        doc.setFontSize(6.6);
        doc.setTextColor(...slate900);
        doc.text(
          `${formatNumber(betonTotal)}m`,
          xPos.beton + cols.beton - 1.2,
          ry + 2.8,
          { align: 'right' }
        );
        doc.setFontSize(5.4);
        doc.setTextColor(...slate500);
        const clippedBe =
          doc.splitTextToSize(betonText, cols.beton - 2.4)[0] || betonText;
        doc.text(clippedBe, xPos.beton + cols.beton - 1.2, ry + 5.2, {
          align: 'right',
        });
      } else {
        doc.setFontSize(7.4);
        doc.setTextColor(...slate900);
        doc.text('0', xPos.beton + cols.beton - 1.3, textY, {
          align: 'right',
        });
      }

      const segs = buildGroundSegments(row);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(5.4);
      for (let i = 0; i < segs.length; i += 1) {
        const sym = segs[i];
        if (!sym) continue;
        const cx = xPos.grid + i * cellW;
        if (sym === '///') {
          doc.setFillColor(241, 245, 249);
          doc.rect(cx + 0.12, ry + 0.3, cellW - 0.24, rowH - 0.6, 'F');
          doc.setTextColor(71, 85, 105);
        } else if (sym === 'X') {
          doc.setFillColor(226, 232, 240);
          doc.rect(cx + 0.12, ry + 0.3, cellW - 0.24, rowH - 0.6, 'F');
          doc.setTextColor(15, 23, 42);
        } else if (sym === '0') {
          doc.setFillColor(254, 243, 199);
          doc.rect(cx + 0.12, ry + 0.3, cellW - 0.24, rowH - 0.6, 'F');
          doc.setTextColor(146, 64, 14);
        } else {
          doc.setFillColor(219, 234, 254);
          doc.rect(cx + 0.12, ry + 0.3, cellW - 0.24, rowH - 0.6, 'F');
          doc.setTextColor(30, 64, 175);
        }
        doc.text(sym, cx + cellW / 2, ry + 4.1, { align: 'center' });
      }

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.4);
      doc.setTextColor(...slate900);
      doc.text(formatCellNum(row.gruppenstunden), xPos.std + cols.std - 1.5, textY, {
        align: 'right',
      });
      doc.setFont('helvetica', 'bold');
      doc.text(formatCellNum(row.kuemix), xPos.kuemix + cols.kuemix - 1.5, textY, {
        align: 'right',
      });
    }
  }

  doc.setDrawColor(...borderDark);
  doc.setLineWidth(0.35);
  doc.rect(marginX, tableY, contentW, headerH + rowH * 16);

  // --- Signatures ---
  const sigY = tableY + headerH + rowH * 16 + 10.5;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(...slate900);
  doc.text('Bauführer:', marginX, sigY);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...slate700);
  if (protocol.header.baufuehrer) {
    doc.text(protocol.header.baufuehrer, marginX + 20, sigY);
  }
  doc.setDrawColor(...borderDark);
  doc.setLineWidth(0.25);
  doc.line(marginX + 19, sigY + 1.2, marginX + 85, sigY + 1.2);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...slate900);
  doc.text('Bohrmeister:', marginX + 135, sigY);

  const signatureImg =
    baustelle.bohrmeisterUnterschrift || protocol.header.bohrmeisterUnterschrift;
  if (signatureImg) {
    try {
      doc.addImage(signatureImg, 'PNG', marginX + 158, sigY - 9.2, 42, 10.2);
    } catch {
      // Fallback to name text if image fails
      if (protocol.header.bohrmeister) {
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...slate700);
        doc.text(protocol.header.bohrmeister, marginX + 158, sigY);
      }
    }
  } else if (protocol.header.bohrmeister) {
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...slate700);
    doc.text(protocol.header.bohrmeister, marginX + 158, sigY);
  }
  doc.line(marginX + 157, sigY + 1.2, marginX + 225, sigY + 1.2);

  // --- Summary Totals Box (Protocol Only) ---
  const sumY = sigY + 6.5;
  const sumRowH = 6.8;
  const sumH = sumRowH * 3;
  const sumCols = [65, 70, 75, 65];

  doc.setFillColor(...headerFill);
  doc.rect(marginX, sumY, contentW, sumH, 'F');
  doc.setDrawColor(...borderDark);
  doc.setLineWidth(0.35);
  doc.rect(marginX, sumY, contentW, sumH);

  doc.setDrawColor(...borderLight);
  doc.setLineWidth(0.2);
  doc.line(marginX, sumY + sumRowH, marginX + contentW, sumY + sumRowH);
  doc.line(marginX, sumY + sumRowH * 2, marginX + contentW, sumY + sumRowH * 2);

  let scx = marginX;
  for (let i = 0; i < sumCols.length - 1; i += 1) {
    scx += sumCols[i];
    doc.line(scx, sumY, scx, sumY + sumH);
  }

  const sumItems: Array<[number, number, string, string, string]> = [
    [0, 0, 'Anzahl', formatNumber(totals.anzahl, 0), 'St'],
    [1, 0, 'Bohrmeter', formatNumber(totals.bohrmeter), 'm'],
    [2, 0, 'Freie Ankerlänge', formatNumber(totals.freieAnkerlaenge), 'm'],

    [0, 1, '///  Lockergestein', formatNumber(totals.lockergestein), 'm'],
    [1, 1, 'X   Fels', formatNumber(totals.fels), 'm'],

    [0, 2, '0   Blöcke / Findlinge', formatNumber(totals.bloecke), 'm'],
    [1, 2, '=   Beton', formatNumber(totals.beton), 'm'],

    [0, 3, 'Gruppenstunden', formatNumber(totals.gruppenstunden), 'h'],
    [1, 3, 'Injektionsgut (Kümix)', formatNumber(totals.injektionsgut), 'kg'],
  ];

  const sumOffsets = [
    marginX,
    marginX + sumCols[0],
    marginX + sumCols[0] + sumCols[1],
    marginX + sumCols[0] + sumCols[1] + sumCols[2],
  ];

  for (const [r, c, label, value, unit] of sumItems) {
    if (!label && !value) continue;
    const x = sumOffsets[c];
    const w = sumCols[c];
    const y = sumY + r * sumRowH + 4.7;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(...slate700);
    doc.text(label, x + 2.5, y);

    if (value) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(...slate900);
      const displayVal = unit ? `${value} ${unit}` : value;
      doc.text(displayVal, x + w - 2.5, y, { align: 'right' });
    }
  }

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(...slate500);
  const nowStr = new Date().toLocaleDateString('de-CH');
  doc.text(
    `Exportiert am ${nowStr} · Projekt ${baustelle.projekt} (KTR ${baustelle.ktr})`,
    marginX,
    sumY + sumH + 5
  );
}

export function buildProtocolPdf(baustelle: Baustelle, protocol: Protocol): jsPDF {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });
  renderProtocolPage(doc, baustelle, protocol);
  return doc;
}

export function downloadProtocolPdf(baustelle: Baustelle, protocol: Protocol): void {
  const doc = buildProtocolPdf(baustelle, protocol);
  const ktr = sanitizeFilename(baustelle.ktr || 'KTR');
  const projekt = sanitizeFilename(baustelle.projekt || 'Baustelle');
  const filename = `Ankerprotokoll_${ktr}_${projekt}_P${protocol.nummer}.pdf`;
  doc.save(filename);
}

export function downloadCombinedProtocolsPdf(
  baustelle: Baustelle,
  selectedProtocols: Protocol[]
): void {
  const sorted = [...selectedProtocols].sort((a, b) => a.nummer - b.nummer);
  if (sorted.length === 0) return;

  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  sorted.forEach((prot, idx) => {
    if (idx > 0) {
      doc.addPage('a4', 'landscape');
    }
    renderProtocolPage(doc, baustelle, prot);
  });

  const ktr = sanitizeFilename(baustelle.ktr || 'KTR');
  const projekt = sanitizeFilename(baustelle.projekt || 'Baustelle');
  const nums = sorted.map((p) => `P${p.nummer}`).join('-');
  const filename = `Ankerprotokoll_${ktr}_${projekt}_${nums}.pdf`;
  doc.save(filename);
}
