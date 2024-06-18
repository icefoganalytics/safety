export interface Action {
    id: number;
    hazard_id: number;
    creator_employee_id: number | null;
    creator_role_id: number | null;
    actor_employee_id: number | null;
    actor_role_id: number | null;
    created_at: Date;
    modified_at: Date | null;
    due_date: Date | null;
    description: string;
    action_type_code: string;
    sensitivity_code: string | null;
    status_code: string | null;
}
