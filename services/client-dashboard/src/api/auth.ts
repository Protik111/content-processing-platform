const KEYCLOAK_TOKEN_URL =
  '/auth/realms/content-platform/protocol/openid-connect/token';

export interface TokenResponse {
  access_token: string;
  expires_in: number;
  token_type: string;
}

export async function loginWithPassword(
  username: string,
  password: string,
  clientId = 'content-service',
  clientSecret = 'onfenChucD3uKFKhPuEATCyflsA0oPyB'
): Promise<TokenResponse> {
  const body = new URLSearchParams({
    grant_type: 'password',
    client_id: clientId,
    client_secret: clientSecret,
    username,
    password,
  });

  const res = await fetch(KEYCLOAK_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error_description || 'Login failed');
  }

  return res.json();
}
