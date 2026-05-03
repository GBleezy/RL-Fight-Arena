import * as tf from '@tensorflow/tfjs';
import { Architecture } from '../types';

export class RLAgent {
  public model: tf.Sequential;
  public learningRate: number;

  constructor(private architecture: Architecture, learningRate = 0.01) {
    this.learningRate = learningRate;
    this.model = this.buildModel();
  }

  buildModel(): tf.Sequential {
    const minNeurons = 4;
    const model = tf.sequential();
    
    // Convert activation enum to tfjs activation string
    let activation: 'relu' | 'tanh' | 'sigmoid' | 'elu' = 'relu';
    if (this.architecture.activation === 'Tanh') activation = 'tanh';
    if (this.architecture.activation === 'Sigmoid') activation = 'sigmoid';
    if (this.architecture.activation === 'ELU') activation = 'elu';

    const numInputs = Math.max(1, this.architecture.inputs.length);
    const numActions = Math.max(1, this.architecture.actions.length);

    model.add(tf.layers.dense({
      units: Math.max(minNeurons, this.architecture.neuronsPerLayer),
      inputShape: [numInputs],
      activation: activation,
    }));

    for (let i = 1; i < this.architecture.hiddenLayers; i++) {
       model.add(tf.layers.dense({
         units: Math.max(minNeurons, this.architecture.neuronsPerLayer),
         activation: activation,
       }));
    }

    model.add(tf.layers.dense({
      units: numActions,
      activation: 'softmax', // Output probabilities for discrete actions
    }));

    return model;
  }

  getAction(state: number[]): number {
    return tf.tidy(() => {
      const stateTensor = tf.tensor2d([state]);
      const logits = this.model.predict(stateTensor) as tf.Tensor;
      // sample from probability distribution
      const actionProbabilities = logits.dataSync();
      
      const r = Math.random();
      let cumulativeP = 0;
      for (let i = 0; i < actionProbabilities.length; i++) {
        cumulativeP += actionProbabilities[i];
        if (r <= cumulativeP) return i;
      }
      return actionProbabilities.length - 1;
    });
  }

  // Simple Policy Gradient (REINFORCE) update step
  // Takes trajectories (state, action, adv)
  async trainStep(states: number[][], actions: number[], discountedRewards: number[], entropyCoef: number) {
     const optimizer = tf.train.adam(this.learningRate);
     
     const lossFn = () => {
       return tf.tidy(() => {
         const statesTensor = tf.tensor2d(states);
         const actionsTensor = tf.tensor1d(actions, 'int32');
         const rewardsTensor = tf.tensor1d(discountedRewards);
         
         const logits = this.model.predict(statesTensor) as tf.Tensor<tf.Rank>;
         
         // Calculate Cross Entropy Loss with advantages
         const masks = tf.oneHot(actionsTensor, this.architecture.actions.length);
         const logProbs = tf.sum(tf.mul(masks, tf.log(logits.add(1e-8))), 1); // [batchSize]
         
         const policyLoss = tf.neg(tf.mean(tf.mul(logProbs, rewardsTensor)));
         
         // Add entropy bonus to encourage exploration
         const entropy = tf.neg(tf.mean(tf.sum(tf.mul(logits, tf.log(logits.add(1e-8))), 1)));
         const totalLoss = policyLoss.sub(entropy.mul(entropyCoef));
         
         return totalLoss as tf.Scalar;
       });
     };

     const { grads } = optimizer.computeGradients(lossFn);
     optimizer.applyGradients(grads);
     
     tf.dispose(grads);
  }

  async getWeightsHash(): Promise<string> {
    // Generate a simple hash from weights sum for fun to make it deterministic-looking
    let wSum = 0;
    for (const w of this.model.getWeights()) {
       wSum += (await w.data())[0];
    }
    return Math.abs(Math.floor(wSum * 1000000)).toString(16).toUpperCase();
  }
}

export function computeDiscountedRewards(rewards: number[], gamma: number): number[] {
  const discounted = new Array(rewards.length).fill(0);
  let runningAdd = 0;
  for (let t = rewards.length - 1; t >= 0; t--) {
    runningAdd = runningAdd * gamma + rewards[t];
    discounted[t] = runningAdd;
  }
  
  // Normalize
  const mean = discounted.reduce((a, b) => a + b) / discounted.length;
  const std = Math.sqrt(discounted.reduce((a, b) => a + (b - mean) ** 2, 0) / discounted.length) || 1;
  return discounted.map(r => (r - mean) / std);
}
