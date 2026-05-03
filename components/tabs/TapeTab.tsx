'use client';
import { useGameStore } from '@/lib/store';
import { ModelInfo } from '@/lib/types';
import { useState, useMemo } from 'react';
import { Slider } from '@/components/ui/Slider';
import { Swords } from 'lucide-react';

const StatRow = ({ label, valA, valB, max }: { label: string, valA: number, valB: number, max: number }) => (
  <div className="flex items-center gap-4 text-sm font-mono my-2">
    <div className="flex-1 flex justify-end">
      <div className="h-4 bg-blue-500 rounded-s-full transition-all" style={{ width: `${Math.min(100, (valA/max)*100)}%` }} />
    </div>
    <div className="w-24 text-center text-zinc-400 font-bold whitespace-nowrap space-x-2">
      <span className="text-blue-400">{valA}</span>
      <span className="text-zinc-600">|</span> 
      <span className="text-red-400">{valB}</span>
    </div>
    <div className="flex-1">
      <div className="h-4 bg-red-500 rounded-e-full transition-all" style={{ width: `${Math.min(100, (valB/max)*100)}%` }} />
    </div>
  </div>
);

export default function TapeTab({ onStartRanked }: { onStartRanked: () => void }) {
  const { state } = useGameStore();
  const { modelLibrary } = state;

  const [fighterAId, setFighterAId] = useState<string>(modelLibrary[0]?.id || '');
  const [fighterBId, setFighterBId] = useState<string>(modelLibrary[1]?.id || '');

  const fA = modelLibrary.find(m => m.id === fighterAId);
  const fB = modelLibrary.find(m => m.id === fighterBId);

  // Live probe vars
  const [probeOwnHp, setProbeOwnHp] = useState(100);
  const [probeEnemyHp, setProbeEnemyHp] = useState(100);
  const [probeDist, setProbeDist] = useState(50);
  const [probeStamina, setProbeStamina] = useState(100);

  // Fake policy prob generator based on model stats and probe
  const computePolicy = (model: ModelInfo | undefined) => {
    if (!model) return { attack: 0, block: 0, move: 0 };
    
    // Aggression pushes attack up, defense pushes block up
    const aggBase = model.aggressionIndex / 100;
    const defBase = model.defenseIndex / 100;
    
    // Low own HP increases block
    const hpFactor = (100 - probeOwnHp) / 100;
    // High enemy HP might reduce reckless attack unless super aggressive
    
    let pAttack = aggBase * (probeStamina / 100) + (probeEnemyHp < 30 ? 0.4 : 0);
    let pBlock = defBase + hpFactor * 0.5;
    let pMove = 0.5 + (probeDist - 50)/100;

    const sum = pAttack + pBlock + pMove;
    return {
      attack: (pAttack / sum) * 100,
      block: (pBlock / sum) * 100,
      move: (pMove / sum) * 100
    };
  };

  const polA = computePolicy(fA);
  const polB = computePolicy(fB);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-full overflow-y-auto pb-10 pr-4 scrollbar-thin">
      
      {/* Top Banner / Selection */}
      <div className="lg:col-span-12 flex flex-col md:flex-row items-stretch gap-6 bg-zinc-900 border border-zinc-800 p-6 rounded-xl relative overflow-hidden">
        <div className="flex-1 space-y-2 z-10">
          <div className="text-blue-400 font-bold uppercase tracking-widest text-xs">Blue Corner</div>
          <select value={fighterAId} onChange={e => setFighterAId(e.target.value)} className="w-full bg-blue-950/50 border border-blue-900 text-blue-100 p-3 rounded-lg text-lg font-semibold focus:ring-blue-500 outline-none">
            {modelLibrary.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
        </div>
        
        <div className="flex items-center justify-center z-10 px-4">
          <div className="w-12 h-12 rounded-full bg-zinc-950 border border-zinc-800 flex items-center justify-center text-zinc-500 font-bold italic">VS</div>
        </div>

        <div className="flex-1 space-y-2 z-10 text-right">
          <div className="text-red-400 font-bold uppercase tracking-widest text-xs">Red Corner</div>
          <select value={fighterBId} onChange={e => setFighterBId(e.target.value)} className="w-full bg-red-950/50 border border-red-900 text-red-100 p-3 rounded-lg text-lg font-semibold focus:ring-red-500 outline-none text-right">
            {modelLibrary.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
        </div>
      </div>

      {fA && fB ? (
        <>
          <div className="lg:col-span-6 space-y-6">
            <div className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-xl">
              <h3 className="text-center font-bold text-zinc-100 mb-6 tracking-widest uppercase text-sm border-b border-zinc-800 pb-4">Tale of the Tape</h3>
              <StatRow label="Score" valA={fA.score} valB={fB.score} max={100} />
              <div className="text-center text-[10px] text-zinc-600 font-mono tracking-widest uppercase mt-[-4px] mb-2">Overall Score</div>
              
              <StatRow label="Episodes" valA={fA.episodesTrained} valB={fB.episodesTrained} max={5000} />
              <div className="text-center text-[10px] text-zinc-600 font-mono tracking-widest uppercase mt-[-4px] mb-2">Training Episodes</div>
              
              <StatRow label="Hidden Layers" valA={fA.architecture.hiddenLayers} valB={fB.architecture.hiddenLayers} max={6} />
              <div className="text-center text-[10px] text-zinc-600 font-mono tracking-widest uppercase mt-[-4px] mb-2">Architecture Depth</div>

              <StatRow label="Aggression" valA={fA.aggressionIndex} valB={fB.aggressionIndex} max={100} />
              <div className="text-center text-[10px] text-zinc-600 font-mono tracking-widest uppercase mt-[-4px] mb-2">Aggression Index</div>

              <StatRow label="Defense" valA={fA.defenseIndex} valB={fB.defenseIndex} max={100} />
              <div className="text-center text-[10px] text-zinc-600 font-mono tracking-widest uppercase mt-[-4px] mb-2">Defense Index</div>
            </div>

            <button onClick={onStartRanked} className="w-full bg-zinc-100 hover:bg-white text-zinc-950 py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-transform hover:scale-105 active:scale-95 shadow-xl shadow-zinc-100/10">
               <Swords className="w-6 h-6" /> Start Ranked Match
            </button>
          </div>

          <div className="lg:col-span-6 space-y-6">
             <div className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-xl h-full flex flex-col">
               <h3 className="font-bold text-zinc-100 mb-6 tracking-widest uppercase text-sm border-b border-zinc-800 pb-4">Live Policy Probe</h3>
               
               <div className="grid grid-cols-2 gap-4 mb-8">
                 <Slider label="Own HP" value={probeOwnHp} min={0} max={100} onChange={e => setProbeOwnHp(parseInt(e.target.value))} />
                 <Slider label="Enemy HP" value={probeEnemyHp} min={0} max={100} onChange={e => setProbeEnemyHp(parseInt(e.target.value))} />
                 <Slider label="Distance" value={probeDist} min={0} max={100} onChange={e => setProbeDist(parseInt(e.target.value))} />
                 <Slider label="Stamina" value={probeStamina} min={0} max={100} onChange={e => setProbeStamina(parseInt(e.target.value))} />
               </div>

               <div className="flex-1 space-y-6">
                  <div className="space-y-2">
                    <div className="text-xs text-blue-400 font-bold uppercase flex justify-between">
                      [{fA.name}] outputs
                      <span className="text-zinc-500">Val: {(polA.attack*0.5 + polA.block*0.2).toFixed(2)} | Ent: {((polA.attack % 5)*0.01 + 0.05).toFixed(3)}</span>
                    </div>
                    <div className="flex h-6 rounded-md overflow-hidden font-mono text-[10px] font-bold text-zinc-950 text-center leading-6">
                      <div className="bg-rose-500 transition-all" style={{width: `${polA.attack}%`}}>ATK {(polA.attack).toFixed(0)}</div>
                      <div className="bg-indigo-500 transition-all" style={{width: `${polA.block}%`}}>BLK {(polA.block).toFixed(0)}</div>
                      <div className="bg-zinc-400 transition-all" style={{width: `${polA.move}%`}}>MOV {(polA.move).toFixed(0)}</div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="text-xs text-red-400 font-bold uppercase flex justify-between">
                      [{fB.name}] outputs
                      <span className="text-zinc-500">Val: {(polB.attack*0.5 + polB.block*0.2).toFixed(2)} | Ent: {((polB.attack % 5)*0.01 + 0.05).toFixed(3)}</span>
                    </div>
                    <div className="flex h-6 rounded-md overflow-hidden font-mono text-[10px] font-bold text-zinc-950 text-center leading-6">
                      <div className="bg-rose-500 transition-all" style={{width: `${polB.attack}%`}}>ATK {(polB.attack).toFixed(0)}</div>
                      <div className="bg-indigo-500 transition-all" style={{width: `${polB.block}%`}}>BLK {(polB.block).toFixed(0)}</div>
                      <div className="bg-zinc-400 transition-all" style={{width: `${polB.move}%`}}>MOV {(polB.move).toFixed(0)}</div>
                    </div>
                  </div>
               </div>

               <div className="mt-8 pt-4 border-t border-zinc-800/80">
                  <button className="text-zinc-500 hover:text-zinc-300 text-sm font-medium transition-colors">✨ Ask AI for Analysis</button>
               </div>
             </div>
          </div>
        </>
      ) : (
        <div className="lg:col-span-12 text-center text-zinc-500 py-12">Select two fighters to compare</div>
      )}
    </div>
  );
}
