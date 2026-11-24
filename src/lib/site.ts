import { hrefFor } from './route'

/** The primary public address; shared links and SEO tags point here from every host. */
export const SITE_URL = 'https://data-detective.pages.dev/'

/** A link for a shared scorecard or quiz invite: it opens the quiz or theme ready to play, and tells analytics the visit came from a share. */
export function shareLink(params: Record<string, string>, card: 'quiz' | 'theme' | 'invite') {
  const url = new URL(SITE_URL)
  url.hash = hrefFor('discover', { ...params, from: 'share', card })
  return url.href
}
