export interface Stage {
    id: number;
    name: string;
    configurations?: {
        study_type: StudyType;
        group: Group;
    }[];
}

export interface StudyType {
    id: number;
    name: string;
}

export interface Group {
    id: number;
    symbol: string;
}

export interface Course {
    id: number;
    name: string;
    code: string;
    stage_id: number;
    type: 'theory' | 'practical' | 'both';
    semester: number | null;
    stage?: Stage;
}

export interface Student {
    id: number;
    code: string;
    full_name: string;
    gender: 'male' | 'female';
    phone_number: string | null;
    address: string | null;
    image_path: string | null;
    stage_id: number;
    study_type_id: number;
    group_id: number;
    stage?: Stage;
    study_type?: StudyType;
    group?: Group;
    created_at?: string;
}

export interface Lecturer {
    id: number;
    full_name: string;
    username: string;
    code: string;
    certificate?: string;
    academic_title?: string;
    image_path: string | null;
    stages: Stage[];
    courses: Course[];
    groups: Group[];
    study_types: StudyType[];
}

export interface Grade {
    student_id: number;
    course_id?: number;
    quizzes: number | null;
    projects: number | null;
    online_assignments: number | null;
    onsite_assignments: number | null;
    midterm_practical: number | null;
    final_exam: number | null;
}

export interface StudentWithGrades {
    student_id: number;
    student_name: string;
    student_code: string;
    grades: Grade | null;
    // Local state for UI
    isDirty?: boolean;
}
