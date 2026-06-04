import { OAuth2Client } from "google-auth-library";
import { Request, Response, NextFunction } from "express";

declare module "express-session" {
  interface SessionData {
    isAdmin?: boolean;
    user?: { email: string; name: string; picture: string };
    returnTo?: string;
  }
}

function getClient() {
  const callbackUrl =
    process.env.GOOGLE_CALLBACK_URL ??
    `http://localhost:5151/auth/google/callback`;
  return new OAuth2Client(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    callbackUrl
  );
}

export function getGoogleAuthUrl(): string {
  return getClient().generateAuthUrl({
    access_type: "offline",
    scope: ["profile", "email"],
    prompt: "select_account",
  });
}

export async function getGoogleUser(code: string): Promise<{
  email: string;
  name: string;
  picture: string;
}> {
  const client = getClient();
  const { tokens } = await client.getToken(code);
  const ticket = await client.verifyIdToken({
    idToken: tokens.id_token!,
    audience: process.env.GOOGLE_CLIENT_ID,
  });
  const p = ticket.getPayload()!;
  return {
    email: p.email ?? "",
    name: p.name ?? p.email ?? "",
    picture: p.picture ?? "",
  };
}

export function isAdminEmail(email: string): boolean {
  return !!email && email === (process.env.ADMIN_EMAIL ?? "");
}

export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  if (req.session?.isAdmin) { next(); return; }
  req.session.returnTo = req.originalUrl;
  res.redirect("/auth/google");
}
