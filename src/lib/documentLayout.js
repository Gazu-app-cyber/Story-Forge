const PAGE_SIZES = {
  A4: { label: "A4", width: 8.27, height: 11.69 },
  Letter: { label: "Carta", width: 8.5, height: 11 },
  A5: { label: "A5", width: 5.83, height: 8.27 }
};

export const DEFAULT_DOCUMENT_LAYOUT = {
  margin: "normal",
  orientation: "portrait",
  pageSize: "A4",
  columns: 1
};

export const marginOptions = [
  { value: "narrow", label: "Estreitas" },
  { value: "normal", label: "Normais" },
  { value: "wide", label: "Largas" }
];

export const orientationOptions = [
  { value: "portrait", label: "Retrato" },
  { value: "landscape", label: "Paisagem" }
];

export const pageSizeOptions = Object.entries(PAGE_SIZES).map(([value, page]) => ({
  value,
  label: page.label
}));

export const columnOptions = [
  { value: "1", label: "Uma coluna" },
  { value: "2", label: "Duas colunas" },
  { value: "3", label: "Tres colunas" }
];

const marginMap = {
  narrow: "0.6in",
  normal: "0.95in",
  wide: "1.25in"
};

export function normalizeDocumentLayout(layout) {
  return {
    ...DEFAULT_DOCUMENT_LAYOUT,
    ...(layout || {}),
    columns: Number(layout?.columns || DEFAULT_DOCUMENT_LAYOUT.columns)
  };
}

export function getDocumentLayoutStyle(layout, editorFont, editorSize) {
  const normalized = normalizeDocumentLayout(layout);
  const page = PAGE_SIZES[normalized.pageSize] || PAGE_SIZES.A4;
  const isLandscape = normalized.orientation === "landscape";
  const pageWidth = isLandscape ? page.height : page.width;
  const pageHeight = isLandscape ? page.width : page.height;
  const margin = marginMap[normalized.margin] || marginMap.normal;

  return {
    "--editor-font": editorFont,
    "--editor-size": `${editorSize}px`,
    "--page-width": `${pageWidth}in`,
    "--page-min-height": `${pageHeight}in`,
    "--page-margin": margin,
    "--page-columns": String(Math.max(1, normalized.columns || 1))
  };
}

