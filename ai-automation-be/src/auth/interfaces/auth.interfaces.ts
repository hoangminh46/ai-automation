export interface JwtPayload {
  sub: string;
  email: string;
  aud: string;
  role: string;
  iat: number;
  exp: number;
}

export interface AuthenticatedUser {
  authId: string;
  email: string;
  sellerId?: string;
}
