import { ForbiddenException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ChatRepository, ChatroomRepository } from './chatroom.repository';
import { ChatResponse, ChatroomsResponse } from './chatroom.dto';
import { Chat, Chatroom } from './chatroom.entity';
import { Account } from 'src/account/account.entity';

@Injectable()
export class ChatroomService {
    constructor(
        
        @InjectRepository(ChatroomRepository)
        private chatroomRepository: ChatroomRepository,

        @InjectRepository(ChatRepository)
        private chatRepository: ChatRepository,
        
    ) {}

    async createChatroom(ownerId: number, targetUserId: number, title: string): Promise<Chatroom> {
        if (ownerId === targetUserId) {
            throw new ForbiddenException('You cannot create chatroom with yourself');
        }
        return await this.chatroomRepository.createChatroom(ownerId, targetUserId, title);
    }

    async fetchChatrooms(userId: number, offset: number, limit: number): Promise<ChatroomsResponse> {
        const data = await this.chatroomRepository.fetchChatrooms(userId, offset, limit);
        const count = await this.chatroomRepository.count(
            { where: [
                { owner: { id: userId } },
                { targetUser: { id: userId } },
            ]}
        );
        return new ChatroomsResponse(count, data);
    }

    async addUnreadCount(currentUserId: number, chatroomId: number, message: string): Promise<Chatroom> {
        const chatroom = await this.chatroomRepository.getChatroomById(chatroomId);
        chatroom.lastMessage = message;
        if ( chatroom.owner.id == currentUserId ) { 
            chatroom.targetUserUnreadCount++;
        } else if ( chatroom.targetUser.id == currentUserId ) {
            chatroom.ownerUnreadCount++;
        } else {
            throw new ForbiddenException('You cannot update unread count in this chatroom');
        }
        return await this.chatroomRepository.save(chatroom);
    }

    async resetUnreadCount(currentUserId: number, chatroomId: number): Promise<Chatroom> {
        const chatroom = await this.chatroomRepository.getChatroomById(chatroomId);
        if ( chatroom.owner.id == currentUserId ) {
            chatroom.ownerUnreadCount = 0;
        } else if ( chatroom.targetUser.id == currentUserId ) {
            chatroom.targetUserUnreadCount = 0;
        } else {
            throw new ForbiddenException('You cannot update unread count in this chatroom');
        }
        return await this.chatroomRepository.save(chatroom);
    }

    async createChat(currentUser: Account, chatroomId: number, message: string): Promise<Chat> {
        //TODO: transaction 으로 묶기
        await this.addUnreadCount(currentUser.id, chatroomId, message);
        const chat = await this.chatRepository.createChat(currentUser, chatroomId, message);
        return chat;
    }

    async fetchChats(currentUserId: number, chatroomId: number, offset: number, limit: number): Promise<ChatResponse> {
        await this.resetUnreadCount(currentUserId, chatroomId);
        const data = await this.chatRepository.fetchChats(chatroomId, offset, limit);
        const count = await this.chatRepository.count({ where: { chatroom: { id: chatroomId } }});
        return new ChatResponse(count, data);
    }




}
