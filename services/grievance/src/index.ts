import { app } from './app';
import { config } from './config';

const PORT = config.port;

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`[fairgig-grievance] Server listening on http://localhost:${PORT}`);
  });
}

export default app;
