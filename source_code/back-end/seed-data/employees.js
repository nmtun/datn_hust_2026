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
        role: "employee",
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
        role: "employee",
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
        role: "employee",
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
        role: "employee",
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
    }
];

export default employees;

