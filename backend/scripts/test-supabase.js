import dotenv from "dotenv";

dotenv.config();

try {
  const { hasSupabase, supabaseStore } = await import("../src/services/supabase.store.js");
  console.log(`configured=${hasSupabase()}`);
  if (!hasSupabase()) {
    console.log("Supabase backend persistence is not active. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in backend/.env.");
    process.exit(0);
  }
  const users = await supabaseStore.users.count();
  const datasets = await supabaseStore.datasets.count();
  const predictions = await supabaseStore.predictions.count();
  const metrics = await supabaseStore.metrics.count();
  console.log(JSON.stringify({ users, datasets, predictions, metrics }, null, 2));
} catch (error) {
  console.error(error.message);
  if (error.response?.status) console.error(`status=${error.response.status}`);
  if (error.response?.data) console.error(JSON.stringify(error.response.data, null, 2));
  if (error.details) console.error(error.details);
  if (error.hint) console.error(error.hint);
  process.exit(1);
}
