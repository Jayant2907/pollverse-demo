import { Controller, Get, Param, Patch } from '@nestjs/common';
import { NotificationsService } from './notifications.service';

@Controller('notifications')
export class NotificationsController {
    constructor(private readonly notificationsService: NotificationsService) { }

    @Get(':userId')
    findAll(@Param('userId') userId: string) {
        return this.notificationsService.findAll(+userId);
    }

    @Patch(':id/read')
    markAsRead(@Param('id') id: string) {
        return this.notificationsService.markAsRead(+id);
    }
}
