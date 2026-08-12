import { userRepository } from '../db/repository';
import type { LocalUser, UpsertLocalUserInput } from '../db/schema';
import { notifyCurrentUserId } from './session-bridge';

export class UserService {
  async upsertUser(input: UpsertLocalUserInput): Promise<LocalUser> {
    return userRepository.upsert(input);
  }

  async upsertUsers(inputs: UpsertLocalUserInput[]): Promise<LocalUser[]> {
    const results: LocalUser[] = [];
    for (const input of inputs) {
      results.push(await userRepository.upsert(input));
    }
    return results;
  }

  async getUserById(id: string): Promise<LocalUser | null> {
    return userRepository.findById(id);
  }

  async setSessionUser(input: UpsertLocalUserInput): Promise<LocalUser> {
    const user = await userRepository.upsert(input);
    notifyCurrentUserId(user.id);
    return user;
  }

  async clearSession(): Promise<void> {
    notifyCurrentUserId(null);
    await userRepository.deleteAll();
  }
}

export const userService = new UserService();
