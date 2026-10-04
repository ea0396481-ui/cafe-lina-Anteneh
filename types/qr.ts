export type QRCodeType =
  | 'cafelina_menu'
  | 'url'
  | 'text'
  | 'phone'
  | 'email'
  | 'whatsapp'
  | 'wifi'
  | 'vcard'
  | 'sms'
  | 'location';

export type ErrorCorrectionLevel = 'L' | 'M' | 'Q' | 'H';

export type QRFrameStyle =
  | 'none'
  | 'border'
  | 'badge-top'
  | 'badge-bottom'
  | 'polaroid'
  | 'luxury-gold';

export type QRDotStyle = 'square' | 'rounded' | 'dots';

export type QRLogoPreset =
  | 'none'
  | 'cafelina'
  | 'whatsapp'
  | 'wifi'
  | 'phone'
  | 'email'
  | 'location'
  | 'custom';

export interface QRDataState {
  // Website URL
  url: string;

  // Plain Text
  text: string;

  // Phone
  phone: string;

  // Email
  emailAddress: string;
  emailSubject: string;
  emailBody: string;

  // WhatsApp
  waPhone: string;
  waMessage: string;

  // Wi-Fi
  wifiSsid: string;
  wifiPassword: string;
  wifiEncryption: 'WPA' | 'WEP' | 'nopass';
  wifiHidden: boolean;

  // vCard
  vcardFirstName: string;
  vcardLastName: string;
  vcardPhone: string;
  vcardEmail: string;
  vcardCompany: string;
  vcardJobTitle: string;
  vcardWebsite: string;
  vcardAddress: string;

  // SMS
  smsPhone: string;
  smsMessage: string;

  // Location
  locationMode: 'search' | 'coordinates';
  locationAddress: string;
  locationLat: string;
  locationLng: string;

  // Cafe-Lina Menu
  menuUrl: string;
  tableNumber: string;
  displayMenuText: boolean;
}

export interface QRCustomizeOptions {
  fgColor: string;
  bgColor: string;
  size: number;
  margin: number;
  errorCorrectionLevel: ErrorCorrectionLevel;
  dotStyle: QRDotStyle;
  logo: QRLogoPreset;
  customLogoUrl?: string;
  logoSizePercent: number; // 15 to 28%
  frame: QRFrameStyle;
  frameText: string;
  frameBgColor: string;
  frameTextColor: string;
  bottomText: string;
  bottomTextFontSize: number;
  bottomTextColor: string;
}

export interface QRHistoryItem {
  id: string;
  type: QRCodeType;
  title: string;
  payload: string;
  dataUrl: string;
  createdAt: string;
}
