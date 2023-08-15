import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { QuestionService } from './question.service';
import { QuestionsResponse, QuestionDto, QuestionInCreate } from './question.dto';
import { AuthGuard } from '@nestjs/passport';
import { CurrentUser } from 'src/account/get-user.decorator';
import { Account } from 'src/account/account.entity';

@Controller('questions')
@ApiTags('Question')
export class QuestionController {
    
    constructor(private readonly questionService: QuestionService) {}

    @ApiOperation({ summary: 'create question' })
    @ApiResponse({ status: 201,  type: QuestionDto })
    @ApiBearerAuth('JWT')
    @UseGuards(AuthGuard('jwt'))
    @Post('/')
    async createQuestion(
        @CurrentUser() account: Account,
        @Body() QuestionInCreate: QuestionInCreate,
    ) {
        const question = await this.questionService.create(account, QuestionInCreate);
        return new QuestionDto(question);
    }


    @ApiOperation({ summary: 'fetch questions' })
    @ApiResponse({ status: 200,  type: QuestionsResponse })
    @ApiQuery({ name: 'limit', required: false, type: Number })
    @ApiQuery({ name: 'offset', required: false, type: Number })
    @Get('/')
    async fetchQuestions(
        @Query('offset') offset: number = 0,
        @Query('limit') limit: number = 20,
    ) {
        return await this.questionService.fetch(offset, limit);
    }
    
    @ApiOperation({ summary: 'get question by id' })
    @ApiResponse({ status: 200,  type: QuestionDto })
    @Get('/:id')
    async getQuestionById(
        @Query('id') id: number,
    ) {
        const question = await this.questionService.getQuestionById(id);
        console.log(question)
        return new QuestionDto(question);
    }

}
