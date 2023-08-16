import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { QuestionService } from './question.service';
import { QuestionsResponse, QuestionDto, QuestionInCreate, ChoiceInCreate, ChoiceDto, ChoiceResponse } from './question.dto';
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
        const question = await this.questionService.createQuestion(account, QuestionInCreate);
        return new QuestionDto(question);
    }


    @ApiOperation({ summary: 'fetch questions' })
    @ApiResponse({ status: 200,  type: QuestionsResponse, isArray: true })
    @ApiQuery({ name: 'limit', required: false, type: Number })
    @ApiQuery({ name: 'offset', required: false, type: Number })
    @Get('/')
    async fetchQuestions(
        @Query('offset') offset: number = 0,
        @Query('limit') limit: number = 20,
    ) {
        return await this.questionService.fetchQuestions(offset, limit);
    }
    
    @ApiOperation({ summary: 'get question by id' })
    @ApiResponse({ status: 200,  type: QuestionDto })
    @Get('/:id')
    async getQuestionById(
        @Query('id') id: number,
    ) {
        const question = await this.questionService.getQuestionById(id);
        return new QuestionDto(question);
    }


    @ApiOperation({ summary: 'fetch choice' })
    @ApiResponse({ status: 200, type: [ChoiceResponse] })
    @ApiQuery({ name: 'questionId', required: true, type: Number })
    @ApiBearerAuth('JWT')
    @UseGuards(AuthGuard('jwt'))
    @Get('/:questionId/choices')
    async fetchChoices(@CurrentUser() user: Account, @Query('questionId') questionId: number): Promise<ChoiceResponse[]> {
        return await this.questionService.fetchChoices(user.id, questionId);
    }

    @ApiOperation({ summary: 'create choice' })
    @ApiResponse({ status: 201 })
    @ApiBearerAuth('JWT')
    @UseGuards(AuthGuard('jwt'))
    @Post('/:questionId/choices')
    async createChoice(
        @CurrentUser() user: Account,
        @Query('questionId') questionId: number,
        @Body() choiceInCreate: ChoiceInCreate,
    ) {
        const choice = await this.questionService.createChoice(user, questionId, choiceInCreate.value);
        return new ChoiceDto(choice);
    }

    @ApiOperation({ summary: 'get choice by id' })
    @ApiResponse({ status: 200, type: ChoiceDto })
    @Get('/:questionId/choices/:choiceId')
    async getChoiceById(
        @Query('questionId') questionId: number,
        @Query('choiceId') choiceId: number,
    ) {
        const choice = await this.questionService.getChoiceById(questionId, choiceId);
        return new ChoiceDto(choice);
    }


}
