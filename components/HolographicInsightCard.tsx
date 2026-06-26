"use client";

import React, { useMemo } from "react";
import { motion } from "motion/react";
import { Brain, Sparkles, MessageSquare, ShieldCheck, Terminal } from "lucide-react";
import { Quest } from "./GameContext";

interface HolographicInsightCardProps {
  quest: Quest;
  questState: "idle" | "active" | "answered" | "completed";
}

export function HolographicInsightCard({ quest, questState }: HolographicInsightCardProps) {
  // Generate random stable particles for the floating background
  const particles = useMemo(() => {
    return Array.from({ length: 12 }).map((_, i) => ({
      id: i,
      text: Math.random() > 0.5 ? "0" : "1",
      left: `${5 + Math.random() * 90}%`,
      delay: `${Math.random() * 4}s`,
      duration: `${4 + Math.random() * 6}s`,
      fontSize: `${9 + Math.random() * 10}px`,
    }));
  }, []);

  if (questState !== "answered" && questState !== "completed") return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, x: -30 }}
      animate={{ opacity: 1, scale: 1, x: 0 }}
      exit={{ opacity: 0, scale: 0.9, x: -20 }}
      transition={{ type: "spring", stiffness: 260, damping: 20 }}
      className="absolute left-6 top-28 w-[380px] md:w-[420px] bg-slate-950/80 backdrop-blur-xl rounded-3xl border border-cyan-500/30 p-6 text-slate-100 shadow-[0_0_35px_rgba(6,182,212,0.15)] flex flex-col gap-4 overflow-hidden pointer-events-auto animate-holo-glow"
    >
      {/* Self-contained CSS for animations */}
      <style>{`
        @keyframes holoGlow {
          0%, 100% {
            box-shadow: 0 0 25px rgba(6, 182, 212, 0.15), inset 0 0 10px rgba(6, 182, 212, 0.05);
            border-color: rgba(6, 182, 212, 0.25);
          }
          50% {
            box-shadow: 0 0 35px rgba(249, 115, 22, 0.2), inset 0 0 15px rgba(249, 115, 22, 0.08);
            border-color: rgba(249, 115, 22, 0.4);
          }
        }
        @keyframes floatUp {
          0% {
            transform: translateY(0) scale(0.8);
            opacity: 0;
          }
          10% {
            opacity: 0.6;
          }
          90% {
            opacity: 0.4;
          }
          100% {
            transform: translateY(-220px) scale(1.1);
            opacity: 0;
          }
        }
        .animate-holo-glow {
          animation: holoGlow 7s ease-in-out infinite;
        }
        .animate-float-up {
          animation: floatUp linear infinite;
        }
      `}</style>

      {/* Floating Binary Background Particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-30">
        {particles.map((p) => (
          <span
            key={p.id}
            className="absolute bottom-[-20px] font-mono text-cyan-400/50 animate-float-up"
            style={{
              left: p.left,
              animationDelay: p.delay,
              animationDuration: p.duration,
              fontSize: p.fontSize,
            }}
          >
            {p.text}
          </span>
        ))}
      </div>

      {/* Tech corner accents */}
      <div className="absolute top-3 left-3 w-3 h-3 border-t-2 border-l-2 border-cyan-500/50 rounded-tl" />
      <div className="absolute top-3 right-3 w-3 h-3 border-t-2 border-r-2 border-cyan-500/50 rounded-tr" />
      <div className="absolute bottom-3 left-3 w-3 h-3 border-b-2 border-l-2 border-cyan-500/50 rounded-bl" />
      <div className="absolute bottom-3 right-3 w-3 h-3 border-b-2 border-r-2 border-cyan-500/50 rounded-br" />

      {/* Card Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <Brain className="w-5 h-5 text-cyan-400 animate-pulse" />
          <span className="text-xs font-bold tracking-[0.15em] text-cyan-400 uppercase font-mono">
            COGNITIVE RETRIEVAL HUD
          </span>
        </div>
        <div className="flex items-center gap-1 bg-cyan-500/10 px-2 py-0.5 rounded text-[10px] text-cyan-300 font-mono border border-cyan-500/20">
          <Sparkles className="w-3 h-3" />
          <span>ACTIVE</span>
        </div>
      </div>

      {/* Customer Request Section */}
      <div className="flex flex-col gap-1.5 bg-slate-900/40 p-3.5 rounded-xl border border-slate-800/60 relative">
        <div className="flex items-center gap-1.5 text-slate-400 text-[10px] font-bold tracking-wider uppercase font-mono">
          <MessageSquare className="w-3.5 h-3.5 text-slate-400" />
          <span>Customer Request</span>
        </div>
        <p className="text-sm text-slate-200 italic leading-relaxed pl-1.5 border-l-2 border-cyan-500/30">
          "{quest.question}"
        </p>
        <span className="absolute bottom-1 right-2 text-[9px] text-slate-500 font-mono">
          USER_INPUT
        </span>
      </div>

      {/* AI Insight Section */}
      <div className="flex flex-col gap-1.5 bg-slate-900/40 p-3.5 rounded-xl border border-slate-800/60 relative">
        <div className="flex items-center gap-1.5 text-orange-400 text-[10px] font-bold tracking-wider uppercase font-mono">
          <Terminal className="w-3.5 h-3.5 text-orange-400" />
          <span>AI Insight Engine</span>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed pl-1.5 border-l-2 border-orange-500/30">
          {quest.learningText.replace("💡 LESSON:", "").trim()}
        </p>
        <span className="absolute bottom-1 right-2 text-[9px] text-orange-500/50 font-mono">
          SYSTEM_DEEP_DIVE
        </span>
      </div>

      {/* Method Success badge */}
      <div className="flex items-center justify-between bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 mt-1">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-emerald-400" />
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-slate-400 uppercase font-mono leading-none">
              Retrieval Strategy
            </span>
            <span className="text-xs font-bold text-emerald-400 capitalize">
              {quest.expectedItem} Matching successful
            </span>
          </div>
        </div>
        <span className="text-[9px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded font-mono font-bold animate-pulse">
          VERIFIED
        </span>
      </div>

      {/* Progress instruction */}
      <div className="text-[10px] text-slate-400 text-center font-mono animate-pulse mt-1">
        Press <span className="text-cyan-400 font-bold">SPACE</span> or talk to customer to progress
      </div>
    </motion.div>
  );
}
