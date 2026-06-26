import { useProgress } from "@react-three/drei";
import { motion, AnimatePresence } from "motion/react";
import { ChefHat, Loader2 } from "lucide-react";

export function LoadingScreen() {
  const { active, progress } = useProgress();

  return (
    <AnimatePresence>
      {active && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8, ease: "easeInOut", delay: 0.2 }}
          className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-zinc-950 pointer-events-auto"
        >
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col items-center space-y-6"
          >
            <div className="relative">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                className="w-24 h-24 rounded-full border-t-2 border-r-2 border-cyan-400 opacity-50 absolute -inset-2"
              />
              <motion.div
                animate={{ rotate: -360 }}
                transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
                className="w-24 h-24 rounded-full border-b-2 border-l-2 border-yellow-400 opacity-50 absolute -inset-2"
              />
              <div className="w-20 h-20 bg-zinc-900 rounded-2xl border border-zinc-800 flex items-center justify-center shadow-[0_0_30px_rgba(34,211,238,0.2)]">
                <ChefHat className="w-10 h-10 text-cyan-400" />
              </div>
            </div>

            <div className="flex flex-col items-center space-y-2">
              <h2 className="text-2xl font-bold text-white tracking-widest font-mono uppercase">
                Initializing
              </h2>
              <div className="flex items-center space-x-2 text-zinc-400 font-mono text-sm">
                <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
                <span>{progress.toFixed(0)}%</span>
              </div>
            </div>

            <div className="w-64 h-1 bg-zinc-900 rounded-full overflow-hidden mt-4 relative">
              <motion.div 
                className="absolute inset-y-0 left-0 bg-gradient-to-r from-cyan-400 to-blue-500"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.2 }}
              />
            </div>
            
            <p className="text-zinc-600 text-xs font-mono max-w-xs text-center mt-8">
              Constructing virtual environments... Preparing ingredients...
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
