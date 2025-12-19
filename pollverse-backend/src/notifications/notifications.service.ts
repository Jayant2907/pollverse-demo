import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from './entities/notification.entity';

@Injectable()
export class NotificationsService {
    constructor(
        @InjectRepository(Notification)
        private notificationsRepository: Repository<Notification>,
    ) { }

    async create(data: Partial<Notification>) {
        const notification = this.notificationsRepository.create(data);
        return this.notificationsRepository.save(notification);
    }

    async findAll(userId: number) {
        return this.notificationsRepository.find({
            where: { recipientId: userId },
            order: { createdAt: 'DESC' },
            relations: ['actor'],
        });
    }

    async markAsRead(id: number) {
        await this.notificationsRepository.update(id, { isRead: true });
        return { success: true };
    }
}
