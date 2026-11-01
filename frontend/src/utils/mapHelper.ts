/**
 * Robust Google Maps embed and link parser for RoastFuze.
 * Handles:
 * 1. Raw iframe embed codes: <iframe src="https://www.google.com/maps/embed?pb=..." ...></iframe>
 * 2. Official Google Maps embed URLs: https://www.google.com/maps/embed?pb=...
 * 3. Google Maps place links: https://www.google.com/maps/place/RoastFuze+Coffee+Bar+-+Musical+Balcony+cafe/@...
 * 4. Google Maps short links: https://maps.app.goo.gl/...
 * 5. General search queries or addresses: "RoastFuze Coffee Bar, Vaishali Nagar, Jaipur"
 * 6. Raw lat/lng coordinates fallback
 */
export function buildGoogleMapsEmbedUrl(input?: string | null): string {
  const FALLBACK_QUERY = 'RoastFuze Coffee Bar, Gandhi Path West, Vaishali Nagar, Jaipur';
  const FALLBACK_EMBED = `https://maps.google.com/maps?q=${encodeURIComponent(FALLBACK_QUERY)}&t=&z=16&ie=UTF8&iwloc=&output=embed`;

  if (!input || !input.trim()) {
    return FALLBACK_EMBED;
  }

  let clean = input.trim();

  // 1. Extract src if user pasted a full HTML <iframe> tag
  const iframeSrcMatch = clean.match(/src=["']([^"']+)["']/i);
  if (iframeSrcMatch && iframeSrcMatch[1]) {
    clean = iframeSrcMatch[1].trim();
  }

  // 2. If it's already an official Google Maps /embed or output=embed link
  if (clean.includes('/maps/embed') || clean.includes('output=embed')) {
    return clean;
  }

  // 3. Extract place name from /place/Place+Name/...
  // (Crucial: Check placeMatch BEFORE atMatch coordinates so Google embeds the verified business pin
  // rather than throwing "Some customised on-map content could not be displayed" on raw coords)
  const placeMatch = clean.match(/\/place\/([^/@]+)/);
  if (placeMatch && placeMatch[1]) {
    const rawPlaceName = decodeURIComponent(placeMatch[1].replace(/\+/g, ' ')).trim();
    // Add city context if not present to ensure accurate pin resolution
    const placeQuery = rawPlaceName.toLowerCase().includes('jaipur')
      ? rawPlaceName
      : `${rawPlaceName}, Vaishali Nagar, Jaipur`;
    return `https://maps.google.com/maps?q=${encodeURIComponent(placeQuery)}&t=&z=16&ie=UTF8&iwloc=&output=embed`;
  }

  // 4. Extract lat,lng if given as @26.9056268,75.7271802
  const atMatch = clean.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (atMatch) {
    const lat = atMatch[1];
    const lng = atMatch[2];
    // Use OpenStreetMap or Google query with coords
    return `https://maps.google.com/maps?q=${lat},${lng}+(RoastFuze+Coffee+Bar)&t=&z=17&ie=UTF8&iwloc=B&output=embed`;
  }

  // 5. Extract lat,lng from !3dlat!4dlng (e.g. !3d26.9056268!4d75.7271802)
  const dMatch = clean.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/);
  if (dMatch) {
    const lat = dMatch[1];
    const lng = dMatch[2];
    return `https://maps.google.com/maps?q=${lat},${lng}+(RoastFuze+Coffee+Bar)&t=&z=17&ie=UTF8&iwloc=B&output=embed`;
  }

  // 6. Direct coordinates e.g. "26.9056268, 75.7271802"
  const rawCoords = clean.match(/^(-?\d+\.\d+)\s*,\s*(-?\d+\.\d+)$/);
  if (rawCoords) {
    return `https://maps.google.com/maps?q=${rawCoords[1]},${rawCoords[2]}+(RoastFuze+Coffee+Bar)&t=&z=17&ie=UTF8&iwloc=B&output=embed`;
  }

  // 7. General address or business search query
  return `https://maps.google.com/maps?q=${encodeURIComponent(clean)}&t=&z=16&ie=UTF8&iwloc=&output=embed`;
}

/**
 * Returns a direct browser link to open the cafe location on Google Maps app / website
 */
export function buildGoogleMapsDirectLink(input?: string | null): string {
  const DEFAULT_LINK = 'https://www.google.com/maps/place/RoastFuze+Coffee+Bar+-+Musical+Balcony+cafe/@26.9056268,75.7271802,20.2z';
  if (!input || !input.trim()) return DEFAULT_LINK;
  const clean = input.trim();
  if (clean.startsWith('http://') || clean.startsWith('https://')) return clean;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(clean)}`;
}
