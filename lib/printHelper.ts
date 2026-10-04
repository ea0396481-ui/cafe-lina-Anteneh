import printJS from 'print-js';

export interface PrintMenuOptions {
  containerId?: string;
  documentTitle?: string;
  onSuccess?: () => void;
  onError?: (err: unknown) => void;
}

const DEFAULT_PRINT_STYLES = `
  @page {
    size: A4 portrait;
    margin: 8mm 6mm 10mm 6mm;
  }
  * {
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
    box-sizing: border-box;
  }
  html, body {
    margin: 0 !important;
    padding: 0 !important;
    background: #ffffff !important;
    color: #1a1a1a !important;
    font-family: serif, 'Times New Roman', sans-serif;
  }
  .pdf-page, .print-page-container {
    width: 100% !important;
    min-height: auto !important;
    max-height: none !important;
    box-shadow: none !important;
    border: 1px solid rgba(212, 175, 55, 0.4) !important;
    margin: 0 0 20px 0 !important;
    page-break-after: always !important;
    break-after: page !important;
    background: #FFFDF9 !important;
    overflow: visible !important;
  }
  .pdf-page:last-child, .print-page-container:last-child {
    page-break-after: auto !important;
    break-after: auto !important;
    margin-bottom: 0 !important;
  }
  .avoid-break-inside {
    page-break-inside: avoid !important;
    break-inside: avoid !important;
  }
  .category-print-header {
    page-break-after: avoid !important;
    break-after: avoid !important;
  }
`;

/**
 * Robust print function targeting a specific container ID.
 * First attempts printJS, and if blocked or unavailable,
 * falls back to an isolated hidden iframe print handler that
 * completely bypasses React state and DOM cloning issues.
 */
export function printMenuContainer(options: PrintMenuOptions = {}): void {
  const {
    containerId = 'cafelina-printable-menu-target',
    documentTitle = 'Cafe Lina Menu',
    onSuccess,
    onError,
  } = options;

  const targetEl = document.getElementById(containerId);
  if (!targetEl) {
    console.warn(`Print target element #${containerId} not found in DOM`);
    onError?.(new Error(`Element #${containerId} not found`));
    return;
  }

  try {
    // Primary approach: print-js targeting the container ID
    printJS({
      printable: containerId,
      type: 'html',
      targetStyles: ['*'],
      scanStyles: true,
      documentTitle,
      style: DEFAULT_PRINT_STYLES,
      onError: (err) => {
        console.warn('printJS failed, switching to custom iframe print handler:', err);
        executeIframePrint(targetEl, documentTitle, onSuccess, onError);
      },
    });
    onSuccess?.();
  } catch (err) {
    console.warn('printJS invocation failed, switching to custom iframe print handler:', err);
    executeIframePrint(targetEl, documentTitle, onSuccess, onError);
  }
}

/**
 * Custom isolated iframe print handler:
 * Creates a clean detached iframe, copies the target element HTML,
 * injects styles, and prints without affecting React state or encountering
 * iframe/parent scroll clashing.
 */
function executeIframePrint(
  targetElement: HTMLElement,
  documentTitle: string,
  onSuccess?: () => void,
  onError?: (err: unknown) => void
): void {
  try {
    // Remove existing print iframes if any
    const existing = document.getElementById('cafelina-print-iframe');
    if (existing) existing.remove();

    const iframe = document.createElement('iframe');
    iframe.id = 'cafelina-print-iframe';
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    iframe.style.visibility = 'hidden';

    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (!doc) {
      throw new Error('Unable to access iframe document');
    }

    // Collect all stylesheets from host document
    let styleLinks = '';
    Array.from(document.querySelectorAll('link[rel="stylesheet"], style')).forEach((node) => {
      styleLinks += node.outerHTML;
    });

    doc.open();
    doc.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${documentTitle}</title>
          ${styleLinks}
          <style>${DEFAULT_PRINT_STYLES}</style>
        </head>
        <body style="background:#ffffff; margin:0; padding:10px;">
          ${targetElement.outerHTML}
        </body>
      </html>
    `);
    doc.close();

    // Wait for content and images to load then print
    iframe.onload = () => {
      setTimeout(() => {
        try {
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();
          onSuccess?.();
        } catch (printErr) {
          console.error('Iframe print error:', printErr);
          onError?.(printErr);
        } finally {
          setTimeout(() => iframe.remove(), 60000);
        }
      }, 500);
    };
  } catch (error) {
    console.error('executeIframePrint failed, falling back to window.print():', error);
    try {
      window.print();
      onSuccess?.();
    } catch (windowPrintErr) {
      onError?.(windowPrintErr);
    }
  }
}
