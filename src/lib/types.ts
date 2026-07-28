export type OrderStatus =
  | "RECEIVED"
  | "IN_PROGRESS"
  | "CLEANING"
  | "TAILORING"
  | "QUALITY_CHECK"
  | "READY_FOR_COLLECTION"
  | "COLLECTED"
  | "CANCELLED";

export type PaymentStatus = "UNPAID" | "PARTIALLY_PAID" | "DEPOSIT_PAID" | "FULLY_PAID";

export type PaymentMethod = "CASH" | "MOBILE_MONEY" | "BANK_TRANSFER" | "CARD";

export const ORDER_STATUS_FLOW: OrderStatus[] = [
  "RECEIVED",
  "IN_PROGRESS",
  "CLEANING",
  "TAILORING",
  "QUALITY_CHECK",
  "READY_FOR_COLLECTION",
  "COLLECTED",
];

export const SERVICE_CATEGORIES = [
  "Dry Cleaning",
  "Tailoring",
  "Alterations",
  "Repairs",
  "Ironing",
  "Washing",
  "Custom Production",
] as const;

export const EXPENSE_CATEGORIES = [
  "Detergents",
  "Fabrics",
  "Utilities",
  "Staff Salaries",
  "Equipment Maintenance",
  "Transport",
  "Rent",
  "Other",
] as const;

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  RECEIVED: "Received",
  IN_PROGRESS: "In Progress",
  CLEANING: "Cleaning/Tailoring",
  TAILORING: "Tailoring",
  QUALITY_CHECK: "Quality Check",
  READY_FOR_COLLECTION: "Ready for Collection",
  COLLECTED: "Collected",
  CANCELLED: "Cancelled",
};

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  UNPAID: "Unpaid",
  PARTIALLY_PAID: "Partially Paid",
  DEPOSIT_PAID: "Deposit Paid",
  FULLY_PAID: "Fully Paid",
};
