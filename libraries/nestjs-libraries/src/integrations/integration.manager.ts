import 'reflect-metadata';

import { Injectable } from '@nestjs/common';
import { XProvider } from '@gitroom/nestjs-libraries/integrations/social/x.provider';
import { SocialProvider } from '@gitroom/nestjs-libraries/integrations/social/social.integrations.interface';
import { LinkedinProvider } from '@gitroom/nestjs-libraries/integrations/social/linkedin.provider';
import { RedditProvider } from '@gitroom/nestjs-libraries/integrations/social/reddit.provider';
import { DevToProvider } from '@gitroom/nestjs-libraries/integrations/social/dev.to.provider';
import { HashnodeProvider } from '@gitroom/nestjs-libraries/integrations/social/hashnode.provider';
import { MediumProvider } from '@gitroom/nestjs-libraries/integrations/social/medium.provider';
import { FacebookProvider } from '@gitroom/nestjs-libraries/integrations/social/facebook.provider';
import { InstagramProvider } from '@gitroom/nestjs-libraries/integrations/social/instagram.provider';
import { YoutubeProvider } from '@gitroom/nestjs-libraries/integrations/social/youtube.provider';
import { TiktokProvider } from '@gitroom/nestjs-libraries/integrations/social/tiktok.provider';
import { PinterestProvider } from '@gitroom/nestjs-libraries/integrations/social/pinterest.provider';
import { DribbbleProvider } from '@gitroom/nestjs-libraries/integrations/social/dribbble.provider';
import { LinkedinPageProvider } from '@gitroom/nestjs-libraries/integrations/social/linkedin.page.provider';
import { ThreadsProvider } from '@gitroom/nestjs-libraries/integrations/social/threads.provider';
import { DiscordProvider } from '@gitroom/nestjs-libraries/integrations/social/discord.provider';
import { SlackProvider } from '@gitroom/nestjs-libraries/integrations/social/slack.provider';
import { MastodonProvider } from '@gitroom/nestjs-libraries/integrations/social/mastodon.provider';
import { BlueskyProvider } from '@gitroom/nestjs-libraries/integrations/social/bluesky.provider';
import { LemmyProvider } from '@gitroom/nestjs-libraries/integrations/social/lemmy.provider';
import { InstagramStandaloneProvider } from '@gitroom/nestjs-libraries/integrations/social/instagram.standalone.provider';
import { FarcasterProvider } from '@gitroom/nestjs-libraries/integrations/social/farcaster.provider';
import { TelegramProvider } from '@gitroom/nestjs-libraries/integrations/social/telegram.provider';
import { NostrProvider } from '@gitroom/nestjs-libraries/integrations/social/nostr.provider';
import { VkProvider } from '@gitroom/nestjs-libraries/integrations/social/vk.provider';
import { WordpressProvider } from '@gitroom/nestjs-libraries/integrations/social/wordpress.provider';
import { ListmonkProvider } from '@gitroom/nestjs-libraries/integrations/social/listmonk.provider';
import { GmbProvider } from '@gitroom/nestjs-libraries/integrations/social/gmb.provider';
import { KickProvider } from '@gitroom/nestjs-libraries/integrations/social/kick.provider';
import { TwitchProvider } from '@gitroom/nestjs-libraries/integrations/social/twitch.provider';
import { SocialAbstract } from '@gitroom/nestjs-libraries/integrations/social.abstract';
import { MoltbookProvider } from '@gitroom/nestjs-libraries/integrations/social/moltbook.provider';
import { SkoolProvider } from '@gitroom/nestjs-libraries/integrations/social/skool.provider';
import { WhopProvider } from '@gitroom/nestjs-libraries/integrations/social/whop.provider';
import { MeweProvider } from '@gitroom/nestjs-libraries/integrations/social/mewe.provider';
import { TumblrProvider } from '@gitroom/nestjs-libraries/integrations/social/tumblr.provider';

export const socialIntegrationList: Array<SocialAbstract & SocialProvider> = [
  new XProvider(),
  new LinkedinProvider(),
  new LinkedinPageProvider(),
  new RedditProvider(),
  new InstagramProvider(),
  new InstagramStandaloneProvider(),
  new FacebookProvider(),
  new ThreadsProvider(),
  new YoutubeProvider(),
  new GmbProvider(),
  new TiktokProvider(),
  new PinterestProvider(),
  new DribbbleProvider(),
  new DiscordProvider(),
  new SlackProvider(),
  new KickProvider(),
  new TwitchProvider(),
  new MastodonProvider(),
  new BlueskyProvider(),
  new LemmyProvider(),
  new FarcasterProvider(),
  new TelegramProvider(),
  new NostrProvider(),
  new VkProvider(),
  new MediumProvider(),
  new DevToProvider(),
  new HashnodeProvider(),
  new WordpressProvider(),
  new ListmonkProvider(),
  new MoltbookProvider(),
  new WhopProvider(),
  new SkoolProvider(),
  new MeweProvider(),
  new TumblrProvider(),
  // new MastodonCustomProvider(),
];

/**
 * Server-side credentials a provider needs before we offer it in the "add a
 * channel" picker. Without them the OAuth flow dies with an opaque "Could not
 * connect to the platform" toast, so it is friendlier to hide the icon.
 *
 * Groups are AND-ed, variables inside a group are OR-ed:
 * `[['A', 'B'], ['C']]` means "(A or B) and C". The OR form exists for
 * providers that fall back to another provider's credentials, e.g. `gmb`
 * reading `YOUTUBE_CLIENT_ID` when `GOOGLE_GMB_CLIENT_ID` is unset.
 *
 * Identifiers missing from this map are always offered — they either need no
 * credentials or collect them per-channel from the user via `customFields`
 * (bluesky, devto, hashnode, lemmy, listmonk, medium, moltbook, nostr, skool,
 * wordpress, mastodon-custom).
 *
 * Only real credentials belong here. Never add feature flags
 * (`DISABLE_X_ANALYTICS`, `STRIP_LINKS_FROM_X_POSTS`), shared infrastructure
 * (`FRONTEND_URL`, `STORAGE_PROVIDER`) or variables the provider already
 * defaults (`MASTODON_URL`, `MEWE_HOST`, `X_URL`) — gating on those would hide
 * providers that work perfectly well.
 */
export const socialProviderRequiredEnv: Record<string, string[][]> = {
  x: [['X_API_KEY'], ['X_API_SECRET']],
  linkedin: [['LINKEDIN_CLIENT_ID'], ['LINKEDIN_CLIENT_SECRET']],
  'linkedin-page': [['LINKEDIN_CLIENT_ID'], ['LINKEDIN_CLIENT_SECRET']],
  reddit: [['REDDIT_CLIENT_ID'], ['REDDIT_CLIENT_SECRET']],
  facebook: [['FACEBOOK_APP_ID'], ['FACEBOOK_APP_SECRET']],
  instagram: [['FACEBOOK_APP_ID'], ['FACEBOOK_APP_SECRET']],
  'instagram-standalone': [['INSTAGRAM_APP_ID'], ['INSTAGRAM_APP_SECRET']],
  threads: [['THREADS_APP_ID'], ['THREADS_APP_SECRET']],
  youtube: [['YOUTUBE_CLIENT_ID'], ['YOUTUBE_CLIENT_SECRET']],
  gmb: [
    ['GOOGLE_GMB_CLIENT_ID', 'YOUTUBE_CLIENT_ID'],
    ['GOOGLE_GMB_CLIENT_SECRET', 'YOUTUBE_CLIENT_SECRET'],
  ],
  tiktok: [['TIKTOK_CLIENT_ID'], ['TIKTOK_CLIENT_SECRET']],
  pinterest: [['PINTEREST_CLIENT_ID'], ['PINTEREST_CLIENT_SECRET']],
  dribbble: [['DRIBBBLE_CLIENT_ID'], ['DRIBBBLE_CLIENT_SECRET']],
  discord: [
    ['DISCORD_CLIENT_ID'],
    ['DISCORD_CLIENT_SECRET'],
    ['DISCORD_BOT_TOKEN_ID'],
  ],
  slack: [['SLACK_ID'], ['SLACK_SECRET']],
  kick: [['KICK_CLIENT_ID'], ['KICK_SECRET']],
  twitch: [['TWITCH_CLIENT_ID'], ['TWITCH_CLIENT_SECRET']],
  mastodon: [['MASTODON_CLIENT_ID'], ['MASTODON_CLIENT_SECRET']],
  wrapcast: [['NEYNAR_CLIENT_ID'], ['NEYNAR_SECRET_KEY']],
  telegram: [['TELEGRAM_TOKEN']],
  vk: [['VK_ID']],
  tumblr: [['TUMBLR_CLIENT_ID'], ['TUMBLR_CLIENT_SECRET']],
  mewe: [['MEWE_APP_ID'], ['MEWE_API_KEY']],
  whop: [['WHOP_CLIENT_ID']],
};

export const isSocialProviderConfigured = (identifier: string) =>
  (socialProviderRequiredEnv[identifier] || []).every((group) =>
    group.some((name) => !!process.env[name])
  );

@Injectable()
export class IntegrationManager {
  // Only the channel picker uses this. `getAllowedSocialsIntegrations` is
  // deliberately left unfiltered so existing channels keep posting and
  // refreshing even if their credentials go missing.
  async getAllIntegrations() {
    return {
      social: await Promise.all(
        socialIntegrationList
          .filter((p) => isSocialProviderConfigured(p.identifier))
          .map(async (p) => ({
            name: p.name,
            identifier: p.identifier,
            toolTip: p.toolTip,
            editor: p.editor,
            isExternal: !!p.externalUrl,
            isWeb3: !!p.isWeb3,
            isChromeExtension: !!p.isChromeExtension,
            ...(p.extensionCookies
              ? { extensionCookies: p.extensionCookies }
              : {}),
            ...(p.customFields
              ? { customFields: await p.customFields() }
              : {}),
          }))
      ),
      article: [] as any[],
    };
  }

  getAllTools(): {
    [key: string]: {
      description: string;
      dataSchema: any;
      methodName: string;
    }[];
  } {
    return socialIntegrationList.reduce(
      (all, current) => ({
        ...all,
        [current.identifier]:
          Reflect.getMetadata('custom:tool', current.constructor.prototype) ||
          [],
      }),
      {}
    );
  }

  getAllRulesDescription(): {
    [key: string]: string;
  } {
    return socialIntegrationList.reduce(
      (all, current) => ({
        ...all,
        [current.identifier]:
          Reflect.getMetadata(
            'custom:rules:description',
            current.constructor
          ) || '',
      }),
      {}
    );
  }

  getAllPlugs() {
    return socialIntegrationList
      .map((p) => {
        return {
          name: p.name,
          identifier: p.identifier,
          plugs: (
            Reflect.getMetadata('custom:plug', p.constructor.prototype) || []
          )
            .filter((f: any) => !f.disabled)
            .map((p: any) => ({
              ...p,
              fields: p.fields.map((c: any) => ({
                ...c,
                validation: c?.validation?.toString(),
              })),
            })),
        };
      })
      .filter((f) => f.plugs.length);
  }

  getInternalPlugs(providerName: string) {
    const p = socialIntegrationList.find((p) => p.identifier === providerName)!;
    return {
      internalPlugs:
        (
          Reflect.getMetadata(
            'custom:internal_plug',
            p.constructor.prototype
          ) || []
        ).filter((f: any) => !f.disabled) || [],
    };
  }

  getAllowedSocialsIntegrations() {
    return socialIntegrationList.map((p) => p.identifier);
  }
  getSocialIntegration(integration: string): SocialProvider {
    return socialIntegrationList.find((i) => i.identifier === integration)!;
  }
}
