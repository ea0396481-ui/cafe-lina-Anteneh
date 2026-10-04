/**
 * Professional Fiscal Receipt & Voucher Utilities for Café Lina Luxury Co.
 * Supporting Ethiopian TIN, FS Number, VAT Breakdown, Thermal Print & Omni-Share
 */

export interface ReceiptShareItem {
  name: string;
  qty: number;
  unit?: string;
  priceOrCost?: number;
  unitPrice?: number;
  notes?: string;
  sku?: string;
}

export interface ReceiptShareData {
  title: string;
  voucherId: string;
  fsNumber?: string;
  tinNumber?: string;
  vatRegNumber?: string;
  customerOrRecipient?: string;
  customerPhone?: string;
  cashierName?: string;
  waiterName?: string;
  tableNumber?: string;
  orderType?: 'Dine-In' | 'Takeaway' | 'Delivery' | string;
  date?: string;
  time?: string;
  subtotal?: number;
  discount?: number;
  tax?: number;
  vatRate?: number;
  total?: string | number;
  paymentMethod?: string;
  amountTendered?: number;
  changeDue?: number;
  accountOrPhone?: string;
  storeName?: string;
  branchAddress?: string;
  items?: ReceiptShareItem[];
  extraDetails?: string;
  notesOrRemarks?: string;
  customText?: string;
}

export const formatReceiptToText = (data: ReceiptShareData): string => {
  if (data.customText) return data.customText;

  const lines: string[] = [];
  lines.push(`================================`);
  lines.push(`✦ CAFÉ LINA LUXURY CO. ✦`);
  lines.push(` የካፌሊና የቅንጦት ቡና እና መስተንግዶ `);
  lines.push(`================================`);
  lines.push(`📍 ${data.storeName || 'Bole Main Central Store'}`);
  lines.push(`🏢 Bole Medhanialem Rd, Addis Ababa`);
  lines.push(`📞 Tel: +251 900 123 456 / +251 116 889 900`);
  lines.push(`🆔 TIN: ${data.tinNumber || '0089247193'} | VAT: ${data.vatRegNumber || '984729104'}`);
  lines.push(`🧾 FS No: ${data.fsNumber || `FS-2026-${Math.floor(100000 + Math.random() * 900000)}`}`);
  lines.push(`--------------------------------`);
  lines.push(`📃 ${data.title.toUpperCase()}`);
  lines.push(`🔖 Ref / Voucher ID: ${data.voucherId}`);
  if (data.date) lines.push(`📅 Date & Time: ${data.date} ${data.time || ''}`.trim());
  if (data.orderType) lines.push(`🍽️ Type: ${data.orderType}${data.tableNumber ? ` | Table: ${data.tableNumber}` : ''}`);
  if (data.customerOrRecipient) lines.push(`👤 Customer / Party: ${data.customerOrRecipient}`);
  if (data.cashierName) lines.push(`👨‍💼 Cashier: ${data.cashierName}`);
  if (data.waiterName) lines.push(`🤵 Waiter / Server: ${data.waiterName}`);
  lines.push(`--------------------------------`);
  lines.push(`ITEMS & SERVICES (የምርት ዝርዝር):`);

  if (data.items && data.items.length > 0) {
    data.items.forEach((it, idx) => {
      const unit = it.unit ? ` ${it.unit}` : '';
      const unitPriceStr = it.unitPrice ? ` @ ${it.unitPrice} ETB` : '';
      const totalCostStr = it.priceOrCost !== undefined ? ` = ${it.priceOrCost} ETB` : '';
      const notes = it.notes ? ` [${it.notes}]` : '';
      lines.push(`${idx + 1}. ${it.qty}${unit} x ${it.name}${notes}${unitPriceStr}${totalCostStr}`);
    });
  } else {
    lines.push(`(No item breakdown listed)`);
  }

  lines.push(`--------------------------------`);
  if (data.subtotal !== undefined) {
    lines.push(`Subtotal: ${data.subtotal} ETB`);
  }
  if (data.discount && data.discount > 0) {
    lines.push(`Discount: -${data.discount} ETB`);
  }
  if (data.tax !== undefined) {
    lines.push(`VAT (${data.vatRate || 5}%): ${data.tax} ETB`);
  }
  if (data.total !== undefined) {
    lines.push(`💰 TOTAL AMOUNT: ${data.total} ETB`);
  }
  if (data.paymentMethod) {
    lines.push(`💳 Payment Mode: ${data.paymentMethod}`);
  }
  if (data.amountTendered !== undefined && data.amountTendered > 0) {
    lines.push(`💵 Amount Tendered: ${data.amountTendered} ETB`);
  }
  if (data.changeDue !== undefined && data.changeDue > 0) {
    lines.push(`🪙 Change Due (መልስ): ${data.changeDue} ETB`);
  }
  if (data.accountOrPhone) {
    lines.push(`📱 Account/Ref: ${data.accountOrPhone}`);
  }
  if (data.extraDetails) {
    lines.push(`ℹ️ Extra: ${data.extraDetails}`);
  }
  if (data.notesOrRemarks) {
    lines.push(`📝 Remarks: ${data.notesOrRemarks}`);
  }
  lines.push(`================================`);
  lines.push(`✨ Thank you for choosing Café Lina!`);
  lines.push(`   እንግዳችን ስለሆኑ እናመሰግናለን!   `);
  lines.push(`================================`);

  return lines.join('\n');
};

/**
 * Universal print thermal receipt popup
 */
export const printReceiptThermal = (data: ReceiptShareData) => {
  const receiptText = formatReceiptToText(data);
  const itemsHtml = data.items && data.items.length > 0
    ? data.items.map((it, idx) => `
        <tr>
          <td style="padding: 4px 0; font-weight: bold;">${idx + 1}. ${it.name}${it.notes ? `<br><small style="color: #666; font-size: 10px;">(${it.notes})</small>` : ''}</td>
          <td style="padding: 4px 0; text-align: center;">${it.qty}${it.unit ? ` ${it.unit}` : ''}</td>
          <td style="padding: 4px 0; text-align: right;">${it.priceOrCost !== undefined ? `${it.priceOrCost} ETB` : it.unitPrice ? `${it.unitPrice} ETB` : '-'}</td>
        </tr>
      `).join('')
    : `<tr><td colspan="3" style="text-align: center; padding: 6px 0;">No items listed</td></tr>`;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>Receipt - ${data.voucherId}</title>
        <style>
          @page {
            size: 80mm auto;
            margin: 0;
          }
          body {
            font-family: 'Courier New', Courier, monospace, sans-serif;
            width: 78mm;
            margin: 0 auto;
            padding: 10px 6px;
            color: #000000;
            background: #ffffff;
            font-size: 12px;
            line-height: 1.35;
          }
          .header {
            text-align: center;
            border-bottom: 1px dashed #000;
            padding-bottom: 8px;
            margin-bottom: 8px;
          }
          .brand-title {
            font-size: 16px;
            font-weight: 900;
            letter-spacing: 0.5px;
          }
          .brand-subtitle {
            font-size: 11px;
            margin-top: 2px;
            font-weight: bold;
          }
          .meta-info {
            font-size: 11px;
            margin-top: 4px;
            color: #222;
          }
          .section-title {
            text-align: center;
            font-weight: bold;
            font-size: 12px;
            margin: 6px 0;
            text-transform: uppercase;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            font-size: 11px;
          }
          th {
            border-bottom: 1px solid #000;
            padding: 4px 0;
            font-size: 10px;
            text-transform: uppercase;
          }
          .divider {
            border-top: 1px dashed #000;
            margin: 8px 0;
          }
          .double-divider {
            border-top: 2px dashed #000;
            margin: 8px 0;
          }
          .totals-row {
            display: flex;
            justify-content: space-between;
            font-size: 11px;
            padding: 2px 0;
          }
          .grand-total {
            font-size: 15px;
            font-weight: 900;
            border-top: 1px solid #000;
            border-bottom: 1px solid #000;
            padding: 6px 0;
            margin: 4px 0;
          }
          .barcode-box {
            text-align: center;
            margin-top: 10px;
            font-size: 10px;
          }
          .barcode-bars {
            height: 24px;
            letter-spacing: 4px;
            font-size: 18px;
            font-family: monospace;
            font-weight: 900;
          }
          .footer {
            text-align: center;
            margin-top: 10px;
            font-size: 10px;
            border-top: 1px dashed #000;
            padding-top: 8px;
          }
          @media print {
            body { padding: 0; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="brand-title">☕ CAFÉ LINA LUXURY CO.</div>
          <div class="brand-subtitle">የካፌሊና የቅንጦት ቡና እና መስተንግዶ</div>
          <div class="meta-info">
            Bole Medhanialem Rd, Addis Ababa<br>
            Tel: +251 900 123 456 / +251 116 889 900<br>
            TIN: ${data.tinNumber || '0089247193'} | VAT: ${data.vatRegNumber || '984729104'}<br>
            FS No: ${data.fsNumber || `FS-2026-${Math.floor(100000 + Math.random() * 900000)}`}
          </div>
        </div>

        <div class="section-title">${data.title}</div>

        <div style="font-size: 11px; line-height: 1.4;">
          <div><strong>Voucher ID:</strong> ${data.voucherId}</div>
          <div><strong>Date:</strong> ${data.date || new Date().toISOString().split('T')[0]} ${data.time || ''}</div>
          ${data.storeName ? `<div><strong>Store:</strong> ${data.storeName}</div>` : ''}
          ${data.customerOrRecipient ? `<div><strong>Party:</strong> ${data.customerOrRecipient}</div>` : ''}
          ${data.cashierName ? `<div><strong>Cashier:</strong> ${data.cashierName}</div>` : ''}
          ${data.waiterName ? `<div><strong>Waiter:</strong> ${data.waiterName}</div>` : ''}
          ${data.orderType ? `<div><strong>Order:</strong> ${data.orderType} ${data.tableNumber ? `(${data.tableNumber})` : ''}</div>` : ''}
        </div>

        <div class="divider"></div>

        <table>
          <thead>
            <tr>
              <th style="text-align: left;">Item</th>
              <th style="text-align: center;">Qty</th>
              <th style="text-align: right;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>

        <div class="divider"></div>

        <div>
          ${data.subtotal !== undefined ? `<div class="totals-row"><span>Subtotal:</span><span>${data.subtotal} ETB</span></div>` : ''}
          ${data.discount && data.discount > 0 ? `<div class="totals-row" style="color: #b00;"><span>Discount:</span><span>-${data.discount} ETB</span></div>` : ''}
          ${data.tax !== undefined ? `<div class="totals-row"><span>VAT (${data.vatRate || 5}%):</span><span>${data.tax} ETB</span></div>` : ''}
          <div class="totals-row grand-total">
            <span>TOTAL AMOUNT:</span>
            <span>${data.total !== undefined ? `${data.total} ETB` : '0 ETB'}</span>
          </div>
          ${data.paymentMethod ? `<div class="totals-row"><span>Payment Method:</span><strong>${data.paymentMethod}</strong></div>` : ''}
          ${data.amountTendered !== undefined ? `<div class="totals-row"><span>Amount Tendered:</span><span>${data.amountTendered} ETB</span></div>` : ''}
          ${data.changeDue !== undefined ? `<div class="totals-row"><span>Change Due:</span><strong>${data.changeDue} ETB</strong></div>` : ''}
          ${data.accountOrPhone ? `<div class="totals-row"><span>Acc/Ref:</span><span>${data.accountOrPhone}</span></div>` : ''}
        </div>

        <div class="barcode-box">
          <div class="barcode-bars">||||| | |||| ||| |||| | |||||</div>
          <div>* ${data.voucherId} *</div>
        </div>

        <div class="footer">
          <strong>*** THANK YOU FOR VISITING CAFÉ LINA ***</strong><br>
          እንግዳችን ስለሆኑ እናመሰግናለን!<br>
          <small>Powered by Café Lina Luxury ERP Systems</small>
        </div>

        <script>
          window.onload = function() {
            window.print();
          };
        </script>
      </body>
    </html>
  `;

  try {
    const printWindow = window.open('', '_blank', 'width=450,height=650');
    if (printWindow) {
      printWindow.document.open();
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      return;
    }
  } catch (e) {
    console.error('Popup blocked or error opening print window', e);
  }

  // Fallback: window.print directly
  window.print();
};

export const downloadReceiptAsFile = (data: ReceiptShareData, onNotify?: (message: string) => void) => {
  const text = formatReceiptToText(data);
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `CafeLina_Receipt_${data.voucherId}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  if (onNotify) onNotify('Receipt downloaded successfully! (ሪሲቱ ዳውንሎድ ተደርጓል)');
};

export const shareReceipt = async (
  data: ReceiptShareData,
  onNotify?: (message: string, isError?: boolean) => void
): Promise<boolean> => {
  const receiptText = formatReceiptToText(data);
  const shareTitle = `${data.title} - ${data.voucherId}`;

  // 1. Try Native Web Share API if supported
  if (typeof navigator !== 'undefined' && navigator.share) {
    try {
      await navigator.share({
        title: shareTitle,
        text: receiptText,
      });
      if (onNotify) onNotify('Receipt shared successfully! (ሪሲቱ ተጋርቷል)');
      return true;
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        return copyReceiptToClipboard(receiptText, onNotify);
      }
      return false;
    }
  }

  // 2. Fallback to Copy to Clipboard
  return copyReceiptToClipboard(receiptText, onNotify);
};

export const copyReceiptToClipboard = async (
  receiptText: string,
  onNotify?: (message: string, isError?: boolean) => void
): Promise<boolean> => {
  try {
    if (navigator && navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(receiptText);
      if (onNotify) onNotify('Receipt copied to clipboard! (ሪሲቱ ኮፒ ተደርጓል)');
      return true;
    }
    const textArea = document.createElement('textarea');
    textArea.value = receiptText;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);
    if (successful) {
      if (onNotify) onNotify('Receipt copied to clipboard! (ሪሲቱ ኮፒ ተደርጓል)');
      return true;
    }
  } catch (e) {
    console.error('Clipboard copy failed', e);
  }

  if (onNotify) onNotify('Could not copy receipt automatically', true);
  return false;
};

export const shareViaWhatsApp = (data: ReceiptShareData) => {
  const text = encodeURIComponent(formatReceiptToText(data));
  const url = `https://api.whatsapp.com/send?text=${text}`;
  window.open(url, '_blank');
};

export const shareViaTelegram = (data: ReceiptShareData) => {
  const text = encodeURIComponent(formatReceiptToText(data));
  const url = `https://t.me/share/url?url=${encodeURIComponent('https://cafelina.com')}&text=${text}`;
  window.open(url, '_blank');
};

