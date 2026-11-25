// Cada passo é aditivo e retomável.
export async function migrateUsers(db) {
  const { rows: columns } = await db.query("SELECT column_name FROM information_schema.columns WHERE table_schema=current_schema() AND table_name='eci_users'");
  if (!columns.length) throw new Error('Tabela eci_users não encontrada. Execute setup em uma instalação nova.');
  const names = new Set(columns.map(column => column.column_name));
  // Antes desta migração todos os usuários eram administradores.
  if (!names.has('role')) await db.query("ALTER TABLE eci_users ADD COLUMN role VARCHAR(20) NOT NULL DEFAULT 'admin' CHECK (role IN ('admin','operator'))");
  if (!names.has('active')) await db.query('ALTER TABLE eci_users ADD COLUMN active BOOLEAN NOT NULL DEFAULT TRUE');
  // Inserções futuras sem perfil explícito não devem receber privilégios elevados.
  await db.query("ALTER TABLE eci_users ALTER COLUMN role SET DEFAULT 'operator'");
}
