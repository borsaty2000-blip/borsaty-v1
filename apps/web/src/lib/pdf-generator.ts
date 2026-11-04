import html2pdf from "html2pdf.js";

type Html2PdfOptions = {
  margin: number;
  filename: string;
  image: { type: "jpeg"; quality: number };
  html2canvas: {
    scale: number;
    useCORS: boolean;
    letterRendering: boolean;
    backgroundColor: string;
  };
  jsPDF: {
    unit: string;
    format: string;
    orientation: "portrait";
  };
  pagebreak: {
    mode: Array<"css" | "legacy">;
    before: string;
    avoid: string;
  };
};

export async function generateStockPDF(elementId: string, filename: string): Promise<void> {
  const element = document.getElementById(elementId);
  if (!element) {
    throw new Error("PDF content not found");
  }

  const options: Html2PdfOptions = {
    margin: 0,
    filename,
    image: { type: "jpeg", quality: 0.98 },
    html2canvas: {
      scale: 2,
      useCORS: true,
      letterRendering: true,
      backgroundColor: "#FFFFFF",
    },
    jsPDF: {
      unit: "mm",
      format: "a4",
      orientation: "portrait",
    },
    pagebreak: {
      mode: ["css", "legacy"],
      before: ".pdf-page-break",
      avoid: ".pdf-page",
    },
  };

  await html2pdf()
    .set(options)
    .from(element)
    .save();
}
