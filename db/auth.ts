import { eq } from 'drizzle-orm';
import { db } from './client';
import { sessions, users } from './schema';

// Sign up checks for duplicate email first so we can show a clear error before insert.
// Reference: https://orm.drizzle.team/docs/overview
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

// Login uses one active local session row which keeps startup auth checks straightforward.
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

// Called on app launch and tab refreshes to map session row back to a user record.
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

// Logout only clears session state so account data stays available unless deleted.
export async function logoutUser() {
  await db.delete(sessions);
}

// Account delete removes both user and session so the app returns to a clean login state.
export async function deleteCurrentUser() {
  const activeUser = await getCurrentUser();

  if (!activeUser) {
    throw new Error('No logged in user found');
  }

  await db.delete(users).where(eq(users.id, activeUser.id));
  await db.delete(sessions);
}