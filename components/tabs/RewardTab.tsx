'use client';
import { useGameStore } from '@/lib/store';
import { Slider } from '@/components/ui/Slider';

export default function RewardTab() {
  const { state, updateRewards } = useGameStore();
  const { rewards } = state;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 h-full overflow-y-auto pb-10">
      <section className="space-y-6 bg-green-500/5 p-6 rounded-xl border border-green-500/10 h-min">
        <h2 className="text-xl font-semibold text-green-400 mb-4 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-green-500"></span>
          Positive Reinforcement
        </h2>
        <Slider label="Deal Damage" value={rewards.dealDamage} min={0} max={5} step={0.1} formatValue={v => `+${v.toFixed(1)}`} onChange={e => updateRewards({ dealDamage: parseFloat(e.target.value) })} />
        <Slider label="Win Round" value={rewards.winRound} min={0} max={50} step={1} formatValue={v => `+${v}`} onChange={e => updateRewards({ winRound: parseInt(e.target.value) })} />
        <Slider label="Successful Block" value={rewards.successfulBlock} min={0} max={2} step={0.1} formatValue={v => `+${v.toFixed(1)}`} onChange={e => updateRewards({ successfulBlock: parseFloat(e.target.value) })} />
        <Slider label="Combo Hit" value={rewards.comboHit} min={0} max={3} step={0.1} formatValue={v => `+${v.toFixed(1)}`} onChange={e => updateRewards({ comboHit: parseFloat(e.target.value) })} />
      </section>

      <section className="space-y-6 bg-red-500/5 p-6 rounded-xl border border-red-500/10 h-min">
         <h2 className="text-xl font-semibold text-red-400 mb-4 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-red-500"></span>
          Negative Reinforcement
        </h2>
        <Slider label="Take Damage" value={rewards.takeDamage} min={-5} max={0} step={0.1} formatValue={v => v.toFixed(1)} onChange={e => updateRewards({ takeDamage: parseFloat(e.target.value) })} />
        <Slider label="Lose Round" value={rewards.loseRound} min={-50} max={0} step={1} formatValue={v => `${v}`} onChange={e => updateRewards({ loseRound: parseInt(e.target.value) })} />
        <Slider label="Camping Penalty" value={rewards.campingPenalty} min={-2} max={0} step={0.1} formatValue={v => v.toFixed(1)} onChange={e => updateRewards({ campingPenalty: parseFloat(e.target.value) })} />
        <Slider label="Time Penalty (per step)" value={rewards.timePerStepPenalty} min={-0.1} max={0} step={0.01} formatValue={v => v.toFixed(2)} onChange={e => updateRewards({ timePerStepPenalty: parseFloat(e.target.value) })} />
      </section>

      <section className="space-y-6 bg-zinc-900/50 p-6 rounded-xl border border-zinc-800/50 h-min">
         <h2 className="text-xl font-semibold text-zinc-100 mb-4 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-zinc-500"></span>
          Behavioral Shaping
        </h2>
        <Slider label="Shaping Strength" value={rewards.shapingStrength} min={0} max={1} step={0.05} formatValue={v => v.toFixed(2)} onChange={e => updateRewards({ shapingStrength: parseFloat(e.target.value) })} />
        <Slider label="Corner Enemy" value={rewards.cornerEnemy} min={0} max={1} step={0.05} formatValue={v => `+${v.toFixed(2)}`} onChange={e => updateRewards({ cornerEnemy: parseFloat(e.target.value) })} />
        <Slider label="Stay Mobile" value={rewards.stayMobile} min={0} max={1} step={0.05} formatValue={v => `+${v.toFixed(2)}`} onChange={e => updateRewards({ stayMobile: parseFloat(e.target.value) })} />
        
        <div className="pt-4 border-t border-zinc-800 text-sm text-zinc-400">
          <p><strong>Note:</strong> Higher shaping strength makes learning faster but can lead to &quot;reward hacking&quot; behaviors. Zero shaping strength forces the agent to learn only from Win/Loss.</p>
        </div>
      </section>
    </div>
  );
}
