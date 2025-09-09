import dotenv from 'dotenv';
import { seedInitialData } from './modules/seedData';

// Carregar variáveis de ambiente
dotenv.config({ path: '.env.local' });

async function runSeed() {
  try {
    console.log('🌱 Iniciando seed do banco de dados...');
    console.log('🔍 DATABASE_URL:', process.env.DATABASE_URL ? 'Definida' : 'Não definida');
    await seedInitialData();
    console.log('✅ Seed concluído com sucesso!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro durante o seed:', error);
    process.exit(1);
  }
}

runSeed();
