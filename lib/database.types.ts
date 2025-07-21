
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
      activity_logs: {
        Row: {
          id: number
          plot_id: number
          activity_type: Database["public"]["Enums"]["activity_type"]
          date: string
          description: string
          materials_used: string | null
          personnel: string | null
          created_at: string
        }
        Insert: {
          id?: number
          plot_id: number
          activity_type: Database["public"]["Enums"]["activity_type"]
          date: string
          description: string
          materials_used?: string | null
          personnel?: string | null
          created_at?: string
        }
        Update: {
          id?: number
          plot_id?: number
          activity_type?: Database["public"]["Enums"]["activity_type"]
          date?: string
          description?: string
          materials_used?: string | null
          personnel?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "activity_logs_plot_id_fkey"
            columns: ["plot_id"]
            isOneToOne: false
            referencedRelation: "plots"
            referencedColumns: ["id"]
          },
        ]
      }
      crops: {
        Row: {
          id: number
          name: string
          status: Database["public"]["Enums"]["crop_status"]
          planting_date: string
          expected_harvest: string | null
          image_url: string | null
          optimal_temp: Json | null
          optimal_humidity: Json | null
          created_at: string
        }
        Insert: {
          id?: number
          name: string
          status: Database["public"]["Enums"]["crop_status"]
          planting_date: string
          expected_harvest?: string | null
          image_url?: string | null
          optimal_temp?: Json | null
          optimal_humidity?: Json | null
          created_at?: string
        }
        Update: {
          id?: number
          name?: string
          status?: Database["public"]["Enums"]["crop_status"]
          planting_date?: string
          expected_harvest?: string | null
          image_url?: string | null
          optimal_temp?: Json | null
          optimal_humidity?: Json | null
          created_at?: string
        }
        Relationships: []
      }
      customers: {
        Row: {
          id: number
          name: string
          contact_person: string | null
          phone: string | null
          email: string | null
          address: string | null
          created_at: string
        }
        Insert: {
          id?: number
          name: string
          contact_person?: string | null
          phone?: string | null
          email?: string | null
          address?: string | null
          created_at?: string
        }
        Update: {
          id?: number
          name?: string
          contact_person?: string | null
          phone?: string | null
          email?: string | null
          address?: string | null
          created_at?: string
        }
        Relationships: []
      }
      devices: {
        Row: {
          id: number
          name: string
          type: Database["public"]["Enums"]["device_type"]
          status: Database["public"]["Enums"]["device_status"]
          created_at: string
        }
        Insert: {
          id?: number
          name: string
          type: Database["public"]["Enums"]["device_type"]
          status?: Database["public"]["Enums"]["device_status"]
          created_at?: string
        }
        Update: {
          id?: number
          name?: string
          type?: Database["public"]["Enums"]["device_type"]
          status?: Database["public"]["Enums"]["device_status"]
          created_at?: string
        }
        Relationships: []
      }
      employees: {
        Row: {
          id: number
          first_name: string
          last_name: string
          nickname: string | null
          date_of_birth: string | null
          national_id: string | null
          address: string | null
          phone: string | null
          email: string | null
          start_date: string
          position: string
          salary: number | null
          contract_url: string | null
          training_history: Json | null
          created_at: string
        }
        Insert: {
          id?: number
          first_name: string
          last_name: string
          nickname?: string | null
          date_of_birth?: string | null
          national_id?: string | null
          address?: string | null
          phone?: string | null
          email?: string | null
          start_date: string
          position: string
          salary?: number | null
          contract_url?: string | null
          training_history?: Json | null
          created_at?: string
        }
        Update: {
          id?: number
          first_name?: string
          last_name?: string
          nickname?: string | null
          date_of_birth?: string | null
          national_id?: string | null
          address?: string | null
          phone?: string | null
          email?: string | null
          start_date?: string
          position?: string
          salary?: number | null
          contract_url?: string | null
          training_history?: Json | null
          created_at?: string
        }
        Relationships: []
      }
      farm_settings: {
        Row: {
          id: number
          info: Json
          created_at: string
        }
        Insert: {
          id?: number
          info: Json
          created_at?: string
        }
        Update: {
          id?: number
          info?: Json
          created_at?: string
        }
        Relationships: []
      }
      inventory_items: {
        Row: {
          id: number
          name: string
          category: string | null
          quantity: number
          unit: string
          low_stock_threshold: number
          created_at: string
        }
        Insert: {
          id?: number
          name: string
          category?: string | null
          quantity: number
          unit: string
          low_stock_threshold?: number
          created_at?: string
        }
        Update: {
          id?: number
          name?: string
          category?: string | null
          quantity?: number
          unit?: string
          low_stock_threshold?: number
          created_at?: string
        }
        Relationships: []
      }
      ledger_entries: {
        Row: {
          id: number
          date: string
          description: string
          type: Database["public"]["Enums"]["ledger_type"]
          amount: number
          crop_id: number | null
          created_at: string
        }
        Insert: {
          id?: number
          date: string
          description: string
          type: Database["public"]["Enums"]["ledger_type"]
          amount: number
          crop_id?: number | null
          created_at?: string
        }
        Update: {
          id?: number
          date?: string
          description?: string
          type?: Database["public"]["Enums"]["ledger_type"]
          amount?: number
          crop_id?: number | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ledger_entries_crop_id_fkey"
            columns: ["crop_id"]
            isOneToOne: false
            referencedRelation: "crops"
            referencedColumns: ["id"]
          },
        ]
      }
      leave_requests: {
        Row: {
          id: number
          employee_id: number
          leave_type: Database["public"]["Enums"]["leave_request_type"]
          start_date: string
          end_date: string
          reason: string
          status: Database["public"]["Enums"]["leave_request_status"]
          created_at: string
        }
        Insert: {
          id?: number
          employee_id: number
          leave_type: Database["public"]["Enums"]["leave_request_type"]
          start_date: string
          end_date: string
          reason: string
          status?: Database["public"]["Enums"]["leave_request_status"]
          created_at?: string
        }
        Update: {
          id?: number
          employee_id?: number
          leave_type?: Database["public"]["Enums"]["leave_request_type"]
          start_date?: string
          end_date?: string
          reason?: string
          status?: Database["public"]["Enums"]["leave_request_status"]
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "leave_requests_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      payrolls: {
        Row: {
          id: number
          employee_id: number
          period: string
          pay_date: string
          gross_pay: number
          deductions: number
          net_pay: number
          created_at: string
        }
        Insert: {
          id?: number
          employee_id: number
          period: string
          pay_date: string
          gross_pay: number
          deductions: number
          net_pay: number
          created_at?: string
        }
        Update: {
          id?: number
          employee_id?: number
          period?: string
          pay_date?: string
          gross_pay?: number
          deductions?: number
          net_pay?: number
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payrolls_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      plots: {
        Row: {
          id: number
          name: string
          description: string | null
          current_crop_id: number | null
          created_at: string
        }
        Insert: {
          id?: number
          name: string
          description?: string | null
          current_crop_id?: number | null
          created_at?: string
        }
        Update: {
          id?: number
          name?: string
          description?: string | null
          current_crop_id?: number | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "plots_current_crop_id_fkey"
            columns: ["current_crop_id"]
            isOneToOne: false
            referencedRelation: "crops"
            referencedColumns: ["id"]
          },
        ]
      }
      roles: {
        Row: {
          id: number
          name: string
          permissions: Json
          created_at: string
        }
        Insert: {
          id?: number
          name: string
          permissions: Json
          created_at?: string
        }
        Update: {
          id?: number
          name?: string
          permissions?: Json
          created_at?: string
        }
        Relationships: []
      }
      sales_orders: {
        Row: {
          id: number
          customer_id: number
          order_date: string
          status: Database["public"]["Enums"]["order_status"]
          items: Json
          total_amount: number
          created_at: string
        }
        Insert: {
          id?: number
          customer_id: number
          order_date: string
          status?: Database["public"]["Enums"]["order_status"]
          items: Json
          total_amount: number
          created_at?: string
        }
        Update: {
          id?: number
          customer_id?: number
          order_date?: string
          status?: Database["public"]["Enums"]["order_status"]
          items?: Json
          total_amount?: number
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sales_orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          id: number
          employee_id: number
          task_description: string
          assigned_date: string
          due_date: string | null
          status: Database["public"]["Enums"]["task_status"]
          created_at: string
        }
        Insert: {
          id?: number
          employee_id: number
          task_description: string
          assigned_date: string
          due_date?: string | null
          status?: Database["public"]["Enums"]["task_status"]
          created_at?: string
        }
        Update: {
          id?: number
          employee_id?: number
          task_description?: string
          assigned_date?: string
          due_date?: string | null
          status?: Database["public"]["Enums"]["task_status"]
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      time_logs: {
        Row: {
          id: number
          employee_id: number
          timestamp: string
          type: string
          created_at: string
        }
        Insert: {
          id?: number
          employee_id: number
          timestamp: string
          type: string
          created_at?: string
        }
        Update: {
          id?: number
          employee_id?: number
          timestamp?: string
          type?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "time_logs_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          id: number
          username: string
          employee_id: number
          role_id: number
          created_at: string
        }
        Insert: {
          id?: number
          username: string
          employee_id: number
          role_id: number
          created_at?: string
        }
        Update: {
          id?: number
          username?: string
          employee_id?: number
          role_id?: number
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "users_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: true
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "users_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      activity_type: "เพาะปลูก" | "ให้ปุ๋ย" | "กำจัดศัตรูพืช" | "รดน้ำ" | "เก็บเกี่ยว"
      crop_status: "Planted" | "Growing" | "Harvest Ready"
      device_status: "Active" | "Inactive" | "Error"
      device_type: "Sensor" | "Pump" | "Light"
      leave_request_status: "Pending" | "Approved" | "Rejected"
      leave_request_type: "ลาป่วย" | "ลากิจ" | "ลาพักร้อน"
      ledger_type: "income" | "expense"
      order_status: "Quote" | "Confirmed" | "Shipped" | "Completed" | "Cancelled"
      task_status: "To Do" | "In Progress" | "Done"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
