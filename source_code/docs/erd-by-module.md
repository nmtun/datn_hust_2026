# ERD theo module

Tai lieu nay ve cac model trong backend va chia ERD theo module de de doc va de dua vao bao cao.

## 1) Core he thong

Diagram nay gom cac bang nen tang duoc dung chung boi nhieu module: tenant, nguoi dung, phong ban, team, thong tin nhan vien, thong bao.

```mermaid
erDiagram
    TENANTS ||--o{ USERS : owns
    TENANTS ||--o{ DEPARTMENTS : owns
    TENANTS ||--o{ TEAMS : owns
    TENANTS ||--o{ EMPLOYEE_INFO : owns
    TENANTS ||--o{ NOTIFICATIONS : owns

    USERS ||--o{ DEPARTMENTS : manages
    USERS ||--o{ TEAMS : leads
    USERS ||--o{ EMPLOYEE_INFO : profile
    USERS ||--o{ NOTIFICATIONS : recipient
    USERS ||--o{ NOTIFICATIONS : actor

    DEPARTMENTS ||--o{ DEPARTMENTS : parent_of
    DEPARTMENTS ||--o{ TEAMS : contains
    DEPARTMENTS ||--o{ EMPLOYEE_INFO : contains

    TEAMS ||--o{ EMPLOYEE_INFO : contains

    TENANTS {
        int tenant_id PK
    }

    USERS {
        int user_id PK
        int tenant_id FK
        string role
        string status
    }

    DEPARTMENTS {
        int department_id PK
        int tenant_id FK
        int manager_id FK
        int parent_department_id FK
        boolean active
    }

    TEAMS {
        int team_id PK
        int tenant_id FK
        int department_id FK
        int leader_id FK
        boolean active
    }

    EMPLOYEE_INFO {
        int employee_info_id PK
        int tenant_id FK
        int user_id FK
        int department_id FK
        int team_id FK
        int manager_id FK
    }

    NOTIFICATIONS {
        int notification_id PK
        int tenant_id FK
        int user_id FK
        int actor_id FK
        string type
        boolean is_read
    }
```

## 2) Module tuyen dung

Module nay bao gom job description va candidate.

```mermaid
erDiagram
    TENANTS ||--o{ JOB_DESCRIPTIONS : owns
    TENANTS ||--o{ CANDIDATE_INFO : owns

    USERS ||--o{ JOB_DESCRIPTIONS : created_by
    USERS ||--o{ CANDIDATE_INFO : owns

    DEPARTMENTS ||--o{ JOB_DESCRIPTIONS : assigned_to
    JOB_DESCRIPTIONS ||--o{ CANDIDATE_INFO : receives_applications

    TENANTS {
        int tenant_id PK
    }

    USERS {
        int user_id PK
        int tenant_id FK
        string role
    }

    DEPARTMENTS {
        int department_id PK
        int tenant_id FK
    }

    JOB_DESCRIPTIONS {
        int job_id PK
        int tenant_id FK
        int created_by FK
        int department_id FK
        boolean is_deleted
        string status
    }

    CANDIDATE_INFO {
        int candidate_info_id PK
        int tenant_id FK
        int user_id FK
        int job_id FK
        string candidate_status
        string source
        date apply_date
    }
```

## 3) Module quan ly cong viec

Module nay gom project, task, comment va review.

```mermaid
erDiagram
    TENANTS ||--o{ PROJECTS : owns
    TENANTS ||--o{ TASKS : owns
    TENANTS ||--o{ TASK_COMMENTS : owns
    TENANTS ||--o{ TASK_REVIEWS : owns

    USERS ||--o{ PROJECTS : manages
    USERS ||--o{ TASKS : creates
    USERS ||--o{ TASKS : assigned_to
    USERS ||--o{ TASK_COMMENTS : authors
    USERS ||--o{ TASK_REVIEWS : reviewers
    USERS ||--o{ TASK_REVIEWS : reviewed_user

    DEPARTMENTS ||--o{ PROJECTS : belongs_to
    TEAMS ||--o{ TASKS : contains
    PROJECTS ||--o{ TASKS : contains
    TASKS ||--o{ TASKS : parent_of
    TASKS ||--o{ TASK_COMMENTS : has
    TASKS ||--o{ TASK_REVIEWS : has

    TENANTS {
        int tenant_id PK
    }

    USERS {
        int user_id PK
        int tenant_id FK
        string role
    }

    DEPARTMENTS {
        int department_id PK
        int tenant_id FK
    }

    TEAMS {
        int team_id PK
        int tenant_id FK
        int department_id FK
    }

    PROJECTS {
        int project_id PK
        int tenant_id FK
        int manager_id FK
        int department_id FK
        string status
        boolean active
    }

    TASKS {
        int task_id PK
        int tenant_id FK
        int project_id FK
        int parent_task_id FK
        int team_id FK
        int assigned_to FK
        int created_by FK
        string status
        string priority
        boolean active
    }

    TASK_COMMENTS {
        int comment_id PK
        int tenant_id FK
        int task_id FK
        int user_id FK
    }

    TASK_REVIEWS {
        int review_id PK
        int tenant_id FK
        int task_id FK
        int reviewer_id FK
        int reviewed_user_id FK
        string decision
    }
```

## 4) Module dao tao va quiz

Module nay gom tai lieu dao tao, tag, quiz, cau hoi, ket qua va bang lien ket.

```mermaid
erDiagram
    TENANTS ||--o{ TRAINING_MATERIALS : owns
    TENANTS ||--o{ TRAINING_RECORDS : owns
    TENANTS ||--o{ TAGS : owns
    TENANTS ||--o{ QUIZZES : owns
    TENANTS ||--o{ QUIZ_QUESTIONS : owns
    TENANTS ||--o{ QUIZ_RESULTS : owns
    TENANTS ||--o{ QUIZ_ANSWERS : owns
    TENANTS ||--o{ MATERIAL_QUIZZES : owns
    TENANTS ||--o{ MATERIAL_TAGS : owns
    TENANTS ||--o{ QUIZ_TAGS : owns
    TENANTS ||--o{ QUESTION_TAGS : owns
    TENANTS ||--o{ QUESTION_TO_QUIZ : owns

    USERS ||--o{ TRAINING_MATERIALS : creates
    USERS ||--o{ TRAINING_RECORDS : learns
    USERS ||--o{ QUIZZES : creates
    USERS ||--o{ QUIZ_QUESTIONS : creates
    USERS ||--o{ QUIZ_RESULTS : takes
    USERS ||--o{ QUIZ_ANSWERS : answers
    USERS ||--o{ QUESTION_TO_QUIZ : added_by

    TRAINING_MATERIALS ||--o{ TRAINING_RECORDS : tracked_by
    TRAINING_MATERIALS ||--o{ MATERIAL_QUIZZES : links
    TRAINING_MATERIALS ||--o{ MATERIAL_TAGS : tagged_by

    QUIZZES ||--o{ MATERIAL_QUIZZES : linked_from_material
    QUIZZES ||--o{ QUIZ_RESULTS : has
    QUIZZES ||--o{ QUIZ_TAGS : tagged_by
    QUIZZES ||--o{ QUESTION_TO_QUIZ : uses
    QUIZZES ||--o{ QUIZ_QUESTIONS : contains

    QUIZ_QUESTIONS ||--o{ QUIZ_ANSWERS : referenced_by
    QUIZ_QUESTIONS ||--o{ QUESTION_TAGS : tagged_by
    QUIZ_QUESTIONS ||--o{ QUESTION_TO_QUIZ : assigned_in

    TAGS ||--o{ MATERIAL_TAGS : used_in
    TAGS ||--o{ QUIZ_TAGS : used_in
    TAGS ||--o{ QUESTION_TAGS : used_in
    TAGS ||--o{ QUESTION_TO_QUIZ : constrains

    QUIZ_RESULTS ||--o{ QUIZ_ANSWERS : contains

    TENANTS {
        int tenant_id PK
    }

    USERS {
        int user_id PK
        int tenant_id FK
        string role
    }

    TRAINING_MATERIALS {
        int material_id PK
        int tenant_id FK
        int created_by FK
        string type
        string status
    }

    TRAINING_RECORDS {
        int record_id PK
        int tenant_id FK
        int user_id FK
        int material_id FK
        string status
        float progress
    }

    TAGS {
        int tag_id PK
        int tenant_id FK
        string name
    }

    QUIZZES {
        int quiz_id PK
        int tenant_id FK
        int created_by FK
        string status
    }

    QUIZ_QUESTIONS {
        int question_id PK
        int tenant_id FK
        int created_by FK
        string question_type
        boolean is_active
    }

    QUIZ_RESULTS {
        int result_id PK
        int tenant_id FK
        int user_id FK
        int quiz_id FK
        float score
        boolean pass_status
    }

    QUIZ_ANSWERS {
        int answer_id PK
        int tenant_id FK
        int result_id FK
        int question_id FK
        boolean correct
    }

    MATERIAL_QUIZZES {
        int material_quiz_id PK
        int tenant_id FK
        int material_id FK
        int quiz_id FK
        boolean is_required
        int sequence_order
    }

    MATERIAL_TAGS {
        int material_tag_id PK
        int tenant_id FK
        int material_id FK
        int tag_id FK
    }

    QUIZ_TAGS {
        int quiz_tag_id PK
        int tenant_id FK
        int quiz_id FK
        int tag_id FK
    }

    QUESTION_TAGS {
        int question_tag_id PK
        int tenant_id FK
        int question_id FK
        int tag_id FK
    }

    QUESTION_TO_QUIZ {
        int id PK
        int tenant_id FK
        int question_id FK
        int quiz_id FK
        int tag_id FK
        int added_by FK
        boolean is_active
        int question_order
    }
```

## 5) Module danh gia va luong thuong

Module nay gom ky danh gia hieu suat va dieu chinh luong thuong.

```mermaid
erDiagram
    TENANTS ||--o{ PERFORMANCE_PERIODS : owns
    TENANTS ||--o{ PERFORMANCE : owns
    TENANTS ||--o{ COMPENSATION : owns

    USERS ||--o{ PERFORMANCE : employee
    USERS ||--o{ PERFORMANCE : reviewer
    USERS ||--o{ COMPENSATION : employee
    USERS ||--o{ COMPENSATION : approver
    USERS ||--o{ COMPENSATION : evaluator

    PERFORMANCE_PERIODS ||--o{ PERFORMANCE : contains

    TENANTS {
        int tenant_id PK
    }

    USERS {
        int user_id PK
        int tenant_id FK
        string role
    }

    PERFORMANCE_PERIODS {
        int period_id PK
        int tenant_id FK
        string period_name
        date start_date
        date end_date
        string status
    }

    PERFORMANCE {
        int perf_id PK
        int tenant_id FK
        int user_id FK
        int period_id FK
        int reviewer_id FK
        float rating
        string visibility
    }

    COMPENSATION {
        int comp_id PK
        int tenant_id FK
        int user_id FK
        int evaluated_by FK
        int approved_by FK
        decimal salary
        decimal bonus
        date effective_date
    }
```

## Ghi chu

- Mot so bang trung gian nhu Material_Quizzes, Material_Tags, QuizTags, QuestionTags, Question_To_Quiz dung de the hien quan he many-to-many.
- Tenant_id xuat hien o gan nhu tat ca bang de dam bao pham vi du lieu theo tenant.
- Neu ban muon, toi co the tach moi module ra mot file rieng hoac chuyen tat ca sang ERD tong quan mot trang.