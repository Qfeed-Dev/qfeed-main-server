import { In, IsNull, Like, Not, Repository } from "typeorm";
import * as bcrypt from 'bcryptjs';
import { ConflictException, InternalServerErrorException, NotFoundException } from "@nestjs/common";
import { Account, Block, Follow } from "./account.entity";
import { AccountInSign, AccountInUpdate } from "./account.dto";
import { CustomRepository } from "src/db/typeorm-ex.decorator";


@CustomRepository(Account)
export class AccountRepository extends Repository<Account> {
    async createAccount(AccountInSign: AccountInSign): Promise<Account> {
        
        const salt = await bcrypt.genSalt();
        const hashedPassword = await bcrypt.hash(AccountInSign.password, salt);
        
        try {
            const account = this.create({...AccountInSign, password: hashedPassword});
            await this.save(account);
            return account;
        } catch (error) {
            if(error.code === '23505') {
                throw new ConflictException('Existing email');
            } else {
                throw new InternalServerErrorException('signup failed');
            }
        }
    }

    async createAccountBySocialInfo(socialId: string, socialEmail: string): Promise<Account> {
        try {
            const profileImageIndex = Math.floor(Math.random() * 10) + 1;
            const account = this.create({"socialId": socialId, "email": socialEmail, "profileImage": new URL(`https://qfeed-s3.s3.ap-northeast-2.amazonaws.com/files/backgroundImages/bg${profileImageIndex}.png`)});  
            await this.save(account);
            return account;
        } catch (error) {
            if(error.code === '23505') {
                throw new ConflictException('Existing socialInfo');
            } else {
                throw new InternalServerErrorException('signup failed');
            }
        }
    }

    async getAccountById(id: number): Promise<Account> {
        const account = await this.findOne({
            relations: ["followers.user", "blockers.user"],
            where: { id : id }
        })
        if(account) {
            return account;
        } else {
            throw new NotFoundException(`Can't find account with id: ${id}`);
        }
    }

    async getAccountByEmail(email: string): Promise<Account> {
        const account = await this.findOne({where: {"email": email}})
        if(!account) {
            throw new NotFoundException(`Can't find account with email: ${email}`);
        }
        return account;    
    }

    async getAccountBySocialId(socialId: string): Promise<Account> {
        const account = await this.findOne({where: {"socialId": socialId}})
        if(!account) {
            throw new NotFoundException(`Can't find account with socialId: ${socialId}`);
        }
        return account;
    }

    async fetchAccounts(keyword: string, offset: number, limit: number): Promise<[Account[], number]> {
        return await this.findAndCount({
            relations: ["followers.user", "blockers.user"],
            where: [
                { name : Like(`%${keyword}%`) },
                { nickname: Like(`%${keyword}%`) }
            ],
            skip: offset,
            take: limit,
          });
    }

    async fetchUnfollowings(user: Account, followingsIds:number[], offset: number, limit: number): Promise<[Account[], number]> {
        return await this.findAndCount({
            where: {
                id: Not(In(followingsIds.concat(user.id))),
                nickname: Not(IsNull())
            },
            skip: offset,
            take: limit,
        });
    }     


    async updateAccount(id: number, AccountInUpdate: AccountInUpdate): Promise<Account> {
        try {
            let account = await this.getAccountById(id);
            Object.assign(account, AccountInUpdate);
            return await this.save(account);
        } catch (error) {
            if(error.code === '23505') {
                throw new ConflictException('Existing nickname');
            }
            throw new InternalServerErrorException('update failed');
        }
        
    }

    async deleteAccountById(id: number): Promise<void> {
        const result = await this.delete({id: id})
        if(result.affected === 0) {
            throw new NotFoundException(`Can't find account with id ${id}`);
        }
    }
}


@CustomRepository(Follow)
export class FollowRepository extends Repository<Follow> {

    async createFollow(user: Account, targetUserId: number): Promise<Follow> {
        const Follow = this.create({
            user: user, targetUser: {id: targetUserId}
        });
        return await this.save(Follow);
    }

    async fetchFollowings(user: Account, keyword: string, offset: number, limit: number): Promise<[Follow[], number]> {
        return await this.findAndCount({
            relations: ["targetUser"],
            where: [
                { user: { id : user.id },  targetUser: { name: Like(`%${keyword}%`)} },
                { user: { id : user.id },  targetUser: { nickname: Like(`%${keyword}%`)} },
            ],
            skip: offset,
            take: limit,
        })
    }

    async fetchFollowers(user: Account, offset: number, limit: number): Promise<[Follow[], number]> {
        return await this.findAndCount({
            relations: ["user"],
            where: {
                targetUser:  { id: user.id },
            },
            skip: offset,
            take: limit,
        })
    }

    async fetchFollowByTargetUser(targetUser: Account, offset: number, limit: number): Promise<Follow[]> {
        const follows = await this.find({
            where: {
                targetUser:  { id: targetUser.id },
            },
            skip: offset,
            take: limit,
        })
        return follows;
    }

    async getFollow(user: Account, targetUser: Account): Promise<Follow> {
        const follow = await this.findOne({
            where: {
                user:  { id: user.id },
                targetUser:  { id: targetUser.id },
            },
        })
        if(follow) {
            return follow;
        } else {
            throw new NotFoundException(`Can't find follow with id: ${user.id}`);
        }
    }

    async deleteFollow(user: Account, targetUserId: number): Promise<void> {
        await this.delete({
            user: { id: user.id },
            targetUser: { id: targetUserId }
        })
    }


}


@CustomRepository(Block)
export class BlockRepository extends Repository<Block> {

    async createBlock(user: Account, targetUserId: number): Promise<Block> {
        const block = this.create({
            user: user, targetUser: {id: targetUserId}
        });
        return await this.save(block);
    }

    async fetchBlockings(user: Account,  offset: number, limit: number): Promise<Block[]> {
        const blocks = await this.find({
            where: { user: { id : user.id } },
            skip: offset,
            take: limit,
        })
        return blocks;
    }

    async fetchBlocked(user: Account, offset: number, limit: number): Promise<Block[]> {
        const blocks = await this.find({
            where: {
                targetUser:  { id: user.id },
            },
            skip: offset,
            take: limit,
        })
        return blocks;
    }

    async deleteBlock(user: Account, targetUserId: number): Promise<void> {
        await this.delete({
            user: { id: user.id },
            targetUser: { id: targetUserId }
        })
    }

}
