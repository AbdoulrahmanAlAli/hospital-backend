import { connectDatabase, disconnectDatabase } from '../config/database';
import { env } from '../config/env';
import { Roles } from '../constants/roles';
import { UserModel } from '../models/User.model';

const seed = async () => {
  await connectDatabase();

  const existing = await UserModel.findOne({ email: env.seedManagerEmail.toLowerCase() });
  if (existing) {
    console.log('Manager already exists:', env.seedManagerEmail);
    await disconnectDatabase();
    return;
  }

  await UserModel.create({
    name: env.seedManagerName,
    email: env.seedManagerEmail,
    password: env.seedManagerPassword,
    role: Roles.MANAGER
  });

  console.log('Seed manager created');
  console.log('Email:', env.seedManagerEmail);
  console.log('Password:', env.seedManagerPassword);
  await disconnectDatabase();
};

void seed().catch(async (error) => {
  console.error(error);
  await disconnectDatabase();
  process.exit(1);
});
