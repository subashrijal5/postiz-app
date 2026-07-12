'use client';

import React, { FC, useCallback, useEffect, useMemo, useState } from 'react';
import useSWR from 'swr';
import { useFetch } from '@gitroom/helpers/utils/custom.fetch';
import { useVariables } from '@gitroom/react/helpers/variable.context';
import { loadStripe, Stripe } from '@stripe/stripe-js';
import { OrganizationSelector } from '@gitroom/frontend/components/layout/organization.selector';
import { LanguageComponent } from '@gitroom/frontend/components/layout/language.component';
import { AttachToFeedbackIcon } from '@gitroom/frontend/components/new-layout/sentry.feedback.component';
import NotificationComponent from '@gitroom/frontend/components/notifications/notification.component';
import dynamic from 'next/dynamic';
import { LogoTextComponent } from '@gitroom/frontend/components/ui/logo-text.component';
import { pricing } from '@gitroom/nestjs-libraries/database/prisma/subscriptions/pricing';
import { capitalize } from 'lodash';
import clsx from 'clsx';
import { LoadingComponent } from '@gitroom/frontend/components/layout/loading';
import { CheckIconComponent } from '@gitroom/frontend/components/ui/check.icon.component';
import {
  FAQComponent,
  FAQSection,
} from '@gitroom/frontend/components/billing/faq.component';
import { useT } from '@gitroom/react/translation/get.transation.service.client';
import { useUser } from '@gitroom/frontend/components/layout/user.context';
import { useDubClickId } from '@gitroom/frontend/components/layout/dubAnalytics';
import useCookie from 'react-use-cookie';
import { LogoutComponent } from '@gitroom/frontend/components/layout/logout.component';
import { DeveloperIconComponent } from '@gitroom/frontend/components/developer/developer.icon.component';
import i18next from 'i18next';
import type { StripeElementLocale } from '@stripe/stripe-js';

// Static display-only approximation for showing JP customers roughly what a
// USD price costs in yen. Billing itself always stays USD via Stripe.
const USD_TO_JPY_RATE = 155;

// i18next language codes we ship all map 1:1 onto Stripe's supported locales.
const STRIPE_SUPPORTED_LOCALES: StripeElementLocale[] = [
  'en',
  'he',
  'ru',
  'zh',
  'fr',
  'es',
  'pt',
  'de',
  'it',
  'ja',
  'ko',
  'ar',
  'tr',
  'vi',
];
const toStripeLocale = (lang?: string): StripeElementLocale =>
  STRIPE_SUPPORTED_LOCALES.includes(lang as StripeElementLocale)
    ? (lang as StripeElementLocale)
    : 'auto';

const ModeComponent = dynamic(
  () => import('@gitroom/frontend/components/layout/mode.component'),
  {
    ssr: false,
  }
);

const EmbeddedBilling = dynamic(
  () =>
    import('@gitroom/frontend/components/billing/embedded.billing').then(
      (mod) => mod.EmbeddedBilling
    ),
  {
    ssr: false,
  }
);

export const FirstBillingComponent = () => {
  const { stripeClient } = useVariables();
  const user = useUser();
  const dub = useDubClickId();
  const [stripe, setStripe] = useState<null | Promise<Stripe>>(null);
  const [tier, setTier] = useState('STANDARD');
  const [period, setPeriod] = useState('MONTHLY');
  const fetch = useFetch();
  const t = useT();
  const [datafast_visitor_id] = useCookie('datafast_visitor_id', '');
  const [datafast_session_id] = useCookie('datafast_session_id', '');
  // useT() re-renders this component on language change, so this stays fresh.
  const currentLanguage = i18next.resolvedLanguage;

  useEffect(() => {
    setStripe(
      loadStripe(stripeClient, { locale: toStripeLocale(currentLanguage) })
    );
  }, [currentLanguage]);

  const loadCheckout = useCallback(async () => {
    return (
      await fetch('/billing/embedded', {
        method: 'POST',
        body: JSON.stringify({
          billing: tier,
          period: period,
          ...(datafast_visitor_id && datafast_session_id
            ? { datafast_visitor_id, datafast_session_id }
            : {}),
          ...(dub ? { dub } : {}),
        }),
      })
    ).json();
  }, [tier, period]);

  const { data, isLoading } = useSWR(
    `/billing-${tier}-${period}`,
    loadCheckout,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      revalidateIfStale: false,
      refreshWhenOffline: false,
      refreshWhenHidden: false,
    }
  );

  const price = useMemo(
    () => Object.entries(pricing).filter(([key, value]) => key !== 'FREE'),
    []
  );

  const tierName = useCallback(
    (key: string) => t(`billing_tier_${key.toLowerCase()}`, capitalize(key)),
    [t]
  );

  const JoinOver = () => {
    return (
      <>
        <div className="inline-flex items-center gap-[8px] w-fit rounded-full border border-newColColor px-[14px] py-[6px] mb-[20px] text-[13px] font-[500] text-textItemBlur">
          <span className="w-[6px] h-[6px] rounded-full bg-[#618DFF]" />
          {t('billing_hero_kicker', 'Social Media, Simplified')}
        </div>
        <div className="text-[44px] font-[500] leading-[122%] tracking-[-0.01em] tablet:text-[34px] mobile:!text-[28px] whitespace-pre-line text-balance">
          {t('billing_hero_headline_start', 'Grow your social presence,')}{' '}
          <span className="text-[#618DFF]">
            {t('billing_hero_headline_accent', 'with confidence')}
          </span>
        </div>
        <div className="mt-[16px] text-[17px] leading-[155%] text-textItemBlur max-w-[440px]">
          {t(
            'billing_hero_subline',
            'Plan, publish, and manage every channel from one calm, powerful workspace.'
          )}
        </div>

        {!!user?.allowTrial && (
          <div className="flex flex-wrap gap-x-[24px] gap-y-[10px] mt-[28px] mb-[10px] tablet:mt-[28px] tablet:mb-[32px] text-[14px] text-textItemBlur">
            <div className="flex items-center gap-[8px]">
              <CheckIconComponent />
              <div>{t('billing_no_risk_trial', '100% No-Risk Free Trial')}</div>
            </div>
            <div className="flex items-center gap-[8px]">
              <CheckIconComponent />
              <div>
                {t(
                  'billing_pay_nothing_7_days',
                  'Pay NOTHING for the first 7-days'
                )}
              </div>
            </div>
            <div className="flex items-center gap-[8px]">
              <CheckIconComponent />
              <div>
                {t('billing_cancel_anytime', 'Cancel anytime, from settings')}
              </div>
            </div>
          </div>
        )}
      </>
    );
  };

  return (
    <div className="blurMe flex flex-1 flex-col bg-newBgColorInner pb-[60px] mobile:pb-[100px]">
      <div className="h-[92px] px-[80px] tablet:px-[32px] mobile:!px-[16px] py-[20px] flex border-b border-newColColor">
        <div className="flex-1 flex items-center text-textColor">
          <LogoTextComponent />
        </div>
        <div className="flex items-center">
          <div className="flex gap-[20px] text-textItemBlur">
            <OrganizationSelector />
            <div className="hover:text-newTextColor">
              <ModeComponent />
            </div>
            <div className="w-[1px] h-[20px] bg-blockSeparator" />
            <LanguageComponent />
            <div className="w-[1px] h-[20px] bg-blockSeparator" />
            <AttachToFeedbackIcon />
            <DeveloperIconComponent />
            {/*<NotificationComponent />*/}
            <div className="hover:text-newTextColor">
              {user?.tier.current === 'FREE' && (
                <LogoutComponent isIcon={true} />
              )}
            </div>
          </div>
        </div>
      </div>
      <div className="flex px-[80px] tablet:px-[32px] mobile:!px-[16px] flex-1 flex-row tablet:flex-none tablet:flex-col-reverse">
        <div className="flex-1 py-[40px] tablet:pt-[80px] flex flex-col pe-[40px] tablet:pe-0">
          <div className="block tablet:hidden">
            <JoinOver />
          </div>
          {!isLoading && data && stripe ? (
            <EmbeddedBilling
              stripe={stripe}
              secret={data.client_secret}
              showCoupon={period === 'MONTHLY'}
              autoApplyCoupon={data.auto_apply_coupon}
              planName={tierName(tier)}
            />
          ) : (
            <LoadingComponent />
          )}
        </div>
        <div className="flex flex-col ps-[40px] tablet:!ps-[0] border-l border-newColColor py-[40px] mobile:!pt-[24px] tablet:border-none tablet:pb-0">
          <div className="top-[20px] sticky">
            <div className="hidden tablet:block">
              <JoinOver />
            </div>
            <div className="rounded-[24px] border border-newColColor bg-newBgColorInner p-[28px] tablet:p-[18px] mobile:!p-[18px]">
              <div className="flex mb-[28px] mobile:flex-col">
                <div className="flex-1 text-[22px] font-[500]">
                  {t('billing_choose_plan', 'Choose a Plan')}
                </div>
                <div className="h-[44px] px-[6px] mobile:px-0 flex items-center justify-center mobile:justify-start gap-[12px] border border-newColColor rounded-[12px] select-none">
                  <div
                    className={clsx(
                      'h-[32px] mobile:flex-1 rounded-[6px] text-[16px] px-[12px] flex justify-center items-center',
                      period === 'MONTHLY'
                        ? 'bg-boxFocused text-textItemFocused'
                        : 'cursor-pointer'
                    )}
                    onClick={() => setPeriod('MONTHLY')}
                  >
                    {t('billing_monthly', 'Monthly')}
                  </div>
                  <div
                    className={clsx(
                      'gap-[10px] h-[32px] mobile:flex-1 rounded-[6px] text-[16px] px-[12px] flex justify-center items-center',
                      period === 'YEARLY'
                        ? 'bg-boxFocused text-textItemFocused'
                        : 'cursor-pointer'
                    )}
                    onClick={() => setPeriod('YEARLY')}
                  >
                    <div>{t('billing_yearly', 'Yearly')}</div>
                    <div className="text-[#618DFF] text-[13px] mobile:hidden">
                      {t('billing_20_percent_off', '20% Off')}
                    </div>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-[10px] mobile:!grid-cols-1 tablet:grid-cols-4">
                {price.map(([key, value]) => {
                  const currentPrice =
                    value[period === 'MONTHLY' ? 'month_price' : 'year_price'];
                  const selected = key === tier;
                  return (
                    <div
                      onClick={() => setTier(key)}
                      key={key}
                      className={clsx(
                        'relative cursor-pointer select-none w-full min-h-[144px] tablet:h-auto mobile:!h-auto p-[20px] rounded-[16px] flex flex-col gap-[4px] transition-colors duration-150',
                        selected
                          ? 'border border-[#618DFF] bg-boxFocused/5'
                          : 'border border-newColColor hover:border-textItemBlur'
                      )}
                    >
                      {selected && (
                        <div className="absolute top-[16px] right-[16px] w-[18px] h-[18px] rounded-full border border-[#618DFF] flex items-center justify-center">
                          <div className="w-[8px] h-[8px] rounded-full bg-[#618DFF]" />
                        </div>
                      )}
                      <div className="text-[16px] font-[500] text-textItemBlur">
                        {tierName(key)}
                      </div>
                      <div className="text-[22px] font-[400] mt-[4px]">
                        <span className="text-[32px] font-[500]">
                          ${currentPrice}
                        </span>{' '}
                        <span className="text-[14px] text-textItemBlur">
                          {period === 'MONTHLY'
                            ? t('billing_per_month', '/ month')
                            : t('billing_per_year', '/ year')}
                        </span>
                      </div>
                      {i18next.resolvedLanguage === 'ja' && (
                        <div className="text-[13px] text-textItemBlur">
                          {t('billing_approx_jpy', '約')} ¥
                          {(currentPrice * USD_TO_JPY_RATE).toLocaleString(
                            'ja-JP'
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              <div className="flex flex-col mt-[36px] gap-[16px]">
                <div className="text-[22px] font-[500]">
                  {t('billing_features', 'Features')}
                </div>
                <BillingFeatures tier={tier} />
              </div>
            </div>
            <div className="flex flex-col mt-[32px] mobile:hidden tablet:hidden">
              <FAQComponent />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

type FeatureItem = {
  key: string;
  defaultValue: string;
  prefix?: string | number;
};

export const BillingFeatures: FC<{ tier: string }> = ({ tier }) => {
  const t = useT();
  const features = useMemo(() => {
    const currentPricing = pricing[tier];
    const channelsOr = currentPricing.channel;
    const list: FeatureItem[] = [];

    list.push({
      key: channelsOr === 1 ? 'billing_channel' : 'billing_channels',
      defaultValue: channelsOr === 1 ? 'channel' : 'channels',
      prefix: channelsOr,
    });

    list.push({
      key: 'billing_posts_per_month',
      defaultValue: 'posts per month',
      prefix:
        currentPricing.posts_per_month > 10000
          ? 'unlimited'
          : currentPricing.posts_per_month,
    });

    if (currentPricing.team_members) {
      list.push({
        key: 'billing_unlimited_team_members',
        defaultValue: 'Unlimited team members',
      });
    }
    if (currentPricing?.ai) {
      list.push({
        key: 'billing_ai_auto_complete',
        defaultValue: 'AI auto-complete',
      });
      list.push({ key: 'billing_ai_copilots', defaultValue: 'AI copilots' });
      list.push({
        key: 'billing_ai_autocomplete',
        defaultValue: 'AI Autocomplete',
      });
    }
    list.push({
      key: 'billing_advanced_picture_editor',
      defaultValue: 'Advanced Picture Editor',
    });
    if (currentPricing?.image_generator) {
      list.push({
        key: 'billing_ai_images_per_month',
        defaultValue: 'AI Images per month',
        prefix: currentPricing?.image_generation_count,
      });
    }
    if (currentPricing?.generate_videos) {
      list.push({
        key: 'billing_ai_videos_per_month',
        defaultValue: 'AI Videos per month',
        prefix: currentPricing?.generate_videos,
      });
    }
    return list;
  }, [tier]);

  const renderFeature = (feature: FeatureItem) => {
    const translatedText = t(feature.key, feature.defaultValue);
    if (feature.prefix === 'unlimited') {
      return `${t('billing_unlimited', 'Unlimited')} ${translatedText}`;
    }
    if (feature.prefix !== undefined) {
      return `${feature.prefix} ${translatedText}`;
    }
    return translatedText;
  };

  return (
    <div className="grid grid-cols-2 mobile:grid-cols-1 gap-y-[8px] gap-x-[32px]">
      {features.map((feature) => (
        <div key={feature.key} className="flex items-center gap-[8px]">
          <div>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="17"
              height="17"
              viewBox="0 0 17 17"
              fill="none"
            >
              <path
                d="M11.825 0H4.84167C1.80833 0 0 1.80833 0 4.84167V11.8167C0 14.8583 1.80833 16.6667 4.84167 16.6667H11.8167C14.85 16.6667 16.6583 14.8583 16.6583 11.825V4.84167C16.6667 1.80833 14.8583 0 11.825 0ZM12.3167 6.41667L7.59167 11.1417C7.475 11.2583 7.31667 11.325 7.15 11.325C6.98333 11.325 6.825 11.2583 6.70833 11.1417L4.35 8.78333C4.10833 8.54167 4.10833 8.14167 4.35 7.9C4.59167 7.65833 4.99167 7.65833 5.23333 7.9L7.15 9.81667L11.4333 5.53333C11.675 5.29167 12.075 5.29167 12.3167 5.53333C12.5583 5.775 12.5583 6.16667 12.3167 6.41667Z"
                fill="currentColor"
              />
            </svg>
          </div>
          <div>{renderFeature(feature)}</div>
        </div>
      ))}
    </div>
  );
};
