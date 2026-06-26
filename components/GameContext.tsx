"use client";

import { createContext, useContext, useState, ReactNode, useEffect, useRef } from "react";
import AudioManager from "./AudioManager";
import { useLocalStorage } from "./useLocalStorage";

export type ItemType = 
  | "none" 
  | "memory" 
  | "search" 
  | "research" 
  | "memory_search" 
  | "memory_research" 
  | "search_research" 
  | "all_combined";

export type CustomerId = "timmy" | "sarah" | "grandpa" | "elara" | "nova";

export interface Quest {
  customer: CustomerId;
  question: string;
  expectedItem: ItemType;
  hint: string;
  successText: string;
  failText: string;
  learningText: string;
}

export const QUESTS: Quest[] = [
  {
    customer: "timmy",
    question: "Hey! I'm doing homework. What's the capital of France? I need a quick fact.",
    expectedItem: "memory",
    hint: "Timmy needs a quick established fact. Visit the Memory Pantry.",
    successText: "Paris! Thanks, that was fast!",
    failText: "Hmm, this seems like too much or wrong info. I just need a quick fact from memory.",
    learningText: "💡 LESSON: The 'Memory Pantry' represents an AI's pre-trained knowledge. It's instantly accessible and perfect for established facts, but it doesn't know about recent events.",
  },
  {
    customer: "sarah",
    question: "I'm setting up my stall. Is it going to rain today? I need current info.",
    expectedItem: "search",
    hint: "Sarah needs current, real-time info. Visit the Search Market.",
    successText: "Clear skies! Perfect, thanks for the fresh info!",
    failText: "This doesn't help with today's weather. I need fresh, current information.",
    learningText: "💡 LESSON: The 'Search Market' represents Web Search. It retrieves fresh, real-time data from the web. It's great for current events, but it doesn't do deep synthesis.",
  },
  {
    customer: "grandpa",
    question: "Can you gather sources on the history of this town and summarize how it changed over the last 50 years?",
    expectedItem: "research",
    hint: "Grandpa Joe needs a deep synthesis of multiple sources. Visit the Deep Research Lab.",
    successText: "Ah, a beautifully synthesized report. Thank you for taking the time to research this deeply.",
    failText: "This is too superficial. I need deep research and synthesis.",
    learningText: "💡 LESSON: The 'Deep Research Lab' represents an Agentic Research loop. It takes longer, but autonomously visits multiple sources and synthesizes them into a comprehensive analysis.",
  },
  {
    customer: "elara",
    question: "Hello! I am calibrating our village's crop-watering drones. I need to know the historical water absorption rate of wheat (Memory) and combine it with today's live local humidity forecast (Search) so we don't flood the fields!",
    expectedItem: "memory_search",
    hint: "Dr. Elara needs a hybrid solution. Bring BOTH Memory (historical wheat rates) and Search (today's humidity) combined.",
    successText: "Spectacular! Pre-trained historical absorption rates combined with real-time local weather. The drones are flying with perfect coordinates!",
    failText: "Wait, the mixture is incomplete! I need BOTH Memory fact and Search live info merged.",
    learningText: "💡 LESSON: Hybrid retrieval merges parametric weights (Memory) with live external API calls (Search) to solve complex real-world issues requiring both background expertise and fresh context.",
  },
  {
    customer: "nova",
    question: "Greetings! We are planning the main transit route for our cargo freighters. I need the historic asteroid density constants of this quadrant (Memory), today's active meteor activity reports (Search), and a fully agentic synthesized routing risk assessment (Deep Research)!",
    expectedItem: "all_combined",
    hint: "Gather all three items: Memory fact, Search update, and Research report to form the ultimate combined routing flight plan.",
    successText: "Outstanding! Core static constants, real-time weather, and deep agentic analysis combined into a flawless route. We are clear for launch!",
    failText: "No, this flight plan is lacking. It needs ALL THREE retrieval methods combined: Memory, Search, and Deep Research.",
    learningText: "💡 LESSON: The Grand Unified Retrieval recipe combines static weights, real-time web grounding, and multi-hop deep research. This produces highly verified, complete, and reliable reasoning for high-stakes enterprise problems.",
  },
];

export interface DayStats {
  dayIndex: number;
  stars: number;
  speed: number; // in seconds
  accuracy: number; // percentage
  unlocked: boolean;
}

export interface SavedProgress {
  day: number;
  completedDaysStats: Record<number, DayStats>;
  activeApronColor: string;
  activeStationDecoration: string;
  unlockedCosmetics: string[];
}

interface GameContextType {
  day: number;
  setDay: (day: number) => void;
  inventory: ItemType;
  dialog: string | null;
  questState: "idle" | "active" | "answered" | "completed";
  showDialog: (text: string) => void;
  hideDialog: () => void;
  setInventory: (item: ItemType) => void;
  interactWithCustomer: () => void;
  interactWithLocation: (locationType: "memory" | "search" | "research") => void;
  
  // Custom Procedural Wood Shader values
  woodGrainScale: number;
  setWoodGrainScale: (val: number) => void;
  woodColorVariation: number;
  setWoodColorVariation: (val: number) => void;
  woodWearAmount: number;
  setWoodWearAmount: (val: number) => void;
  woodKnotStrength: number;
  setWoodKnotStrength: (val: number) => void;
  
  // Custom Procedural Metal Shader values
  metalScratchScale: number;
  setMetalScratchScale: (val: number) => void;
  metalScratchDirection: number;
  setMetalScratchDirection: (val: number) => void;
  metalRoughness: number;
  setMetalRoughness: (val: number) => void;
  metalFingerprintStrength: number;
  setMetalFingerprintStrength: (val: number) => void;
  
  isMuted: boolean;
  toggleMute: () => void;
  physicsDebug: boolean;
  setPhysicsDebug: (val: boolean) => void;

  // Journal and Progression system
  journalOpen: boolean;
  setJournalOpen: (val: boolean) => void;
  completedDaysStats: Record<number, DayStats>;
  activeApronColor: string;
  setActiveApronColor: (color: string) => void;
  activeStationDecoration: string;
  setActiveStationDecoration: (decor: string) => void;
  unlockedCosmetics: string[];
  triggerUnlockAnimation: boolean;
  setTriggerUnlockAnimation: (val: boolean) => void;
  resetProgress: () => void;
  
  // Performance timer helpers
  startTime: number;
  wrongCount: number;
}

const GameContext = createContext<GameContextType | null>(null);

const DEFAULT_PROGRESS: SavedProgress = {
  day: 0,
  completedDaysStats: {},
  activeApronColor: "#334155", // default slate-grey classic apron
  activeStationDecoration: "none",
  unlockedCosmetics: ["#334155", "none"],
};

export function GameProvider({ children }: { children: ReactNode }) {
  // Use custom useLocalStorage to persist game data
  const [progress, setProgress] = useLocalStorage<SavedProgress>("retrieval_cookbook_progress_v2", DEFAULT_PROGRESS);

  const { day, completedDaysStats, activeApronColor, activeStationDecoration, unlockedCosmetics } = progress;

  const [inventory, setInventory] = useState<ItemType>("none");
  const [dialog, setDialog] = useState<string | null>(
    "Welcome to The Retrieval Kitchen! Use WASD to move. Walk to the counter and press SPACE to talk to your first customer. Press 'J' at any time to open your Cookbook Journal!"
  );
  const [questState, setQuestState] = useState<"idle" | "active" | "answered" | "completed">("idle");

  const [journalOpen, setJournalOpen] = useState(false);
  const [triggerUnlockAnimation, setTriggerUnlockAnimation] = useState(false);

  // Custom Procedural Wood Shader values
  const [woodGrainScale, setWoodGrainScale] = useState(4.5);
  const [woodColorVariation, setWoodColorVariation] = useState(0.8);
  const [woodWearAmount, setWoodWearAmount] = useState(0.5);
  const [woodKnotStrength, setWoodKnotStrength] = useState(0.6);

  // Custom Procedural Metal Shader values
  const [metalScratchScale, setMetalScratchScale] = useState(6.0);
  const [metalScratchDirection, setMetalScratchDirection] = useState(0.0);
  const [metalRoughness, setMetalRoughness] = useState(0.25);
  const [metalFingerprintStrength, setMetalFingerprintStrength] = useState(0.4);

  const [isMuted, setIsMuted] = useState(false);
  const [physicsDebug, setPhysicsDebug] = useState(false);

  // Live timer/tracking refs (not persisted across refreshes to keep them fresh)
  const startTimeRef = useRef<number>(0);
  const wrongCountRef = useRef<number>(0);

  // Initialize and register gesture listeners to bypass browser autoplay blocks
  useEffect(() => {
    const handleGesture = () => {
      AudioManager.startAmbient();
      window.removeEventListener("keydown", handleGesture);
      window.removeEventListener("mousedown", handleGesture);
      window.removeEventListener("touchstart", handleGesture);
    };

    window.addEventListener("keydown", handleGesture);
    window.addEventListener("mousedown", handleGesture);
    window.addEventListener("touchstart", handleGesture);

    return () => {
      window.removeEventListener("keydown", handleGesture);
      window.removeEventListener("mousedown", handleGesture);
      window.removeEventListener("touchstart", handleGesture);
    };
  }, []);

  // Listen for keyboard controls - specifically the J key for Journal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "KeyJ") {
        setJournalOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const toggleMute = () => {
    const nextMuted = AudioManager.toggleMute();
    setIsMuted(nextMuted);
  };

  const showDialog = (text: string) => setDialog(text);
  const hideDialog = () => setDialog(null);

  const setDay = (newDay: number) => {
    setProgress((prev) => ({
      ...prev,
      day: newDay,
    }));
  };

  const setActiveApronColor = (color: string) => {
    setProgress((prev) => ({
      ...prev,
      activeApronColor: color,
    }));
  };

  const setActiveStationDecoration = (decor: string) => {
    setProgress((prev) => ({
      ...prev,
      activeStationDecoration: decor,
    }));
  };

  const resetProgress = () => {
    setProgress(DEFAULT_PROGRESS);
    setInventory("none");
    setQuestState("idle");
    setDialog("Welcome back! Progress has been reset. Use WASD to move. Walk to the counter and talk to your first customer.");
    startTimeRef.current = 0;
    wrongCountRef.current = 0;
  };

  // Recipe combination helper
  const combineIngredients = (current: ItemType, picked: ItemType): ItemType => {
    if (current === "none") return picked;
    if (current === picked) return current;

    const items = new Set([current, picked]);
    
    // Check for triple combos
    if (items.has("memory_search") && picked === "research") return "all_combined";
    if (items.has("memory_research") && picked === "search") return "all_combined";
    if (items.has("search_research") && picked === "memory") return "all_combined";

    // Double combos
    if (items.has("memory") && items.has("search")) return "memory_search";
    if (items.has("memory") && items.has("research")) return "memory_research";
    if (items.has("search") && items.has("research")) return "search_research";

    return current;
  };

  const interactWithCustomer = () => {
    if (day >= QUESTS.length) {
      showDialog("You have completed all culinary levels! Feel free to customize your station and check your Cookbook Journal (J).");
      return;
    }

    const currentQuest = QUESTS[day];

    if (questState === "idle") {
      showDialog(`${currentQuest.customer.toUpperCase()}: "${currentQuest.question}"`);
      setQuestState("active");
      // Start day performance timer
      startTimeRef.current = Date.now();
      wrongCountRef.current = 0;
    } else if (questState === "active") {
      if (inventory === "none") {
        showDialog(`${currentQuest.customer.toUpperCase()}: Are you still gathering ingredients? Remember: ${currentQuest.hint}`);
      } else if (inventory === currentQuest.expectedItem) {
        // Success!
        showDialog(`${currentQuest.customer.toUpperCase()}: "${currentQuest.successText}"`);
        setInventory("none");
        setQuestState("answered");

        // Calculate performance stats
        const endTime = Date.now();
        const durationSec = Math.max(1, Math.round((endTime - startTimeRef.current) / 1000));
        
        // Accuracy decreases per wrong delivery attempt
        let accuracy = 100;
        if (wrongCountRef.current === 1) accuracy = 66;
        else if (wrongCountRef.current === 2) accuracy = 33;
        else if (wrongCountRef.current >= 3) accuracy = 10;

        // Star calculation (based on speed + accuracy)
        let stars = 1;
        if (durationSec <= 35 && accuracy >= 90) {
          stars = 3;
        } else if (durationSec <= 70 && accuracy >= 60) {
          stars = 2;
        }

        // Cosmetics and features unlocked on completing the specific day
        const unlockedList = [...unlockedCosmetics];
        if (day === 0) {
          // Day 1 completion cosmetics: Neon Blue Apron, Holographic Vines
          if (!unlockedList.includes("#06b6d4")) unlockedList.push("#06b6d4");
          if (!unlockedList.includes("vines")) unlockedList.push("vines");
        } else if (day === 1) {
          // Day 2 completion cosmetics: Emerald Mint Apron, Quantum Spices particles
          if (!unlockedList.includes("#10b981")) unlockedList.push("#10b981");
          if (!unlockedList.includes("particles")) unlockedList.push("particles");
        } else if (day === 2) {
          // Day 3 completion cosmetics: Crimson Chef Apron, Golden Culinary Crest
          if (!unlockedList.includes("#e11d48")) unlockedList.push("#e11d48");
          if (!unlockedList.includes("gold")) unlockedList.push("gold");
        } else if (day === 3) {
          // Day 4 completion cosmetics: Royal Violet Apron
          if (!unlockedList.includes("#7c3aed")) unlockedList.push("#7c3aed");
        }

        const updatedStats = {
          ...completedDaysStats,
          [day]: {
            dayIndex: day,
            stars,
            speed: durationSec,
            accuracy,
            unlocked: true,
          },
        };

        setProgress((prev) => ({
          ...prev,
          completedDaysStats: updatedStats,
          unlockedCosmetics: unlockedList,
        }));

        // Trigger particles
        setTriggerUnlockAnimation(true);
      } else {
        // Wrong delivery!
        wrongCountRef.current += 1;
        showDialog(`${currentQuest.customer.toUpperCase()}: "${currentQuest.failText}"`);
        // Discard inventory back into none so the player searches again
        setInventory("none");
      }
    } else if (questState === "answered") {
      showDialog(currentQuest.learningText);
      setQuestState("completed");
    } else if (questState === "completed") {
      const nextDay = day + 1;
      
      setProgress((prev) => ({
        ...prev,
        day: nextDay,
      }));
      setQuestState("idle");

      if (nextDay < QUESTS.length) {
        if (nextDay === 3) {
          showDialog("💥 UNLOCKED: Day 4 Hybrid Challenge! You've mastered individual stations, now combine them at the counter! Walk to the counter to start.");
        } else if (nextDay === 4) {
          showDialog("🌌 UNLOCKED: Day 5 Grand Buffet Challenge! Combine all three techniques to serve Captain Nova! Talk to him at the counter.");
        } else {
          showDialog(`Day ${nextDay + 1} begins. A new customer is waiting. Walk to the counter and press SPACE to talk.`);
        }
      } else {
        showDialog("Congratulations! You have completed all levels, including the hidden hybrid culinary challenges! You are a master retrieval chef!");
      }
    }
  };

  const interactWithLocation = (locationType: "memory" | "search" | "research") => {
    if (questState !== "active") {
      showDialog("You don't have any active orders right now.");
      return;
    }

    const currentQuest = QUESTS[day];
    const newInventory = combineIngredients(inventory, locationType);

    if (newInventory === inventory) {
      showDialog(`You are already carrying ${inventory.replace("_", " & ")} data!`);
      return;
    }

    setInventory(newInventory);
    AudioManager.playSizzle();

    if (newInventory === "memory_search") {
      showDialog("🧪 CULINARY SYNTHESIS! You combined Memory facts with Search fresh forecast data! Walk back to the counter to serve.");
    } else if (newInventory === "all_combined") {
      showDialog("🌌 GRAND UNIFIED RECIPE COMPLETE! You gathered and merged Memory, Search, AND Deep Research reports! Walk back to the counter to serve.");
    } else if (newInventory === "memory_research" || newInventory === "search_research") {
      showDialog(`Combined ingredients! Holding: ${newInventory.replace("_", " & ").toUpperCase()} data. Go get the remaining ingredient if needed!`);
    } else {
      showDialog(`You gathered ${locationType} data! (Holding: ${newInventory} data). Return to the customer or visit another station to combine!`);
    }
  };

  return (
    <GameContext.Provider
      value={{
        day,
        setDay,
        inventory,
        dialog,
        questState,
        showDialog,
        hideDialog,
        setInventory,
        interactWithCustomer,
        interactWithLocation,
        
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

        // Journal and Progression
        journalOpen,
        setJournalOpen,
        completedDaysStats,
        activeApronColor,
        setActiveApronColor,
        activeStationDecoration,
        setActiveStationDecoration,
        unlockedCosmetics,
        triggerUnlockAnimation,
        setTriggerUnlockAnimation,
        resetProgress,

        startTime: startTimeRef.current,
        wrongCount: wrongCountRef.current,
      }}
    >
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const context = useContext(GameContext);
  if (!context) throw new Error("useGame must be used within GameProvider");
  return context;
}
