/**
 * DaneshMate API Client
 * Connects React Native (Expo) frontend to the Rust Axum backend.
 */

// Replace with your local machine's IP address when running on a physical phone via Expo Go
// (e.g., http://192.168.1.100:8080)
export const API_BASE_URL = 'http://localhost:8080';

export interface StatusResponse {
  status: string;
  service: string;
  version: string;
  timestamp: string;
  memory_safe: boolean;
  engine: string;
}

export interface StudentProfile {
  id: string;
  full_name: string;
  student_id: string;
  major: string;
  semester: number;
  gpa: number;
  total_credits: number;
  enrolled_credits: number;
}

export interface Course {
  id: string;
  code: string;
  title: string;
  instructor: string;
  credits: number;
  schedule: string;
  room: string;
}

export const fetchApiStatus = async (): Promise<StatusResponse> => {
  const response = await fetch(`${API_BASE_URL}/api/status`, {
    headers: {
      Accept: 'application/json',
    },
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch backend status: ${response.statusText}`);
  }
  return response.json();
};

export const fetchStudentProfile = async (): Promise<StudentProfile> => {
  const response = await fetch(`${API_BASE_URL}/api/student/me`);
  if (!response.ok) {
    throw new Error('Failed to fetch student profile');
  }
  return response.json();
};

export const fetchCourses = async (): Promise<Course[]> => {
  const response = await fetch(`${API_BASE_URL}/api/courses`);
  if (!response.ok) {
    throw new Error('Failed to fetch courses');
  }
  return response.json();
};
