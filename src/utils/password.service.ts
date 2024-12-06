import { promisify } from 'util';
import * as crypto from 'crypto';

export class PasswordService {
  private static readonly ITERATIONS = 100000;
  private static readonly KEY_LENGTH = 64;
  private static readonly DIGEST = 'sha512';

  static async hash(password: string): Promise<string> {
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = await promisify(crypto.pbkdf2)(
      password,
      salt,
      this.ITERATIONS,
      this.KEY_LENGTH,
      this.DIGEST
    );
    return `${salt}:${hash.toString('hex')}`;
  }

  static async verify(password: string, hashedPassword: string): Promise<boolean> {
    const [salt, storedHash] = hashedPassword.split(':');
    const hash = await promisify(crypto.pbkdf2)(
      password,
      salt,
      this.ITERATIONS,
      this.KEY_LENGTH,
      this.DIGEST
    );
    return storedHash === hash.toString('hex');
  }
}