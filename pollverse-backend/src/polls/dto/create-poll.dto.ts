export class CreatePollDto {
    question: string;
    description?: string;
    category: string;
    pollType: string;
    options: any[]; // Flexible array
    tags?: string[];
    creatorId: number;
    goal_threshold?: number;
    swipeResults?: any;
    expiresAt?: Date;
    maxVotes?: number;
}
