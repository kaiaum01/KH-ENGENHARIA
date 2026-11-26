import {
  AlignmentType,
  BorderStyle,
  Document,
  HeadingLevel,
  ImageRun,
  Packer,
  Paragraph,
  ShadingType,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from 'docx';
import {
  formatIsoDateBr,
  type ChecklistStatus,
  type IssueSeverity,
  type SiteVisitReportDraft,
} from './localAdminStore';

export interface VisitReportPhoto {
  id: string;
  fileName: string;
  caption: string;
  previewUrl: string;
  jpegBytes: Uint8Array;
  widthPx: number;
  heightPx: number;
}

const CHECKLIST_STATUS_LABELS: Record<ChecklistStatus, string> = {
  conforme: 'Conforme',
  pendente: 'Pendente / Atenção',
  nao_aplicavel: 'Não aplicável',
};

const SEVERITY_LABELS: Record<IssueSeverity, string> = {
  baixa: 'Baixa',
  media: 'Média',
  alta: 'Alta / Prioritária',
};

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error(`Falha ao ler imagem ${file.name}`));
    reader.readAsDataURL(file);
  });
}

function loadHtmlImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Não foi possível decodificar a imagem selecionada.'));
    img.src = src;
  });
}

export async function preparePhotoForDocx(file: File): Promise<VisitReportPhoto> {
  const dataUrl = await readFileAsDataUrl(file);
  const img = await loadHtmlImage(dataUrl);

  const maxWidth = 960;
  const maxHeight = 720;
  const ratio = Math.min(1, maxWidth / img.naturalWidth, maxHeight / img.naturalHeight);
  const targetW = Math.max(1, Math.round(img.naturalWidth * ratio));
  const targetH = Math.max(1, Math.round(img.naturalHeight * ratio));

  const canvas = document.createElement('canvas');
  canvas.width = targetW;
  canvas.height = targetH;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Contexto gráfico indisponível no navegador.');
  }
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, targetW, targetH);
  ctx.drawImage(img, 0, 0, targetW, targetH);

  const blob: Blob = await new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) => {
        if (b) resolve(b);
        else reject(new Error('Falha ao converter imagem para JPEG.'));
      },
      'image/jpeg',
      0.84
    );
  });

  const buffer = await blob.arrayBuffer();
  const jpegBytes = new Uint8Array(buffer);
  const previewUrl = URL.createObjectURL(blob);

  return {
    id: `photo-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
    fileName: file.name,
    caption: file.name.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' '),
    previewUrl,
    jpegBytes,
    widthPx: targetW,
    heightPx: targetH,
  };
}

function cellBorder() {
  return {
    top: { style: BorderStyle.SINGLE, size: 4, color: 'C7CFC6' },
    bottom: { style: BorderStyle.SINGLE, size: 4, color: 'C7CFC6' },
    left: { style: BorderStyle.SINGLE, size: 4, color: 'C7CFC6' },
    right: { style: BorderStyle.SINGLE, size: 4, color: 'C7CFC6' },
  };
}

function makeInfoRow(label: string, value: string): TableRow {
  return new TableRow({
    children: [
      new TableCell({
        width: { size: 32, type: WidthType.PERCENTAGE },
        shading: { type: ShadingType.CLEAR, fill: 'EFF3EE' },
        borders: cellBorder(),
        margins: { top: 80, bottom: 80, left: 120, right: 120 },
        children: [
          new Paragraph({
            children: [
              new TextRun({
                text: label,
                bold: true,
                size: 20,
                font: 'Calibri',
                color: '1F2922',
              }),
            ],
          }),
        ],
      }),
      new TableCell({
        width: { size: 68, type: WidthType.PERCENTAGE },
        borders: cellBorder(),
        margins: { top: 80, bottom: 80, left: 120, right: 120 },
        children: [
          new Paragraph({
            children: [
              new TextRun({
                text: value || 'Não informado',
                size: 20,
                font: 'Calibri',
                color: '1A1A1A',
              }),
            ],
          }),
        ],
      }),
    ],
  });
}

function sectionTitle(text: string): Paragraph {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 280, after: 120 },
    border: {
      bottom: { style: BorderStyle.SINGLE, size: 6, color: '3B4A3E' },
    },
    children: [
      new TextRun({
        text: text.toUpperCase(),
        bold: true,
        size: 22,
        font: 'Calibri',
        color: '1E2A21',
      }),
    ],
  });
}

function sanitizeFileSlug(text: string): string {
  return (
    text
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .toLowerCase()
      .slice(0, 48) || 'visita-obra'
  );
}

export async function downloadSiteVisitReportDocx(
  report: SiteVisitReportDraft,
  photos: VisitReportPhoto[]
): Promise<void> {
  const children: Array<Paragraph | Table> = [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 60 },
      children: [
        new TextRun({
          text: 'KH ENGENHARIA',
          bold: true,
          size: 28,
          font: 'Calibri',
          color: '1C271F',
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 40 },
      children: [
        new TextRun({
          text: 'RELATÓRIO TÉCNICO E FOTOGRÁFICO DE VISITA DE OBRA',
          bold: true,
          size: 24,
          font: 'Calibri',
          color: '2E3B31',
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 220 },
      children: [
        new TextRun({
          text: `Eng. Civil Kaio Henrique da Silva · CREA-PR PR-232385/D · Relatório nº ${report.reportNumber || 'RVO'}`,
          size: 19,
          font: 'Calibri',
          color: '556157',
        }),
      ],
    }),

    sectionTitle('1. Identificação da Obra e da Vistoria'),
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        makeInfoRow('Relatório / Código', `${report.reportNumber || '—'}${report.projectCode ? ` · Projeto ${report.projectCode}` : ''}`),
        makeInfoRow('Empreendimento / Obra', report.projectTitle || 'Não informado'),
        makeInfoRow('Cliente / Contratante', report.clientName || 'Não informado'),
        makeInfoRow('Endereço / Cidade', `${report.propertyAddress || 'Não informado'} — ${report.city || 'Umuarama - PR'}`),
        makeInfoRow('Data da visita', formatIsoDateBr(report.visitDate)),
        makeInfoRow('Etapa atual da obra', report.stage || 'Não informada'),
        makeInfoRow('Avanço físico estimado', `${Math.max(0, Math.min(100, report.progressPercent || 0))}%`),
        makeInfoRow('Condições climáticas', report.weather || 'Não informadas'),
        makeInfoRow('Equipe em campo', report.teamOnSite || 'Não informada'),
      ],
    }),

    sectionTitle('2. Resumo Técnico da Vistoria'),
    new Paragraph({
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 140, line: 300 },
      children: [
        new TextRun({
          text:
            report.summary.trim() ||
            'Visita técnica realizada para verificação do andamento físico, conferência de conformidade com os projetos e registro fotográfico da etapa.',
          size: 21,
          font: 'Calibri',
        }),
      ],
    }),
  ];

  // Section 3: Checklist
  if (report.checklist.length > 0) {
    children.push(sectionTitle('3. Verificação Técnica (Checklist de Campo)'));
    const checklistRows: TableRow[] = [
      new TableRow({
        tableHeader: true,
        children: ['Item verificado', 'Situação', 'Observações'].map((headerText, idx) =>
          new TableCell({
            width: {
              size: idx === 0 ? 48 : idx === 1 ? 20 : 32,
              type: WidthType.PERCENTAGE,
            },
            shading: { type: ShadingType.CLEAR, fill: '243128' },
            borders: cellBorder(),
            margins: { top: 80, bottom: 80, left: 100, right: 100 },
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: headerText,
                    bold: true,
                    size: 19,
                    font: 'Calibri',
                    color: 'FFFFFF',
                  }),
                ],
              }),
            ],
          })
        ),
      }),
      ...report.checklist.map(
        (chk) =>
          new TableRow({
            children: [
              new TableCell({
                borders: cellBorder(),
                margins: { top: 70, bottom: 70, left: 100, right: 100 },
                children: [
                  new Paragraph({
                    children: [new TextRun({ text: chk.item || '—', size: 19, font: 'Calibri' })],
                  }),
                ],
              }),
              new TableCell({
                borders: cellBorder(),
                margins: { top: 70, bottom: 70, left: 100, right: 100 },
                children: [
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: CHECKLIST_STATUS_LABELS[chk.status],
                        bold: true,
                        size: 19,
                        font: 'Calibri',
                        color:
                          chk.status === 'pendente'
                            ? '9A3412'
                            : chk.status === 'conforme'
                              ? '166534'
                              : '525252',
                      }),
                    ],
                  }),
                ],
              }),
              new TableCell({
                borders: cellBorder(),
                margins: { top: 70, bottom: 70, left: 100, right: 100 },
                children: [
                  new Paragraph({
                    children: [new TextRun({ text: chk.note || '—', size: 19, font: 'Calibri' })],
                  }),
                ],
              }),
            ],
          })
      ),
    ];

    children.push(
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: checklistRows,
      })
    );
  }

  // Section 4: Non-conformities
  children.push(sectionTitle('4. Pendências e Não Conformidades'));
  if (report.nonConformities.length === 0) {
    children.push(
      new Paragraph({
        spacing: { after: 120 },
        children: [
          new TextRun({
            text: 'Nenhuma não conformidade crítica registrada nesta vistoria.',
            italics: true,
            size: 20,
            font: 'Calibri',
            color: '4A554C',
          }),
        ],
      })
    );
  } else {
    const ncRows: TableRow[] = [
      new TableRow({
        tableHeader: true,
        children: ['Local', 'Descrição da pendência', 'Gravidade', 'Ação corretiva'].map(
          (headerText, idx) =>
            new TableCell({
              width: {
                size: idx === 0 ? 18 : idx === 1 ? 34 : idx === 2 ? 16 : 32,
                type: WidthType.PERCENTAGE,
              },
              shading: { type: ShadingType.CLEAR, fill: '243128' },
              borders: cellBorder(),
              margins: { top: 80, bottom: 80, left: 90, right: 90 },
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: headerText,
                      bold: true,
                      size: 19,
                      font: 'Calibri',
                      color: 'FFFFFF',
                    }),
                  ],
                }),
              ],
            })
        ),
      }),
      ...report.nonConformities.map(
        (nc) =>
          new TableRow({
            children: [nc.location || '—', nc.description || '—', SEVERITY_LABELS[nc.severity], nc.action || '—'].map(
              (cellText, idx) =>
                new TableCell({
                  borders: cellBorder(),
                  margins: { top: 70, bottom: 70, left: 90, right: 90 },
                  children: [
                    new Paragraph({
                      children: [
                        new TextRun({
                          text: cellText,
                          bold: idx === 2,
                          size: 19,
                          font: 'Calibri',
                          color: idx === 2 && nc.severity === 'alta' ? '9A3412' : '1A1A1A',
                        }),
                      ],
                    }),
                  ],
                })
            ),
          })
      ),
    ];

    children.push(
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: ncRows,
      })
    );
  }

  // Section 5: Photographic Registry
  if (photos.length > 0) {
    children.push(sectionTitle('5. Registro Fotográfico'));
    photos.forEach((photo, index) => {
      const displayMaxW = 480;
      const displayMaxH = 340;
      const scale = Math.min(1, displayMaxW / photo.widthPx, displayMaxH / photo.heightPx);
      const drawW = Math.max(120, Math.round(photo.widthPx * scale));
      const drawH = Math.max(90, Math.round(photo.heightPx * scale));

      children.push(
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 160, after: 60 },
          children: [
            new ImageRun({
              data: photo.jpegBytes,
              transformation: { width: drawW, height: drawH },
              type: 'jpg',
            }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 180 },
          children: [
            new TextRun({
              text: `Foto ${String(index + 1).padStart(2, '0')} — ${photo.caption.trim() || photo.fileName}`,
              italics: true,
              size: 19,
              font: 'Calibri',
              color: '3D483F',
            }),
          ],
        })
      );
    });
  }

  // Section 6: Recommendations & Next Visit
  const recSectionNum = photos.length > 0 ? '6' : '5';
  children.push(sectionTitle(`${recSectionNum}. Recomendações Técnicas e Próxima Visita`));
  children.push(
    new Paragraph({
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 120, line: 300 },
      children: [
        new TextRun({
          text:
            report.recommendations.trim() ||
            'Manter a execução fiel aos projetos compatibilizados e comunicar previamente a engenharia antes de concretagens e fechamentos de instalações.',
          size: 21,
          font: 'Calibri',
        }),
      ],
    })
  );

  if (report.nextVisitDate) {
    children.push(
      new Paragraph({
        spacing: { after: 160 },
        children: [
          new TextRun({
            text: `Previsão da próxima visita técnica: ${formatIsoDateBr(report.nextVisitDate)}`,
            bold: true,
            size: 20,
            font: 'Calibri',
            color: '1F2922',
          }),
        ],
      })
    );
  }

  // Signature block
  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 360, after: 40 },
      children: [
        new TextRun({
          text: `${report.city || 'Umuarama - PR'}, ${formatIsoDateBr(report.visitDate)}`,
          size: 20,
          font: 'Calibri',
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 340, after: 40 },
      children: [
        new TextRun({
          text: '____________________________________________________',
          size: 20,
          font: 'Calibri',
          color: '4A554C',
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 30 },
      children: [
        new TextRun({
          text: 'Kaio Henrique da Silva',
          bold: true,
          size: 21,
          font: 'Calibri',
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: 'Engenheiro Civil · Especialista em Gerenciamento de Obras · CREA-PR PR-232385/D',
          size: 18,
          font: 'Calibri',
          color: '4A554C',
        }),
      ],
    })
  );

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: { top: 1080, right: 1080, bottom: 1080, left: 1080 },
          },
        },
        children,
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const slug = sanitizeFileSlug(`${report.reportNumber}-${report.clientName || report.projectTitle}`);
  a.download = `${slug}.docx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
