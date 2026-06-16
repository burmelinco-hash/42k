"use client";
import { useEffect, useState, useRef } from "react";
import { format, parseISO, differenceInDays } from "date-fns";

function getBangkokDate() {
  return new Date(Date.now() + 7 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

const TYPE_COLOR: Record<string, string> = {
  long:     "var(--blue)",
  easy:     "var(--green)",
  medium:   "var(--orange)",
  tempo:    "var(--orange)",
  interval: "var(--red)",
  rest:     "#636366",
  recovery: "var(--teal)",
  race:     "var(--yellow)",
  football: "var(--purple)",
};

const TYPE_BG: Record<string, string> = {
  long:     "rgba(10,132,255,0.15)",
  easy:     "rgba(45,212,191,0.15)",
  medium:   "rgba(255,159,10,0.15)",
  tempo:    "rgba(255,159,10,0.15)",
  interval: "rgba(255,55,95,0.15)",
  rest:     "rgba(99,99,102,0.15)",
  recovery: "rgba(100,210,255,0.15)",
  race:     "rgba(255,214,10,0.15)",
  football: "rgba(191,90,242,0.15)",
};

export default function PlanPage() {
  const today = getBangkokDate();
  const [plan, setPlan]   = useState<any[]>([]);
  const [runs, setRuns]   = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [openWeeks, setOpenWeeks] = useState<Set<number>>(new Set());
  const currentWeekRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/sheets?type=history").then(r => r.json()).then(d => {
      if (d.success) { setPlan(d.plan ?? []); setRuns(d.runs ?? []); }
      setLoading(false);
    });
  }, []);

  // Find current week number
  const currentWeekNum = (() => {
    const todayPlan = plan.find(d => d.date === today);
    return todayPlan?.week ?? null;
  })();

  // Auto-open current week on load
  useEffect(() => {
    if (currentWeekNum) {
      setOpenWeeks(new Set([currentWeekNum]));
      setTimeout(() => currentWeekRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 300);
    }
  }, [currentWeekNum]);

  const runMap: Record<string, any[]> = {};
  runs.filter(r => r.distanceKm >= 1).forEach(r => {
    if (!runMap[r.date]) runMap[r.date] = [];
    runMap[r.date].push(r);
  });

  // Group plan by week
  const weeks: Record<number, any[]> = {};
  plan.forEach(d => {
    if (!weeks[d.week]) weeks[d.week] = [];
    weeks[d.week].push(d);
  });

  const weekNumbers = Object.keys(weeks).map(Number).sort((a, b) => a - b);

  // Stats
  const RACE_DATE      = "2026-11-29";
  const totalDays      = 182;
  const daysToRace     = differenceInDays(parseISO(RACE_DATE), parseISO(today));
  const doneDays       = plan.filter(d => d.date <= today && d.type !== "rest" && runMap[d.date]).length;
  const totalPlannedKm = plan.reduce((s, d) => s + (d.distanceKm ?? 0), 0);
  const totalActualKm  = runs.reduce((s, r) => s + (r.distanceKm ?? 0), 0);

  const toggleWeek = (w: number) => {
    setOpenWeeks(prev => {
      const next = new Set(prev);
      if (next.has(w)) next.delete(w); else next.add(w);
      return next;
    });
  };

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh" }}>
      <div style={{ fontSize: 13, color: "rgba(235,235,245,0.5)", fontFamily: "var(--font-dm-mono)" }}>Loading…</div>
    </div>
  );

  return (
    <div style={{ padding: "0 0 8px" }}>

      {/* Header */}
      <div style={{
        position: "sticky", top: 0, zIndex: 20,
        background: "rgba(0,0,0,0.85)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        padding: "14px 20px 12px",
      }}>
        <div style={{ fontSize: 12, fontFamily: "var(--font-dm-mono)", color: "rgba(235,235,245,0.5)", letterSpacing: 1, textTransform: "uppercase", marginBottom: 2 }}>
          26-Week Program
        </div>
        <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 10 }}>Training Plan</div>

        {/* Progress bar */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ flex: 1, height: 4, background: "rgba(255,255,255,0.08)", borderRadius: 2, overflow: "hidden" }}>
            <div style={{
              height: "100%", borderRadius: 2,
              width: `${Math.min(100, (doneDays / totalDays) * 100).toFixed(1)}%`,
              background: "linear-gradient(90deg, var(--green), var(--teal))",
              transition: "width 600ms ease",
            }} />
          </div>
          <span style={{ fontSize: 11, fontFamily: "var(--font-dm-mono)", color: "rgba(235,235,245,0.5)", whiteSpace: "nowrap" }}>
            {doneDays} / {totalDays} days
          </span>
        </div>
      </div>

      {/* Race countdown */}
      <div style={{ padding: "12px 16px 0" }}>
        <div className="card" style={{
          padding: "12px 16px",
          background: "linear-gradient(135deg, rgba(255,159,10,0.1), rgba(255,55,95,0.06))",
          border: "1px solid rgba(255,159,10,0.2)",
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <div>
            <div style={{ fontSize: 10, fontFamily: "var(--font-dm-mono)", color: "rgba(235,235,245,0.5)", letterSpacing: 1, textTransform: "uppercase" }}>Race Day</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: "rgba(235,235,245,0.8)", marginTop: 2 }}>Amazing Bangkok Marathon</div>
            <div style={{ fontSize: 11, color: "rgba(235,235,245,0.45)", fontFamily: "var(--font-dm-mono)", marginTop: 1 }}>Sun, Nov 29, 2026 · Confirmed ✓</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 32, fontWeight: 800, color: "var(--orange)", lineHeight: 1 }}>{daysToRace}</div>
            <div style={{ fontSize: 10, color: "rgba(235,235,245,0.5)", fontFamily: "var(--font-dm-mono)", marginTop: 2 }}>days left</div>
          </div>
        </div>
      </div>

      {/* Total stats */}
      <div style={{ padding: "8px 16px 4px", display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
        {[
          { label: "Runs Done", value: doneDays, unit: "sessions" },
          { label: "Actual km", value: totalActualKm.toFixed(0), unit: "km" },
          { label: "Planned km", value: totalPlannedKm.toFixed(0), unit: "km" },
        ].map(s => (
          <div key={s.label} className="card" style={{ padding: "12px 10px", textAlign: "center" }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: "var(--label)", lineHeight: 1 }}>{s.value}</div>
            <div style={{ fontSize: 9, color: "rgba(235,235,245,0.45)", fontFamily: "var(--font-dm-mono)", textTransform: "uppercase", marginTop: 4, letterSpacing: 0.8 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Week list */}
      <div style={{ padding: "8px 16px", display: "flex", flexDirection: "column", gap: 8 }}>
        {weekNumbers.map(weekNum => {
          const days = [...(weeks[weekNum] ?? [])].sort((a, b) => a.date.localeCompare(b.date));
          const isCurrentWeek = weekNum === currentWeekNum;
          const isOpen = openWeeks.has(weekNum);

          const weekDone    = days.filter(d => d.type !== "rest" && runMap[d.date]).length;
          const weekMissed  = days.filter(d => d.type !== "rest" && !runMap[d.date] && d.date < today).length;
          const weekPlannedKm = days.reduce((s, d) => s + (d.distanceKm ?? 0), 0);
          const weekActualKm  = days.reduce((s, d) => {
            return s + (runMap[d.date]?.reduce((rs: number, r: any) => rs + r.distanceKm, 0) ?? 0);
          }, 0);

          const isPast    = days.every(d => d.date < today);
          const isFuture  = days.every(d => d.date > today);
          const weekStart = days[0]?.date;
          const weekEnd   = days[days.length - 1]?.date;

          // Week status
          const allDone = weekDone >= days.filter(d => d.type !== "rest").length && days.filter(d => d.type !== "rest").length > 0;

          return (
            <div
              key={weekNum}
              ref={isCurrentWeek ? currentWeekRef : undefined}
              className="card"
              style={{
                overflow: "hidden",
                border: isCurrentWeek ? "1px solid rgba(45,212,191,0.3)" : "1px solid transparent",
              }}
            >
              {/* Week header — tap to expand */}
              <button
                onClick={() => toggleWeek(weekNum)}
                style={{
                  width: "100%", background: "none", cursor: "pointer",
                  borderTop: "none", borderLeft: "none", borderRight: "none",
                  borderBottom: isOpen ? "1px solid rgba(255,255,255,0.06)" : "none",
                  padding: "14px 16px",
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  gap: 10,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                  {/* Status dot */}
                  <div style={{
                    width: 8, height: 8, borderRadius: "50%", flexShrink: 0,
                    background: allDone ? "var(--green)"
                      : isCurrentWeek ? "var(--orange)"
                      : isPast && weekMissed > 0 ? "var(--red)"
                      : isPast ? "var(--green)"
                      : "rgba(255,255,255,0.15)",
                  }} />
                  <div style={{ textAlign: "left", minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{
                        fontSize: 13, fontWeight: 700,
                        color: isCurrentWeek ? "var(--green)" : "var(--label)",
                      }}>
                        Week {weekNum}
                      </span>
                      {isCurrentWeek && (
                        <span style={{
                          fontSize: 9, fontFamily: "var(--font-dm-mono)", textTransform: "uppercase",
                          background: "rgba(45,212,191,0.15)", color: "var(--green)",
                          borderRadius: 4, padding: "2px 6px", letterSpacing: 0.8,
                        }}>Current</span>
                      )}
                      {allDone && !isCurrentWeek && (
                        <span style={{
                          fontSize: 9, fontFamily: "var(--font-dm-mono)", textTransform: "uppercase",
                          background: "rgba(45,212,191,0.12)", color: "var(--green)",
                          borderRadius: 4, padding: "2px 6px", letterSpacing: 0.8,
                        }}>✓ Done</span>
                      )}
                    </div>
                    {weekStart && (
                      <div style={{ fontSize: 11, color: "rgba(235,235,245,0.4)", fontFamily: "var(--font-dm-mono)", marginTop: 1 }}>
                        {format(parseISO(weekStart), "MMM d")} – {format(parseISO(weekEnd), "MMM d")}
                      </div>
                    )}
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
                  {/* Mini progress */}
                  {!isFuture && (
                    <div style={{ display: "flex", gap: 2 }}>
                      {days.filter(d => d.type !== "rest").map((d, i) => {
                        const done   = !!runMap[d.date];
                        const missed = !done && d.date < today;
                        return (
                          <div key={i} style={{
                            width: 6, height: 6, borderRadius: 2,
                            background: done ? "var(--green)" : missed ? "rgba(255,55,95,0.5)" : "rgba(255,255,255,0.12)",
                          }} />
                        );
                      })}
                    </div>
                  )}
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 12, fontFamily: "var(--font-dm-mono)", color: isFuture ? "rgba(235,235,245,0.35)" : "rgba(235,235,245,0.7)" }}>
                      {isFuture ? `${weekPlannedKm.toFixed(0)} km` : `${weekActualKm.toFixed(1)} / ${weekPlannedKm.toFixed(0)} km`}
                    </div>
                  </div>
                  <span style={{
                    fontSize: 14, color: "rgba(235,235,245,0.4)",
                    transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
                    transition: "transform 200ms",
                    display: "block",
                  }}>▾</span>
                </div>
              </button>

              {/* Expanded day list */}
              {isOpen && (
                <div>
                  {days.map((d, idx) => {
                    const isToday   = d.date === today;
                    const isFutureD = d.date > today;
                    const isRest    = d.type === "rest";
                    const dayRuns   = runMap[d.date] ?? [];
                    const done      = dayRuns.length > 0;
                    const missed    = !isRest && !done && d.date < today;
                    const totalKm   = dayRuns.reduce((s: number, r: any) => s + r.distanceKm, 0);

                    return (
                      <div
                        key={d.date}
                        style={{
                          padding: "10px 16px",
                          borderBottom: idx < days.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none",
                          background: isToday ? "rgba(45,212,191,0.04)" : "transparent",
                          display: "flex", alignItems: "center", gap: 10,
                          opacity: isFutureD ? 0.5 : 1,
                        }}
                      >
                        {/* Day */}
                        <div style={{
                          width: 32, flexShrink: 0,
                          fontSize: 11, fontFamily: "var(--font-dm-mono)",
                          fontWeight: isToday ? 700 : 400,
                          color: isToday ? "var(--green)" : "rgba(235,235,245,0.45)",
                        }}>
                          {format(parseISO(d.date), "EEE").toUpperCase()}
                        </div>

                        {/* Type badge */}
                        <div style={{
                          fontSize: 10, fontFamily: "var(--font-dm-mono)",
                          textTransform: "uppercase", letterSpacing: 0.8,
                          color: TYPE_COLOR[d.type] ?? "rgba(235,235,245,0.5)",
                          background: TYPE_BG[d.type] ?? "rgba(255,255,255,0.05)",
                          borderRadius: 5, padding: "2px 7px",
                          width: 68, textAlign: "center", flexShrink: 0,
                        }}>
                          {d.type}
                        </div>

                        {/* Plan distance */}
                        <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 6, minWidth: 0 }}>
                          {!isRest && d.distanceKm && (
                            <span style={{ fontSize: 13, fontWeight: 600, color: "rgba(235,235,245,0.7)" }}>
                              {d.distanceKm} km
                            </span>
                          )}
                          {!isRest && d.paceTarget && (
                            <span style={{ fontSize: 11, color: "rgba(235,235,245,0.35)", fontFamily: "var(--font-dm-mono)" }}>
                              @ {d.paceTarget}
                            </span>
                          )}
                          {/* Actual km if run */}
                          {done && totalKm > 0 && (
                            <span style={{
                              fontSize: 11, fontFamily: "var(--font-dm-mono)",
                              color: "var(--green)", marginLeft: "auto",
                            }}>
                              {totalKm.toFixed(1)} km ✓
                            </span>
                          )}
                        </div>

                        {/* Status icon */}
                        <div style={{ flexShrink: 0, width: 22, textAlign: "center" }}>
                          {isRest ? (
                            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.2)" }}>—</span>
                          ) : done ? (
                            <div style={{
                              width: 22, height: 22, borderRadius: "50%",
                              background: "rgba(45,212,191,0.2)",
                              display: "flex", alignItems: "center", justifyContent: "center",
                            }}>
                              <span style={{ fontSize: 11, color: "var(--green)" }}>✓</span>
                            </div>
                          ) : missed ? (
                            <div style={{
                              width: 22, height: 22, borderRadius: "50%",
                              background: "rgba(255,55,95,0.15)",
                              display: "flex", alignItems: "center", justifyContent: "center",
                            }}>
                              <span style={{ fontSize: 11, color: "var(--red)" }}>✕</span>
                            </div>
                          ) : isToday ? (
                            <div style={{
                              width: 22, height: 22, borderRadius: "50%",
                              background: "rgba(45,212,191,0.15)",
                              border: "1.5px solid rgba(45,212,191,0.5)",
                            }} />
                          ) : (
                            <div style={{
                              width: 22, height: 22, borderRadius: "50%",
                              border: "1.5px solid rgba(255,255,255,0.1)",
                            }} />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
