import { CustomRepository } from "src/db/typeorm-ex.decorator";
import { In, Repository } from "typeorm";
import { Chat, Chatroom } from "./chatroom.entity";
import { InternalServerErrorException, NotFoundException } from "@nestjs/common";
import { Account } from "src/account/account.entity";



@CustomRepository(Chatroom)
export class ChatroomRepository extends Repository<Chatroom> {
    
    async createChatroom(ownerId: number, targetUserId: number, title: string): Promise<Chatroom> {
        const chatroom = this.create({
            owner: { id: ownerId },
            targetUser: { id: targetUserId },
            title: title,
        });
        await this.save(chatroom);
        return chatroom;
    }

    async fetchChatrooms(userId: number, offset: number, limit: number): Promise<Chatroom[]> {
        const chatrooms = await this.find({
            relations: ['targetUser', 'owner'],
            where: [
                { owner: { id: userId } },
                { targetUser: { id: userId } },
            ],
            order: { updatedAt: 'DESC' },
            skip: offset,
            take: limit,
        })
        return chatrooms;
    }

    async getChatroomById(id: number): Promise<Chatroom> {
        const chatroom = await this.findOne({
            relations: ['targetUser', 'owner'],
            where: { id: id }
        })
        return chatroom;
    }

    async getChatroomByTitle(ownerId: number, targetUserId: number, title: string): Promise<Chatroom> {
        const chatroom = await this.findOne({
            relations: ['targetUser', 'owner'],
            where: { 
                owner: { id: ownerId },
                targetUser: { id: targetUserId },
                title: title,
            }
        })
        return chatroom;
    }
        

}

@CustomRepository(Chat)
export class ChatRepository extends Repository<Chat> {
        
    async createChat(currentUser: Account, chatroomId: number, message: string): Promise<Chat> {
        try {
            const chat = this.create({
                owner: currentUser,
                chatroom: { id: chatroomId },
                message: message,
            });
            await this.save(chat);
            return chat;
        } catch (error) {
            if (error.code === '23503') {
                throw new NotFoundException(`chatroom [${chatroomId}] not found`);
            }
            throw new InternalServerErrorException('create chat failed');
        }
    }

    async fetchChats(chatroomId: number, offset: number, limit: number): Promise<Chat[]> {
        try{
            const chats = await this.find({
                relations: ['owner'],
                where: { chatroom: { id: chatroomId } },
                order: { createdAt: 'DESC' },
                skip: offset,
                take: limit,
            })
            return chats;
        } catch (error) {
            if (error.code === '23503') {
                throw new NotFoundException(`chatroom [${chatroomId}] not found`);
            }
        }
    }
    

}
