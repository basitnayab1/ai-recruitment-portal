import "server-only";

const EXPORT_PAGE_SIZE = 1000;

export async function fetchAllPages<T>(
  fetchPage: (from: number, to: number) => Promise<T[]>
): Promise<T[]> {
  const results: T[] = [];
  let from = 0;

  while (true) {
    const batch = await fetchPage(from, from + EXPORT_PAGE_SIZE - 1);
    results.push(...batch);
    if (batch.length < EXPORT_PAGE_SIZE) {
      break;
    }
    from += EXPORT_PAGE_SIZE;
  }

  return results;
}
