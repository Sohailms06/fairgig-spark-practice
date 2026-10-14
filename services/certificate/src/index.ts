import { app } from './app';
import { config } from './config';

const PORT = config.port;

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`[fairgig-certificate] Service running on http://0.0.0.0:${PORT}`);
});

export default server;
