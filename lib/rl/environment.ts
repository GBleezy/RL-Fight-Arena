import { Architecture, Rewards } from '../types';

export interface EnvState {
  ownHp: number;
  enemyHp: number;
  ownPos: number;
  enemyPos: number;
  stamina: number;
  lastAction: number;
  enemyLastAction: number;
  episodeSteps: number;
}

export class FighterEnv {
  public state: EnvState;
  private maxSteps = 200;

  constructor(private architecture: Architecture, private rewards: Rewards, private opponentType: string) {
    this.state = this.reset();
  }

  reset(): EnvState {
    this.state = {
      ownHp: 100,
      enemyHp: 100,
      ownPos: 25,
      enemyPos: 75,
      stamina: 100,
      lastAction: 0,
      enemyLastAction: 0,
      episodeSteps: 0,
    };
    return this.state;
  }

  getStateVector(): number[] {
    const v: number[] = [];
    const s = this.state;
    for (const input of this.architecture.inputs) {
      if (input === 'Own HP') v.push(s.ownHp / 100);
      else if (input === 'Enemy HP') v.push(s.enemyHp / 100);
      else if (input === 'Distance') v.push(Math.abs(s.ownPos - s.enemyPos) / 100);
      else if (input === 'Own Pos') v.push(s.ownPos / 100);
      else if (input === 'Enemy Pos') v.push(s.enemyPos / 100);
      else if (input === 'Stamina') v.push(s.stamina / 100);
      else if (input === 'Last Action') v.push(s.lastAction / Math.max(1, this.architecture.actions.length));
      else v.push(0);
    }
    return v.length > 0 ? v : [0];
  }

  step(actionIdx: number): { state: number[], reward: number, done: boolean, info: Record<string, any> } {
    const actionName = this.architecture.actions[actionIdx];
    this.state.lastAction = actionIdx;
    
    // Opponent logic based on type
    let enemyActionName = 'Block';
    const dist = Math.abs(this.state.ownPos - this.state.enemyPos);
    
    if (this.opponentType === 'Static') {
      enemyActionName = 'Block'; // Just stands there
    } else if (this.opponentType === 'Random') {
      const actions = ['Move Left', 'Move Right', 'Attack', 'Block'];
      enemyActionName = actions[Math.floor(Math.random() * actions.length)];
    } else if (this.opponentType === 'Aggressive') {
      if (dist < 15) enemyActionName = 'Attack';
      else enemyActionName = this.state.enemyPos > this.state.ownPos ? 'Move Left' : 'Move Right';
    } else if (this.opponentType === 'Evade') {
      if (dist < 30) enemyActionName = this.state.enemyPos > this.state.ownPos ? 'Move Right' : 'Move Left';
      else enemyActionName = 'Block';
    } else if (this.opponentType === 'Blocker') {
      enemyActionName = 'Block';
      if (dist < 10 && Math.random() < 0.2) enemyActionName = 'Attack';
    }
    
    let reward = 0;
    
    let moveTargetA = this.state.ownPos;
    let moveTargetB = this.state.enemyPos;
    
    if (actionName === 'Move Left') moveTargetA -= 5;
    else if (actionName === 'Move Right') moveTargetA += 5;
    
    if (enemyActionName === 'Move Left') moveTargetB -= 5;
    else if (enemyActionName === 'Move Right') moveTargetB += 5;
    
    moveTargetA = Math.max(0, Math.min(100, moveTargetA));
    moveTargetB = Math.max(0, Math.min(100, moveTargetB));
    
    // Prevent passing through
    if (moveTargetA > moveTargetB - 5) {
      this.state.ownPos = moveTargetB - 5;
      this.state.enemyPos = moveTargetB;
    } else {
      this.state.ownPos = moveTargetA;
      this.state.enemyPos = moveTargetB;
    }

    if (actionName === 'Move Left' || actionName === 'Move Right') {
      reward += this.rewards.stayMobile;
    }
    
    const newDist = Math.abs(this.state.ownPos - this.state.enemyPos);
    let dmgToEnemy = 0;
    let dmgToOwn = 0;
    
    if (actionName === 'Attack' && newDist < 15) {
      if (enemyActionName !== 'Block') {
         dmgToEnemy = 10;
      } else {
         dmgToEnemy = 2; // reduced by block
      }
    }
    if (enemyActionName === 'Attack' && newDist < 15) {
      if (actionName !== 'Block') {
         dmgToOwn = 10;
      } else {
         dmgToOwn = 2;
         reward += this.rewards.successfulBlock;
      }
    }
    
    this.state.ownHp -= dmgToOwn;
    this.state.enemyHp -= dmgToEnemy;
    
    if (dmgToEnemy > 0) reward += this.rewards.dealDamage * (dmgToEnemy / 10);
    if (dmgToOwn > 0) reward += this.rewards.takeDamage * (dmgToOwn / 10);
    
    // Shaping
    if (this.state.enemyPos >= 95 || this.state.enemyPos <= 5) reward += this.rewards.cornerEnemy;
    
    reward += this.rewards.timePerStepPenalty;
    
    let done = false;
    this.state.episodeSteps++;
    
    if (this.state.ownHp <= 0 || this.state.enemyHp <= 0 || this.state.episodeSteps >= this.maxSteps) {
      done = true;
      if (this.state.ownHp > 0 && this.state.enemyHp <= 0) {
        reward += this.rewards.winRound;
      } else if (this.state.ownHp <= 0 && this.state.enemyHp > 0) {
        reward -= Math.abs(this.rewards.loseRound); // lose penalty
      } else {
        // Draw or timeout
      }
    }
    
    return {
      state: this.getStateVector(),
      reward,
      done,
      info: { hp_a: this.state.ownHp, hp_b: this.state.enemyHp, posA: this.state.ownPos, posB: this.state.enemyPos, actionA: actionName, actionB: enemyActionName }
    };
  }
}
