import { handleOptions, jsonResponse } from "../_shared/cors.ts";
import {
  assertCanWrite,
  createServiceClient,
  requirePlatformAdmin,
  requireUser,
  writeAudit,
} from "../_shared/admin.ts";

type Handler = (ctx: {
  req: Request;
  body: Record<string, unknown>;
  userId: string;
  role: string;
  service: ReturnType<typeof createServiceClient>;
}) => Promise<Response>;

export function adminHandler(action: string, opts: { write?: boolean }, handler: Handler) {
  return async (req: Request): Promise<Response> => {
    const opt = handleOptions(req);
    if (opt) return opt;
    try {
      if (req.method !== "POST") return jsonResponse({ error: "Method not allowed" }, 405);
      const { user } = await requireUser(req);
      const service = createServiceClient();
      const admin = await requirePlatformAdmin(service, user.id);
      if (opts.write) assertCanWrite(admin.platform_role);
      const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
      const res = await handler({
        req,
        body,
        userId: user.id,
        role: admin.platform_role,
        service,
      });
      return res;
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      const status = message.startsWith("Forbidden")
        ? 403
        : message.includes("Unauthorized") || message.includes("Authorization")
          ? 401
          : 400;
      return jsonResponse({ error: message, action }, status);
    }
  };
}

export { writeAudit, jsonResponse };
