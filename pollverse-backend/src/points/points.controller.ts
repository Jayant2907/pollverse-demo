import { Controller, Get, Param, Query } from '@nestjs/common';
import { PointsService } from './points.service';

@Controller('points')
export class PointsController {
    constructor(private readonly pointsService: PointsService) { }

    @Get('leaderboard')
    getLeaderboard() {
        return this.pointsService.getLeaderboard();
    }

    @Get('rank/:id')
    getRank(@Param('id') id: string) {
        return this.pointsService.getUserRank(+id);
    }
}
