'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Network, Target, Trophy, BrainCircuit, Swords, GitCompare, Download, ScrollText } from 'lucide-react';
import DesignTab from '@/components/tabs/DesignTab';
import RewardTab from '@/components/tabs/RewardTab';
import CurriculumTab from '@/components/tabs/CurriculumTab';
import TrainTab from '@/components/tabs/TrainTab';
import TapeTab from '@/components/tabs/TapeTab';
import BattleTab from '@/components/tabs/BattleTab';
import TournamentTab from '@/components/tabs/TournamentTab';
import ExportImportTab from '@/components/tabs/ExportImportTab';

type TabId = 'design' | 'reward' | 'curriculum' | 'train' | 'tape' | 'battle' | 'tournament' | 'export';

const TABS = [
  { id: 'design', label: 'Design', icon: Network },
  { id: 'reward', label: 'Reward', icon: Target },
  { id: 'curriculum', label: 'Curriculum', icon: ScrollText },
  { id: 'train', label: 'Train', icon: BrainCircuit },
  { id: 'tape', label: 'Tale of Tape', icon: GitCompare },
  { id: 'battle', label: 'Battle', icon: Swords },
  { id: 'tournament', label: 'Tournament', icon: Trophy },
  { id: 'export', label: 'Export/Import', icon: Download },
] as const;

export default function Page() {
  const [activeTab, setActiveTab] = useState<TabId>('design');

  return (
    <main className="max-w-6xl mx-auto p-4 md:p-6 lg:p-8 flex flex-col h-screen">
      <header className="flex items-center justify-between mb-8 shrink-0">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-100 flex items-center gap-2">
            <Swords className="w-6 h-6 text-rose-500" />
            RL Fighter Arena
          </h1>
          <p className="text-zinc-400 text-sm mt-1">Design, train, and battle neural network fighters.</p>
        </div>
      </header>
      
      <nav className="flex space-x-1 border-b border-zinc-800 pb-px overflow-x-auto shrink-0 scrollbar-hide">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabId)}
              className={`
                relative flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors whitespace-nowrap
                ${isActive ? 'text-rose-400' : 'text-zinc-400 hover:text-zinc-200'}
              `}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
              {isActive && (
                <motion.div
                  layoutId="activeTabIndicator"
                  className="absolute bottom-0 left-0 right-0 h-[2px] bg-rose-500"
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
            </button>
          );
        })}
      </nav>

      <div className="mt-6 flex-1 relative min-h-0 overflow-y-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="min-h-full pb-12"
          >
            {activeTab === 'design' && <DesignTab />}
            {activeTab === 'reward' && <RewardTab />}
            {activeTab === 'curriculum' && <CurriculumTab />}
            {activeTab === 'train' && <TrainTab />}
            {activeTab === 'tape' && <TapeTab onStartRanked={() => setActiveTab('battle')} />}
            {activeTab === 'battle' && <BattleTab />}
            {activeTab === 'tournament' && <TournamentTab />}
            {activeTab === 'export' && <ExportImportTab />}
          </motion.div>
        </AnimatePresence>
      </div>
    </main>
  );
}
