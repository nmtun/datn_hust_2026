const employees = [
    // ===== MANAGER =====
    {
        personal_email: "ceo@personal.com",
        company_email: "ceo@company.com",
        password: "123456",
        full_name: "Nguyễn Văn A",
        phone_number: "0900000001",
        address: "Hanoi, Vietnam",
        role: "manager",
        hire_date: "2025-10-01T00:00:00.000Z",
        position: "CEO",
        employee_id_number: "0001"
    },

    // ===== TRƯỞNG PHÒNG =====
    {
        personal_email: "hr_head@personal.com",
        company_email: "hr_head@company.com",
        password: "123456",
        full_name: "Nguyễn Văn B",
        phone_number: "0900000002",
        address: "Hanoi, Vietnam",
        role: "hr",
        hire_date: "2025-10-01T00:00:00.000Z",
        position: "Trưởng phòng Nhân sự",
        employee_id_number: "0002"
    },
    {
        personal_email: "tech_head@personal.com",
        company_email: "tech_head@company.com",
        password: "123456",
        full_name: "Nguyễn Văn C",
        phone_number: "0900000003",
        address: "Hanoi, Vietnam",
        role: "employee",
        hire_date: "2025-10-01T00:00:00.000Z",
        position: "Trưởng phòng Kỹ thuật",
        employee_id_number: "0003"
    },
    {
        personal_email: "biz_head@personal.com",
        company_email: "biz_head@company.com",
        password: "123456",
        full_name: "Nguyễn Văn D",
        phone_number: "0900000004",
        address: "Hanoi, Vietnam",
        role: "employee",
        hire_date: "2025-10-01T00:00:00.000Z",
        position: "Trưởng phòng Kinh doanh",
        employee_id_number: "0004"
    },

    // ===== PHÒNG NHÂN SỰ =====
    // Nhóm 1
    {
        personal_email: "hr_lead1@personal.com",
        company_email: "hr_lead1@company.com",
        password: "123456",
        full_name: "Trần Thị E",
        phone_number: "0900000005",
        address: "Hanoi, Vietnam",
        role: "hr",
        hire_date: "2025-10-01T00:00:00.000Z",
        position: "Trưởng nhóm Nhân sự 1",
        employee_id_number: "0005"
    },
    ...Array.from({ length: 3 }, (_, i) => ({
        personal_email: `hr_staff1_${i}@personal.com`,
        company_email: `hr_staff1_${i}@company.com`,
        password: "123456",
        full_name: `Nhân viên HR1_${i}`,
        phone_number: `090000001${i}`,
        address: "Hanoi, Vietnam",
        role: "hr",
        hire_date: "2025-10-01T00:00:00.000Z",
        position: "Nhân viên",
        employee_id_number: `0006${i}`
    })),

    // Nhóm 2
    {
        personal_email: "hr_lead2@personal.com",
        company_email: "hr_lead2@company.com",
        password: "123456",
        full_name: "Lê Thị F",
        phone_number: "0900000010",
        address: "Hanoi, Vietnam",
        role: "hr",
        hire_date: "2025-10-01T00:00:00.000Z",
        position: "Trưởng nhóm Nhân sự 2",
        employee_id_number: "0010"
    },

    // ===== PHÒNG KỸ THUẬT =====
    {
        personal_email: "tech_lead1@personal.com",
        company_email: "tech_lead1@company.com",
        password: "123456",
        full_name: "Phạm Văn G",
        phone_number: "0900000011",
        address: "Hanoi, Vietnam",
        role: "employee",
        hire_date: "2025-10-01T00:00:00.000Z",
        position: "Trưởng nhóm Kỹ thuật 1",
        employee_id_number: "0011"
    },
    {
        personal_email: "tech_lead2@personal.com",
        company_email: "tech_lead2@company.com",
        password: "123456",
        full_name: "Hoàng Văn H",
        phone_number: "0900000012",
        address: "Hanoi, Vietnam",
        role: "employee",
        hire_date: "2025-10-01T00:00:00.000Z",
        position: "Trưởng nhóm Kỹ thuật 2",
        employee_id_number: "0012"
    },

    // ===== PHÒNG KINH DOANH =====
    {
        personal_email: "biz_lead1@personal.com",
        company_email: "biz_lead1@company.com",
        password: "123456",
        full_name: "Đặng Thị I",
        phone_number: "0900000013",
        address: "Hanoi, Vietnam",
        role: "employee",
        hire_date: "2025-10-01T00:00:00.000Z",
        position: "Trưởng nhóm Kinh doanh 1",
        employee_id_number: "0013"
    },
    {
        personal_email: "biz_lead2@personal.com",
        company_email: "biz_lead2@company.com",
        password: "123456",
        full_name: "Bùi Văn K",
        phone_number: "0900000014",
        address: "Hanoi, Vietnam",
        role: "employee",
        hire_date: "2025-10-01T00:00:00.000Z",
        position: "Trưởng nhóm Kinh doanh 2",
        employee_id_number: "0014"
    },

    // ===== BỔ SUNG 30 NHÂN SỰ =====
    // Nhân sự: 6 người (0015 - 0020)
    ...Array.from({ length: 6 }, (_, i) => ({
        personal_email: `hr_staff2_${i + 1}@personal.com`,
        company_email: `hr_staff2_${i + 1}@company.com`,
        password: "123456",
        full_name: `Nhân viên Nhân sự ${i + 1}`,
        phone_number: `09000000${(15 + i).toString().padStart(2, "0")}`,
        address: "Hanoi, Vietnam",
        role: "hr",
        hire_date: "2025-10-01T00:00:00.000Z",
        position: [
            "Chuyên viên Tuyển dụng",
            "Chuyên viên C&B",
            "Chuyên viên Đào tạo"
        ][i % 3],
        employee_id_number: `${(15 + i).toString().padStart(4, "0")}`
    })),

    // Kỹ thuật: 14 người (0021 - 0034)
    ...Array.from({ length: 14 }, (_, i) => ({
        personal_email: `tech_staff_${i + 1}@personal.com`,
        company_email: `tech_staff_${i + 1}@company.com`,
        password: "123456",
        full_name: `Nhân viên Kỹ thuật ${i + 1}`,
        phone_number: `09000000${(21 + i).toString().padStart(2, "0")}`,
        address: "Hanoi, Vietnam",
        role: "employee",
        hire_date: "2025-10-01T00:00:00.000Z",
        position: [
            "Lập trình viên Backend",
            "Lập trình viên Frontend",
            "Kỹ sư QA",
            "Kỹ sư DevOps"
        ][i % 4],
        employee_id_number: `${(21 + i).toString().padStart(4, "0")}`
    })),

    // Kinh doanh: 10 người (0035 - 0044)
    ...Array.from({ length: 10 }, (_, i) => ({
        personal_email: `biz_staff_${i + 1}@personal.com`,
        company_email: `biz_staff_${i + 1}@company.com`,
        password: "123456",
        full_name: `Nhân viên Kinh doanh ${i + 1}`,
        phone_number: `09000000${(35 + i).toString().padStart(2, "0")}`,
        address: "Hanoi, Vietnam",
        role: "employee",
        hire_date: "2025-10-01T00:00:00.000Z",
        position: [
            "Chuyên viên Kinh doanh",
            "Chuyên viên Tư vấn",
            "Chuyên viên Chăm sóc khách hàng"
        ][i % 3],
        employee_id_number: `${(35 + i).toString().padStart(4, "0")}`
    }))
];

const fixedOrgByEmail = {
    "ceo@company.com": {
        department_code: null,
        team_code: null,
        manager_company_email: null
    },
    "hr_head@company.com": {
        department_code: "HR",
        team_code: null,
        manager_company_email: "ceo@company.com"
    },
    "tech_head@company.com": {
        department_code: "TECH",
        team_code: null,
        manager_company_email: "ceo@company.com"
    },
    "biz_head@company.com": {
        department_code: "BIZ",
        team_code: null,
        manager_company_email: "ceo@company.com"
    },
    "hr_lead1@company.com": {
        department_code: "HR",
        team_code: "HR-1",
        manager_company_email: "hr_head@company.com"
    },
    "hr_lead2@company.com": {
        department_code: "HR",
        team_code: "HR-2",
        manager_company_email: "hr_head@company.com"
    },
    "tech_lead1@company.com": {
        department_code: "TECH",
        team_code: "TECH-1",
        manager_company_email: "tech_head@company.com"
    },
    "tech_lead2@company.com": {
        department_code: "TECH",
        team_code: "TECH-2",
        manager_company_email: "tech_head@company.com"
    },
    "biz_lead1@company.com": {
        department_code: "BIZ",
        team_code: "BIZ-1",
        manager_company_email: "biz_head@company.com"
    },
    "biz_lead2@company.com": {
        department_code: "BIZ",
        team_code: "BIZ-2",
        manager_company_email: "biz_head@company.com"
    }
};

const parseIndexedStaff = (email, prefix) => {
    const match = email.match(new RegExp(`^${prefix}(\\d+)@company\\.com$`));
    if (!match) return null;
    return Number(match[1]);
};

const getOrgByPattern = (email) => {
    if (email.startsWith("hr_staff1_")) {
        return {
            department_code: "HR",
            team_code: "HR-1",
            manager_company_email: "hr_lead1@company.com"
        };
    }

    const hrStaff2Index = parseIndexedStaff(email, "hr_staff2_");
    if (hrStaff2Index) {
        const leadEmail = hrStaff2Index <= 3 ? "hr_lead1@company.com" : "hr_lead2@company.com";
        return {
            department_code: "HR",
            team_code: hrStaff2Index <= 3 ? "HR-1" : "HR-2",
            manager_company_email: leadEmail
        };
    }

    const techStaffIndex = parseIndexedStaff(email, "tech_staff_");
    if (techStaffIndex) {
        const leadEmail = techStaffIndex <= 7 ? "tech_lead1@company.com" : "tech_lead2@company.com";
        return {
            department_code: "TECH",
            team_code: techStaffIndex <= 7 ? "TECH-1" : "TECH-2",
            manager_company_email: leadEmail
        };
    }

    const bizStaffIndex = parseIndexedStaff(email, "biz_staff_");
    if (bizStaffIndex) {
        const leadEmail = bizStaffIndex <= 5 ? "biz_lead1@company.com" : "biz_lead2@company.com";
        return {
            department_code: "BIZ",
            team_code: bizStaffIndex <= 5 ? "BIZ-1" : "BIZ-2",
            manager_company_email: leadEmail
        };
    }

    return {
        department_code: null,
        team_code: null,
        manager_company_email: null
    };
};

const employeesWithOrg = employees.map((employee) => {
    const fixedOrg = fixedOrgByEmail[employee.company_email];
    const orgData = fixedOrg ?? getOrgByPattern(employee.company_email);

    return {
        ...employee,
        department_code: orgData.department_code,
        team_code: orgData.team_code,
        manager_company_email: orgData.manager_company_email
    };
});

export default employeesWithOrg;

