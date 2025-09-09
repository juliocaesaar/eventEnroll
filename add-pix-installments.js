const { Pool } = require('pg');

async function addPixInstallmentsColumn() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL
  });

  try {
    // Verificar se a coluna já existe
    const checkResult = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'events' AND column_name = 'pix_installments'
    `);

    if (checkResult.rows.length === 0) {
      // Adicionar a coluna se não existir
      await pool.query(`
        ALTER TABLE events ADD COLUMN pix_installments integer DEFAULT 12
      `);
      console.log('✅ Coluna pix_installments adicionada com sucesso!');
    } else {
      console.log('✅ Coluna pix_installments já existe!');
    }
  } catch (error) {
    console.error('❌ Erro ao adicionar coluna:', error.message);
  } finally {
    await pool.end();
  }
}

addPixInstallmentsColumn();
