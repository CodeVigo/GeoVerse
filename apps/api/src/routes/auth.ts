import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import bcrypt from "bcryptjs";
import { prisma } from "@geoverse/db";

const COOKIE = "gv_token";
const THIRTY_DAYS = 60 * 60 * 24 * 30;

function setAuthCookie(reply: FastifyReply, token: string) {
  reply.setCookie(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: THIRTY_DAYS,
  });
}

function publicUser(u: {
  id: string;
  email: string;
  displayName: string | null;
  xp: number;
  streakCount: number;
  preferredMode: string;
}) {
  return {
    id: u.id,
    email: u.email,
    displayName: u.displayName,
    xp: u.xp,
    streakCount: u.streakCount,
    preferredMode: u.preferredMode,
  };
}

export async function authRoutes(app: FastifyInstance) {
  app.post<{ Body: { email?: string; password?: string; displayName?: string } }>(
    "/register",
    async (req, reply) => {
      const email = (req.body.email ?? "").trim().toLowerCase();
      const password = req.body.password ?? "";
      const displayName = (req.body.displayName ?? "").trim() || null;

      if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email))
        return reply.code(400).send({ error: "A valid email is required." });
      if (password.length < 6)
        return reply.code(400).send({ error: "Password must be at least 6 characters." });

      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing) return reply.code(409).send({ error: "That email is already registered." });

      const passwordHash = await bcrypt.hash(password, 10);
      const user = await prisma.user.create({
        data: { email, passwordHash, displayName },
      });

      const token = app.jwt.sign({ id: user.id, email: user.email });
      setAuthCookie(reply, token);
      return { user: publicUser(user) };
    },
  );

  app.post<{ Body: { email?: string; password?: string } }>("/login", async (req, reply) => {
    const email = (req.body.email ?? "").trim().toLowerCase();
    const password = req.body.password ?? "";

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.passwordHash)
      return reply.code(401).send({ error: "Invalid email or password." });

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return reply.code(401).send({ error: "Invalid email or password." });

    // Update streak: increment if last active was yesterday, reset if older, keep if today.
    const now = new Date();
    const last = user.lastActiveAt;
    let streakCount = user.streakCount;
    if (!last) {
      streakCount = 1;
    } else {
      const days = Math.floor((startOfDay(now) - startOfDay(last)) / 86_400_000);
      if (days === 1) streakCount += 1;
      else if (days > 1) streakCount = 1;
    }
    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { lastActiveAt: now, streakCount },
    });

    const token = app.jwt.sign({ id: user.id, email: user.email });
    setAuthCookie(reply, token);
    return { user: publicUser(updated) };
  });

  app.post("/logout", async (_req, reply) => {
    reply.clearCookie(COOKIE, { path: "/" });
    return { ok: true };
  });

  app.get("/me", async (req, reply) => {
    const user = await currentUser(req);
    if (!user) return reply.code(401).send({ error: "Not authenticated." });
    return { user: publicUser(user) };
  });

  app.patch<{ Body: { preferredMode?: string; displayName?: string } }>(
    "/me",
    async (req, reply) => {
      const me = await currentUser(req);
      if (!me) return reply.code(401).send({ error: "Not authenticated." });
      const data: Record<string, unknown> = {};
      if (req.body.preferredMode === "EXPLORE" || req.body.preferredMode === "EXAM")
        data.preferredMode = req.body.preferredMode;
      if (typeof req.body.displayName === "string")
        data.displayName = req.body.displayName.trim() || null;
      const updated = await prisma.user.update({ where: { id: me.id }, data });
      return { user: publicUser(updated) };
    },
  );
}

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

// Shared helper: resolve the logged-in user from the JWT cookie (or null).
export async function currentUser(req: FastifyRequest) {
  try {
    const payload = await req.jwtVerify<{ id: string }>();
    return prisma.user.findUnique({ where: { id: payload.id } });
  } catch {
    return null;
  }
}
