import { eq } from 'drizzle-orm';
import { db } from './client';
import { sessions, users } from './schema';

// Creates a new user account in the database
// It first checks if the email is already being used
export async function registerUser(
  username: string,
  email: string,
  password: string
) {
  const existingUser = await db
    .select()
    .from(users)
    .where(eq(users.email, email));

  if (existingUser.length > 0) {
    throw new Error('Email already in use');
  }

  await db.insert(users).values({
    username,
    email,
    password,
  });
}

// Logs a user in if the email and password match
// It clears old sessions and creates a new active session
export async function loginUser(email: string, password: string) {
  const matchedUsers = await db
    .select()
    .from(users)
    .where(eq(users.email, email));

  if (matchedUsers.length === 0) {
    throw new Error('User not found');
  }

  const user = matchedUsers[0];

  if (user.password !== password) {
    throw new Error('Incorrect password');
  }

  await db.delete(sessions);

  await db.insert(sessions).values({
    userId: user.id,
    isLoggedIn: true,
  });

  return user;
}

// Returns the currently logged in user if a session exists
// This is used when the app starts to check login state
export async function getCurrentUser() {
  const activeSessions = await db
    .select()
    .from(sessions)
    .where(eq(sessions.isLoggedIn, true));

  if (activeSessions.length === 0) {
    return null;
  }

  const session = activeSessions[0];

  const matchedUsers = await db
    .select()
    .from(users)
    .where(eq(users.id, session.userId));

  if (matchedUsers.length === 0) {
    return null;
  }

  return matchedUsers[0];
}

// Logs the user out by removing the current session
export async function logoutUser() {
  await db.delete(sessions);
}

// Deletes the current user account and clears the session
// This is used when the user chooses to remove their profile
export async function deleteCurrentUser() {
  const activeUser = await getCurrentUser();

  if (!activeUser) {
    throw new Error('No logged in user found');
  }

  await db.delete(users).where(eq(users.id, activeUser.id));
  await db.delete(sessions);
}