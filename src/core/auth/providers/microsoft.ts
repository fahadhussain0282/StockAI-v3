import { OAuthProviderConfig } from './google';

export class MicrosoftOAuthProvider {
  private config: OAuthProviderConfig;
  private tenantId: string;

  constructor(config: OAuthProviderConfig, tenantId: string = 'common') {
    this.config = config;
    this.tenantId = tenantId;
  }

  public getAuthUrl(): string {
    return `https://login.microsoftonline.com/${this.tenantId}/oauth2/v2.0/authorize?client_id=${this.config.clientId}&redirect_uri=${this.config.redirectUri}&response_type=code&scope=user.read`;
  }

  public async verifyToken(code: string): Promise<any> {
    throw new Error('Microsoft OAuth verification not implemented yet');
  }
}
