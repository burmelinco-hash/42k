import { NextRequest, NextResponse } from "next/server";
import { generateDailyReview } from "@/lib/claude";
import {
  getPlanDay, getRunByDate, getNutritionByDate,
  getRuns, saveReview, getReviewByDate, getNoteByDate
} from "@/lib/sheets";
import { DailyReview } from "@/lib/types";
import { format } from "date-fns";
import { randomUUID } from "crypto";

// Shared review logic
async function runReview(date: string) {
  const [plannedDay, run, nutrition, allRuns, noteData] = await Promise.all([
    getPlanDay(date),
    getRunByDate(date),
    getNutritionByDate(date),
    getRuns(),
    getNoteByDate(date),
  ]);

  const weekNumber = plannedDay?.week ?? 1;
  const recentRuns = allRuns.filter(r => r.date <= date).slice(-10);

  const result = await generateDailyReview({
    date, plannedDay, run, nutrition, recentRuns, weekNumber,
    athleteNote: noteData?.note || null,
  });

  const review: DailyReview = {
    id:        randomUUID(),
    date,
    summary:   result.summary,
    score:     result.score,
    flags:     result.flags,
    source:    "auto",
    createdAt: new Date().toISOString(),
  };

  await saveReview(review);
  return review;
}

// On-demand POST — body: { date?: string }
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const date = body.date ?? format(new Date(), "yyyy-MM-dd");
    const review = await runReview(date);
    return NextResponse.json({ success: true, review });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Review failed";
    console.error("Review error:", err);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

// GET — Vercel cron calls this with x-vercel-cron header to generate; otherwise fetches existing
export async function GET(req: NextRequest) {
  try {
    const isCron = req.headers.get("x-vercel-cron") === "1";
    // Bangkok date (UTC+7)
    const bangkokDate = new Date(Date.now() + 7 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const date = req.nextUrl.searchParams.get("date") ?? bangkokDate;

    if (isCron) {
      const review = await runReview(bangkokDate);
      return NextResponse.json({ success: true, review });
    }

    const review = await getReviewByDate(date);
    return NextResponse.json({ success: true, review });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Fetch failed";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
