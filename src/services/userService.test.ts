import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { UserService } from './userService';
import User from '@/models/User';

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
    await expect(userService.createUser({} as any)).rejects.toThrow('Please provide all required fields');
  });

  it('throws if user already exists', async () => {
    const userData = {
      name: 'Bob',
      email: 'bob@example.com',
      password: 'password123',
    };
    await userService.createUser(userData);
    await expect(userService.createUser(userData)).rejects.toThrow('User already exists');
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
    await expect(userService.updateUser(user2.email, { email: user1.email })).rejects.toThrow('Email is already taken');
  });

  it('throws when updating a non-existent user', async () => {
    await expect(userService.updateUser('ghost@example.com', { name: 'Ghost' })).rejects.toThrow('User not found');
  });
}); 