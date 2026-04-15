import jsPDF from "jspdf";

function stripHtml(html = "") {
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function downloadBlob(blob, fileName) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export function exportManuscriptAsPdf({ title, html }) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const text = stripHtml(html);
  const margin = 56;
  const maxWidth = doc.internal.pageSize.getWidth() - margin * 2;
  const lines = doc.splitTextToSize(text || "Documento vazio.", maxWidth);
  let cursorY = margin;

  doc.setFont("times", "bold");
  doc.setFontSize(18);
  doc.text(title || "Manuscrito", margin, cursorY);
  cursorY += 28;

  doc.setFont("times", "normal");
  doc.setFontSize(12);

  lines.forEach((line) => {
    if (cursorY > doc.internal.pageSize.getHeight() - margin) {
      doc.addPage();
      cursorY = margin;
    }
    doc.text(line, margin, cursorY);
    cursorY += 18;
  });

  doc.save(`${title || "manuscrito"}.pdf`);
}

export function exportManuscriptAsDocx({ title, html }) {
  const safeTitle = title || "Manuscrito";
  const body = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office"
      xmlns:w="urn:schemas-microsoft-com:office:word"
      xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta charset="utf-8" />
        <title>${safeTitle}</title>
      </head>
      <body>
        <h1>${safeTitle}</h1>
        ${html || "<p>Documento vazio.</p>"}
      </body>
    </html>
  `;

  const blob = new Blob([body], {
    type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  });

  downloadBlob(blob, `${safeTitle}.docx`);
}

export function exportManuscriptAsHtml({ title, html }) {
  const safeTitle = title || "Manuscrito";
  const blob = new Blob(
    [
      `<!doctype html><html><head><meta charset="utf-8" /><title>${safeTitle}</title></head><body><h1>${safeTitle}</h1>${html || "<p>Documento vazio.</p>"}</body></html>`
    ],
    { type: "text/html;charset=utf-8" }
  );
  downloadBlob(blob, `${safeTitle}.html`);
}
