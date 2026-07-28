import { OAuthProviderConfig } from './google';

export class GithubOAuthProvider {
  private config: OAuthProviderConfig;

  constructor(config: OAuthProviderConfig) {
    this.config = config;
  }

  public getAuthUrl(): string {
    return `https://github.com/login/oauth/authorize?client_id=${this.config.clientId}&redirect_uri=${this.config.redirectUri}&scope=user:email`;
  }

  public async verifyToken(code: string): Promise<any> {
    throw new Error('Github OAuth verification not implemented yet');
  }
}
