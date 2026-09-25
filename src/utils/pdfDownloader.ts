// src/utils/pdfDownloader.ts
// Generador y descargador directo de PDF para reportes de laboratorio

export async function downloadReportPDF(
  elementId: string,
  filename: string,
  onProgress?: (isGenerating: boolean) => void
): Promise<boolean> {
  const element = document.getElementById(elementId);
  if (!element) {
    window.print();
    return false;
  }

  try {
    if (onProgress) onProgress(true);

    // Import dinámico para optimizar el bundle inicial
    // @ts-ignore
    const html2pdfModule = await import('html2pdf.js');
    const html2pdf = html2pdfModule.default || html2pdfModule;

    const opt = {
      margin: [6, 6, 6, 6] as [number, number, number, number],
      filename: filename.endsWith('.pdf') ? filename : `${filename}.pdf`,
      image: { type: 'jpeg' as const, quality: 0.98 },
      html2canvas: {
        scale: 2,
        useCORS: true,
        letterRendering: true,
        logging: false,
      },
      jsPDF: { unit: 'mm' as const, format: 'letter' as const, orientation: 'portrait' as const },
      pagebreak: { mode: ['avoid-all', 'css', 'legacy'] },
    };

    await html2pdf().set(opt).from(element).save();
    return true;
  } catch (err) {
    console.error('Error al generar PDF con html2pdf, recurriendo a window.print():', err);
    window.print();
    return false;
  } finally {
    if (onProgress) onProgress(false);
  }
}
