'use client';
import { createContext, useContext, useState, ReactNode } from 'react';
import { GameState, defaultArchitecture, defaultRewards, defaultCurriculum, defaultTrainingParams, sampleModels, ModelInfo } from './types';

interface GameContextType {
  state: GameState;
  updateArchitecture: (updates: Partial<GameState['architecture']>) => void;
  updateRewards: (updates: Partial<GameState['rewards']>) => void;
  updateCurriculum: (updates: Partial<GameState['curriculum']>) => void;
  updateTrainingParams: (updates: Partial<GameState['trainingParams']>) => void;
  addModel: (model: ModelInfo) => void;
  removeModel: (id: string) => void;
  setTrainedModel: (model: ModelInfo | null) => void;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export function GameProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<GameState>({
    architecture: defaultArchitecture,
    rewards: defaultRewards,
    curriculum: defaultCurriculum,
    trainingParams: defaultTrainingParams,
    modelLibrary: sampleModels,
    trainedModel: null,
  });

  const updateArchitecture = (updates: Partial<GameState['architecture']>) => {
    setState(prev => ({ ...prev, architecture: { ...prev.architecture, ...updates } }));
  };

  const updateRewards = (updates: Partial<GameState['rewards']>) => {
    setState(prev => ({ ...prev, rewards: { ...prev.rewards, ...updates } }));
  };

  const updateCurriculum = (updates: Partial<GameState['curriculum']>) => {
    setState(prev => ({ ...prev, curriculum: { ...prev.curriculum, ...updates } }));
  };

  const updateTrainingParams = (updates: Partial<GameState['trainingParams']>) => {
    setState(prev => ({ ...prev, trainingParams: { ...prev.trainingParams, ...updates } }));
  };

  const addModel = (model: ModelInfo) => {
    setState(prev => ({ ...prev, modelLibrary: [...prev.modelLibrary, model] }));
  };

  const removeModel = (id: string) => {
    setState(prev => ({ ...prev, modelLibrary: prev.modelLibrary.filter(m => m.id !== id) }));
  };

  const setTrainedModel = (model: ModelInfo | null) => {
    setState(prev => {
      let filteredLib = prev.modelLibrary;
      if (prev.trainedModel) {
        filteredLib = filteredLib.filter(m => m.id !== prev.trainedModel!.id);
      }
      return {
        ...prev,
        trainedModel: model,
        modelLibrary: model ? [...filteredLib, model] : filteredLib,
      };
    });
  };

  return (
    <GameContext.Provider value={{
      state,
      updateArchitecture,
      updateRewards,
      updateCurriculum,
      updateTrainingParams,
      addModel,
      removeModel,
      setTrainedModel,
    }}>
      {children}
    </GameContext.Provider>
  );
}

export function useGameStore() {
  const context = useContext(GameContext);
  if (context === undefined) {
    throw new Error('useGameStore must be used within a GameProvider');
  }
  return context;
}
