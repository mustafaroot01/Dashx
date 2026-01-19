export interface ActivityLog {
    id: number;
    user_id: number;
    user?: {
        id: number;
        name: string;
        email: string;
    };
    subject_type: string;
    subject_id: number;
    action: string;
    description: string;
    properties: any;
    created_at: string;
    ip_address: string;
}

export interface ActivityLogResponse {
    data: ActivityLog[];
    currnet_page: number;
    last_page: number;
    total: number;
}
