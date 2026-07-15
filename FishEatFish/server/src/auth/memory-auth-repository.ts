export interface AccountRecord { accountId: string; username: string; passwordHash: string; displayName: string; }
export class MemoryAuthRepository {
  private readonly accounts = new Map<string, AccountRecord>();
  findByUsername(username: string) { return this.accounts.get(username); }
  findByAccountId(accountId: string) { return [...this.accounts.values()].find((account) => account.accountId === accountId); }
  save(record: AccountRecord) { this.accounts.set(record.username, record); return record; }
}
