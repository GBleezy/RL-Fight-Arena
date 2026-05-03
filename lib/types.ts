export type Activation = 'ReLU' | 'Tanh' | 'Sigmoid' | 'ELU';
export type RLAlgorithm = 'PPO' | 'A3C' | 'DQN' | 'SAC';

export interface Architecture {
  hiddenLayers: number;
  neuronsPerLayer: number;
  dropoutRate: number;
  activation: Activation;
  inputs: string[];
  actions: string[];
}

export interface Rewards {
  dealDamage: number;
  takeDamage: number;
  winRound: number;
  loseRound: number;
  successfulBlock: number;
  comboHit: number;
  cornerEnemy: number;
  stayMobile: number;
  shapingStrength: number;
  campingPenalty: number;
  timePerStepPenalty: number;
}

export interface CurriculumStage {
  id: string;
  name: string;
  opponentType: string;
  episodeBudget: number;
  difficulty: 'Trivial' | 'Easy' | 'Medium' | 'Hard' | 'Expert';
}

export interface Curriculum {
  stages: CurriculumStage[];
  promotionWinRate: number;
  minEpisodes: number;
}

export interface TrainingParams {
  algorithm: RLAlgorithm;
  learningRate: number;
  gamma: number;
  entropyCoef: number;
  totalEpisodes: number;
}

export interface ModelInfo {
  id: string;
  hash: string;
  name: string;
  score: number;
  episodesTrained: number;
  architecture: Architecture;
  aggressionIndex: number;
  defenseIndex: number;
  isBuiltIn?: boolean;
}

export interface GameState {
  architecture: Architecture;
  rewards: Rewards;
  curriculum: Curriculum;
  trainingParams: TrainingParams;
  modelLibrary: ModelInfo[];
  trainedModel: ModelInfo | null;
}

export const defaultArchitecture: Architecture = {
  hiddenLayers: 2,
  neuronsPerLayer: 32,
  dropoutRate: 0.1,
  activation: 'ReLU',
  inputs: ['Own HP', 'Enemy HP', 'Distance', 'Own Pos', 'Enemy Pos', 'Stamina'],
  actions: ['Move Left', 'Move Right', 'Attack', 'Block'],
};

export const defaultRewards: Rewards = {
  dealDamage: 1.0,
  takeDamage: -1.0,
  winRound: 10.0,
  loseRound: -10.0,
  successfulBlock: 0.5,
  comboHit: 1.5,
  cornerEnemy: 0.2,
  stayMobile: 0.1,
  shapingStrength: 0.5,
  campingPenalty: -0.5,
  timePerStepPenalty: -0.01,
};

export const defaultCurriculum: Curriculum = {
  stages: [
    { id: '1', name: 'Punching Bag', opponentType: 'Static', episodeBudget: 100, difficulty: 'Trivial' },
    { id: '2', name: 'Rookie', opponentType: 'Random', episodeBudget: 250, difficulty: 'Easy' },
    { id: '3', name: 'Brawler', opponentType: 'Aggressive', episodeBudget: 500, difficulty: 'Medium' }
  ],
  promotionWinRate: 75,
  minEpisodes: 50,
};

export const defaultTrainingParams: TrainingParams = {
  algorithm: 'PPO',
  learningRate: 0.001,
  gamma: 0.99,
  entropyCoef: 0.01,
  totalEpisodes: 1000,
};

export const sampleModels: ModelInfo[] = [
  {
    id: 'built-1',
    hash: 'RLF-A1B2-C3D4-S45-E500',
    name: 'Iron Guard',
    score: 45,
    episodesTrained: 500,
    architecture: { ...defaultArchitecture, hiddenLayers: 4, activation: 'Sigmoid' },
    aggressionIndex: 20,
    defenseIndex: 85,
    isBuiltIn: true
  },
  {
    id: 'built-2',
    hash: 'RLF-E5F6-G7H8-S68-E1200',
    name: 'Swift Striker',
    score: 68,
    episodesTrained: 1200,
    architecture: { ...defaultArchitecture, hiddenLayers: 2, neuronsPerLayer: 64, activation: 'ReLU' },
    aggressionIndex: 90,
    defenseIndex: 30,
    isBuiltIn: true
  },
  {
    id: 'built-3',
    hash: 'RLF-I9J0-K1L2-S85-E3000',
    name: 'Grandmaster',
    score: 85,
    episodesTrained: 3000,
    architecture: { ...defaultArchitecture, hiddenLayers: 3, neuronsPerLayer: 48, activation: 'ELU' },
    aggressionIndex: 65,
    defenseIndex: 70,
    isBuiltIn: true
  }
];

export const ALL_INPUTS = ['Own HP', 'Enemy HP', 'Distance', 'Own Pos', 'Enemy Pos', 'Cooldowns', 'Last Action', 'Stamina'];
export const ALL_ACTIONS = ['Move Left', 'Move Right', 'Attack', 'Block', 'Dash', 'Heavy Attack'];
