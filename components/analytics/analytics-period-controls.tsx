"use client";

import { useRouter } from "next/navigation";

import { Select } from "@/components/ui/select";
import type { AnalyticsPeriod } from "@/lib/analytics";

export function AnalyticsPeriodControls({ year, period, years }: { year: number; period: AnalyticsPeriod; years: number[] }) {
  const router = useRouter();
  function navigate(nextYear: number, nextPeriod: AnalyticsPeriod) {
    router.replace(`/analytics?year=${nextYear}&period=${nextPeriod}`);
  }
  return <div className="flex gap-2">
    <div className="w-24"><Select aria-label="Analytics year" value={String(year)} onValueChange={(value) => navigate(Number(value), period)} options={years.map((value) => ({ value: String(value), label: String(value) }))} /></div>
    <div className="w-32"><Select aria-label="Analytics period" value={period} onValueChange={(value) => navigate(year, value as AnalyticsPeriod)} options={[{ value: "year", label: "Full year" }, { value: "q1", label: "Q1 · Jan–Mar" }, { value: "q2", label: "Q2 · Apr–Jun" }, { value: "q3", label: "Q3 · Jul–Sep" }, { value: "q4", label: "Q4 · Oct–Dec" }]} /></div>
  </div>;
}
