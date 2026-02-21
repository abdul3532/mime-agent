import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import mimeLogo from "@/assets/mime-logo.png";

const navLinks = [
  { label: "Product", href: "#hero" },
  { label: "How it works", href: "#how-it-works" },
  { label: "Get started", href: "#wizard" },
  { label: "Dashboard", href: "/dashboard" },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleNav = (href: string) => {
    setMobileOpen(false);
    if (href.startsWith("/")) {
      navigate(href);
    } else {
      document.querySelector(href)?.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? "bg-card/90 backdrop-blur-lg border-b shadow-sm" : "bg-transparent"
      }`}
    >
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link to="/" className="flex items-center">
          <img src={mimeLogo} alt="MIME" className="h-14 -my-3" />
        </Link>

        {/* Desktop */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((l) => (
            <button
              key={l.label}
              onClick={() => handleNav(l.href)}
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              {l.label}
            </button>
          ))}
          <Button size="sm" onClick={() => handleNav("#wizard")}>
            Start demo
          </Button>
        </div>

        {/* Mobile toggle */}
        <button className="md:hidden p-2" onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-card border-b"
          >
            <div className="flex flex-col gap-2 p-4">
              {navLinks.map((l) => (
                <button
                  key={l.label}
                  onClick={() => handleNav(l.href)}
                  className="text-sm font-medium text-muted-foreground hover:text-foreground py-2 text-left"
                >
                  {l.label}
                </button>
              ))}
              <Button size="sm" onClick={() => handleNav("#wizard")} className="mt-2">
                Start demo
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
