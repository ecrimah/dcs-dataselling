export type SetupPaymentResume = {
  reference: string;
  slug: string;
  businessName: string | null;
  amount: number;
  paidAt: string | null;
};
