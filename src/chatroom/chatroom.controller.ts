import { Controller, Query, ParseIntPipe, Param } from '@nestjs/common';
import { ChatroomService } from './chatroom.service';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { CurrentUser } from 'src/account/get-user.decorator';
import { Body, Get, Post, UseGuards } from '@nestjs/common';
import { Account } from 'src/account/account.entity';
import { ChatDto, ChatInCreate, ChatResponse, ChatroomDto, ChatroomInCreate, ChatroomsResponse } from './chatroom.dto';


@Controller('chatrooms')
@ApiTags('chatroom')
export class ChatroomController {
        
    constructor(private readonly chatroomService: ChatroomService) {}

    @ApiOperation({ summary: 'get or create chatroom' })
    @ApiResponse({ status: 201,  type: ChatroomDto })
    @ApiBearerAuth('JWT')
    @UseGuards(AuthGuard('jwt'))
    @Post('/')
    async getOrCreateChatroom(
        @CurrentUser() user: Account,
        @Body() chatroomInCreate: ChatroomInCreate,
    ): Promise<ChatroomDto> {
        const chatroom = await this.chatroomService.getOrCreateChatroom(user.id, chatroomInCreate.targetUserId, chatroomInCreate.title);
        return new ChatroomDto(chatroom);
    }

    @ApiOperation({ summary: 'fetch chatrooms' })
    @ApiResponse({ status: 200,  type: ChatroomsResponse })
    @ApiQuery({ name: 'limit', required: false, type: Number })
    @ApiQuery({ name: 'offset', required: false, type: Number })
    @ApiBearerAuth('JWT')
    @UseGuards(AuthGuard('jwt'))
    @Get('/')
    async fetchChatrooms(
        @CurrentUser() user: Account,
        @Query('offset') offset: number = 0,
        @Query('limit') limit: number = 20,
    ): Promise<ChatroomsResponse> {
        return await this.chatroomService.fetchChatrooms(user.id, offset, limit);
    }

    @ApiOperation({ summary: 'create chat' })
    @ApiResponse({ status: 201,  type: ChatDto })
    @ApiBearerAuth('JWT')
    @UseGuards(AuthGuard('jwt'))
    @Post('/:chatroomId/chats')
    async createChat(
        @CurrentUser() user: Account,
        @Param('chatroomId', ParseIntPipe) chatroomId: number,
        @Body() chatInCreate: ChatInCreate,
    ): Promise<ChatDto> {
        const chat = await this.chatroomService.createChat(user, chatroomId, chatInCreate.message);
        return new ChatDto(chat);
    }

    @ApiOperation({ summary: 'fetch chats' })
    @ApiResponse({ status: 200,  type: ChatDto })
    @ApiQuery({ name: 'limit', required: false, type: Number })
    @ApiQuery({ name: 'offset', required: false, type: Number })
    @ApiBearerAuth('JWT')
    @UseGuards(AuthGuard('jwt'))
    @Get('/:chatroomId/chats')
    async fetchChats(
        @CurrentUser() user: Account,
        @Param('chatroomId', ParseIntPipe) chatroomId: number,
        @Query('offset') offset: number = 0,
        @Query('limit') limit: number = 20,
    ): Promise<ChatResponse> {
        const chats = await this.chatroomService.fetchChats(user.id, chatroomId, offset, limit);
        return chats;
    }

}
