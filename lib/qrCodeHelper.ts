import QRCode from 'qrcode';
import { QRCodeType, QRDataState, QRCustomizeOptions } from '../types/qr';

/**
 * Builds the standardized QR string payload based on type
 */
export function buildQRPayload(type: QRCodeType, data: QRDataState): string {
  switch (type) {
    case 'cafelina_menu': {
      const base = data.menuUrl.trim() || 'https://cafelina.com/menu';
      if (data.tableNumber && data.tableNumber.trim()) {
        const joiner = base.includes('?') ? '&' : '?';
        return `${base}${joiner}table=${encodeURIComponent(data.tableNumber.trim())}`;
      }
      return base;
    }

    case 'url': {
      const raw = data.url.trim() || 'https://cafelina.com';
      return raw.startsWith('http://') || raw.startsWith('https://') ? raw : `https://${raw}`;
    }

    case 'text':
      return data.text.trim() || 'Cafe Lina Specialty Experience';

    case 'phone': {
      const cleanPhone = data.phone.replace(/[\s()-]/g, '');
      return cleanPhone ? `tel:${cleanPhone}` : 'tel:+251900123456';
    }

    case 'email': {
      const email = data.emailAddress.trim() || 'info@cafelina.com';
      const params = new URLSearchParams();
      if (data.emailSubject) params.set('subject', data.emailSubject);
      if (data.emailBody) params.set('body', data.emailBody);
      const query = params.toString();
      return `mailto:${email}${query ? `?${query}` : ''}`;
    }

    case 'whatsapp': {
      const cleanPhone = data.waPhone.replace(/[\s+()-]/g, '') || '251900123456';
      const message = data.waMessage.trim();
      return `https://wa.me/${cleanPhone}${message ? `?text=${encodeURIComponent(message)}` : ''}`;
    }

    case 'wifi': {
      const ssid = escapeWifi(data.wifiSsid.trim() || 'Cafe_Lina_Guest_WiFi');
      const pass = escapeWifi(data.wifiPassword);
      const typeStr = data.wifiEncryption || 'WPA';
      const hidden = data.wifiHidden ? 'true' : 'false';
      return `WIFI:T:${typeStr};S:${ssid};P:${pass};H:${hidden};;`;
    }

    case 'vcard': {
      const fn = `${data.vcardFirstName} ${data.vcardLastName}`.trim() || 'Cafe Lina';
      return [
        'BEGIN:VCARD',
        'VERSION:3.0',
        `N:${data.vcardLastName || ''};${data.vcardFirstName || ''};;;`,
        `FN:${fn}`,
        data.vcardCompany ? `ORG:${data.vcardCompany}` : 'ORG:Cafe Lina Roastery',
        data.vcardJobTitle ? `TITLE:${data.vcardJobTitle}` : '',
        data.vcardPhone ? `TEL;TYPE=CELL:${data.vcardPhone}` : 'TEL;TYPE=CELL:+251900123456',
        data.vcardEmail ? `EMAIL:${data.vcardEmail}` : 'EMAIL:info@cafelina.com',
        data.vcardWebsite ? `URL:${data.vcardWebsite}` : 'URL:https://cafelina.com',
        data.vcardAddress ? `ADR:;;${data.vcardAddress};;;;` : 'ADR:;;Bole Road, Addis Ababa;;;;Ethiopia',
        'END:VCARD',
      ]
        .filter(Boolean)
        .join('\n');
    }

    case 'sms': {
      const cleanPhone = data.smsPhone.replace(/[\s()-]/g, '') || '+251900123456';
      const message = data.smsMessage.trim();
      return `smsto:${cleanPhone}:${message}`;
    }

    case 'location': {
      if (data.locationMode === 'coordinates' && data.locationLat && data.locationLng) {
        return `https://maps.google.com/?q=${data.locationLat.trim()},${data.locationLng.trim()}`;
      }
      const addr = data.locationAddress.trim() || 'Bole Road, Addis Ababa, Ethiopia';
      return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addr)}`;
    }

    default:
      return 'https://cafelina.com';
  }
}

function escapeWifi(str: string): string {
  return str.replace(/([\\;,:"])/g, '\\$1');
}

/**
 * Built-in Preset SVG Logos for Center Overlay
 */
export const LOGO_SVG_PRESETS: Record<string, string> = {
  cafelina: `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
    <circle cx="100" cy="100" r="95" fill="#6B1D1D" stroke="#D4AF37" stroke-width="6"/>
    <circle cx="100" cy="100" r="86" fill="none" stroke="#D4AF37" stroke-width="2"/>
    <text x="100" y="70" fill="#FDF5E6" font-size="28" font-family="serif" font-weight="bold" text-anchor="middle" letter-spacing="4">CAFE</text>
    <text x="100" y="150" fill="#D4AF37" font-size="26" font-family="serif" font-weight="bold" text-anchor="middle" letter-spacing="4">LINA</text>
    <path d="M 80 100 Q 100 85 120 100 Q 100 115 80 100" fill="#D4AF37"/>
    <circle cx="100" cy="100" r="6" fill="#FDF5E6"/>
  </svg>`,

  whatsapp: `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="12" fill="#25D366"/>
    <path d="M17.5 14.3c-.3-.1-1.7-.8-1.9-.9-.3-.1-.5-.1-.7.1-.2.3-.8.9-.9 1.1-.2.2-.3.2-.6.1-.3-.1-1.3-.5-2.4-1.5-.9-.8-1.5-1.8-1.7-2.1-.2-.3 0-.5.1-.6.1-.1.3-.3.4-.5.1-.1.2-.3.3-.4.1-.2 0-.3 0-.5 0-.1-.7-1.7-1-2.3-.3-.6-.6-.5-.8-.5h-.7c-.2 0-.6.1-.9.4-.3.4-1.2 1.2-1.2 2.9 0 1.7 1.2 3.3 1.4 3.5.2.3 2.4 3.7 5.8 5.2.8.3 1.4.6 1.9.7.8.3 1.6.2 2.2.1.7-.1 1.7-.7 1.9-1.4.3-.7.3-1.3.2-1.4-.1-.1-.3-.2-.6-.3z" fill="#ffffff"/>
  </svg>`,

  wifi: `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="12" fill="#0284C7"/>
    <path d="M12 18a1.5 1.5 0 100-3 1.5 1.5 0 000 3zm-4.2-4.2a6 6 0 018.4 0l1.4-1.4a8 8 0 00-11.2 0l1.4 1.4zm-2.8-2.8a10 10 0 0114 0l1.4-1.4a12 12 0 00-16.8 0l1.4 1.4z" fill="#ffffff"/>
  </svg>`,

  phone: `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="12" fill="#16A34A"/>
    <path d="M6.6 10.8c1.4 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1-9.4 0-17-7.6-17-17 0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.3 0 .7-.2 1l-2.3 2.2z" fill="#ffffff"/>
  </svg>`,

  email: `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="12" fill="#EA580C"/>
    <path d="M6 8l6 4 6-4v8H6V8zm6 2.5L6.5 7h11L12 10.5z" fill="#ffffff"/>
  </svg>`,

  location: `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="12" fill="#DC2626"/>
    <path d="M12 6c-2.2 0-4 1.8-4 4 0 3 4 8 4 8s4-5 4-8c0-2.2-1.8-4-4-4zm0 5.5a1.5 1.5 0 110-3 1.5 1.5 0 010 3z" fill="#ffffff"/>
  </svg>`,
};

/**
 * Draws a complete, customized QR Code with styles, frames, center logo & text on a Canvas.
 */
export async function renderQRToCanvas(
  targetCanvas: HTMLCanvasElement,
  payload: string,
  options: QRCustomizeOptions,
  scaleMultiplier: number = 1
): Promise<void> {
  const {
    fgColor = '#000000',
    bgColor = '#ffffff',
    size = 320,
    margin = 2,
    errorCorrectionLevel = 'Q',
    dotStyle = 'rounded',
    logo = 'none',
    customLogoUrl,
    logoSizePercent = 22,
    frame = 'none',
    frameText = 'SCAN ME',
    frameBgColor = '#6B1D1D',
    frameTextColor = '#FDF5E6',
    bottomText = '',
    bottomTextFontSize = 16,
    bottomTextColor = '#1e1e1e',
  } = options;

  // Actual pixel dimensions multiplied for high-resolution exports (1x, 2x, 4x)
  const qrPixelSize = Math.round(size * scaleMultiplier);
  const framePaddingTop = frame === 'badge-top' ? Math.round(52 * scaleMultiplier) : frame === 'polaroid' ? Math.round(24 * scaleMultiplier) : frame === 'border' ? Math.round(24 * scaleMultiplier) : 0;
  const framePaddingBottom =
    frame === 'badge-bottom'
      ? Math.round(52 * scaleMultiplier)
      : frame === 'polaroid'
      ? Math.round(64 * scaleMultiplier)
      : frame === 'border'
      ? Math.round(24 * scaleMultiplier)
      : bottomText.trim()
      ? Math.round(44 * scaleMultiplier)
      : 0;

  const totalWidth = qrPixelSize + (frame === 'border' || frame === 'luxury-gold' ? Math.round(48 * scaleMultiplier) : 0);
  const totalHeight = qrPixelSize + framePaddingTop + framePaddingBottom;

  targetCanvas.width = totalWidth;
  targetCanvas.height = totalHeight;

  const ctx = targetCanvas.getContext('2d');
  if (!ctx) return;

  // 1. Draw Background
  ctx.fillStyle = bgColor === 'transparent' ? 'rgba(0,0,0,0)' : bgColor;
  ctx.fillRect(0, 0, totalWidth, totalHeight);

  // Frame Backgrounds
  if (frame === 'luxury-gold') {
    ctx.strokeStyle = '#D4AF37';
    ctx.lineWidth = Math.round(4 * scaleMultiplier);
    ctx.strokeRect(
      Math.round(8 * scaleMultiplier),
      Math.round(8 * scaleMultiplier),
      totalWidth - Math.round(16 * scaleMultiplier),
      totalHeight - Math.round(16 * scaleMultiplier)
    );
  } else if (frame === 'border') {
    ctx.strokeStyle = fgColor;
    ctx.lineWidth = Math.round(3 * scaleMultiplier);
    ctx.strokeRect(
      Math.round(6 * scaleMultiplier),
      Math.round(6 * scaleMultiplier),
      totalWidth - Math.round(12 * scaleMultiplier),
      totalHeight - Math.round(12 * scaleMultiplier)
    );
  }

  // 2. Generate raw QR code matrix using qrcode
  const qrData = QRCode.create(payload || 'https://cafelina.com', {
    errorCorrectionLevel: logo !== 'none' ? 'H' : errorCorrectionLevel,
  });

  const moduleCount = qrData.modules.size;
  const quietZone = margin;
  const totalModules = moduleCount + quietZone * 2;
  const cellSize = qrPixelSize / totalModules;

  const qrOffsetX = (totalWidth - qrPixelSize) / 2 + quietZone * cellSize;
  const qrOffsetY = framePaddingTop + quietZone * cellSize;

  // 3. Render Modules with selected Dot Style
  ctx.fillStyle = fgColor;

  for (let row = 0; row < moduleCount; row++) {
    for (let col = 0; col < moduleCount; col++) {
      if (qrData.modules.get(row, col)) {
        const x = qrOffsetX + col * cellSize;
        const y = qrOffsetY + row * cellSize;

        // Check if inside finder patterns (top-left, top-right, bottom-left)
        const isFinder =
          (row < 7 && col < 7) ||
          (row < 7 && col >= moduleCount - 7) ||
          (row >= moduleCount - 7 && col < 7);

        if (dotStyle === 'dots' && !isFinder) {
          ctx.beginPath();
          ctx.arc(x + cellSize / 2, y + cellSize / 2, (cellSize / 2) * 0.9, 0, Math.PI * 2);
          ctx.fill();
        } else if (dotStyle === 'rounded' && !isFinder) {
          drawRoundedRect(ctx, x + 0.5, y + 0.5, cellSize - 1, cellSize - 1, cellSize * 0.35);
          ctx.fill();
        } else {
          // Sharp / square
          ctx.fillRect(x, y, cellSize + 0.3, cellSize + 0.3);
        }
      }
    }
  }

  // 4. Draw Center Logo if enabled
  if (logo !== 'none') {
    const logoPx = (qrPixelSize * logoSizePercent) / 100;
    const logoX = (totalWidth - logoPx) / 2;
    const logoY = qrOffsetY - (quietZone * cellSize) + (qrPixelSize - logoPx) / 2;

    // Draw circular or rounded white protective shield
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = 'rgba(0,0,0,0.2)';
    ctx.shadowBlur = Math.round(8 * scaleMultiplier);
    ctx.beginPath();
    ctx.arc(logoX + logoPx / 2, logoY + logoPx / 2, (logoPx / 2) * 1.15, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;

    // Border around shield
    ctx.strokeStyle = fgColor;
    ctx.lineWidth = Math.max(1, Math.round(2 * scaleMultiplier));
    ctx.stroke();

    // Render logo image or preset SVG
    let logoImgSrc = customLogoUrl;
    if (logo !== 'custom' && LOGO_SVG_PRESETS[logo]) {
      logoImgSrc = `data:image/svg+xml;utf8,${encodeURIComponent(LOGO_SVG_PRESETS[logo])}`;
    }

    if (logoImgSrc) {
      try {
        const img = await loadImage(logoImgSrc);
        ctx.save();
        ctx.beginPath();
        ctx.arc(logoX + logoPx / 2, logoY + logoPx / 2, logoPx / 2, 0, Math.PI * 2);
        ctx.clip();
        ctx.drawImage(img, logoX, logoY, logoPx, logoPx);
        ctx.restore();
      } catch (err) {
        console.warn('Center logo failed to load:', err);
      }
    }
  }

  // 5. Draw Frame Header / Footer
  if (frame === 'badge-top') {
    const bannerH = Math.round(42 * scaleMultiplier);
    ctx.fillStyle = frameBgColor;
    drawRoundedRect(
      ctx,
      Math.round(16 * scaleMultiplier),
      Math.round(6 * scaleMultiplier),
      totalWidth - Math.round(32 * scaleMultiplier),
      bannerH,
      Math.round(12 * scaleMultiplier)
    );
    ctx.fill();

    ctx.fillStyle = frameTextColor;
    ctx.font = `bold ${Math.round(15 * scaleMultiplier)}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(
      (frameText || 'SCAN ME').toUpperCase(),
      totalWidth / 2,
      Math.round(6 * scaleMultiplier) + bannerH / 2
    );
  } else if (frame === 'badge-bottom') {
    const bannerH = Math.round(42 * scaleMultiplier);
    const bannerY = totalHeight - bannerH - Math.round(6 * scaleMultiplier);
    ctx.fillStyle = frameBgColor;
    drawRoundedRect(
      ctx,
      Math.round(16 * scaleMultiplier),
      bannerY,
      totalWidth - Math.round(32 * scaleMultiplier),
      bannerH,
      Math.round(12 * scaleMultiplier)
    );
    ctx.fill();

    ctx.fillStyle = frameTextColor;
    ctx.font = `bold ${Math.round(15 * scaleMultiplier)}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText((frameText || 'SCAN ME').toUpperCase(), totalWidth / 2, bannerY + bannerH / 2);
  }

  // 6. Draw Optional Bottom Text (e.g. "Cafe-Lina Menu")
  const textToDraw = frame === 'polaroid' ? frameText || 'Cafe-Lina Menu' : bottomText.trim();
  if (textToDraw && frame !== 'badge-bottom') {
    ctx.fillStyle = bottomTextColor;
    ctx.font = `bold ${Math.round(bottomTextFontSize * scaleMultiplier)}px serif, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const textY = totalHeight - Math.round(22 * scaleMultiplier);
    ctx.fillText(textToDraw, totalWidth / 2, textY);
  }
}

/**
 * Generates an SVG string representation of the QR code
 */
export async function generateQRSVG(
  payload: string,
  options: QRCustomizeOptions
): Promise<string> {
  const { fgColor = '#000000', bgColor = '#ffffff', margin = 2 } = options;
  return QRCode.toString(payload || 'https://cafelina.com', {
    type: 'svg',
    margin,
    color: {
      dark: fgColor,
      light: bgColor === 'transparent' ? '#0000' : bgColor,
    },
    errorCorrectionLevel: options.logo !== 'none' ? 'H' : options.errorCorrectionLevel,
  });
}

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + width - r, y);
  ctx.arcTo(x + width, y, x + width, y + r, r);
  ctx.lineTo(x + width, y + height - r);
  ctx.arcTo(x + width, y + height, x + width - r, y + height, r);
  ctx.lineTo(x + r, y + height);
  ctx.arcTo(x, y + height, x, y + height - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(e);
    img.src = src;
  });
}
