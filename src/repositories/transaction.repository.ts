import { db } from "@/db";

export type DB = typeof db | any;

export const TransactionRepository = {
  async runTransaction<T>(callback: (tx: DB) => Promise<T>): Promise<T> {
    return db.transaction(callback);
  },
};
