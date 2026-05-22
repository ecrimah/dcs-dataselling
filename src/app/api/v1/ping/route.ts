import { corsPreflightResponse, handleApi } from "../_lib/respond";

export const dynamic = "force-dynamic";

export const GET = handleApi(async ({ ctx }) => ({
  json: {
    ok: true,
    vendor: { id: ctx.vendorId, name: ctx.vendorName, slug: ctx.vendorSlug },
    server_time: new Date().toISOString(),
  },
}));

export function OPTIONS() {
  return corsPreflightResponse();
}
