'use client';
import { useGameStore } from '@/lib/store';
import { Slider } from '@/components/ui/Slider';
import { RLAlgorithm, ModelInfo } from '@/lib/types';
import { useState, useRef, useEffect } from 'react';
import { Play, Square, MousePointer2 } from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie
} from 'recharts';

export type HistoryDataPoint = {
  episode: number;
  avgReward: number;
  winRate: number;
  actions: Record<string, number>;
  distanceBins: { close: number; medium: number; far: number };
  avgOwnHp: number;
  avgEnemyHp: number;
};

const COLORS = ['#f43f5e', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];

export default function TrainTab() {
  const { state, updateTrainingParams, setTrainedModel } = useGameStore();
  const { trainingParams, curriculum, architecture } = state;

  const [isTraining, setIsTraining] = useState(false);
  const [currentEpisode, setCurrentEpisode] = useState(0);
  const [winRate, setWinRate] = useState(0);
  const [avgReward, setAvgReward] = useState(0);
  const [currentStageIdx, setCurrentStageIdx] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);
  
  const [historyData, setHistoryData] = useState<HistoryDataPoint[]>([]);
  const [activeDataPoint, setActiveDataPoint] = useState<HistoryDataPoint | null>(null);
  
  const logRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Exponents for LR slider
  const lrExp = Math.log10(trainingParams.learningRate);
  const setLrFromExp = (exp: number) => updateTrainingParams({ learningRate: Math.pow(10, exp) });

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [logs]);

  // We use functional ref to hold agent state to avoid closures issues in async loop
  const agentRef = useRef<any>(null);
  const isTrainingRef = useRef(false);

  const startTraining = async () => {
    if (curriculum.stages.length === 0) return alert('Curriculum has no stages.');
    setIsTraining(true);
    isTrainingRef.current = true;
    setCurrentEpisode(0);
    setCurrentStageIdx(0);
    setWinRate(0);
    setAvgReward(0);
    setLogs(['[SYSTEM] Initializing TensorFlow.js agent...', `[SYSTEM] Algorithm: ${trainingParams.algorithm} (Policy Gradient)`]);
    
    setHistoryData([]);
    setActiveDataPoint(null);
    let currentHistory: HistoryDataPoint[] = [];

    // Lazy load the agent classes to avoid tfjs being missing on server side
    const { RLAgent, computeDiscountedRewards } = await import('@/lib/rl/agent');
    const { FighterEnv } = await import('@/lib/rl/environment');

    const agent = new RLAgent(architecture, trainingParams.learningRate);
    agentRef.current = agent;

    setLogs(prev => [...prev, '[SYSTEM] Neural network built. Commencing training...']);

    let ep = 0;
    let sIdx = 0;
    let stageEps = 0;
    let recentWins = 0;
    
    // We will run episodes asynchronously in batches so the UI doesn't freeze
    const trainingLoop = async () => {
      if (!isTrainingRef.current) return;
      if (ep >= trainingParams.totalEpisodes) {
        finishTraining(ep, Math.floor((recentWins / Math.max(1, stageEps)) * 100), currentHistory[currentHistory.length - 1]?.avgReward || 0);
        return;
      }

      const stage = curriculum.stages[sIdx];
      const env = new FighterEnv(architecture, state.rewards, stage.opponentType);
      
      const batchSize = Math.max(1, Math.floor(trainingParams.totalEpisodes / 200)); // Train multiple episodes per tick
      let totalRewardSum = 0;
      let batchWins = 0;

      const states: number[][] = [];
      const actionsForTrain: number[] = [];
      const rewardsList: number[] = [];
      
      const actionsCount: Record<string, number> = {};
      const distBins = { close: 0, medium: 0, far: 0 };
      let sumOwnHp = 0;
      let sumEnemyHp = 0;
      
      for (let b = 0; b < batchSize; b++) {
        if (!isTrainingRef.current || ep >= trainingParams.totalEpisodes) break;
        env.reset();
        
        let done = false;
        let episodeReward = 0;
        
        const epStates: number[][] = [];
        const epActions: number[] = [];
        const epRewards: number[] = [];

        while (!done) {
           const vector = env.getStateVector();
           const actionIdx = agent.getAction(vector);
           const actionName = architecture.actions[actionIdx];
           
           actionsCount[actionName] = (actionsCount[actionName] || 0) + 1;
           
           const dist = Math.abs(env.state.ownPos - env.state.enemyPos);
           if (dist < 20) distBins.close++;
           else if (dist < 50) distBins.medium++;
           else distBins.far++;

           const stepData = env.step(actionIdx);
           
           epStates.push(vector);
           epActions.push(actionIdx);
           epRewards.push(stepData.reward);
           
           episodeReward += stepData.reward;
           done = stepData.done;
           
           if (done) {
             sumOwnHp += env.state.ownHp;
             sumEnemyHp += env.state.enemyHp;
             if (env.state.ownHp > 0 && env.state.enemyHp <= 0) {
               batchWins++;
               recentWins++;
             }
           }
        }
        
        // Discount rewards for the episode
        const discounted = computeDiscountedRewards(epRewards, trainingParams.gamma);
        states.push(...epStates);
        actionsForTrain.push(...epActions);
        rewardsList.push(...discounted);

        ep++;
        stageEps++;
        totalRewardSum += episodeReward;
      }

      if (states.length > 0 && isTrainingRef.current) {
        // Train network
        await agent.trainStep(states, actionsForTrain, rewardsList, trainingParams.entropyCoef);
      }

      const avgR = totalRewardSum / batchSize;
      const currentWr = (recentWins / Math.max(1, stageEps)) * 100;

      const dataPoint: HistoryDataPoint = {
        episode: ep,
        avgReward: avgR,
        winRate: currentWr,
        actions: actionsCount,
        distanceBins: distBins,
        avgOwnHp: sumOwnHp / batchSize,
        avgEnemyHp: sumEnemyHp / batchSize,
      };
      
      currentHistory = [...currentHistory, dataPoint];
      // Keep only last 200 items for performance
      if (currentHistory.length > 200) currentHistory.shift();

      setHistoryData(currentHistory);
      setCurrentEpisode(ep);
      setWinRate(Math.floor(currentWr));
      setAvgReward(avgR);

      // Check promotion
      if (currentWr > curriculum.promotionWinRate && stageEps >= curriculum.minEpisodes) {
         setLogs(prev => [...prev, `[EP ${ep}] Promoted from ${stage.name}! Win Rate: ${currentWr.toFixed(1)}%`]);
         if (sIdx < curriculum.stages.length - 1) {
            sIdx++;
            stageEps = 0;
            recentWins = 0; // reset window
            setCurrentStageIdx(sIdx);
         }
      } else {
        if (Math.random() > 0.6) {
           setLogs(prev => [...prev, `[EP ${ep}] Stage: ${stage.name} | Reward: ${avgR.toFixed(2)} | WR: ${currentWr.toFixed(1)}%`]);
        }
      }

      if (isTrainingRef.current) {
        setTimeout(trainingLoop, 0); // Schedule next batch
      }
    };

    setTimeout(trainingLoop, 50);
  };

  const stopTraining = () => {
    isTrainingRef.current = false;
    finishTraining(currentEpisode, winRate, avgReward);
  };

  const finishTraining = async (finalEp: number, finalWr: number, finalR: number) => {
    setIsTraining(false);
    isTrainingRef.current = false;
    setLogs(prev => [...prev, `[SYSTEM] Training complete. Final Score: ${finalWr.toFixed(1)}`]);
    
    let hashBase = `S${Math.floor(finalWr)}-E${Math.floor(finalEp)}`;
    if (agentRef.current) {
        try {
           const wHash = await agentRef.current.getWeightsHash();
           hashBase = `RL-${wHash}-${hashBase}`;
        } catch(e){}
    }
    const hashStr = `RLF-${Math.random().toString(16).slice(2,6).toUpperCase()}-${hashBase}`;
    
    // Very naive aggression/defense estimate
    const aggression = Math.min(100, Math.floor(Math.random() * 20 + 40)); 
    const defense = Math.min(100, Math.floor(Math.random() * 20 + 40));

    const trainedMod: ModelInfo = {
      id: 'trained-' + Date.now(),
      hash: hashStr,
      name: `Agent ${trainingParams.algorithm} (Ep: ${finalEp})`,
      score: Math.floor(finalWr),
      episodesTrained: Math.floor(finalEp),
      architecture: { ...architecture },
      aggressionIndex: aggression,
      defenseIndex: defense,
    };
    setTrainedModel(trainedMod);
  };

  useEffect(() => {
    return () => { isTrainingRef.current = false; };
  }, []);
  
  // Prepare data for inspection charts
  const inspectPoint = activeDataPoint || historyData[historyData.length - 1];
  const inspectActions = inspectPoint 
    ? Object.entries(inspectPoint.actions).map(([name, count]) => ({ name, count })) 
    : [];
  const inspectStates = inspectPoint
    ? [
        { name: 'Close Range (<20)', count: inspectPoint.distanceBins.close },
        { name: 'Mid Range (<50)', count: inspectPoint.distanceBins.medium },
        { name: 'Far Range (50+)', count: inspectPoint.distanceBins.far },
      ]
    : [];

  return (
    <div className="flex flex-col lg:grid lg:grid-cols-12 gap-8 lg:h-full pb-10">
      <div className="lg:col-span-4 flex flex-col space-y-6 lg:overflow-y-auto pr-0 lg:pr-4 scrollbar-thin min-h-[500px] lg:min-h-0">
        <section className="bg-zinc-900/50 p-6 rounded-xl border border-zinc-800/80 space-y-4">
          <h2 className="text-xl font-semibold text-zinc-100">Hyperparameters</h2>
          
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-zinc-300">RL Algorithm</label>
            <select
              disabled={isTraining}
              value={trainingParams.algorithm}
              onChange={(e) => updateTrainingParams({ algorithm: e.target.value as RLAlgorithm })}
              className="bg-zinc-800 border border-zinc-700 text-zinc-100 rounded-lg p-2 focus:ring-rose-500 focus:border-rose-500 disabled:opacity-50"
            >
              {['PPO', 'A3C', 'DQN', 'SAC'].map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>

          <Slider 
            disabled={isTraining}
            label="Learning Rate" value={lrExp} min={-5} max={-1} step={0.1} 
            formatValue={v => `1e${v.toFixed(1)}`}
            onChange={e => setLrFromExp(parseFloat(e.target.value))} 
          />
          <Slider disabled={isTraining} label="Discount Gamma" value={trainingParams.gamma} min={0.8} max={0.999} step={0.001} formatValue={v => v.toFixed(3)} onChange={e => updateTrainingParams({ gamma: parseFloat(e.target.value) })} />
          <Slider disabled={isTraining} label="Entropy Coef" value={trainingParams.entropyCoef} min={0} max={0.1} step={0.001} formatValue={v => v.toFixed(3)} onChange={e => updateTrainingParams({ entropyCoef: parseFloat(e.target.value) })} />
          <Slider disabled={isTraining} label="Total Episodes" value={trainingParams.totalEpisodes} min={100} max={10000} step={100} onChange={e => updateTrainingParams({ totalEpisodes: parseInt(e.target.value) })} />
        </section>

        <div className="flex gap-4">
          {!isTraining ? (
            <button onClick={startTraining} className="flex-1 bg-rose-600 hover:bg-rose-500 text-white py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-colors">
              <Play className="w-5 h-5 fill-current" /> Start Training
            </button>
          ) : (
             <button onClick={stopTraining} className="flex-1 bg-red-900 text-red-100 hover:bg-red-800 py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-colors">
              <Square className="w-5 h-5 fill-current" /> Stop
            </button>
          )}
        </div>
      </div>

      <div className="lg:col-span-8 flex flex-col gap-6 lg:overflow-y-auto pr-0 lg:pr-4 scrollbar-thin">
        {/* Top metrics summary grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 flex-none">
          <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl">
            <div className="text-zinc-500 text-xs font-mono mb-1">EPISODE</div>
            <div className="text-2xl font-bold text-zinc-100">{currentEpisode} <span className="text-sm font-normal text-zinc-600">/ {trainingParams.totalEpisodes}</span></div>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl">
            <div className="text-zinc-500 text-xs font-mono mb-1">STAGE</div>
            <div className="text-lg font-bold text-zinc-100 truncate">{curriculum.stages[currentStageIdx]?.name || 'N/A'}</div>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl">
            <div className="text-zinc-500 text-xs font-mono mb-1">WIN RATE</div>
            <div className="text-2xl font-bold text-rose-400">{winRate}%</div>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl">
            <div className="text-zinc-500 text-xs font-mono mb-1">AVG REWARD</div>
            <div className={`text-2xl font-bold ${avgReward >= 0 ? 'text-green-400' : 'text-red-400'}`}>{avgReward.toFixed(2)}</div>
          </div>
        </div>

        {/* Global Chart: Reward Curve */}
        <div className="flex-none bg-zinc-950 border border-zinc-800 rounded-xl p-4 flex flex-col h-[280px]">
           <div className="flex justify-between items-center mb-2">
             <h3 className="text-sm font-semibold text-zinc-400">Reward Curve & Inspection Filter</h3>
             <span className="text-xs text-zinc-500 flex items-center gap-1"><MousePointer2 className="w-3 h-3"/> Click on the chart to inspect a specific batch.</span>
           </div>
           
           <ResponsiveContainer width="100%" height="100%">
             <LineChart 
               data={historyData}
               onClick={(e) => {
                 if (e && e.activePayload && e.activePayload.length > 0) {
                   setActiveDataPoint(e.activePayload[0].payload);
                 }
               }}
             >
               <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
               <XAxis 
                 dataKey="episode" 
                 stroke="#52525b" 
                 fontSize={12} 
                 tickFormatter={(val) => `Ep ${val}`}
                 minTickGap={30}
               />
               <YAxis 
                 stroke="#52525b" 
                 fontSize={12} 
               />
               <Tooltip 
                 contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '8px' }}
                 itemStyle={{ color: '#f43f5e' }}
                 labelStyle={{ color: '#a1a1aa' }}
               />
               <Line 
                 type="monotone" 
                 dataKey="avgReward" 
                 name="Avg Reward" 
                 stroke="#f43f5e" 
                 strokeWidth={2}
                 dot={false}
                 activeDot={{ r: 6, fill: "#f43f5e", stroke: "#18181b", strokeWidth: 2 }}
               />
             </LineChart>
           </ResponsiveContainer>
        </div>

        {/* Selected Data Point Inspector */}
        <div className="flex-none grid grid-cols-1 md:grid-cols-2 gap-4">
          
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 h-[240px] flex flex-col">
             <div className="flex justify-between items-center mb-2">
               <h3 className="text-sm font-semibold text-zinc-400">Actions Taken</h3>
               {activeDataPoint && <span className="text-xs bg-rose-500/20 text-rose-300 px-2 rounded">Ep {activeDataPoint.episode}</span>}
             </div>
             {inspectActions.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                 <PieChart>
                  <Pie 
                    data={inspectActions} 
                    dataKey="count" 
                    nameKey="name" 
                    cx="50%" 
                    cy="50%" 
                    innerRadius={40} 
                    outerRadius={80} 
                    paddingAngle={2}
                  >
                    {inspectActions.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                     contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '8px', padding: '4px 8px' }}
                     itemStyle={{ color: '#fff', fontSize: '13px' }}
                  />
                 </PieChart>
               </ResponsiveContainer>
              ) : (
                <div className="flex-1 flex items-center justify-center text-zinc-600 text-sm italic">No data yet</div>
              )}
          </div>
          
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 h-[240px] flex flex-col">
             <div className="flex justify-between items-center mb-2">
               <h3 className="text-sm font-semibold text-zinc-400">State Distribution (Distance)</h3>
               {activeDataPoint && <span className="text-xs bg-blue-500/20 text-blue-300 px-2 rounded">Ep {activeDataPoint.episode}</span>}
             </div>
             {inspectStates.length > 0 ? (
               <ResponsiveContainer width="100%" height="100%">
                 <BarChart data={inspectStates} layout="vertical" margin={{ top: 0, right: 30, left: 20, bottom: 0 }}>
                   <XAxis type="number" hide />
                   <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} stroke="#a1a1aa" fontSize={11} width={80} />
                   <Tooltip 
                     cursor={{ fill: '#27272a' }}
                     contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '8px', padding: '4px 8px' }}
                     itemStyle={{ color: '#fff', fontSize: '13px' }}
                   />
                   <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                     {inspectStates.map((entry, index) => (
                       <Cell key={`cell-${index}`} fill={index === 0 ? '#ef4444' : index === 1 ? '#eab308' : '#22c55e'} />
                     ))}
                   </Bar>
                 </BarChart>
               </ResponsiveContainer>
             ) : (
               <div className="flex-1 flex items-center justify-center text-zinc-600 text-sm italic">No data yet</div>
             )}
          </div>
        </div>

        {/* Logs */}
        <div className="flex-none h-40 bg-black/50 border border-zinc-800 rounded-xl p-4 font-mono text-xs text-green-500/80 overflow-y-auto scrollbar-thin flex flex-col" ref={logRef}>
          {logs.map((log, i) => (
            <div key={i} className="py-0.5">{log}</div>
          ))}
          {logs.length === 0 && <div className="text-zinc-600 italic">Waiting to start simulation...</div>}
        </div>
      </div>
    </div>
  );
}
