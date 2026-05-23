export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          full_name: string | null
          phone: string | null
          role: string | null
          address: string | null
          location: unknown | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id: string
          full_name?: string | null
          phone?: string | null
          role?: string | null
          address?: string | null
          location?: unknown | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          full_name?: string | null
          phone?: string | null
          role?: string | null
          address?: string | null
          location?: unknown | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      shops: {
        Row: {
          id: string
          owner_id: string | null
          shop_name: string
          address: string
          location: unknown | null
          pincode: string | null
          is_approved: boolean | null
          rating: number | null
          total_orders: number | null
          created_at: string | null
        }
        Insert: {
          id?: string
          owner_id?: string | null
          shop_name: string
          address: string
          location?: unknown | null
          pincode?: string | null
          is_approved?: boolean | null
          rating?: number | null
          total_orders?: number | null
          created_at?: string | null
        }
        Update: {
          id?: string
          owner_id?: string | null
          shop_name?: string
          address?: string
          location?: unknown | null
          pincode?: string | null
          is_approved?: boolean | null
          rating?: number | null
          total_orders?: number | null
          created_at?: string | null
        }
      }
      // Add other tables as needed...
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
