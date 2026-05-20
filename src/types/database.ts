export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  __InternalSupabase: { PostgrestVersion: "14.5" };
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          phone: string | null;
          role: Database["public"]["Enums"]["user_role"];
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["profiles"]["Row"]> & {
          id: string;
          email: string;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Row"]>;
        Relationships: [];
      };
      vendors: {
        Row: {
          id: string;
          user_id: string;
          slug: string;
          business_name: string;
          tagline: string | null;
          logo_url: string | null;
          status: Database["public"]["Enums"]["vendor_status"];
          verified: boolean;
          rating: number;
          total_orders: number;
          fulfilment_minutes: number;
          commission_rate: number;
          featured: boolean;
          compliance_notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["vendors"]["Row"]> & {
          user_id: string;
          slug: string;
          business_name: string;
        };
        Update: Partial<Database["public"]["Tables"]["vendors"]["Row"]>;
        Relationships: [];
      };
      bundles: {
        Row: {
          id: string;
          vendor_id: string;
          network: Database["public"]["Enums"]["network_id"];
          name: string;
          data_mb: number;
          validity_days: number;
          price: number;
          original_price: number | null;
          popular: boolean;
          recommended: boolean;
          active: boolean;
          sales_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["bundles"]["Row"]> & {
          vendor_id: string;
          network: Database["public"]["Enums"]["network_id"];
          name: string;
          data_mb: number;
          validity_days: number;
          price: number;
        };
        Update: Partial<Database["public"]["Tables"]["bundles"]["Row"]>;
        Relationships: [];
      };
      orders: {
        Row: {
          id: string;
          reference: string;
          user_id: string | null;
          vendor_id: string;
          bundle_id: string;
          recipient_phone: string;
          amount: number;
          platform_fee: number;
          vendor_payout: number;
          status: Database["public"]["Enums"]["order_status"];
          payment_provider: Database["public"]["Enums"]["payment_provider"] | null;
          payment_reference: string | null;
          idempotency_key: string | null;
          created_at: string;
          updated_at: string;
          paid_at: string | null;
          fulfilled_at: string | null;
        };
        Insert: Partial<Database["public"]["Tables"]["orders"]["Row"]> & {
          vendor_id: string;
          bundle_id: string;
          recipient_phone: string;
          amount: number;
        };
        Update: Partial<Database["public"]["Tables"]["orders"]["Row"]>;
        Relationships: [];
      };
    };
    Views: {
      marketplace_bundles: {
        Row: {
          id: string;
          vendor_id: string;
          network: Database["public"]["Enums"]["network_id"];
          name: string;
          data_mb: number;
          validity_days: number;
          price: number;
          original_price: number | null;
          popular: boolean;
          recommended: boolean;
          sales_count: number;
          created_at: string;
          vendor_slug: string;
          vendor_name: string;
          vendor_verified: boolean;
          vendor_rating: number;
          vendor_fulfilment_minutes: number;
          vendor_featured: boolean;
        };
      };
      vendor_metrics: {
        Row: {
          vendor_id: string;
          slug: string;
          business_name: string;
          fulfilled_orders: number;
          failed_orders: number;
          total_orders: number;
          gross_revenue: number;
          platform_fees: number;
          net_revenue: number;
          success_rate: number;
        };
      };
      platform_stats: {
        Row: {
          orders_today: number;
          orders_fulfilled_today: number;
          active_vendors: number;
          success_rate: number;
        };
      };
    };
    Enums: {
      dispute_status: "open" | "under_review" | "resolved" | "rejected";
      network_id: "mtn" | "telecel" | "at";
      notification_type: "order" | "payment" | "vendor" | "promo" | "system";
      order_status:
        | "pending"
        | "paid"
        | "queued"
        | "processing"
        | "fulfilled"
        | "failed"
        | "refunded";
      payment_provider: "paystack" | "moolre";
      payout_status: "pending" | "processing" | "paid" | "failed";
      user_role: "customer" | "vendor" | "admin" | "ops";
      vendor_status: "pending" | "approved" | "suspended" | "rejected";
    };
  };
};
