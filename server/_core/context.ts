import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { and, eq, isNull } from "drizzle-orm";
import { customAccounts, users } from "../../drizzle/schema";
import { getDb } from "../db";
import { verifyCustomToken } from "../customAuth";
import { sdk } from "./sdk";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;

  try {
    user = await sdk.authenticateRequest(opts.req);
  } catch (error) {
    // Authentication is optional for public procedures.
    user = null;
  }

  // Charity staff use the app's custom JWT cookie rather than Manus OAuth. When
  // a verified custom account has a matching app user, expose that user to tRPC
  // so role-gated routes (including system administration) remain protected and
  // do not fall back to an unrelated OAuth sign-in flow.
  if (!user) {
    const token = opts.req.cookies?.sb_token as string | undefined;
    const payload = token ? await verifyCustomToken(token) : null;
    const db = payload ? await getDb() : null;

    if (payload && db) {
      const [account] = await db
        .select({ id: customAccounts.id, tenantId: customAccounts.tenantId, email: customAccounts.email, isVerified: customAccounts.isVerified })
        .from(customAccounts)
        .where(and(eq(customAccounts.id, payload.accountId), eq(customAccounts.email, payload.email)))
        .limit(1);

      if (account?.isVerified) {
        const tenantCondition = account.tenantId === null
          ? isNull(users.tenantId)
          : eq(users.tenantId, account.tenantId);
        const [customUser] = await db
          .select()
          .from(users)
          .where(and(eq(users.email, account.email), tenantCondition))
          .limit(1);
        user = customUser ?? null;
      }
    }
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
  };
}
