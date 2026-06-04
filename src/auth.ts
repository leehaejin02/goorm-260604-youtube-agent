import bcrypt from "bcryptjs";
import { Request, Response, NextFunction } from "express";

declare module "express-session" {
  interface SessionData {
    isAdmin?: boolean;
  }
}

let adminPasswordHash = "";

// 동기 초기화 — 서버리스 콜드 스타트 호환
export function initAuth(): void {
  const plain = process.env.ADMIN_PASSWORD ?? "";
  if (!plain) {
    console.warn("⚠️  ADMIN_PASSWORD 환경변수가 설정되지 않았습니다.");
    return;
  }
  adminPasswordHash = bcrypt.hashSync(plain, 10);
}

export async function verifyAdmin(email: string, password: string): Promise<boolean> {
  if (!adminPasswordHash) return false;
  if (email !== (process.env.ADMIN_EMAIL ?? "")) return false;
  return bcrypt.compare(password, adminPasswordHash);
}

export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  if (req.session?.isAdmin) {
    next();
  } else {
    res.redirect("/admin/login");
  }
}
