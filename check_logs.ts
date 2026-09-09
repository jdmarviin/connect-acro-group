import { getPayload } from 'payload';
import configPromise from './src/payload.config';

async function run() {
  const payload = await getPayload({ config: configPromise });
  const logs = await payload.find({ collection: 'meeting-logs', limit: 10 });
  console.log("Logs:");
  console.log(JSON.stringify(logs.docs, null, 2));
}

run().catch(console.error).then(() => process.exit(0));
