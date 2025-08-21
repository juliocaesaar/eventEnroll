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

    // Create a sample event if none exists
    const existingEvents = await storage.getUserEvents("17698187"); // Default user ID
    if (existingEvents.length === 0) {
      const sampleEvent = await storage.createEvent({
        title: "Acampamento Next Level 2024",
        description: "Um acampamento transformador para jovens com foco em liderança e crescimento pessoal",
        startDate: new Date("2024-09-15T09:00:00Z"),
        endDate: new Date("2024-09-17T18:00:00Z"),
        capacity: 100,
        organizerId: "17698187",
        categoryId: "religious",
        status: "published",
        slug: "acamp-next-level",
        pageComponents: [
          { type: 'header', props: { title: 'Acampamento Next Level 2024', subtitle: 'Transforme sua vida em 3 dias' } },
          { type: 'image', props: { src: 'https://images.unsplash.com/photo-1504851149312-7a075b496cc7?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80', alt: 'Acampamento na natureza', width: '100%' } },
          { type: 'text', props: { content: 'Junte-se a nós em uma experiência única de crescimento pessoal e espiritual. Durante 3 dias intensos, você participará de workshops, palestras inspiradoras e atividades ao ar livre que vão desafiar seus limites e expandir sua visão de mundo.', size: 'medium' } },
          { type: 'text', props: { content: 'O que esperar: Palestras motivacionais, Workshops práticos, Atividades de aventura, Networking com jovens líderes, Momentos de reflexão e autoconhecimento', size: 'medium' } },
          { type: 'button', props: { text: 'Garanta sua vaga agora!', variant: 'primary', link: '#register' } }
        ]
      });

      // Create tickets for the sample event
      await storage.createTicket({
        eventId: sampleEvent.id,
        name: "Ingresso Individual",
        description: "Inclui hospedagem, todas as refeições e materiais",
        price: "299.90",
        quantity: 80,
        maxPerOrder: 2
      });

      await storage.createTicket({
        eventId: sampleEvent.id,
        name: "Lote Promocional Dupla",
        description: "Para quem vem acompanhado! Desconto especial para 2 pessoas",
        price: "499.90",
        quantity: 20,
        maxPerOrder: 1
      });

      console.log('Created sample event with tickets');
    }
  } catch (error) {
    console.error('Error seeding initial data:', error);
  }
}