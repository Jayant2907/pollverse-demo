export class CreatePollDto {
    question: string;
    description?: string;
    category: string;
    pollType: string;
    options: any[]; // Flexible array
    tags?: string[];
    creatorId: number;
}
