import Decimal from "decimal.js";

export type CalculationItem = {
  description: string;
  quantity: string | number;
  unitPrice: string | number;
};

export function eurosToCents(value: string | number) {
  return new Decimal(value || 0).mul(100).toDecimalPlaces(0, Decimal.ROUND_HALF_UP).toNumber();
}

export function centsToInput(cents: number | null | undefined) {
  if (cents == null) return "";
  return new Decimal(cents).div(100).toFixed(2);
}

export function calculateInvoice(
  items: CalculationItem[],
  vatEnabled: boolean,
  vatRate: number,
  withholdingEnabled: boolean,
  withholdingRate: number,
) {
  const calculatedItems = items.map((item, position) => {
    const quantity = new Decimal(item.quantity || 0);
    const unitPriceCents = eurosToCents(item.unitPrice);
    const amountCents = quantity
      .mul(unitPriceCents)
      .toDecimalPlaces(0, Decimal.ROUND_HALF_UP)
      .toNumber();
    return { ...item, quantity: quantity.toFixed(3), unitPriceCents, amountCents, position };
  });
  const subtotalCents = calculatedItems.reduce((sum, item) => sum + item.amountCents, 0);
  const vatCents = vatEnabled
    ? new Decimal(subtotalCents).mul(vatRate).div(10000).toDecimalPlaces(0, Decimal.ROUND_HALF_UP).toNumber()
    : 0;
  const withholdingCents = withholdingEnabled
    ? new Decimal(subtotalCents)
        .mul(withholdingRate)
        .div(10000)
        .toDecimalPlaces(0, Decimal.ROUND_HALF_UP)
        .toNumber()
    : 0;
  return {
    items: calculatedItems,
    subtotalCents,
    vatCents,
    withholdingCents,
    totalCents: subtotalCents + vatCents - withholdingCents,
  };
}

export function formatMoney(cents: number, currency: "EUR" | "USD", locale = "es-ES") {
  return new Intl.NumberFormat(locale, { style: "currency", currency }).format(cents / 100);
}
