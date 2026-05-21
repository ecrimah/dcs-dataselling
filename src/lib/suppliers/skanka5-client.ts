import "server-only";

import {
  isSkanka5Configured,
  pingSupplier,
  submitBulkOrder,
  submitSingleOrder,
} from "./skanka5";
import type {
  SupplierClient,
  SupplierSubmitBulkParams,
  SupplierSubmitResult,
  SupplierSubmitSingleParams,
} from "./types";

export const skanka5Client: SupplierClient = {
  id: "skanka5",
  label: "Skanka5",
  isConfigured: () => isSkanka5Configured(),

  async submitSingle(params: SupplierSubmitSingleParams): Promise<SupplierSubmitResult> {
    const r = await submitSingleOrder({
      network: params.network,
      msisdn: params.msisdn,
      volumeMb: params.volumeMb,
      reference: params.reference,
      scope: params.scope,
    });
    if (!r.ok) {
      return { ok: false, error: r.error, httpStatus: r.status, rawResponse: r.data };
    }
    const first = r.data.orders?.[0];
    return {
      ok: true,
      reference: r.data.reference,
      orderCode: first?.order_code,
      status: first?.status ?? r.data.status,
      orders: r.data.orders,
      rawResponse: r.data,
      httpStatus: r.status,
    };
  },

  async submitBulk(params: SupplierSubmitBulkParams): Promise<SupplierSubmitResult> {
    const r = await submitBulkOrder({
      network: params.network,
      recipients: params.recipients,
      reference: params.reference,
      scope: params.scope,
    });
    if (!r.ok) {
      return { ok: false, error: r.error, httpStatus: r.status, rawResponse: r.data };
    }
    return {
      ok: true,
      reference: r.data.reference,
      status: r.data.status,
      orders: r.data.orders,
      rawResponse: r.data,
      httpStatus: r.status,
    };
  },

  async ping() {
    const r = await pingSupplier();
    return { ok: r.ok, error: r.ok ? undefined : r.error, raw: r.ok ? r.data : r.data };
  },
};
