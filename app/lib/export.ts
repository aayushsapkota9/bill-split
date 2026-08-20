import html2canvas from "html2canvas";
import jsPDF from "jspdf";

export async function exportAsPDF(
  element: HTMLElement,
  billTitle: string,
): Promise<void> {
  const canvas = await html2canvas(element, {
    backgroundColor: "#ffffff",
    scale: 2,
    useCORS: true,
    logging: false,
    width: element.scrollWidth,
    height: element.scrollHeight,
    windowWidth: element.scrollWidth,
    windowHeight: element.scrollHeight,
  });

  const imgData = canvas.toDataURL("image/png");
  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "px",
    format: [canvas.width / 2, canvas.height / 2],
  });

  pdf.addImage(imgData, "PNG", 0, 0, canvas.width / 2, canvas.height / 2);
  const safeTitle = billTitle.replace(/[^a-zA-Z0-9_-]/g, "_") || "BillSplit";
  pdf.save(
    `${safeTitle}_${new Date().toLocaleDateString("en-IN").replace(/\//g, "-")}.pdf`,
  );
}

export async function exportAsImage(
  element: HTMLElement,
  billTitle: string,
): Promise<void> {
  const canvas = await html2canvas(element, {
    backgroundColor: "#ffffff",
    scale: 2,
    useCORS: true,
    logging: false,
    width: element.scrollWidth,
    height: element.scrollHeight,
    windowWidth: element.scrollWidth,
    windowHeight: element.scrollHeight,
  });

  const link = document.createElement("a");
  const safeTitle = billTitle.replace(/[^a-zA-Z0-9_-]/g, "_") || "BillSplit";
  link.download = `${safeTitle}_${new Date().toLocaleDateString("en-IN").replace(/\//g, "-")}.png`;
  link.href = canvas.toDataURL("image/png");
  link.click();
}
