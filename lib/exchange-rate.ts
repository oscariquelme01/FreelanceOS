const fallbackUsdToEur = 0.9;

export async function getUsdToEurRate() {
  try {
    const response = await fetch("https://api.frankfurter.app/latest?from=USD&to=EUR", { next: { revalidate: 86400 } });
    if (!response.ok) throw new Error("Exchange-rate provider failed");
    const data = await response.json() as { date?: string; rates?: { EUR?: number } };
    const rate = data.rates?.EUR;
    if (!rate || !Number.isFinite(rate)) throw new Error("Invalid exchange rate");
    return { rate, date: data.date ?? null, fallback: false };
  } catch {
    return { rate: fallbackUsdToEur, date: null, fallback: true };
  }
}
