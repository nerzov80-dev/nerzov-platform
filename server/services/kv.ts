export interface KVEnv {
  CACHE_KV: KVNamespace;
}

export function getCache(env: KVEnv): KVNamespace {
  return env.CACHE_KV;
}

export const kvKeys = {
  landingPageHtml: (slug: string) => `lp:html:${slug}`,
  visitor: (landingPageId: string, date: string) =>
    `visitor:${landingPageId}:${date}`,
  usage: (date: string) => `usage:${date}`,
};
