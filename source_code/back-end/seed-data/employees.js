const employees = [
    // ===== MANAGER/CEO =====
    {
        personal_email: "mng1@personal.com",
        company_email: "mng1@company.com",
        password: "123456",
        full_name: "Nguyễn Văn A",
        phone_number: "0900000001",
        address: "Hanoi, Vietnam",
        role: "manager",
        hire_date: "2025-10-01T00:00:00.000Z",
        position: "CEO",
        employee_id_number: "0001"
    },

    // ===== DEPARTMENT HEADS =====
    {
        personal_email: "tp1@personal.com",
        company_email: "tp1@company.com",
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
        personal_email: "tp2@personal.com",
        company_email: "tp2@company.com",
        password: "123456",
        full_name: "Nguyễn Văn C",
        phone_number: "0900000003",
        address: "Hanoi, Vietnam",
        role: "employee",
        hire_date: "2025-10-01T00:00:00.000Z",
        position: "Trưởng phòng Nghiên cứu",
        employee_id_number: "0003"
    },
    {
        personal_email: "tp3@personal.com",
        company_email: "tp3@company.com",
        password: "123456",
        full_name: "Nguyễn Văn D",
        phone_number: "0900000004",
        address: "Hanoi, Vietnam",
        role: "employee",
        hire_date: "2025-10-01T00:00:00.000Z",
        position: "Trưởng phòng Kỹ thuật",
        employee_id_number: "0004"
    },

    // ===== TEAM LEADS =====
    {
        personal_email: "tn1@personal.com",
        company_email: "tn1@company.com",
        password: "123456",
        full_name: "Trần Thị E",
        phone_number: "0900000005",
        address: "Hanoi, Vietnam",
        role: "hr",
        hire_date: "2025-10-01T00:00:00.000Z",
        position: "Trưởng nhóm Nhân sự",
        employee_id_number: "0005"
    },
    {
        personal_email: "tn2@personal.com",
        company_email: "tn2@company.com",
        password: "123456",
        full_name: "Phạm Văn F",
        phone_number: "0900000006",
        address: "Hanoi, Vietnam",
        role: "employee",
        hire_date: "2025-10-01T00:00:00.000Z",
        position: "Trưởng nhóm Nghiên cứu",
        employee_id_number: "0006"
    },
    {
        personal_email: "tn3@personal.com",
        company_email: "tn3@company.com",
        password: "123456",
        full_name: "Hoàng Văn G",
        phone_number: "0900000007",
        address: "Hanoi, Vietnam",
        role: "employee",
        hire_date: "2025-10-01T00:00:00.000Z",
        position: "Trưởng nhóm Kỹ thuật",
        employee_id_number: "0007"
    },

    // ===== HR STAFF =====
    {
        personal_email: "hr1@personal.com",
        company_email: "hr1@company.com",
        password: "123456",
        full_name: "Lê Thị H",
        phone_number: "0900000008",
        address: "Hanoi, Vietnam",
        role: "hr",
        hire_date: "2025-10-01T00:00:00.000Z",
        position: "Chuyên viên Tuyển dụng",
        employee_id_number: "0008"
    },
    {
        personal_email: "hr2@personal.com",
        company_email: "hr2@company.com",
        password: "123456",
        full_name: "Đặng Thị I",
        phone_number: "0900000009",
        address: "Hanoi, Vietnam",
        role: "hr",
        hire_date: "2025-10-01T00:00:00.000Z",
        position: "Chuyên viên C&B",
        employee_id_number: "0009"
    },
    {
        personal_email: "hr3@personal.com",
        company_email: "hr3@company.com",
        password: "123456",
        full_name: "Bùi Thị K",
        phone_number: "0900000010",
        address: "Hanoi, Vietnam",
        role: "hr",
        hire_date: "2025-10-01T00:00:00.000Z",
        position: "Chuyên viên Đào tạo",
        employee_id_number: "0010"
    },

    // ===== DEVELOPERS =====
    {
        personal_email: "dev1@personal.com",
        company_email: "dev1@company.com",
        password: "123456",
        full_name: "Trần Văn L",
        phone_number: "0900000011",
        address: "Hanoi, Vietnam",
        role: "employee",
        hire_date: "2025-10-01T00:00:00.000Z",
        position: "Lập trình viên Backend",
        employee_id_number: "0011"
    },
    {
        personal_email: "dev2@personal.com",
        company_email: "dev2@company.com",
        password: "123456",
        full_name: "Phạm Văn M",
        phone_number: "0900000012",
        address: "Hanoi, Vietnam",
        role: "employee",
        hire_date: "2025-10-01T00:00:00.000Z",
        position: "Lập trình viên Frontend",
        employee_id_number: "0012"
    },
    {
        personal_email: "dev3@personal.com",
        company_email: "dev3@company.com",
        password: "123456",
        full_name: "Nguyễn Văn N",
        phone_number: "0900000013",
        address: "Hanoi, Vietnam",
        role: "employee",
        hire_date: "2025-10-01T00:00:00.000Z",
        position: "Kỹ sư DevOps",
        employee_id_number: "0013"
    },
    {
        personal_email: "dev4@personal.com",
        company_email: "dev4@company.com",
        password: "123456",
        full_name: "Hồ Văn O",
        phone_number: "0900000014",
        address: "Hanoi, Vietnam",
        role: "employee",
        hire_date: "2025-10-01T00:00:00.000Z",
        position: "Lập trình viên Backend",
        employee_id_number: "0014"
    },
    {
        personal_email: "dev5@personal.com",
        company_email: "dev5@company.com",
        password: "123456",
        full_name: "Vũ Thị P",
        phone_number: "0900000015",
        address: "Hanoi, Vietnam",
        role: "employee",
        hire_date: "2025-10-01T00:00:00.000Z",
        position: "Kỹ sư QA",
        employee_id_number: "0015"
    }
];

const fixedOrgByEmail = {
    "mng1@company.com": {
        department_code: null,
        team_code: null,
        manager_company_email: null
    },
    "tp1@company.com": {
        department_code: "HR",
        team_code: null,
        manager_company_email: "mng1@company.com"
    },
    "tp2@company.com": {
        department_code: "RESEARCH",
        team_code: null,
        manager_company_email: "mng1@company.com"
    },
    "tp3@company.com": {
        department_code: "TECH",
        team_code: null,
        manager_company_email: "mng1@company.com"
    },
    "tn1@company.com": {
        department_code: "HR",
        team_code: "HR-1",
        manager_company_email: "tp1@company.com"
    },
    "tn2@company.com": {
        department_code: "RESEARCH",
        team_code: "RESEARCH-1",
        manager_company_email: "tp2@company.com"
    },
    "tn3@company.com": {
        department_code: "TECH",
        team_code: "TECH-1",
        manager_company_email: "tp3@company.com"
    },
    "hr1@company.com": {
        department_code: "HR",
        team_code: "HR-1",
        manager_company_email: "tn1@company.com"
    },
    "hr2@company.com": {
        department_code: "HR",
        team_code: "HR-1",
        manager_company_email: "tn1@company.com"
    },
    "hr3@company.com": {
        department_code: "HR",
        team_code: "HR-1",
        manager_company_email: "tn1@company.com"
    },
    "dev1@company.com": {
        department_code: "RESEARCH",
        team_code: "RESEARCH-1",
        manager_company_email: "tn2@company.com"
    },
    "dev2@company.com": {
        department_code: "TECH",
        team_code: "TECH-1",
        manager_company_email: "tn3@company.com"
    },
    "dev3@company.com": {
        department_code: "TECH",
        team_code: "TECH-1",
        manager_company_email: "tn3@company.com"
    },
    "dev4@company.com": {
        department_code: "HR",
        team_code: null,
        manager_company_email: "tp1@company.com"
    },
    "dev5@company.com": {
        department_code: "HR",
        team_code: null,
        manager_company_email: "tp1@company.com"
    }
};

const parseIndexedStaff = (email, prefix) => {
    const match = email.match(new RegExp(`^${prefix}(\\d+)@company\\.com$`));
    if (!match) return null;
    return Number(match[1]);
};

const getOrgByPattern = (email) => {
    // All employees now use fixed organization mapping
    return {
        department_code: null,
        team_code: null,
        manager_company_email: null
    };
};

const employeesWithOrg = employees.map((employee) => {
    const fixedOrg = fixedOrgByEmail[employee.company_email];

    return {
        ...employee,
        department_code: fixedOrg.department_code,
        team_code: fixedOrg.team_code,
        manager_company_email: fixedOrg.manager_company_email
    };
});

export default employeesWithOrg;

