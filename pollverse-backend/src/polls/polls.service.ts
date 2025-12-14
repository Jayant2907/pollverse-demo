import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreatePollDto } from './dto/create-poll.dto';
import { UpdatePollDto } from './dto/update-poll.dto';
import { Poll } from './entities/poll.entity';

@Injectable()
export class PollsService {
  constructor(
    @InjectRepository(Poll)
    private pollsRepository: Repository<Poll>,
  ) { }

  async create(createPollDto: CreatePollDto) {
    const poll = this.pollsRepository.create({
      ...createPollDto,
      votes: {},
      createdAt: new Date(),
    });
    return this.pollsRepository.save(poll);
  }

  async seed(pollsData: CreatePollDto[]) {
    // Clear existing polls (optional, careful in prod)
    // await this.pollsRepository.clear(); 

    const polls = pollsData.map(dto => {
      const pollEntity = this.pollsRepository.create({
        ...dto,
        votes: dto['votes'] || {},
        createdAt: dto['timestamp'] || new Date(),
        likes: dto['likes'] || 0,
        dislikes: dto['dislikes'] || 0,
        // Map other complex JSON fields if they exist in DTO but not strictly typed
      });
      return pollEntity;
    });
    return this.pollsRepository.save(polls);
  }

  async findAll(query: { category?: string; search?: string; tag?: string }) {
    const qb = this.pollsRepository.createQueryBuilder('poll');

    if (query.category && query.category !== 'For You' && query.category !== 'Following' && query.category !== 'Trending') {
      qb.andWhere('poll.category = :category', { category: query.category });
    }

    if (query.search) {
      qb.andWhere('(LOWER(poll.question) LIKE LOWER(:search) OR LOWER(poll.description) LIKE LOWER(:search))', { search: `%${query.search}%` });
    }

    if (query.tag) {
      // Note: simple-array stores as "tag1,tag2". LIKE check might give false positives for substrings.
      // Ideally use Postgres array type, but keeping simple-array compatibility for now.
      qb.andWhere('poll.tags LIKE :tag', { tag: `%${query.tag}%` });
    }

    if (query.category === 'Trending') {
      // Simple trending sort by likes/votes size (if votes is json, hard to sort in SQL without jsonb features)
      // For now, sorting by likes as a proxy or simply by date
      qb.orderBy('poll.likes', 'DESC');
    } else {
      qb.orderBy('poll.createdAt', 'DESC');
    }

    return qb.getMany();
  }

  findOne(id: number) {
    return this.pollsRepository.findOneBy({ id });
  }

  update(id: number, updatePollDto: UpdatePollDto) {
    return this.pollsRepository.update(id, updatePollDto);
  }

  remove(id: number) {
    return this.pollsRepository.delete(id);
  }
}
