export interface D1Env {
  DB: D1Database;
}

export function getDb(env: D1Env): D1Database {
  return env.DB;
}
