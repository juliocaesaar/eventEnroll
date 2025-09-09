import Stripe from 'stripe';

// Configuração do Stripe
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-08-27.basil',
});

// Configurações padrão para Payment Links
export const STRIPE_CONFIG = {
  currency: 'brl', // Real brasileiro
  payment_method_types: ['card', 'boleto'] as Stripe.PaymentLinkCreateParams.PaymentMethodType[], // Cartão e boleto (PIX removido temporariamente)
  billing_address_collection: 'required' as const, // Coletar endereço de cobrança
  phone_number_collection: {
    enabled: true, // Coletar telefone
  },
};

// Função para gerar configuração de redirecionamento
export function getStripeRedirectConfig(registrationId?: string, eventSlug?: string) {
  const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5000';
  const redirectUrl = registrationId && eventSlug
    ? `${baseUrl}/registration/confirmation?id=${registrationId}&session_id={CHECKOUT_SESSION_ID}&eventSlug=${eventSlug}`
    : registrationId
    ? `${baseUrl}/registration/confirmation?id=${registrationId}&session_id={CHECKOUT_SESSION_ID}`
    : `${baseUrl}/registration/confirmation?session_id={CHECKOUT_SESSION_ID}`;
    
  console.log('🔗 URL de redirecionamento configurada:', redirectUrl);
  console.log('📝 RegistrationId:', registrationId);
  console.log('📝 EventSlug:', eventSlug);
    
  return {
    after_completion: {
      type: 'redirect' as const,
      redirect: {
        url: redirectUrl,
      },
    },
  };
}

// Função para criar um produto no Stripe para um ingresso
export async function createStripeProduct(ticket: any, event: any) {
  try {
    console.log('=== DEBUG STRIPE PRODUCT ===');
    console.log('Ticket:', {
      id: ticket.id,
      name: ticket.name,
      price: ticket.price,
      priceType: typeof ticket.price
    });
    console.log('Event:', {
      id: event.id,
      title: event.title,
      slug: event.slug
    });

    // Criar produto no Stripe
    const product = await stripe.products.create({
      name: `${event.title} - ${ticket.name}`,
      description: ticket.description || `Ingresso para ${event.title}`,
      metadata: {
        eventId: event.id,
        ticketId: ticket.id,
        eventSlug: event.slug,
      },
    });

    console.log('Produto criado:', product.id);

    // Criar preço no Stripe (convertendo para centavos)
    const unitAmount = Math.round(parseFloat(ticket.price || '0') * 100);
    console.log('Valor em centavos:', unitAmount);

    const price = await stripe.prices.create({
      product: product.id,
      unit_amount: unitAmount,
      currency: STRIPE_CONFIG.currency,
      metadata: {
        eventId: event.id,
        ticketId: ticket.id,
      },
    });

    console.log('Preço criado:', price.id);
    console.log('=== FIM DEBUG STRIPE PRODUCT ===');

    return { product, price };
  } catch (error) {
    console.error('Erro ao criar produto/preço no Stripe:', error);
    throw error;
  }
}

// Função para criar um Payment Link para um ingresso
export async function createPaymentLink(ticket: any, event: any, quantity: number = 1, registrationId?: string, customerEmail?: string, customerPhone?: string) {
  try {
    // Verificar se já existe um produto/preço para este ingresso
    let product, price;
    
    try {
      // Tentar buscar produto existente
      const products = await stripe.products.list({
        limit: 1,
      });

      // Filtrar por metadados manualmente
      const matchingProduct = products.data.find(p => 
        p.metadata.eventId === event.id && p.metadata.ticketId === ticket.id
      );

      if (matchingProduct) {
        product = matchingProduct;
        const prices = await stripe.prices.list({
          limit: 1,
          product: product.id,
        });
        if (prices.data.length > 0) {
          price = prices.data[0];
        }
      }
    } catch (error) {
      console.log('Produto não encontrado, criando novo...');
    }

    // Se não existir, criar novo produto/preço
    if (!product || !price) {
      const result = await createStripeProduct(ticket, event);
      product = result.product;
      price = result.price;
    }

    // Criar Payment Link
    const paymentLink = await stripe.paymentLinks.create({
      line_items: [
        {
          price: price.id,
          quantity: quantity,
        },
      ],
      ...STRIPE_CONFIG,
      ...getStripeRedirectConfig(registrationId, event.slug),
      metadata: {
        eventId: event.id,
        ticketId: ticket.id,
        eventSlug: event.slug,
        quantity: quantity.toString(),
        registrationId: registrationId || '',
      },
    });

    // Se temos email ou telefone, modificar a URL para incluir os parâmetros
    if ((customerEmail || customerPhone) && paymentLink.url) {
      const url = new URL(paymentLink.url);
      
      if (customerEmail) {
        url.searchParams.set('prefilled_email', customerEmail);
      }
      
      if (customerPhone) {
        url.searchParams.set('prefilled_phone_number', customerPhone);
      }
      
      paymentLink.url = url.toString();
    }

    return paymentLink;
  } catch (error: any) {
    console.error('Erro ao criar Payment Link:', error);
    console.error('Detalhes do erro:', {
      message: error.message,
      type: error.type,
      code: error.code
    });
    throw error;
  }
}

// Função para criar Payment Link para múltiplos ingressos
export async function createMultiTicketPaymentLink(tickets: Array<{ticketId: string, quantity: number}>, event: any, customerEmail?: string, customerPhone?: string) {
  try {
    const lineItems = [];
    
    // Para cada ingresso, buscar ou criar produto/preço
    for (const ticketData of tickets) {
      const ticket = await getTicketById(ticketData.ticketId);
      if (!ticket) continue;

      let product, price;
      
      try {
        const products = await stripe.products.list({
          limit: 1,
        });

        // Filtrar por metadados manualmente
        const matchingProduct = products.data.find(p => 
          p.metadata.eventId === event.id && p.metadata.ticketId === ticket.id
        );

        if (matchingProduct) {
          product = matchingProduct;
          const prices = await stripe.prices.list({
            limit: 1,
            product: product.id,
          });
          if (prices.data.length > 0) {
            price = prices.data[0];
          }
        }
      } catch (error) {
        console.log('Produto não encontrado, criando novo...');
      }

      if (!product || !price) {
        const result = await createStripeProduct(ticket, event);
        product = result.product;
        price = result.price;
      }

      lineItems.push({
        price: price.id,
        quantity: ticketData.quantity,
      });
    }

    if (lineItems.length === 0) {
      throw new Error('Nenhum ingresso válido encontrado');
    }

    // Criar Payment Link para múltiplos ingressos
    const paymentLink = await stripe.paymentLinks.create({
      line_items: lineItems,
      ...STRIPE_CONFIG,
      metadata: {
        eventId: event.id,
        eventSlug: event.slug,
        multiTicket: 'true',
      },
    });

    // Se temos email ou telefone, modificar a URL para incluir os parâmetros
    if ((customerEmail || customerPhone) && paymentLink.url) {
      const url = new URL(paymentLink.url);
      
      if (customerEmail) {
        url.searchParams.set('prefilled_email', customerEmail);
      }
      
      if (customerPhone) {
        url.searchParams.set('prefilled_phone_number', customerPhone);
      }
      
      paymentLink.url = url.toString();
    }

    return paymentLink;
  } catch (error) {
    console.error('Erro ao criar Payment Link para múltiplos ingressos:', error);
    throw error;
  }
}

// Função auxiliar para buscar ingresso
async function getTicketById(ticketId: string) {
  try {
    const { storage } = await import("../storage");
    return await storage.getTicket(ticketId);
  } catch (error) {
    console.error('Erro ao buscar ingresso:', error);
    return null;
  }
}
