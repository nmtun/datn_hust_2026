-- ------------------ Module Người dùng & Phân quyền ------------------

CREATE TABLE Users (
  user_id INT AUTO_INCREMENT PRIMARY KEY,
  password VARCHAR(255),
  personal_email VARCHAR(255) NOT NULL,
  company_email VARCHAR(255),
  full_name VARCHAR(255) NOT NULL,
  phone_number VARCHAR(50),
  address TEXT,
  role ENUM('candidate', 'employee', 'hr', 'manager','admin') NOT NULL,
  status ENUM('active', 'on_leave', 'terminated') NOT NULL,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL
);

CREATE TABLE Candidate_Info (
  candidate_info_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  cv_file_path VARCHAR(255),
  candidate_status ENUM('new', 'screening', 'interview', 'offered', 'rejected', 'hired') NOT NULL,
  source VARCHAR(100),
  apply_date DATE NOT NULL,
  evaluation INT,
  job_id INT,
  notes TEXT,
  FOREIGN KEY (user_id) REFERENCES Users(user_id),
  FOREIGN KEY (job_id) REFERENCES Job_Descriptions(job_id)
);

CREATE TABLE Employee_Info (
  employee_info_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  hire_date DATE NOT NULL,
  position VARCHAR(100) NOT NULL,
  department_id INT,
  team_id INT,
  manager_id INT,
  termination_date DATE,
  employee_id_number VARCHAR(50),
  FOREIGN KEY (user_id) REFERENCES Users(user_id),
  FOREIGN KEY (department_id) REFERENCES Departments(department_id),
  FOREIGN KEY (team_id) REFERENCES Teams(team_id),
  FOREIGN KEY (manager_id) REFERENCES Users(user_id)
);

-- ------------------ Module Tuyển dụng ------------------

CREATE TABLE Job_Descriptions (
  job_id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  requirements TEXT NOT NULL,
  responsibilities TEXT,
  qualifications TEXT,
  experience_level ENUM('intern', 'fresher' ,'mid', 'senior', 'manager') NOT NULL,
  employment_type ENUM('full_time', 'part_time') NOT NULL,
  salary_range_min DECIMAL(18,2),
  salary_range_max DECIMAL(18,2),
  remote_option BOOLEAN NOT NULL DEFAULT FALSE,
  status ENUM('draft', 'review', 'active', 'paused', 'closed', 'filled') NOT NULL,
  posting_date DATE,
  closing_date DATE,
  department_id INT NOT NULL,
  positions_count INT NOT NULL DEFAULT 1,
  created_by INT NOT NULL,
  created_at DATETIME NOT NULL,
  updated_at DATETIME,
  FOREIGN KEY (department_id) REFERENCES Departments(department_id),
  FOREIGN KEY (created_by) REFERENCES Users(user_id)
);

CREATE TABLE Interviews (
  interview_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  job_id INT NOT NULL,
  schedule_time DATETIME NOT NULL,
  end_time DATETIME,
  interview_type ENUM('initial', 'technical', 'hr', 'final') NOT NULL,
  location VARCHAR(255),
  status ENUM('scheduled', 'completed', 'canceled', 'rescheduled', 'no_show') NOT NULL,
  feedback TEXT,
  score FLOAT,
  interviewer_id INT NOT NULL,
  created_at DATETIME NOT NULL,
  updated_at DATETIME,
  FOREIGN KEY (user_id) REFERENCES Users(user_id),
  FOREIGN KEY (job_id) REFERENCES Job_Descriptions(job_id),
  FOREIGN KEY (interviewer_id) REFERENCES Users(user_id)
);

CREATE TABLE Interview_Panels (
  panel_id INT AUTO_INCREMENT PRIMARY KEY,
  interview_id INT NOT NULL,
  interviewer_id INT NOT NULL,
  role ENUM('lead', 'technical', 'hr', 'observer') NOT NULL,
  feedback TEXT,
  individual_score FLOAT,
  created_at DATETIME NOT NULL,
  FOREIGN KEY (interview_id) REFERENCES Interviews(interview_id),
  FOREIGN KEY (interviewer_id) REFERENCES Users(user_id)
);

-- ------------------ Module Đào tạo ------------------

CREATE TABLE Training_Materials (
  material_id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255),
  type ENUM('video', 'document', 'presentation'),
  content_path VARCHAR(255),
  created_by INT,
  creation_date DATE,
  description TEXT,
  status ENUM('active', 'draft', 'archived'),
  category VARCHAR(100),
  FOREIGN KEY (created_by) REFERENCES Users(user_id)
);

CREATE TABLE Quizzes (
  quiz_id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255),
  description TEXT,
  duration INT,
  passing_score FLOAT,
  created_by INT,
  creation_date DATE,
  status ENUM('active', 'draft', 'archived'),
  FOREIGN KEY (created_by) REFERENCES Users(user_id)
);

CREATE TABLE Material_Quizzes (
  material_quiz_id INT AUTO_INCREMENT PRIMARY KEY,
  material_id INT NOT NULL,
  quiz_id INT NOT NULL,
  is_required BOOLEAN NOT NULL DEFAULT TRUE,
  sequence_order INT NOT NULL DEFAULT 1,
  UNIQUE (material_id, quiz_id),
  FOREIGN KEY (material_id) REFERENCES Training_Materials(material_id),
  FOREIGN KEY (quiz_id) REFERENCES Quizzes(quiz_id)
);

CREATE TABLE Quiz_Questions (
  question_id INT AUTO_INCREMENT PRIMARY KEY,
  quiz_id INT,
  question_text TEXT,
  question_type ENUM('multiple_choice', 'true_false', 'essay'),
  options TEXT,
  correct_answer TEXT,
  points FLOAT,
  FOREIGN KEY (quiz_id) REFERENCES Quizzes(quiz_id)
);

CREATE TABLE Training_Records (
  record_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  material_id INT NOT NULL,
  start_date DATE NOT NULL,
  completion_date DATE,
  status ENUM('not_started', 'in_progress', 'completed') NOT NULL,
  progress FLOAT DEFAULT 0,
  created_at DATETIME NOT NULL,
  updated_at DATETIME,
  FOREIGN KEY (user_id) REFERENCES Users(user_id),
  FOREIGN KEY (material_id) REFERENCES Training_Materials(material_id)
);

CREATE TABLE Quiz_Results (
  result_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  quiz_id INT NOT NULL,
  score FLOAT,
  pass_status BOOLEAN,
  completion_time INT,
  attempt_number INT NOT NULL,
  completion_date DATE NOT NULL,
  created_at DATETIME NOT NULL,
  FOREIGN KEY (user_id) REFERENCES Users(user_id),
  FOREIGN KEY (quiz_id) REFERENCES Quizzes(quiz_id)
);

CREATE TABLE Quiz_Answers (
  answer_id INT AUTO_INCREMENT PRIMARY KEY,
  result_id INT,
  question_id INT,
  answer TEXT,
  correct BOOLEAN,
  score FLOAT,
  FOREIGN KEY (result_id) REFERENCES Quiz_Results(result_id),
  FOREIGN KEY (question_id) REFERENCES Quiz_Questions(question_id)
);

-- ------------------ Module Nhân sự ------------------

CREATE TABLE Departments (
  department_id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  code VARCHAR(50) NOT NULL,
  description TEXT,
  manager_id INT,
  parent_department_id INT,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at DATETIME NOT NULL,
  updated_at DATETIME,
  FOREIGN KEY (manager_id) REFERENCES Users(user_id),
  FOREIGN KEY (parent_department_id) REFERENCES Departments(department_id)
);

CREATE TABLE Teams (
  team_id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  code VARCHAR(50) NOT NULL,
  department_id INT NOT NULL,
  leader_id INT,
  description TEXT,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at DATETIME NOT NULL,
  updated_at DATETIME,
  FOREIGN KEY (department_id) REFERENCES Departments(department_id),
  FOREIGN KEY (leader_id) REFERENCES Users(user_id)
);

CREATE TABLE Performance_Periods (
  period_id INT AUTO_INCREMENT PRIMARY KEY,
  period_name VARCHAR(100) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status ENUM('planned', 'in_progress', 'completed') NOT NULL,
  description TEXT
);

CREATE TABLE Performance (
  perf_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  period_id INT NOT NULL,
  kpi_goals TEXT,
  achievement TEXT,
  rating FLOAT DEFAULT 0,
  feedback TEXT,
  review_date DATE NOT NULL,
  reviewer_id INT NOT NULL,
  created_at DATETIME NOT NULL,
  updated_at DATETIME,
  FOREIGN KEY (user_id) REFERENCES Users(user_id),
  FOREIGN KEY (period_id) REFERENCES Performance_Periods(period_id),
  FOREIGN KEY (reviewer_id) REFERENCES Users(user_id)
);

CREATE TABLE Compensation (
  comp_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  salary DECIMAL(18,2) NOT NULL,
  bonus DECIMAL(18,2) DEFAULT 0,
  effective_date DATE NOT NULL,
  reason TEXT,
  approved_by INT NOT NULL,
  approved_at DATETIME NOT NULL,
  created_at DATETIME NOT NULL,
  updated_at DATETIME,
  FOREIGN KEY (user_id) REFERENCES Users(user_id),
  FOREIGN KEY (approved_by) REFERENCES Users(user_id)
);

CREATE TABLE HR_Forecasts (
  forecast_id INT AUTO_INCREMENT PRIMARY KEY,
  period VARCHAR(100),
  department_id INT,
  current_headcount INT,
  predicted_needs INT,
  creation_date DATE,
  notes TEXT,
  FOREIGN KEY (department_id) REFERENCES Departments(department_id)
);

-- ------------------ Module Dự án & Quản lý công việc ------------------

CREATE TABLE Projects (
  project_id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  start_date DATE NOT NULL,
  end_date DATE,
  status ENUM('planning', 'active', 'on_hold', 'completed', 'cancelled') NOT NULL,
  manager_id INT,
  department_id INT,
  budget DECIMAL(18,2),
  created_at DATETIME NOT NULL,
  updated_at DATETIME,
  FOREIGN KEY (manager_id) REFERENCES Users(user_id),
  FOREIGN KEY (department_id) REFERENCES Departments(department_id)
);

CREATE TABLE Project_Assignments (
  assignment_id INT AUTO_INCREMENT PRIMARY KEY,
  project_id INT NOT NULL,
  user_id INT NOT NULL,
  role_in_project VARCHAR(100) NOT NULL,
  assigned_date DATE NOT NULL,
  end_date DATE,
  allocation_percentage INT DEFAULT 100,
  created_at DATETIME NOT NULL,
  updated_at DATETIME,
  FOREIGN KEY (project_id) REFERENCES Projects(project_id),
  FOREIGN KEY (user_id) REFERENCES Users(user_id)
);

CREATE TABLE Tasks (
  task_id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  assigned_to INT,
  created_by INT NOT NULL,
  start_date DATE NOT NULL,
  due_date DATE,
  completed_date DATE,
  estimated_hours FLOAT,
  actual_hours FLOAT,
  status ENUM('pending', 'in_progress', 'review', 'completed', 'cancelled') NOT NULL,
  priority ENUM('low', 'medium', 'high', 'urgent') NOT NULL,
  project_id INT,
  parent_task_id INT,
  created_at DATETIME NOT NULL,
  updated_at DATETIME,
  FOREIGN KEY (assigned_to) REFERENCES Users(user_id),
  FOREIGN KEY (created_by) REFERENCES Users(user_id),
  FOREIGN KEY (project_id) REFERENCES Projects(project_id),
  FOREIGN KEY (parent_task_id) REFERENCES Tasks(task_id)
);

CREATE TABLE Task_Comments (
  comment_id INT AUTO_INCREMENT PRIMARY KEY,
  task_id INT NOT NULL,
  user_id INT NOT NULL,
  comment TEXT NOT NULL,
  created_at DATETIME NOT NULL,
  updated_at DATETIME,
  FOREIGN KEY (task_id) REFERENCES Tasks(task_id),
  FOREIGN KEY (user_id) REFERENCES Users(user_id)
);

