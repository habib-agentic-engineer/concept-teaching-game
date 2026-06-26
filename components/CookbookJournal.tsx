"use client";

import { useState } from "react";
import { useGame, QUESTS } from "./GameContext";
import { BookOpen, Star, Sparkles, Lock, Paintbrush, Compass, ArrowRight, RotateCcw, X, Clock, Target } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

const APRON_COSMETICS = [
  { id: "#334155", name: "Classic Slate Gray", color: "bg-[#334155]", text: "text-slate-400", desc: "Standard-issue heavy-duty flameproof slate cloth.", unlock: "Unlocked by default" },
  { id: "#06b6d4", name: "Cyber Neon Blue", color: "bg-[#06b6d4]", text: "text-cyan-400", desc: "Glowing liquid fiber apron emitting high-visibility light.", unlock: "Complete Day 1" },
  { id: "#10b981", name: "Emerald Mint", color: "bg-[#10b981]", text: "text-emerald-400", desc: "Organic bio-polymer weave carrying subtle cooling currents.", unlock: "Complete Day 2" },
  { id: "#e11d48", name: "Crimson Chef", color: "bg-[#e11d48]", text: "text-rose-400", desc: "Thermal-reflective carbon fabric indicating expert rank.", unlock: "Complete Day 3" },
  { id: "#7c3aed", name: "Royal Violet", color: "bg-[#7c3aed]", text: "text-violet-400", desc: "Ultra-dense exotic matter material that bends ambient photons.", unlock: "Complete Day 4" },
];

const STATION_DECOR_COSMETICS = [
  { id: "none", name: "Standard Station", desc: "Clean stainless steel counters without additional adornment.", unlock: "Unlocked by default" },
  { id: "vines", name: "Holographic Vines", desc: "Glowing emerald vine spirals wrapping around the main station pillars.", unlock: "Complete Day 1" },
  { id: "particles", name: "Quantum Spices", desc: "Floating digital data spheres suspended in orbital loops over stations.", unlock: "Complete Day 2" },
  { id: "gold", name: "Golden Culinary Crest", desc: "Polished golden plaque crests attached to the station front plates.", unlock: "Complete Day 3" },
];

export function CookbookJournal() {
  const {
    day,
    journalOpen,
    setJournalOpen,
    completedDaysStats,
    activeApronColor,
    setActiveApronColor,
    activeStationDecoration,
    setActiveStationDecoration,
    unlockedCosmetics,
    resetProgress,
  } = useGame();

  const [activeTab, setActiveTab] = useState<"wardrobe" | "memory" | "search" | "research" | "hybrid">("wardrobe");

  // Helper to check if a day is completed
  const isDayUnlocked = (dayIndex: number) => {
    return day > dayIndex || (completedDaysStats[dayIndex] && completedDaysStats[dayIndex].unlocked);
  };

  const getDayStars = (dayIndex: number) => {
    return completedDaysStats[dayIndex]?.stars || 0;
  };

  const getDaySpeed = (dayIndex: number) => {
    return completedDaysStats[dayIndex]?.speed || null;
  };

  const getDayAccuracy = (dayIndex: number) => {
    return completedDaysStats[dayIndex]?.accuracy || null;
  };

  if (!journalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/45 backdrop-blur-sm pointer-events-auto">
      {/* Modal Backdrop overlay click closes */}
      <div className="absolute inset-0" onClick={() => setJournalOpen(false)} />

      {/* Main Glassmorphic Book Frame */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        transition={{ type: "spring", damping: 25, stiffness: 180 }}
        className="relative w-full max-w-4xl h-[620px] rounded-3xl overflow-hidden border border-white/15 bg-slate-900/85 backdrop-blur-2xl shadow-[0_0_50px_rgba(0,0,0,0.6)] flex flex-col md:flex-row text-white text-sans"
      >
        {/* Holographic Glowing Border Accent */}
        <div className="absolute inset-0 pointer-events-none border border-cyan-500/20 rounded-3xl" />

        {/* ================= LEFT CONTROLS / TABLE OF CONTENTS ================= */}
        <div className="w-full md:w-64 bg-slate-950/50 border-r border-white/10 p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-6">
              <BookOpen className="w-6 h-6 text-cyan-400" />
              <div>
                <h2 className="text-md font-bold tracking-tight text-white">THE RETRIEVAL</h2>
                <p className="text-[10px] text-cyan-400 font-mono tracking-widest font-bold uppercase">Cookbook Journal</p>
              </div>
            </div>

            <div className="space-y-1">
              <p className="text-[10px] font-mono text-slate-500 font-bold tracking-wider uppercase mb-2 px-2">Table of Contents</p>
              
              <button
                onClick={() => setActiveTab("wardrobe")}
                className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
                  activeTab === "wardrobe"
                    ? "bg-cyan-500/15 text-cyan-300 border-l-2 border-cyan-400"
                    : "text-slate-400 hover:bg-slate-800/40 hover:text-white"
                }`}
              >
                <Paintbrush className="w-4 h-4" />
                <span>Wardrobe & Progression</span>
              </button>

              <button
                onClick={() => setActiveTab("memory")}
                className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-between transition-all ${
                  activeTab === "memory"
                    ? "bg-amber-500/15 text-amber-300 border-l-2 border-amber-400"
                    : "text-slate-400 hover:bg-slate-800/40 hover:text-white"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Compass className="w-4 h-4 text-amber-400" />
                  <span>Memory Pantry</span>
                </div>
                {isDayUnlocked(0) ? (
                  <div className="flex items-center text-[10px] text-amber-400 font-mono">
                    {Array.from({ length: getDayStars(0) }).map((_, i) => (
                      <Star key={i} className="w-2.5 h-2.5 fill-current" />
                    ))}
                  </div>
                ) : (
                  <Lock className="w-3 h-3 text-slate-600" />
                )}
              </button>

              <button
                onClick={() => setActiveTab("search")}
                className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-between transition-all ${
                  activeTab === "search"
                    ? "bg-emerald-500/15 text-emerald-300 border-l-2 border-emerald-400"
                    : "text-slate-400 hover:bg-slate-800/40 hover:text-white"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                  <span>Search Market</span>
                </div>
                {isDayUnlocked(1) ? (
                  <div className="flex items-center text-[10px] text-emerald-400 font-mono">
                    {Array.from({ length: getDayStars(1) }).map((_, i) => (
                      <Star key={i} className="w-2.5 h-2.5 fill-current" />
                    ))}
                  </div>
                ) : (
                  <Lock className="w-3 h-3 text-slate-600" />
                )}
              </button>

              <button
                onClick={() => setActiveTab("research")}
                className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-between transition-all ${
                  activeTab === "research"
                    ? "bg-purple-500/15 text-purple-300 border-l-2 border-purple-400"
                    : "text-slate-400 hover:bg-slate-800/40 hover:text-white"
                }`}
              >
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-purple-400" />
                  <span>Deep Research Lab</span>
                </div>
                {isDayUnlocked(2) ? (
                  <div className="flex items-center text-[10px] text-purple-400 font-mono">
                    {Array.from({ length: getDayStars(2) }).map((_, i) => (
                      <Star key={i} className="w-2.5 h-2.5 fill-current" />
                    ))}
                  </div>
                ) : (
                  <Lock className="w-3 h-3 text-slate-600" />
                )}
              </button>

              <button
                onClick={() => setActiveTab("hybrid")}
                className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-between transition-all ${
                  activeTab === "hybrid"
                    ? "bg-rose-500/15 text-rose-300 border-l-2 border-rose-400"
                    : "text-slate-400 hover:bg-slate-800/40 hover:text-white"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Star className="w-4 h-4 text-rose-400" />
                  <span>Hybrid Culinary Chef</span>
                </div>
                {isDayUnlocked(3) ? (
                  <div className="flex items-center text-[10px] text-rose-400 font-mono">
                    {Array.from({ length: getDayStars(3) + getDayStars(4) }).map((_, i) => (
                      <Star key={i} className="w-2.5 h-2.5 fill-current" />
                    ))}
                  </div>
                ) : (
                  <Lock className="w-3 h-3 text-slate-600" />
                )}
              </button>
            </div>
          </div>

          <div className="space-y-3 pt-4 border-t border-white/5">
            <div className="text-center">
              <span className="text-[10px] text-slate-500 font-mono tracking-wider font-bold">CURRENT STATUS</span>
              <p className="text-xs font-bold text-slate-300 mt-1">Level Day {day + 1}</p>
            </div>
            
            <button
              onClick={resetProgress}
              className="w-full py-1.5 rounded-lg border border-slate-700 hover:border-red-500 hover:bg-red-500/10 text-[11px] text-slate-400 hover:text-red-400 transition-all font-semibold flex items-center justify-center gap-1"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Progress</span>
            </button>
          </div>
        </div>

        {/* ================= RIGHT MAIN PAGE ================= */}
        <div className="flex-1 p-6 overflow-y-auto min-h-0 flex flex-col relative bg-slate-900/40">
          
          {/* Close button */}
          <button
            onClick={() => setJournalOpen(false)}
            className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-all z-10"
          >
            <X className="w-5 h-5" />
          </button>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
              className="flex-1 flex flex-col"
            >
              
              {/* ==================== 1. WARDROBE TAB ==================== */}
              {activeTab === "wardrobe" && (
                <div className="flex-1 flex flex-col">
                  <div className="mb-4">
                    <span className="text-[10px] text-cyan-400 font-mono tracking-widest font-bold uppercase">Interactive Customization</span>
                    <h1 className="text-2xl font-black text-white mt-1">Culinary Wardrobe & Progression</h1>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                      Equip unlocked visual cosmetic styles dynamically. Outfits and decorations are forged when completing culinary assignments under pressure.
                    </p>
                  </div>

                  {/* Wardrobe Body */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 flex-1">
                    {/* Left Apron Wardrobe */}
                    <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 flex flex-col">
                      <h3 className="text-sm font-bold text-slate-200 mb-3 flex items-center gap-1.5 border-b border-white/5 pb-2">
                        <Paintbrush className="w-4 h-4 text-cyan-400" />
                        <span>Apron Fiber Coatings</span>
                      </h3>
                      <div className="space-y-2 flex-1 overflow-y-auto max-h-[240px] pr-1">
                        {APRON_COSMETICS.map((item) => {
                          const isUnlocked = unlockedCosmetics.includes(item.id);
                          const isActive = activeApronColor === item.id;
                          return (
                            <button
                              key={item.id}
                              disabled={!isUnlocked}
                              onClick={() => setActiveApronColor(item.id)}
                              className={`w-full p-2.5 rounded-xl border text-left flex items-start gap-3 transition-all ${
                                isActive
                                  ? "bg-cyan-500/10 border-cyan-500/40 shadow-md"
                                  : isUnlocked
                                  ? "bg-slate-800/30 border-white/5 hover:border-slate-500 hover:bg-slate-800/60"
                                  : "opacity-45 bg-slate-950/20 border-white/2 cursor-not-allowed"
                              }`}
                            >
                              <div className={`w-8 h-8 rounded-lg shrink-0 border border-white/10 ${item.color} flex items-center justify-center`}>
                                {!isUnlocked && <Lock className="w-3.5 h-3.5 text-slate-300" />}
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-xs font-bold text-white leading-none">{item.name}</span>
                                  {isActive && <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-bold font-mono">EQUIPPED</span>}
                                </div>
                                <p className="text-[10px] text-slate-400 mt-1 leading-tight truncate">{item.desc}</p>
                                {!isUnlocked && <p className="text-[9px] text-red-400 font-mono font-bold mt-1 uppercase">{item.unlock}</p>}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Right Station Decor Wardrobe */}
                    <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 flex flex-col">
                      <h3 className="text-sm font-bold text-slate-200 mb-3 flex items-center gap-1.5 border-b border-white/5 pb-2">
                        <Compass className="w-4 h-4 text-emerald-400" />
                        <span>Station Procedural Decorations</span>
                      </h3>
                      <div className="space-y-2 flex-1 overflow-y-auto max-h-[240px] pr-1">
                        {STATION_DECOR_COSMETICS.map((item) => {
                          const isUnlocked = unlockedCosmetics.includes(item.id);
                          const isActive = activeStationDecoration === item.id;
                          return (
                            <button
                              key={item.id}
                              disabled={!isUnlocked}
                              onClick={() => setActiveStationDecoration(item.id)}
                              className={`w-full p-2.5 rounded-xl border text-left flex items-start gap-3 transition-all ${
                                isActive
                                  ? "bg-emerald-500/10 border-emerald-500/40 shadow-md"
                                  : isUnlocked
                                  ? "bg-slate-800/30 border-white/5 hover:border-slate-500 hover:bg-slate-800/60"
                                  : "opacity-45 bg-slate-950/20 border-white/2 cursor-not-allowed"
                              }`}
                            >
                              <div className="w-8 h-8 rounded-lg shrink-0 border border-white/10 bg-slate-950/60 flex items-center justify-center text-emerald-400">
                                {isUnlocked ? <Sparkles className="w-4 h-4" /> : <Lock className="w-3.5 h-3.5 text-slate-600" />}
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-xs font-bold text-white leading-none">{item.name}</span>
                                  {isActive && <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold font-mono">EQUIPPED</span>}
                                </div>
                                <p className="text-[10px] text-slate-400 mt-1 leading-tight">{item.desc}</p>
                                {!isUnlocked && <p className="text-[9px] text-red-400 font-mono font-bold mt-1 uppercase">{item.unlock}</p>}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ==================== 2. MEMORY PANTRY TAB ==================== */}
              {activeTab === "memory" && (
                <div className="flex-1 flex flex-col">
                  {!isDayUnlocked(0) ? (
                    <LockedPage dayNum={1} quest={QUESTS[0]} />
                  ) : (
                    <UnlockedRecipePage
                      title="The Parametric Memory Soufflé"
                      techName="Static Model Memory"
                      desc="Parametric weight retrieval extracts static knowledge baked directly into the model's neural layers during pre-training. Perfect for deep background facts, language models, translations, and logical reasoning, but inherently frozen in time."
                      realWorldExample="Requesting an LLM (like Gemini 1.5 Flash base) to explain a historical fact (e.g., 'What is the capital of France?') or write a mathematical algorithm without querying external databases. Instant but lacks real-time awareness."
                      stars={getDayStars(0)}
                      speed={getDaySpeed(0)}
                      accuracy={getDayAccuracy(0)}
                      pantryId="memory"
                    />
                  )}
                </div>
              )}

              {/* ==================== 3. SEARCH MARKET TAB ==================== */}
              {activeTab === "search" && (
                <div className="flex-1 flex flex-col">
                  {!isDayUnlocked(1) ? (
                    <LockedPage dayNum={2} quest={QUESTS[1]} />
                  ) : (
                    <UnlockedRecipePage
                      title="The Non-Parametric Search Salad"
                      techName="Web Search / Grounding (RAG)"
                      desc="Retrieval-Augmented Generation (RAG) queries dynamic, non-parametric indices or web APIs to extract raw context packets, infusing them directly into the prompt. Best for real-time live events, breaking news, weather forecast feeds, or localized files."
                      realWorldExample="Search Grounding engines like Google Search API. When Sarah asks 'Is it going to rain today?', the model invokes a web crawler tool to pull fresh meteorological data blocks, preventing halluncinations on current facts."
                      stars={getDayStars(1)}
                      speed={getDaySpeed(1)}
                      accuracy={getDayAccuracy(1)}
                      pantryId="search"
                    />
                  )}
                </div>
              )}

              {/* ==================== 4. RESEARCH LAB TAB ==================== */}
              {activeTab === "research" && (
                <div className="flex-1 flex flex-col">
                  {!isDayUnlocked(2) ? (
                    <LockedPage dayNum={3} quest={QUESTS[2]} />
                  ) : (
                    <UnlockedRecipePage
                      title="The Agentic Multi-Hop Research Stew"
                      techName="Deep Agentic Research Loops"
                      desc="Deep agentic research executes iterative, multi-hop research loops. The model acts as an agent, autonomously visiting search sites, extracting partial findings, spawning auxiliary queries, and synthesizing comprehensive summaries. Takes longer but handles high complexity."
                      realWorldExample="Next-generation reasoning systems (OpenAI Deep Research, Gemini Deep Research). Grandpa Joe needs a complex historical analysis; the agent executes multiple web queries, cross-references sources, self-corrects, and compiles a comprehensive dossier."
                      stars={getDayStars(2)}
                      speed={getDaySpeed(2)}
                      accuracy={getDayAccuracy(2)}
                      pantryId="research"
                    />
                  )}
                </div>
              )}

              {/* ==================== 5. HYBRID CHEF TAB ==================== */}
              {activeTab === "hybrid" && (
                <div className="flex-1 flex flex-col">
                  {!isDayUnlocked(3) ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-8 border border-white/5 rounded-2xl bg-slate-950/40">
                      <Lock className="w-16 h-16 text-rose-500/60 mb-4 animate-bounce" />
                      <h2 className="text-xl font-bold text-white">Hybrid Master Culinary Chef (Locked)</h2>
                      <p className="text-sm text-slate-400 mt-2 max-w-md">
                        Master individual retrieval techniques first. Complete Day 3 to decode our village's crop-watering drones (Day 4) and Captain Nova's asteroid route briefing (Day 5)!
                      </p>
                    </div>
                  ) : (
                    <div className="flex-1 flex flex-col">
                      <div className="mb-4">
                        <span className="text-[10px] text-rose-400 font-mono tracking-widest font-bold uppercase">Ultimate Synthesis</span>
                        <h1 className="text-xl font-extrabold text-white">Hybrid Retrievals (Day 4 & 5)</h1>
                        <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                          Master retrieval chefs don't just use single stations. They combine ingredients at the counter! Merging parametric memory, live web index, and agentic multi-hop loops produces the ultimate safe reasoning cocktails.
                        </p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1">
                        {/* Day 4 Box */}
                        <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5 flex flex-col justify-between">
                          <div>
                            <div className="flex justify-between items-start">
                              <span className="text-[10px] text-amber-300 font-mono font-bold uppercase">Level Day 4</span>
                              {isDayUnlocked(3) && (
                                <div className="flex text-amber-400">
                                  {Array.from({ length: getDayStars(3) }).map((_, i) => (
                                    <Star key={i} className="w-3.5 h-3.5 fill-current" />
                                  ))}
                                </div>
                              )}
                            </div>
                            <h3 className="text-md font-bold text-white mt-1">Memory + Search Drone Fuel</h3>
                            <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">
                              Dr. Elara's assignment required combining background crop constants (Memory) and real-time live local humidity (Search) to coordinate field drones.
                            </p>
                            <div className="mt-3 text-[10px] bg-slate-950/40 p-2 rounded-lg font-mono text-cyan-300">
                              Recipe: MEMORY + SEARCH
                            </div>
                          </div>
                          
                          {completedDaysStats[3] && (
                            <div className="flex gap-4 border-t border-white/5 pt-3 mt-3 text-xs text-slate-400 font-mono">
                              <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-slate-500" /> {getDaySpeed(3)}s</span>
                              <span className="flex items-center gap-1"><Target className="w-3.5 h-3.5 text-slate-500" /> {getDayAccuracy(3)}% Acc</span>
                            </div>
                          )}
                        </div>

                        {/* Day 5 Box */}
                        <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5 flex flex-col justify-between">
                          <div>
                            <div className="flex justify-between items-start">
                              <span className="text-[10px] text-purple-300 font-mono font-bold uppercase">Level Day 5</span>
                              {isDayUnlocked(4) && (
                                <div className="flex text-purple-400">
                                  {Array.from({ length: getDayStars(4) }).map((_, i) => (
                                    <Star key={i} className="w-3.5 h-3.5 fill-current" />
                                  ))}
                                </div>
                              )}
                            </div>
                            <h3 className="text-md font-bold text-white mt-1">Unified Triple Asteroid Plan</h3>
                            <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">
                              Captain Nova's assignment required compiling quadrant constants (Memory), real-time space meteor hazards (Search), and deep pathfinding summaries (Deep Research) in a complete recipe.
                            </p>
                            <div className="mt-3 text-[10px] bg-slate-950/40 p-2 rounded-lg font-mono text-purple-300">
                              Recipe: MEMORY + SEARCH + RESEARCH
                            </div>
                          </div>

                          {completedDaysStats[4] && (
                            <div className="flex gap-4 border-t border-white/5 pt-3 mt-3 text-xs text-slate-400 font-mono">
                              <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-slate-500" /> {getDaySpeed(4)}s</span>
                              <span className="flex items-center gap-1"><Target className="w-3.5 h-3.5 text-slate-500" /> {getDayAccuracy(4)}% Acc</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

            </motion.div>
          </AnimatePresence>

        </div>
      </motion.div>
    </div>
  );
}

// Sub-Component for Locked Recipes
function LockedPage({ dayNum, quest }: { dayNum: number; quest: any }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center p-8 border border-white/5 rounded-2xl bg-slate-950/30">
      <div className="relative mb-4">
        <div className="absolute inset-0 bg-cyan-500/20 blur-xl rounded-full" />
        <Lock className="w-16 h-16 text-cyan-400 relative animate-pulse" />
      </div>
      <h2 className="text-xl font-bold text-white">Recipe Segment Locked</h2>
      <p className="text-sm text-slate-400 mt-2 max-w-sm">
        To decode this retrieval cookbook entry, complete <strong className="text-cyan-300">Day {dayNum}</strong> with the customer:
      </p>
      
      <div className="mt-4 bg-slate-950/60 p-4 rounded-xl max-w-md border border-white/5 text-left">
        <span className="text-[9px] font-mono font-bold text-slate-500 tracking-wider uppercase">{quest?.customer.toUpperCase()} asks:</span>
        <p className="text-xs text-slate-300 italic mt-1 leading-relaxed">"{quest?.question}"</p>
        <div className="flex items-center gap-1.5 mt-3 text-[10px] text-cyan-400 font-mono">
          <ArrowRight className="w-3 h-3" />
          <span>Expected Answer Source: {quest?.expectedItem.toUpperCase()}</span>
        </div>
      </div>
    </div>
  );
}

// Sub-Component for Unlocked Recipe details with custom SVG illustrations
function UnlockedRecipePage({
  title,
  techName,
  desc,
  realWorldExample,
  stars,
  speed,
  accuracy,
  pantryId,
}: {
  title: string;
  techName: string;
  desc: string;
  realWorldExample: string;
  stars: number;
  speed: number | null;
  accuracy: number | null;
  pantryId: "memory" | "search" | "research";
}) {
  return (
    <div className="flex-1 flex flex-col">
      <div className="flex justify-between items-start border-b border-white/5 pb-2 mb-4">
        <div>
          <span className="text-[10px] text-cyan-400 font-mono tracking-widest font-bold uppercase">{techName}</span>
          <h2 className="text-xl font-extrabold text-white mt-0.5">{title}</h2>
        </div>
        <div className="flex items-center gap-1">
          {Array.from({ length: 3 }).map((_, i) => (
            <Star
              key={i}
              className={`w-5 h-5 ${
                i < stars ? "text-yellow-400 fill-yellow-400" : "text-slate-700"
              }`}
            />
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 flex-1 min-h-0">
        
        {/* Concept details */}
        <div className="lg:col-span-2 space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div>
              <h4 className="text-[11px] font-mono text-slate-400 font-bold tracking-wider uppercase">Culinary Explanation</h4>
              <p className="text-xs text-slate-300 leading-relaxed mt-1">{desc}</p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950/40 border border-white/5">
              <h4 className="text-[10px] font-mono text-cyan-400 font-bold tracking-wider uppercase">Real AI Architecture Example</h4>
              <p className="text-xs text-slate-400 leading-relaxed mt-1 italic">
                {realWorldExample}
              </p>
            </div>
          </div>

          {/* Performance HUD */}
          {speed !== null && (
            <div className="flex gap-6 border-t border-white/5 pt-3 text-xs text-slate-400 font-mono bg-slate-950/20 p-3 rounded-xl border border-white/5">
              <div className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-cyan-400" />
                <div>
                  <p className="text-[9px] text-slate-500 leading-none">PREPARATION SPEED</p>
                  <p className="text-xs font-bold text-white mt-1">{speed} seconds</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <Target className="w-4 h-4 text-emerald-400" />
                <div>
                  <p className="text-[9px] text-slate-500 leading-none">RECIPE ACCURACY</p>
                  <p className="text-xs font-bold text-white mt-1">{accuracy}% Accuracy</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <Compass className="w-4 h-4 text-purple-400" />
                <div>
                  <p className="text-[9px] text-slate-500 leading-none">FAVORITE FLAVOR</p>
                  <p className="text-xs font-bold text-white mt-1 capitalize">{pantryId}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Procedural SVG illustration column */}
        <div className="rounded-2xl border border-white/5 bg-slate-950/50 flex flex-col items-center justify-center p-4">
          <span className="text-[9px] font-mono font-bold text-slate-500 tracking-wider uppercase mb-3 text-center">Procedural Diagram</span>
          
          {pantryId === "memory" && (
            <svg viewBox="0 0 120 120" className="w-28 h-28 animate-pulse text-amber-400">
              <defs>
                <radialGradient id="grad-memory" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#78350f" stopOpacity="0" />
                </radialGradient>
              </defs>
              <circle cx="60" cy="60" r="35" fill="url(#grad-memory)" />
              {/* Circuit network lines */}
              <path d="M 60 15 L 60 45 M 60 75 L 60 105 M 15 60 L 45 60 M 75 60 L 105 60" stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="3, 3" />
              {/* Outer nodes */}
              <circle cx="60" cy="15" r="4" fill="#fbbf24" />
              <circle cx="60" cy="105" r="4" fill="#fbbf24" />
              <circle cx="15" cy="60" r="4" fill="#fbbf24" />
              <circle cx="105" cy="60" r="4" fill="#fbbf24" />
              {/* Inner central weights core */}
              <rect x="52" y="52" width="16" height="16" rx="4" fill="#f59e0b" stroke="#fff" strokeWidth="1.5" />
            </svg>
          )}

          {pantryId === "search" && (
            <svg viewBox="0 0 120 120" className="w-28 h-28 text-emerald-400">
              <defs>
                <radialGradient id="grad-search" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#10b981" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#064e3b" stopOpacity="0" />
                </radialGradient>
              </defs>
              <circle cx="60" cy="60" r="40" fill="url(#grad-search)" />
              {/* Intersecting orbital paths */}
              <ellipse cx="60" cy="60" rx="35" ry="12" fill="none" stroke="#10b981" strokeWidth="1.2" transform="rotate(30 60 60)" />
              <ellipse cx="60" cy="60" rx="35" ry="12" fill="none" stroke="#10b981" strokeWidth="1.2" transform="rotate(-30 60 60)" />
              {/* Satellite web elements */}
              <circle cx="35" cy="45" r="3" fill="#34d399" />
              <circle cx="85" cy="75" r="3" fill="#34d399" />
              <circle cx="85" cy="45" r="3" fill="#34d399" />
              <circle cx="35" cy="75" r="3" fill="#34d399" />
              {/* Central hub */}
              <circle cx="60" cy="60" r="8" fill="#10b981" stroke="#fff" strokeWidth="1.5" />
            </svg>
          )}

          {pantryId === "research" && (
            <svg viewBox="0 0 120 120" className="w-28 h-28 text-purple-400">
              <defs>
                <radialGradient id="grad-research" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#4c1d95" stopOpacity="0" />
                </radialGradient>
              </defs>
              <circle cx="60" cy="60" r="42" fill="url(#grad-research)" />
              {/* Multi-step search neural nodes tree */}
              <line x1="60" y1="20" x2="35" y2="55" stroke="#a78bfa" strokeWidth="1.5" />
              <line x1="60" y1="20" x2="85" y2="55" stroke="#a78bfa" strokeWidth="1.5" />
              <line x1="35" y1="55" x2="20" y2="90" stroke="#a78bfa" strokeWidth="1.2" />
              <line x1="35" y1="55" x2="50" y2="90" stroke="#a78bfa" strokeWidth="1.2" />
              <line x1="85" y1="55" x2="70" y2="90" stroke="#a78bfa" strokeWidth="1.2" />
              <line x1="85" y1="55" x2="100" y2="90" stroke="#a78bfa" strokeWidth="1.2" />
              {/* Nodes */}
              <circle cx="60" cy="20" r="5" fill="#8b5cf6" stroke="#fff" strokeWidth="1.5" />
              <circle cx="35" cy="55" r="4" fill="#a78bfa" stroke="#fff" strokeWidth="1" />
              <circle cx="85" cy="55" r="4" fill="#a78bfa" stroke="#fff" strokeWidth="1" />
              <circle cx="20" cy="90" r="3.5" fill="#ddd" />
              <circle cx="50" cy="90" r="3.5" fill="#ddd" />
              <circle cx="70" cy="90" r="3.5" fill="#ddd" />
              <circle cx="100" cy="90" r="3.5" fill="#ddd" />
            </svg>
          )}

          <p className="text-[10px] text-slate-500 mt-4 leading-relaxed text-center italic max-w-[140px]">
            {pantryId === "memory" ? "Weights encoded statically at compile time" : pantryId === "search" ? "Dynamic RAG web index search fetching" : "Iterative agentic multi-hop query synthesis"}
          </p>
        </div>

      </div>
    </div>
  );
}
