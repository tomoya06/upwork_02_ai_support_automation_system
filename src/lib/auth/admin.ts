import { timingSafeEqual } from "crypto";

export function getAdminCredentials(): { username: string; password: string } {
  const username = process.env.ADMIN_USERNAME;
  const password = process.env.ADMIN_PASSWORD;

  if (process.env.NODE_ENV === "production") {
    if (!username || !password) {
      throw new Error("ADMIN_USERNAME and ADMIN_PASSWORD must be set in production");
    }
  }

  return {
    username: username || "admin",
    password: password || "admin123",
  };
}

export function verifyAdminCredentials(
  input: { username: string; password: string }
): boolean {
  const { username, password } = getAdminCredentials();

  try {
    return (
      timingSafeEqual(Buffer.from(input.username), Buffer.from(username)) &&
      timingSafeEqual(Buffer.from(input.password), Buffer.from(password))
    );
  } catch {
    return false;
  }
}
