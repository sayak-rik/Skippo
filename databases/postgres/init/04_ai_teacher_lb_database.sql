-- Create the AI teacher loadbalancer database and user
CREATE USER ai_teacher_lb WITH PASSWORD 'ai_teacher_lb';
CREATE DATABASE ai_teacher_lb OWNER ai_teacher_lb;
GRANT ALL PRIVILEGES ON DATABASE ai_teacher_lb TO ai_teacher_lb;
