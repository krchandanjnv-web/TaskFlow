"use client";

import { useState, useMemo } from "react";
import { signOut } from "next-auth/react";
import { useTasks } from "@/lib/hooks/useTasks";
import type { Task, TaskFilter, SortBy, AnalyticsRange } from "@/types";

// ─── Tiny SVG chart helpers ───────────────────────────────────────────────
function Sparkline({ data, color }: { data: number[]; color: string }) {
  if (data.length < 2) return null;
  const max = Math.max(...data, 1);
  const w = 80, h = 28;
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * (w - 4) + 2},${h - 4 - (v / max) * (h - 8)}`).join(" L ");
  return (
    <svg width={w} height={h} style={{ overflow: "visible" }}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
        style={{ filter: `drop-shadow(0 2px 4px ${color}80)` }} />
    </svg>
  );
}

function DonutChart({ value, total, color }: { value: number; total: number; color: string }) {
  const pct = total > 0 ? value / total : 0;
  const r = 28, circ = 2 * Math.PI * r;
  return (
    <svg width="70" height="70" viewBox="0 0 70 70">
      <circle cx="35" cy="35" r={r} fill="none" stroke={color + "20"} strokeWidth="7" />
      <circle cx="35" cy="35" r={r} fill="none" stroke={color} strokeWidth="7"
        strokeDasharray={`${pct * circ} ${circ * (1 - pct)}`}
        strokeDashoffset={circ / 4} strokeLinecap="round"
        transform="rotate(-90 35 35)"
        style={{ transition: "stroke-dasharray 0.6s ease", filter: `drop-shadow(0 0 4px ${color}60)` }} />
      <text x="35" y="39" textAnchor="middle" fontSize="13" fontWeight="700" fill={color} fontFamily="inherit">
        {Math.round(pct * 100)}%
      </text>
    </svg>
  );
}

function BarChart({ data, color }: { data: { label: string; value: number; max: number }[]; color: string }) {
  return (
    <div className="flex items-end gap-1.5 h-20">
      {data.map((d, i) => (
        <div key={i} className="flex flex-col items-center gap-1 flex-1">
          <div className="w-full rounded-t-sm" style={{ height: `${Math.max((d.value / (d.max || 1)) * 72, d.value ? 4 : 0)}px`, background: color, opacity: 0.8, transition: "height 0.4s ease" }} />
          <span className="text-[9px] text-[#A89D94]">{d.label}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Palette ──────────────────────────────────────────────────────────────
const P = {
  coral:  { bg: "#FFE8E3", mid: "#FF8A73", text: "#C44B30" },
  violet: { bg: "#EDE8FF", mid: "#9B84F7", text: "#5B3FBE" },
  sage:   { bg: "#E3F5EB", mid: "#5BC98A", text: "#267A4B" },
  sky:    { bg: "#E0F1FF", mid: "#5AADEE", text: "#1A6EA8" },
  amber:  { bg: "#FFF3D6", mid: "#F5B942", text: "#9A6A00" },
};
const catPal = { Work: P.violet, Health: P.sage, Personal: P.coral, Finance: P.amber } as const;
const priPal = { high: P.coral, medium: P.amber, low: P.sage } as const;

// ─── Main dashboard ───────────────────────────────────────────────────────
export default function DashboardClient({ user }: { user: { id: string; name: string; email: string } }) {
  const { tasks, isLoading, addTask, toggleTask, deleteTask, editTask } = useTasks();

  const [tab, setTab]             = useState<"dashboard" | "tasks" | "analytics" | "export">("dashboard");
  const [filter, setFilter]       = useState<TaskFilter>("all");
  const [sortBy, setSortBy]       = useState<SortBy>("date");
  const [aRange, setARange]       = useState<AnalyticsRange>("week");
  const [showAdd, setShowAdd]     = useState(false);
  const [showEdit, setShowEdit]   = useState<Task | null>(null);
  const [showProfile, setShowProfile] = useState(false);
  const [exportMsg, setExportMsg] = useState("");
  const [searchQ, setSearchQ]     = useState("");

  const today = new Date().toISOString().split("T")[0];
  const todayTasks   = tasks.filter(t => t.dueDate === today);
  const doneTasks    = tasks.filter(t => t.completed);
  const upcoming     = tasks.filter(t => t.dueDate > today);
  const recurring    = tasks.filter(t => t.type === "recurring");

  // Analytics history from task data
  const last30 = useMemo(() => {
    const days: { date: string; completed: number; total: number }[] = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const ds = d.toISOString().split("T")[0];
      const dayTasks = tasks.filter(t => t.dueDate === ds);
      days.push({ date: ds, completed: dayTasks.filter(t => t.completed).length, total: dayTasks.length });
    }
    return days;
  }, [tasks]);

  const rangeData = aRange === "week" ? last30.slice(-7) : aRange === "month" ? last30 : last30;
  const totalDone = rangeData.reduce((s, d) => s + d.completed, 0);
  const totalAll  = rangeData.reduce((s, d) => s + d.total, 0);
  const rate      = totalAll > 0 ? Math.round(totalDone / totalAll * 100) : 0;
  const avgDaily  = rangeData.length > 0 ? (totalDone / rangeData.length).toFixed(1) : "0";
  const streak    = (() => { let s = 0; for (let i = last30.length - 1; i >= 0; i--) { if (last30[i].completed >= last30[i].total * 0.5 && last30[i].total > 0) s++; else break; } return s; })();

  const filteredTasks = tasks
    .filter(t => {
      if (searchQ && !t.title.toLowerCase().includes(searchQ.toLowerCase())) return false;
      if (filter === "today")     return t.dueDate === today;
      if (filter === "upcoming")  return t.dueDate > today;
      if (filter === "completed") return t.completed;
      return true;
    })
    .sort((a, b) => sortBy === "priority"
      ? ({ high: 0, medium: 1, low: 2 }[a.priority] - { high: 0, medium: 1, low: 2 }[b.priority])
      : a.dueDate.localeCompare(b.dueDate));

  const handleExport = () => {
    const header = "id,title,priority,type,recurrence,dueDate,completed,category,createdAt";
    const rows   = tasks.map(t =>
      `${t.id},"${t.title}",${t.priority},${t.type},${t.recurrence ?? ""},${t.dueDate},${t.completed},${t.category},${t.createdAt}`
    );
    const blob = new Blob([[header, ...rows].join("\n")], { type: "text/csv" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "taskflow_export.csv"; a.click();
    setExportMsg(`✓ Exported ${tasks.length} tasks`);
    setTimeout(() => setExportMsg(""), 3000);
  };

  const initials = user.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();

  // ── Reusable task row
  const TaskRow = ({ t }: { t: Task }) => {
    const cat = catPal[t.category] ?? P.violet;
    const pri = priPal[t.priority];
    return (
      <div className="flex items-center gap-3 p-3.5 rounded-xl border border-black/[0.06] bg-white hover:bg-[#FDFAF6] transition-colors group"
           style={{ opacity: t.completed ? 0.65 : 1 }}>
        <button onClick={() => toggleTask(t.id)}
          className="w-5 h-5 rounded-md flex-shrink-0 flex items-center justify-center border-2 transition-all"
          style={{ borderColor: t.completed ? pri.mid : "#D1C8BF", background: t.completed ? pri.mid : "transparent" }}>
          {t.completed && <span className="text-white text-[10px] font-bold">✓</span>}
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[13.5px] font-medium text-[#1A1410] truncate" style={{ textDecoration: t.completed ? "line-through" : "none" }}>{t.title}</span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full capitalize" style={{ background: pri.bg, color: pri.text }}>{t.priority}</span>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: cat.bg, color: cat.text }}>{t.category}</span>
            {t.type === "recurring" && <span className="text-[10px] text-[#A89D94]">↺ {t.recurrence}</span>}
          </div>
          <p className="text-[11px] text-[#A89D94] mt-0.5">Due: {t.dueDate === today ? "Today" : t.dueDate}</p>
        </div>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={() => setShowEdit(t)} className="p-1.5 rounded-lg border border-black/[0.08] hover:bg-[#EDE8FF] text-[#9A9490] text-xs">✏</button>
          <button onClick={() => deleteTask(t.id)} className="p-1.5 rounded-lg border border-black/[0.08] hover:bg-[#FFE8E3] text-[#9A9490] text-xs">✕</button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#FDFAF6]">
      {/* ── HEADER ── */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur border-b border-black/[0.07] px-6 h-14 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#FF8A73] to-[#9B84F7] flex items-center justify-center text-white text-sm">✦</div>
          <span className="font-semibold text-[15px]" style={{ fontFamily: "'Fraunces', serif" }}>TaskFlow</span>
        </div>

        <nav className="flex gap-1 bg-[#F5F1EC] rounded-xl p-1">
          {(["dashboard","tasks","analytics","export"] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className="px-3.5 py-1.5 rounded-lg text-xs font-medium capitalize transition-all"
              style={{ background: tab === t ? "#fff" : "transparent", color: tab === t ? "#1A1410" : "#9A9490", boxShadow: tab === t ? "0 1px 4px rgba(0,0,0,0.08)" : "none" }}>
              {t}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <button onClick={() => setShowAdd(true)} className="btn-primary !py-1.5 !px-3 !text-xs">+ Add Task</button>
          <button onClick={() => setShowProfile(true)}
            className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold transition-transform hover:scale-105"
            style={{ background: "linear-gradient(135deg,#9B84F7,#FF8A73)" }}>
            {initials}
          </button>
        </div>
      </header>

      {/* ── BODY ── */}
      <main className="max-w-6xl mx-auto px-6 py-8">

        {/* ══ DASHBOARD ══ */}
        {tab === "dashboard" && (
          <div className="animate-fade-up space-y-5">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight" style={{ fontFamily: "'Fraunces', serif" }}>
                Good {new Date().getHours() < 12 ? "morning" : "afternoon"}, {user.name.split(" ")[0]} 👋
              </h1>
              <p className="text-sm text-[#9A9490] mt-1">{new Date().toLocaleDateString("en-US",{weekday:"long",month:"long",day:"numeric"})} · {todayTasks.filter(t=>t.completed).length}/{todayTasks.length} tasks done today</p>
            </div>

            {/* KPI cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "Today", val: todayTasks.length, sub: `${todayTasks.filter(t=>t.completed).length} done`, icon: "📋", pal: P.violet },
                { label: "Streak",val: `${streak}d`,       sub: "consecutive days",  icon: "🔥", pal: P.coral },
                { label: "Upcoming",val: upcoming.length,  sub: "tasks ahead",       icon: "📅", pal: P.sky },
                { label: "Recurring",val: recurring.length,sub: "active habits",     icon: "🔁", pal: P.amber },
              ].map((k,i) => (
                <div key={i} className="rounded-2xl p-5 border transition-all hover:-translate-y-0.5 hover:shadow-md"
                     style={{ background: k.pal.bg, borderColor: k.pal.mid + "30" }}>
                  <div className="flex justify-between items-start mb-3">
                    <span className="text-xl">{k.icon}</span>
                  </div>
                  <div className="text-2xl font-bold tracking-tight" style={{ fontFamily: "'Fraunces', serif", color: k.pal.text }}>{k.val}</div>
                  <div className="text-xs font-semibold mt-1" style={{ color: k.pal.text }}>{k.label}</div>
                  <div className="text-[10px] mt-0.5" style={{ color: k.pal.text, opacity: 0.7 }}>{k.sub}</div>
                </div>
              ))}
            </div>

            {/* Today's tasks + mini chart */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="md:col-span-2 card p-5">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="font-semibold text-[14px]">Today's Focus</h2>
                  <DonutChart value={todayTasks.filter(t=>t.completed).length} total={todayTasks.length || 1} color={P.sage.mid} />
                </div>
                {isLoading ? (
                  <div className="space-y-2">{[1,2,3].map(i=><div key={i} className="h-12 bg-[#F5F1EC] rounded-xl animate-pulse"/>)}</div>
                ) : todayTasks.length === 0 ? (
                  <div className="text-center py-8 text-[#A89D94]"><div className="text-3xl mb-2">🎉</div><p className="text-sm">No tasks scheduled for today!</p></div>
                ) : (
                  <div className="space-y-2">{todayTasks.slice(0,5).map(t=><TaskRow key={t.id} t={t}/>)}</div>
                )}
              </div>

              <div className="space-y-4">
                <div className="card p-5">
                  <h2 className="font-semibold text-[14px] mb-3">7-Day Trend</h2>
                  <BarChart color={P.violet.mid} data={last30.slice(-7).map(d=>({ label: new Date(d.date).toLocaleDateString("en",{weekday:"short"}).slice(0,2), value: d.completed, max: Math.max(...last30.slice(-7).map(x=>x.total),1) }))} />
                </div>
                <div className="card p-5">
                  <h2 className="font-semibold text-[14px] mb-3">By Category</h2>
                  {(["Work","Health","Personal","Finance"] as const).map(cat => {
                    const n = tasks.filter(t=>t.category===cat).length;
                    const pal = catPal[cat];
                    return (
                      <div key={cat} className="flex items-center gap-2 mb-2.5">
                        <div className="w-2 h-2 rounded-sm flex-shrink-0" style={{ background: pal.mid }} />
                        <span className="text-xs text-[#6B6259] flex-1">{cat}</span>
                        <span className="text-xs font-bold" style={{ color: pal.text }}>{n}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ══ TASKS ══ */}
        {tab === "tasks" && (
          <div className="animate-fade-up">
            <div className="flex justify-between items-end mb-6">
              <div>
                <h1 className="text-2xl font-semibold tracking-tight" style={{ fontFamily: "'Fraunces', serif" }}>All Tasks</h1>
                <p className="text-sm text-[#9A9490] mt-1">{tasks.length} tasks · {doneTasks.length} completed</p>
              </div>
              <button onClick={() => setShowAdd(true)} className="btn-primary">+ New Task</button>
            </div>

            {/* Search + filters */}
            <div className="flex gap-3 mb-5 flex-wrap">
              <input value={searchQ} onChange={e=>setSearchQ(e.target.value)} placeholder="Search tasks…"
                className="input !w-56 !py-2" />
              <div className="flex gap-1.5">
                {(["all","today","upcoming","completed"] as const).map(f=>(
                  <button key={f} onClick={()=>setFilter(f)}
                    className="px-3 py-1.5 rounded-xl border text-xs font-semibold capitalize transition-all"
                    style={{ background: filter===f ? P.violet.bg : "transparent", borderColor: filter===f ? P.violet.mid : "#E5E0D8", color: filter===f ? P.violet.text : "#9A9490" }}>
                    {f}
                  </button>
                ))}
              </div>
              <button onClick={()=>setSortBy(s=>s==="date"?"priority":"date")}
                className="btn-secondary !text-xs !py-1.5">
                ↕ {sortBy === "date" ? "By Date" : "By Priority"}
              </button>
            </div>

            {isLoading ? (
              <div className="space-y-2">{[1,2,3,4,5].map(i=><div key={i} className="h-14 bg-white rounded-xl animate-pulse"/>)}</div>
            ) : filteredTasks.length === 0 ? (
              <div className="text-center py-20 text-[#A89D94]">
                <div className="text-4xl mb-3">🗂️</div>
                <p className="text-sm">No tasks match this filter.</p>
              </div>
            ) : (
              <div className="space-y-2">{filteredTasks.map(t=><TaskRow key={t.id} t={t}/>)}</div>
            )}
          </div>
        )}

        {/* ══ ANALYTICS ══ */}
        {tab === "analytics" && (
          <div className="animate-fade-up space-y-5">
            <div className="flex justify-between items-end">
              <div>
                <h1 className="text-2xl font-semibold tracking-tight" style={{ fontFamily: "'Fraunces', serif" }}>Analytics & Trends</h1>
                <p className="text-sm text-[#9A9490] mt-1">Track your productivity over time</p>
              </div>
              <div className="flex gap-1.5 bg-[#F5F1EC] rounded-xl p-1">
                {(["week","month"] as const).map(r=>(
                  <button key={r} onClick={()=>setARange(r)}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all"
                    style={{ background: aRange===r ? "#fff" : "transparent", color: aRange===r ? "#1A1410" : "#9A9490", boxShadow: aRange===r ? "0 1px 4px rgba(0,0,0,0.08)" : "none" }}>
                    {r === "week" ? "7 Days" : "30 Days"}
                  </button>
                ))}
              </div>
            </div>

            {/* 5 KPIs */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {[
                { label:"Completion",  val:`${rate}%`,    icon:"🎯", pal:P.sage,   spark:rangeData.map(d=>d.total>0?Math.round(d.completed/d.total*100):0) },
                { label:"Done",        val:totalDone,     icon:"✅", pal:P.violet, spark:rangeData.map(d=>d.completed) },
                { label:"Daily Avg",   val:avgDaily,      icon:"📈", pal:P.sky,    spark:rangeData.map(d=>d.completed) },
                { label:"Streak",      val:`${streak}d`,  icon:"🔥", pal:P.coral,  spark:last30.slice(-7).map(d=>d.completed>=d.total*0.5&&d.total>0?1:0) },
                { label:"Recurring",   val:recurring.length,icon:"🔁",pal:P.amber, spark:Array(7).fill(recurring.length) },
              ].map((k,i)=>(
                <div key={i} className="rounded-xl p-4 border transition-all hover:-translate-y-0.5"
                     style={{ background: k.pal.bg, borderColor: k.pal.mid+"25" }}>
                  <div className="text-lg mb-2">{k.icon}</div>
                  <div className="text-xl font-bold tracking-tight mb-0.5" style={{ fontFamily:"'Fraunces',serif", color: k.pal.text }}>{k.val}</div>
                  <div className="text-[10px] font-semibold uppercase tracking-wide mb-2" style={{ color: k.pal.text }}>{k.label}</div>
                  <Sparkline data={k.spark} color={k.pal.mid} />
                </div>
              ))}
            </div>

            {/* Charts row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="card p-5">
                <h2 className="font-semibold text-[14px] mb-1">Daily Completions</h2>
                <p className="text-[11px] text-[#A89D94] mb-4">Tasks completed each day</p>
                <BarChart color={P.violet.mid} data={rangeData.map(d=>({ label: new Date(d.date).getDate().toString(), value: d.completed, max: Math.max(...rangeData.map(x=>x.total),1) }))} />
              </div>

              <div className="card p-5">
                <h2 className="font-semibold text-[14px] mb-3">Category Progress</h2>
                {(["Work","Health","Personal","Finance"] as const).map(cat=>{
                  const pal = catPal[cat];
                  const all = tasks.filter(t=>t.category===cat);
                  const done = all.filter(t=>t.completed).length;
                  const pct = all.length>0?Math.round(done/all.length*100):0;
                  return (
                    <div key={cat} className="mb-3">
                      <div className="flex justify-between mb-1">
                        <span className="text-xs font-semibold text-[#1A1410]">{cat}</span>
                        <span className="text-xs font-bold" style={{ color: pal.text }}>{done}/{all.length} · {pct}%</span>
                      </div>
                      <div className="h-2 rounded-full overflow-hidden" style={{ background: pal.bg }}>
                        <div className="h-full rounded-full transition-all duration-700" style={{ width:`${pct}%`, background: pal.mid }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ══ EXPORT ══ */}
        {tab === "export" && (
          <div className="animate-fade-up max-w-xl">
            <h1 className="text-2xl font-semibold tracking-tight mb-1" style={{ fontFamily: "'Fraunces', serif" }}>Export & Data</h1>
            <p className="text-sm text-[#9A9490] mb-6">Download your task data in CSV format</p>

            <div className="card p-6 mb-4">
              <h2 className="font-semibold text-[14px] mb-5">Data Summary</h2>
              <div className="grid grid-cols-2 gap-3 mb-6">
                {[
                  { label:"Total Tasks",   val:tasks.length,   pal:P.violet },
                  { label:"Completed",     val:doneTasks.length,pal:P.sage },
                  { label:"Pending",       val:tasks.filter(t=>!t.completed).length,pal:P.amber },
                  { label:"High Priority", val:tasks.filter(t=>t.priority==="high").length,pal:P.coral },
                ].map((s,i)=>(
                  <div key={i} className="rounded-xl p-4" style={{ background: s.pal.bg }}>
                    <div className="text-lg font-bold" style={{ color: s.pal.text, fontFamily:"'Fraunces',serif" }}>{s.val}</div>
                    <div className="text-[11px] font-semibold mt-0.5" style={{ color: s.pal.text }}>{s.label}</div>
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-3">
                <button onClick={handleExport} className="btn-primary">
                  ↯ Export {tasks.length} Tasks as CSV
                </button>
                {exportMsg && <span className="text-xs font-semibold text-[#267A4B] bg-[#E3F5EB] px-3 py-1.5 rounded-full">{exportMsg}</span>}
              </div>
            </div>

            <div className="rounded-xl p-4 border" style={{ background: P.violet.bg, borderColor: P.violet.mid+"30" }}>
              <p className="text-xs italic leading-relaxed" style={{ color: P.violet.text }}>
                "Create a task tracker app with options to add tasks, specify recurrence, view analytics with KPIs, export data, switch themes, and manage user profiles with sync capabilities."
              </p>
            </div>
          </div>
        )}
      </main>

      {/* ── ADD TASK MODAL ── */}
      {showAdd && <TaskModal onClose={()=>setShowAdd(false)} onSave={addTask} />}

      {/* ── EDIT TASK MODAL ── */}
      {showEdit && (
        <TaskModal
          task={showEdit}
          onClose={()=>setShowEdit(null)}
          onSave={async (data) => { await editTask(showEdit.id, data); setShowEdit(null); }}
        />
      )}

      {/* ── PROFILE MODAL ── */}
      {showProfile && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={()=>setShowProfile(false)}>
          <div className="bg-white rounded-2xl p-7 w-full max-w-sm shadow-xl animate-slide-in" onClick={e=>e.stopPropagation()}>
            <div className="flex justify-between items-center mb-5">
              <h2 className="font-semibold text-[17px]">Profile</h2>
              <button onClick={()=>setShowProfile(false)} className="text-[#9A9490] hover:text-[#1A1410] text-lg">✕</button>
            </div>
            <div className="text-center mb-5">
              <div className="w-16 h-16 rounded-full mx-auto mb-3 flex items-center justify-center text-white text-xl font-bold"
                   style={{ background: "linear-gradient(135deg,#9B84F7,#FF8A73)" }}>{initials}</div>
              <div className="font-semibold text-[15px]">{user.name}</div>
              <div className="text-sm text-[#9A9490]">{user.email}</div>
              <div className="inline-flex items-center gap-1.5 mt-2 text-[11px] font-semibold px-3 py-1 rounded-full" style={{ background: P.sage.bg, color: P.sage.text }}>
                <span className="w-1.5 h-1.5 rounded-full bg-[#5BC98A] inline-block" /> Synced · Google Sheets
              </div>
            </div>
            <div className="space-y-2 text-sm text-[#6B6259] mb-5 text-left">
              <div className="flex justify-between"><span>Tasks created</span><span className="font-semibold text-[#1A1410]">{tasks.length}</span></div>
              <div className="flex justify-between"><span>Tasks completed</span><span className="font-semibold text-[#1A1410]">{doneTasks.length}</span></div>
              <div className="flex justify-between"><span>Current streak</span><span className="font-semibold text-[#1A1410]">{streak} days</span></div>
            </div>
            <button onClick={()=>signOut({ callbackUrl:"/login" })}
              className="w-full py-2.5 rounded-xl border border-black/10 text-sm font-medium text-[#C44B30] hover:bg-[#FFE8E3] transition-colors">
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Shared Task Modal (Add & Edit) ───────────────────────────────────────
function TaskModal({ task, onClose, onSave }: {
  task?: Task;
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
}) {
  const today = new Date().toISOString().split("T")[0];
  const [form, setForm] = useState({
    title:      task?.title      ?? "",
    priority:   task?.priority   ?? "medium",
    type:       task?.type       ?? "one-time",
    recurrence: task?.recurrence ?? "daily",
    dueDate:    task?.dueDate    ?? today,
    category:   task?.category   ?? "Work",
  });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async () => {
    if (!form.title.trim()) { setErr("Title is required"); return; }
    setSaving(true);
    try {
      await onSave({ ...form, recurrence: form.type === "recurring" ? form.recurrence : null });
      onClose();
    } catch { setErr("Failed to save. Please try again."); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl p-7 w-full max-w-md shadow-xl animate-slide-in" onClick={e=>e.stopPropagation()}>
        <div className="flex justify-between items-center mb-5">
          <h2 className="font-semibold text-[17px]">{task ? "Edit Task" : "New Task ✦"}</h2>
          <button onClick={onClose} className="text-[#9A9490] hover:text-[#1A1410] text-lg">✕</button>
        </div>

        {err && <p className="mb-3 text-xs text-red-500 bg-red-50 p-2 rounded-lg">{err}</p>}

        <div className="space-y-4">
          <div>
            <label className="label">Task Title *</label>
            <input value={form.title} onChange={e=>set("title",e.target.value)} onKeyDown={e=>e.key==="Enter"&&handleSave()} placeholder="What needs to be done?" className="input" autoFocus />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Priority</label>
              <select value={form.priority} onChange={e=>set("priority",e.target.value)} className="input">
                <option value="high">🔴 High</option>
                <option value="medium">🟡 Medium</option>
                <option value="low">🟢 Low</option>
              </select>
            </div>
            <div>
              <label className="label">Category</label>
              <select value={form.category} onChange={e=>set("category",e.target.value)} className="input">
                {["Work","Health","Personal","Finance"].map(c=><option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Type</label>
              <select value={form.type} onChange={e=>set("type",e.target.value)} className="input">
                <option value="one-time">One-time</option>
                <option value="recurring">Recurring</option>
              </select>
            </div>
            {form.type === "recurring" && (
              <div>
                <label className="label">Repeat</label>
                <select value={form.recurrence} onChange={e=>set("recurrence",e.target.value)} className="input">
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>
            )}
            <div>
              <label className="label">Due Date</label>
              <input type="date" value={form.dueDate} onChange={e=>set("dueDate",e.target.value)} className="input" />
            </div>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button onClick={handleSave} disabled={saving} className="btn-primary flex-1 !py-3">
            {saving ? "Saving…" : task ? "Save Changes" : "Add Task ✦"}
          </button>
          <button onClick={onClose} className="btn-secondary !px-5">Cancel</button>
        </div>
      </div>
    </div>
  );
}
