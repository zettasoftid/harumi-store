export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  public: {
    Tables: {
      admin_users: {
        Row: {
          auth_user_id: string | null
          created_at: string
          id: string
          is_active: boolean
          label: string | null
          phone: string | null
        }
        Insert: {
          auth_user_id?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          label?: string | null
          phone?: string | null
        }
        Update: {
          auth_user_id?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          label?: string | null
          phone?: string | null
        }
        Relationships: []
      }
      categories: {
        Row: {
          created_at: string
          id: string
          name: string
          slug: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          slug: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          slug?: string
        }
        Relationships: []
      }
      checkout_intents: {
        Row: {
          created_at: string
          customer_id: string
          id: string
          product_id: string
          qty: number
          source: string | null
          stock_status: string
          subtotal: number
          unit_price: number
          variant_id: string
        }
        Insert: {
          created_at?: string
          customer_id: string
          id?: string
          product_id: string
          qty: number
          source?: string | null
          stock_status: string
          subtotal?: never
          unit_price: number
          variant_id: string
        }
        Update: {
          created_at?: string
          customer_id?: string
          id?: string
          product_id?: string
          qty?: number
          source?: string | null
          stock_status?: string
          subtotal?: never
          unit_price?: number
          variant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "checkout_intents_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customer_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checkout_intents_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checkout_intents_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_profiles: {
        Row: {
          address: string
          auth_user_id: string
          created_at: string
          id: string
          name: string
          phone: string
          updated_at: string
        }
        Insert: {
          address: string
          auth_user_id: string
          created_at?: string
          id?: string
          name: string
          phone: string
          updated_at?: string
        }
        Update: {
          address?: string
          auth_user_id?: string
          created_at?: string
          id?: string
          name?: string
          phone?: string
          updated_at?: string
        }
        Relationships: []
      }
      product_images: {
        Row: {
          alt_text: string | null
          created_at: string
          id: string
          image_path: string
          is_primary: boolean
          product_id: string
          sort_order: number
        }
        Insert: {
          alt_text?: string | null
          created_at?: string
          id?: string
          image_path: string
          is_primary?: boolean
          product_id: string
          sort_order?: number
        }
        Update: {
          alt_text?: string | null
          created_at?: string
          id?: string
          image_path?: string
          is_primary?: boolean
          product_id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "product_images_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_variants: {
        Row: {
          color: string | null
          created_at: string
          hpp: number
          id: string
          is_active: boolean
          product_id: string
          selling_price: number
          size: string
          sku: string | null
          stock: number
          updated_at: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          hpp?: number
          id?: string
          is_active?: boolean
          product_id: string
          selling_price?: number
          size: string
          sku?: string | null
          stock?: number
          updated_at?: string
        }
        Update: {
          color?: string | null
          created_at?: string
          hpp?: number
          id?: string
          is_active?: boolean
          product_id?: string
          selling_price?: number
          size?: string
          sku?: string | null
          stock?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_variants_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          category_id: string
          condition_note: string | null
          created_at: string
          description: string
          id: string
          is_active: boolean
          name: string
          slug: string
          updated_at: string
        }
        Insert: {
          category_id: string
          condition_note?: string | null
          created_at?: string
          description: string
          id?: string
          is_active?: boolean
          name: string
          slug: string
          updated_at?: string
        }
        Update: {
          category_id?: string
          condition_note?: string | null
          created_at?: string
          description?: string
          id?: string
          is_active?: boolean
          name?: string
          slug?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      sale_items: {
        Row: {
          created_at: string
          gross_revenue: number
          hpp: number
          id: string
          net_profit: number
          product_id: string
          qty: number
          sale_id: string
          selling_price: number
          total_hpp: number
          variant_id: string
        }
        Insert: {
          created_at?: string
          gross_revenue?: never
          hpp: number
          id?: string
          net_profit?: never
          product_id: string
          qty: number
          sale_id: string
          selling_price: number
          total_hpp?: never
          variant_id: string
        }
        Update: {
          created_at?: string
          gross_revenue?: never
          hpp?: number
          id?: string
          net_profit?: never
          product_id?: string
          qty?: number
          sale_id?: string
          selling_price?: number
          total_hpp?: never
          variant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sale_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sale_items_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sale_items_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      sales: {
        Row: {
          created_at: string
          customer_address_snapshot: string | null
          customer_id: string | null
          customer_name: string | null
          customer_phone: string | null
          id: string
          note: string | null
          other_cost: number
          sale_date: string
        }
        Insert: {
          created_at?: string
          customer_address_snapshot?: string | null
          customer_id?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          id?: string
          note?: string | null
          other_cost?: number
          sale_date?: string
        }
        Update: {
          created_at?: string
          customer_address_snapshot?: string | null
          customer_id?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          id?: string
          note?: string | null
          other_cost?: number
          sale_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "sales_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customer_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      store_settings: {
        Row: {
          admin_whatsapp: string
          id: string
          instagram_url: string | null
          store_name: string
          updated_at: string
        }
        Insert: {
          admin_whatsapp?: string
          id?: string
          instagram_url?: string | null
          store_name?: string
          updated_at?: string
        }
        Update: {
          admin_whatsapp?: string
          id?: string
          instagram_url?: string | null
          store_name?: string
          updated_at?: string
        }
        Relationships: []
      }
      wa_click_events: {
        Row: {
          checkout_intent_id: string | null
          created_at: string
          customer_id: string | null
          id: string
          product_id: string | null
          referrer: string | null
          source: string | null
          variant_id: string | null
        }
        Insert: {
          checkout_intent_id?: string | null
          created_at?: string
          customer_id?: string | null
          id?: string
          product_id?: string | null
          referrer?: string | null
          source?: string | null
          variant_id?: string | null
        }
        Update: {
          checkout_intent_id?: string | null
          created_at?: string
          customer_id?: string | null
          id?: string
          product_id?: string | null
          referrer?: string | null
          source?: string | null
          variant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "wa_click_events_checkout_intent_id_fkey"
            columns: ["checkout_intent_id"]
            isOneToOne: false
            referencedRelation: "checkout_intents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wa_click_events_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customer_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wa_click_events_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wa_click_events_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: Record<string, never>
    Functions: {
      current_auth_phone: {
        Args: Record<PropertyKey, never>
        Returns: string | null
      }
      is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
    }
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}

export type Tables<T extends keyof Database["public"]["Tables"]> = Database["public"]["Tables"][T]["Row"]
export type Inserts<T extends keyof Database["public"]["Tables"]> = Database["public"]["Tables"][T]["Insert"]
export type Updates<T extends keyof Database["public"]["Tables"]> = Database["public"]["Tables"][T]["Update"]
