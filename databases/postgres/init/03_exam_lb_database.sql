-- Create the exam loadbalancer database and user
CREATE USER exam_lb WITH PASSWORD 'exam_lb';
CREATE DATABASE exam_lb OWNER exam_lb;
GRANT ALL PRIVILEGES ON DATABASE exam_lb TO exam_lb;
