import { createHash, randomUUID } from 'node:crypto';
import { MemoryAuthRepository } from './memory-auth-repository.js';
import { TokenService } from './token-service.js';
export class AuthService {
  constructor(private readonly repository = new MemoryAuthRepository(), private readonly tokens = new TokenService()) {}
  register(username: string, password: string, displayName = username) {
    if (this.repository.findByUsername(username)) throw new Error('ACCOUNT_EXISTS');
    const account = this.repository.save({ accountId: randomUUID(), username, displayName, passwordHash: this.hash(password) });
    return { accountId: account.accountId, displayName: account.displayName, token: this.tokens.issue(account.accountId) };
  }
  login(username: string, password: string) {
    const account = this.repository.findByUsername(username);
    if (!account || account.passwordHash !== this.hash(password)) throw new Error('INVALID_CREDENTIALS');
    return { accountId: account.accountId, displayName: account.displayName, token: this.tokens.issue(account.accountId) };
  }
  testLogin(username: string) {
    const account = this.repository.findByUsername(username) ?? this.repository.save({ accountId: randomUUID(), username, displayName: username, passwordHash: this.hash('test-environment-only') });
    return { accountId: account.accountId, displayName: account.displayName, token: this.tokens.issue(account.accountId) };
  }
  verify(token: string) { return this.tokens.verify(token); }
  displayNameForAccount(accountId: string) { return this.repository.findByAccountId(accountId)?.displayName; }
  private hash(value: string) { return createHash('sha256').update(value).digest('hex'); }
}
