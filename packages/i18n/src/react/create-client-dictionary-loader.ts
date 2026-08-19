type Loader<TDictionaryPages> = () => Promise<TDictionaryPages>;

type CreateClientDictionaryLoaderOptions<
  TLocale extends string,
  TDictionaryPages,
> = {
  resolveLocale: (locale: string) => TLocale;
  loaders: Record<TLocale, Loader<TDictionaryPages>>;
};

/**
 * Caches the promise rather than the resolved value so repeat calls return one
 * stable reference — `use()` reads identity, and concurrent callers share a
 * single import instead of racing one each.
 */
export const createClientDictionaryLoader = <
  TLocale extends string,
  TDictionaryPages,
>(
  options: CreateClientDictionaryLoaderOptions<TLocale, TDictionaryPages>,
) => {
  const cache = new Map<TLocale, Promise<TDictionaryPages>>();

  return (locale: string) => {
    const resolvedLocale = options.resolveLocale(locale);
    const cached = cache.get(resolvedLocale);
    if (cached) {
      return cached;
    }

    const pending = options.loaders[resolvedLocale]();
    cache.set(resolvedLocale, pending);
    // Evicted on rejection so a failed chunk load (flaky network, stale hash
    // after a deploy) retries on the next call instead of poisoning the cache.
    pending.catch(() => cache.delete(resolvedLocale));
    return pending;
  };
};
