"use client";

import { useState, useMemo, useEffect } from "react";
import { useGame, QUESTS } from "./GameContext";
import { Sliders, Flame, Hammer, Eye, Palette, ChevronDown, ChevronUp, Volume2, VolumeX, BookOpen } from "lucide-react";
import { HolographicInsightCard } from "./HolographicInsightCard";
import { motion, AnimatePresence } from "motion/react";
import { CookbookJournal } from "./CookbookJournal";

export function UI() {
  const {
    dialog,
    day,
    inventory,
    questState,
    hideDialog,
    woodGrainScale,
    setWoodGrainScale,
    woodColorVariation,
    setWoodColorVariation,
    woodWearAmount,
    setWoodWearAmount,
    woodKnotStrength,
    setWoodKnotStrength,
    metalScratchScale,
    setMetalScratchScale,
    metalScratchDirection,
    setMetalScratchDirection,
    metalRoughness,
    setMetalRoughness,
    metalFingerprintStrength,
    setMetalFingerprintStrength,
    isMuted,
    toggleMute,
    physicsDebug,
    setPhysicsDebug,
    journalOpen,
    setJournalOpen,
    triggerUnlockAnimation,
    setTriggerUnlockAnimation,
  } = useGame();

  const [isCustomizerOpen, setIsCustomizerOpen] = useState(true);

  const [uiParticles, setUiParticles] = useState<Array<{ id: number; x: number; y: number; size: number; color: string; delay: number }>>([]);

  useEffect(() => {
    if (triggerUnlockAnimation) {
      // Spawn 30 floating square digital particles representing database sync
      const newParticles = Array.from({ length: 30 }).map((_, i) => ({
        id: Date.now() + i,
        x: Math.random() * 100, // percentage of screen width
        y: 80 + Math.random() * 20, // percentage from top (near bottom)
        size: 6 + Math.random() * 12,
        color: Math.random() > 0.5 ? "bg-cyan-400" : "bg-yellow-400",
        delay: Math.random() * 0.6,
      }));
      setUiParticles(newParticles);
      
      const timer = setTimeout(() => {
        setTriggerUnlockAnimation(false);
        setUiParticles([]);
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [triggerUnlockAnimation, setTriggerUnlockAnimation]);

  const currentQuest = useMemo(() => {
    if (day < QUESTS.length) {
      return QUESTS[day];
    }
    return null;
  }, [day]);

  const isCustomerSpeaking = useMemo(() => {
    if (!dialog) return false;
    const lower = dialog.toLowerCase();
    return lower.startsWith("timmy:") || lower.startsWith("sarah:") || lower.startsWith("grandpa:") || lower.startsWith("elara:") || lower.startsWith("nova:");
  }, [dialog]);

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-6">
      {/* Floating database sync digital data particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-40">
        <AnimatePresence>
          {uiParticles.map((p) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, x: `${p.x}vw`, y: `${p.y}vh`, scale: 0.5, rotate: 0 }}
              animate={{ 
                opacity: [0, 0.9, 0.9, 0], 
                y: [`${p.y}vh`, `${p.y - 70}vh`],
                scale: [0.5, 1.2, 1.0, 0.2],
                rotate: [0, 180, 360],
              }}
              exit={{ opacity: 0 }}
              transition={{ duration: 2.8, ease: "easeOut", delay: p.delay }}
              className={`absolute rounded-sm ${p.color} shadow-[0_0_15px_rgba(34,211,238,0.4)]`}
              style={{ width: p.size, height: p.size }}
            />
          ))}
        </AnimatePresence>
      </div>
      {/* Top Bar */}
      <div className="flex justify-between items-start">
        <div className="bg-white/80 backdrop-blur-md p-4 rounded-xl shadow-lg border border-white/40 max-w-sm pointer-events-auto flex items-center justify-between gap-6">
          <div>
            <h1 className="text-xl font-bold text-gray-900 tracking-tight">The Retrieval Kitchen</h1>
            <p className="text-sm text-gray-600 mt-1">Day {day + 1}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setJournalOpen(true)}
              className="flex items-center gap-2 px-3.5 py-2 border border-amber-200 bg-amber-50 text-amber-800 rounded-lg hover:bg-amber-100 transition-all font-semibold text-xs shadow-sm"
              title="Open Cookbook Journal (Shortcut: J)"
            >
              <BookOpen className="w-4 h-4 text-amber-600" />
              <span>Cookbook (J)</span>
            </button>
            <button
              onClick={toggleMute}
              className={`p-2 rounded-lg transition-all duration-200 border ${
                isMuted
                  ? "bg-red-50 border-red-200 text-red-600 hover:bg-red-100"
                  : "bg-blue-50 border-blue-200 text-blue-600 hover:bg-blue-100"
              }`}
              title={isMuted ? "Unmute Sound" : "Mute Sound"}
            >
              {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
            </button>
          </div>
        </div>
        
        <div className="flex flex-col items-end gap-3 pointer-events-auto">
          {/* Inventory */}
          <div className="bg-white/80 backdrop-blur-md p-4 rounded-xl shadow-lg border border-white/40 flex items-center gap-3">
            <span className="text-sm font-medium text-gray-600">Inventory:</span>
            {inventory === "none" ? (
              <span className="text-gray-400 italic">Empty</span>
            ) : (
              <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-bold capitalize shadow-inner animate-pulse">
                {inventory} Data
              </span>
            )}
          </div>

          {/* Unified Procedural Customizers */}
          <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-white/40 w-72 overflow-hidden flex flex-col transition-all duration-300">
            {/* WOOD SECTION */}
            <button
              onClick={() => setIsCustomizerOpen(!isCustomizerOpen)}
              className="flex items-center justify-between w-full p-4 bg-amber-50/50 hover:bg-amber-100/50 transition-colors text-amber-900 font-semibold text-sm border-b border-gray-100"
            >
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-amber-700" />
                <span>Wood Shader Customizer</span>
              </div>
              {isCustomizerOpen ? (
                <ChevronUp className="w-4 h-4 text-amber-700" />
              ) : (
                <ChevronDown className="w-4 h-4 text-amber-700" />
              )}
            </button>

            {isCustomizerOpen && (
              <div className="p-4 flex flex-col gap-4 text-xs text-gray-700 border-b border-gray-100">
                {/* Grain Scale Slider */}
                <div className="flex flex-col gap-1">
                  <div className="flex justify-between font-medium">
                    <span className="flex items-center gap-1">
                      <Eye className="w-3.5 h-3.5 text-gray-500" />
                      Grain Scale
                    </span>
                    <span className="font-mono bg-gray-100 px-1.5 py-0.5 rounded text-gray-600">
                      {woodGrainScale.toFixed(1)}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="1.0"
                    max="10.0"
                    step="0.1"
                    value={woodGrainScale}
                    onChange={(e) => setWoodGrainScale(parseFloat(e.target.value))}
                    className="w-full accent-amber-600 cursor-pointer h-1.5 bg-gray-200 rounded-lg appearance-none"
                  />
                </div>

                {/* Color Variation Slider */}
                <div className="flex flex-col gap-1">
                  <div className="flex justify-between font-medium">
                    <span className="flex items-center gap-1">
                      <Palette className="w-3.5 h-3.5 text-gray-500" />
                      Color Variation
                    </span>
                    <span className="font-mono bg-gray-100 px-1.5 py-0.5 rounded text-gray-600">
                      {woodColorVariation.toFixed(2)}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0.0"
                    max="1.5"
                    step="0.05"
                    value={woodColorVariation}
                    onChange={(e) => setWoodColorVariation(parseFloat(e.target.value))}
                    className="w-full accent-amber-600 cursor-pointer h-1.5 bg-gray-200 rounded-lg appearance-none"
                  />
                </div>

                {/* Wear & Tear Amount Slider */}
                <div className="flex flex-col gap-1">
                  <div className="flex justify-between font-medium">
                    <span className="flex items-center gap-1">
                      <Hammer className="w-3.5 h-3.5 text-gray-500" />
                      Wear & Tear
                    </span>
                    <span className="font-mono bg-gray-100 px-1.5 py-0.5 rounded text-gray-600">
                      {woodWearAmount.toFixed(2)}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0.0"
                    max="1.0"
                    step="0.05"
                    value={woodWearAmount}
                    onChange={(e) => setWoodWearAmount(parseFloat(e.target.value))}
                    className="w-full accent-amber-600 cursor-pointer h-1.5 bg-gray-200 rounded-lg appearance-none"
                  />
                </div>

                {/* Knot Strength Slider */}
                <div className="flex flex-col gap-1">
                  <div className="flex justify-between font-medium">
                    <span className="flex items-center gap-1">
                      <Flame className="w-3.5 h-3.5 text-gray-500" />
                      Knot Strength
                    </span>
                    <span className="font-mono bg-gray-100 px-1.5 py-0.5 rounded text-gray-600">
                      {woodKnotStrength.toFixed(2)}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0.0"
                    max="1.5"
                    step="0.05"
                    value={woodKnotStrength}
                    onChange={(e) => setWoodKnotStrength(parseFloat(e.target.value))}
                    className="w-full accent-amber-600 cursor-pointer h-1.5 bg-gray-200 rounded-lg appearance-none"
                  />
                </div>
              </div>
            )}

            {/* METAL SECTION */}
            <div className="p-4 bg-slate-50/50 flex flex-col gap-4 text-xs text-slate-700">
              <span className="font-semibold text-slate-800 text-[13px] flex items-center gap-1.5 border-b border-slate-200 pb-1">
                <Sliders className="w-4 h-4 text-slate-600" />
                Stainless Steel Shader
              </span>

              {/* Metal Scratch Scale */}
              <div className="flex flex-col gap-1">
                <div className="flex justify-between font-medium">
                  <span className="flex items-center gap-1">
                    <Eye className="w-3.5 h-3.5 text-slate-500" />
                    Brushing Grain Scale
                  </span>
                  <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">
                    {metalScratchScale.toFixed(1)}
                  </span>
                </div>
                <input
                  type="range"
                  min="1.0"
                  max="15.0"
                  step="0.2"
                  value={metalScratchScale}
                  onChange={(e) => setMetalScratchScale(parseFloat(e.target.value))}
                  className="w-full accent-slate-600 cursor-pointer h-1.5 bg-slate-200 rounded-lg appearance-none"
                />
              </div>

              {/* Scratch Direction */}
              <div className="flex flex-col gap-1">
                <div className="flex justify-between font-medium">
                  <span className="flex items-center gap-1">
                    <Sliders className="w-3.5 h-3.5 text-slate-500" />
                    Brushing Direction
                  </span>
                  <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">
                    {metalScratchDirection === 0.0 ? "Horizontal" : metalScratchDirection === 1.0 ? "Vertical" : "Mixed"}
                  </span>
                </div>
                <input
                  type="range"
                  min="0.0"
                  max="1.0"
                  step="1.0"
                  value={metalScratchDirection}
                  onChange={(e) => setMetalScratchDirection(parseFloat(e.target.value))}
                  className="w-full accent-slate-600 cursor-pointer h-1.5 bg-slate-200 rounded-lg appearance-none"
                />
              </div>

              {/* Base Metal Roughness */}
              <div className="flex flex-col gap-1">
                <div className="flex justify-between font-medium">
                  <span className="flex items-center gap-1">
                    <Palette className="w-3.5 h-3.5 text-slate-500" />
                    Base Roughness
                  </span>
                  <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">
                    {metalRoughness.toFixed(2)}
                  </span>
                </div>
                <input
                  type="range"
                  min="0.05"
                  max="0.80"
                  step="0.02"
                  value={metalRoughness}
                  onChange={(e) => setMetalRoughness(parseFloat(e.target.value))}
                  className="w-full accent-slate-600 cursor-pointer h-1.5 bg-slate-200 rounded-lg appearance-none"
                />
              </div>

              {/* Fingerprint Grease Strength */}
              <div className="flex flex-col gap-1">
                <div className="flex justify-between font-medium">
                  <span className="flex items-center gap-1">
                    <Hammer className="w-3.5 h-3.5 text-slate-500" />
                    Fingerprints/Wear
                  </span>
                  <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">
                    {metalFingerprintStrength.toFixed(2)}
                  </span>
                </div>
                <input
                  type="range"
                  min="0.0"
                  max="1.0"
                  step="0.05"
                  value={metalFingerprintStrength}
                  onChange={(e) => setMetalFingerprintStrength(parseFloat(e.target.value))}
                  className="w-full accent-slate-600 cursor-pointer h-1.5 bg-slate-200 rounded-lg appearance-none"
                />
              </div>

              {/* Physics Debug Visuals Toggle */}
              <div className="flex items-center justify-between border-t border-slate-200 pt-3 mt-1 font-medium text-slate-800">
                <span className="flex items-center gap-1">
                  <Flame className="w-3.5 h-3.5 text-blue-500" />
                  Physics Wireframes
                </span>
                <button
                  onClick={() => setPhysicsDebug(!physicsDebug)}
                  className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    physicsDebug ? "bg-blue-600" : "bg-slate-300"
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      physicsDebug ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>

              <p className="text-[10px] text-slate-400 mt-1 leading-relaxed italic text-center">
                High metalness & anisotropic specular, reflections driven by procedural sky
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Dialog Box */}
      <div className="flex justify-center mb-8">
        {dialog && !isCustomerSpeaking && (
          <div className="bg-white/95 backdrop-blur-lg p-6 rounded-2xl shadow-2xl border border-white/50 max-w-2xl w-full pointer-events-auto flex flex-col animate-in fade-in slide-in-from-bottom-4">
            <p className="text-lg text-gray-800 leading-relaxed font-medium">{dialog}</p>
            <div className="flex justify-end mt-4">
              <button 
                onClick={hideDialog}
                className="text-sm text-gray-500 hover:text-gray-900 transition-colors px-4 py-2"
              >
                Press SPACE or Click to close
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Holographic Insight Card (Post-Serve HUD) */}
      <AnimatePresence>
        {currentQuest && (questState === "answered" || questState === "completed") && (
          <HolographicInsightCard quest={currentQuest} questState={questState} />
        )}
      </AnimatePresence>

      {/* Cookbook Journal Modal (Presents on 'J' or Button click) */}
      <AnimatePresence>
        {journalOpen && <CookbookJournal />}
      </AnimatePresence>

      {/* Controls Help */}
      <div className="absolute bottom-6 left-6 text-sm text-gray-800 drop-shadow-md font-medium">
        <p>WASD / Arrows : Move</p>
        <p>SPACE : Interact / Talk</p>
        <p>J : Toggle Cookbook Journal</p>
      </div>
    </div>
  );
}
