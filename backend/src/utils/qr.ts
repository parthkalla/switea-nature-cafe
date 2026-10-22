import QRCode from 'qrcode';

export async function generateQRCodeDataUrl(url: string): Promise<string> {
  return QRCode.toDataURL(url, {
    errorCorrectionLevel: 'H',
    margin: 2,
    color: {
      dark: '#1A3C2B', // Nature green brand color
      light: '#FFFFFF',
    },
    width: 512,
  });
}

export async function generateQRCodeSVG(url: string): Promise<string> {
  return QRCode.toString(url, {
    type: 'svg',
    errorCorrectionLevel: 'H',
    margin: 2,
    color: {
      dark: '#1A3C2B',
      light: '#FFFFFF',
    },
  });
}

export function buildTableMenuUrl(frontendUrl: string, restaurantSlug: string, tableToken: string): string {
  const base = frontendUrl.replace(/\/$/, '');
  return `${base}/menu?table=${tableToken}`;
}
