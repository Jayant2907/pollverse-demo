import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PointsService } from './points.service';
import { PointTransaction } from './entities/point-transaction.entity';
import { User } from '../users/entities/user.entity';
import { PointsController } from './points.controller';

@Module({
    imports: [TypeOrmModule.forFeature([PointTransaction, User])],
    controllers: [PointsController],
    providers: [PointsService],
    exports: [PointsService],
})
export class PointsModule { }
