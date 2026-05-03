'use client';
import { useGameStore } from '@/lib/store';
import { Slider } from '@/components/ui/Slider';
import { ALL_INPUTS, ALL_ACTIONS, Activation } from '@/lib/types';
import { NetworkPreview } from './NetworkPreview';

export default function DesignTab() {
  const { state, updateArchitecture } = useGameStore();
  const { architecture } = state;

  const toggleInput = (input: string) => {
    const inputs = architecture.inputs.includes(input)
      ? architecture.inputs.filter(i => i !== input)
      : [...architecture.inputs, input];
    updateArchitecture({ inputs });
  };

  const toggleAction = (action: string) => {
    const actions = architecture.actions.includes(action)
      ? architecture.actions.filter(a => a !== action)
      : [...architecture.actions, action];
    updateArchitecture({ actions });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-full pb-10">
      <div className="space-y-8 overflow-y-auto pr-4 scrollbar-thin scrollbar-thumb-zinc-800">
        
        <section className="space-y-6 bg-zinc-900/50 p-6 rounded-xl border border-zinc-800/50">
          <h2 className="text-xl font-semibold text-zinc-100 mb-4">Topology</h2>
          <Slider
            label="Hidden Layers" value={architecture.hiddenLayers} min={1} max={4}
            onChange={(e) => updateArchitecture({ hiddenLayers: parseInt(e.target.value) })}
          />
          <Slider
            label="Neurons Per Layer" value={architecture.neuronsPerLayer} min={4} max={64} step={4}
            onChange={(e) => updateArchitecture({ neuronsPerLayer: parseInt(e.target.value) })}
          />
          <Slider
            label="Dropout Rate" value={architecture.dropoutRate} min={0} max={0.5} step={0.05}
            formatValue={(v) => v.toFixed(2)}
            onChange={(e) => updateArchitecture({ dropoutRate: parseFloat(e.target.value) })}
          />
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-zinc-300">Activation Function</label>
            <select
              value={architecture.activation}
              onChange={(e) => updateArchitecture({ activation: e.target.value as Activation })}
              className="bg-zinc-800 border border-zinc-700 text-zinc-100 rounded-lg p-2 focus:ring-rose-500 focus:border-rose-500 max-w-[200px]"
            >
              <option value="ReLU">ReLU</option>
              <option value="Tanh">Tanh</option>
              <option value="Sigmoid">Sigmoid</option>
              <option value="ELU">ELU</option>
            </select>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-zinc-100">Observation Space (Inputs)</h2>
          <div className="flex flex-wrap gap-2">
            {ALL_INPUTS.map(input => (
              <button
                key={input}
                onClick={() => toggleInput(input)}
                className={`px-3 py-1.5 rounded-full text-sm transition-colors border ${
                  architecture.inputs.includes(input)
                    ? 'bg-rose-500/20 border-rose-500/50 text-rose-300'
                    : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:bg-zinc-800'
                }`}
              >
                {input}
              </button>
            ))}
          </div>
        </section>

        <section className="space-y-4">
           <h2 className="text-lg font-semibold text-zinc-100">Action Space (Outputs)</h2>
           <div className="flex flex-wrap gap-2">
             {ALL_ACTIONS.map(action => (
                <button
                  key={action}
                  onClick={() => toggleAction(action)}
                  className={`px-3 py-1.5 rounded-full text-sm transition-colors border ${
                    architecture.actions.includes(action)
                      ? 'bg-blue-500/20 border-blue-500/50 text-blue-300'
                      : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:bg-zinc-800'
                  }`}
                >
                  {action}
                </button>
             ))}
           </div>
        </section>

      </div>

      <div className="bg-zinc-900/30 rounded-xl border border-zinc-800 relative flex items-center justify-center p-6 h-[400px] lg:h-auto overflow-hidden">
        <NetworkPreview architecture={architecture} />
      </div>
    </div>
  );
}
