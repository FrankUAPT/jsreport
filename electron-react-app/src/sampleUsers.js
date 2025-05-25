import { createUser } from './data_models/User';

export const userAlice = createUser("Alice Wonderland", "alice@example.com");
export const userBob = createUser("Bob The Builder", "bob@example.com");
export const userCharlie = createUser("Charlie Brown", "charlie@example.com");
export const userDiana = createUser("Diana Prince", "diana@example.com");
export const userEdward = createUser("Edward Scissorhands", "edward@example.com");
export const userFiona = createUser("Princess Fiona", "fiona@example.com");

export const sampleUsers = [
  userAlice,
  userBob,
  userCharlie,
  userDiana,
  userEdward,
  userFiona,
];

// Create a map for easy lookup by ID
export const usersById = sampleUsers.reduce((acc, user) => {
  acc[user.id] = user;
  return acc;
}, {});
