import { createApp } from "./app";
import { connectDatabase } from "./config/database";
import { env } from "./config/env";

const start = async (): Promise<void> => {
  await connectDatabase(env.mongoUri, env.mongoDbName);

  const app = createApp();
  app.listen(env.port, () => {
    console.log(`API server listening on http://localhost:${env.port}`);
  });
};

start().catch((error: unknown) => {
  const typedError = error as { code?: string; syscall?: string };
  if (typedError.code === "ETIMEOUT" || typedError.syscall === "querySrv") {
    console.error("Failed to connect to MongoDB Atlas. Check internet/VPN/DNS, Atlas Network Access, and outbound port 27017.");
  } else {
    console.error("Failed to start API server", error);
  }
  process.exit(1);
});
