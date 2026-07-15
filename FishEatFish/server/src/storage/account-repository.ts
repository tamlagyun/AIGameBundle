import type { AccountRecord } from '../auth/memory-auth-repository.js';
export interface AccountRepository { findByUsername(username: string): AccountRecord | undefined; save(record: AccountRecord): AccountRecord; }
