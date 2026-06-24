export const jobDescriptionSeeds = [
    {
        key: "JD-BE-MID",
        title: "Backend Engineer (Mid)",
        location: "Ha Noi",
        type_of_work: "hybrid",
        description: "Build and maintain backend services for HR and internal workflow modules.",
        requirements: "Solid Node.js, SQL, REST API design, and debugging skills.",
        responsibilities: "Develop APIs, optimize database queries, and support deployment.",
        qualifications: "2+ years in backend development with collaborative mindset.",
        experience_level: "mid",
        employment_type: "full-time",
        salary_range_min: 20000000,
        salary_range_max: 32000000,
        status: "active",
        posting_date: "2026-06-01",
        closing_date: "2026-07-15",
        department_code: "TECH",
        positions_count: 2,
        created_by_email: "tp3@company.com"
    },
    {
        key: "JD-FE-FRESHER",
        title: "Frontend Engineer (Fresher)",
        location: "Ha Noi",
        type_of_work: "on-site",
        description: "Implement responsive UI pages and reusable components.",
        requirements: "Good JavaScript fundamentals and basic React/Next.js knowledge.",
        responsibilities: "Build screens, fix bugs, and support UI testing.",
        qualifications: "0-1 years experience or equivalent internship projects.",
        experience_level: "fresher",
        employment_type: "full-time",
        salary_range_min: 12000000,
        salary_range_max: 18000000,
        status: "active",
        posting_date: "2026-06-03",
        closing_date: "2026-07-20",
        department_code: "TECH",
        positions_count: 1,
        created_by_email: "hr1@company.com"
    },
    {
        key: "JD-HR-INTERN",
        title: "HR Intern",
        location: "Ha Noi",
        type_of_work: "on-site",
        description: "Support recruitment operations and interview coordination.",
        requirements: "Good communication and basic office software skills.",
        responsibilities: "Screen CVs, schedule interviews, and update ATS records.",
        qualifications: "Final-year students or fresh graduates in HR related majors.",
        experience_level: "intern",
        employment_type: "part-time",
        salary_range_min: 3000000,
        salary_range_max: 5000000,
        status: "active",
        posting_date: "2026-06-05",
        closing_date: "2026-08-01",
        department_code: "HR",
        positions_count: 2,
        created_by_email: "tp1@company.com"
    },
    {
        key: "JD-RESEARCH-SENIOR",
        title: "AI Research Engineer (Senior)",
        location: "Remote",
        type_of_work: "remote",
        description: "Lead applied research projects and translate findings into prototypes.",
        requirements: "Strong ML background and practical experimentation experience.",
        responsibilities: "Design experiments, mentor team members, and share best practices.",
        qualifications: "4+ years in applied research with measurable outcomes.",
        experience_level: "senior",
        employment_type: "full-time",
        salary_range_min: 35000000,
        salary_range_max: 50000000,
        status: "paused",
        posting_date: "2026-05-25",
        closing_date: "2026-07-30",
        department_code: "RESEARCH",
        positions_count: 1,
        created_by_email: "tp2@company.com"
    }
];

export const candidateUserSeeds = [
    {
        personal_email: "candidate1@gmail.com",
        company_email: "candidate1@talent.com",
        password: "123456",
        full_name: "Le Minh Anh",
        phone_number: "0910001001",
        address: "Ha Noi",
        role: "candidate",
        status: "active"
    },
    {
        personal_email: "candidate2@gmail.com",
        company_email: "candidate2@talent.com",
        password: "123456",
        full_name: "Tran Quoc Bao",
        phone_number: "0910001002",
        address: "Hai Phong",
        role: "candidate",
        status: "active"
    },
    {
        personal_email: "candidate3@gmail.com",
        company_email: "candidate3@talent.com",
        password: "123456",
        full_name: "Pham Thu Chi",
        phone_number: "0910001003",
        address: "Da Nang",
        role: "candidate",
        status: "active"
    },
    {
        personal_email: "candidate4@gmail.com",
        company_email: "candidate4@talent.com",
        password: "123456",
        full_name: "Nguyen Tien Dat",
        phone_number: "0910001004",
        address: "Ha Noi",
        role: "candidate",
        status: "active"
    },
    {
        personal_email: "candidate5@gmail.com",
        company_email: "candidate5@talent.com",
        password: "123456",
        full_name: "Vu Thi Giang",
        phone_number: "0910001005",
        address: "Nam Dinh",
        role: "candidate",
        status: "active"
    },
    {
        personal_email: "candidate6@gmail.com",
        company_email: "candidate6@talent.com",
        password: "123456",
        full_name: "Hoang Duc Huy",
        phone_number: "0910001006",
        address: "Thai Binh",
        role: "candidate",
        status: "active"
    }
];

export const candidateProfileSeeds = [
    {
        company_email: "candidate1@talent.com",
        job_key: "JD-BE-MID",
        cv_file_path: "mock/cv/candidate1_backend.pdf",
        candidate_status: "screening",
        source: "website",
        apply_date: "2026-06-12",
        evaluation: 78,
        evaluation_comment: {
            communication: "Good",
            technical: "Solid backend basics",
            next_step: "Technical interview"
        },
        cover_letter: "Interested in scalable backend systems and API design."
    },
    {
        company_email: "candidate2@talent.com",
        job_key: "JD-FE-FRESHER",
        cv_file_path: "mock/cv/candidate2_frontend.pdf",
        candidate_status: "new",
        source: "linkedin",
        apply_date: "2026-06-14",
        evaluation: 70,
        evaluation_comment: {
            communication: "Clear",
            technical: "Basic React and CSS",
            next_step: "Screening"
        },
        cover_letter: "Looking for a fresher frontend role to grow quickly."
    },
    {
        company_email: "candidate3@talent.com",
        job_key: "JD-HR-INTERN",
        cv_file_path: "mock/cv/candidate3_hr.pdf",
        candidate_status: "interview",
        source: "topcv",
        apply_date: "2026-06-10",
        evaluation: 82,
        evaluation_comment: {
            communication: "Strong",
            hr_knowledge: "Good internship exposure",
            next_step: "Final interview"
        },
        cover_letter: "Passionate about people operations and recruitment support."
    },
    {
        company_email: "candidate4@talent.com",
        job_key: "JD-RESEARCH-SENIOR",
        cv_file_path: "mock/cv/candidate4_ai.pdf",
        candidate_status: "offered",
        source: "referral",
        apply_date: "2026-06-05",
        evaluation: 90,
        evaluation_comment: {
            communication: "Excellent",
            technical: "Strong ML portfolio",
            next_step: "Offer negotiation"
        },
        cover_letter: "Can lead applied research and production-ready prototypes."
    },
    {
        company_email: "candidate5@talent.com",
        job_key: "JD-BE-MID",
        cv_file_path: "mock/cv/candidate5_backend.pdf",
        candidate_status: "rejected",
        source: "website",
        apply_date: "2026-06-01",
        evaluation: 55,
        evaluation_comment: {
            communication: "Average",
            technical: "Needs stronger SQL and system design",
            next_step: "Archive profile"
        },
        cover_letter: "Interested in backend role and willing to improve quickly."
    },
    {
        company_email: "candidate6@talent.com",
        job_key: "JD-HR-INTERN",
        cv_file_path: "mock/cv/candidate6_hr.pdf",
        candidate_status: "hired",
        source: "other",
        apply_date: "2026-05-22",
        evaluation: 88,
        evaluation_comment: {
            communication: "Very good",
            hr_knowledge: "Practical internship projects",
            next_step: "Onboarding"
        },
        cover_letter: "Ready to contribute immediately to HR operations."
    }
];

export const tagSeeds = [
    { name: "onboarding" },
    { name: "backend" },
    { name: "frontend" },
    { name: "devops" },
    { name: "security" },
    { name: "hr-policy" },
    { name: "communication" },
    { name: "recruitment" }
];

export const trainingMaterialSeeds = [
    {
        key: "MAT-ONBOARD-CORE",
        title: "Company Onboarding Handbook",
        type: "document",
        content_path: "mock/training/onboarding-handbook.pdf",
        created_by_email: "hr3@company.com",
        description: "Core onboarding process, workflow, and company policy.",
        status: "active"
    },
    {
        key: "MAT-SECURE-CODING",
        title: "Secure Coding Basics",
        type: "video",
        content_path: "mock/training/secure-coding.mp4",
        created_by_email: "dev3@company.com",
        description: "OWASP basics, secure coding checklist, and review tips.",
        status: "active"
    },
    {
        key: "MAT-HR-PROCESS",
        title: "Recruitment Process SOP",
        type: "both",
        content_path: "mock/training/recruitment-sop.zip",
        created_by_email: "tn1@company.com",
        description: "Standard operating procedure for recruitment and interview process.",
        status: "active"
    },
    {
        key: "MAT-LMS-DRAFT",
        title: "Learning Portal Guide (Draft)",
        type: "document",
        content_path: "mock/training/lms-guide-draft.docx",
        created_by_email: "hr2@company.com",
        description: "Draft guide for using internal learning portal.",
        status: "draft"
    }
];

export const quizSeeds = [
    {
        key: "QUIZ-ONBOARD",
        title: "Onboarding Fundamentals Quiz",
        description: "Quiz for core onboarding policies and process.",
        duration: 20,
        passing_score: 70,
        created_by_email: "hr3@company.com",
        creation_date: "2026-06-10",
        status: "active"
    },
    {
        key: "QUIZ-SECURITY",
        title: "Secure Coding Awareness Quiz",
        description: "Assess understanding of secure coding fundamentals.",
        duration: 25,
        passing_score: 75,
        created_by_email: "dev3@company.com",
        creation_date: "2026-06-11",
        status: "active"
    },
    {
        key: "QUIZ-HR-POLICY",
        title: "HR Policy and Hiring Flow Quiz",
        description: "Evaluate understanding of hiring SOP and HR policy.",
        duration: 15,
        passing_score: 70,
        created_by_email: "tn1@company.com",
        creation_date: "2026-06-12",
        status: "active"
    }
];

export const materialQuizLinkSeeds = [
    { material_key: "MAT-ONBOARD-CORE", quiz_key: "QUIZ-ONBOARD", is_required: true, sequence_order: 1 },
    { material_key: "MAT-SECURE-CODING", quiz_key: "QUIZ-SECURITY", is_required: true, sequence_order: 1 },
    { material_key: "MAT-HR-PROCESS", quiz_key: "QUIZ-HR-POLICY", is_required: true, sequence_order: 1 },
    { material_key: "MAT-HR-PROCESS", quiz_key: "QUIZ-ONBOARD", is_required: false, sequence_order: 2 }
];

export const quizQuestionSeeds = [
    {
        key: "Q-ONBOARD-01",
        question_text: "What should a new employee complete in the first week?",
        question_type: "multiple_choice",
        options: ["Only paperwork", "Onboarding checklist and team orientation", "Only product training", "No required activities"],
        correct_answer: "Onboarding checklist and team orientation",
        points: 2,
        created_by_email: "hr3@company.com"
    },
    {
        key: "Q-ONBOARD-02",
        question_text: "Probation goal tracking should be reviewed with manager weekly.",
        question_type: "true_false",
        options: ["true", "false"],
        correct_answer: "true",
        points: 1,
        created_by_email: "hr3@company.com"
    },
    {
        key: "Q-SECURITY-01",
        question_text: "Which practice helps prevent SQL injection?",
        question_type: "multiple_choice",
        options: ["String concatenation", "Parameterized query", "Disabling logs", "Hardcoded credentials"],
        correct_answer: "Parameterized query",
        points: 2,
        created_by_email: "dev3@company.com"
    },
    {
        key: "Q-SECURITY-02",
        question_text: "Select all secure password storage methods.",
        question_type: "multiple_response",
        options: ["bcrypt", "plain text", "argon2", "base64"],
        correct_answer: ["bcrypt", "argon2"],
        points: 2,
        created_by_email: "dev3@company.com"
    },
    {
        key: "Q-HR-01",
        question_text: "Which step is valid before scheduling interview?",
        question_type: "multiple_choice",
        options: ["Skip CV screening", "Prepare interview panel and scorecard", "Send offer letter", "Close candidate profile"],
        correct_answer: "Prepare interview panel and scorecard",
        points: 2,
        created_by_email: "tn1@company.com"
    },
    {
        key: "Q-HR-02",
        question_text: "Candidate status should be updated after each interview round.",
        question_type: "true_false",
        options: ["true", "false"],
        correct_answer: "true",
        points: 1,
        created_by_email: "tn1@company.com"
    }
];

export const questionTagLinkSeeds = [
    { question_key: "Q-ONBOARD-01", tag_name: "onboarding" },
    { question_key: "Q-ONBOARD-02", tag_name: "onboarding" },
    { question_key: "Q-SECURITY-01", tag_name: "security" },
    { question_key: "Q-SECURITY-01", tag_name: "backend" },
    { question_key: "Q-SECURITY-02", tag_name: "security" },
    { question_key: "Q-HR-01", tag_name: "hr-policy" },
    { question_key: "Q-HR-01", tag_name: "recruitment" },
    { question_key: "Q-HR-02", tag_name: "hr-policy" }
];

export const quizTagLinkSeeds = [
    { quiz_key: "QUIZ-ONBOARD", tag_name: "onboarding" },
    { quiz_key: "QUIZ-ONBOARD", tag_name: "communication" },
    { quiz_key: "QUIZ-SECURITY", tag_name: "security" },
    { quiz_key: "QUIZ-SECURITY", tag_name: "backend" },
    { quiz_key: "QUIZ-HR-POLICY", tag_name: "hr-policy" },
    { quiz_key: "QUIZ-HR-POLICY", tag_name: "recruitment" }
];

export const questionToQuizLinkSeeds = [
    { quiz_key: "QUIZ-ONBOARD", question_key: "Q-ONBOARD-01", tag_name: "onboarding", question_order: 1 },
    { quiz_key: "QUIZ-ONBOARD", question_key: "Q-ONBOARD-02", tag_name: "onboarding", question_order: 2 },
    { quiz_key: "QUIZ-SECURITY", question_key: "Q-SECURITY-01", tag_name: "security", question_order: 1 },
    { quiz_key: "QUIZ-SECURITY", question_key: "Q-SECURITY-02", tag_name: "security", question_order: 2 },
    { quiz_key: "QUIZ-HR-POLICY", question_key: "Q-HR-01", tag_name: "hr-policy", question_order: 1 },
    { quiz_key: "QUIZ-HR-POLICY", question_key: "Q-HR-02", tag_name: "hr-policy", question_order: 2 }
];

export const trainingRecordSeeds = [
    {
        user_email: "hr1@company.com",
        material_key: "MAT-ONBOARD-CORE",
        start_date: "2026-06-11",
        completion_date: "2026-06-12",
        status: "completed",
        progress: 100
    },
    {
        user_email: "dev1@company.com",
        material_key: "MAT-SECURE-CODING",
        start_date: "2026-06-11",
        completion_date: "2026-06-14",
        status: "completed",
        progress: 100
    },
    {
        user_email: "dev2@company.com",
        material_key: "MAT-SECURE-CODING",
        start_date: "2026-06-12",
        completion_date: null,
        status: "in_progress",
        progress: 65
    },
    {
        user_email: "hr2@company.com",
        material_key: "MAT-HR-PROCESS",
        start_date: "2026-06-12",
        completion_date: "2026-06-15",
        status: "completed",
        progress: 100
    },
    {
        user_email: "dev4@company.com",
        material_key: "MAT-ONBOARD-CORE",
        start_date: "2026-06-13",
        completion_date: null,
        status: "in_progress",
        progress: 40
    }
];

export const quizResultSeeds = [
    {
        user_email: "hr1@company.com",
        quiz_key: "QUIZ-ONBOARD",
        score: 82,
        pass_status: true,
        completion_time: 900,
        attempt_number: 1,
        completion_date: "2026-06-12"
    },
    {
        user_email: "dev1@company.com",
        quiz_key: "QUIZ-SECURITY",
        score: 78,
        pass_status: true,
        completion_time: 1100,
        attempt_number: 1,
        completion_date: "2026-06-14"
    },
    {
        user_email: "dev2@company.com",
        quiz_key: "QUIZ-SECURITY",
        score: 68,
        pass_status: false,
        completion_time: 1200,
        attempt_number: 1,
        completion_date: "2026-06-15"
    },
    {
        user_email: "dev2@company.com",
        quiz_key: "QUIZ-SECURITY",
        score: 80,
        pass_status: true,
        completion_time: 980,
        attempt_number: 2,
        completion_date: "2026-06-20"
    },
    {
        user_email: "hr2@company.com",
        quiz_key: "QUIZ-HR-POLICY",
        score: 86,
        pass_status: true,
        completion_time: 700,
        attempt_number: 1,
        completion_date: "2026-06-15"
    }
];

export const quizAnswerSeeds = [
    { user_email: "hr1@company.com", quiz_key: "QUIZ-ONBOARD", attempt_number: 1, question_key: "Q-ONBOARD-01", answer: "Onboarding checklist and team orientation", correct: true, score: 2 },
    { user_email: "hr1@company.com", quiz_key: "QUIZ-ONBOARD", attempt_number: 1, question_key: "Q-ONBOARD-02", answer: "true", correct: true, score: 1 },

    { user_email: "dev1@company.com", quiz_key: "QUIZ-SECURITY", attempt_number: 1, question_key: "Q-SECURITY-01", answer: "Parameterized query", correct: true, score: 2 },
    { user_email: "dev1@company.com", quiz_key: "QUIZ-SECURITY", attempt_number: 1, question_key: "Q-SECURITY-02", answer: "[\"bcrypt\",\"argon2\"]", correct: true, score: 2 },

    { user_email: "dev2@company.com", quiz_key: "QUIZ-SECURITY", attempt_number: 1, question_key: "Q-SECURITY-01", answer: "String concatenation", correct: false, score: 0 },
    { user_email: "dev2@company.com", quiz_key: "QUIZ-SECURITY", attempt_number: 1, question_key: "Q-SECURITY-02", answer: "[\"bcrypt\"]", correct: false, score: 1 },

    { user_email: "dev2@company.com", quiz_key: "QUIZ-SECURITY", attempt_number: 2, question_key: "Q-SECURITY-01", answer: "Parameterized query", correct: true, score: 2 },
    { user_email: "dev2@company.com", quiz_key: "QUIZ-SECURITY", attempt_number: 2, question_key: "Q-SECURITY-02", answer: "[\"bcrypt\",\"argon2\"]", correct: true, score: 2 },

    { user_email: "hr2@company.com", quiz_key: "QUIZ-HR-POLICY", attempt_number: 1, question_key: "Q-HR-01", answer: "Prepare interview panel and scorecard", correct: true, score: 2 },
    { user_email: "hr2@company.com", quiz_key: "QUIZ-HR-POLICY", attempt_number: 1, question_key: "Q-HR-02", answer: "true", correct: true, score: 1 }
];

export const projectSeeds = [
    {
        key: "PRJ-ATS-2026",
        name: "Recruitment ATS Upgrade",
        goal: "Improve hiring pipeline visibility and processing speed.",
        description: "Upgrade ATS workflows and automate candidate stage transitions.",
        manager_email: "mng1@company.com",
        department_code: "HR",
        start_date: "2026-05-15",
        end_date: "2026-08-30",
        status: "doing",
        active: true
    },
    {
        key: "PRJ-LMS-2026",
        name: "Internal Learning Portal",
        goal: "Centralize training materials and assessments.",
        description: "Build LMS features for training assignment and quiz tracking.",
        manager_email: "tp3@company.com",
        department_code: "TECH",
        start_date: "2026-04-01",
        end_date: "2026-09-15",
        status: "review",
        active: true
    },
    {
        key: "PRJ-INFRA-2026",
        name: "DevOps Stability Initiative",
        goal: "Increase release reliability and reduce deployment incidents.",
        description: "Improve CI/CD quality gates and strengthen monitoring.",
        manager_email: "tp2@company.com",
        department_code: "RESEARCH",
        start_date: "2026-03-20",
        end_date: "2026-12-01",
        status: "on_hold",
        active: true
    }
];

export const taskSeeds = [
    {
        key: "TASK-ATS-PLAN",
        project_key: "PRJ-ATS-2026",
        team_code: "HR-1",
        title: "Define ATS upgrade scope",
        description: "Finalize backlog and acceptance criteria for ATS upgrade.",
        assigned_to_email: "tp1@company.com",
        created_by_email: "mng1@company.com",
        start_date: "2026-05-16",
        due_date: "2026-05-25",
        completed_date: "2026-05-24",
        status: "done",
        priority: "high",
        active: true
    },
    {
        key: "TASK-ATS-BE",
        project_key: "PRJ-ATS-2026",
        team_code: "TECH-1",
        title: "Implement candidate stage APIs",
        description: "Build APIs for candidate transitions and timeline logs.",
        assigned_to_email: "dev1@company.com",
        created_by_email: "tp3@company.com",
        start_date: "2026-05-25",
        due_date: "2026-06-20",
        completed_date: null,
        status: "doing",
        priority: "urgent",
        active: true
    },
    {
        key: "TASK-ATS-FE",
        project_key: "PRJ-ATS-2026",
        team_code: "TECH-1",
        title: "Build candidate pipeline UI",
        description: "Create Kanban-style candidate board and status filters.",
        assigned_to_email: "dev2@company.com",
        created_by_email: "tp3@company.com",
        start_date: "2026-05-28",
        due_date: "2026-06-24",
        completed_date: null,
        status: "review",
        priority: "high",
        active: true
    },
    {
        key: "TASK-ATS-INTEG",
        project_key: "PRJ-ATS-2026",
        parent_task_key: "TASK-ATS-BE",
        team_code: "TECH-1",
        title: "Integrate notification workflow",
        description: "Emit notifications on candidate status updates.",
        assigned_to_email: "dev3@company.com",
        created_by_email: "dev1@company.com",
        start_date: "2026-06-01",
        due_date: "2026-06-22",
        completed_date: null,
        status: "review",
        priority: "medium",
        active: true
    },
    {
        key: "TASK-LMS-CONTENT",
        project_key: "PRJ-LMS-2026",
        team_code: "HR-1",
        title: "Prepare onboarding course content",
        description: "Draft onboarding modules and review checklist.",
        assigned_to_email: "hr3@company.com",
        created_by_email: "tp1@company.com",
        start_date: "2026-04-10",
        due_date: "2026-05-15",
        completed_date: "2026-05-14",
        status: "done",
        priority: "medium",
        active: true
    },
    {
        key: "TASK-LMS-QUIZ",
        project_key: "PRJ-LMS-2026",
        team_code: "RESEARCH-1",
        title: "Question bank standardization",
        description: "Design reusable question bank tags and quiz linking rules.",
        assigned_to_email: "dev4@company.com",
        created_by_email: "tn2@company.com",
        start_date: "2026-05-05",
        due_date: "2026-06-12",
        completed_date: null,
        status: "doing",
        priority: "medium",
        active: true
    },
    {
        key: "TASK-INFRA-CI",
        project_key: "PRJ-INFRA-2026",
        team_code: "TECH-1",
        title: "Harden CI pipeline checks",
        description: "Add security linting and deployment blockers for failed quality gates.",
        assigned_to_email: "dev3@company.com",
        created_by_email: "tp3@company.com",
        start_date: "2026-04-20",
        due_date: "2026-05-30",
        completed_date: "2026-05-29",
        status: "done",
        priority: "high",
        active: true
    },
    {
        key: "TASK-INFRA-SEC",
        project_key: "PRJ-INFRA-2026",
        team_code: "TECH-1",
        title: "Rotate service credentials",
        description: "Rotate internal credentials and update secret management policy.",
        assigned_to_email: "dev5@company.com",
        created_by_email: "dev3@company.com",
        start_date: "2026-06-02",
        due_date: "2026-06-28",
        completed_date: null,
        status: "to_do",
        priority: "high",
        active: true
    }
];

export const taskCommentSeeds = [
    {
        task_key: "TASK-ATS-BE",
        user_email: "tp3@company.com",
        comment: "API contract approved. Please include pagination for candidate timeline.",
        created_at: "2026-06-02T09:00:00.000Z"
    },
    {
        task_key: "TASK-ATS-BE",
        user_email: "dev1@company.com",
        comment: "Added pagination and status transition validation rules.",
        created_at: "2026-06-05T14:00:00.000Z"
    },
    {
        task_key: "TASK-ATS-FE",
        user_email: "dev2@company.com",
        comment: "Pipeline board is ready for QA test in staging.",
        created_at: "2026-06-14T10:30:00.000Z"
    },
    {
        task_key: "TASK-LMS-QUIZ",
        user_email: "tn2@company.com",
        comment: "Please align quiz tag naming with the training taxonomy.",
        created_at: "2026-06-11T08:15:00.000Z"
    },
    {
        task_key: "TASK-INFRA-SEC",
        user_email: "dev3@company.com",
        comment: "Priority remains high due to audit requirement this quarter.",
        created_at: "2026-06-18T16:10:00.000Z"
    }
];

export const taskReviewSeeds = [
    {
        task_key: "TASK-ATS-INTEG",
        reviewer_email: "tp3@company.com",
        reviewed_user_email: "dev3@company.com",
        decision: "changes_requested",
        note: "Need to include actor_id and metadata in generated notifications."
    },
    {
        task_key: "TASK-LMS-CONTENT",
        reviewer_email: "tp1@company.com",
        reviewed_user_email: "hr3@company.com",
        decision: "approved",
        note: "Content quality is good and ready to publish."
    },
    {
        task_key: "TASK-INFRA-CI",
        reviewer_email: "tp3@company.com",
        reviewed_user_email: "dev3@company.com",
        decision: "approved",
        note: "Pipeline quality gates are stable after two release cycles."
    }
];

export const notificationSeeds = [
    {
        recipient_email: "dev1@company.com",
        actor_email: "tp3@company.com",
        type: "task_assigned",
        title: "New task assigned",
        message: "You are assigned to Implement candidate stage APIs.",
        entity_type: "task",
        entity_ref: { kind: "task", key: "TASK-ATS-BE" },
        metadata: { priority: "urgent", project_key: "PRJ-ATS-2026" },
        is_read: false
    },
    {
        recipient_email: "dev2@company.com",
        actor_email: "tp3@company.com",
        type: "task_reassigned",
        title: "Task assignment updated",
        message: "Candidate pipeline UI task has been reassigned to you.",
        entity_type: "task",
        entity_ref: { kind: "task", key: "TASK-ATS-FE" },
        metadata: { previous_assignee: "dev4@company.com" },
        is_read: true,
        read_at: "2026-06-16T08:00:00.000Z"
    },
    {
        recipient_email: "tp3@company.com",
        actor_email: "dev2@company.com",
        type: "task_status_changed",
        title: "Task moved to review",
        message: "Build candidate pipeline UI is now in review.",
        entity_type: "task",
        entity_ref: { kind: "task", key: "TASK-ATS-FE" },
        metadata: { from_status: "doing", to_status: "review" },
        is_read: false
    },
    {
        recipient_email: "dev3@company.com",
        actor_email: "tp3@company.com",
        type: "task_commented",
        title: "New comment on task",
        message: "Please include metadata and actor details for event tracing.",
        entity_type: "task",
        entity_ref: { kind: "task", key: "TASK-ATS-INTEG" },
        metadata: { source: "task-review" },
        is_read: false
    },
    {
        recipient_email: "dev3@company.com",
        actor_email: "tp3@company.com",
        type: "task_reviewed",
        title: "Task review result",
        message: "Integrate notification workflow requires changes.",
        entity_type: "task",
        entity_ref: { kind: "task", key: "TASK-ATS-INTEG" },
        metadata: { decision: "changes_requested" },
        is_read: false
    },
    {
        recipient_email: "mng1@company.com",
        actor_email: "tp1@company.com",
        type: "task_updated",
        title: "Project task update",
        message: "ATS scope planning task has been completed.",
        entity_type: "task",
        entity_ref: { kind: "task", key: "TASK-ATS-PLAN" },
        metadata: { status: "done" },
        is_read: true,
        read_at: "2026-05-25T09:30:00.000Z"
    },
    {
        recipient_email: "hr1@company.com",
        actor_email: "candidate1@talent.com",
        type: "candidate_applied",
        title: "New candidate application",
        message: "A new candidate applied for Backend Engineer (Mid).",
        entity_type: "candidate",
        entity_ref: { kind: "candidate", email: "candidate1@talent.com" },
        metadata: { job_key: "JD-BE-MID" },
        is_read: false
    },
    {
        recipient_email: "mng1@company.com",
        actor_email: "tp1@company.com",
        type: "performance_period_created",
        title: "Performance period created",
        message: "Performance period 2026-Q2 is available.",
        entity_type: "performance_period",
        entity_ref: { kind: "period", key: "2026-Q2" },
        metadata: { status: "in_progress" },
        is_read: false
    },
    {
        recipient_email: "dev4@company.com",
        actor_email: "tp3@company.com",
        type: "performance_review_reminder",
        title: "Performance review reminder",
        message: "Please complete your self-review before the deadline.",
        entity_type: "performance_period",
        entity_ref: { kind: "period", key: "2026-Q2" },
        metadata: { deadline: "2026-06-30" },
        is_read: false
    },
    {
        recipient_email: "mng1@company.com",
        actor_email: "tp1@company.com",
        type: "compensation_recommendation",
        title: "Compensation recommendation",
        message: "A compensation adjustment is suggested for dev2@company.com.",
        entity_type: "compensation",
        entity_ref: null,
        metadata: { target_user: "dev2@company.com", effective_date: "2026-02-01" },
        is_read: false
    }
];

const moduleSeeds = {
    jobDescriptionSeeds,
    candidateUserSeeds,
    candidateProfileSeeds,
    tagSeeds,
    trainingMaterialSeeds,
    quizSeeds,
    materialQuizLinkSeeds,
    quizQuestionSeeds,
    questionTagLinkSeeds,
    quizTagLinkSeeds,
    questionToQuizLinkSeeds,
    trainingRecordSeeds,
    quizResultSeeds,
    quizAnswerSeeds,
    projectSeeds,
    taskSeeds,
    taskCommentSeeds,
    taskReviewSeeds,
    notificationSeeds
};

export default moduleSeeds;
