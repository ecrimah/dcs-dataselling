import { NETWORKS } from "@/lib/constants";

import { corsPreflightResponse, handleApi } from "../_lib/respond";

export const dynamic = "force-dynamic";

export const GET = handleApi(async () => ({
  json: {
    networks: NETWORKS.map((n) => ({ id: n.id, name: n.name })),
  },
}));

export function OPTIONS() {
  return corsPreflightResponse();
}
