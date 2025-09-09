const { db } = require('./server/db');
const { groupManagers } = require('./shared/schema');
const { eq } = require('drizzle-orm');

async function updateManagerPermissions() {
  try {
    console.log('Atualizando permissões dos gestores existentes...');
    
    const result = await db
      .update(groupManagers)
      .set({ 
        permissions: ['read', 'write', 'participants', 'payments'],
        updatedAt: new Date()
      })
      .where(eq(groupManagers.role, 'manager'))
      .returning();
    
    console.log('Gestores atualizados:', result.length);
    console.log('Permissões definidas para todos os gestores');
    process.exit(0);
  } catch (error) {
    console.error('Erro ao atualizar permissões:', error);
    process.exit(1);
  }
}

updateManagerPermissions();
