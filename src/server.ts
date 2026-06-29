import { app } from './app';
import { connectDatabase, disconnectDatabase } from './config/database';
import { env } from './config/env';

const start = async (): Promise<void> => {
  try {
    await connectDatabase();
    app.listen(env.port, () => {
      console.log(`Server running on port ${env.port}`);
      console.log(`API base URL: http://localhost:${env.port}${env.apiPrefix}`);
      console.log(`Swagger docs: http://localhost:${env.port}/api-docs`);
    });
  } catch (error) {
    console.error('Failed to start server', error);
    process.exit(1);
  }
};

void start();

process.on('SIGINT', async () => {
  await disconnectDatabase();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await disconnectDatabase();
  process.exit(0);
});
