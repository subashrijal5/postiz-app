export interface BrandConfig {
  name: string;
  primaryColor: string;
  logo: string;
  logoText: string;
}

const BRAND_NAME = process.env.NEXT_PUBLIC_BRAND_NAME || 'publishr';
const BRAND_PRIMARY_COLOR = process.env.NEXT_PUBLIC_BRAND_PRIMARY_COLOR || '#E02822';
const BRAND_LOGO = process.env.NEXT_PUBLIC_BRAND_LOGO || '/publishr-mark.png';
const BRAND_LOGO_TEXT = process.env.NEXT_PUBLIC_BRAND_LOGO_TEXT || '/publishr-logo.png';

export const BRAND: BrandConfig = {
  name: BRAND_NAME,
  primaryColor: BRAND_PRIMARY_COLOR,
  logo: BRAND_LOGO,
  logoText: BRAND_LOGO_TEXT,
};

export const DEFAULT_BRAND_NAME = 'publishr';
export const DEFAULT_BRAND_PRIMARY_COLOR = '#E02822';
