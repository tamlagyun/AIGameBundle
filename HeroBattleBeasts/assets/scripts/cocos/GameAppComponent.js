import { getCocosLayerPlan } from './CocosNodeNames.js';

export class GameAppComponent {
  componentName = 'GameAppComponent';
  usesRuntimeViewModel = true;
  ownsGameplayRules = false;

  get requiredLayerNames() {
    return getCocosLayerPlan().map((layer) => layer.nodeName);
  }

  createStartupPlan() {
    return {
      componentName: this.componentName,
      requiredLayerNames: this.requiredLayerNames,
      runtimeEntry: 'GameRuntime',
      binderEntry: 'RuntimeNodeBinder',
      ownsGameplayRules: this.ownsGameplayRules
    };
  }
}
