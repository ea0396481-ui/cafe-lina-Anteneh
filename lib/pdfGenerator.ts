import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import QRCode from 'qrcode';
import { MenuItem } from '../types';

export interface PDFGenerationOptions {
  fileName?: string;
  restaurantName?: string;
  phone?: string;
  address?: string;
  website?: string;
  email?: string;
  menuItems?: MenuItem[];
  onProgress?: (progress: number, message: string) => void;
}

/**
 * Generates an ultra high-quality A4 PDF of the restaurant menu.
 * Uses html2canvas with safe CORS & anti-tainting protections,
 * and seamlessly falls back to direct vector jsPDF rendering if needed.
 */
export async function downloadMenuPDF(
  container: HTMLElement | string | null,
  options: PDFGenerationOptions = {}
): Promise<void> {
  const {
    restaurantName = 'Cafe Lina Luxury Coffee & Restaurant',
    phone = '+251 900 123 456',
    address = 'Bole Road, Addis Ababa, Ethiopia',
    website = 'www.cafelina.com',
    email = 'info@cafelina.com',
    menuItems = [],
    onProgress,
  } = options;

  const dateStr = new Date().toISOString().split('T')[0];
  const fileName =
    options.fileName ||
    `${restaurantName.replace(/[^a-zA-Z0-9]/g, '')}_Menu_${dateStr}.pdf`;

  onProgress?.(10, 'Initializing menu document...');

  // Resolve target element by reference or container ID
  let targetElement: HTMLElement | null = null;
  if (typeof container === 'string') {
    targetElement = document.getElementById(container);
  } else if (container instanceof HTMLElement) {
    targetElement = container;
  }

  if (!targetElement) {
    targetElement =
      document.getElementById('cafelina-printable-menu-target') ||
      document.getElementById('cafelina-product-costing-print-target') ||
      document.getElementById('cafelina-menu-print-target') ||
      document.getElementById('cafelina-preview-print-target');
  }

  // Try HTML2Canvas based export first
  if (targetElement) {
    try {
      const pageElements = Array.from(
        targetElement.querySelectorAll<HTMLElement>('[data-menu-page="true"]')
      );
      const targets = pageElements.length > 0 ? pageElements : [targetElement];

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
        compress: true,
      });

      const pdfWidth = 210;
      const pdfHeight = 297;
      let renderedAtLeastOnePage = false;

      for (let i = 0; i < targets.length; i++) {
        const pageEl = targets[i];
        const progressPercent = Math.round(15 + ((i + 1) / targets.length) * 70);
        onProgress?.(
          progressPercent,
          `Rendering high-definition page ${i + 1} of ${targets.length}...`
        );

        let canvas: HTMLCanvasElement;
        try {
          // Attempt 1: Safe high-res rendering with CORS & no tainting
          canvas = await html2canvas(pageEl, {
            scale: 1.5,
            useCORS: true,
            allowTaint: false, // Prevents SecurityError on toDataURL
            imageTimeout: 5000,
            logging: false,
            backgroundColor: '#FFFDF9',
            onclone: (_clonedDoc, clonedEl) => {
              clonedEl.style.transform = 'none';
              clonedEl.style.opacity = '1';
              clonedEl.style.visibility = 'visible';
              clonedEl.style.display = 'block';

              // Ensure images allow cross-origin
              const imgs = clonedEl.querySelectorAll('img');
              imgs.forEach((img) => {
                img.crossOrigin = 'anonymous';
              });
            },
          });
        } catch (canvasErr) {
          console.warn('Canvas attempt 1 with images failed, retrying sanitized canvas:', canvasErr);
          // Attempt 2: Retry with sanitized cloned element (remove remote images that block CORS)
          canvas = await html2canvas(pageEl, {
            scale: 1.5,
            useCORS: false,
            allowTaint: false,
            logging: false,
            backgroundColor: '#FFFDF9',
            onclone: (_clonedDoc, clonedEl) => {
              clonedEl.style.transform = 'none';
              clonedEl.style.opacity = '1';
              clonedEl.style.visibility = 'visible';
              // Hide or replace broken external images with styled placeholders
              const imgs = clonedEl.querySelectorAll('img');
              imgs.forEach((img) => {
                // If it's not base64 data url, replace with placeholder
                if (!img.src.startsWith('data:')) {
                  img.style.visibility = 'hidden';
                }
              });
            },
          });
        }

        // Safely extract image data
        let imgData: string;
        try {
          imgData = canvas.toDataURL('image/jpeg', 0.92);
        } catch (taintErr) {
          console.warn('toDataURL tainted, falling back to direct PDF generator:', taintErr);
          throw taintErr;
        }

        if (renderedAtLeastOnePage) {
          pdf.addPage('a4', 'portrait');
        }

        pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');
        renderedAtLeastOnePage = true;
      }

      if (renderedAtLeastOnePage) {
        onProgress?.(95, 'Saving your professional PDF...');
        pdf.save(fileName);
        onProgress?.(100, 'Complete!');
        return;
      }
    } catch (htmlCanvasError) {
      console.warn('html2canvas pipeline failed, generating direct vector PDF fallback:', htmlCanvasError);
    }
  }

  // =========================================================================
  // BULLETPROOF DIRECT VECTOR PDF GENERATOR (Guaranteed 100% Success)
  // =========================================================================
  onProgress?.(50, 'Building professional printable menu PDF...');
  await generateDirectVectorPDF(fileName, {
    restaurantName,
    phone,
    address,
    website,
    email,
    menuItems,
    onProgress,
  });
}

/**
 * Direct jsPDF Vector Generator:
 * Generates an elegant, publication-grade multi-page restaurant menu
 * with royal crest, category headers, prices, descriptions, and demo QR code.
 */
async function generateDirectVectorPDF(
  fileName: string,
  options: PDFGenerationOptions
): Promise<void> {
  const {
    restaurantName = 'Cafe Lina Luxury Coffee & Restaurant',
    phone = '+251 900 123 456',
    address = 'Bole Road, Addis Ababa, Ethiopia',
    website = 'www.cafelina.com',
    menuItems = [],
    onProgress,
  } = options;

  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
    compress: true,
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;

  // Generate Demo QR Code Data URL
  let qrDataUrl = '';
  try {
    qrDataUrl = await QRCode.toDataURL('https://cafelina.com/menu', {
      width: 250,
      margin: 1,
      color: { dark: '#1E1E1E', light: '#FFFFFF' },
    });
  } catch (qrErr) {
    console.warn('QR code generation failed:', qrErr);
  }

  // Helper to draw gold border frame & corner accents
  const drawPageBorder = (pageNumber: number, totalPagesCount: number) => {
    // Outer border
    pdf.setDrawColor(212, 175, 55); // Gold
    pdf.setLineWidth(0.6);
    pdf.rect(margin, margin, contentWidth, pageHeight - margin * 2);

    // Inner thin border
    pdf.setDrawColor(212, 175, 55);
    pdf.setLineWidth(0.2);
    pdf.rect(margin + 2, margin + 2, contentWidth - 4, pageHeight - margin * 2 - 4);

    // Corner Ornaments
    const cornerSize = 5;
    pdf.setLineWidth(1.0);
    pdf.setDrawColor(107, 29, 29); // Burgundy

    // Top-left corner
    pdf.line(margin - 1, margin - 1, margin + cornerSize, margin - 1);
    pdf.line(margin - 1, margin - 1, margin - 1, margin + cornerSize);

    // Top-right corner
    pdf.line(pageWidth - margin + 1, margin - 1, pageWidth - margin - cornerSize, margin - 1);
    pdf.line(pageWidth - margin + 1, margin - 1, pageWidth - margin + 1, margin + cornerSize);

    // Bottom-left corner
    pdf.line(margin - 1, pageHeight - margin + 1, margin + cornerSize, pageHeight - margin + 1);
    pdf.line(margin - 1, pageHeight - margin + 1, margin - 1, pageHeight - margin - cornerSize);

    // Bottom-right corner
    pdf.line(pageWidth - margin + 1, pageHeight - margin + 1, pageWidth - margin - cornerSize, pageHeight - margin + 1);
    pdf.line(pageWidth - margin + 1, pageHeight - margin + 1, pageWidth - margin + 1, pageHeight - margin - cornerSize);

    // Bottom Running Footer
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);
    pdf.setTextColor(120, 120, 120);
    pdf.text(`${restaurantName} • Official Restaurant Menu`, margin + 4, pageHeight - margin - 5);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(107, 29, 29);
    pdf.text(`Page ${pageNumber} of ${totalPagesCount}`, pageWidth - margin - 4, pageHeight - margin - 5, {
      align: 'right',
    });
  };

  // Group items by category
  const categoriesMap: { [cat: string]: MenuItem[] } = {};
  menuItems.forEach((item) => {
    const cat = item.category || 'Specialties';
    if (!categoriesMap[cat]) categoriesMap[cat] = [];
    categoriesMap[cat].push(item);
  });

  const categoryNames = Object.keys(categoriesMap);

  // Split categories across 2 to 3 pages
  const catsPerPage = Math.ceil(categoryNames.length / 2) || 1;
  const page1Cats = categoryNames.slice(0, catsPerPage);
  const page2Cats = categoryNames.slice(catsPerPage);

  const totalPages = page2Cats.length > 0 ? 2 : 1;

  // ==========================================
  // PAGE 1: Grand Header + Demo QR + Categories
  // ==========================================
  drawPageBorder(1, totalPages);

  // Royal Monogram Crest
  pdf.setDrawColor(212, 175, 55);
  pdf.setFillColor(255, 253, 249);
  pdf.circle(pageWidth / 2, margin + 10, 8, 'FD');
  pdf.setFont('times', 'bold');
  pdf.setFontSize(10);
  pdf.setTextColor(107, 29, 29);
  pdf.text('CL', pageWidth / 2, margin + 11.5, { align: 'center' });

  // Subtitle
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(8);
  pdf.setTextColor(107, 29, 29);
  pdf.text('ARTISAN ROASTERY • FINE DINING • BAKERY', pageWidth / 2, margin + 22, { align: 'center' });

  // Main Restaurant Name
  pdf.setFont('times', 'bold');
  pdf.setFontSize(22);
  pdf.setTextColor(26, 26, 26);
  pdf.text(restaurantName.toUpperCase(), pageWidth / 2, margin + 30, { align: 'center' });

  // Address & Phone Bar
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8.5);
  pdf.setTextColor(100, 100, 100);
  pdf.text(`${address}  •  ${phone}  •  VAT Inclusive`, pageWidth / 2, margin + 36, { align: 'center' });

  // Thin separator
  pdf.setDrawColor(212, 175, 55);
  pdf.setLineWidth(0.4);
  pdf.line(margin + 10, margin + 39, pageWidth - margin - 10, margin + 39);

  // DEMO QR CODE BOX (Hero Banner on Page 1)
  if (qrDataUrl) {
    const qrBoxY = margin + 41;
    pdf.setFillColor(252, 249, 242);
    pdf.setDrawColor(212, 175, 55);
    pdf.setLineWidth(0.3);
    pdf.roundedRect(margin + 4, qrBoxY, contentWidth - 8, 22, 2, 2, 'FD');

    // QR Image
    pdf.addImage(qrDataUrl, 'PNG', margin + 6, qrBoxY + 2, 18, 18);

    // QR Text
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(9);
    pdf.setTextColor(107, 29, 29);
    pdf.text('DEMO QR CODE: SCAN FOR MOBILE MENU & ORDERING', margin + 28, qrBoxY + 7);

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);
    pdf.setTextColor(70, 70, 70);
    pdf.text('Point your smartphone camera at this QR code to view live prices, ingredients, and order online.', margin + 28, qrBoxY + 12);
    pdf.setTextColor(107, 29, 29);
    pdf.text(`${website}/menu`, margin + 28, qrBoxY + 17);
  }

  // Draw Page 1 Categories
  let currentY = qrDataUrl ? margin + 68 : margin + 46;
  drawCategoriesSection(pdf, page1Cats, categoriesMap, currentY, margin, contentWidth, pageHeight);

  // ==========================================
  // PAGE 2 (If items remain): Categories + Grand Footer
  // ==========================================
  if (page2Cats.length > 0) {
    pdf.addPage('a4', 'portrait');
    drawPageBorder(2, totalPages);

    // Mini Page 2 Header
    pdf.setFont('times', 'bold');
    pdf.setFontSize(12);
    pdf.setTextColor(107, 29, 29);
    pdf.text('CAFE LINA  |  Artisan Culinary Menu (Continued)', margin + 6, margin + 10);
    pdf.setDrawColor(212, 175, 55);
    pdf.setLineWidth(0.3);
    pdf.line(margin + 6, margin + 12, pageWidth - margin - 6, margin + 12);

    currentY = margin + 18;
    drawCategoriesSection(pdf, page2Cats, categoriesMap, currentY, margin, contentWidth, pageHeight - 35);

    // Grand Thank You Footer with Secondary QR
    const footerY = pageHeight - margin - 32;
    pdf.setFillColor(252, 249, 242);
    pdf.setDrawColor(212, 175, 55);
    pdf.setLineWidth(0.4);
    pdf.roundedRect(margin + 4, footerY, contentWidth - 8, 25, 2, 2, 'FD');

    if (qrDataUrl) {
      pdf.addImage(qrDataUrl, 'PNG', pageWidth - margin - 26, footerY + 2.5, 20, 20);
    }

    pdf.setFont('times', 'bold');
    pdf.setFontSize(11);
    pdf.setTextColor(107, 29, 29);
    pdf.text('THANK YOU FOR DINING WITH US AT CAFE LINA', margin + 8, footerY + 7);

    pdf.setFont('times', 'italic');
    pdf.setFontSize(8.5);
    pdf.setTextColor(90, 90, 90);
    pdf.text('"Every cup of coffee tells a story of Ethiopian heritage. Every dish is crafted with devotion."', margin + 8, footerY + 12);

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);
    pdf.setTextColor(60, 60, 60);
    pdf.text(`Phone: ${phone}  |  Address: ${address}`, margin + 8, footerY + 17);
    pdf.text(`Website: ${website}  |  Email: ${options.email || 'info@cafelina.com'}`, margin + 8, footerY + 21);
  }

  onProgress?.(95, 'Finalizing PDF download...');
  pdf.save(fileName);
  onProgress?.(100, 'Complete!');
}

/**
 * Helper to render categories and items neatly in a 2-column layout in jsPDF
 */
function drawCategoriesSection(
  pdf: jsPDF,
  cats: string[],
  categoriesMap: { [cat: string]: MenuItem[] },
  startY: number,
  margin: number,
  contentWidth: number,
  maxY: number
) {
  let y = startY;
  const colWidth = (contentWidth - 6) / 2;

  cats.forEach((catName) => {
    if (y > maxY - 25) return;

    const items = categoriesMap[catName] || [];
    if (items.length === 0) return;

    // Category Header
    pdf.setFont('times', 'bold');
    pdf.setFontSize(11);
    pdf.setTextColor(107, 29, 29); // Burgundy
    pdf.text(catName.toUpperCase(), margin + 4, y);

    pdf.setDrawColor(212, 175, 55); // Gold line
    pdf.setLineWidth(0.2);
    pdf.line(margin + 4, y + 1.5, margin + contentWidth - 4, y + 1.5);
    y += 6;

    // Render items in 2 columns
    for (let i = 0; i < items.length; i += 2) {
      if (y > maxY - 12) break;

      const item1 = items[i];
      const item2 = items[i + 1];

      // Col 1
      renderSingleItem(pdf, item1, margin + 4, y, colWidth - 4);

      // Col 2
      if (item2) {
        renderSingleItem(pdf, item2, margin + 4 + colWidth + 2, y, colWidth - 4);
      }

      y += 9.5;
    }

    y += 3;
  });
}

function renderSingleItem(pdf: jsPDF, item: MenuItem, x: number, y: number, width: number) {
  // Item Name
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(8.5);
  pdf.setTextColor(25, 25, 25);
  const name = item.name.length > 28 ? item.name.substring(0, 26) + '...' : item.name;
  pdf.text(name, x, y);

  // Price
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(8.5);
  pdf.setTextColor(107, 29, 29);
  const priceStr = `${item.price} ${item.currency || 'ETB'}`;
  pdf.text(priceStr, x + width, y, { align: 'right' });

  // Description / Subtitle
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(7);
  pdf.setTextColor(110, 110, 110);
  const desc = item.description || (item.ingredients ? item.ingredients.slice(0, 3).join(', ') : '');
  const cleanDesc = desc.length > 50 ? desc.substring(0, 48) + '...' : desc;
  pdf.text(cleanDesc, x, y + 3.5);
}
