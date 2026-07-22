import { Link, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { ASSETS } from "@/landing/assets/assets";
import { openDemoDrawer } from "@/landing/components/DemoDrawer";

const PLUM_INK = "#3a0a1f";

const navLinks = [
  { label: "How it works", href: "/how-it-works" },
  { label: "Features", href: "/#features" },
  { label: "Pricing", href: "/pricing" },
];

type SiteHeaderProps = {
  variant?: "dark" | "light";
};

export function SiteHeader({ variant = "dark" }: SiteHeaderProps) {
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const isDark = variant === "dark" && !scrolled;

  const logoColor = isDark ? "text-white" : "";
  const logoStyle = isDark ? undefined : { color: PLUM_INK };
  const linkBase = isDark ? "text-white/80 hover:text-white" : "";
  const linkStyle = isDark ? undefined : { color: `${PLUM_INK}CC` };
  const linkHover = isDark ? "" : "hover:opacity-100";
  const ctaBg = isDark ? "bg-white text-[#0b0f1a]" : "bg-[#2a0a18] text-white";

  const barBg = scrolled
    ? "bg-white/85 backdrop-blur-md shadow-[0_1px_0_rgba(42,10,24,0.08)]"
    : variant === "dark"
    ? "bg-transparent"
    : "bg-white";

  return (
    <>
      {variant === "light" && <div aria-hidden className="h-[88px]" />}
      <header
        className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${barBg}`}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-10">
          <Link to="/" className="flex items-center gap-2">
            <img src={ASSETS.logo} alt="MediEase" className="h-12 w-12 sm:h-14 sm:w-14" />
            <span
              className={`font-display text-2xl font-bold tracking-tight ${logoColor} sm:text-[1.8rem]`}
              style={logoStyle}
            >
              MediEase
            </span>
          </Link>

          <nav className="hidden items-center gap-9 md:flex">
            {navLinks.map((l) => {
              if (location.pathname === "/how-it-works" && l.href === "/how-it-works") return null;
              const isHash = l.href.includes("#");
              const El: any = isHash ? "a" : Link;
              const props = isHash ? { href: l.href } : { to: l.href };
              return (
                <El
                  key={l.href}
                  {...props}
                  className={`text-sm font-medium transition-colors ${linkBase} ${linkHover}`}
                  style={linkStyle}
                >
                  {l.label}
                </El>
              );
            })}
          </nav>

          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className={`hidden text-sm font-medium transition-colors md:block ${linkBase} ${linkHover}`}
              style={linkStyle}
            >
              Login
            </Link>
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              className={`inline-flex items-center justify-center rounded-full p-2 md:hidden ${isDark ? "text-white" : "text-[#2a0a18]"}`}
              aria-label="Toggle menu"
              aria-expanded={menuOpen}
            >
              {menuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
            <button
              type="button"
              onClick={openDemoDrawer}
              className={`hidden items-center gap-1.5 rounded-full px-5 py-2.5 text-sm font-semibold transition-transform hover:-translate-y-0.5 md:inline-flex ${ctaBg}`}
            >
              Get in touch
              <span aria-hidden>→</span>
            </button>
          </div>
        </div>

        {menuOpen && (
          <div className="border-t border-[#2a0a18]/10 bg-white px-6 pb-6 pt-4 md:hidden">
            <nav className="flex flex-col gap-4">
              {navLinks.map((l) => {
                if (location.pathname === "/how-it-works" && l.href === "/how-it-works") return null;
                const isHash = l.href.includes("#");
                const El: any = isHash ? "a" : Link;
                const props = isHash ? { href: l.href } : { to: l.href };
                return (
                  <El
                    key={l.href}
                    {...props}
                    onClick={() => setMenuOpen(false)}
                    className="text-base font-medium text-[#2a0a18]"
                  >
                    {l.label}
                  </El>
                );
              })}
              <Link
                to="/login"
                onClick={() => setMenuOpen(false)}
                className="text-base font-medium text-[#2a0a18]"
              >
                Login
              </Link>
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  openDemoDrawer();
                }}
                className={`mt-2 inline-flex w-full items-center justify-center gap-1.5 rounded-full px-5 py-3 text-sm font-semibold ${ctaBg}`}
              >
                Get in touch
                <span aria-hidden>→</span>
              </button>
            </nav>
          </div>
        )}
      </header>
    </>
  );
}
