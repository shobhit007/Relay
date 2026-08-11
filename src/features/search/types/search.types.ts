export type SearchUser = {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
};

export type SearchUsersResponse = {
  users: SearchUser[];
};
