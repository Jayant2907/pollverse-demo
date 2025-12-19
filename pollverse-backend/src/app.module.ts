import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PollsModule } from './polls/polls.module';
import { UsersModule } from './users/users.module';
import { NotificationsModule } from './notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'postgres',
      password: 'Jayant@123', // Default local password, user should change if needed
      database: 'pollverse',
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      synchronize: true, // Auto-create tables
    }),
    PollsModule,
    UsersModule,
    NotificationsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
