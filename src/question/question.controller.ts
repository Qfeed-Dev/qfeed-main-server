import { Body, Controller, Get, Post, Patch, Query, UseGuards, Param, ParseIntPipe } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { QuestionService } from './question.service';
import { QuestionsResponse, QuestionDto, QuestionInCreate, ChoiceInCreate, ChoiceDto, UserQsetDto, ChoiceInUserQ, ChoiceCountResponse } from './question.dto';
import { AuthGuard } from '@nestjs/passport';
import { CurrentUser } from 'src/account/get-user.decorator';
import { Account } from 'src/account/account.entity';
import { Qtype } from './question.enum';

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
    @ApiResponse({ status: 200,  type: QuestionsResponse })
    @ApiQuery({ name: 'Qtype', required: false, type: String })
    @ApiQuery({ name: 'limit', required: false, type: Number })
    @ApiQuery({ name: 'offset', required: false, type: Number })
    @ApiBearerAuth('JWT')
    @UseGuards(AuthGuard('jwt'))
    @Get('/')
    async fetchQuestions(
        @CurrentUser() user: Account,
        @Query('Qtype') qtype: Qtype = Qtype.Personal,
        @Query('offset') offset: number = 0,
        @Query('limit') limit: number = 20,
    ): Promise<QuestionsResponse> {
        return await this.questionService.fetchFollowingQuestions(user, qtype, offset, limit);
    }


    @ApiOperation({ summary: 'create UserQset' })
    @ApiResponse({ status: 201, type: UserQsetDto })
    @ApiBearerAuth('JWT')
    @UseGuards(AuthGuard('jwt'))
    @Post('/q-set')
    async createUserQset(
        @CurrentUser() user: Account,
    ) {
        const userQset = await this.questionService.createUserQset(user);
        return new UserQsetDto(userQset);
    }

    @ApiOperation({ summary: 'get user choice count' })
    @ApiResponse({ status: 200, type: ChoiceCountResponse })
    @ApiQuery({ name: 'Qtype', required: true, enum: Qtype })
    @ApiBearerAuth('JWT')
    @UseGuards(AuthGuard('jwt'))
    @Get('/q-set/choice-count')
    async getUserChoiceCount(
        @CurrentUser() user: Account,
        @Query('Qtype') qtype: Qtype = Qtype.Official,
    ) {
        const count = await this.questionService.getUserChoiceCount(user, qtype);
        return new ChoiceCountResponse(qtype, count);
    }




    @ApiOperation({ summary: 'get UserQset' })
    @ApiResponse({ status: 200, type: [UserQsetDto] })
    @ApiBearerAuth('JWT')
    @UseGuards(AuthGuard('jwt'))
    @Get('/q-set/today')
    async getUserQset(
        @CurrentUser() user: Account,
    ) {
        const todayUserQsets = await this.questionService.getTodayUserQset(user);
        return todayUserQsets.map((userQset) => new UserQsetDto(userQset));
    }

    @ApiOperation({ summary: 'Pass UserQ' })
    @ApiResponse({ status: 200, type: UserQsetDto })
    @ApiBearerAuth('JWT')
    @UseGuards(AuthGuard('jwt'))
    @Patch('/q-set/:userQsetId/pass')
    async passUserQ(
        @CurrentUser() user: Account,
        @Param('userQsetId', ParseIntPipe) userQsetId: number,
    ) {
        const userQset = await this.questionService.passUserQ(user, userQsetId);
        return new UserQsetDto(userQset);
    }

    @ApiOperation({ summary: 'choice in Qset' })
    @ApiResponse({ status: 201, type: UserQsetDto })
    @ApiBearerAuth('JWT')
    @UseGuards(AuthGuard('jwt'))
    @Post('/q-set/:userQsetId/choice')
    async choiceUserQ(
        @CurrentUser() user: Account,
        @Param('userQsetId', ParseIntPipe) userQsetId: number,
        @Body() choiceInUserQ: ChoiceInUserQ
    ) {
        const userQset = await this.questionService.choiceUserQ(user, userQsetId, choiceInUserQ);
        return new UserQsetDto(userQset);
    }


    @ApiOperation({ summary: 'fetch user questions' })
    @ApiResponse({ status: 200,  type: QuestionsResponse })
    @ApiQuery({ name: 'Qtype', required: true, enum: Qtype })
    @ApiQuery({ name: 'limit', required: false, type: Number })
    @ApiQuery({ name: 'offset', required: false, type: Number })
    @ApiBearerAuth('JWT')
    @UseGuards(AuthGuard('jwt'))
    @Get('/user/:userId')
    async fetchUserQuestions(
        @CurrentUser() currentUser: Account,
        @Param('userId', ParseIntPipe) userId: number,
        @Query('Qtype') Qtype: Qtype,
        @Query('offset') offset: number = 0,
        @Query('limit') limit: number = 20,
    ): Promise<QuestionsResponse> {
        return await this.questionService.fetchUserQuestions(currentUser.id, userId, Qtype,  offset, limit);
    }

    
    @ApiOperation({ summary: 'get question by id' })
    @ApiResponse({ status: 200,  type: QuestionDto })
    @ApiBearerAuth('JWT')
    @UseGuards(AuthGuard('jwt'))
    @Get('/:questionId')
    async getQuestionById(
        @CurrentUser() user: Account,
        @Param('questionId', ParseIntPipe) questionId: number,
    ): Promise<QuestionDto> {
        const question = await this.questionService.getQuestionById(questionId);
        await this.questionService.getOrCreateViewHistory(user, question);
        return new QuestionDto(question);
    }

    @ApiOperation({ summary: 'create choice' })
    @ApiResponse({ status: 201, type: ChoiceDto })
    @ApiBearerAuth('JWT')
    @UseGuards(AuthGuard('jwt'))
    @Post('/:questionId/choices')
    async createChoice(
        @CurrentUser() user: Account,
        @Param('questionId', ParseIntPipe) questionId: number,
        @Body() choiceInCreate: ChoiceInCreate,
    ) {
        const choice = await this.questionService.createChoice(user, questionId, choiceInCreate.value);
        return new ChoiceDto(choice);
    }




}
