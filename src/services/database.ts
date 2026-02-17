export async function initDatabase(): Promise<void> {
  try {
    console.log('Database initialized');
  } catch (error) {
    console.error('Failed to initialize database:', error);
    throw error;
  }
}
