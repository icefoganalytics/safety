export interface HazardType {
    id: number;
    name: string;
    description: string | null;
    searchable: boolean;
    added_by: Date;
    made_searchable_by: number | null;
    created_at: Date | null;
    searchable_on: Date | null;
}
