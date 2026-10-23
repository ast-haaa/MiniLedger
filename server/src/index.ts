import app from './app';
import { initDatabase } from './config/db';

const PORT = process.env.PORT || 5000;

// Initialize database connectivity check
initDatabase();

// Start Express server only if not running tests
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`🚀 MiniLedger backend server running on http://localhost:${PORT}`);
  });
}

export { app };
export default app;
