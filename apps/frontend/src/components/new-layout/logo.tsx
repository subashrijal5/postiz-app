'use client';

import { BRAND } from '@gitroom/frontend/config/brand';

export const Logo = () => {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={BRAND.logo}
      alt={BRAND.name}
      width={60}
      height={60}
      className="mt-[8px] min-w-[60px] min-h-[60px] object-contain"
    />
  );
};
