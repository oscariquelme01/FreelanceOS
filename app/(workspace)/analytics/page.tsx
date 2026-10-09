import type { Metadata } from "next";
import { connection } from "next/server";

import { AnalyticsDashboard } from "@/components/analytics/analytics-dashboard";
import { AnalyticsPeriodControls } from "@/components/analytics/analytics-period-controls";
import { db } from "@/db";
import { expenses, invoices, opportunities, opportunityStatusEvents } from "@/db/schema";
import { invoiceAnalytics, outreachAnalytics, type AnalyticsPeriod } from "@/lib/analytics";
import { getUsdToEurRate } from "@/lib/exchange-rate";
import { todayIso } from "@/lib/outreach";

export const metadata: Metadata = { title: "Analytics" };

export default async function AnalyticsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await connection();
  const params = await searchParams;
  const currentYear = new Date().getUTCFullYear();
  const requestedYear = typeof params.year === "string" ? Number.parseInt(params.year, 10) : currentYear;
  const year = Number.isInteger(requestedYear) && requestedYear >= 2000 && requestedYear <= 2100 ? requestedYear : currentYear;
  const requestedPeriod = typeof params.period === "string" ? params.period : "year";
  const period: AnalyticsPeriod = ["year", "q1", "q2", "q3", "q4"].includes(requestedPeriod) ? requestedPeriod as AnalyticsPeriod : "year";
  const [opportunityRows, eventRows, invoiceRows, expenseRows, exchangeRate] = await Promise.all([
    db.select().from(opportunities),
    db.select().from(opportunityStatusEvents),
    db.select().from(invoices),
    db.select().from(expenses),
    getUsdToEurRate(),
  ]);
  const dataYears = [...opportunityRows.map((row) => row.createdAt.getUTCFullYear()), ...invoiceRows.map((row) => Number(row.issueDate.slice(0, 4))), currentYear, year];
  const years = [...new Set(dataYears)].toSorted((a, b) => b - a);
  const outreach = outreachAnalytics(opportunityRows, eventRows, year, period, todayIso());
  const invoiceData = invoiceAnalytics(invoiceRows, expenseRows, year, period, exchangeRate.rate);

  return <div>
    <header className="flex h-14 items-center justify-between gap-4 border-b px-5 lg:px-7"><div><h1 className="text-sm font-semibold tracking-tight">Analytics</h1><p className="text-xs text-muted-foreground">Outreach performance with a lightweight invoice summary</p></div><AnalyticsPeriodControls year={year} period={period} years={years} /></header>
    <div className="p-4 lg:p-6"><AnalyticsDashboard outreach={outreach} invoices={invoiceData} exchangeRate={exchangeRate} /></div>
  </div>;
}
