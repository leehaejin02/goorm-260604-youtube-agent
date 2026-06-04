import bcrypt from "bcryptjs";
import { Request, Response, NextFunction } from "express";

declare module "express-session" {
  interface SessionData {
    isAdmin?: boolean;
  }
}

let adminPasswordHash = "";

export async function initAuth(): Promise<void> {
  const plain = process.env.ADMIN_PASSWORD ?? "";
  if (!plain) {
    console.warn("⚠️  ADMIN_PASSWORD 환경변수가 설정되지 않았습니다.");
    return;
  }
  adminPasswordHash = await bcrypt.hash(plain, 10);
}

export async function verifyAdmin(email: string, password: string): Promise<boolean> {
  if (!adminPasswordHash) return false;
  return (
    email === (process.env.ADMIN_EMAIL ?? "") &&
    (await bcrypt.compare(password, adminPasswordHash))
  );
}

export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  if (req.session?.isAdmin) {
    next();
  } else {
    res.redirect("/admin/login");
  }
}
