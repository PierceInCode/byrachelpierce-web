/**
 * Words and links for the home-page mosaic's panels.
 *
 * CONTENT STATUS: the community entries and the About paragraphs were drafted
 * from public sources (Rachel's current About page, her SCCF profile, the
 * Santiva Chronicle, the Island Reporter and the Southwest Florida Wine &
 * Food Fest catalogue). They have NOT yet been confirmed by Rachel; her
 * exact titles at SCCF and CFI in particular need her sign-off before
 * go-live (see DECISIONS.md).
 */

import { SOCIAL } from '@/lib/constants';
import { PLACES } from './places';

export interface Cause {
  name: string;
  text: string;
  /** Where it is on the island, or null when there is nowhere to point. */
  place: keyof typeof PLACES | null;
}

export const CAUSES: Cause[] = [
  {
    name: 'Golisano Children’s Hospital',
    text: 'Each year she mentors the featured Child Artist at the Southwest Florida Wine & Food Fest. The painting they make is auctioned for the hospital in Fort Myers, across the causeway.',
    place: null,
  },
  {
    name: 'Sanibel-Captiva Conservation Foundation',
    text: 'She serves with SCCF and designed its S.E.A. water cans.',
    place: 'sccf',
  },
  {
    name: '“Ding” Darling National Wildlife Refuge',
    text: 'Artist in Residence in 2021. Her hand-painted shirts still sell in the nature store, with the profits going to the refuge.',
    place: 'dingDarling',
  },
  {
    name: 'Sanibel Recreation Center',
    text: 'She donated the Heron Room mural in 2026.',
    place: 'recCenter',
  },
  {
    name: 'Charitable Foundation of the Islands',
    text: 'Board member. She teamed up with FISH of Sanibel-Captiva to stock its pet pantry.',
    place: null,
  },
  {
    name: 'After Hurricane Ian',
    text: 'She turned the gallery grounds into a market for 18 island businesses and nonprofits.',
    place: 'gallery',
  },
];

/**
 * Her channel's videos page, as linked from the current byrachelpierce.com.
 * (SOCIAL.youtube in constants points at a handle URL instead; the channel
 * link is the one her live site uses.)
 */
export const YOUTUBE_VIDEOS_URL = 'https://www.youtube.com/channel/UCS-vpysj6A7F5DRqcEcCu-A/videos';

export const WATCH_LINKS = [
  { name: 'YouTube', note: 'Her channel', href: YOUTUBE_VIDEOS_URL },
  {
    name: 'Facebook',
    note: 'Live painting sessions',
    href: 'https://www.facebook.com/byrachelpierce/videos',
  },
  { name: 'Instagram', note: 'Reels', href: 'https://www.instagram.com/by_rachelpierce/reels/' },
] as const;

export const SOCIAL_LINKS = [
  { name: 'Facebook', href: SOCIAL.facebook },
  { name: 'Instagram', href: SOCIAL.instagram },
  { name: 'YouTube', href: YOUTUBE_VIDEOS_URL },
] as const;

export const ABOUT_PARAGRAPHS = [
  'Rachel Pierce is a lifelong artist who spent 19 years in television news, 17 of them at the anchor desk, most recently at NBC-2 in Fort Myers. In 2020 she left to paint full time, and in January 2022 she opened her gallery on Sanibel.',
  'She paints in oil and acrylic: sea turtles, shorebirds, palms and the light of the Southwest Florida coast. She lives there with her husband and their four children.',
] as const;
