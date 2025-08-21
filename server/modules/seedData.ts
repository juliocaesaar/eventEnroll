export async function seedInitialData(): Promise<void> {
  try {
    const { storage } = await import("../storage");
    
    const existingCategories = await storage.getEventCategories();
    if (existingCategories.length === 0) {
      // Create default categories
      await storage.createEventCategory({
        id: 'religious',
        name: 'Eventos Religiosos',
        description: 'Retiros, conferências, acampamentos',
        icon: 'fas fa-praying-hands',
        color: '#9333ea',
      });

      await storage.createEventCategory({
        id: 'corporate',
        name: 'Eventos Corporativos',
        description: 'Treinamentos, workshops, seminários',
        icon: 'fas fa-building',
        color: '#3b82f6',
      });

      await storage.createEventCategory({
        id: 'social',
        name: 'Eventos Sociais',
        description: 'Casamentos, aniversários, formaturas',
        icon: 'fas fa-heart',
        color: '#ec4899',
      });

      await storage.createEventCategory({
        id: 'cultural',
        name: 'Eventos Culturais',
        description: 'Shows, festivais, exposições',
        icon: 'fas fa-music',
        color: '#10b981',
      });

      console.log('Seeded initial categories');
    }

    const existingTemplates = await storage.getTemplates();
    if (existingTemplates.length === 0) {
      // Create default templates
      await storage.createTemplate({
        name: 'Conferência Empresarial',
        description: 'Template profissional para conferências e seminários',
        categoryId: 'corporate',
        imageUrl: 'https://images.unsplash.com/photo-1505373877841-8d25f7d46678',
        components: [
          { type: 'header', props: { title: 'Sua Conferência', subtitle: 'Transformando negócios' } },
          { type: 'text', props: { content: 'Junte-se aos melhores profissionais do setor' } },
          { type: 'button', props: { text: 'Inscreva-se Agora', variant: 'primary' } }
        ],
        isPublic: true,
      });

      await storage.createTemplate({
        name: 'Retiro Espiritual',
        description: 'Template para retiros e eventos religiosos',
        categoryId: 'religious',
        imageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d',
        components: [
          { type: 'header', props: { title: 'Retiro Espiritual', subtitle: 'Renovação da fé' } },
          { type: 'text', props: { content: 'Um momento especial de comunhão e reflexão' } },
          { type: 'button', props: { text: 'Confirme Presença', variant: 'secondary' } }
        ],
        isPublic: true,
      });

      await storage.createTemplate({
        name: 'Casamento',
        description: 'Template elegante para casamentos e celebrações',
        categoryId: 'social',
        imageUrl: 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3',
        components: [
          { type: 'header', props: { title: 'Nosso Grande Dia', subtitle: 'Celebre conosco' } },
          { type: 'text', props: { content: 'Será uma honra ter você em nosso casamento' } },
          { type: 'button', props: { text: 'Confirmar Presença', variant: 'accent' } }
        ],
        isPublic: true,
      });

      console.log('Seeded initial templates');
    }
  } catch (error) {
    console.error('Error seeding initial data:', error);
  }
}