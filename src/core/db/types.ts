import { db } from './client';

export type DbTransaction = Parameters<
  Parameters<typeof db.transaction>[0]
>[0];

export type DbExecutor = typeof db | DbTransaction;
