export interface Plan {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  interval: 'monthly' | 'yearly';
  features: string[];
  limits: {
    events: number;
    participants: number;
    templates: number;
    storage: number; // in MB
    emailsPerMonth: number;
  };
  isPopular?: boolean;
}

export const PLANS: Plan[] = [
  {
    id: 'free',
    name: 'Teste Grátis',
    description: 'Para testar a plataforma',
    price: 0,
    currency: 'BRL',
    interval: 'monthly',
    features: [
      'Até 3 eventos simultâneos',
      'Até 50 participantes por evento',
      'Templates básicos',
      'Suporte por email',
      'Marca EventFlow nas páginas'
    ],
    limits: {
      events: 3,
      participants: 50,
      templates: 5,
      storage: 100,
      emailsPerMonth: 100
    }
  },
  {
    id: 'starter',
    name: 'Starter',
    description: 'Para organizadores iniciantes',
    price: 29.90,
    currency: 'BRL',
    interval: 'monthly',
    features: [
      'Até 10 eventos simultâneos',
      'Até 200 participantes por evento',
      'Todos os templates',
      'Suporte prioritário',
      'Sem marca EventFlow',
      'Analytics básicos'
    ],
    limits: {
      events: 10,
      participants: 200,
      templates: -1, // unlimited
      storage: 500,
      emailsPerMonth: 1000
    }
  },
  {
    id: 'professional',
    name: 'Professional',
    description: 'Para organizadores profissionais',
    price: 89.90,
    currency: 'BRL',
    interval: 'monthly',
    features: [
      'Eventos ilimitados',
      'Até 1000 participantes por evento',
      'Editor avançado personalizado',
      'Automação de email',
      'Analytics avançados',
      'Integrações API',
      'Suporte via WhatsApp'
    ],
    limits: {
      events: -1, // unlimited
      participants: 1000,
      templates: -1,
      storage: 2000,
      emailsPerMonth: 5000
    },
    isPopular: true
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    description: 'Para grandes organizações',
    price: 249.90,
    currency: 'BRL',
    interval: 'monthly',
    features: [
      'Tudo do Professional',
      'Participantes ilimitados',
      'White-label completo',
      'Gerente de sucesso dedicado',
      'SLA garantido',
      'Integrações customizadas',
      'Suporte 24/7'
    ],
    limits: {
      events: -1,
      participants: -1,
      templates: -1,
      storage: 10000,
      emailsPerMonth: -1
    }
  }
];

export class PlanService {
  static getPlan(planId: string): Plan | undefined {
    return PLANS.find(plan => plan.id === planId);
  }

  static getAllPlans(): Plan[] {
    return PLANS;
  }

  static canPerformAction(
    userPlan: string, 
    action: keyof Plan['limits'], 
    currentUsage: number
  ): boolean {
    const plan = this.getPlan(userPlan);
    if (!plan) return false;

    const limit = plan.limits[action];
    if (limit === -1) return true; // unlimited
    return currentUsage < limit;
  }

  static getTrialPlan(): Plan {
    return PLANS[0]; // free plan
  }

  static getPopularPlan(): Plan {
    return PLANS.find(plan => plan.isPopular) || PLANS[1];
  }
}