import { DEFAULT_TENANT_CODE } from "./tenants.js";

const admins = [
    {
        personal_email: "superadmin@personal.com",
        company_email: "superadmin@datn-hr.com",
        password: "123456",
        full_name: "Super Admin",
        phone_number: "0900000999",
        address: "Hanoi, Vietnam",
        role: "super_admin",
        status: "active"
    },
    {
        personal_email: "tenantadmin@personal.com",
        company_email: "admin@datn-hr.com",
        password: "123456",
        full_name: "Tenant Admin",
        phone_number: "0900000888",
        address: "Hanoi, Vietnam",
        role: "tenant_admin",
        status: "active",
        tenant_code: DEFAULT_TENANT_CODE
    }
];

export default admins;
