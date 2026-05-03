'use client';
import { useGameStore } from '@/lib/store';
import { Slider } from '@/components/ui/Slider';
import { CurriculumStage } from '@/lib/types';
import { Plus, Trash2, CheckCircle2 } from 'lucide-react';
import { useState } from 'react';

const PRESETS: Record<string, CurriculumStage[]> = {
  Balanced: [
    { id: 'b1', name: 'Punching Bag', opponentType: 'Static', episodeBudget: 100, difficulty: 'Trivial' },
    { id: 'b2', name: 'Rookie', opponentType: 'Random', episodeBudget: 250, difficulty: 'Easy' },
    { id: 'b3', name: 'Brawler', opponentType: 'Aggressive', episodeBudget: 500, difficulty: 'Medium' }
  ],
  Aggressor: [
    { id: 'a1', name: 'Static Target', opponentType: 'Static', episodeBudget: 50, difficulty: 'Trivial' },
    { id: 'a2', name: 'Fleeing Coward', opponentType: 'Evade', episodeBudget: 300, difficulty: 'Medium' },
    { id: 'a3', name: 'Turtle', opponentType: 'Blocker', episodeBudget: 600, difficulty: 'Hard' }
  ],
  Defender: [
    { id: 'd1', name: 'Random Flailer', opponentType: 'Random', episodeBudget: 150, difficulty: 'Easy' },
    { id: 'd2', name: 'Relentless Attacker', opponentType: 'Aggressive', episodeBudget: 400, difficulty: 'Medium' },
    { id: 'd3', name: 'Sniper', opponentType: 'Precision', episodeBudget: 800, difficulty: 'Hard' }
  ]
};

const diffColors = {
  Trivial: 'bg-zinc-800 text-zinc-400',
  Easy: 'bg-green-500/20 text-green-400',
  Medium: 'bg-yellow-500/20 text-yellow-500',
  Hard: 'bg-orange-500/20 text-orange-400',
  Expert: 'bg-red-500/20 text-red-500'
};

export default function CurriculumTab() {
  const { state, updateCurriculum } = useGameStore();
  const { curriculum } = state;
  const [activePreset, setActivePreset] = useState<string>('Balanced');

  const setPreset = (presetName: string) => {
    setActivePreset(presetName);
    updateCurriculum({ stages: PRESETS[presetName] || [] });
  };

  const removeStage = (id: string) => {
    setActivePreset('Custom');
    updateCurriculum({ stages: curriculum.stages.filter(s => s.id !== id) });
  };

  const addStage = () => {
    setActivePreset('Custom');
    const newStage: CurriculumStage = {
      id: Math.random().toString(36).substring(7),
      name: 'New Stage',
      opponentType: 'Random',
      episodeBudget: 200,
      difficulty: 'Medium'
    };
    updateCurriculum({ stages: [...curriculum.stages, newStage] });
  };

  return (
    <div className="flex flex-col lg:flex-row gap-8 lg:h-full pb-10">
      <div className="flex-1 space-y-6 lg:overflow-y-auto pr-0 lg:pr-4 scrollbar-thin min-h-[400px] lg:min-h-0">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-3">
          <h2 className="text-xl font-semibold text-zinc-100">Training Stages</h2>
          <div className="flex flex-wrap gap-1 bg-zinc-900 rounded-lg p-1 border border-zinc-800">
            {['Balanced', 'Aggressor', 'Defender', 'Custom'].map(preset => (
              <button
                key={preset}
                onClick={() => setPreset(preset)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  activePreset === preset ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                {preset}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          {curriculum.stages.map((stage, index) => (
             <div key={stage.id} className="bg-zinc-900/50 border border-zinc-800/80 rounded-xl p-4 flex flex-col md:flex-row gap-4 items-start md:items-center">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-zinc-800 text-zinc-400 font-mono text-sm shrink-0">
                  {index + 1}
                </div>
                <div className="flex-1 space-y-3 w-full">
                  <div className="flex flex-wrap items-center gap-3">
                    <input 
                      value={stage.name}
                      onChange={e => {
                        setActivePreset('Custom');
                        const v = e.target.value;
                        updateCurriculum({ stages: curriculum.stages.map(s => s.id === stage.id ? { ...s, name: v } : s) });
                      }}
                      className="bg-transparent border-b border-zinc-700 focus:border-rose-500 text-zinc-100 font-medium px-1 outline-none max-w-[150px]"
                    />
                    <select
                      value={stage.opponentType}
                      onChange={e => {
                        setActivePreset('Custom');
                        updateCurriculum({ stages: curriculum.stages.map(s => s.id === stage.id ? { ...s, opponentType: e.target.value } : s) });
                      }}
                      className="bg-zinc-800 text-xs rounded border border-zinc-700 text-zinc-300 px-2 py-1 outline-none"
                    >
                      <option>Static</option>
                      <option>Random</option>
                      <option>Aggressive</option>
                      <option>Blocker</option>
                      <option>Evade</option>
                      <option>Precision</option>
                    </select>
                    <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${diffColors[stage.difficulty]}`}>
                      {stage.difficulty}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-zinc-500">
                    <span className="flex items-center gap-2">
                       Budget (Ep.): <input type="number" min={10} step={10} value={stage.episodeBudget} onChange={(e) => {
                         setActivePreset('Custom');
                         const v = Number(e.target.value);
                         updateCurriculum({ stages: curriculum.stages.map(s => s.id === stage.id ? { ...s, episodeBudget: v } : s) });
                       }} className="w-16 bg-zinc-800 border border-zinc-700 px-1 py-0.5 rounded" />
                    </span>
                  </div>
                </div>
                <button onClick={() => removeStage(stage.id)} className="p-2 text-zinc-600 hover:text-red-400 transition-colors">
                  <Trash2 className="w-5 h-5" />
                </button>
             </div>
          ))}
          <button onClick={addStage} className="w-full flex items-center justify-center gap-2 py-3 border border-dashed border-zinc-700 hover:border-zinc-500 rounded-xl text-zinc-500 hover:text-zinc-300 transition-colors">
            <Plus className="w-4 h-4" /> Add Stage
          </button>
        </div>
      </div>

      <div className="w-full lg:w-80 shrink-0 space-y-6">
        <div className="bg-zinc-900/50 p-6 rounded-xl border border-zinc-800/80">
           <h3 className="text-lg font-semibold text-zinc-100 mb-4">Promotion Criteria</h3>
           <div className="space-y-6">
             <Slider 
               label="Win Rate Threshold" 
               value={curriculum.promotionWinRate} min={50} max={95} step={1} 
               formatValue={v => `${v}%`} 
               onChange={e => updateCurriculum({ promotionWinRate: parseInt(e.target.value) })} 
             />
             <Slider 
               label="Min Episodes per Stage" 
               value={curriculum.minEpisodes} min={10} max={200} step={5} 
               formatValue={v => `${v}`} 
               onChange={e => updateCurriculum({ minEpisodes: parseInt(e.target.value) })} 
             />
           </div>
           <div className="mt-6 p-4 bg-zinc-950/50 rounded-lg text-xs font-mono text-zinc-400 leading-relaxed border border-zinc-900">
              Agent advances to the next stage when win rate over the last window exceeds <strong className="text-rose-400">{curriculum.promotionWinRate}%</strong>, provided it has completed at least <strong className="text-rose-400">{curriculum.minEpisodes}</strong> episodes.
           </div>
        </div>
      </div>
    </div>
  );
}
