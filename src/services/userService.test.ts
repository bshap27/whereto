import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { UserService } from './userService';
import User from '@/models/User';
import { USER_ERRORS, AUTH_ERRORS, VALIDATION_ERRORS } from '@/constants/errors';

describe('UserService (integration with mongodb-memory-server)', () => {
  let mongoServer: MongoMemoryServer;
  let userService: UserService;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);
    userService = new UserService();
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    await User.deleteMany({});
  });

  it('creates a user successfully', async () => {
    const userData = {
      name: 'Alice',
      email: 'alice@example.com',
      password: 'password123',
    };
    const user = await userService.createUser(userData);
    expect(user).toMatchObject({
      name: userData.name,
      email: userData.email,
    });
    expect(user.id).toBeDefined();
    const dbUser = await User.findOne({ email: userData.email });
    expect(dbUser).not.toBeNull();
    expect(dbUser!.password).not.toBe(userData.password); // Should be hashed
  });

  it('throws if required fields are missing', async () => {
    await expect(userService.createUser({} as any)).rejects.toThrow(USER_ERRORS.REQUIRED_FIELDS_MISSING);
  });

  it('throws if user already exists', async () => {
    const userData = {
      name: 'Bob',
      email: 'bob@example.com',
      password: 'password123',
    };
    await userService.createUser(userData);
    await expect(userService.createUser(userData)).rejects.toThrow(USER_ERRORS.USER_ALREADY_EXISTS);
  });

  it('finds user by email', async () => {
    const userData = {
      name: 'Carol',
      email: 'carol@example.com',
      password: 'password123',
    };
    await userService.createUser(userData);
    const found = await userService.findUserByEmail(userData.email);
    expect(found).not.toBeNull();
    expect(found!.email).toBe(userData.email);
  });

  it('returns null for non-existent email', async () => {
    const found = await userService.findUserByEmail('nope@example.com');
    expect(found).toBeNull();
  });

  it('updates a user', async () => {
    const userData = {
      name: 'Dave',
      email: 'dave@example.com',
      password: 'password123',
    };
    await userService.createUser(userData);
    const updated = await userService.updateUser(userData.email, { name: 'David' });
    expect(updated.name).toBe('David');
    expect(updated.email).toBe(userData.email);
  });

  it('throws when updating to an existing email', async () => {
    const user1 = { name: 'Eve', email: 'eve@example.com', password: 'password123' };
    const user2 = { name: 'Frank', email: 'frank@example.com', password: 'password123' };
    await userService.createUser(user1);
    await userService.createUser(user2);
    await expect(userService.updateUser(user2.email, { email: user1.email })).rejects.toThrow(USER_ERRORS.EMAIL_ALREADY_TAKEN);
  });

  it('throws when updating a non-existent user', async () => {
    await expect(userService.updateUser('ghost@example.com', { name: 'Ghost' })).rejects.toThrow(AUTH_ERRORS.USER_NOT_FOUND);
  });

  describe('Password Reset', () => {
    it('generates reset token for existing user', async () => {
      const userData = {
        name: 'Grace',
        email: 'grace@example.com',
        password: 'password123',
      };
      await userService.createUser(userData);

      const resetData = await userService.generateResetToken(userData.email);
      
      expect(resetData.resetToken).toBeDefined();
      expect(resetData.resetTokenExpiry).toBeInstanceOf(Date);
      expect(resetData.resetTokenExpiry.getTime()).toBeGreaterThan(Date.now());

      // Check that token was saved to database
      const dbUser = await User.findOne({ email: userData.email });
      expect(dbUser!.resetToken).toBeDefined();
      expect(dbUser!.resetTokenExpiry).toBeDefined();
    });

    it('throws when generating reset token for non-existent user', async () => {
      await expect(userService.generateResetToken('nonexistent@example.com')).rejects.toThrow(AUTH_ERRORS.USER_NOT_FOUND);
    });

    it('resets password with valid token', async () => {
      const userData = {
        name: 'Henry',
        email: 'henry@example.com',
        password: 'oldpassword123',
      };
      await userService.createUser(userData);

      // Generate reset token
      const { resetToken } = await userService.generateResetToken(userData.email);

      // Reset password
      const newPassword = 'newpassword456';
      await userService.resetPassword(resetToken, newPassword);

      // Verify password was changed
      const dbUser = await User.findOne({ email: userData.email });
      expect(dbUser!.password).not.toBe('oldpassword123');
      expect(dbUser!.resetToken).toBeUndefined();
      expect(dbUser!.resetTokenExpiry).toBeUndefined();
    });

    it('throws when resetting password with invalid token', async () => {
      await expect(userService.resetPassword('invalid-token', 'newpassword123')).rejects.toThrow(AUTH_ERRORS.INVALID_RESET_TOKEN);
    });

    it('throws when resetting password with short password', async () => {
      const userData = {
        name: 'Ivy',
        email: 'ivy@example.com',
        password: 'password123',
      };
      await userService.createUser(userData);

      const { resetToken } = await userService.generateResetToken(userData.email);

      await expect(userService.resetPassword(resetToken, '123')).rejects.toThrow(VALIDATION_ERRORS.PASSWORD_TOO_SHORT);
    });

    it('clears reset token', async () => {
      const userData = {
        name: 'Jack',
        email: 'jack@example.com',
        password: 'password123',
      };
      await userService.createUser(userData);

      // Generate reset token
      await userService.generateResetToken(userData.email);

      // Clear reset token
      await userService.clearResetToken(userData.email);

      // Verify token was cleared
      const dbUser = await User.findOne({ email: userData.email });
      expect(dbUser!.resetToken).toBeUndefined();
      expect(dbUser!.resetTokenExpiry).toBeUndefined();
    });

    it('clears reset token for non-existent user without error', async () => {
      await expect(userService.clearResetToken('nonexistent@example.com')).resolves.not.toThrow();
    });
  });
}); 