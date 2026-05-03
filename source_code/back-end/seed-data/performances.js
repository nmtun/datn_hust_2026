const performanceSeeds = [
    // ===== 2025-Q4 =====
    {
        period_key: "2025-Q4",
        employee_email: "tp1@company.com",
        reviewer_email: "mng1@company.com",
        review_date: "2025-12-20",
        rating: 4.2,
        visibility: "shared_with_employee",
        kpi_goals: "Lead HR roadmap for Q4 and stabilize hiring pipeline.",
        achievement: "Reduced time-to-hire by 12% and improved onboarding checklist.",
        feedback: "Strong leadership and execution; keep improving reporting cadence."
    },
    {
        period_key: "2025-Q4",
        employee_email: "tp2@company.com",
        reviewer_email: "mng1@company.com",
        review_date: "2025-12-21",
        rating: 4.0,
        visibility: "shared_with_employee",
        kpi_goals: "Deliver research milestones and improve documentation quality.",
        achievement: "Completed two major research prototypes and documented findings.",
        feedback: "Good results; prioritize knowledge sharing next quarter."
    },
    {
        period_key: "2025-Q4",
        employee_email: "tp3@company.com",
        reviewer_email: "mng1@company.com",
        review_date: "2025-12-22",
        rating: 3.9,
        visibility: "private",
        kpi_goals: "Improve delivery predictability and reduce critical defects.",
        achievement: "Released 3 features on time with fewer production issues.",
        feedback: "Solid progress; tighten release checklists."
    },
    {
        period_key: "2025-Q4",
        employee_email: "tn1@company.com",
        reviewer_email: "tp1@company.com",
        review_date: "2025-12-18",
        rating: 4.1,
        visibility: "shared_with_employee",
        kpi_goals: "Lead HR team and standardize recruitment templates.",
        achievement: "Standardized interview kit and coached HR staff.",
        feedback: "Great team coordination; continue mentoring."
    },
    {
        period_key: "2025-Q4",
        employee_email: "tn2@company.com",
        reviewer_email: "tp2@company.com",
        review_date: "2025-12-18",
        rating: 3.8,
        visibility: "shared_with_employee",
        kpi_goals: "Lead research team and improve experiment throughput.",
        achievement: "Delivered weekly experiments and improved lab workflow.",
        feedback: "Good momentum; focus on deeper analysis."
    },
    {
        period_key: "2025-Q4",
        employee_email: "tn3@company.com",
        reviewer_email: "tp3@company.com",
        review_date: "2025-12-19",
        rating: 4.0,
        visibility: "shared_with_employee",
        kpi_goals: "Lead dev team and reduce technical debt.",
        achievement: "Completed refactor backlog and stabilized CI.",
        feedback: "Keep pairing with junior developers."
    },
    {
        period_key: "2025-Q4",
        employee_email: "hr1@company.com",
        reviewer_email: "tn1@company.com",
        review_date: "2025-12-15",
        rating: 3.7,
        visibility: "shared_with_employee",
        kpi_goals: "Handle recruitment pipeline and candidate communication.",
        achievement: "Closed 8 roles with improved candidate feedback.",
        feedback: "Good responsiveness; improve documentation quality."
    },
    {
        period_key: "2025-Q4",
        employee_email: "hr2@company.com",
        reviewer_email: "tn1@company.com",
        review_date: "2025-12-15",
        rating: 3.9,
        visibility: "shared_with_employee",
        kpi_goals: "Improve HR operations and payroll accuracy.",
        achievement: "Reduced payroll issues to near zero.",
        feedback: "Nice attention to detail; keep it consistent."
    },
    {
        period_key: "2025-Q4",
        employee_email: "hr3@company.com",
        reviewer_email: "tn1@company.com",
        review_date: "2025-12-16",
        rating: 3.6,
        visibility: "shared_with_employee",
        kpi_goals: "Support training logistics and internal communications.",
        achievement: "Organized 4 training sessions with high attendance.",
        feedback: "Solid delivery; sharpen follow-up surveys."
    },
    {
        period_key: "2025-Q4",
        employee_email: "dev1@company.com",
        reviewer_email: "tn2@company.com",
        review_date: "2025-12-17",
        rating: 3.8,
        visibility: "shared_with_employee",
        kpi_goals: "Deliver research backlog items with measurable results.",
        achievement: "Completed 6 experiments and summarized findings.",
        feedback: "Good pace; align more with product goals."
    },
    {
        period_key: "2025-Q4",
        employee_email: "dev2@company.com",
        reviewer_email: "tn3@company.com",
        review_date: "2025-12-17",
        rating: 4.0,
        visibility: "shared_with_employee",
        kpi_goals: "Deliver core features and improve test coverage.",
        achievement: "Shipped 2 modules and added 20% coverage.",
        feedback: "Great impact; keep code reviews disciplined."
    },
    {
        period_key: "2025-Q4",
        employee_email: "dev3@company.com",
        reviewer_email: "tn3@company.com",
        review_date: "2025-12-17",
        rating: 3.9,
        visibility: "shared_with_employee",
        kpi_goals: "Support backend performance improvements.",
        achievement: "Reduced API latency by 15%.",
        feedback: "Nice optimization work; document changes clearly."
    },

    // ===== 2026-Q1 =====
    {
        period_key: "2026-Q1",
        employee_email: "tp1@company.com",
        reviewer_email: "mng1@company.com",
        review_date: "2026-03-20",
        rating: 4.3,
        visibility: "shared_with_employee",
        kpi_goals: "Scale HR operations and improve retention metrics.",
        achievement: "Retention improved by 6% and onboarding time dropped.",
        feedback: "Excellent outcomes; keep scaling processes."
    },
    {
        period_key: "2026-Q1",
        employee_email: "tp2@company.com",
        reviewer_email: "mng1@company.com",
        review_date: "2026-03-21",
        rating: 4.1,
        visibility: "shared_with_employee",
        kpi_goals: "Drive research alignment with product roadmap.",
        achievement: "Aligned experiments with roadmap and delivered 3 POCs.",
        feedback: "Good alignment; expand cross-team demos."
    },
    {
        period_key: "2026-Q1",
        employee_email: "tp3@company.com",
        reviewer_email: "mng1@company.com",
        review_date: "2026-03-22",
        rating: 4.0,
        visibility: "private",
        kpi_goals: "Increase delivery velocity and reduce defects.",
        achievement: "Delivery velocity up 10% with stable defect rate.",
        feedback: "Strong delivery; focus on risk management."
    },
    {
        period_key: "2026-Q1",
        employee_email: "tn1@company.com",
        reviewer_email: "tp1@company.com",
        review_date: "2026-03-18",
        rating: 4.0,
        visibility: "shared_with_employee",
        kpi_goals: "Improve HR service response time.",
        achievement: "Response time reduced from 3 days to 1 day.",
        feedback: "Nice improvement; keep monitoring SLAs."
    },
    {
        period_key: "2026-Q1",
        employee_email: "tn2@company.com",
        reviewer_email: "tp2@company.com",
        review_date: "2026-03-18",
        rating: 3.9,
        visibility: "shared_with_employee",
        kpi_goals: "Mentor researchers and improve experiment quality.",
        achievement: "Set quality checklists and coached team weekly.",
        feedback: "Keep investing in peer reviews."
    },
    {
        period_key: "2026-Q1",
        employee_email: "tn3@company.com",
        reviewer_email: "tp3@company.com",
        review_date: "2026-03-19",
        rating: 4.1,
        visibility: "shared_with_employee",
        kpi_goals: "Improve development cycle time and code quality.",
        achievement: "Cycle time reduced by 8% with fewer regressions.",
        feedback: "Great direction; keep the testing discipline."
    },
    {
        period_key: "2026-Q1",
        employee_email: "hr1@company.com",
        reviewer_email: "tn1@company.com",
        review_date: "2026-03-15",
        rating: 3.8,
        visibility: "shared_with_employee",
        kpi_goals: "Improve candidate screening consistency.",
        achievement: "Introduced scoring template and reduced rework.",
        feedback: "Good initiative; document updates regularly."
    },
    {
        period_key: "2026-Q1",
        employee_email: "hr2@company.com",
        reviewer_email: "tn1@company.com",
        review_date: "2026-03-15",
        rating: 3.9,
        visibility: "shared_with_employee",
        kpi_goals: "Improve HR analytics reporting.",
        achievement: "Delivered monthly HR dashboard to managers.",
        feedback: "Nice dashboards; validate data quality more."
    },
    {
        period_key: "2026-Q1",
        employee_email: "hr3@company.com",
        reviewer_email: "tn1@company.com",
        review_date: "2026-03-16",
        rating: 3.7,
        visibility: "shared_with_employee",
        kpi_goals: "Run training sessions with higher engagement.",
        achievement: "Average training feedback improved by 0.4 points.",
        feedback: "Good progress; refine session materials."
    },
    {
        period_key: "2026-Q1",
        employee_email: "dev1@company.com",
        reviewer_email: "tn2@company.com",
        review_date: "2026-03-16",
        rating: 3.9,
        visibility: "shared_with_employee",
        kpi_goals: "Ship research automation improvements.",
        achievement: "Automated 3 pipelines and improved turnaround.",
        feedback: "Nice efficiency gains; share scripts widely."
    },
    {
        period_key: "2026-Q1",
        employee_email: "dev2@company.com",
        reviewer_email: "tn3@company.com",
        review_date: "2026-03-16",
        rating: 4.1,
        visibility: "shared_with_employee",
        kpi_goals: "Deliver feature modules with clean APIs.",
        achievement: "Delivered 2 modules and documented APIs.",
        feedback: "Keep pushing reusable patterns."
    },
    {
        period_key: "2026-Q1",
        employee_email: "dev3@company.com",
        reviewer_email: "tn3@company.com",
        review_date: "2026-03-16",
        rating: 4.0,
        visibility: "shared_with_employee",
        kpi_goals: "Improve backend observability.",
        achievement: "Added metrics and alerts for key services.",
        feedback: "Great visibility work; expand coverage."
    },
    {
        period_key: "2026-Q1",
        employee_email: "dev4@company.com",
        reviewer_email: "tp1@company.com",
        review_date: "2026-03-25",
        rating: 3.6,
        visibility: "shared_with_employee",
        kpi_goals: "Improve delivery reliability on dev tasks.",
        achievement: "Met 85% of sprint commitments.",
        feedback: "Keep improving estimation accuracy."
    },
    {
        period_key: "2026-Q1",
        employee_email: "dev5@company.com",
        reviewer_email: "tp1@company.com",
        review_date: "2026-03-26",
        rating: 3.5,
        visibility: "shared_with_employee",
        kpi_goals: "Support integration testing and bug fixes.",
        achievement: "Closed 18 bugs with strong collaboration.",
        feedback: "Good fixes; add more regression tests."
    },

    // ===== 2026-Q2 (IN PROGRESS) =====
    {
        period_key: "2026-Q2",
        employee_email: "tp1@company.com",
        reviewer_email: "mng1@company.com",
        review_date: "2026-05-05",
        rating: 4.1,
        visibility: "shared_with_employee",
        kpi_goals: "Scale HR hiring to meet Q2 demand.",
        achievement: "Pipeline growth in progress.",
        feedback: "Good start; focus on hard-to-fill roles."
    },
    {
        period_key: "2026-Q2",
        employee_email: "tp2@company.com",
        reviewer_email: "mng1@company.com",
        review_date: "2026-05-06",
        rating: 4.0,
        visibility: "shared_with_employee",
        kpi_goals: "Increase research throughput for Q2 roadmap.",
        achievement: "Two POCs delivered so far.",
        feedback: "Nice progress; keep cross-team syncs."
    },
    {
        period_key: "2026-Q2",
        employee_email: "tn1@company.com",
        reviewer_email: "tp1@company.com",
        review_date: "2026-05-10",
        rating: 3.9,
        visibility: "shared_with_employee",
        kpi_goals: "Improve HR response time and reporting.",
        achievement: "Weekly HR report launched.",
        feedback: "Good improvements; keep the momentum."
    },
    {
        period_key: "2026-Q2",
        employee_email: "hr1@company.com",
        reviewer_email: "tn1@company.com",
        review_date: "2026-05-12",
        rating: 3.8,
        visibility: "shared_with_employee",
        kpi_goals: "Maintain recruitment SLA and candidate experience.",
        achievement: "SLA met in April and May.",
        feedback: "Stable delivery; improve candidate surveys."
    },
    {
        period_key: "2026-Q2",
        employee_email: "dev2@company.com",
        reviewer_email: "tn3@company.com",
        review_date: "2026-05-14",
        rating: 4.0,
        visibility: "shared_with_employee",
        kpi_goals: "Deliver Q2 feature milestones.",
        achievement: "Completed milestone 1.",
        feedback: "Great output; keep quality high."
    },
    {
        period_key: "2026-Q2",
        employee_email: "dev4@company.com",
        reviewer_email: "tp1@company.com",
        review_date: "2026-05-18",
        rating: 3.6,
        visibility: "private",
        kpi_goals: "Support dev backlog cleanup.",
        achievement: "Closed 10 backlog items.",
        feedback: "Good progress; share blockers early."
    }
];

export default performanceSeeds;
