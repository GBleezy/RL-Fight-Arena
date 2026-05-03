'use client';
import { useGameStore } from '@/lib/store';
import { useState, useRef, useEffect } from 'react';
import { ModelInfo } from '@/lib/types';
import { Swords, RefreshCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function BattleTab() {
  const { state } = useGameStore();
  const { modelLibrary } = state;

  const [fAId, setFAId] = useState<string>(modelLibrary[0]?.id || '');
  const [fBId, setFBId] = useState<string>(modelLibrary[1]?.id || '');

  const fA = modelLibrary.find(m => m.id === fAId);
  const fB = modelLibrary.find(m => m.id === fBId);

  const [isRunning, setIsRunning] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [winner, setWinner] = useState<string | null>(null);
  
  const [hpA, setHpA] = useState(100);
  const [hpB, setHpB] = useState(100);
  const [posA, setPosA] = useState(25); // percentage 0-100
  const [posB, setPosB] = useState(75);

  const ROUND_LENGTH = 180; // 180 ticks at 200ms = 36 seconds real-time = "3:00" scaled
  const [currentTime, setCurrentTime] = useState(ROUND_LENGTH);
  const currentTimeRef = useRef(ROUND_LENGTH);
  
  // Sync ref with state so interval closure can access it
  useEffect(() => {
    currentTimeRef.current = currentTime;
  }, [currentTime]);

  const [logs, setLogs] = useState<string[]>([]);
  const logRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const resetMatch = () => {
    setHpA(100);
    setHpB(100);
    setPosA(25);
    setPosB(75);
    setCurrentTime(ROUND_LENGTH);
    setLogs([]);
    setIsFinished(false);
    setWinner(null);
  };


  const startFight = () => {
    if (!fA || !fB) return;
    resetMatch();
    setIsRunning(true);
    setLogs([`>>> MATCH START: ${fA.name} vs ${fB.name} <<<`]);

    const sA = 0.2 + (fA.score / 100) * 0.72;
    const sB = 0.2 + (fB.score / 100) * 0.72;

    let currentHpA = 100;
    let currentHpB = 100;
    let currPosA = 25;
    let currPosB = 75;

    intervalRef.current = setInterval(() => {
       // Time / Round tracking
       setCurrentTime((prev) => {
         const newTime = prev - 1;
         
         if (newTime <= 0) {
           clearInterval(intervalRef.current!);
           setIsRunning(false);
           setIsFinished(true);
           
           if (currentHpA === currentHpB) {
             setWinner('Draw');
             setLogs(prevLogs => [...prevLogs, `[0:00] >>> TIME UP! DRAW! <<<`]);
           } else if (currentHpA > currentHpB) {
             setWinner(fA.name);
             setLogs(prevLogs => [...prevLogs, `[0:00] >>> TIME UP! ${fA.name.toUpperCase()} WINS BY DECISION! <<<`]);
           } else {
             setWinner(fB.name);
             setLogs(prevLogs => [...prevLogs, `[0:00] >>> TIME UP! ${fB.name.toUpperCase()} WINS BY DECISION! <<<`]);
           }
         }
         return newTime;
       });

       // Format current time for logs
       const logTime = Math.max(0, currentTimeRef.current - 1);
       const m = Math.floor(logTime / 60);
       const s = (logTime % 60).toString().padStart(2, '0');
       const timeStr = `${m}:${s}`;

       // Movement
       // Use aggression index to bias forward movement, defense to bias backward
       const moveA = (Math.random() * 5) * (fA.aggressionIndex / 50) * (Math.random() > 0.3 ? 1 : -1);
       const moveB = (Math.random() * 5) * (fB.aggressionIndex / 50) * (Math.random() > 0.3 ? -1 : 1);
       
       currPosA += moveA;
       currPosB += moveB;
       
       // boundary enforce
       currPosA = Math.max(5, Math.min(currPosA, currPosB - 5));
       currPosB = Math.max(currPosA + 5, Math.min(currPosB, 95));
       
       setPosA(currPosA);
       setPosB(currPosB);

       // Combat roll
       // Modified by aggression and defense internally
       const attackA = Math.random() * sA * (1 + fA.aggressionIndex / 100);
       const defenseA = Math.random() * sA * (1 + fA.defenseIndex / 100);
       
       const attackB = Math.random() * sB * (1 + fB.aggressionIndex / 100);
       const defenseB = Math.random() * sB * (1 + fB.defenseIndex / 100);

       // Closer distance increases engagement chance
       const dist = currPosB - currPosA;
       const engageChance = Math.max(0, 1 - (dist / 100)) * 2.0;

       if (Math.random() < engageChance) {
         if (attackA > defenseB + 0.1) {
           const dmg = Math.floor((attackA - defenseB) * 15) + 5;
           currentHpB -= dmg;
           setLogs(prev => [...prev, `[${timeStr}] [Blue] ${fA.name} strikes for ${dmg} DMG!`]);
         } else if (attackB > defenseA + 0.1) {
           const dmg = Math.floor((attackB - defenseA) * 15) + 5;
           currentHpA -= dmg;
           setLogs(prev => [...prev, `[${timeStr}] [Red] ${fB.name} counters for ${dmg} DMG!`]);
         } else {
           if (Math.random() > 0.7) {
             setLogs(prev => [...prev, `[${timeStr}] * Clash! Attacks cancel out. *`]);
           } else if (Math.random() > 0.8) {
             setLogs(prev => [...prev, `[${timeStr}] * ${fA.name} dodges! *`]);
           }
         }
       }

       setHpA(Math.max(0, currentHpA));
       setHpB(Math.max(0, currentHpB));

       if (currentHpA <= 0 || currentHpB <= 0) {
         clearInterval(intervalRef.current!);
         setIsRunning(false);
         setIsFinished(true);
         if (currentHpA <= 0 && currentHpB <= 0) {
           setWinner('Draw');
           setLogs(prev => [...prev, `[${timeStr}] >>> DOUBLE KO! DRAW! <<<`]);
         } else if (currentHpA <= 0) {
           setWinner(fB.name);
           setLogs(prev => [...prev, `[${timeStr}] >>> ${fB.name.toUpperCase()} WINS BY KO! <<<`]);
         } else {
           setWinner(fA.name);
           setLogs(prev => [...prev, `[${timeStr}] >>> ${fA.name.toUpperCase()} WINS BY KO! <<<`]);
         }
       }

    }, 200);
  };

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [logs]);

  useEffect(() => {
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, []);

  return (
    <div className="flex flex-col h-full gap-6 pb-10">
       <div className="flex justify-between items-center bg-zinc-900 border border-zinc-800 p-4 rounded-xl shrink-0">
          <div className="flex gap-4">
             <select disabled={isRunning} value={fAId} onChange={e => setFAId(e.target.value)} className="bg-zinc-800 text-blue-400 p-2 rounded outline-none w-48 text-sm font-bold">
               {modelLibrary.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
             </select>
             <span className="text-zinc-600 font-bold self-center">VS</span>
             <select disabled={isRunning} value={fBId} onChange={e => setFBId(e.target.value)} className="bg-zinc-800 text-red-400 p-2 rounded outline-none w-48 text-sm font-bold text-right" dir="rtl">
               {modelLibrary.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
             </select>
          </div>
          <div className="flex items-center gap-4">
             <span className="text-xs font-bold uppercase tracking-widest text-amber-500 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">Ranked Match</span>
             {!isRunning && !isFinished && (
               <button onClick={startFight} className="bg-zinc-100 hover:bg-white text-zinc-950 px-6 py-2 rounded-lg font-bold flex items-center gap-2">
                 <Swords className="w-4 h-4" /> Fight!
               </button>
             )}
             {isFinished && (
               <button onClick={resetMatch} className="bg-zinc-800 hover:bg-zinc-700 text-zinc-100 px-6 py-2 rounded-lg font-bold flex items-center gap-2">
                  <RefreshCcw className="w-4 h-4" /> Rematch
               </button>
             )}
          </div>
       </div>

       <div className="flex-1 bg-zinc-950 rounded-xl border border-zinc-800 relative overflow-hidden flex flex-col">
          {/* Time Display */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 z-20 bg-zinc-900 border border-zinc-800 border-t-0 px-4 py-1 rounded-b-lg shadow-lg font-mono text-xl font-bold text-zinc-100 flex items-center justify-center min-w-[80px]">
            {Math.floor(currentTime / 60)}:{(currentTime % 60).toString().padStart(2, '0')}
          </div>

          {/* HP Bars */}
          <div className="flex justify-between items-center p-4 gap-8 absolute top-0 left-0 right-0 z-10 w-full glass pt-6">
             <div className="flex-1 space-y-1">
               <div className="flex justify-between text-xs font-bold">
                 <span className="text-blue-400">{fA?.name || 'Blue Fighter'}</span>
                 <span className="text-zinc-400">{hpA} HP</span>
               </div>
               <div className="h-3 bg-zinc-900 rounded-sm overflow-hidden border border-zinc-800">
                 <div className="h-full bg-blue-500 transition-all duration-300 origin-left" style={{ width: `${hpA}%` }} />
               </div>
             </div>
             
             <div className="flex-1 space-y-1">
               <div className="flex justify-between text-xs font-bold">
                 <span className="text-zinc-400">{hpB} HP</span>
                 <span className="text-red-400">{fB?.name || 'Red Fighter'}</span>
               </div>
               <div className="h-3 bg-zinc-900 rounded-sm overflow-hidden border border-zinc-800 flex justify-end">
                 <div className="h-full bg-red-500 transition-all duration-300 origin-right" style={{ width: `${hpB}%` }} />
               </div>
             </div>
          </div>

          {/* Arena */}
          <div className="flex-1 relative top-16">
             <div className="absolute top-[60%] w-full border-b-2 border-zinc-800/50" />
             
             {/* Fighter A */}
             <motion.div 
               className="absolute top-[30%] w-16 h-32 bg-blue-500 border-4 border-blue-400 rounded-sm flex items-center justify-center -ml-8 shadow-[0_0_30px_rgba(59,130,246,0.3)]"
               animate={{ left: `${posA}%` }}
               transition={{ type: 'spring', stiffness: 300, damping: 30 }}
             >
                <div className="w-2 h-2 rounded-full bg-white absolute top-4 right-4" />
             </motion.div>

             {/* Fighter B */}
             <motion.div 
               className="absolute top-[30%] w-16 h-32 bg-red-500 border-4 border-red-400 rounded-sm flex items-center justify-center -ml-8 shadow-[0_0_30px_rgba(239,68,68,0.3)]"
               animate={{ left: `${posB}%` }}
               transition={{ type: 'spring', stiffness: 300, damping: 30 }}
             >
                <div className="w-2 h-2 rounded-full bg-white absolute top-4 left-4" />
             </motion.div>
          </div>

          {/* overlay */}
          <AnimatePresence>
            {isFinished && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm z-20 flex items-center justify-center"
              >
                <motion.div 
                  initial={{ scale: 0.9, y: 20 }}
                  animate={{ scale: 1, y: 0 }}
                  className="bg-zinc-900 border border-zinc-800 p-8 rounded-2xl shadow-2xl text-center max-w-sm w-full"
                >
                  <div className="text-zinc-500 font-bold uppercase tracking-widest text-sm mb-2">Match Result</div>
                  <div className={`text-4xl font-black mb-6 ${winner === 'Draw' ? 'text-zinc-300' : winner === fA?.name ? 'text-blue-400' : 'text-red-400'}`}>
                    {winner === 'Draw' ? 'DRAW' : `${winner} WINS`}
                  </div>
                  <button onClick={resetMatch} className="w-full bg-zinc-800 hover:bg-zinc-700 text-zinc-100 py-3 rounded-lg font-bold transition-colors">
                    Close
                  </button>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

       </div>

       {/* Log */}
       <div className="h-48 bg-zinc-950 border border-zinc-800 rounded-xl p-4 font-mono text-sm overflow-y-auto scrollbar-thin shrink-0" ref={logRef}>
          {logs.length === 0 && <span className="text-zinc-600">Arena is quiet... Press Fight! to begin.</span>}
          {logs.map((log, i) => (
            <div key={i} className={`py-0.5 ${log.includes('[Blue]') ? 'text-blue-400' : log.includes('[Red]') ? 'text-red-400' : 'text-zinc-400 font-bold'}`}>
              {log}
            </div>
          ))}
       </div>
    </div>
  );
}
