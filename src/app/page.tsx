import Link from "next/link";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function LandingPage() {
  const session = await auth();
  if (session) redirect("/dashboard");

  const features = [
    { icon: "✦", title: "Smart Task Tracking", desc: "Daily, recurring, and one-time tasks with priority levels." },
    { icon: "◉", title: "Rich Analytics", desc: "Weekly trends, KPIs, category breakdown, streak tracking." },
    { icon: "↯", title: "CSV Export", desc: "Download your data any time in spreadsheet-ready format." },
    { icon: "☁", title: "Cloud Sync", desc: "Data stored in Google Sheets — accessible anywhere, always." },
  ];

  return (
    <main className="min-h-screen bg-[#FDFAF6] flex flex-col">
      {/* Nav */}
      <nav className="border-b border-black/[0.07] bg-white/80 backdrop-blur sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#FF8A73] to-[#9B84F7] flex items-center justify-center text-white text-sm font-bold">✦</div>
            <span className="font-semibold text-[15px]" style={{ fontFamily: "'Fraunces', serif" }}>TaskFlow</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login"    className="text-sm text-[#6B6259] hover:text-[#1A1410] transition-colors font-medium">Sign In</Link>
            <Link href="/register" className="btn-primary !py-1.5 !px-4 text-xs">Get Started Free →</Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center px-6 py-24 text-center">
        <div className="inline-flex items-center gap-2 bg-[#EDE8FF] text-[#5B3FBE] text-xs font-semibold px-3 py-1.5 rounded-full mb-8">
          ✦ Productivity Redefined
        </div>
        <h1 className="text-5xl md:text-6xl font-bold tracking-tight text-[#1A1410] mb-6 max-w-3xl leading-tight" style={{ fontFamily: "'Fraunces', serif" }}>
          Your tasks,<br /><span className="bg-gradient-to-r from-[#FF8A73] to-[#9B84F7] bg-clip-text text-transparent">beautifully organized</span>
        </h1>
        <p className="text-lg text-[#6B6259] max-w-xl mb-10 leading-relaxed">
          TaskFlow helps you stay on top of daily tasks, track recurring habits, and visualize your productivity — all synced to your personal Google Sheet.
        </p>
        <div className="flex items-center gap-4 flex-wrap justify-center">
          <Link href="/register" className="btn-primary text-base !px-8 !py-3">Start for free</Link>
          <Link href="/login"    className="btn-secondary text-base !px-8 !py-3">Sign in</Link>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-5xl mx-auto px-6 pb-24 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {features.map((f, i) => (
          <div key={i} className="card p-6">
            <div className="text-2xl mb-3">{f.icon}</div>
            <h3 className="font-semibold text-[#1A1410] mb-1.5 text-sm">{f.title}</h3>
            <p className="text-xs text-[#9A9490] leading-relaxed">{f.desc}</p>
          </div>
        ))}
      </section>

      <footer className="border-t border-black/[0.07] py-6 text-center text-xs text-[#A89D94]">
        © {new Date().getFullYear()} TaskFlow · Built with Next.js & Google Sheets
      </footer>
    </main>
  );
}
