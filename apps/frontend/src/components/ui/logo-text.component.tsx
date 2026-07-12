import React from 'react';
import { BRAND } from '@gitroom/frontend/config/brand';

export const LogoTextComponent = () => {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={BRAND.logoText}
      alt={BRAND.name}
      className="h-[33px] w-auto"
    />
  );
};
