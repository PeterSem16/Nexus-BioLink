export const DEPARTMENTS = [
  { id: "management", name: "Management" },
  { id: "sales", name: "Sales" },
  { id: "operations", name: "Operations" },
  { id: "finance", name: "Finance" },
  { id: "customer_service", name: "Customer Service" },
  { id: "it", name: "IT" },
  { id: "medical", name: "Medical" },
] as const;

export type DepartmentId = typeof DEPARTMENTS[number]["id"];

export type FieldPermission = "editable" | "readonly" | "hidden";
export type ModuleAccess = "visible" | "hidden";

export interface ModuleField {
  key: string;
  label: string;
  defaultPermission: FieldPermission;
}

export interface ModuleDefinition {
  key: string;
  label: string;
  icon: string;
  defaultAccess: ModuleAccess;
  fields: ModuleField[];
}

export const CRM_MODULES: ModuleDefinition[] = [
  {
    key: "dashboard",
    label: "Dashboard",
    icon: "LayoutDashboard",
    defaultAccess: "visible",
    fields: [
      { key: "stats_overview", label: "Statistics Overview", defaultPermission: "readonly" },
      { key: "recent_customers", label: "Recent Customers", defaultPermission: "readonly" },
      { key: "activity_feed", label: "Activity Feed", defaultPermission: "readonly" },
    ],
  },
  {
    key: "customers",
    label: "Customers",
    icon: "Users",
    defaultAccess: "visible",
    fields: [
      { key: "internal_id", label: "Internal ID", defaultPermission: "editable" },
      { key: "title_before", label: "Title Before", defaultPermission: "editable" },
      { key: "first_name", label: "First Name", defaultPermission: "editable" },
      { key: "last_name", label: "Last Name", defaultPermission: "editable" },
      { key: "maiden_name", label: "Maiden Name", defaultPermission: "editable" },
      { key: "title_after", label: "Title After", defaultPermission: "editable" },
      { key: "phone", label: "Phone", defaultPermission: "editable" },
      { key: "mobile", label: "Mobile", defaultPermission: "editable" },
      { key: "mobile_2", label: "Mobile 2", defaultPermission: "editable" },
      { key: "email", label: "Email", defaultPermission: "editable" },
      { key: "email_2", label: "Email 2", defaultPermission: "editable" },
      { key: "national_id", label: "National ID", defaultPermission: "editable" },
      { key: "id_card_number", label: "ID Card Number", defaultPermission: "editable" },
      { key: "date_of_birth", label: "Date of Birth", defaultPermission: "editable" },
      { key: "newsletter", label: "Newsletter", defaultPermission: "editable" },
      { key: "complaint_type", label: "Complaint Type", defaultPermission: "editable" },
      { key: "cooperation_type", label: "Cooperation Type", defaultPermission: "editable" },
      { key: "vip_status", label: "VIP Status", defaultPermission: "editable" },
      { key: "country", label: "Country", defaultPermission: "editable" },
      { key: "city", label: "City", defaultPermission: "editable" },
      { key: "address", label: "Address", defaultPermission: "editable" },
      { key: "postal_code", label: "Postal Code", defaultPermission: "editable" },
      { key: "region", label: "Region", defaultPermission: "editable" },
      { key: "correspondence_address", label: "Correspondence Address", defaultPermission: "editable" },
      { key: "bank_account", label: "Bank Account", defaultPermission: "editable" },
      { key: "health_insurance", label: "Health Insurance", defaultPermission: "editable" },
      { key: "client_status", label: "Client Status", defaultPermission: "editable" },
      { key: "lead_score", label: "Lead Score", defaultPermission: "readonly" },
      { key: "notes", label: "Notes", defaultPermission: "editable" },
      { key: "assigned_user", label: "Assigned User", defaultPermission: "editable" },
    ],
  },
  {
    key: "hospitals",
    label: "Hospitals",
    icon: "Building2",
    defaultAccess: "visible",
    fields: [
      { key: "name", label: "Name", defaultPermission: "editable" },
      { key: "full_name", label: "Full Name", defaultPermission: "editable" },
      { key: "street_number", label: "Street Number", defaultPermission: "editable" },
      { key: "city", label: "City", defaultPermission: "editable" },
      { key: "postal_code", label: "Postal Code", defaultPermission: "editable" },
      { key: "region", label: "Region", defaultPermission: "editable" },
      { key: "country_code", label: "Country", defaultPermission: "editable" },
      { key: "representative", label: "Representative", defaultPermission: "editable" },
      { key: "laboratory", label: "Laboratory", defaultPermission: "editable" },
      { key: "auto_recruiting", label: "Auto Recruiting", defaultPermission: "editable" },
      { key: "responsible_person", label: "Responsible Person", defaultPermission: "editable" },
      { key: "contact_person", label: "Contact Person", defaultPermission: "editable" },
      { key: "svet_zdravia", label: "Svet Zdravia", defaultPermission: "editable" },
      { key: "is_active", label: "Is Active", defaultPermission: "editable" },
    ],
  },
  {
    key: "collaborators",
    label: "Collaborators",
    icon: "Handshake",
    defaultAccess: "visible",
    fields: [
      { key: "title_before", label: "Title Before", defaultPermission: "editable" },
      { key: "first_name", label: "First Name", defaultPermission: "editable" },
      { key: "last_name", label: "Last Name", defaultPermission: "editable" },
      { key: "title_after", label: "Title After", defaultPermission: "editable" },
      { key: "email", label: "Email", defaultPermission: "editable" },
      { key: "phone", label: "Phone", defaultPermission: "editable" },
      { key: "mobile", label: "Mobile", defaultPermission: "editable" },
      { key: "date_of_birth", label: "Date of Birth", defaultPermission: "editable" },
      { key: "national_id", label: "National ID", defaultPermission: "editable" },
      { key: "id_card_number", label: "ID Card Number", defaultPermission: "editable" },
      { key: "company_name", label: "Company Name", defaultPermission: "editable" },
      { key: "company_ico", label: "Company ICO", defaultPermission: "editable" },
      { key: "company_dic", label: "Company DIC", defaultPermission: "editable" },
      { key: "company_ic_dph", label: "Company IC DPH", defaultPermission: "editable" },
      { key: "bank_account", label: "Bank Account", defaultPermission: "editable" },
      { key: "addresses", label: "Addresses", defaultPermission: "editable" },
      { key: "agreements", label: "Agreements", defaultPermission: "editable" },
      { key: "pension_dates", label: "Pension Dates", defaultPermission: "editable" },
      { key: "is_active", label: "Is Active", defaultPermission: "editable" },
    ],
  },
  {
    key: "invoices",
    label: "Invoices",
    icon: "FileText",
    defaultAccess: "visible",
    fields: [
      { key: "invoice_number", label: "Invoice Number", defaultPermission: "readonly" },
      { key: "customer", label: "Customer", defaultPermission: "editable" },
      { key: "billing_company", label: "Billing Company", defaultPermission: "editable" },
      { key: "issue_date", label: "Issue Date", defaultPermission: "editable" },
      { key: "due_date", label: "Due Date", defaultPermission: "editable" },
      { key: "items", label: "Items", defaultPermission: "editable" },
      { key: "subtotal", label: "Subtotal", defaultPermission: "readonly" },
      { key: "vat_amount", label: "VAT Amount", defaultPermission: "readonly" },
      { key: "total_amount", label: "Total Amount", defaultPermission: "readonly" },
      { key: "status", label: "Status", defaultPermission: "editable" },
      { key: "notes", label: "Notes", defaultPermission: "editable" },
    ],
  },
  {
    key: "users",
    label: "Users",
    icon: "UserCog",
    defaultAccess: "hidden",
    fields: [
      { key: "username", label: "Username", defaultPermission: "editable" },
      { key: "email", label: "Email", defaultPermission: "editable" },
      { key: "full_name", label: "Full Name", defaultPermission: "editable" },
      { key: "role", label: "Role", defaultPermission: "editable" },
      { key: "assigned_countries", label: "Assigned Countries", defaultPermission: "editable" },
      { key: "is_active", label: "Is Active", defaultPermission: "editable" },
      { key: "password", label: "Password", defaultPermission: "editable" },
    ],
  },
  {
    key: "settings",
    label: "Settings",
    icon: "Settings",
    defaultAccess: "hidden",
    fields: [
      { key: "complaint_types", label: "Complaint Types", defaultPermission: "editable" },
      { key: "cooperation_types", label: "Cooperation Types", defaultPermission: "editable" },
      { key: "vip_statuses", label: "VIP Statuses", defaultPermission: "editable" },
      { key: "health_insurance", label: "Health Insurance Companies", defaultPermission: "editable" },
      { key: "laboratories", label: "Laboratories", defaultPermission: "editable" },
    ],
  },
  {
    key: "configurator",
    label: "Configurator",
    icon: "Cog",
    defaultAccess: "hidden",
    fields: [
      { key: "services", label: "Services Configuration", defaultPermission: "editable" },
      { key: "products", label: "Products", defaultPermission: "editable" },
      { key: "invoice_templates", label: "Invoice Templates", defaultPermission: "editable" },
      { key: "invoice_editor", label: "Invoice Editor", defaultPermission: "editable" },
      { key: "permissions_roles", label: "Permissions & Roles", defaultPermission: "editable" },
    ],
  },
];

export function getModuleByKey(key: string): ModuleDefinition | undefined {
  return CRM_MODULES.find((m) => m.key === key);
}

export function getFieldByKey(moduleKey: string, fieldKey: string): ModuleField | undefined {
  const module = getModuleByKey(moduleKey);
  return module?.fields.find((f) => f.key === fieldKey);
}
