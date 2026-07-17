export const dynamic = 'force-dynamic';
import { ReactNode } from 'react';
import loadDynamic from 'next/dynamic';
import { BRAND } from '@gitroom/frontend/config/brand';
const ReturnUrlComponent = loadDynamic(() => import('./return.url.component'));
export default async function AuthLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="bg-[#0E0E0E] flex items-center justify-center flex-1 min-h-screen w-screen text-white">
      <ReturnUrlComponent />
      <div className="w-full max-w-[440px] mx-auto px-[20px]">
        <div className="flex flex-col gap-[32px]">
          <div className="flex justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/publishr-logo-dark.png"
              alt={BRAND.name}
              className="h-[33px] w-auto"
            />
          </div>
          <div className="flex justify-center">{children}</div>
        </div>
      </div>
    </div>
  );
}
