"use client";

import { motion } from "framer-motion";
import { LayoutDashboard, Smartphone, GraduationCap, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

function getAppUrl(sub: "dashboard" | "teacher") {
  if (typeof window === "undefined") return "#";
  const { hostname, protocol } = window.location;
  if (hostname === "localhost" || hostname === "127.0.0.1") {
    return sub === "dashboard"
      ? `${protocol}//localhost:3000`
      : `${protocol}//localhost:3002`;
  }
  const base = hostname.replace(/^www\./, "");
  return `${protocol}//${sub}.${base}`;
}

export default function SignInPage() {
  const [dashUrl, setDashUrl] = useState("#");
  const [teachUrl, setTeachUrl] = useState("#");

  useEffect(() => {
    setDashUrl(getAppUrl("dashboard"));
    setTeachUrl(getAppUrl("teacher"));
  }, []);

  const OPTIONS = [
    {
      icon: LayoutDashboard,
      title: "School Admin",
      desc: "Access your school dashboard — transport, fees, analytics, and settings.",
      href: dashUrl,
      color: "bg-brand-600",
      hoverBorder: "hover:border-brand-200",
      iconBg: "bg-brand-50",
      iconColor: "text-brand-600",
      tag: "Web dashboard",
    },
    {
      icon: GraduationCap,
      title: "Teacher",
      desc: "Access your classes, lesson planner, and student roster from the teacher app.",
      href: teachUrl,
      color: "bg-violet-600",
      hoverBorder: "hover:border-violet-200",
      iconBg: "bg-violet-50",
      iconColor: "text-violet-600",
      tag: "Web / Mobile app",
    },
    {
      icon: Smartphone,
      title: "Parent or Driver",
      desc: "Sign in happens inside the Skippo mobile app — download it from the App Store or Google Play.",
      href: "#app",
      color: "bg-emerald-600",
      hoverBorder: "hover:border-emerald-200",
      iconBg: "bg-emerald-50",
      iconColor: "text-emerald-600",
      tag: "Mobile app",
      noLink: true,
    },
  ];

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Nav */}
      <nav className="h-[68px] border-b border-surface-border flex items-center px-6">
        <Link href="/" className="flex items-center gap-2.5">
          <img src="/logo.svg" alt="Skippo" className="w-8 h-8" />
          <span className="font-black text-ink text-lg">Skippo</span>
        </Link>
      </nav>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center px-5 py-16">
        <div className="w-full max-w-lg">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-10"
          >
            <h1 className="text-3xl font-black text-ink mb-3">Sign in to Skippo</h1>
            <p className="text-ink-muted">Choose your role to continue.</p>
          </motion.div>

          <div className="space-y-4">
            {OPTIONS.map((opt, i) => {
              const Icon = opt.icon;
              const Wrapper = opt.noLink ? "div" : "a";
              return (
                <motion.div
                  key={opt.title}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: i * 0.08 }}
                >
                  <Wrapper
                    {...(!opt.noLink ? { href: opt.href } : {})}
                    className={`group flex items-center gap-4 p-5 bg-white rounded-2xl border border-surface-border transition-all duration-300 hover:shadow-lift hover:-translate-y-0.5 ${opt.hoverBorder} ${opt.noLink ? "cursor-default opacity-80" : "cursor-pointer"}`}
                  >
                    <div className={`w-12 h-12 rounded-xl ${opt.iconBg} flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform duration-300`}>
                      <Icon size={22} className={opt.iconColor} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="font-black text-ink text-sm">{opt.title}</p>
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full text-white ${opt.color}`}>{opt.tag}</span>
                      </div>
                      <p className="text-xs text-ink-muted leading-relaxed">{opt.desc}</p>
                      {opt.noLink && (
                        <div className="mt-2 flex gap-2">
                          <a href="https://apps.apple.com" target="_blank" rel="noopener noreferrer"
                            className="text-[10px] font-bold text-brand-600 hover:text-brand-700 transition-colors">
                            App Store ↗
                          </a>
                          <span className="text-ink-faint text-[10px]">·</span>
                          <a href="https://play.google.com" target="_blank" rel="noopener noreferrer"
                            className="text-[10px] font-bold text-brand-600 hover:text-brand-700 transition-colors">
                            Google Play ↗
                          </a>
                        </div>
                      )}
                    </div>
                    {!opt.noLink && (
                      <ArrowRight size={16} className="text-ink-faint group-hover:text-ink group-hover:translate-x-1 transition-all duration-200 flex-shrink-0" />
                    )}
                  </Wrapper>
                </motion.div>
              );
            })}
          </div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-center text-xs text-ink-faint mt-8"
          >
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="text-brand-600 font-semibold hover:text-brand-700 transition-colors">
              Get started
            </Link>
          </motion.p>
        </div>
      </div>
    </div>
  );
}
