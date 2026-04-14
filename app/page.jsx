"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";

/* ═══════════════════════════════════════════
   DESIGN TOKENS
   ═══════════════════════════════════════════ */
const T = {
  white: "#ffffff",
  offWhite: "#f8f9fb",
  gray50: "#f1f3f5",
  gray100: "#e5e7eb",
  gray200: "#d1d5db",
  gray400: "#9ca3af",
  gray500: "#6b7280",
  gray700: "#374151",
  black: "#111111",
  green: "#16a34a",
  greenBg: "#f0fdf4",
  greenBorder: "#bbf7d0",
  red: "#dc2626",
  redBg: "#fef2f2",
  redBorder: "#fecaca",
  amber: "#d97706",
  amberBg: "#fffbeb",
  amberBorder: "#fde68a",
  gold: "#C9A84C",
  goldDark: "#A68B3C",
  goldBg: "#FDF8EF",
  goldBorder: "#E8D4A0",
};

const mono = { fontFamily: "'JetBrains Mono', monospace" };

/* ═══════════════════════════════════════════
   HOOKS
   ═══════════════════════════════════════════ */
function useReveal(threshold = 0.08) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, visible];
}

function useCountdown(target) {
  const calc = () => {
    const diff = target - Date.now();
    if (diff <= 0) return { d: 0, h: 0, m: 0, s: 0 };
    return {
      d: Math.floor(diff / 864e5),
      h: Math.floor((diff % 864e5) / 36e5),
      m: Math.floor((diff % 36e5) / 6e4),
      s: Math.floor((diff % 6e4) / 1e3),
    };
  };
  const [t, setT] = useState({ d: 0, h: 0, m: 0, s: 0 });
  useEffect(() => {
    setT(calc());
    const id = setInterval(() => setT(calc()), 1000);
    return () => clearInterval(id);
  }, []);
  return t;
}

function useBodyLock(locked) {
  useEffect(() => {
    if (locked) {
      const scrollY = window.scrollY;
      document.body.style.position = "fixed";
      document.body.style.top = `-${scrollY}px`;
      document.body.style.left = "0";
      document.body.style.right = "0";
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.position = "";
        document.body.style.top = "";
        document.body.style.left = "";
        document.body.style.right = "";
        document.body.style.overflow = "";
        window.scrollTo(0, scrollY);
      };
    }
  }, [locked]);
}

/* ═══════════════════════════════════════════
   SVG COMPONENTS
   ═══════════════════════════════════════════ */
function Candle({ bullish = true, body = 0.5, wickUp = 0.2, wickDown = 0.15, h = 120, w = 36, animate = false, className = "" }) {
  const col = bullish ? T.green : T.red;
  const colFade = bullish ? "rgba(22,163,74,0.10)" : "rgba(220,38,38,0.10)";
  const sum = body + wickUp + wickDown || 1;
  const scale = 1 / sum;
  const pad = 6;
  const drawH = h - pad * 2;
  const bodyW = w * 0.42;
  const uH = drawH * wickUp * scale;
  const bH = Math.max(drawH * body * scale, 4);
  const lH = drawH * wickDown * scale;
  const cx = w / 2;
  const uY = pad, bY = uY + uH, lY = bY + bH;
  return (
    <div className={`inline-flex flex-col items-center ${className}`}>
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}
        style={animate ? { animation: "candleFloat 3s ease-in-out infinite alternate" } : undefined}>
        <line x1={cx} y1={uY} x2={cx} y2={bY} stroke={col} strokeWidth="2" strokeLinecap="round" opacity="0.4" />
        <rect x={cx - bodyW / 2} y={bY} width={bodyW} height={bH} rx={2.5} fill={col} opacity="0.85" />
        <rect x={cx - bodyW / 2 - 3} y={bY - 1} width={bodyW + 6} height={bH + 2} rx={4} fill={colFade} />
        <line x1={cx} y1={lY} x2={cx} y2={lY + lH} stroke={col} strokeWidth="2" strokeLinecap="round" opacity="0.4" />
      </svg>
    </div>
  );
}

function seededRandom(seed) {
  let s = seed;
  return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
}

function CandleStrip({ count = 24, height = 64, seed = 99 }) {
  const candles = useMemo(() => {
    const rng = seededRandom(seed);
    return Array.from({ length: count }, () => ({
      bull: rng() > 0.42, bh: 6 + rng() * 22, wUp: 2 + rng() * 8,
      wDn: 2 + rng() * 8, y: 8 + rng() * 18, delay: rng() * 2.5, dur: 2.5 + rng() * 2.5,
    }));
  }, [count, seed]);
  const gap = 100 / count;
  return (
    <svg viewBox={`0 0 100 ${height / 2}`} preserveAspectRatio="none" className="w-full" style={{ height, opacity: 0.35 }}>
      {candles.map((c, i) => {
        const x = gap * i + gap / 2;
        return (
          <g key={i} style={{ animation: `candleFloat ${c.dur}s ease-in-out ${c.delay}s infinite alternate` }}>
            <line x1={x} y1={c.y - c.wUp / 2} x2={x} y2={c.y + c.bh / 2 + c.wDn / 2} stroke={c.bull ? T.green : T.red} strokeWidth="0.18" opacity="0.5" />
            <rect x={x - 0.7} y={c.y} width="1.4" height={c.bh / 2} rx="0.2" fill={c.bull ? T.green : T.red} opacity="0.55" />
          </g>
        );
      })}
    </svg>
  );
}

/* ═══════════════════════════════════════════
   GOLD ASSET ICON
   ═══════════════════════════════════════════ */
let _goldIconId = 0;
function GoldIcon({ size = 40 }) {
  const id = useMemo(() => ++_goldIconId, []);
  const gId = `gG${id}`;
  const sId = `gS${id}`;
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
      <defs>
        <linearGradient id={gId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#E8D48A" />
          <stop offset="35%" stopColor="#D4B44C" />
          <stop offset="70%" stopColor="#C9A84C" />
          <stop offset="100%" stopColor="#A68B3C" />
        </linearGradient>
        <linearGradient id={sId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="rgba(255,255,255,0.35)" />
          <stop offset="50%" stopColor="rgba(255,255,255,0)" />
        </linearGradient>
      </defs>
      <circle cx="20" cy="20" r="19" fill={`url(#${gId})`} />
      <circle cx="20" cy="20" r="19" fill={`url(#${sId})`} />
      <circle cx="20" cy="20" r="16" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="0.5" />
      <text x="20" y="21" textAnchor="middle" dominantBaseline="central"
        fill="#fff" fontSize="13" fontWeight="800" fontFamily="'JetBrains Mono', monospace"
        style={{ textShadow: "0 1px 2px rgba(0,0,0,0.15)" }}>Au</text>
    </svg>
  );
}

/* ═══════════════════════════════════════════
   BRAND WORDMARK
   ═══════════════════════════════════════════ */
function Wordmark({ size = "base", className = "" }) {
  const sizes = { xs: "text-xs", sm: "text-sm", base: "text-base", lg: "text-lg", xl: "text-xl", "2xl": "text-2xl", "3xl": "text-3xl", "4xl": "text-4xl" };
  return (
    <span className={`${sizes[size]} ${className}`} style={{ ...mono, letterSpacing: "0.06em", color: T.black }}>
      <span style={{ fontWeight: 300 }}>Zero</span><span style={{ fontWeight: 800 }}>Spread</span>
    </span>
  );
}

/* ═══════════════════════════════════════════
   UI PRIMITIVES
   ═══════════════════════════════════════════ */
function Reveal({ children, className = "", delay = 0 }) {
  const [ref, vis] = useReveal();
  return (
    <div ref={ref} className={className}
      style={{ transition: `opacity 0.7s ${delay}s, transform 0.7s ${delay}s`, opacity: vis ? 1 : 0, transform: vis ? "none" : "translateY(28px)" }}>
      {children}
    </div>
  );
}

function SectionWrap({ children, bg = T.white, id, className = "" }) {
  return (
    <section id={id} dir="rtl" className={`w-full px-5 py-16 sm:py-20 md:py-24 ${className}`} style={{ background: bg }}>
      <div className="max-w-2xl mx-auto">{children}</div>
    </section>
  );
}

function Chip({ children, color = T.green }) {
  return (
    <span className="inline-flex items-center text-xs font-bold px-3 py-1 rounded-full"
      style={{ background: `${color}10`, color, border: `1px solid ${color}18` }}>{children}</span>
  );
}

function Mono({ children, className = "" }) {
  return <span className={className} style={mono}>{children}</span>;
}

function DiscoverBtn({ onClick, label = "اكتشف المزيد" }) {
  return (
    <button onClick={onClick}
      className="mt-8 w-full py-4 rounded-2xl text-sm font-bold transition-all hover:shadow-md active:scale-[0.98] flex items-center justify-center gap-2"
      style={{ background: T.white, color: T.gray700, border: `1.5px solid ${T.gray100}` }}>
      {label}
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M19 12H5M12 5l-7 7 7 7" /></svg>
    </button>
  );
}

/* ═══════════════════════════════════════════
   OVERLAY — Full-screen panel
   ═══════════════════════════════════════════ */
function Overlay({ open, onClose, title, children }) {
  useBodyLock(open);
  const [animating, setAnimating] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (open) {
      setAnimating(true);
      requestAnimationFrame(() => requestAnimationFrame(() => setVisible(true)));
    } else {
      setVisible(false);
      const t = setTimeout(() => setAnimating(false), 350);
      return () => clearTimeout(t);
    }
  }, [open]);

  if (!animating && !open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex flex-col"
      style={{ transition: "opacity 0.35s ease", opacity: visible ? 1 : 0 }}>
      <div className="absolute inset-0" style={{ background: "rgba(0,0,0,0.12)" }} onClick={onClose} />
      <div className="relative flex flex-col w-full h-full"
        style={{
          background: T.white,
          transition: "transform 0.35s cubic-bezier(0.32, 0.72, 0, 1)",
          transform: visible ? "translateY(0)" : "translateY(100%)",
        }}>
        <div className="flex items-center justify-between px-5 h-14 shrink-0" dir="rtl"
          style={{ borderBottom: `1px solid ${T.gray100}`, background: "rgba(255,255,255,0.95)", backdropFilter: "blur(12px)" }}>
          <div className="flex items-center gap-3">
            <Wordmark size="sm" />
            {title && <span className="text-xs font-bold" style={{ color: T.gray400 }}>{title}</span>}
          </div>
          <button onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center transition-colors hover:bg-gray-100"
            style={{ color: T.gray500 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto overscroll-contain" dir="rtl">
          <div className="max-w-2xl mx-auto px-5 py-8 sm:py-10">{children}</div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   PHONE MOCKUP
   ═══════════════════════════════════════════ */
function PhoneMockup() {
  return (
    <div className="relative mx-auto" style={{ width: 260, maxWidth: "65vw" }}>
      <div className="absolute inset-4 rounded-[32px] blur-2xl opacity-[0.07]" style={{ background: T.black }} />
      <div className="rounded-[32px] p-[6px] relative" style={{ background: `linear-gradient(145deg, ${T.black}, #1a1a1a)` }}>
        <div className="absolute top-[6px] left-1/2 -translate-x-1/2 w-[72px] h-[22px] rounded-b-2xl z-10" style={{ background: T.black }} />
        <div className="rounded-[26px] overflow-hidden" style={{ background: T.white }}>
          <div className="flex items-center justify-between px-5 pt-8 pb-1">
            <span className="text-[9px] font-bold" style={{ ...mono, color: T.gray400 }}>9:41</span>
            <div className="flex items-center gap-1">
              <svg width="12" height="8" viewBox="0 0 12 8"><rect x="0" y="2" width="2" height="6" rx="0.5" fill={T.gray200} /><rect x="3" y="1" width="2" height="7" rx="0.5" fill={T.gray200} /><rect x="6" y="0" width="2" height="8" rx="0.5" fill={T.gray200} /><rect x="9" y="0" width="2" height="8" rx="0.5" fill={T.green} /></svg>
              <div className="w-5 h-2.5 rounded-sm border" style={{ borderColor: T.gray200 }}><div className="w-3.5 h-full rounded-sm" style={{ background: T.green }} /></div>
            </div>
          </div>
          <div className="px-4 pt-1 pb-3 flex items-center justify-between" dir="rtl">
            <span className="text-[9px]" style={{ ...mono, color: T.black, letterSpacing: "0.05em" }}>
              <span style={{ fontWeight: 300 }}>Zero</span><span style={{ fontWeight: 800 }}>Spread</span>
            </span>
            <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{ background: T.offWhite }}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={T.gray400} strokeWidth="2"><circle cx="12" cy="8" r="4" /><path d="M20 21a8 8 0 10-16 0" /></svg>
            </div>
          </div>
          <div className="mx-3 mb-2.5 rounded-xl p-3" dir="rtl" style={{ background: T.offWhite }}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[9px] font-bold" style={{ color: T.gray700 }}>تقدّمك في المسار</span>
              <span className="text-[9px] font-bold" style={{ ...mono, color: T.green }}>42%</span>
            </div>
            <div className="h-[5px] rounded-full" style={{ background: T.gray100 }}>
              <div className="h-full rounded-full" style={{ width: "42%", background: T.green }} />
            </div>
            <div className="flex justify-between mt-2">
              {[{ l: "الأساسيات", done: true }, { l: "الشموع", active: true }, { l: "التحليل الفني" }].map((m, i) => (
                <div key={i} className="flex items-center gap-1">
                  <div className="rounded-full" style={{ width: 5, height: 5, background: m.done ? T.green : m.active ? T.black : T.gray200 }} />
                  <span className="text-[7px] font-semibold" style={{ color: m.active ? T.black : m.done ? T.green : T.gray400 }}>{m.l}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="mx-3 mb-2.5 rounded-xl overflow-hidden" dir="rtl" style={{ border: `1px solid ${T.gray100}` }}>
            <div className="px-3 pt-2.5 pb-2">
              <div className="flex items-center gap-1.5 mb-2">
                <span className="text-[7px] font-bold px-1.5 py-0.5 rounded-md" style={{ background: T.greenBg, color: T.green }}>الفصل الثاني</span>
                <span className="text-[8px] font-bold" style={{ color: T.black }}>الشموع اليابانية</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="shrink-0 flex items-center justify-center rounded-lg p-1" style={{ background: T.offWhite }}>
                  <Candle bullish body={0.65} wickUp={0.07} wickDown={0.05} h={56} w={22} animate />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[9px] font-bold mb-1" style={{ color: T.black }}>شمعة صعودية قوية</div>
                  <div className="text-[7px] leading-[1.5] mb-1.5" style={{ color: T.gray500 }}>جسم كبير + ظل قصير = سيطرة المشترين</div>
                  <div className="flex gap-1">
                    {[{ l: "الجسم", v: "65%", c: T.green }, { l: "الظل", v: "7%", c: T.gray400 }].map((x, i) => (
                      <div key={i} className="rounded-md px-1.5 py-0.5" style={{ background: T.offWhite }}>
                        <span className="text-[6px] block" style={{ color: T.gray400 }}>{x.l}</span>
                        <span className="text-[7px] font-bold" style={{ ...mono, color: x.c }}>{x.v}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="mx-3 mb-2.5 rounded-xl p-2.5" dir="rtl" style={{ background: T.offWhite }}>
            <div className="text-[8px] font-bold mb-2" style={{ color: T.gray700 }}>مختبر الشموع</div>
            <div className="flex justify-around">
              {[
                { bull: true, body: 0.7, wu: 0.05, wd: 0.05, label: "زخم", c: T.green },
                { bull: true, body: 0.1, wu: 0.05, wd: 0.6, label: "رفض", c: T.green },
                { bull: true, body: 0.05, wu: 0.4, wd: 0.4, label: "حيرة", c: T.gray500 },
              ].map((c, i) => (
                <div key={i} className="flex flex-col items-center">
                  <Candle bullish={c.bull} body={c.body} wickUp={c.wu} wickDown={c.wd} h={36} w={16} />
                  <span className="text-[6px] font-bold mt-1 px-1.5 py-0.5 rounded-full" style={{ color: c.c }}>{c.label}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="flex items-center justify-around py-2.5 mx-2" style={{ borderTop: `1px solid ${T.gray100}` }}>
            {[
              { icon: "M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253", active: true, label: "التعلّم" },
              { icon: "M13 7h8m0 0v8m0-8l-8 8-4-4-6 6", label: "التوصيات" },
              { icon: "M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1", label: "الأخبار" },
              { icon: "M10.325 4.317a1.724 1.724 0 013.35 0l.7 1.418a1.724 1.724 0 002.573.91l1.418-.7a1.724 1.724 0 012.228 2.228l-.7 1.418a1.724 1.724 0 00.91 2.573l1.418.7a1.724 1.724 0 010 3.35", label: "أدوات" },
            ].map((tab, i) => (
              <div key={i} className="flex flex-col items-center gap-0.5">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={tab.active ? T.black : T.gray400} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={tab.icon} /></svg>
                <span className="text-[6px] font-semibold" style={{ color: tab.active ? T.black : T.gray400 }}>{tab.label}</span>
              </div>
            ))}
          </div>
          <div className="flex justify-center pb-2 pt-1"><div className="w-10 h-1 rounded-full" style={{ background: T.gray200 }} /></div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   OVERLAY — REGISTER
   ═══════════════════════════════════════════ */
function RegisterOverlayContent({ onClose }) {
  const [form, setForm] = useState({ name: "", phone: "", email: "", interests: [], notes: "", consent: false });
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState("idle");
  const interestOpts = ["الأكاديمية", "التوصيات", "تحليل الأخبار", "الأدوات", "جميع الخدمات"];
  const toggleInterest = (item) => setForm(p => ({ ...p, interests: p.interests.includes(item) ? p.interests.filter(x => x !== item) : [...p.interests, item] }));
  const validate = () => {
    const e = {};
    if (!form.name.trim() || form.name.trim().length < 3) e.name = true;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = true;
    if (!/^[\d\s+()-]{8,}$/.test(form.phone)) e.phone = true;
    if (!form.interests.length) e.interests = true;
    if (!form.consent) e.consent = true;
    setErrors(e);
    return !Object.keys(e).length;
  };
  const handleSubmit = async () => {
    if (!validate()) return;
    setStatus("loading");
    try { await new Promise(r => setTimeout(r, 1400)); setStatus("success"); } catch { setStatus("error"); }
  };
  const inputCls = "w-full rounded-2xl px-5 py-4 text-base bg-gray-50 border-2 border-gray-100 outline-none focus:border-gray-300 transition-colors placeholder:text-gray-300";

  if (status === "success") {
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5" style={{ background: T.greenBg, border: `2px solid ${T.greenBorder}` }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={T.green} strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12" /></svg>
        </div>
        <h3 className="text-2xl font-black mb-3" style={{ color: T.black }}>تم التسجيل بنجاح</h3>
        <p className="text-base mb-2" style={{ color: T.gray500 }}>أصبحت ضمن أوائل المنتظرين لمنصة <Wordmark size="base" />.</p>
        <p className="text-base mb-2" style={{ color: T.gray500 }}>ستحصل على خصم أكثر من 35% على جميع الخدمات عند الإطلاق.</p>
        <p className="text-sm mb-6" style={{ color: T.gray400 }}>سنتواصل معك قبل الانطلاقة.</p>
        <button onClick={onClose}
          className="px-8 py-3.5 rounded-2xl text-base font-bold transition-all hover:opacity-90"
          style={{ background: T.black, color: "#fff" }}>حسناً</button>
      </div>
    );
  }

  return (
    <>
      <h2 className="text-2xl sm:text-3xl font-black text-center mb-2" style={{ color: T.black }}>انضم إلى قائمة الانتظار</h2>
      <p className="text-sm text-center mb-1" style={{ color: T.gray500 }}>التسجيل مجاني — ويمنحك خصم 35%+ على جميع الخدمات</p>
      <p className="text-xs text-center mb-8" style={{ color: T.gray400 }}>لا يتطلب أي دفع الآن</p>

      <div className="rounded-2xl border p-5 sm:p-6 mb-6" style={{ borderColor: T.greenBorder, background: T.greenBg }}>
        <div className="grid grid-cols-3 gap-2 text-center">
          {[{ l: "الأكاديمية", before: "$350", after: "$228" }, { l: "التوصيات", before: "$119", after: "$77" }, { l: "الأدوات", before: "$49", after: "$32" }].map((s, i) => (
            <div key={i}>
              <span className="text-[10px] font-bold block mb-1" style={{ color: T.green }}>{s.l}</span>
              <Mono className="text-xs block" style={{ color: T.gray400, textDecoration: "line-through" }}>{s.before}</Mono>
              <Mono className="text-lg font-black block" style={{ color: T.green }}>{s.after}</Mono>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-bold mb-1.5" style={{ color: T.gray700 }}>الاسم الكامل</label>
          <input type="text" placeholder="أدخل اسمك الكامل" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
            className={`${inputCls} ${errors.name ? "!border-red-300" : ""}`} dir="rtl" style={{ color: T.black }} />
        </div>
        <div>
          <label className="block text-sm font-bold mb-1.5" style={{ color: T.gray700 }}>البريد الإلكتروني</label>
          <input type="email" placeholder="example@email.com" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
            className={`${inputCls} ${errors.email ? "!border-red-300" : ""}`} dir="ltr"
            style={{ ...mono, textAlign: "left", unicodeBidi: "isolate", color: T.black }} />
        </div>
        <div>
          <label className="block text-sm font-bold mb-1.5" style={{ color: T.gray700 }}>رقم الهاتف</label>
          <input type="tel" placeholder="+971 50 000 0000" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
            className={`${inputCls} ${errors.phone ? "!border-red-300" : ""}`} dir="ltr"
            style={{ ...mono, textAlign: "left", unicodeBidi: "isolate", color: T.black }} />
        </div>
        <div>
          <label className="block text-sm font-bold mb-1.5" style={{ color: T.gray700 }}>ما الذي يهمّك؟</label>
          <div className="grid grid-cols-2 gap-2">
            {interestOpts.map((item, i) => {
              const sel = form.interests.includes(item);
              return (
                <button key={i} onClick={() => toggleInterest(item)}
                  className="px-3 py-3 rounded-xl text-sm font-semibold transition-all text-center border-2"
                  style={{ background: sel ? T.black : T.offWhite, color: sel ? "#fff" : T.gray500, borderColor: sel ? T.black : T.gray100 }}>
                  {item}
                </button>
              );
            })}
          </div>
          {errors.interests && <p className="text-xs mt-1" style={{ color: T.red }}>اختر اهتماماً واحداً على الأقل</p>}
        </div>
        <div>
          <label className="block text-sm font-bold mb-1.5" style={{ color: T.gray700 }}>ملاحظات <span style={{ color: T.gray400 }}>(اختياري)</span></label>
          <textarea rows={3} placeholder="أي شيء تودّ إخبارنا به" value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
            className={`${inputCls} resize-none`} dir="rtl" style={{ color: T.black }} />
        </div>
        <label className="flex items-start gap-3 cursor-pointer select-none" onClick={() => setForm(p => ({ ...p, consent: !p.consent }))}>
          <div className="rounded-lg flex items-center justify-center shrink-0 mt-0.5 transition-all border-2"
            style={{ width: 22, height: 22, background: form.consent ? T.black : "transparent", borderColor: form.consent ? T.black : errors.consent ? T.red : T.gray200 }}>
            {form.consent && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12" /></svg>}
          </div>
          <span className="text-sm" style={{ color: T.gray500 }}>أوافق على تلقّي التحديثات المتعلقة بإطلاق <Wordmark size="xs" /></span>
        </label>
        <button onClick={handleSubmit} disabled={status === "loading"}
          className="w-full py-4 rounded-2xl text-base font-bold transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-40"
          style={{ background: T.black, color: "#fff" }}>
          {status === "loading" ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
              جارٍ التسجيل...
            </span>
          ) : "سجّل في قائمة الانتظار"}
        </button>
        {status === "error" && <p className="text-center text-sm" style={{ color: T.red }}>حدث خطأ — حاول مرة أخرى</p>}
      </div>
    </>
  );
}

/* ═══════════════════════════════════════════
   OVERLAY — ACADEMY
   ═══════════════════════════════════════════ */
function AcademyOverlayContent({ onRegister }) {
  const tracks = [
    { num: "01", title: "الأساسيات", chapters: "الفصول 1 - 3", desc: "النظام المالي، الاستثمار، المخاطرة، العرض والطلب، أنواع الأسواق، الأدوات الاستثمارية، فهم حركة الأسعار والسيولة والاتجاه.", topics: ["النظام المالي", "الأسواق الأولية والثانوية", "الأسهم والسندات", "العرض والطلب", "السيولة والاتجاه"] },
    { num: "02", title: "الشموع اليابانية", chapters: "الفصل 3 + المختبر", desc: "قراءة الشموع من الشكل إلى المعنى. الفتح والإغلاق والظلال. الزخم والرفض والحيرة. الأنماط السعرية: الرأس والكتفان، القاع المزدوج، المثلث، العلم.", topics: ["الشموع الصاعدة والهابطة", "ماروبوزو والمطرقة والدوجي", "الأنماط الانعكاسية", "الأنماط الاستمرارية"] },
    { num: "03", title: "التحليل الفني", chapters: "الفصول 4 - 6, 10", desc: "الدعم والمقاومة، المتوسطات المتحركة MA-50 و MA-200، التقاطع الذهبي، RSI، MACD، حجم التداول، نماذج سعرية متقدمة، مناطق السيولة.", topics: ["الدعم والمقاومة", "المتوسطات المتحركة", "RSI و MACD", "حجم التداول", "نماذج متقدمة"] },
    { num: "04", title: "البناء والحماية", chapters: "الفصول 7 - 9, 11", desc: "إدارة المخاطر: قاعدة 1%-2%، وقف الخسارة، حجم الصفقة. علم نفس التداول: الخوف والطمع وFOMO. بناء استراتيجيتك. إدارة المحفظة والتنويع.", topics: ["قاعدة 1%-2%", "وقف الخسارة", "علم نفس التداول", "بناء الاستراتيجية", "إدارة المحفظة"] },
  ];

  return (
    <>
      <h2 className="text-2xl sm:text-3xl font-black mb-3" style={{ color: T.black }}>
        أكاديمية <Wordmark size="2xl" />
      </h2>
      <p className="text-lg leading-[1.8] mb-8" style={{ color: T.gray500 }}>
        ليست دروساً نظرية. أكاديمية حقيقية تأخذك من الصفر إلى مستوى احترافي — بمنهج متسلسل، أمثلة بصرية، مختبرات عملية، واختبارات.
      </p>

      <h3 className="text-lg font-bold mb-1" style={{ color: T.black }}>تجربة تعلّم مختلفة تماماً</h3>
      <p className="text-sm mb-5" style={{ color: T.gray500 }}>ليست كورساً عادياً — بل جامعة كاملة</p>

      <div className="grid grid-cols-1 gap-3 mb-8">
        {[
          { title: "بروفيسور مرافق", desc: "مُعلّم يرافقك خطوة بخطوة طوال المسار. شرح صوتي مفصّل لكل مفهوم. ليس تسجيلاً مسبقاً — بل تجربة تعليمية حية وشخصية.", icon: "M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" },
          { title: "بروفايل طالب وتقدّم حقيقي", desc: "لكل طالب ملف شخصي يتتبع تقدّمه. اختبارات بعد كل فصل — لا تنتقل حتى تفهم فعلاً (نسبة نجاح 60%+). مختبرات عملية تفاعلية في كل مرحلة.", icon: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" },
          { title: "دعم تعليمي 24/7 لمدة سنة", desc: "أي سؤال تسأله — يوجد شخص يرد عليك. دعم تعليمي مستمر لمدة سنة كاملة من تاريخ اشتراكك. لا تبقى وحدك أبداً.", icon: "M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" },
        ].map((f, i) => (
          <div key={i} className="rounded-2xl border p-5" style={{ borderColor: T.gray100, background: T.white }}>
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: T.offWhite }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={T.black} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d={f.icon} /></svg>
              </div>
              <div>
                <h4 className="text-base font-bold mb-1" style={{ color: T.black }}>{f.title}</h4>
                <p className="text-sm leading-[1.8]" style={{ color: T.gray500 }}>{f.desc}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border p-5 mb-8" style={{ borderColor: T.greenBorder, background: T.greenBg }}>
        <div className="flex items-start gap-3">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={T.green} strokeWidth="2" strokeLinecap="round" className="mt-0.5 shrink-0">
            <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          <div>
            <h4 className="text-base font-bold mb-1" style={{ color: T.green }}>ضمان النتيجة</h4>
            <p className="text-sm leading-[1.8]" style={{ color: T.gray700 }}>إذا أكملت المنهج بالكامل ولم تصل لمستوى احترافي — نعيد لك كامل المبلغ. ثقتنا في المحتوى غير قابلة للتفاوض.</p>
          </div>
        </div>
      </div>

      <h3 className="text-lg font-bold mb-1" style={{ color: T.black }}>المسار التعليمي</h3>
      <p className="text-sm mb-5" style={{ color: T.gray500 }}>4 مسارات تغطي 11 فصلاً كاملاً</p>

      <div className="space-y-3 mb-8">
        {tracks.map((tr, i) => (
          <div key={i} className="rounded-2xl border p-5" style={{ borderColor: T.gray100 }}>
            <div className="flex items-center gap-3 mb-3">
              <Mono className="text-xs font-bold px-2.5 py-1 rounded-lg" style={{ background: T.offWhite, color: T.gray400 }}>{tr.num}</Mono>
              <div>
                <h4 className="text-base font-bold" style={{ color: T.black }}>{tr.title}</h4>
                <span className="text-xs" style={{ color: T.gray400 }}>{tr.chapters}</span>
              </div>
            </div>
            <p className="text-sm leading-[1.8] mb-3" style={{ color: T.gray500 }}>{tr.desc}</p>
            <div className="flex flex-wrap gap-1.5">
              {tr.topics.map((t, j) => (
                <span key={j} className="text-[11px] font-semibold px-2.5 py-1 rounded-lg" style={{ background: T.offWhite, color: T.gray700 }}>{t}</span>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border overflow-hidden mb-8" style={{ borderColor: T.gray100 }}>
        <div className="p-5" style={{ background: T.offWhite }}>
          <h3 className="text-lg font-bold mb-1" style={{ color: T.black }}>الاشتراك في الأكاديمية</h3>
          <p className="text-sm" style={{ color: T.gray500 }}>سجّل قبل الإطلاق واحصل على أفضل سعر</p>
        </div>
        <div className="p-5">
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="rounded-xl p-4 text-center" style={{ background: T.greenBg, border: `1px solid ${T.greenBorder}` }}>
              <span className="text-xs block mb-1" style={{ color: T.green }}>قبل الإطلاق</span>
              <Mono className="text-3xl font-black" style={{ color: T.green }}>228</Mono>
              <span className="text-sm font-bold" style={{ color: T.green }}>$</span>
            </div>
            <div className="rounded-xl p-4 text-center" style={{ background: T.offWhite }}>
              <span className="text-xs block mb-1" style={{ color: T.gray400 }}>بعد الإطلاق</span>
              <Mono className="text-3xl font-black" style={{ color: T.gray400, textDecoration: "line-through" }}>350</Mono>
              <span className="text-sm font-bold" style={{ color: T.gray400 }}>$</span>
            </div>
          </div>
          <div className="rounded-xl p-3 text-center mb-4" style={{ background: T.greenBg, border: `1px solid ${T.greenBorder}` }}>
            <span className="text-sm font-bold" style={{ color: T.green }}>وفّر $122 بالتسجيل قبل الإطلاق</span>
          </div>
          <p className="text-xs text-center" style={{ color: T.gray400 }}>يشمل: 11 فصل + مختبرات + اختبارات + بروفيسور مرافق + دعم سنة كاملة + ضمان النتيجة</p>
        </div>
      </div>

      <button onClick={onRegister} className="w-full py-4 rounded-2xl text-base font-bold transition-all hover:opacity-90 active:scale-[0.97]" style={{ background: T.black, color: "#fff" }}>
        سجّل في قائمة الانتظار واحصل على الخصم
      </button>
    </>
  );
}

/* ═══════════════════════════════════════════
   OVERLAY — CANDLE LAB
   ═══════════════════════════════════════════ */
function LabOverlayContent({ onRegister }) {
  const [idx, setIdx] = useState(0);
  const cases = [
    { bull: true, body: 0.7, wu: 0.05, wd: 0.05, name: "ماروبوزو صعودي", tag: "زخم", tagC: T.green, desc: "سيطرة مطلقة للمشترين. الجسم يغطي المدى بالكامل. قوة شرائية واضحة جداً.", reading: "إذا جاءت عند دعم أو بعد تصحيح — إشارة قوية لاستمرار الصعود." },
    { bull: false, body: 0.6, wu: 0.08, wd: 0.05, name: "شمعة بيع قوية", tag: "ضغط بيعي", tagC: T.red, desc: "البائعون مسيطرون. جسم كبير هابط مع ظلال قصيرة.", reading: "عند مقاومة أو بعد صعود طويل — تحذير من انعكاس هبوطي." },
    { bull: true, body: 0.1, wu: 0.05, wd: 0.6, name: "المطرقة", tag: "انعكاس", tagC: T.green, desc: "جسم صغير في الأعلى مع ظل سفلي طويل. المشترون تدخلوا ودفعوا السعر للأعلى.", reading: "رفض واضح للأسعار المنخفضة. بعد هبوط — إشارة انعكاس صعودي محتمل." },
    { bull: false, body: 0.1, wu: 0.6, wd: 0.05, name: "النجمة الساقطة", tag: "انعكاس", tagC: T.red, desc: "جسم صغير في الأسفل مع ظل علوي طويل. محاولة صعود فاشلة.", reading: "بعد ارتفاع وعند مقاومة — تحذير من هبوط قادم." },
    { bull: true, body: 0.05, wu: 0.4, wd: 0.4, name: "دوجي", tag: "حيرة", tagC: T.gray500, desc: "الفتح والإغلاق متقاربان مع ظلال طويلة. لا مسيطر.", reading: "حيرة كاملة. لا تدخل بناءً عليها وحدها — انتظر التأكيد." },
  ];
  const active = cases[idx];

  return (
    <>
      <h2 className="text-2xl sm:text-3xl font-black mb-3" style={{ color: T.black }}>مختبر الشموع — من الشكل إلى المعنى</h2>
      <p className="text-base leading-[1.8] mb-8" style={{ color: T.gray500 }}>
        المختبر يعلّمك كيف تقرأ ما تقوله الشمعة فعلاً: هل المشترون مسيطرون؟ هل هناك رفض؟ هل السوق في حيرة؟ تتعلم بالتطبيق المباشر.
      </p>

      <h3 className="text-lg font-bold mb-4" style={{ color: T.black }}>تشريح الشمعة</h3>
      <div className="grid grid-cols-3 gap-2 mb-8">
        {[
          { part: "الجسم", desc: "المسافة بين الفتح والإغلاق. كبير = قوة واتجاه. صغير = حيرة.", color: T.green },
          { part: "الظل العلوي", desc: "أعلى نقطة فوق الجسم. طويل = المشترون حاولوا لكن فشلوا.", color: T.amber },
          { part: "الظل السفلي", desc: "أدنى نقطة تحت الجسم. طويل = البائعون حاولوا لكن فشلوا.", color: T.red },
        ].map((p, i) => (
          <div key={i} className="rounded-xl border p-3" style={{ borderColor: T.gray100 }}>
            <div className="w-6 h-1 rounded-full mb-2" style={{ background: p.color }} />
            <h4 className="text-sm font-bold mb-1" style={{ color: T.black }}>{p.part}</h4>
            <p className="text-[11px] leading-[1.6]" style={{ color: T.gray500 }}>{p.desc}</p>
          </div>
        ))}
      </div>

      <h3 className="text-lg font-bold mb-4" style={{ color: T.black }}>اختر شمعة واقرأ تحليلها</h3>
      <div className="flex gap-2 overflow-x-auto pb-3 mb-5 -mx-1 px-1" style={{ scrollbarWidth: "none" }}>
        {cases.map((c, i) => (
          <button key={i} onClick={() => setIdx(i)}
            className="shrink-0 rounded-2xl p-3 flex flex-col items-center min-w-[70px] transition-all"
            style={{ background: idx === i ? T.white : T.gray50, border: `1.5px solid ${idx === i ? T.gray200 : "transparent"}`, boxShadow: idx === i ? "0 2px 12px rgba(0,0,0,0.06)" : "none" }}>
            <Candle bullish={c.bull} body={c.body} wickUp={c.wu} wickDown={c.wd} h={48} w={20} />
            <span className="text-[10px] font-bold mt-1.5 text-center" style={{ color: idx === i ? T.black : T.gray400 }}>{c.name}</span>
          </button>
        ))}
      </div>

      <div className="rounded-2xl border p-5 sm:p-6 mb-8" style={{ borderColor: T.gray100, boxShadow: "0 1px 12px rgba(0,0,0,0.04)" }}>
        <div className="flex items-start gap-5 mb-4">
          <div className="shrink-0"><Candle bullish={active.bull} body={active.body} wickUp={active.wu} wickDown={active.wd} h={120} w={44} animate /></div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <h4 className="text-lg font-bold" style={{ color: T.black }}>{active.name}</h4>
              <Chip color={active.tagC}>{active.tag}</Chip>
            </div>
            <p className="text-sm leading-[1.8] mb-3" style={{ color: T.gray500 }}>{active.desc}</p>
            <div className="flex gap-2">
              {[{ l: "الجسم", v: active.body }, { l: "ظل علوي", v: active.wu }, { l: "ظل سفلي", v: active.wd }].map((x, i) => (
                <div key={i} className="rounded-lg px-3 py-2 text-center flex-1" style={{ background: T.offWhite }}>
                  <div className="text-[10px]" style={{ color: T.gray400 }}>{x.l}</div>
                  <Mono className="text-xs font-bold" style={{ color: T.black }}>{Math.round(x.v * 100)}%</Mono>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="rounded-xl p-4" style={{ background: T.offWhite }}>
          <h5 className="text-sm font-bold mb-1" style={{ color: T.black }}>كيف تقرأها؟</h5>
          <p className="text-sm leading-[1.8]" style={{ color: T.gray500 }}>{active.reading}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-8">
        <div className="rounded-2xl border p-4 text-center" style={{ borderColor: T.greenBorder }}>
          <Candle bullish body={0.65} wickUp={0.07} wickDown={0.05} h={70} w={28} />
          <div className="text-sm font-bold mt-2" style={{ color: T.green }}>شمعة قوية</div>
          <div className="text-xs mt-1" style={{ color: T.gray500 }}>جسم كبير، ظلال قصيرة</div>
        </div>
        <div className="rounded-2xl border p-4 text-center" style={{ borderColor: T.redBorder }}>
          <Candle bullish={false} body={0.08} wickUp={0.4} wickDown={0.4} h={70} w={28} />
          <div className="text-sm font-bold mt-2" style={{ color: T.red }}>شمعة ضعيفة</div>
          <div className="text-xs mt-1" style={{ color: T.gray500 }}>جسم صغير، ظلال طويلة</div>
        </div>
      </div>

      <button onClick={onRegister} className="w-full py-4 rounded-2xl text-base font-bold transition-all hover:opacity-90 active:scale-[0.97]" style={{ background: T.black, color: "#fff" }}>
        سجّل في قائمة الانتظار
      </button>
    </>
  );
}

/* ═══════════════════════════════════════════
   OVERLAY — SIGNALS
   ═══════════════════════════════════════════ */
function SignalsOverlayContent({ onRegister }) {
  return (
    <>
      <h2 className="text-2xl sm:text-3xl font-black mb-3" style={{ color: T.black }}>
        توصيات <Wordmark size="2xl" />
      </h2>
      <p className="text-base leading-[1.8] mb-8" style={{ color: T.gray500 }}>
        كل توصية هي سيناريو كامل مبني على تحليل فني ومنهجي. نحن لا نضمن أي شيء — لا يوجد شيء مضمون في الأسواق. لكننا نعمل على تقريب الاحتمالات بأكبر قدر ممكن.
      </p>

      {/* Premium Trade Card */}
      <div className="rounded-2xl border overflow-hidden mb-8" style={{ borderColor: T.gray100, boxShadow: "0 4px 24px rgba(0,0,0,0.06)" }}>
        {/* Card Header */}
        <div className="px-5 sm:px-6 pt-5 pb-4" style={{ borderBottom: `1px solid ${T.gray100}` }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <GoldIcon size={44} />
              <div>
                <div className="flex items-center gap-2">
                  <Mono className="text-lg font-black" style={{ color: T.black }}>XAU/USD</Mono>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md" style={{ background: T.goldBg, color: T.gold, border: `1px solid ${T.goldBorder}` }}>الذهب</span>
                </div>
                <span className="text-sm" style={{ color: T.green }}>صفقة شراء — إطار 4 ساعات</span>
              </div>
            </div>
            <div className="flex flex-col items-end gap-1">
              <Chip color={T.green}>مثال</Chip>
              <span className="text-[10px]" style={{ color: T.gray400 }}>منذ ساعتين</span>
            </div>
          </div>
        </div>

        {/* Chart */}
        <div className="px-3 py-3" style={{ background: T.offWhite }}>
          <div className="rounded-xl overflow-hidden" style={{ background: T.white, border: `1px solid ${T.gray100}` }}>
            <div className="px-3 pt-2 flex items-center justify-between">
              <Mono className="text-[10px] font-bold" style={{ color: T.gray400 }}>4H</Mono>
              <Mono className="text-xs font-bold" style={{ color: T.green }}>+0.82%</Mono>
            </div>
            <CandleStrip count={36} height={64} seed={77} />
          </div>
        </div>

        {/* Levels */}
        <div className="px-5 sm:px-6 pt-4 pb-1">
          <div className="grid grid-cols-4 gap-2 mb-4">
            {[
              { l: "الدخول", v: "2,385", c: T.black, bg: T.offWhite, border: T.gray100 },
              { l: "الهدف 1", v: "2,420", c: T.green, bg: T.greenBg, border: T.greenBorder },
              { l: "الهدف 2", v: "2,455", c: T.green, bg: T.greenBg, border: T.greenBorder },
              { l: "الوقف", v: "2,358", c: T.red, bg: T.redBg, border: T.redBorder },
            ].map((x, i) => (
              <div key={i} className="rounded-xl p-2.5 text-center" style={{ background: x.bg, border: `1px solid ${x.border}` }}>
                <div className="text-[9px] font-semibold mb-0.5" style={{ color: T.gray400 }}>{x.l}</div>
                <Mono className="text-[13px] font-black" style={{ color: x.c }}>{x.v}</Mono>
              </div>
            ))}
          </div>
        </div>

        {/* Risk/Reward */}
        <div className="px-5 sm:px-6 pb-4">
          <div className="flex items-center gap-2 rounded-xl p-3" style={{ background: T.offWhite }}>
            <span className="text-[10px] font-semibold" style={{ color: T.gray400 }}>المخاطرة / العائد</span>
            <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: T.gray100 }}>
              <div className="h-full rounded-full" style={{ width: "72%", background: T.green }} />
            </div>
            <Mono className="text-xs font-black" style={{ color: T.green }}>1:2.6</Mono>
          </div>
        </div>

        {/* Scenarios */}
        <div className="px-5 sm:px-6 pb-5 sm:pb-6 space-y-2">
          {[
            { t: "السيناريو الأساسي", d: "ارتداد من دعم 2,380 مع تأكيد حجم — نستهدف مقاومة 2,420 ثم 2,455", dot: T.green, bg: T.greenBg, border: T.greenBorder },
            { t: "السيناريو البديل", d: "كسر 2,358 بإغلاق 4H — إلغاء الصفقة ومراقبة منطقة 2,330", dot: T.amber, bg: T.amberBg, border: T.amberBorder },
            { t: "ما بعد الدخول", d: "تعديل وقف الخسارة إلى 2,385 عند تحقق الهدف الأول — حماية رأس المال", dot: T.black, bg: T.offWhite, border: T.gray100 },
          ].map((s, i) => (
            <div key={i} className="flex gap-3 rounded-xl p-4" style={{ background: s.bg, border: `1px solid ${s.border}` }}>
              <div className="w-2.5 h-2.5 rounded-full mt-1 shrink-0" style={{ background: s.dot }} />
              <div>
                <span className="text-sm font-bold block mb-0.5" style={{ color: T.gray700 }}>{s.t}</span>
                <span className="text-sm leading-relaxed" style={{ color: T.gray500 }}>{s.d}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Smart Notifications */}
      <div className="rounded-2xl border overflow-hidden mb-8" style={{ borderColor: T.greenBorder, background: T.greenBg }}>
        <div className="px-5 pt-5 pb-4 flex items-center gap-2" style={{ borderBottom: `1px solid ${T.greenBorder}` }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={T.green} strokeWidth="2" strokeLinecap="round"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 01-3.46 0" /></svg>
          <h3 className="text-lg font-bold" style={{ color: T.green }}>إشعارات ذكية</h3>
        </div>
        <div className="p-5">
          <p className="text-sm leading-[1.8] mb-4" style={{ color: T.gray700 }}>اختر الأصول التي تتابعها. نظام الإشعارات يعمل لصالحك:</p>
          <div className="space-y-2">
            {[
              { text: "توصية جديدة على أصل تتابعه", tag: "إشعار فوري", tagC: T.green },
              { text: "السعر وصل إلى وقف الخسارة", tag: "تنبيه عاجل", tagC: T.red },
              { text: "الهدف الأول أو الثاني تحقق", tag: "ربح محقق", tagC: T.green },
              { text: "تحديث: تعديل أهداف أو إلغاء", tag: "تحديث", tagC: T.amber },
            ].map((n, i) => (
              <div key={i} className="flex items-center justify-between rounded-xl p-3.5" style={{ background: "rgba(255,255,255,0.7)", border: `1px solid ${T.greenBorder}` }}>
                <div className="flex items-center gap-3">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={T.green} strokeWidth="3" strokeLinecap="round" className="shrink-0"><polyline points="20 6 9 17 4 12" /></svg>
                  <span className="text-sm" style={{ color: T.gray700 }}>{n.text}</span>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md shrink-0" style={{ background: n.tagC === T.red ? T.redBg : n.tagC === T.amber ? T.amberBg : T.greenBg, color: n.tagC }}>{n.tag}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* How it works */}
      <h3 className="text-lg font-bold mb-4" style={{ color: T.black }}>كيف تعمل التوصية من البداية للنهاية؟</h3>
      <div className="space-y-0 mb-8">
        {[
          { step: "01", t: "التحليل", d: "ندرس السوق — مستويات الدعم والمقاومة، الحجم، المؤشرات الفنية", c: T.black },
          { step: "02", t: "التوصية", d: "ننشر نقطة الدخول، الأهداف، ووقف الخسارة — مع السيناريو الكامل", c: T.green },
          { step: "03", t: "الإشعار", d: "تصلك إشعارات فورية على هاتفك حسب الأصول التي تختارها", c: T.amber },
          { step: "04", t: "المتابعة", d: "نراقب الصفقة ونرسل تحديثات: تعديل أهداف، تحريك وقف، أو إلغاء", c: T.black },
        ].map((s, i) => (
          <div key={i}>
            <div className="flex gap-4 items-start rounded-xl p-4">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: i === 1 ? T.green : T.offWhite }}>
                <Mono className="text-[11px] font-bold" style={{ color: i === 1 ? "#fff" : T.gray400 }}>{s.step}</Mono>
              </div>
              <div>
                <span className="text-sm font-bold block mb-0.5" style={{ color: s.c }}>{s.t}</span>
                <span className="text-sm leading-relaxed" style={{ color: T.gray500 }}>{s.d}</span>
              </div>
            </div>
            {i < 3 && <div className="flex justify-start mr-[34px]"><div className="w-px h-4" style={{ background: T.gray200 }} /></div>}
          </div>
        ))}
      </div>

      {/* Comparison */}
      <h3 className="text-lg font-bold mb-4" style={{ color: T.black }}>ما الفرق؟</h3>
      <div className="grid grid-cols-2 gap-3 mb-8">
        <div className="rounded-2xl border p-4" style={{ borderColor: T.gray100 }}>
          <div className="text-sm font-bold mb-3 pb-2" style={{ color: T.red, borderBottom: `1px solid ${T.gray100}` }}>توصيات عادية</div>
          {["نقطة دخول فقط", "بدون سيناريو بديل", "بدون متابعة", "بدون إشعارات", "بدون تعديل أهداف"].map((t, i) => (
            <div key={i} className="flex items-center gap-2 mb-2">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={T.red} strokeWidth="3" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
              <span className="text-xs" style={{ color: T.gray500 }}>{t}</span>
            </div>
          ))}
        </div>
        <div className="rounded-2xl border p-4" style={{ borderColor: T.greenBorder, background: T.greenBg }}>
          <div className="text-sm font-bold mb-3 pb-2" style={{ color: T.green, borderBottom: `1px solid ${T.greenBorder}` }}>ZeroSpread</div>
          {["رؤية كاملة + سيناريو", "سيناريو بديل دائماً", "متابعة مستمرة", "إشعارات ذكية", "تعديل وتحديث الأهداف"].map((t, i) => (
            <div key={i} className="flex items-center gap-2 mb-2">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={T.green} strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12" /></svg>
              <span className="text-xs font-semibold" style={{ color: T.gray700 }}>{t}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Pricing */}
      <div className="rounded-2xl border overflow-hidden mb-8" style={{ borderColor: T.gray100 }}>
        <div className="p-5" style={{ background: T.offWhite, borderBottom: `1px solid ${T.gray100}` }}>
          <h3 className="text-lg font-bold mb-1" style={{ color: T.black }}>اشتراك التوصيات</h3>
        </div>
        <div className="p-5">
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div className="rounded-xl p-4 text-center" style={{ background: T.greenBg, border: `1px solid ${T.greenBorder}` }}>
              <span className="text-[10px] font-bold block mb-1" style={{ color: T.green }}>قبل الإطلاق</span>
              <Mono className="text-3xl font-black" style={{ color: T.green }}>77</Mono><span className="text-sm font-bold" style={{ color: T.green }}>$ /شهر</span>
            </div>
            <div className="rounded-xl p-4 text-center" style={{ background: T.offWhite }}>
              <span className="text-[10px] font-bold block mb-1" style={{ color: T.gray400 }}>بعد الإطلاق</span>
              <Mono className="text-3xl font-black" style={{ color: T.gray400, textDecoration: "line-through" }}>119</Mono><span className="text-sm font-bold" style={{ color: T.gray400 }}>$ /شهر</span>
            </div>
          </div>
          <p className="text-xs text-center" style={{ color: T.gray400 }}>التوصيات لا تمثل نصيحة مالية. القرار النهائي مسؤولية المتداول.</p>
        </div>
      </div>

      <button onClick={onRegister} className="w-full py-4 rounded-2xl text-base font-bold transition-all hover:opacity-90 active:scale-[0.97]" style={{ background: T.black, color: "#fff" }}>
        سجّل في قائمة الانتظار واحصل على الخصم
      </button>
    </>
  );
}

/* ═══════════════════════════════════════════
   OVERLAY — NEWS
   ═══════════════════════════════════════════ */
function NewsOverlayContent({ onRegister }) {
  return (
    <>
      <h2 className="text-2xl sm:text-3xl font-black mb-3" style={{ color: T.black }}>غرفة التحليل الإخباري</h2>
      <p className="text-base leading-[1.8] mb-8" style={{ color: T.gray500 }}>
        الأخبار العادية تعطيك الخبر وتتركك وحدك. عندنا: نأخذ كل خبر عبر مسار تحليلي كامل — من الخبر إلى القرار.
      </p>

      {/* Comparison */}
      <div className="grid grid-cols-2 gap-3 mb-8">
        <div className="rounded-2xl border p-4" style={{ borderColor: T.gray100 }}>
          <div className="text-sm font-bold mb-3 pb-2" style={{ color: T.gray400, borderBottom: `1px solid ${T.gray100}` }}>الأخبار العادية</div>
          {["خبر بدون تفسير", "لا يوضح التأثير", "لا سيناريوهات", "يتركك تحلل وحدك", "لا يوضح الأصول المتأثرة"].map((t, i) => (
            <div key={i} className="flex items-center gap-2 mb-2">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={T.red} strokeWidth="3" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
              <span className="text-xs" style={{ color: T.gray500 }}>{t}</span>
            </div>
          ))}
        </div>
        <div className="rounded-2xl border p-4" style={{ borderColor: T.greenBorder, background: T.greenBg }}>
          <div className="text-sm font-bold mb-3 pb-2" style={{ color: T.green, borderBottom: `1px solid ${T.greenBorder}` }}>ZeroSpread</div>
          {["تحليل كامل 100%", "تفسير التأثير المتوقع", "سيناريوهات واحتمالات", "هل تتداول أم تنتظر؟", "الأصول المتأثرة"].map((t, i) => (
            <div key={i} className="flex items-center gap-2 mb-2">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={T.green} strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12" /></svg>
              <span className="text-xs font-semibold" style={{ color: T.gray700 }}>{t}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Live Example */}
      <h3 className="text-lg font-bold mb-4" style={{ color: T.black }}>مثال: كيف نحلل خبراً</h3>

      <div className="rounded-2xl border overflow-hidden mb-8" style={{ borderColor: T.gray100, boxShadow: "0 4px 24px rgba(0,0,0,0.06)" }}>
        {/* Newsroom Header */}
        <div className="px-5 py-3 flex items-center justify-between" style={{ background: T.black }}>
          <div className="flex items-center gap-2.5">
            <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: T.red }} />
            <span className="text-[11px] font-bold tracking-widest" style={{ color: "#fff", letterSpacing: "0.12em" }}>BREAKING</span>
          </div>
          <span className="text-[10px]" style={{ color: T.gray400 }}>تحليل مباشر</span>
        </div>

        {/* Headline */}
        <div className="px-5 pt-5 pb-4" style={{ borderBottom: `1px solid ${T.gray100}` }}>
          <div className="flex gap-2 mb-3">
            {[{ v: "اقتصاد كلي", bg: T.offWhite, c: T.gray700 }, { v: "قرار فائدة", bg: T.amberBg, c: T.amber }].map((tag, i) => (
              <span key={i} className="text-[10px] font-bold px-2.5 py-1 rounded-md" style={{ background: tag.bg, color: tag.c }}>{tag.v}</span>
            ))}
          </div>
          <h4 className="text-lg font-black leading-[1.5]" style={{ color: T.black }}>الفيدرالي يثبّت الفائدة عند 5.25% للاجتماع الثالث</h4>
        </div>

        {/* Analysis Pipeline Steps */}
        <div className="p-5 space-y-0">
          {[
            { step: "01", label: "الخبر", t: "خبر اقتصادي رئيسي يؤثر على جميع الأسواق.", detail: "ماذا يعني للمتداول؟ — هذا ما نجيب عليه.", c: T.gray500, bg: T.white, border: T.gray100 },
            { step: "02", label: "التحليل", t: "لهجة أقل تشدداً — احتمال خفض قريب.", detail: "ضعف الدولار يدعم أصول المخاطرة: ذهب، أسهم، كريبتو.", c: T.black, bg: T.white, border: T.gray100 },
            { step: "03", label: "التأثير", t: "ضغط على الدولار — حركة متوقعة خلال 24-48 ساعة.", detail: "الأصول المتأثرة: XAU, BTC, ETH, S&P 500.", c: T.amber, bg: T.amberBg, border: T.amberBorder },
            { step: "04", label: "القرار", t: "فرص شراء — مراقبة الدعم — عدم التسرع.", detail: "ننتظر تأكيداً فنياً. إذا لم يأتِ — ننتظر الفرصة القادمة.", c: T.green, bg: T.greenBg, border: T.greenBorder },
          ].map((s, i) => (
            <div key={i}>
              <div className="flex gap-4 items-start">
                <div className="flex flex-col items-center shrink-0">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: i === 3 ? T.green : T.offWhite }}>
                    <Mono className="text-[10px] font-bold" style={{ color: i === 3 ? "#fff" : T.gray400 }}>{s.step}</Mono>
                  </div>
                  {i < 3 && <div className="w-px h-6" style={{ background: T.gray200 }} />}
                </div>
                <div className="flex-1 rounded-xl p-4 mb-1" style={{ background: s.bg, border: `1px solid ${s.border}` }}>
                  <div className="text-[10px] font-bold mb-1" style={{ color: s.c, letterSpacing: "0.05em" }}>{s.label}</div>
                  <div className="text-sm font-bold mb-1" style={{ color: T.black }}>{s.t}</div>
                  <p className="text-sm leading-[1.7]" style={{ color: T.gray500 }}>{s.detail}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Affected Assets */}
        <div className="px-5 pb-5">
          <div className="rounded-xl p-4" style={{ background: T.offWhite, border: `1px solid ${T.gray100}` }}>
            <span className="text-[10px] font-bold block mb-2.5" style={{ color: T.gray400, letterSpacing: "0.05em" }}>الأصول المتأثرة</span>
            <div className="flex gap-2">
              {[
                { s: "XAU", d: "صعود", c: T.green },
                { s: "BTC", d: "صعود", c: T.green },
                { s: "DXY", d: "هبوط", c: T.red },
                { s: "SPX", d: "صعود", c: T.green },
              ].map((a, i) => (
                <div key={i} className="flex-1 rounded-lg py-2 px-1 text-center" style={{ background: T.white, border: `1px solid ${T.gray100}` }}>
                  <Mono className="text-[10px] font-bold block" style={{ color: T.black }}>{a.s}</Mono>
                  <span className="text-[9px] font-semibold" style={{ color: a.c }}>{a.d}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Questions we answer */}
      <div className="rounded-2xl border overflow-hidden mb-8" style={{ borderColor: T.gray100 }}>
        <div className="px-5 py-4" style={{ background: T.offWhite, borderBottom: `1px solid ${T.gray100}` }}>
          <h3 className="text-base font-bold" style={{ color: T.black }}>الأسئلة التي نجيب عليها مع كل خبر</h3>
        </div>
        <div className="p-5">
          <div className="grid grid-cols-2 gap-2">
            {["هل نتداول الآن؟", "هل ننتظر؟", "هل هناك خطر؟", "هل هناك فرصة؟", "ما الأصول المتأثرة؟", "ما السيناريو الأقرب؟"].map((q, i) => (
              <div key={i} className="rounded-xl p-3 text-center" style={{ background: T.offWhite, border: `1px solid ${T.gray100}` }}>
                <span className="text-sm font-semibold" style={{ color: T.gray700 }}>{q}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <button onClick={onRegister} className="w-full py-4 rounded-2xl text-base font-bold transition-all hover:opacity-90 active:scale-[0.97]" style={{ background: T.black, color: "#fff" }}>
        سجّل في قائمة الانتظار
      </button>
    </>
  );
}

/* ═══════════════════════════════════════════
   OVERLAY — TOOLS
   ═══════════════════════════════════════════ */
function ToolsOverlayContent({ onRegister }) {
  return (
    <>
      <h2 className="text-2xl sm:text-3xl font-black mb-3" style={{ color: T.black }}>أدوات تحليل متقدمة</h2>
      <p className="text-base leading-[1.8] mb-8" style={{ color: T.gray500 }}>
        بدلاً من التنقل بين عشرات المواقع — كل ما تحتاجه في واجهة واحدة: رسوم بيانية، بيانات لحظية، مختبر استراتيجيات.
      </p>

      <div className="space-y-3 mb-8">
        <div className="rounded-2xl border overflow-hidden" style={{ borderColor: T.gray100 }}>
          <div className="px-5 pt-4 pb-1.5 flex items-center justify-between">
            <span className="text-sm font-bold" style={{ color: T.black }}>واجهة التحليل</span>
            <div className="flex gap-1">
              {["1D", "4H", "1H", "15M"].map((tf, i) => (
                <span key={i} className="text-[10px] font-semibold px-2 py-0.5 rounded-md" style={{ background: i === 0 ? T.black : T.offWhite, color: i === 0 ? "#fff" : T.gray400 }}>{tf}</span>
              ))}
            </div>
          </div>
          <div className="px-2.5 pb-2.5"><div className="rounded-xl overflow-hidden" style={{ background: T.offWhite }}><CandleStrip count={36} height={72} seed={456} /></div></div>
          <div className="px-5 pb-4">
            <p className="text-sm leading-[1.7]" style={{ color: T.gray500 }}>رسوم بيانية تفاعلية بشموع يابانية. MA-50, MA-200, RSI, MACD, حجم التداول — كلها متاحة.</p>
          </div>
        </div>

        <div className="rounded-2xl border p-5" style={{ borderColor: T.gray100 }}>
          <h3 className="text-base font-bold mb-2" style={{ color: T.black }}>بيانات لحظية</h3>
          <div className="grid grid-cols-3 gap-2 mb-3">
            {[{ s: "BTC", v: "67,420", ch: "+2.4%", up: true }, { s: "ETH", v: "3,512", ch: "-0.8%", up: false }, { s: "SOL", v: "178.5", ch: "+5.1%", up: true }].map((d, i) => (
              <div key={i} className="rounded-xl p-3 text-center" style={{ background: T.offWhite }}>
                <Mono className="text-[10px] font-bold block mb-0.5" style={{ color: T.gray400 }}>{d.s}</Mono>
                <Mono className="text-sm font-bold block" style={{ color: T.black }}>{d.v}</Mono>
                <Mono className="text-[10px] font-bold mt-0.5 block" style={{ color: d.up ? T.green : T.red }}>{d.ch}</Mono>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border p-5" style={{ borderColor: T.gray100 }}>
          <h3 className="text-base font-bold mb-2" style={{ color: T.black }}>مختبر الاستراتيجيات</h3>
          <p className="text-sm leading-[1.8] mb-3" style={{ color: T.gray500 }}>اختبر استراتيجيتك قبل المخاطرة بأموال حقيقية. اجمع المؤشرات وشاهد النتائج على بيانات تاريخية.</p>
          <div className="grid grid-cols-2 gap-2">
            {["دمج المؤشرات", "بيانات تاريخية", "شروط الدخول والخروج", "تقرير الأداء"].map((t, i) => (
              <div key={i} className="rounded-xl p-3 text-center" style={{ background: T.offWhite }}>
                <span className="text-xs font-semibold" style={{ color: T.gray700 }}>{t}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border overflow-hidden mb-8" style={{ borderColor: T.gray100 }}>
        <div className="p-5" style={{ background: T.offWhite }}>
          <h3 className="text-lg font-bold mb-1" style={{ color: T.black }}>اشتراك الأدوات</h3>
        </div>
        <div className="p-5">
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div className="rounded-xl p-4 text-center" style={{ background: T.greenBg, border: `1px solid ${T.greenBorder}` }}>
              <span className="text-xs block mb-1" style={{ color: T.green }}>قبل الإطلاق</span>
              <Mono className="text-3xl font-black" style={{ color: T.green }}>32</Mono><span className="text-sm font-bold" style={{ color: T.green }}>$ /شهر</span>
            </div>
            <div className="rounded-xl p-4 text-center" style={{ background: T.offWhite }}>
              <span className="text-xs block mb-1" style={{ color: T.gray400 }}>بعد الإطلاق</span>
              <Mono className="text-3xl font-black" style={{ color: T.gray400, textDecoration: "line-through" }}>49</Mono><span className="text-sm font-bold" style={{ color: T.gray400 }}>$ /شهر</span>
            </div>
          </div>
        </div>
      </div>

      <button onClick={onRegister} className="w-full py-4 rounded-2xl text-base font-bold transition-all hover:opacity-90 active:scale-[0.97]" style={{ background: T.black, color: "#fff" }}>
        سجّل في قائمة الانتظار واحصل على الخصم
      </button>
    </>
  );
}

/* ═══════════════════════════════════════════
   PAGE
   ═══════════════════════════════════════════ */
const LAUNCH = new Date("2025-05-05T00:00:00+03:00").getTime();

export default function WaitlistPage() {
  const countdown = useCountdown(LAUNCH);

  const [activeOverlay, setActiveOverlay] = useState(null);
  const openOverlay = useCallback((id) => setActiveOverlay(id), []);
  const closeOverlay = useCallback(() => setActiveOverlay(null), []);
  const openRegister = useCallback(() => openOverlay("register"), []);
  const goToRegisterFromOverlay = useCallback(() => { closeOverlay(); setTimeout(() => openOverlay("register"), 400); }, []);

  const scrollToContent = () => document.getElementById("pillars")?.scrollIntoView({ behavior: "smooth" });

  const [labIdx, setLabIdx] = useState(0);
  const labCases = [
    { bull: true, body: 0.7, wu: 0.05, wd: 0.05, name: "ماروبوزو صعودي", desc: "سيطرة مطلقة للمشترين — زخم قوي جدًا", tag: "زخم", tagC: T.green },
    { bull: false, body: 0.6, wu: 0.08, wd: 0.05, name: "بيع قوية", desc: "ضغط بيعي واضح — البائعون مسيطرون", tag: "بيع", tagC: T.red },
    { bull: true, body: 0.1, wu: 0.05, wd: 0.6, name: "مطرقة", desc: "رفض للأسعار المنخفضة — إشارة انعكاس صعودي", tag: "انعكاس", tagC: T.green },
    { bull: false, body: 0.1, wu: 0.6, wd: 0.05, name: "نجمة ساقطة", desc: "محاولة صعود فاشلة — إشارة هبوط", tag: "انعكاس", tagC: T.red },
    { bull: true, body: 0.05, wu: 0.4, wd: 0.4, name: "دوجي", desc: "حيرة كاملة — انتظر التأكيد", tag: "حيرة", tagC: T.gray500 },
  ];
  const activeCandle = labCases[labIdx];

  return (
    <div style={{ background: T.white, color: T.black, fontFamily: "'Tajawal', sans-serif" }} className="overflow-x-hidden min-h-screen">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@300;400;500;700;800;900&family=JetBrains+Mono:wght@300;400;600;700;800&display=swap');
        html{scroll-behavior:smooth}
        ::selection{background:${T.black};color:#fff}
        @keyframes candleFloat{0%{transform:translateY(0)}100%{transform:translateY(-5px)}}
        @keyframes fadeIn{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:none}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}
        .animate-pulse{animation:pulse 2s cubic-bezier(0.4,0,0.6,1) infinite}
        .fade-in{animation:fadeIn .6s ease forwards}
        .fade-d1{animation:fadeIn .6s .1s ease forwards;opacity:0}
        .fade-d2{animation:fadeIn .6s .2s ease forwards;opacity:0}
        .fade-d3{animation:fadeIn .6s .3s ease forwards;opacity:0}
        .fade-d4{animation:fadeIn .6s .35s ease forwards;opacity:0}
        input:focus,textarea:focus{outline:none}
        ::-webkit-scrollbar{width:4px}
        ::-webkit-scrollbar-thumb{background:#e5e7eb;border-radius:4px}
      `}</style>

      {/* ━━━ OVERLAYS ━━━ */}
      <Overlay open={activeOverlay === "register"} onClose={closeOverlay} title="التسجيل">
        <RegisterOverlayContent onClose={closeOverlay} />
      </Overlay>
      <Overlay open={activeOverlay === "academy"} onClose={closeOverlay} title="الأكاديمية">
        <AcademyOverlayContent onRegister={goToRegisterFromOverlay} />
      </Overlay>
      <Overlay open={activeOverlay === "lab"} onClose={closeOverlay} title="مختبر الشموع">
        <LabOverlayContent onRegister={goToRegisterFromOverlay} />
      </Overlay>
      <Overlay open={activeOverlay === "signals"} onClose={closeOverlay} title="التوصيات">
        <SignalsOverlayContent onRegister={goToRegisterFromOverlay} />
      </Overlay>
      <Overlay open={activeOverlay === "news"} onClose={closeOverlay} title="تحليل الأخبار">
        <NewsOverlayContent onRegister={goToRegisterFromOverlay} />
      </Overlay>
      <Overlay open={activeOverlay === "tools"} onClose={closeOverlay} title="الأدوات">
        <ToolsOverlayContent onRegister={goToRegisterFromOverlay} />
      </Overlay>

      {/* ━━━ NAV ━━━ */}
      <nav dir="rtl" className="fixed top-0 w-full z-50" style={{ background: "rgba(255,255,255,0.88)", backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)", borderBottom: `1px solid ${T.gray100}` }}>
        <div className="max-w-2xl mx-auto flex items-center justify-between px-5 h-14">
          <Wordmark size="lg" />
          <button onClick={openRegister} className="px-5 py-2.5 rounded-xl text-sm font-bold transition-all hover:opacity-85 active:scale-[0.97]"
            style={{ background: T.black, color: "#fff" }}>سجّل الآن</button>
        </div>
      </nav>

      {/* ━━━━━━━━━━━━━━━━━━
          1. HERO
          ━━━━━━━━━━━━━━━━━━ */}
      <section dir="rtl" className="relative pt-28 pb-16 px-5 overflow-hidden" style={{ background: T.white }}>
        <div className="max-w-2xl mx-auto">
          <div className="text-center fade-in mb-8">
            <span className="inline-flex items-center gap-2.5 text-xs font-bold px-5 py-2 rounded-full"
              style={{ background: T.offWhite, color: T.gray500, border: `1px solid ${T.gray100}` }}>
              <span className="w-2 h-2 rounded-full" style={{ background: T.green, animation: "candleFloat 2s ease-in-out infinite alternate" }} />
              الإطلاق الرسمي — 05 / 05 / 2026            
          </div>

          <div className="fade-d1 text-center mb-4">
            <Wordmark size="3xl" className="tracking-wide" />
          </div>

          <h1 className="fade-d1 text-center text-[32px] sm:text-[44px] md:text-[52px] font-black leading-[1.15] mb-7" style={{ color: T.black, letterSpacing: "-0.02em" }}>
            تعلّم التداول.
            <br />افهم السوق.
            <br /><span style={{ color: T.gray400 }}>وابدأ بثقة.</span>
          </h1>

          <p className="fade-d2 text-center text-base sm:text-lg leading-[1.8] mb-12 max-w-lg mx-auto" style={{ color: T.gray500 }}>
            أكاديمية، توصيات، تحليل أخبار، وأدوات متقدمة —
            <br className="hidden sm:block" />
            منظومة واحدة صُمّمت للمتداول العربي.
          </p>

          <div className="fade-d3 flex flex-col sm:flex-row gap-3 justify-center items-center mb-16">
            <button onClick={openRegister}
              className="w-full sm:w-auto px-10 py-[18px] rounded-2xl text-base font-bold transition-all hover:opacity-90 active:scale-[0.97] flex items-center justify-center gap-2.5"
              style={{ background: T.black, color: "#fff" }}>
              انضم إلى قائمة الانتظار
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M19 12H5M12 5l-7 7 7 7" /></svg>
            </button>
            <button onClick={scrollToContent}
              className="w-full sm:w-auto px-10 py-[18px] rounded-2xl text-base font-bold transition-all hover:bg-gray-50 active:scale-[0.97]"
              style={{ background: "transparent", color: T.gray500, border: `1.5px solid ${T.gray100}` }}>
              اكتشف ما نقدّمه
            </button>
          </div>

          <div className="fade-d4"><PhoneMockup /></div>

          <div className="flex gap-3 justify-center mt-14" dir="ltr">
            {[{ v: countdown.s, l: "ثانية" }, { v: countdown.m, l: "دقيقة" }, { v: countdown.h, l: "ساعة" }, { v: countdown.d, l: "يوم" }].map((x, i) => (
              <div key={i} className="text-center min-w-[60px] py-4 rounded-2xl" style={{ background: T.offWhite, border: `1px solid ${T.gray100}` }}>
                <Mono className="text-xl font-bold block" style={{ color: T.black }}>{String(x.v).padStart(2, "0")}</Mono>
                <span className="text-[10px] mt-1 block" style={{ color: T.gray400 }}>{x.l}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ━━━━━━━━━━━━━━━━━━
          2. FOUR PILLARS
          ━━━━━━━━━━━━━━━━━━ */}
      <SectionWrap bg={T.offWhite} id="pillars">
        <Reveal>
          <h2 className="text-2xl sm:text-3xl font-black text-center mb-2" style={{ color: T.black }}>أربعة أعمدة، منظومة واحدة</h2>
          <p className="text-base text-center mb-12 leading-relaxed" style={{ color: T.gray500 }}>كل عمود يعمل بذاته — ومعاً يقدّمون ما لا يقدّمه أحد</p>
        </Reveal>

        <div className="space-y-4">
          {[
            { id: "signals", title: "التوصيات", sub: "سيناريو كامل لكل صفقة", visual: (
              <div className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <GoldIcon size={28} />
                    <div>
                      <Mono className="text-sm font-bold block leading-tight" style={{ color: T.black }}>XAU/USD</Mono>
                      <span className="text-[10px]" style={{ color: T.gold }}>الذهب</span>
                    </div>
                  </div>
                  <Chip color={T.green}>شراء</Chip>
                </div>
                <div className="rounded-xl overflow-hidden mb-3" style={{ background: T.goldBg, height: 40 }}><CandleStrip count={24} height={40} seed={88} /></div>
                <div className="grid grid-cols-3 gap-1.5">
                  {[{ l: "الدخول", v: "2,385", c: T.black, bg: T.offWhite }, { l: "الهدف", v: "2,420", c: T.green, bg: T.greenBg }, { l: "الوقف", v: "2,358", c: T.red, bg: T.redBg }].map((x, i) => (
                    <div key={i} className="rounded-lg p-2 text-center" style={{ background: x.bg }}><div className="text-[9px] mb-0.5" style={{ color: T.gray400 }}>{x.l}</div><Mono className="text-xs font-bold" style={{ color: x.c }}>{x.v}</Mono></div>
                  ))}
                </div>
              </div>
            )},
            { id: "academy", title: "الأكاديمية", sub: "من الصفر إلى الاحتراف", visual: (
              <div className="p-5">
                <div className="flex items-center gap-4">
                  <div className="shrink-0 rounded-xl p-2" style={{ background: T.offWhite }}><Candle bullish body={0.65} wickUp={0.07} wickDown={0.05} h={72} w={28} animate /></div>
                  <div className="flex-1 min-w-0">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md inline-block mb-1.5" style={{ background: T.greenBg, color: T.green }}>الفصل الثاني</span>
                    <div className="text-sm font-bold mb-1" style={{ color: T.black }}>شمعة صعودية قوية</div>
                    <div className="text-xs mb-2" style={{ color: T.gray500 }}>جسم كبير + ظل قصير = سيطرة المشترين</div>
                    <div className="h-1.5 rounded-full" style={{ background: T.gray100 }}><div className="h-full rounded-full" style={{ width: "65%", background: T.green }} /></div>
                  </div>
                </div>
              </div>
            )},
            { id: "news", title: "تحليل الأخبار", sub: "غرفة تحليل مباشرة", visual: (
              <div className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full animate-pulse" style={{ background: T.red }} /><span className="text-[10px] font-bold tracking-wide" style={{ color: T.red, letterSpacing: "0.08em" }}>LIVE</span></div>
                  <span className="text-[10px]" style={{ color: T.gray400 }}>منذ 12 دقيقة</span>
                </div>
                <div className="text-sm font-bold leading-relaxed mb-3" style={{ color: T.black }}>الفيدرالي يثبّت الفائدة — لهجة أقل تشدداً من المتوقع</div>
                <div className="flex gap-1.5 mb-3">
                  {[{ l: "التأثير", v: "عالي", c: "#fff", bg: T.amber }, { l: "الحالة", v: "ترقّب", c: T.black, bg: T.offWhite }, { l: "القرار", v: "فرصة", c: "#fff", bg: T.green }].map((t, i) => (
                    <div key={i} className="flex-1 rounded-lg py-2 px-1 text-center" style={{ background: t.bg }}><span className="text-[10px] font-bold" style={{ color: t.c }}>{t.v}</span></div>
                  ))}
                </div>
                <div className="flex gap-1">
                  {["XAU", "BTC", "DXY"].map((a, i) => (
                    <span key={i} className="text-[9px] font-bold px-2 py-1 rounded-md" style={{ ...mono, background: T.offWhite, color: T.gray500 }}>{a}</span>
                  ))}
                </div>
              </div>
            )},
            { id: "tools", title: "أدوات التحليل", sub: "بيانات وتحليل في مكان واحد", visual: (
              <div className="p-5">
                <div className="flex gap-1 mb-3">{["1D", "4H", "1H"].map((tf, i) => (<span key={i} className="text-[9px] font-bold px-2 py-0.5 rounded-md" style={{ background: i === 0 ? T.black : T.offWhite, color: i === 0 ? "#fff" : T.gray400 }}>{tf}</span>))}</div>
                <div className="rounded-xl overflow-hidden mb-3" style={{ background: T.offWhite, height: 48 }}><CandleStrip count={30} height={48} seed={200} /></div>
                <div className="grid grid-cols-3 gap-1.5">
                  {[{ s: "BTC", v: "67,420", ch: "+2.4%", up: true }, { s: "ETH", v: "3,512", ch: "-0.8%" }, { s: "SOL", v: "178.5", ch: "+5.1%", up: true }].map((d, i) => (
                    <div key={i} className="rounded-lg p-2 text-center" style={{ background: T.offWhite }}><Mono className="text-[9px] font-bold block" style={{ color: T.gray400 }}>{d.s}</Mono><Mono className="text-xs font-bold block" style={{ color: T.black }}>{d.v}</Mono><Mono className="text-[9px] font-bold block" style={{ color: d.up ? T.green : T.red }}>{d.ch}</Mono></div>
                  ))}
                </div>
              </div>
            )},
          ].map((p, i) => (
            <Reveal key={p.id} delay={i * 0.05}>
              <div className="bg-white rounded-2xl border overflow-hidden transition-shadow hover:shadow-lg cursor-pointer" style={{ borderColor: T.gray100 }}
                onClick={() => openOverlay(p.id)} role="button" tabIndex={0}>
                <div className="px-5 pt-5 flex items-center justify-between">
                  <div><h3 className="text-lg font-bold" style={{ color: T.black }}>{p.title}</h3><p className="text-xs" style={{ color: T.gray500 }}>{p.sub}</p></div>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={T.gray400} strokeWidth="2" strokeLinecap="round"><path d="M19 12H5M12 5l-7 7 7 7" /></svg>
                </div>
                {p.visual}
              </div>
            </Reveal>
          ))}
        </div>
      </SectionWrap>

      {/* ━━━━━━━━━━━━━━━━━━
          3. ACADEMY SECTION
          ━━━━━━━━━━━━━━━━━━ */}
      <SectionWrap>
        <Reveal>
          <Chip color={T.green}>الأكاديمية</Chip>
          <h2 className="text-2xl sm:text-3xl font-black mt-4 mb-3" style={{ color: T.black }}>تعلّم بالمثال، لا بالكلام</h2>
          <p className="text-base leading-[1.8] mb-10" style={{ color: T.gray500 }}>أكاديمية حقيقية تأخذك من الصفر — بمنهج متسلسل، بروفيسور مرافق، ودعم تعليمي لمدة سنة كاملة</p>
        </Reveal>

        <Reveal delay={0.06}>
          <div className="rounded-2xl border overflow-hidden mb-6" style={{ borderColor: T.gray100, boxShadow: "0 2px 16px rgba(0,0,0,0.05)" }}>
            <div className="p-5 sm:p-6">
              <span className="inline-block text-[11px] font-bold px-2.5 py-1 rounded-lg mb-4" style={{ background: T.greenBg, color: T.green }}>مثال من الدرس</span>
              <div className="flex items-center gap-5">
                <div className="shrink-0"><Candle bullish body={0.65} wickUp={0.07} wickDown={0.05} h={110} w={44} animate /></div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-bold mb-1.5" style={{ color: T.black }}>شمعة صعودية قوية</h3>
                  <p className="text-sm leading-relaxed mb-3" style={{ color: T.gray500 }}>جسم كبير يغطي معظم المدى — سيطرة كاملة للمشترين. إغلاق قريب من أعلى نقطة.</p>
                  <div className="flex gap-2 flex-wrap">
                    {[{ l: "الجسم", v: "65%" }, { l: "ظل علوي", v: "7%" }, { l: "ظل سفلي", v: "5%" }].map((x, i) => (
                      <div key={i} className="rounded-lg px-3 py-1.5" style={{ background: T.offWhite }}>
                        <span className="text-[10px] block" style={{ color: T.gray400 }}>{x.l}</span>
                        <Mono className="text-xs font-bold" style={{ color: i === 0 ? T.green : T.gray400 }}>{x.v}</Mono>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <div className="px-5 sm:px-6 py-3.5" style={{ background: T.offWhite, borderTop: `1px solid ${T.gray100}` }}>
              <div className="flex justify-between text-sm mb-1.5">
                <span style={{ color: T.gray500 }}>الفصل الثاني — الشموع اليابانية</span>
                <Mono className="font-bold" style={{ color: T.green }}>65%</Mono>
              </div>
              <div className="h-1.5 rounded-full" style={{ background: T.gray100 }}><div className="h-full rounded-full" style={{ width: "65%", background: T.green }} /></div>
            </div>
          </div>
        </Reveal>

        <Reveal delay={0.1}>
          <div className="flex items-center gap-2 overflow-x-auto pb-2" style={{ scrollbarWidth: "none" }}>
            {["الأساسيات", "الشموع", "التحليل الفني", "إدارة المخاطر", "الاستراتيجية", "المحفظة"].map((m, i) => (
              <div key={i} className="shrink-0 rounded-full py-2 px-4 flex items-center gap-2" style={{ background: i === 1 ? T.black : T.white, border: `1px solid ${T.gray100}` }}>
                <Mono className="text-[10px] font-bold" style={{ color: i === 1 ? T.gray400 : T.gray200 }}>{String(i + 1).padStart(2, "0")}</Mono>
                <span className="text-xs font-semibold" style={{ color: i === 1 ? "#fff" : T.black }}>{m}</span>
              </div>
            ))}
          </div>
        </Reveal>

        <DiscoverBtn onClick={() => openOverlay("academy")} label="اكتشف الأكاديمية بالكامل" />
      </SectionWrap>

      {/* ━━━━━━━━━━━━━━━━━━
          4. CANDLE LAB
          ━━━━━━━━━━━━━━━━━━ */}
      <SectionWrap bg={T.offWhite}>
        <Reveal>
          <Chip color={T.green}>مختبر الشموع</Chip>
          <h2 className="text-2xl sm:text-3xl font-black mt-4 mb-3" style={{ color: T.black }}>اكتشف ما تخبرك به كل شمعة</h2>
          <p className="text-base mb-10" style={{ color: T.gray500 }}>اضغط على أي حالة لقراءة التحليل</p>
        </Reveal>

        <Reveal delay={0.06}>
          <div className="flex gap-2 overflow-x-auto pb-3 mb-6 -mx-1 px-1" style={{ scrollbarWidth: "none" }}>
            {labCases.map((c, i) => (
              <button key={i} onClick={() => setLabIdx(i)}
                className="shrink-0 rounded-2xl p-3 flex flex-col items-center min-w-[70px] transition-all"
                style={{ background: labIdx === i ? T.white : T.gray50, border: `1.5px solid ${labIdx === i ? T.gray200 : "transparent"}`, boxShadow: labIdx === i ? "0 2px 12px rgba(0,0,0,0.06)" : "none" }}>
                <Candle bullish={c.bull} body={c.body} wickUp={c.wu} wickDown={c.wd} h={48} w={20} />
                <span className="text-[10px] font-bold mt-1.5 text-center" style={{ color: labIdx === i ? T.black : T.gray400 }}>{c.name}</span>
              </button>
            ))}
          </div>
        </Reveal>

        <Reveal delay={0.1}>
          <div className="bg-white rounded-2xl border p-5 sm:p-6" style={{ borderColor: T.gray100, boxShadow: "0 2px 16px rgba(0,0,0,0.05)" }}>
            <div className="flex items-start gap-5">
              <div className="shrink-0"><Candle bullish={activeCandle.bull} body={activeCandle.body} wickUp={activeCandle.wu} wickDown={activeCandle.wd} h={130} w={46} animate /></div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <h3 className="text-lg font-bold" style={{ color: T.black }}>{activeCandle.name}</h3>
                  <Chip color={activeCandle.tagC}>{activeCandle.tag}</Chip>
                </div>
                <p className="text-sm leading-relaxed mb-4" style={{ color: T.gray500 }}>{activeCandle.desc}</p>
                <div className="flex gap-2">
                  {[{ l: "الجسم", v: activeCandle.body }, { l: "ظل علوي", v: activeCandle.wu }, { l: "ظل سفلي", v: activeCandle.wd }].map((x, i) => (
                    <div key={i} className="rounded-lg px-3 py-2 text-center flex-1" style={{ background: T.offWhite }}>
                      <div className="text-[10px]" style={{ color: T.gray400 }}>{x.l}</div>
                      <Mono className="text-xs font-bold" style={{ color: T.black }}>{Math.round(x.v * 100)}%</Mono>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </Reveal>

        <Reveal delay={0.14}>
          <div className="grid grid-cols-2 gap-3 mt-6">
            <div className="bg-white rounded-2xl border p-4 text-center" style={{ borderColor: T.greenBorder }}>
              <Candle bullish body={0.65} wickUp={0.07} wickDown={0.05} h={80} w={30} />
              <div className="text-sm font-bold mt-2" style={{ color: T.green }}>قوية</div>
              <div className="text-xs mt-0.5" style={{ color: T.gray500 }}>جسم كبير، ظلال قصيرة</div>
            </div>
            <div className="bg-white rounded-2xl border p-4 text-center" style={{ borderColor: T.redBorder }}>
              <Candle bullish={false} body={0.12} wickUp={0.38} wickDown={0.38} h={80} w={30} />
              <div className="text-sm font-bold mt-2" style={{ color: T.red }}>ضعيفة</div>
              <div className="text-xs mt-0.5" style={{ color: T.gray500 }}>جسم صغير، ظلال طويلة</div>
            </div>
          </div>
        </Reveal>

        <DiscoverBtn onClick={() => openOverlay("lab")} label="اكتشف المختبر بالكامل" />
      </SectionWrap>

      {/* ━━━━━━━━━━━━━━━━━━
          5. SIGNALS
          ━━━━━━━━━━━━━━━━━━ */}
      <SectionWrap>
        <Reveal>
          <Chip color={T.green}>التوصيات</Chip>
          <h2 className="text-2xl sm:text-3xl font-black mt-4 mb-3" style={{ color: T.black }}>ليست إشارة — بل رؤية كاملة</h2>
          <p className="text-base mb-10 leading-[1.7]" style={{ color: T.gray500 }}>كل توصية تأتي مع سيناريوهات، متابعة، وإشعارات ذكية</p>
        </Reveal>

        <Reveal delay={0.06}>
          <div className="bg-white rounded-2xl border overflow-hidden" style={{ borderColor: T.gray100, boxShadow: "0 4px 24px rgba(0,0,0,0.06)" }}>
            {/* Trade Card Header */}
            <div className="px-5 sm:px-6 pt-5 sm:pt-6 pb-4" style={{ borderBottom: `1px solid ${T.gray100}` }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <GoldIcon size={44} />
                  <div>
                    <div className="flex items-center gap-2">
                      <Mono className="text-lg font-black" style={{ color: T.black }}>XAU/USD</Mono>
                      <span className="text-xs font-bold px-2 py-0.5 rounded-md" style={{ background: T.goldBg, color: T.gold, border: `1px solid ${T.goldBorder}` }}>الذهب</span>
                    </div>
                    <span className="text-sm" style={{ color: T.green }}>صفقة شراء — إطار 4 ساعات</span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <Chip color={T.green}>مثال</Chip>
                  <span className="text-[10px]" style={{ color: T.gray400 }}>منذ ساعتين</span>
                </div>
              </div>
            </div>

            {/* Price Chart Area */}
            <div className="px-3 py-3" style={{ background: T.offWhite }}>
              <div className="rounded-xl overflow-hidden" style={{ background: T.white, border: `1px solid ${T.gray100}` }}>
                <div className="px-3 pt-2 flex items-center justify-between">
                  <Mono className="text-[10px] font-bold" style={{ color: T.gray400 }}>4H</Mono>
                  <Mono className="text-xs font-bold" style={{ color: T.green }}>+0.82%</Mono>
                </div>
                <CandleStrip count={32} height={56} seed={77} />
              </div>
            </div>

            {/* Entry / TP / SL Grid */}
            <div className="px-5 sm:px-6 pt-4 pb-1">
              <div className="grid grid-cols-4 gap-2 mb-4">
                {[
                  { l: "الدخول", v: "2,385", c: T.black, bg: T.offWhite, border: T.gray100 },
                  { l: "الهدف 1", v: "2,420", c: T.green, bg: T.greenBg, border: T.greenBorder },
                  { l: "الهدف 2", v: "2,455", c: T.green, bg: T.greenBg, border: T.greenBorder },
                  { l: "الوقف", v: "2,358", c: T.red, bg: T.redBg, border: T.redBorder },
                ].map((x, i) => (
                  <div key={i} className="rounded-xl p-2.5 text-center" style={{ background: x.bg, border: `1px solid ${x.border}` }}>
                    <div className="text-[9px] font-semibold mb-0.5" style={{ color: T.gray400 }}>{x.l}</div>
                    <Mono className="text-[13px] font-black" style={{ color: x.c }}>{x.v}</Mono>
                  </div>
                ))}
              </div>
            </div>

            {/* Risk/Reward Strip */}
            <div className="px-5 sm:px-6 pb-4">
              <div className="flex items-center gap-2 mb-4 rounded-xl p-3" style={{ background: T.offWhite }}>
                <span className="text-[10px] font-semibold" style={{ color: T.gray400 }}>المخاطرة / العائد</span>
                <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: T.gray100 }}>
                  <div className="h-full rounded-full" style={{ width: "72%", background: `linear-gradient(90deg, ${T.green}, ${T.green})` }} />
                </div>
                <Mono className="text-xs font-black" style={{ color: T.green }}>1:2.6</Mono>
              </div>
            </div>

            {/* Scenarios */}
            <div className="px-5 sm:px-6 pb-5 sm:pb-6 space-y-2">
              {[
                { t: "السيناريو الأساسي", d: "ارتداد من دعم 2,380 مع تأكيد حجم — نستهدف مقاومة 2,420 ثم 2,455", dot: T.green, bg: T.greenBg, border: T.greenBorder },
                { t: "السيناريو البديل", d: "كسر 2,358 بإغلاق 4H — إلغاء الصفقة ومراقبة منطقة 2,330", dot: T.amber, bg: T.amberBg, border: T.amberBorder },
                { t: "ما بعد الدخول", d: "تعديل وقف الخسارة إلى 2,385 (نقطة الدخول) عند تحقق الهدف الأول", dot: T.black, bg: T.offWhite, border: T.gray100 },
              ].map((s, i) => (
                <div key={i} className="flex gap-3 rounded-xl p-4" style={{ background: s.bg, border: `1px solid ${s.border}` }}>
                  <div className="w-2.5 h-2.5 rounded-full mt-1 shrink-0" style={{ background: s.dot }} />
                  <div>
                    <span className="text-sm font-bold block mb-0.5" style={{ color: T.gray700 }}>{s.t}</span>
                    <span className="text-sm leading-relaxed" style={{ color: T.gray500 }}>{s.d}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Reveal>

        {/* Smart Notifications Preview */}
        <Reveal delay={0.1}>
          <div className="mt-4 rounded-2xl border p-5" style={{ borderColor: T.greenBorder, background: T.greenBg }}>
            <div className="flex items-center gap-2 mb-3">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={T.green} strokeWidth="2" strokeLinecap="round"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 01-3.46 0" /></svg>
              <span className="text-sm font-bold" style={{ color: T.green }}>إشعارات ذكية على هاتفك</span>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
              {["توصية جديدة على XAU", "الهدف الأول تحقق", "تحديث السيناريو", "تنبيه وقف الخسارة"].map((n, i) => (
                <div key={i} className="shrink-0 rounded-xl px-3.5 py-2" style={{ background: "rgba(255,255,255,0.7)", border: `1px solid ${T.greenBorder}` }}>
                  <span className="text-xs font-semibold whitespace-nowrap" style={{ color: T.gray700 }}>{n}</span>
                </div>
              ))}
            </div>
          </div>
        </Reveal>

        <DiscoverBtn onClick={() => openOverlay("signals")} label="اكتشف كيف تعمل التوصيات" />
      </SectionWrap>

      {/* ━━━━━━━━━━━━━━━━━━
          6. NEWS
          ━━━━━━━━━━━━━━━━━━ */}
      <SectionWrap bg={T.offWhite}>
        <Reveal>
          <Chip color={T.amber}>تحليل الأخبار</Chip>
          <h2 className="text-2xl sm:text-3xl font-black mt-4 mb-3" style={{ color: T.black }}>غرفة تحليل، ليست مجرد أخبار</h2>
          <p className="text-base mb-10 leading-[1.7]" style={{ color: T.gray500 }}>كل خبر يمر بمسار تحليلي كامل — من الخبر إلى القرار</p>
        </Reveal>

        <Reveal delay={0.06}>
          <div className="bg-white rounded-2xl border overflow-hidden" style={{ borderColor: T.gray100, boxShadow: "0 4px 24px rgba(0,0,0,0.06)" }}>
            {/* Newsroom Header Bar */}
            <div className="px-5 sm:px-6 py-3 flex items-center justify-between" style={{ background: T.black }}>
              <div className="flex items-center gap-2.5">
                <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: T.red }} />
                <span className="text-[11px] font-bold tracking-widest" style={{ color: "#fff", letterSpacing: "0.12em" }}>BREAKING</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px]" style={{ color: T.gray400 }}>منذ 12 دقيقة</span>
                <span className="w-1 h-1 rounded-full" style={{ background: T.gray500 }} />
                <span className="text-[10px] font-bold" style={{ color: T.amber }}>تأثير عالي</span>
              </div>
            </div>

            {/* Main Headline */}
            <div className="px-5 sm:px-6 pt-5 pb-4" style={{ borderBottom: `1px solid ${T.gray100}` }}>
              <h3 className="text-lg sm:text-xl font-black leading-[1.5] mb-3" style={{ color: T.black }}>الفيدرالي يثبّت الفائدة عند 5.25% — لهجة أقل تشدداً من المتوقع</h3>
              <div className="flex gap-2 flex-wrap">
                {[
                  { v: "اقتصاد كلي", bg: T.offWhite, c: T.gray700 },
                  { v: "قرار فائدة", bg: T.amberBg, c: T.amber },
                  { v: "عاجل", bg: T.redBg, c: T.red },
                ].map((tag, i) => (
                  <span key={i} className="text-[10px] font-bold px-2.5 py-1 rounded-md" style={{ background: tag.bg, color: tag.c }}>{tag.v}</span>
                ))}
              </div>
            </div>

            {/* Analysis Pipeline */}
            <div className="px-5 sm:px-6 py-4">
              <div className="flex items-center gap-0 mb-4 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
                {[
                  { step: "خبر", icon: "01", active: true },
                  { step: "تحليل", icon: "02", active: true },
                  { step: "تأثير", icon: "03", active: true },
                  { step: "قرار", icon: "04", active: false },
                ].map((s, i) => (
                  <div key={i} className="flex items-center shrink-0">
                    <div className="flex flex-col items-center">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-1" style={{ background: s.active ? T.black : T.offWhite }}>
                        <Mono className="text-[10px] font-bold" style={{ color: s.active ? "#fff" : T.gray400 }}>{s.icon}</Mono>
                      </div>
                      <span className="text-[10px] font-semibold" style={{ color: s.active ? T.black : T.gray400 }}>{s.step}</span>
                    </div>
                    {i < 3 && <div className="w-6 h-px mx-1 mt-[-12px]" style={{ background: T.gray200 }} />}
                  </div>
                ))}
              </div>

              {/* Impact Indicators */}
              <div className="grid grid-cols-3 gap-2 mb-4">
                {[
                  { l: "تقييم التأثير", v: "عالي", c: "#fff", bg: T.amber },
                  { l: "حالة السوق", v: "ترقّب", c: T.black, bg: T.offWhite },
                  { l: "التوصية", v: "فرصة شراء", c: "#fff", bg: T.green },
                ].map((t, i) => (
                  <div key={i} className="rounded-xl py-3 px-2 text-center" style={{ background: t.bg }}>
                    <div className="text-[8px] font-semibold mb-0.5" style={{ color: i === 1 ? T.gray400 : "rgba(255,255,255,0.7)" }}>{t.l}</div>
                    <span className="text-[11px] font-bold" style={{ color: t.c }}>{t.v}</span>
                  </div>
                ))}
              </div>

              {/* Affected Assets */}
              <div className="rounded-xl p-4" style={{ background: T.offWhite, border: `1px solid ${T.gray100}` }}>
                <span className="text-[10px] font-bold block mb-2.5" style={{ color: T.gray400, letterSpacing: "0.05em" }}>الأصول المتأثرة</span>
                <div className="flex gap-2">
                  {[
                    { s: "XAU", d: "صعود", c: T.green },
                    { s: "BTC", d: "صعود", c: T.green },
                    { s: "DXY", d: "هبوط", c: T.red },
                    { s: "SPX", d: "صعود", c: T.green },
                  ].map((a, i) => (
                    <div key={i} className="flex-1 rounded-lg py-2 px-1 text-center" style={{ background: T.white, border: `1px solid ${T.gray100}` }}>
                      <Mono className="text-[10px] font-bold block" style={{ color: T.black }}>{a.s}</Mono>
                      <span className="text-[9px] font-semibold" style={{ color: a.c }}>{a.d}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </Reveal>

        <DiscoverBtn onClick={() => openOverlay("news")} label="اكتشف كيف نحلل الأخبار" />
      </SectionWrap>

      {/* ━━━━━━━━━━━━━━━━━━
          7. TOOLS
          ━━━━━━━━━━━━━━━━━━ */}
      <SectionWrap>
        <Reveal>
          <Chip>الأدوات</Chip>
          <h2 className="text-2xl sm:text-3xl font-black mt-4 mb-3" style={{ color: T.black }}>أدوات تحليل متقدمة</h2>
          <p className="text-base mb-10 leading-[1.7]" style={{ color: T.gray500 }}>واجهة واحدة تجمع كل ما يحتاجه المتداول — بدون تنقّل بين مواقع</p>
        </Reveal>

        <Reveal delay={0.06}>
          <div className="bg-white rounded-2xl border overflow-hidden" style={{ borderColor: T.gray100, boxShadow: "0 4px 24px rgba(0,0,0,0.06)" }}>
            {/* Terminal Header */}
            <div className="px-5 sm:px-6 py-3 flex items-center justify-between" style={{ background: T.black }}>
              <div className="flex items-center gap-2.5">
                <div className="flex gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: T.red, opacity: 0.7 }} />
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: T.amber, opacity: 0.7 }} />
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: T.green, opacity: 0.7 }} />
                </div>
                <Mono className="text-[10px] font-bold" style={{ color: T.gray400 }}>ZeroSpread Terminal</Mono>
              </div>
              <div className="flex gap-1">
                {["1D", "4H", "1H", "15M"].map((tf, i) => (
                  <span key={i} className="text-[10px] font-bold px-2 py-0.5 rounded-md" style={{ background: i === 0 ? "rgba(255,255,255,0.15)" : "transparent", color: i === 0 ? "#fff" : T.gray500 }}>{tf}</span>
                ))}
              </div>
            </div>

            {/* Chart Area */}
            <div className="px-3 py-3" style={{ background: T.offWhite, borderBottom: `1px solid ${T.gray100}` }}>
              <div className="rounded-xl overflow-hidden" style={{ background: T.white, border: `1px solid ${T.gray100}` }}>
                <div className="px-3 pt-2.5 pb-1 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Mono className="text-xs font-bold" style={{ color: T.black }}>XAU/USD</Mono>
                    <Mono className="text-[10px] font-bold" style={{ color: T.green }}>2,387.40</Mono>
                    <Mono className="text-[10px]" style={{ color: T.green }}>+0.82%</Mono>
                  </div>
                  <div className="flex gap-1">
                    {["MA", "RSI", "VOL"].map((ind, i) => (
                      <span key={i} className="text-[9px] font-bold px-1.5 py-0.5 rounded" style={{ background: i === 0 ? T.greenBg : T.offWhite, color: i === 0 ? T.green : T.gray400 }}>{ind}</span>
                    ))}
                  </div>
                </div>
                <CandleStrip count={36} height={72} seed={123} />
              </div>
            </div>

            {/* Live Data Row */}
            <div className="px-5 sm:px-6 py-4" style={{ borderBottom: `1px solid ${T.gray100}` }}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-bold" style={{ color: T.black }}>بيانات لحظية</span>
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: T.green }} />
                  <span className="text-[10px] font-semibold" style={{ color: T.green }}>مباشر</span>
                </div>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { s: "XAU", v: "2,387", ch: "+0.82%", up: true },
                  { s: "BTC", v: "67,420", ch: "+2.4%", up: true },
                  { s: "ETH", v: "3,512", ch: "-0.8%", up: false },
                  { s: "SPX", v: "5,248", ch: "+0.3%", up: true },
                ].map((d, i) => (
                  <div key={i} className="rounded-xl py-2.5 px-2 text-center" style={{ background: T.offWhite, border: `1px solid ${T.gray100}` }}>
                    <Mono className="text-[9px] font-bold block mb-0.5" style={{ color: T.gray400 }}>{d.s}</Mono>
                    <Mono className="text-[12px] font-bold block" style={{ color: T.black }}>{d.v}</Mono>
                    <Mono className="text-[9px] font-bold mt-0.5 block" style={{ color: d.up ? T.green : T.red }}>{d.ch}</Mono>
                  </div>
                ))}
              </div>
            </div>

            {/* Tools Features */}
            <div className="px-5 sm:px-6 py-4">
              <div className="grid grid-cols-2 gap-2">
                {[
                  { l: "رسوم بيانية", d: "شموع + مؤشرات فنية" },
                  { l: "مختبر الاستراتيجيات", d: "اختبر قبل المخاطرة" },
                  { l: "تنبيهات الأسعار", d: "إشعار عند مستوى معيّن" },
                  { l: "تقارير دورية", d: "ملخص أداء أسبوعي" },
                ].map((f, i) => (
                  <div key={i} className="rounded-xl p-3" style={{ background: T.offWhite, border: `1px solid ${T.gray100}` }}>
                    <span className="text-[11px] font-bold block mb-0.5" style={{ color: T.black }}>{f.l}</span>
                    <span className="text-[10px]" style={{ color: T.gray500 }}>{f.d}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Reveal>

        <DiscoverBtn onClick={() => openOverlay("tools")} label="اكتشف الأدوات بالكامل" />
      </SectionWrap>

      {/* ━━━━━━━━━━━━━━━━━━
          8. PLATFORM ECOSYSTEM
          ━━━━━━━━━━━━━━━━━━ */}
      <SectionWrap bg={T.offWhite}>
        <Reveal>
          <h2 className="text-2xl sm:text-3xl font-black text-center mb-3" style={{ color: T.black }}>ما نبنيه أكبر من مجرد فصول</h2>
          <p className="text-base text-center mb-10 leading-[1.7]" style={{ color: T.gray500 }}>منظومة متكاملة صُمّمت لتأخذك من الصفر إلى مستوى المتداول المحترف</p>
        </Reveal>

        <Reveal delay={0.06}>
          <div className="bg-white rounded-2xl border overflow-hidden" style={{ borderColor: T.gray100, boxShadow: "0 4px 24px rgba(0,0,0,0.06)" }}>
            {/* Platform Header */}
            <div className="px-5 sm:px-6 py-3 flex items-center justify-between" style={{ background: T.black }}>
              <div className="flex items-center gap-2.5">
                <div className="w-2 h-2 rounded-full" style={{ background: T.green }} />
                <span className="text-[11px] font-bold tracking-widest" style={{ color: "#fff", letterSpacing: "0.1em" }}>ECOSYSTEM</span>
              </div>
              <Mono className="text-[10px] font-bold" style={{ color: T.gray400 }}>v1.0 — قيد البناء</Mono>
            </div>

            {/* Top Stats Row */}
            <div className="grid grid-cols-4 gap-0" style={{ borderBottom: `1px solid ${T.gray100}` }}>
              {[
                { n: "11", l: "فصل", c: T.black },
                { n: "4", l: "مسار", c: T.black },
                { n: "5+", l: "مختبر", c: T.black },
                { n: "4", l: "خدمة", c: T.black },
              ].map((s, i) => (
                <div key={i} className="py-5 text-center" style={{ borderLeft: i > 0 ? `1px solid ${T.gray100}` : "none" }}>
                  <Mono className="text-2xl sm:text-3xl font-black block" style={{ color: s.c }}>{s.n}</Mono>
                  <span className="text-[10px] font-semibold" style={{ color: T.gray400 }}>{s.l}</span>
                </div>
              ))}
            </div>

            {/* Category 1: Education */}
            <div className="px-5 sm:px-6 py-5" style={{ borderBottom: `1px solid ${T.gray100}` }}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: T.black }}>
                  <Mono className="text-[10px] font-bold" style={{ color: "#fff" }}>01</Mono>
                </div>
                <div>
                  <h3 className="text-base font-bold" style={{ color: T.black }}>التعليم</h3>
                  <span className="text-[10px]" style={{ color: T.gray400 }}>11 فصل عبر 4 مسارات رئيسية</span>
                </div>
              </div>
              <div className="flex gap-2 flex-wrap">
                {["الأساسيات", "الشموع اليابانية", "التحليل الفني", "إدارة المخاطر", "الاستراتيجية", "بناء المحفظة"].map((t, i) => (
                  <span key={i} className="text-[11px] font-semibold px-3 py-1.5 rounded-lg" style={{ background: T.offWhite, color: T.gray700, border: `1px solid ${T.gray100}` }}>{t}</span>
                ))}
              </div>
            </div>

            {/* Category 2: Practical */}
            <div className="px-5 sm:px-6 py-5" style={{ borderBottom: `1px solid ${T.gray100}` }}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: T.black }}>
                  <Mono className="text-[10px] font-bold" style={{ color: "#fff" }}>02</Mono>
                </div>
                <div>
                  <h3 className="text-base font-bold" style={{ color: T.black }}>التطبيق العملي</h3>
                  <span className="text-[10px]" style={{ color: T.gray400 }}>مختبرات واختبارات وتدرّج حقيقي</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { l: "مختبرات تفاعلية", v: "5+", bg: T.greenBg, c: T.green, border: T.greenBorder },
                  { l: "اختبارات تقييمية", v: "لكل فصل", bg: T.offWhite, c: T.gray700, border: T.gray100 },
                  { l: "تطبيق فوري", v: "بعد كل درس", bg: T.offWhite, c: T.gray700, border: T.gray100 },
                  { l: "تدرّج تلقائي", v: "مبتدئ → محترف", bg: T.offWhite, c: T.gray700, border: T.gray100 },
                ].map((x, i) => (
                  <div key={i} className="rounded-xl p-3" style={{ background: x.bg, border: `1px solid ${x.border}` }}>
                    <span className="text-[10px] font-semibold block mb-0.5" style={{ color: T.gray400 }}>{x.l}</span>
                    <span className="text-sm font-bold" style={{ color: x.c }}>{x.v}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Category 3: Services */}
            <div className="px-5 sm:px-6 py-5" style={{ borderBottom: `1px solid ${T.gray100}` }}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: T.black }}>
                  <Mono className="text-[10px] font-bold" style={{ color: "#fff" }}>03</Mono>
                </div>
                <div>
                  <h3 className="text-base font-bold" style={{ color: T.black }}>الخدمات</h3>
                  <span className="text-[10px]" style={{ color: T.gray400 }}>أدوات يومية تعمل معك باستمرار</span>
                </div>
              </div>
              <div className="space-y-2">
                {[
                  { name: "التوصيات", desc: "سيناريو كامل لكل صفقة + متابعة + تحديثات", tag: "مباشر", tagC: T.green },
                  { name: "تحليل الأخبار", desc: "خبر → تحليل → تأثير → قرار", tag: "تحليلي", tagC: T.amber },
                  { name: "أدوات التحليل", desc: "رسوم بيانية، مؤشرات، بيانات لحظية", tag: "متقدم", tagC: T.black },
                  { name: "الإشعارات الذكية", desc: "تنبيهات فورية: توصيات، أهداف، وقف خسارة", tag: "فوري", tagC: T.green },
                ].map((s, i) => (
                  <div key={i} className="flex items-center justify-between rounded-xl p-3.5" style={{ background: T.offWhite, border: `1px solid ${T.gray100}` }}>
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-bold block" style={{ color: T.black }}>{s.name}</span>
                      <span className="text-[11px]" style={{ color: T.gray500 }}>{s.desc}</span>
                    </div>
                    <span className="text-[10px] font-bold px-2.5 py-1 rounded-md shrink-0 mr-3" style={{ background: s.tagC === T.green ? T.greenBg : s.tagC === T.amber ? T.amberBg : T.offWhite, color: s.tagC, border: `1px solid ${s.tagC === T.green ? T.greenBorder : s.tagC === T.amber ? T.amberBorder : T.gray200}` }}>{s.tag}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Category 4: Student Experience */}
            <div className="px-5 sm:px-6 py-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: T.black }}>
                  <Mono className="text-[10px] font-bold" style={{ color: "#fff" }}>04</Mono>
                </div>
                <div>
                  <h3 className="text-base font-bold" style={{ color: T.black }}>تجربة الطالب</h3>
                  <span className="text-[10px]" style={{ color: T.gray400 }}>مرافقة كاملة من أول يوم</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { l: "ملف شخصي", d: "تتبّع تقدمك وإنجازاتك" },
                  { l: "بروفيسور مرافق", d: "مرشد ذكي خطوة بخطوة" },
                  { l: "دعم لمدة سنة", d: "دعم تعليمي مستمر 24/7" },
                  { l: "ضمان النتيجة", d: "استرداد كامل عند إتمام المنهج" },
                ].map((x, i) => (
                  <div key={i} className="rounded-xl p-3.5" style={{ background: T.offWhite, border: `1px solid ${T.gray100}` }}>
                    <span className="text-sm font-bold block mb-0.5" style={{ color: T.black }}>{x.l}</span>
                    <span className="text-[11px] leading-relaxed" style={{ color: T.gray500 }}>{x.d}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Reveal>
      </SectionWrap>

      {/* ━━━━━━━━━━━━━━━━━━
          9. WHY NOW + PRICING
          ━━━━━━━━━━━━━━━━━━ */}
      <SectionWrap>
        <Reveal>
          <h2 className="text-2xl sm:text-3xl font-black text-center mb-3" style={{ color: T.black }}>لماذا التسجيل الآن؟</h2>
          <p className="text-base text-center mb-10 leading-[1.7]" style={{ color: T.gray500 }}>التسجيل مجاني — لكنه يمنحك أفضلية سعرية حقيقية على كل الخدمات</p>
        </Reveal>

        <Reveal delay={0.06}>
          <div className="bg-white rounded-2xl border overflow-hidden mb-6" style={{ borderColor: T.gray100, boxShadow: "0 4px 24px rgba(0,0,0,0.06)" }}>
            {/* Pricing Header */}
            <div className="px-5 sm:px-6 py-3 flex items-center justify-between" style={{ background: T.black }}>
              <span className="text-[11px] font-bold tracking-widest" style={{ color: "#fff", letterSpacing: "0.1em" }}>EARLY ACCESS</span>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md" style={{ background: T.green, color: "#fff" }}>-35%</span>
              </div>
            </div>

            {/* Pricing Rows */}
            <div>
              {[
                { name: "الأكاديمية", desc: "11 فصل + مختبرات + بروفيسور + دعم سنة", before: "350", after: "228", unit: "", save: "122" },
                { name: "التوصيات", desc: "سيناريوهات + متابعة + إشعارات ذكية", before: "119", after: "77", unit: " /شهر", save: "42" },
                { name: "الأدوات", desc: "رسوم بيانية + بيانات لحظية + مختبر استراتيجيات", before: "49", after: "32", unit: " /شهر", save: "17" },
              ].map((p, i) => (
                <div key={i} className="px-5 sm:px-6 py-4 flex items-center justify-between" style={{ borderBottom: i < 2 ? `1px solid ${T.gray100}` : "none" }}>
                  <div className="flex-1 min-w-0 ml-3">
                    <span className="text-sm font-bold block" style={{ color: T.black }}>{p.name}</span>
                    <span className="text-[11px]" style={{ color: T.gray500 }}>{p.desc}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="text-left">
                      <Mono className="text-[11px] block" style={{ color: T.gray400, textDecoration: "line-through" }}>${p.before}</Mono>
                    </div>
                    <div className="rounded-xl py-2 px-3 text-center" style={{ background: T.greenBg, border: `1px solid ${T.greenBorder}` }}>
                      <Mono className="text-lg font-black leading-tight" style={{ color: T.green }}>${p.after}</Mono>
                      <span className="text-[9px] font-bold block" style={{ color: T.green }}>{p.unit || "مرة واحدة"}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Savings Banner */}
            <div className="px-5 sm:px-6 py-3" style={{ background: T.greenBg, borderTop: `1px solid ${T.greenBorder}` }}>
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold" style={{ color: T.green }}>وفّر أكثر من $181 في السنة الأولى</span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={T.green} strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12" /></svg>
              </div>
            </div>
          </div>
        </Reveal>

        <Reveal delay={0.1}>
          <div className="bg-white rounded-2xl border overflow-hidden mb-6" style={{ borderColor: T.gray100 }}>
            <div className="px-5 py-4" style={{ background: T.offWhite, borderBottom: `1px solid ${T.gray100}` }}>
              <h3 className="text-base font-bold" style={{ color: T.black }}>ما معنى "التسجيل مجاني"؟</h3>
            </div>
            <div className="p-5">
              <p className="text-sm leading-[1.8]" style={{ color: T.gray500 }}>
                التسجيل لا يكلفك شيئاً. لكنه لا يعني أن الخدمات مجانية. عند الإطلاق ستتوفر خدمات مجانية ومدفوعة — والميزة لمن سجّل مبكراً هي الحصول على أفضل الأسعار وأولوية الوصول.
              </p>
            </div>
          </div>
        </Reveal>

        <Reveal delay={0.14}>
          <div className="space-y-2">
            {[
              { t: "أولوية الوصول", d: "دخول مبكّر قبل الافتتاح العام", step: "01" },
              { t: "أسعار ثابتة مخفّضة", d: "خصم 35% على جميع الخدمات — ميزة لن تتكرر", step: "02" },
              { t: "محتوى حصري", d: "مزايا ومحتوى مجاني لأعضاء القائمة فقط", step: "03" },
              { t: "المساهمة في التطوير", d: "شارك رأيك وساهم في تحسين المنصة", step: "04" },
            ].map((item, i) => (
              <div key={i}>
                <div className="bg-white rounded-xl border p-4 flex items-start gap-3.5" style={{ borderColor: T.gray100 }}>
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: i === 1 ? T.green : T.offWhite }}>
                    <Mono className="text-[10px] font-bold" style={{ color: i === 1 ? "#fff" : T.gray400 }}>{item.step}</Mono>
                  </div>
                  <div>
                    <h3 className="text-sm font-bold mb-0.5" style={{ color: T.black }}>{item.t}</h3>
                    <p className="text-sm" style={{ color: T.gray500 }}>{item.d}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Reveal>
      </SectionWrap>

      {/* ━━━━━━━━━━━━━━━━━━
          10. FINAL CTA
          ━━━━━━━━━━━━━━━━━━ */}
      <SectionWrap bg={T.offWhite}>
        <Reveal>
          <div className="bg-white rounded-2xl border overflow-hidden" style={{ borderColor: T.gray100, boxShadow: "0 4px 24px rgba(0,0,0,0.06)" }}>
            <div className="px-5 py-3 text-center" style={{ background: T.black }}>
              <span className="text-[10px] font-bold tracking-widest" style={{ color: T.gray400, letterSpacing: "0.12em" }}>JOIN THE WAITLIST</span>
            </div>
            <div className="px-6 py-10 text-center">
              <Wordmark size="2xl" className="block mb-5" />
              <h2 className="text-2xl sm:text-3xl font-black mb-4" style={{ color: T.black }}>شيء ضخم قادم</h2>
              <p className="text-base mb-8 leading-[1.7] max-w-md mx-auto" style={{ color: T.gray500 }}>أكاديمية، توصيات، أدوات، وتحليل أخبار — كُن من أوائل الداخلين واحصل على خصم 35%</p>
              <button onClick={openRegister}
                className="w-full sm:w-auto px-10 py-[18px] rounded-2xl text-base font-bold transition-all hover:opacity-90 active:scale-[0.97] inline-flex items-center justify-center gap-2.5"
                style={{ background: T.black, color: "#fff" }}>
                انضم إلى قائمة الانتظار
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M19 12H5M12 5l-7 7 7 7" /></svg>
              </button>
              <p className="text-xs mt-4" style={{ color: T.gray400 }}>مجاني — بدون دفع حتى الإطلاق</p>
            </div>
          </div>
        </Reveal>
      </SectionWrap>

      {/* ━━━ FOOTER ━━━ */}
      <footer dir="rtl" className="py-8 px-5 text-center" style={{ borderTop: `1px solid ${T.gray100}` }}>
        <Wordmark size="base" className="block mb-2" />
        <p className="text-xs" style={{ color: T.gray400 }}>جميع الحقوق محفوظة 2026 ZeroSpread</p>
      </footer>
    </div>
  );
}
