export interface InteractionFeedbackPlan {
  removeLayer: {
    durationSeconds: number;
    endScale: number;
    endOpacity: number;
  };
  pickMushroom: {
    durationSeconds: number;
    endScale: number;
    endOpacity: number;
  };
  floatingText: {
    text: string;
    durationSeconds: number;
    yOffset: number;
  };
}

const INTERACTION_FEEDBACK_PLAN: InteractionFeedbackPlan = {
  removeLayer: {
    durationSeconds: 0.16,
    endScale: 0.88,
    endOpacity: 0
  },
  pickMushroom: {
    durationSeconds: 0.14,
    endScale: 1.22,
    endOpacity: 0
  },
  floatingText: {
    text: '+1',
    durationSeconds: 0.28,
    yOffset: 42
  }
};

export function getInteractionFeedbackPlan(): InteractionFeedbackPlan {
  return {
    removeLayer: { ...INTERACTION_FEEDBACK_PLAN.removeLayer },
    pickMushroom: { ...INTERACTION_FEEDBACK_PLAN.pickMushroom },
    floatingText: { ...INTERACTION_FEEDBACK_PLAN.floatingText }
  };
}
