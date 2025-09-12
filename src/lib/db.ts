import { neon } from '@neondatabase/serverless';

const databaseUrl = process.env.DATABASE_URL || process.env.NEON_DATABASE_URL;
if (!databaseUrl) {
  // We intentionally don't throw at import-time to avoid build breaks without envs
  // API routes will error if this is missing when called.
}

export const sql = databaseUrl ? neon(databaseUrl) : (async () => { throw new Error('DATABASE_URL not set'); }) as any;

let schemaReady: Promise<void> | null = null;

export function ensureSchema(): Promise<void> {
  if (schemaReady) return schemaReady;
  schemaReady = (async () => {
    await sql`create table if not exists tournaments (
      id text primary key,
      access_code text not null,
      date text not null,
      current_round int not null default 1,
      is_finalized boolean not null default false,
      created_at timestamptz not null default now()
    )`;

    await sql`create table if not exists players (
      tournament_id text not null,
      id int not null,
      name text not null,
      total_score int not null default 0,
      primary key (tournament_id, id),
      foreign key (tournament_id) references tournaments(id) on delete cascade
    )`;

    await sql`create table if not exists matches (
      tournament_id text not null,
      id int not null,
      round int not null,
      team_a_p1 int not null,
      team_a_p2 int not null,
      team_b_p1 int not null,
      team_b_p2 int not null,
      score_a int,
      score_b int,
      completed boolean not null default false,
      primary key (tournament_id, id),
      foreign key (tournament_id) references tournaments(id) on delete cascade
    )`;
  })();
  return schemaReady;
}

export type DbTournamentRow = {
  id: string;
  access_code: string;
  date: string;
  current_round: number;
  is_finalized: boolean;
  created_at: string;
};


