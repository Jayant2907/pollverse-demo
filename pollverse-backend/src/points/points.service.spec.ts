import { Test, TestingModule } from '@nestjs/testing';
import { PointsService } from './points.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { PointTransaction } from './entities/point-transaction.entity';
import { User } from '../users/entities/user.entity';

const mockPointTransactionRepository = {
    create: jest.fn().mockImplementation((dto) => dto),
    save: jest.fn().mockImplementation((transaction) => Promise.resolve({ id: 1, ...transaction })),
    count: jest.fn().mockResolvedValue(0), // Default to 0 for daily limit check
    createQueryBuilder: jest.fn(() => ({
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(0),
    })),
};

const mockUserRepository = {
    findOneBy: jest.fn().mockResolvedValue({ id: 1, points: 0 }),
    save: jest.fn().mockResolvedValue(true),
};

describe('PointsService', () => {
    let service: PointsService;
    let ptRepo: any;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                PointsService,
                {
                    provide: getRepositoryToken(PointTransaction),
                    useValue: mockPointTransactionRepository,
                },
                {
                    provide: getRepositoryToken(User),
                    useValue: mockUserRepository,
                },
            ],
        }).compile();

        service = module.get<PointsService>(PointsService);
        ptRepo = module.get(getRepositoryToken(PointTransaction));
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    it('should award points correctly', async () => {
        const result = await service.awardPoints(1, 10, 'vote');
        expect(result.success).toBe(true);
        expect(mockUserRepository.save).toHaveBeenCalled();
        expect(result.message).toContain('+10 Points');
    });

    it('should enforce daily limit for poll creation', async () => {
        // Mock count to return 3
        ptRepo.count.mockResolvedValueOnce(3);
        const result = await service.awardPoints(1, 50, 'create_poll');
        expect(result.success).toBe(false);
        expect(result.message).toContain('Daily limit reached');
    });

    it('should calculate levels correctly', () => {
        // Private method, but we can check via user rank logic if exposed, or just allow testing private if needed.
        // Actually getLevel is private or not? It's not exported.
        // But we can test getUserRank logic if we mock repository to return points.
        // Or we can just trust the logic we wrote.
        // Let's test getUserRank
        const level = service['getLevel'](500); // 1 + 500/111 = 1 + 4 = 5
        expect(level).toBe(5);

        const levelHigh = service['getLevel'](1500); // 10 + 500/225 = 10 + 2 = 12
        expect(levelHigh).toBe(12);
    });
});
