/**
 * Multi-tenant subdomain and dynamic origin helper
 * Handles localhost (*.localhost:5170) and production (*.asrockstudios.in)
 */

export function getTenantSlug(urlParamSlug?: string): string {
  if (urlParamSlug && urlParamSlug !== 'roastfuze' && urlParamSlug !== 'all') {
    return urlParamSlug.toLowerCase().trim();
  }

  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname.toLowerCase();

    // 1. Subdomain on localhost: e.g. parth-caf.localhost
    if (hostname.endsWith('.localhost')) {
      const parts = hostname.split('.');
      if (parts[0] && parts[0] !== 'admin' && parts[0] !== 'www' && parts[0] !== 'roastfuze') {
        return parts[0];
      }
    }

    // 2. Subdomain on asrockstudios.in: e.g. parth-caf.asrockstudios.in
    if (hostname.endsWith('.asrockstudios.in')) {
      const sub = hostname.replace('.asrockstudios.in', '');
      if (sub && sub !== 'admin' && sub !== 'www' && sub !== 'roastfuze') {
        return sub;
      }
    }

    // 3. Any 3+ level domain: e.g. mycafe.domain.com
    const parts = hostname.split('.');
    if (parts.length >= 3) {
      const sub = parts[0];
      if (sub && sub !== 'admin' && sub !== 'www' && sub !== 'roastfuze') {
        return sub;
      }
    }
  }

  return urlParamSlug || 'roastfuze';
}

export function getOnboardLinks(slug: string) {
  const cleanSlug = slug.toLowerCase().trim();
  const isLocal =
    typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1' ||
      window.location.hostname.endsWith('.localhost'));

  if (isLocal) {
    const port = window.location.port ? `:${window.location.port}` : '';
    const proto = window.location.protocol;
    return {
      subdomainMenuUrl: `${proto}//${cleanSlug}.localhost${port}`,
      directMenuUrl: `${window.location.origin}/menu/${cleanSlug}`,
      adminUrl: `${proto}//${cleanSlug}.localhost${port}/admin/login`,
      adminDirectUrl: `${window.location.origin}/admin/login`,
      isLocal: true,
    };
  }

  // Production domain: asrockstudios.in
  return {
    subdomainMenuUrl: `https://${cleanSlug}.asrockstudios.in`,
    directMenuUrl: `https://roastfuze.asrockstudios.in/menu/${cleanSlug}`,
    adminUrl: `https://${cleanSlug}.asrockstudios.in/admin/login`,
    adminDirectUrl: `https://roastfuze.asrockstudios.in/admin/login`,
    isLocal: false,
  };
}
