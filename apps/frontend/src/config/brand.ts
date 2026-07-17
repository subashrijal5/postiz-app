export interface BrandConfig {
  name: string;
  primaryColor: string;
  logo: string;
  logoText: string;
  logoTextDark: string;
}

const BRAND_NAME = process.env.NEXT_PUBLIC_BRAND_NAME || 'publishr';
const BRAND_PRIMARY_COLOR = process.env.NEXT_PUBLIC_BRAND_PRIMARY_COLOR || '#E02822';
const BRAND_LOGO = process.env.NEXT_PUBLIC_BRAND_LOGO || '/publishr-mark.png';
const BRAND_LOGO_TEXT = process.env.NEXT_PUBLIC_BRAND_LOGO_TEXT || '/publishr-logo.png';
const BRAND_LOGO_TEXT_DARK =
  process.env.NEXT_PUBLIC_BRAND_LOGO_TEXT_DARK || '/publishr-logo-dark.png';

// Static assets in /public keep their filename across releases, so browsers can
// keep serving a cached copy after a logo swap unless the URL itself changes.
// Bust that cache by tagging asset URLs with the build version.
const cacheBust = (path: string) => {
  const version = process.env.NEXT_PUBLIC_VERSION;
  if (!version || /^https?:\/\//.test(path)) return path;
  const separator = path.includes('?') ? '&' : '?';
  return `${path}${separator}v=${encodeURIComponent(version)}`;
};

export const BRAND: BrandConfig = {
  name: BRAND_NAME,
  primaryColor: BRAND_PRIMARY_COLOR,
  logo: cacheBust(BRAND_LOGO),
  logoText: cacheBust(BRAND_LOGO_TEXT),
  logoTextDark: cacheBust(BRAND_LOGO_TEXT_DARK),
};

export const DEFAULT_BRAND_NAME = 'publishr';
export const DEFAULT_BRAND_PRIMARY_COLOR = '#E02822';
