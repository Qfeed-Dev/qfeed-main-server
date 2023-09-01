import { ApiProperty } from '@nestjs/swagger';
import { UserDto } from 'src/account/account.dto';
import { Chat, Chatroom } from './chatroom.entity';
import { IsNotEmpty } from 'class-validator';



export class ChatroomDto {
    constructor(chatroom: Chatroom) {
        this.id = chatroom.id;
        this.owner = new UserDto(chatroom.owner);
        this.targetUser = new UserDto(chatroom.targetUser);
        this.title = chatroom.title;
        this.lastMessage = chatroom.lastMessage;
        this.ownerUnreadCount = chatroom.ownerUnreadCount;
        this.targetUserUnreadCount = chatroom.targetUserUnreadCount;
        this.createdAt = chatroom.createdAt;
    }

    @ApiProperty({ type: Number })
    id: number;

    @ApiProperty({ type: UserDto })
    owner: UserDto;

    @ApiProperty({ type: UserDto })
    targetUser: UserDto;

    @ApiProperty({ type: String })
    title: string;

    @ApiProperty({ type: String })
    lastMessage: string;

    @ApiProperty({ type: Number })
    ownerUnreadCount: number;

    @ApiProperty({ type: Number })
    targetUserUnreadCount: number;

    @ApiProperty({ type: Date })
    createdAt: Date;

}


export class ChatDto {
    constructor(chat: Chat) {
        this.id = chat.id;
        this.message = chat.message;
        this.createdAt = chat.createdAt;
        this.owner = new UserDto(chat.owner);
    }

    @ApiProperty({ type: Number })
    id: number;

    @ApiProperty({ type: UserDto })
    owner: UserDto;

    @ApiProperty({ type: String })
    message: string;

    @ApiProperty({ type: Date })
    createdAt: Date;

}

export class ChatroomInCreate {

    @ApiProperty({ type: Number })
    @IsNotEmpty()
    targetUserId: number;

    @ApiProperty({ type: String, example: 'question 제목이 들어갑니다.' })
    title: string;

}

export class ChatroomsResponse {

    constructor( count: number, data: Chatroom[] ) {
        this.count = count;
        this.data = data.map((chatroom: Chatroom) => new ChatroomDto(chatroom));
    }

    @ApiProperty({ type: Number })
    count: number;
    
    @ApiProperty({ type: [ChatroomDto] })
    data: ChatroomDto[];

}

export class ChatInCreate {
    
    @ApiProperty({ type: String, example: '채팅 메세지' })
    @IsNotEmpty()
    message: string;
    
}

export class ChatResponse {

    constructor( count: number, data: Chat[] ) {
        this.count = count;
        this.data = data.map((chat: Chat) => new ChatDto(chat));
    }

    @ApiProperty({ type: Number })
    count: number;
    
    @ApiProperty({ type: [ChatDto] })
    data: ChatDto[];

}