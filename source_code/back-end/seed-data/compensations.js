const employees = [
    {
        personal_email: "mng1@personal.com",
        company_email: "mng1@company.com",
        full_name: "Nguyễn Văn A",
        role: "manager"
    },
    {
        personal_email: "tp1@personal.com",
        company_email: "tp1@company.com",
        full_name: "Nguyễn Văn B",
        role: "hr"
    },
    {
        personal_email: "tp2@personal.com",
        company_email: "tp2@company.com",
        full_name: "Nguyễn Văn C",
        role: "employee"
    },
    {
        personal_email: "tp3@personal.com",
        company_email: "tp3@company.com",
        full_name: "Nguyễn Văn D",
        role: "employee"
    },
    {
        personal_email: "tn1@personal.com",
        company_email: "tn1@company.com",
        full_name: "Nguyễn Văn E",
        role: "hr"
    },
    {
        personal_email: "tn2@personal.com",
        company_email: "tn2@company.com",
        full_name: "Nguyễn Văn F",
        role: "employee"
    },
    {
        personal_email: "tn3@personal.com",
        company_email: "tn3@company.com",
        full_name: "Nguyễn Văn G",
        role: "employee"
    },
    {
        personal_email: "hr13@personal.com",
        company_email: "hr1@company.com",
        full_name: "Nguyễn Văn H",
        role: "hr"
    },
    {
        personal_email: "hr2@personal.com",
        company_email: "hr2@company.com",
        full_name: "Nguyễn Văn O",
        role: "hr"
    },
    {
        personal_email: "hr3@personal.com",
        company_email: "hr3@company.com",
        full_name: "Nguyễn Văn P",
        role: "hr"
    },
    {
        personal_email: "dev1@personal.com",
        company_email: "dev1@company.com",
        full_name: "Nguyễn Văn Q",
        role: "employee"
    },
    {
        personal_email: "dev2@personal.com",
        company_email: "dev2@company.com",
        full_name: "Nguyễn Văn M",
        role: "employee"
    },
    {
        personal_email: "dev3@personal.com",
        company_email: "dev3@company.com",
        full_name: "Nguyễn Văn N",
        role: "employee"
    },
    {
        personal_email: "dev4@personal.com",
        company_email: "dev4@company.com",
        full_name: "Nguyễn Văn T",
        role: "employee"
    },
    {
        personal_email: "dev5@personal.com",
        company_email: "dev5@company.com",
        full_name: "Nguyễn Văn TK",
        role: "employee"
    }
];

const ROLE_RULES = {
    manager: {
        baseSalary: 80000000,
        salaryStep: 3000000,
        baseBonus: 20000000,
        bonusStep: 1000000
    },
    hr: {
        baseSalary: 30000000,
        salaryStep: 1500000,
        baseBonus: 5000000,
        bonusStep: 500000
    },
    employee: {
        baseSalary: 18000000,
        salaryStep: 1000000,
        baseBonus: 2000000,
        bonusStep: 300000
    }
};

const ROLE_REASON = {
    manager: "Thiết lập lương quản lý",
    hr: "Thiết lập lương nhân sự",
    employee: "Thiết lập lương nhân viên"
};

const EFFECTIVE_DATE_POOL = [
    "2026-01-01",
    "2026-02-01",
    "2026-03-01",
    "2026-04-01",
    "2026-05-01"
];

const buildCompensationSeed = (employee, index) => {
    const rule = ROLE_RULES[employee.role] ?? ROLE_RULES.employee;
    const salary = rule.baseSalary + (index % 5) * rule.salaryStep;
    const bonus = rule.baseBonus + (index % 4) * rule.bonusStep;
    const effectiveDate = EFFECTIVE_DATE_POOL[index % EFFECTIVE_DATE_POOL.length];

    return {
        company_email: employee.company_email,
        full_name: employee.full_name,
        role: employee.role,
        salary,
        bonus,
        effective_date: effectiveDate,
        reason: ROLE_REASON[employee.role] ?? ROLE_REASON.employee
    };
};

const compensationSeeds = employees.map(buildCompensationSeed);

export default compensationSeeds;
