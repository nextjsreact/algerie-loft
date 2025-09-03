import { z } from 'zod';

// Enhanced password validation
const passwordValidation = z.string()
  .min(8, "Password must be at least 8 characters")
  .regex(/^(?=.*[a-z])/, "Password must contain at least one lowercase letter")
  .regex(/^(?=.*[A-Z])/, "Password must contain at least one uppercase letter")
  .regex(/^(?=.*\d)/, "Password must contain at least one number");

export const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

export type LoginFormData = z.infer<typeof loginSchema>;

export const registerSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: passwordValidation,
  full_name: z.string().min(2, "Full name must be at least 2 characters").max(100, "Full name is too long"),
});

export const passwordResetSchema = z.object({
  password: passwordValidation,
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export type RegisterFormData = z.infer<typeof registerSchema>;

export const loftSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  address: z.string().min(1, "Address is required"),
  price_per_month: z.number().min(0, "Price must be a positive number"),
  status: z.enum(['available', 'occupied', 'maintenance']),
  owner_id: z.string().min(1, "Owner is required"),
  company_percentage: z.number().min(0).max(100).step(0.01),
  owner_percentage: z.number().min(0).max(100).step(0.01),
  zone_area_id: z.string().uuid("Invalid Zone Area ID").optional(),
  internet_connection_type_id: z.string().uuid("Invalid Internet Connection Type ID").optional(),
  water_customer_code: z.string().optional(),
  water_contract_code: z.string().optional(),
  water_meter_number: z.string().optional(),
  water_correspondent: z.string().optional(),
  electricity_pdl_ref: z.string().optional(),
  electricity_customer_number: z.string().optional(),
  electricity_meter_number: z.string().optional(),
  electricity_correspondent: z.string().optional(),
  gas_pdl_ref: z.string().optional(),
  gas_customer_number: z.string().optional(),
  gas_meter_number: z.string().optional(),
  gas_correspondent: z.string().optional(),
  phone_number: z.string().optional(),
  frequence_paiement_eau: z.string().optional(),
  prochaine_echeance_eau: z.string().optional(),
  frequence_paiement_energie: z.string().optional(),
  prochaine_echeance_energie: z.string().optional(),
  frequence_paiement_telephone: z.string().optional(),
  prochaine_echeance_telephone: z.string().optional(),
  frequence_paiement_internet: z.string().optional(),
  prochaine_echeance_internet: z.string().optional(),
});

export type LoftFormData = z.infer<typeof loftSchema>;

export const taskSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().nullable().optional(),
  status: z.enum(['todo', 'in_progress', 'completed']),
  due_date: z.string().nullable().optional(), // Change to string to match HTML input
  assigned_to: z.string().nullable().optional(), // Allow null for unassigned
  team_id: z.string().nullable().optional(),
  loft_id: z.string().nullable().optional()
});

// Schema for members who can only update task status
export const taskStatusUpdateSchema = z.object({
  status: z.enum(['todo', 'in_progress', 'completed']),
});

export const transactionSchema = z.object({
  amount: z.number().min(0.01, "Amount must be positive"),
  transaction_type: z.enum(['income', 'expense']),
  status: z.enum(['pending', 'completed', 'failed']),
  description: z.string().optional(),
  date: z.string(),
  category: z.string().optional(),
  loft_id: z.string().optional(),
  currency_id: z.string().uuid("Invalid currency ID").optional(),
  payment_method_id: z.string().uuid("Invalid payment method ID").optional(),
  ratio_at_transaction: z.number().nullable().optional(), // Store the ratio of selected currency to default at time of transaction
  equivalent_amount_default_currency: z.number().nullable().optional(), // Store the equivalent amount in default currency
});

export type Transaction = z.infer<typeof transactionSchema>;
export type TaskFormData = z.infer<typeof taskSchema>;
export type TaskStatusUpdateData = z.infer<typeof taskStatusUpdateSchema>;

export const loftOwnerSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email").optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  ownership_type: z.enum(['company', 'third_party'])
});

export type LoftOwnerFormData = z.infer<typeof loftOwnerSchema>;
