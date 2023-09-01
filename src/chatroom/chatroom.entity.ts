import { Account } from "src/account/account.entity";
import { 
    BaseEntity, 
    Column, 
    Entity, 
    PrimaryGeneratedColumn,
    CreateDateColumn,
    ManyToOne,
    UpdateDateColumn
} from "typeorm";


@Entity()
export class Chatroom extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => Account, (owner) => owner.id)
    owner: Account

    @ManyToOne(() => Account, (targetUser) => targetUser.id)
    targetUser: Account

    @Column()
    title: string;

    @Column({ nullable: true })
    lastMessage: string;

    @Column({ default: 0 })
    ownerUnreadCount: number;

    @Column({ default: 0 })
    targetUserUnreadCount: number;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

}

@Entity()
export class Chat extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => Account, (owner) => owner.id)
    owner: Account

    @ManyToOne(() => Chatroom, (chatroom) => chatroom.id)
    chatroom: Chatroom

    @Column()
    message: string;

    @CreateDateColumn()
    createdAt: Date;
}