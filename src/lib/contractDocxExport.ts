import {
  AlignmentType,
  BorderStyle,
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  ShadingType,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from 'docx';
import type { ServiceContract } from '../types/contracts';
import { buildContractDocument, type ContractBlock } from './contractBuilder';

function safeFileSlug(input: string): string {
  return (input || 'contrato')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9\-_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase()
    .slice(0, 50);
}

function triggerBlobDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

function buildDocxTable(headers: string[], rows: string[][]): Table {
  const border = { style: BorderStyle.SINGLE, size: 4, color: 'BFBFBF' };
  const borders = { top: border, bottom: border, left: border, right: border };

  const headerRow = new TableRow({
    tableHeader: true,
    children: headers.map(
      (headerText) =>
        new TableCell({
          borders,
          shading: { type: ShadingType.CLEAR, fill: 'EAECE9', color: 'auto' },
          margins: { top: 100, bottom: 100, left: 120, right: 120 },
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text: headerText,
                  bold: true,
                  size: 20,
                  font: 'Calibri',
                  color: '111111',
                }),
              ],
            }),
          ],
        })
    ),
  });

  const bodyRows = rows.map(
    (row) =>
      new TableRow({
        children: row.map(
          (cellText) =>
            new TableCell({
              borders,
              margins: { top: 90, bottom: 90, left: 120, right: 120 },
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: cellText,
                      size: 20,
                      font: 'Calibri',
                      color: '222222',
                    }),
                  ],
                }),
              ],
            })
        ),
      })
  );

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [headerRow, ...bodyRows],
  });
}

function blockToDocxElement(block: ContractBlock): Paragraph | Table {
  if (block.type === 'heading') {
    return new Paragraph({
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 260, after: 120 },
      border: {
        bottom: { style: BorderStyle.SINGLE, size: 4, color: 'D4D9D2', space: 4 },
      },
      children: [
        new TextRun({
          text: block.text,
          bold: true,
          size: 24,
          font: 'Calibri',
          color: '141815',
        }),
      ],
    });
  }

  if (block.type === 'table') {
    return buildDocxTable(block.headers, block.rows);
  }

  if (block.type === 'bullet') {
    const runs: TextRun[] = [];
    if (block.leadBold) {
      runs.push(
        new TextRun({
          text: block.leadBold,
          bold: true,
          size: 22,
          font: 'Calibri',
          color: '111111',
        })
      );
    }
    runs.push(
      new TextRun({
        text: block.text,
        size: 22,
        font: 'Calibri',
        color: '1A1A1A',
      })
    );
    return new Paragraph({
      bullet: { level: 0 },
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 90, line: 276 },
      children: runs,
    });
  }

  const runs: TextRun[] = [];
  if (block.leadBold) {
    runs.push(
      new TextRun({
        text: block.leadBold,
        bold: true,
        size: 22,
        font: 'Calibri',
        color: '111111',
      })
    );
  }
  runs.push(
    new TextRun({
      text: block.text,
      size: 22,
      font: 'Calibri',
      color: '1A1A1A',
    })
  );
  return new Paragraph({
    alignment: AlignmentType.JUSTIFIED,
    spacing: { after: 120, line: 276 },
    children: runs,
  });
}

export async function downloadContractDocx(contract: ServiceContract): Promise<void> {
  const assembled = buildContractDocument(contract);

  const children: Array<Paragraph | Table> = [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 60 },
      children: [
        new TextRun({
          text: 'KH ENGENHARIA · ENG. CIVIL KAIO HENRIQUE DA SILVA',
          bold: true,
          size: 18,
          font: 'Calibri',
          color: '4A5A4B',
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 220 },
      children: [
        new TextRun({
          text: assembled.title,
          bold: true,
          size: 28,
          font: 'Calibri',
          color: '111111',
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 140, line: 276 },
      children: [
        new TextRun({ text: 'REFERÊNCIA: ', bold: true, size: 22, font: 'Calibri', color: '111111' }),
        new TextRun({ text: assembled.reference, size: 22, font: 'Calibri', color: '1A1A1A' }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 140, line: 276 },
      children: [
        new TextRun({ text: 'CONTRATANTE: ', bold: true, size: 22, font: 'Calibri', color: '111111' }),
        new TextRun({ text: assembled.contratante, size: 22, font: 'Calibri', color: '1A1A1A' }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 160, line: 276 },
      children: [
        new TextRun({ text: 'CONTRATADO: ', bold: true, size: 22, font: 'Calibri', color: '111111' }),
        new TextRun({ text: assembled.contratado, size: 22, font: 'Calibri', color: '1A1A1A' }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 180, line: 276 },
      children: [
        new TextRun({ text: assembled.preamble, size: 22, font: 'Calibri', color: '1A1A1A' }),
      ],
    }),
    ...assembled.blocks.map(blockToDocxElement),
    new Paragraph({
      spacing: { before: 280, after: 180, line: 276 },
      alignment: AlignmentType.JUSTIFIED,
      border: {
        top: { style: BorderStyle.SINGLE, size: 4, color: 'CCCCCC', space: 12 },
      },
      children: [
        new TextRun({ text: assembled.closing, size: 22, font: 'Calibri', color: '1A1A1A' }),
      ],
    }),
    new Paragraph({
      spacing: { after: 400 },
      children: [
        new TextRun({ text: assembled.localAndDate, size: 22, font: 'Calibri', color: '1A1A1A' }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 40 },
      children: [
        new TextRun({ text: '____________________________________________________', size: 22, font: 'Calibri' }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 300 },
      children: [
        new TextRun({ text: 'CONTRATANTE — ', bold: true, size: 20, font: 'Calibri' }),
        new TextRun({ text: assembled.contratanteSignatureLabel, size: 20, font: 'Calibri' }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 40 },
      children: [
        new TextRun({ text: '____________________________________________________', size: 22, font: 'Calibri' }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 320 },
      children: [
        new TextRun({ text: 'CONTRATADO — ', bold: true, size: 20, font: 'Calibri' }),
        new TextRun({ text: assembled.contratadoSignatureLabel, size: 20, font: 'Calibri' }),
      ],
    }),
    new Paragraph({
      spacing: { after: 100 },
      children: [
        new TextRun({ text: 'Testemunhas:', bold: true, size: 22, font: 'Calibri' }),
      ],
    }),
    new Paragraph({
      spacing: { after: 100 },
      children: [
        new TextRun({ text: assembled.witness1, size: 20, font: 'Calibri' }),
      ],
    }),
    new Paragraph({
      spacing: { after: 100 },
      children: [
        new TextRun({ text: assembled.witness2, size: 20, font: 'Calibri' }),
      ],
    }),
  ];

  const doc = new Document({
    creator: 'KH Engenharia',
    title: assembled.title,
    description: `${contract.contractCode} - ${contract.clientName}`,
    sections: [
      {
        properties: {
          page: {
            margin: { top: 1134, right: 1134, bottom: 1134, left: 1134 }, // 2 cm margins
          },
        },
        children,
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  const clientSlug = safeFileSlug(
    contract.clientData.personType === 'PJ'
      ? contract.clientData.companyName || contract.clientName
      : contract.clientData.fullName || contract.clientName
  );
  const filename = `${safeFileSlug(contract.contractCode)}-${contract.serviceType}-${clientSlug}.docx`;
  triggerBlobDownload(blob, filename);
}

function escapeHtml(raw: string): string {
  return (raw || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function downloadContractDoc(contract: ServiceContract): void {
  const assembled = buildContractDocument(contract);

  const renderBlockHtml = (block: ContractBlock): string => {
    if (block.type === 'heading') {
      return `<h2>${escapeHtml(block.text)}</h2>`;
    }
    if (block.type === 'table') {
      const ths = block.headers.map((h) => `<th>${escapeHtml(h)}</th>`).join('');
      const trs = block.rows
        .map((r) => `<tr>${r.map((cell) => `<td>${escapeHtml(cell)}</td>`).join('')}</tr>`)
        .join('');
      return `<table><thead><tr>${ths}</tr></thead><tbody>${trs}</tbody></table>`;
    }
    if (block.type === 'bullet') {
      const lead = block.leadBold ? `<strong>${escapeHtml(block.leadBold)}</strong>` : '';
      return `<p class="bullet">&bull;&nbsp;${lead}${escapeHtml(block.text)}</p>`;
    }
    const lead = block.leadBold ? `<strong>${escapeHtml(block.leadBold)}</strong>` : '';
    return `<p>${lead}${escapeHtml(block.text)}</p>`;
  };

  const html = `<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" lang="pt-BR">
<head>
<meta charset="utf-8" />
<title>${escapeHtml(assembled.title)}</title>
<style>
  @page { size: A4; margin: 2cm; }
  body { font-family: Calibri, Arial, sans-serif; font-size: 11pt; line-height: 1.45; color: #111; }
  .brand { text-align: center; font-size: 9pt; font-weight: bold; letter-spacing: 1px; color: #3c4b3d; margin-bottom: 4pt; }
  h1 { text-align: center; font-size: 14pt; margin: 0 0 16pt 0; color: #111; }
  h2 { font-size: 12pt; margin: 16pt 0 8pt 0; border-bottom: 1px solid #ccc; padding-bottom: 3pt; color: #141815; }
  p { text-align: justify; margin: 0 0 8pt 0; }
  p.bullet { margin-left: 18pt; }
  table { width: 100%; border-collapse: collapse; margin: 10pt 0 12pt 0; font-size: 10pt; }
  th, td { border: 1px solid #999; padding: 6pt 7pt; text-align: left; vertical-align: top; }
  th { background-color: #eaece9; font-weight: bold; }
  .closing { border-top: 1px solid #bbb; padding-top: 12pt; margin-top: 18pt; }
  .sig { text-align: center; margin-top: 34pt; }
  .witnesses { margin-top: 26pt; font-size: 10pt; }
</style>
</head>
<body>
  <div class="brand">KH ENGENHARIA &middot; ENG. CIVIL KAIO HENRIQUE DA SILVA</div>
  <h1>${escapeHtml(assembled.title)}</h1>
  <p><strong>REFERÊNCIA:</strong> ${escapeHtml(assembled.reference)}</p>
  <p><strong>CONTRATANTE:</strong> ${escapeHtml(assembled.contratante)}</p>
  <p><strong>CONTRATADO:</strong> ${escapeHtml(assembled.contratado)}</p>
  <p>${escapeHtml(assembled.preamble)}</p>
  ${assembled.blocks.map(renderBlockHtml).join('\n  ')}
  <p class="closing">${escapeHtml(assembled.closing)}</p>
  <p>${escapeHtml(assembled.localAndDate)}</p>
  <div class="sig">
    <div>____________________________________________________</div>
    <div><strong>CONTRATANTE</strong> — ${escapeHtml(assembled.contratanteSignatureLabel)}</div>
  </div>
  <div class="sig">
    <div>____________________________________________________</div>
    <div><strong>CONTRATADO</strong> — ${escapeHtml(assembled.contratadoSignatureLabel)}</div>
  </div>
  <div class="witnesses">
    <p><strong>Testemunhas:</strong></p>
    <p>${escapeHtml(assembled.witness1)}</p>
    <p>${escapeHtml(assembled.witness2)}</p>
  </div>
</body>
</html>`;

  const blob = new Blob(['\ufeff', html], { type: 'application/msword;charset=utf-8' });
  const clientSlug = safeFileSlug(
    contract.clientData.personType === 'PJ'
      ? contract.clientData.companyName || contract.clientName
      : contract.clientData.fullName || contract.clientName
  );
  const filename = `${safeFileSlug(contract.contractCode)}-${contract.serviceType}-${clientSlug}.doc`;
  triggerBlobDownload(blob, filename);
}
