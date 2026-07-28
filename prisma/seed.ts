import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import crypto from "crypto";

const connectionString = process.env.POSTGRES_URL_NON_POOLING || process.env.DATABASE_URL!;
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, "sha512").toString("hex");
  return `${salt}:${hash}`;
}

async function main() {
  console.log("Seeding database...");

  // Seed services with USD prices
  const services = [
    // Dry Cleaning
    { name: "Dry Clean - Shirt", category: "Dry Cleaning", basePrice: 5.99, description: "Professional dry cleaning for dress shirts and blouses" },
    { name: "Dry Clean - Trousers", category: "Dry Cleaning", basePrice: 7.99, description: "Professional dry cleaning for dress pants and slacks" },
    { name: "Dry Clean - Jacket/Blazer", category: "Dry Cleaning", basePrice: 12.99, description: "Professional dry cleaning for jackets and blazers" },
    { name: "Dry Clean - Suit (2-piece)", category: "Dry Cleaning", basePrice: 22.99, description: "Professional dry cleaning for 2-piece suits (jacket + trousers)" },
    { name: "Dry Clean - Suit (3-piece)", category: "Dry Cleaning", basePrice: 29.99, description: "Professional dry cleaning for 3-piece suits" },
    { name: "Dry Clean - Dress (Regular)", category: "Dry Cleaning", basePrice: 10.99, description: "Professional dry cleaning for regular length dresses" },
    { name: "Dry Clean - Dress (Long/Formal)", category: "Dry Cleaning", basePrice: 16.99, description: "Professional dry cleaning for evening gowns and formal dresses" },
    { name: "Dry Clean - Coat", category: "Dry Cleaning", basePrice: 18.99, description: "Professional dry cleaning for overcoats and trench coats" },
    { name: "Dry Clean - Wedding Dress", category: "Dry Cleaning", basePrice: 89.99, description: "Specialist dry cleaning for wedding dresses with delicate fabrics" },
    { name: "Dry Clean - Curtain/Drape", category: "Dry Cleaning", basePrice: 8.99, description: "Professional dry cleaning per panel for curtains and drapes" },
    // Washing & Ironing
    { name: "Wash & Iron - Shirt", category: "Washing", basePrice: 3.49, description: "Machine wash and professional press for shirts" },
    { name: "Wash & Iron - Trousers", category: "Washing", basePrice: 3.99, description: "Machine wash and professional press for trousers" },
    { name: "Wash & Iron - T-Shirt/Polo", category: "Washing", basePrice: 2.49, description: "Machine wash and press for casual tops" },
    { name: "Wash & Iron - Bed Sheet Set", category: "Washing", basePrice: 6.99, description: "Wash and press for standard bed sheet set" },
    { name: "Wash & Iron - Towel Set", category: "Washing", basePrice: 4.99, description: "Wash and fold for towel sets" },
    // Ironing Only
    { name: "Iron Only - Shirt", category: "Ironing", basePrice: 2.49, description: "Professional steam press for shirts" },
    { name: "Iron Only - Trousers", category: "Ironing", basePrice: 2.99, description: "Professional steam press for trousers" },
    { name: "Iron Only - Dress", category: "Ironing", basePrice: 3.99, description: "Professional steam press for dresses" },
    { name: "Iron Only - Tablecloth", category: "Ironing", basePrice: 3.49, description: "Professional press for tablecloths" },
    // Tailoring & Alterations
    { name: "Hem Trousers", category: "Tailoring", basePrice: 8.99, description: "Shorten trouser hem to desired length" },
    { name: "Take In/Let Out Waist", category: "Tailoring", basePrice: 12.99, description: "Adjust waist size by taking in or letting out seams" },
    { name: "Shorten Sleeves", category: "Tailoring", basePrice: 9.99, description: "Shorten jacket or shirt sleeves" },
    { name: "Replace Zipper", category: "Repairs", basePrice: 8.99, description: "Remove and replace broken or damaged zippers" },
    { name: "Replace Button", category: "Repairs", basePrice: 1.99, description: "Replace missing or damaged buttons (per button)" },
    { name: "Repair Tear/Rip", category: "Repairs", basePrice: 5.99, description: "Mend tears, rips, and small holes in fabric" },
    { name: "Patch Repair", category: "Repairs", basePrice: 7.99, description: "Apply fabric patch to damaged area" },
    { name: "General Alteration", category: "Alterations", basePrice: 10.99, description: "Custom alteration service - priced per complexity" },
    // Custom Production
    { name: "Custom Shirt", category: "Custom Production", basePrice: 45.99, description: "Made-to-measure shirt in your choice of fabric and style" },
    { name: "Custom Trousers", category: "Custom Production", basePrice: 55.99, description: "Made-to-measure trousers in your choice of fabric" },
    { name: "Custom Dress", category: "Custom Production", basePrice: 79.99, description: "Custom dress made to your specifications" },
    { name: "Custom Suit (2-piece)", category: "Custom Production", basePrice: 199.99, description: "Custom 2-piece suit made to your measurements" },
    { name: "Custom Suit (3-piece)", category: "Custom Production", basePrice: 279.99, description: "Custom 3-piece suit made to your measurements" },
  ];

  for (const service of services) {
    const id = service.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/-+$/, "");
    await prisma.service.upsert({
      where: { id },
      update: { basePrice: service.basePrice },
      create: { id, ...service },
    });
  }

  // Seed default branch
  await prisma.branch.upsert({
    where: { id: "default-branch" },
    update: {},
    create: {
      id: "default-branch",
      name: "Main Branch",
      address: "123 Main Street, Downtown",
      phone: "(555) 123-4567",
      email: "info@gatsicomms.com",
    },
  });

  // Seed employees (all passwords: "password123")
  const defaultPassword = hashPassword("password123");
  const employees = [
    { id: "emp-1", firstName: "James", lastName: "Wilson", email: "james@gatsicomms.com", phone: "(555) 201-1001", role: "Manager", passwordHash: defaultPassword },
    { id: "emp-2", firstName: "Sarah", lastName: "Johnson", email: "sarah@gatsicomms.com", phone: "(555) 201-1002", role: "Senior Tailor", passwordHash: defaultPassword },
    { id: "emp-3", firstName: "Michael", lastName: "Brown", email: "michael@gatsicomms.com", phone: "(555) 201-1003", role: "Dry Cleaning Specialist", passwordHash: defaultPassword },
    { id: "emp-4", firstName: "Emily", lastName: "Davis", email: "emily@gatsicomms.com", phone: "(555) 201-1004", role: "Customer Service", passwordHash: defaultPassword },
    { id: "emp-5", firstName: "David", lastName: "Martinez", email: "david@gatsicomms.com", phone: "(555) 201-1005", role: "Presser", passwordHash: defaultPassword },
  ];

  for (const emp of employees) {
    await prisma.employee.upsert({
      where: { id: emp.id },
      update: {},
      create: { ...emp, branch: { connect: { id: "default-branch" } } },
    });
  }

  // Seed sample customers
  const customers = [
    { id: "cust-1", firstName: "Robert", lastName: "Anderson", email: "robert@email.com", phone: "(555) 301-2001", address: "456 Oak Avenue", loyaltyPoints: 320, totalSpent: 287.50 },
    { id: "cust-2", firstName: "Jennifer", lastName: "Thompson", email: "jennifer@email.com", phone: "(555) 301-2002", address: "789 Pine Street", loyaltyPoints: 180, totalSpent: 156.80 },
    { id: "cust-3", firstName: "William", lastName: "Garcia", email: "william@email.com", phone: "(555) 301-2003", address: "321 Elm Drive", loyaltyPoints: 540, totalSpent: 512.30 },
    { id: "cust-4", firstName: "Amanda", lastName: "Rodriguez", email: "amanda@email.com", phone: "(555) 301-2004", address: "654 Maple Court", loyaltyPoints: 90, totalSpent: 78.90 },
    { id: "cust-5", firstName: "Christopher", lastName: "Lee", email: "chris@email.com", phone: "(555) 301-2005", address: "987 Cedar Lane", loyaltyPoints: 720, totalSpent: 689.20 },
    { id: "cust-6", firstName: "Jessica", lastName: "Walker", email: "jessica@email.com", phone: "(555) 301-2006", address: "147 Birch Road", loyaltyPoints: 45, totalSpent: 34.50 },
    { id: "cust-7", firstName: "Daniel", lastName: "Hall", email: "daniel@email.com", phone: "(555) 301-2007", address: "258 Walnut Way", loyaltyPoints: 280, totalSpent: 245.60 },
    { id: "cust-8", firstName: "Ashley", lastName: "Allen", email: "ashley@email.com", phone: "(555) 301-2008", address: "369 Spruce Place", loyaltyPoints: 160, totalSpent: 134.40 },
  ];

  for (const cust of customers) {
    await prisma.customer.upsert({
      where: { id: cust.id },
      update: {},
      create: { ...cust, branch: { connect: { id: "default-branch" } } },
    });
  }

  // Seed sample orders with items and payments
  const now = new Date();
  const orders = [
    {
      id: "order-1",
      customerId: "cust-5",
      employeeId: "emp-2",
      orderNumber: "GAT-2607-0001",
      status: "READY_FOR_COLLECTION",
      totalAmount: 52.97,
      paidAmount: 40.00,
      paymentStatus: "PARTIALLY_PAID",
      expectedCompletion: new Date(now.getTime() - 86400000 * 2),
      completedAt: new Date(now.getTime() - 86400000),
      items: [
        { garmentType: "Suit Jacket", serviceId: "dry-clean-suit-2-piece", quantity: 1, unitPrice: 22.99, totalPrice: 22.99, instructions: "Handle with care - silk lining" },
        { garmentType: "Dress Shirt", serviceId: "dry-clean-shirt", quantity: 2, unitPrice: 5.99, totalPrice: 11.98 },
        { garmentType: "Trousers", serviceId: "hem-trousers", quantity: 1, unitPrice: 8.99, totalPrice: 8.99, instructions: "Hem to 32 inch inseam" },
        { garmentType: "Silk Tie", serviceId: "dry-clean-shirt", quantity: 1, unitPrice: 5.99, totalPrice: 5.99 },
      ],
      payments: [
        { amount: 20.00, method: "CASH", reference: null },
        { amount: 20.00, method: "MOBILE_MONEY", reference: "MMP-8872341" },
      ],
    },
    {
      id: "order-2",
      customerId: "cust-3",
      employeeId: "emp-3",
      orderNumber: "GAT-2607-0002",
      status: "IN_PROGRESS",
      totalAmount: 36.97,
      paidAmount: 36.97,
      paymentStatus: "FULLY_PAID",
      expectedCompletion: new Date(now.getTime() + 86400000),
      items: [
        { garmentType: "Business Suit", serviceId: "dry-clean-suit-2-piece", quantity: 1, unitPrice: 22.99, totalPrice: 22.99 },
        { garmentType: "Silk Handkerchief", serviceId: "dry-clean-shirt", quantity: 2, unitPrice: 3.49, totalPrice: 6.98 },
        { garmentType: "Dress Shoes", serviceId: "general-alteration", quantity: 1, unitPrice: 6.99, totalPrice: 6.99, instructions: "Clean and polish black leather" },
      ],
      payments: [
        { amount: 36.97, method: "BANK_TRANSFER", reference: "TXN-20260721-001" },
      ],
    },
    {
      id: "order-3",
      customerId: "cust-1",
      employeeId: "emp-2",
      orderNumber: "GAT-2607-0003",
      status: "RECEIVED",
      totalAmount: 18.98,
      paidAmount: 0,
      paymentStatus: "UNPAID",
      expectedCompletion: new Date(now.getTime() + 86400000 * 3),
      items: [
        { garmentType: "Casual Shirts", serviceId: "wash-iron-shirt", quantity: 3, unitPrice: 3.49, totalPrice: 10.47 },
        { garmentType: "Jeans", serviceId: "iron-only-trousers", quantity: 2, unitPrice: 2.99, totalPrice: 5.98 },
        { garmentType: "Socks", serviceId: "wash-iron-t-shirt-polo", quantity: 1, unitPrice: 2.49, totalPrice: 2.49 },
      ],
      payments: [],
    },
    {
      id: "order-4",
      customerId: "cust-7",
      employeeId: "emp-5",
      orderNumber: "GAT-2607-0004",
      status: "QUALITY_CHECK",
      totalAmount: 29.98,
      paidAmount: 15.00,
      paymentStatus: "DEPOSIT_PAID",
      expectedCompletion: new Date(now.getTime() + 86400000),
      items: [
        { garmentType: "Winter Coat", serviceId: "dry-clean-coat", quantity: 1, unitPrice: 18.99, totalPrice: 18.99, instructions: "Remove stains on left sleeve" },
        { garmentType: "Scarf", serviceId: "dry-clean-shirt", quantity: 1, unitPrice: 5.99, totalPrice: 5.99 },
        { garmentType: "Gloves", serviceId: "dry-clean-shirt", quantity: 1, unitPrice: 4.99, totalPrice: 4.99 },
      ],
      payments: [
        { amount: 15.00, method: "CASH", reference: null },
      ],
    },
    {
      id: "order-5",
      customerId: "cust-2",
      employeeId: "emp-2",
      orderNumber: "GAT-2607-0005",
      status: "COLLECTED",
      totalAmount: 15.98,
      paidAmount: 15.98,
      paymentStatus: "FULLY_PAID",
      expectedCompletion: new Date(now.getTime() - 86400000 * 5),
      completedAt: new Date(now.getTime() - 86400000 * 4),
      collectedAt: new Date(now.getTime() - 86400000 * 3),
      items: [
        { garmentType: "Blouse", serviceId: "dry-clean-shirt", quantity: 2, unitPrice: 5.99, totalPrice: 11.98 },
        { garmentType: "Skirt", serviceId: "iron-only-trousers", quantity: 1, unitPrice: 3.99, totalPrice: 3.99 },
      ],
      payments: [
        { amount: 15.98, method: "CARD", reference: "POS-4421" },
      ],
    },
    {
      id: "order-6",
      customerId: "cust-4",
      employeeId: "emp-3",
      orderNumber: "GAT-2607-0006",
      status: "CLEANING",
      totalAmount: 8.98,
      paidAmount: 8.98,
      paymentStatus: "FULLY_PAID",
      expectedCompletion: new Date(now.getTime() + 86400000 * 2),
      items: [
        { garmentType: "Table Linens", serviceId: "wash-iron-bed-sheet-set", quantity: 1, unitPrice: 6.99, totalPrice: 6.99 },
        { garmentType: "Napkins", serviceId: "wash-iron-towel-set", quantity: 1, unitPrice: 1.99, totalPrice: 1.99 },
      ],
      payments: [
        { amount: 8.98, method: "CASH", reference: null },
      ],
    },
  ];

  for (const order of orders) {
    const { items, payments, employeeId, customerId, ...orderData } = order;
    await prisma.order.upsert({
      where: { id: order.id },
      update: {},
      create: {
        ...orderData,
        customer: { connect: { id: customerId } },
        branch: { connect: { id: "default-branch" } },
        employee: employeeId ? { connect: { id: employeeId } } : undefined,
        items: { create: items },
        payments: { create: payments },
        statusHistory: {
          create: [
            { status: "RECEIVED", notes: "Order received from customer" },
            ...(order.status !== "RECEIVED" ? [{ status: order.status, notes: `Order moved to ${order.status.replace(/_/g, " ").toLowerCase()}` }] : []),
          ],
        },
      },
    });
  }

  // Seed sample expenses
  const expenses = [
    { category: "Detergents", description: "Premium laundry detergent - 5L", amount: 45.99, employeeId: "emp-3" },
    { category: "Fabrics", description: "Cotton fabric bolts (10 yards)", amount: 120.00, employeeId: "emp-2" },
    { category: "Utilities", description: "Monthly electricity bill", amount: 285.50 },
    { category: "Staff Salaries", description: "Weekly payroll - all staff", amount: 3200.00 },
    { category: "Equipment Maintenance", description: "Dry cleaning machine service", amount: 175.00, employeeId: "emp-1" },
    { category: "Transport", description: "Customer pickup/delivery fuel", amount: 65.00, employeeId: "emp-4" },
    { category: "Rent", description: "Monthly shop rent", amount: 1800.00 },
    { category: "Other", description: "Packaging materials - hangers and bags", amount: 38.50, employeeId: "emp-5" },
  ];

  for (const expense of expenses) {
    const { employeeId, ...expenseData } = expense;
    await prisma.expense.create({
      data: {
        ...expenseData,
        branch: { connect: { id: "default-branch" } },
        ...(employeeId ? { employee: { connect: { id: employeeId } } } : {}),
      },
    });
  }

  // Seed inventory items
  const inventory = [
    { name: "Premium Laundry Detergent", category: "Cleaning Supplies", quantity: 12, unit: "Liters", minQuantity: 5, unitCost: 8.99, supplier: "CleanPro Supply Co." },
    { name: "Stain Remover", category: "Cleaning Supplies", quantity: 8, unit: "Bottles", minQuantity: 3, unitCost: 5.49, supplier: "CleanPro Supply Co." },
    { name: "Fabric Softener", category: "Cleaning Supplies", quantity: 15, unit: "Liters", minQuantity: 5, unitCost: 6.99, supplier: "CleanPro Supply Co." },
    { name: "Dry Cleaning Solvent", category: "Cleaning Supplies", quantity: 20, unit: "Liters", minQuantity: 8, unitCost: 12.99, supplier: "Industrial Cleaners Inc." },
    { name: "Garment Bags (Clear)", category: "Packaging", quantity: 200, unit: "Pieces", minQuantity: 50, unitCost: 0.25, supplier: "PackRight Supplies" },
    { name: "Hangers (Wire)", category: "Packaging", quantity: 150, unit: "Pieces", minQuantity: 50, unitCost: 0.15, supplier: "PackRight Supplies" },
    { name: "Hangers (Plastic)", category: "Packaging", quantity: 80, unit: "Pieces", minQuantity: 30, unitCost: 0.35, supplier: "PackRight Supplies" },
    { name: "Receipt Paper (Thermal)", category: "Office Supplies", quantity: 6, unit: "Rolls", minQuantity: 3, unitCost: 4.99, supplier: "Office Depot" },
    { name: "Thread (White)", category: "Tailoring Supplies", quantity: 10, unit: "Spools", minQuantity: 5, unitCost: 2.49, supplier: "Fabric World" },
    { name: "Thread (Black)", category: "Tailoring Supplies", quantity: 8, unit: "Spools", minQuantity: 5, unitCost: 2.49, supplier: "Fabric World" },
    { name: "Buttons (Assorted)", category: "Tailoring Supplies", quantity: 3, unit: "Packs", minQuantity: 2, unitCost: 7.99, supplier: "Fabric World" },
    { name: "Zippers (Assorted)", category: "Tailoring Supplies", quantity: 2, unit: "Packs", minQuantity: 2, unitCost: 9.99, supplier: "Fabric World" },
    { name: "Bleach", category: "Cleaning Supplies", quantity: 1, unit: "Gallons", minQuantity: 2, unitCost: 7.49, supplier: "CleanPro Supply Co." },
  ];

  for (const item of inventory) {
    const id = item.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/-+$/, "");
    await prisma.inventoryItem.upsert({
      where: { id },
      update: {},
      create: { id, ...item },
    });
  }

  console.log("Seeding complete!");
  console.log(`  - ${services.length} services`);
  console.log(`  - 1 branch`);
  console.log(`  - ${employees.length} employees`);
  console.log(`  - ${customers.length} customers`);
  console.log(`  - ${orders.length} orders with items and payments`);
  console.log(`  - ${expenses.length} expenses`);
  console.log(`  - ${inventory.length} inventory items`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
