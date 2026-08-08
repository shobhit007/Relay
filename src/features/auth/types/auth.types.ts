export type PublicUser = {
  id: string;
  email: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  verifiedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type AuthTokensResponse = {
  user: PublicUser;
  accessToken: string;
  refreshToken: string;
};

export type LoginInput = {
  email: string;
  password: string;
};

export type RegisterInput = {
  email: string;
  password: string;
  displayName: string;
};

export type MeResponse = {
  user: PublicUser;
};
