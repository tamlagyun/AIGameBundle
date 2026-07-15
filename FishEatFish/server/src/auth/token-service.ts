import { randomBytes } from 'node:crypto';
export class TokenService {
  private readonly tokens = new Map<string, string>();
  issue(accountId: string) { const token = randomBytes(24).toString('hex'); this.tokens.set(token, accountId); return token; }
  verify(token: string) { return this.tokens.get(token) ?? null; }
  revoke(token: string) { this.tokens.delete(token); }
}
