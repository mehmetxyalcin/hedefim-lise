import Link from "next/link";
import { BookOpen, Menu } from "lucide-react";

const navItems = [
  { href: "/", label: "Ana Sayfa" },
  { href: "/okullar", label: "Tercih Robotu" },
  { href: "/alanlar", label: "Meslek Atlası" },
  { href: "/hakkinda", label: "Proje Hakkında" },
];

export function Navbar() {
  return (
    <nav className="sticky top-0 z-50 border-b border-white/5 bg-[#0a0f1c]/90 text-white backdrop-blur-lg">
      <div className="container mx-auto max-w-7xl px-6">
        <div className="flex h-20 items-center justify-between">
          <Link href="/" className="group flex items-center space-x-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 to-blue-400 shadow-lg shadow-blue-600/20 transition-all group-hover:shadow-blue-600/40">
              <BookOpen className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white transition-colors group-hover:text-blue-100">
                Hedefim Lise
              </h1>
              <p className="text-[11px] font-medium uppercase tracking-wider text-blue-300/80">
                Yolum Bilinçli Tercih
              </p>
            </div>
          </Link>

          <div className="hidden items-center space-x-1 md:flex">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-lg px-4 py-2 text-sm font-medium text-slate-300 transition-all hover:bg-white/5 hover:text-white"
              >
                {item.label}
              </Link>
            ))}
            <div className="mx-4 h-5 w-px bg-white/10" />
            <Link
              href="/admin"
              className="rounded-lg border border-white/5 bg-white/10 px-5 py-2 text-sm font-semibold text-white transition-all hover:bg-white/15"
            >
              Giriş Yap
            </Link>
          </div>

          <button className="rounded-lg p-2 text-slate-300 transition-all hover:bg-white/5 hover:text-white md:hidden">
            <Menu className="h-6 w-6" />
          </button>
        </div>
      </div>
    </nav>
  );
}
