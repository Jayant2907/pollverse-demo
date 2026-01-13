import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { User } from './entities/user.entity';
import { Interaction } from './entities/interaction.entity';
import { PointsModule } from '../points/points.module';

@Module({
  imports: [TypeOrmModule.forFeature([User, Interaction]), PointsModule],
  controllers: [UsersController],
  providers: [UsersService],
})
export class UsersModule {}
