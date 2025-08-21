import { describe, test, expect } from '@jest/globals';
import { PlanService, PLANS } from '../../server/services/planService';

describe('PlanService', () => {
  test('should return all plans', () => {
    const plans = PlanService.getAllPlans();
    expect(plans).toHaveLength(4);
    expect(plans.map(p => p.id)).toEqual(['free', 'starter', 'professional', 'enterprise']);
  });

  test('should get plan by id', () => {
    const plan = PlanService.getPlan('professional');
    expect(plan).toBeDefined();
    expect(plan?.name).toBe('Professional');
    expect(plan?.isPopular).toBe(true);
  });

  test('should return undefined for invalid plan id', () => {
    const plan = PlanService.getPlan('invalid');
    expect(plan).toBeUndefined();
  });

  test('should check if action can be performed within limits', () => {
    // Free plan limits
    expect(PlanService.canPerformAction('free', 'events', 2)).toBe(true);
    expect(PlanService.canPerformAction('free', 'events', 3)).toBe(false);
    expect(PlanService.canPerformAction('free', 'participants', 50)).toBe(false);
    
    // Professional plan (unlimited events)
    expect(PlanService.canPerformAction('professional', 'events', 1000)).toBe(true);
    expect(PlanService.canPerformAction('professional', 'participants', 999)).toBe(true);
    expect(PlanService.canPerformAction('professional', 'participants', 1000)).toBe(false);
  });

  test('should return trial plan', () => {
    const trialPlan = PlanService.getTrialPlan();
    expect(trialPlan.id).toBe('free');
    expect(trialPlan.price).toBe(0);
  });

  test('should return popular plan', () => {
    const popularPlan = PlanService.getPopularPlan();
    expect(popularPlan.id).toBe('professional');
    expect(popularPlan.isPopular).toBe(true);
  });

  test('should validate plan features and limits', () => {
    const professionalPlan = PlanService.getPlan('professional');
    expect(professionalPlan).toBeDefined();
    expect(professionalPlan?.features).toContain('Eventos ilimitados');
    expect(professionalPlan?.limits.events).toBe(-1); // unlimited
    expect(professionalPlan?.limits.participants).toBe(1000);
    
    const freePlan = PlanService.getPlan('free');
    expect(freePlan?.limits.events).toBe(3);
    expect(freePlan?.limits.participants).toBe(50);
  });
});