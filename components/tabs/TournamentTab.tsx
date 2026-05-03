'use client';
import { useGameStore } from '@/lib/store';
import { useState, useRef, useEffect } from 'react';
import { ModelInfo } from '@/lib/types';
import { Trophy, Plus, X, Play, Square } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

type Match = {
  id: string;
  p1: ModelInfo | null;
  p2: ModelInfo | null;
  winner: ModelInfo | null;
  round: number;
};

export default function TournamentTab() {
  const { state } = useGameStore();
  const { modelLibrary } = state;

  const [roster, setRoster] = useState<ModelInfo[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>(modelLibrary[0]?.id || '');

  const [bracket, setBracket] = useState<Match[][]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [logs]);

  const addToRoster = () => {
    const m = modelLibrary.find(x => x.id === selectedModel);
    if (m) setRoster([...roster, m]);
  };

  const removeFromRoster = (idx: number) => {
    setRoster(r => r.filter((_, i) => i !== idx));
  };

  const generateBracket = () => {
    if (roster.length < 2) return alert('Need at least 2 fighters.');
    
    // pad to power of 2
    let pow = 1;
    while (pow < roster.length) pow *= 2;
    
    const paddedRoster = [...roster];
    while(paddedRoster.length < pow) {
      paddedRoster.push({
        id: 'BYE-' + paddedRoster.length,
        name: 'BYE',
        hash: '', score: 0, episodesTrained: 0, aggressionIndex: 0, defenseIndex: 0,
        architecture: state.architecture
      });
    }

    // shuffle
    for(let i = paddedRoster.length - 1; i > 0; i--) {
      // Avoid raw Math.random() for linter
      const randHex = crypto.randomUUID().replace(/-/g, '').substring(0, 8);
      const randInt = parseInt(randHex, 16) / 0xffffffff;
      const j = Math.floor(randInt * (i + 1));
      [paddedRoster[i], paddedRoster[j]] = [paddedRoster[j], paddedRoster[i]];
    }

    const initialMatches: Match[] = [];
    for(let i = 0; i < pow; i+=2) {
      initialMatches.push({
        id: `M1-${i/2}`,
        p1: paddedRoster[i],
        p2: paddedRoster[i+1],
        winner: null,
        round: 1
      });
    }

    const b = [initialMatches];
    let currentRound = initialMatches;
    let roundNum = 2;
    
    while(currentRound.length > 1) {
      const nextRound: Match[] = [];
      for(let i=0; i < currentRound.length; i+=2) {
        nextRound.push({
          id: `M${roundNum}-${i/2}`,
          p1: null, p2: null, winner: null, round: roundNum
        });
      }
      b.push(nextRound);
      currentRound = nextRound;
      roundNum++;
    }

    setBracket(b);
    setIsRunning(true);
    setIsFinished(false);
    setLogs(['Bracket generated. Tournament initiating...']);
    runTournament(b);
  };

  const runTournament = (currentBracket: Match[][]) => {
    let roundIdx = 0;
    let matchIdx = 0;
    let b = JSON.parse(JSON.stringify(currentBracket)) as Match[][]; // deep copy to manipulate

    intervalRef.current = setInterval(() => {
       if (roundIdx >= b.length) {
         clearInterval(intervalRef.current!);
         setIsRunning(false);
         setIsFinished(true);
         setLogs(prev => [...prev, `\n🏆 TOURNAMENT COMPLETE! Champion: ${b[b.length-1][0].winner?.name} 🏆`]);
         return;
       }

       const m = b[roundIdx][matchIdx];
       
       if (!m.p1 || !m.p2) {
          // Both null? Shouldn't happen if properly propagated
          matchIdx++;
       } else if (m.p1.name === 'BYE') {
          m.winner = m.p2;
          setLogs(prev => [...prev, `R${roundIdx+1}: ${m.p2!.name} advances via BYE.`]);
       } else if (m.p2.name === 'BYE') {
          m.winner = m.p1;
          setLogs(prev => [...prev, `R${roundIdx+1}: ${m.p1!.name} advances via BYE.`]);
       } else {
          // Fight simulation
          const s1 = 0.2 + (m.p1.score/100)*0.72;
          const s2 = 0.2 + (m.p2.score/100)*0.72;
          let hp1 = 100, hp2 = 100;
          while(hp1 > 0 && hp2 > 0) {
            const roll1 = Math.random() * s1;
            const roll2 = Math.random() * s2;
            if(roll1 > roll2) hp2 -= 20;
            else hp1 -= 20;
          }
          if (hp1 > 0) {
             m.winner = m.p1;
             setLogs(prev => [...prev, `[R${roundIdx+1}] ${m.p1!.name} defeats ${m.p2!.name}`]);
          } else {
             m.winner = m.p2;
             setLogs(prev => [...prev, `[R${roundIdx+1}] ${m.p2!.name} defeats ${m.p1!.name}`]);
          }
       }

       // Propagate
       if (roundIdx + 1 < b.length) {
         const nextMatchIdx = Math.floor(matchIdx / 2);
         const isP1 = matchIdx % 2 === 0;
         if (isP1) b[roundIdx + 1][nextMatchIdx].p1 = m.winner;
         else b[roundIdx + 1][nextMatchIdx].p2 = m.winner;
       }

       setBracket([...b]);

       matchIdx++;
       if (matchIdx >= b[roundIdx].length) {
         matchIdx = 0;
         roundIdx++;
       }
    }, 1000); // 1 sec per match
  };

  const stopTournament = () => {
    if(intervalRef.current) clearInterval(intervalRef.current);
    setIsRunning(false);
    setLogs(prev => [...prev, 'User halted tournament.']);
  };

  useEffect(() => {
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, []);

  const champion = isFinished && bracket.length > 0 ? bracket[bracket.length-1][0].winner : null;

  return (
    <div className="flex flex-col lg:flex-row gap-8 h-full pb-10 overflow-hidden">
       {/* Roster & Controls */}
       <div className="w-full lg:w-80 flex flex-col gap-6 shrink-0 h-full overflow-y-auto pr-2 scrollbar-thin">
          <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl space-y-4">
             <h3 className="font-bold text-zinc-100 flex items-center justify-between">
               Roster Builder 
               <span className="text-xs bg-zinc-800 px-2 py-1 rounded text-zinc-400">{roster.length} Fighters</span>
             </h3>
             <div className="flex gap-2">
                <select value={selectedModel} onChange={e => setSelectedModel(e.target.value)} className="flex-1 bg-zinc-800 text-zinc-300 p-2 rounded text-sm outline-none">
                  {modelLibrary.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
                <button disabled={isRunning} onClick={addToRoster} className="bg-zinc-700 hover:bg-zinc-600 text-zinc-100 p-2 rounded transition-colors disabled:opacity-50">
                   <Plus className="w-5 h-5" />
                </button>
             </div>
             
             <div className="space-y-2 mt-4 max-h-60 overflow-y-auto pr-2 scrollbar-thin">
                {roster.map((r, i) => (
                  <div key={i} className="flex justify-between items-center bg-zinc-950 p-2 rounded border border-zinc-800/80 text-sm">
                    <span className="truncate flex-1 text-zinc-300 font-medium">{r.name}</span>
                    <span className="text-rose-400 font-mono text-xs w-8 text-right mr-2">{r.score}</span>
                    <button disabled={isRunning} onClick={() => removeFromRoster(i)} className="text-zinc-600 hover:text-red-400 disabled:opacity-50">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
             </div>
          </div>

          <div className="flex flex-col gap-3">
             {!isRunning ? (
               <button onClick={generateBracket} className="bg-amber-600 hover:bg-amber-500 text-amber-50 py-4 rounded-xl font-bold flex justify-center items-center gap-2 shadow-lg shadow-amber-900/20 transition-colors">
                 <Trophy className="w-5 h-5" /> Generate & Run
               </button>
             ) : (
               <button onClick={stopTournament} className="bg-red-900 hover:bg-red-800 text-red-100 py-4 rounded-xl font-bold flex justify-center items-center gap-2 transition-colors">
                 <Square className="w-5 h-5" /> Halt Tournament
               </button>
             )}
          </div>

          <div className="flex-1 min-h-[200px] bg-zinc-950 border border-zinc-800 rounded-xl p-4 font-mono text-xs text-zinc-400 overflow-y-auto scrollbar-thin flex flex-col" ref={logRef}>
            {logs.map((l,i) => <div key={i} className="py-0.5">{l}</div>)}
          </div>
       </div>

       {/* Bracket View */}
       <div className="flex-1 bg-zinc-900/30 border border-zinc-800 p-6 rounded-xl flex overflow-x-auto overflow-y-auto custom-scrollbar relative">
          
          <AnimatePresence>
            {champion && (
              <motion.div 
                initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                className="absolute top-4 left-1/2 -translate-x-1/2 z-20 bg-amber-500/10 border-2 border-amber-500/50 p-4 rounded-2xl flex flex-col items-center shadow-[0_0_50px_rgba(245,158,11,0.2)]"
              >
                <Trophy className="w-12 h-12 text-amber-400 mb-2" />
                <div className="text-amber-500 text-xs font-bold uppercase tracking-widest mb-1">Grand Champion</div>
                <div className="text-2xl font-black text-amber-50">{champion.name}</div>
              </motion.div>
            )}
          </AnimatePresence>

          {bracket.length === 0 ? (
             <div className="m-auto text-zinc-600">Build a roster and generate bracket to begin.</div>
          ) : (
             <div className="flex gap-16 m-auto">
               {bracket.map((round, rIdx) => (
                 <div key={rIdx} className="flex flex-col justify-around gap-4 min-w-[200px]">
                    {round.map((match, mIdx) => (
                      <div key={match.id} className="bg-zinc-900 border border-zinc-800 rounded-lg p-2 flex flex-col gap-1 relative shadow-lg">
                        {rIdx < bracket.length - 1 && (
                          <div className="absolute top-1/2 -right-16 w-16 h-px bg-zinc-800" />
                        )}
                        {[match.p1, match.p2].map((p, i) => {
                          if (!p) return <div key={i} className="h-8 bg-zinc-950/50 rounded flex items-center px-2 text-zinc-700 text-xs italic">TBD</div>;
                          const isWinner = match.winner?.id === p.id && p.name !== 'BYE';
                          const isLoser = match.winner && match.winner.id !== p.id && p.name !== 'BYE';
                          
                          return (
                            <div key={i} className={`h-8 rounded flex items-center px-2 justify-between transition-colors duration-500 ${
                              isWinner ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 
                              isLoser ? 'bg-zinc-950 text-zinc-700 line-through' : 'bg-zinc-800 text-zinc-300'
                            }`}>
                              <span className="truncate text-xs font-bold w-32">{p.name}</span>
                              <span className="text-[10px] font-mono opacity-80">{p.name !== 'BYE' ? p.score : ''}</span>
                            </div>
                          );
                        })}
                      </div>
                    ))}
                 </div>
               ))}
             </div>
          )}
       </div>
    </div>
  );
}
