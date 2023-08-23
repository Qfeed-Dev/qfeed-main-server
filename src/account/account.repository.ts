import { Repository } from "typeorm";
import * as bcrypt from 'bcryptjs';
import { ConflictException, InternalServerErrorException, NotFoundException } from "@nestjs/common";
import { Account, Follow } from "./account.entity";
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
            const account = this.create({"socialId": socialId, "email": socialEmail});  
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
        const account = await this.findOne({where: {"id": id}})
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

    async fetchAccounts(offset: number, limit: number): Promise<Account[]> {
        const accounts = await this.find({
            skip: offset,
            take: limit,
          });
        return accounts;
    }

    async updateAccount(id: number, AccountInUpdate: AccountInUpdate): Promise<Account> {
        const account = await this.getAccountById(id);
        Object.assign(account, AccountInUpdate);
        return this.save(account);
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

    async createFollow(user: Account, targetUser: Account): Promise<Follow> {
        if (user.id === targetUser.id) {
            throw new ConflictException('can not follow myself');
        }
        try {
            const Follow = this.create({
                user: user, targetUser: targetUser
            });
            return await this.save(Follow);
        } catch (error) {
            if (error.code === '23505') {
                return await this.getFollow(user, targetUser)
            }
            throw new InternalServerErrorException('create follow failed');
        }
    }

    async fetchFollowings(user: Account, offset: number, limit: number): Promise<Follow[]> {
        const follows = await this.find({
            relations: ["targetUser"],
            where: {
                "user":  { "id": user.id },
            },
            skip: offset,
            take: limit,
        })
        return follows;
    }

    async fetchFollowers(user: Account, offset: number, limit: number): Promise<Follow[]> {
        const follows = await this.find({
            relations: ["user"],
            where: {
                "targetUser":  { "id": user.id },
            },
            skip: offset,
            take: limit,
        })
        return follows;
    }

    async fetchFollowByTargetUser(targetUser: Account, offset: number, limit: number): Promise<Follow[]> {
        const follows = await this.find({
            where: {
                "targetUser":  { "id": targetUser.id },
            },
            skip: offset,
            take: limit,
        })
        return follows;
    }

    async getFollow(user: Account, targetUser: Account): Promise<Follow> {
        const follow = await this.findOne({
            where: {
                "user":  { "id": user.id },
                "targetUser":  { "id": targetUser.id },
            },
        })
        if(follow) {
            return follow;
        } else {
            throw new NotFoundException(`Can't find follow with id: ${user.id}`);
        }
    }

    async deleteFollow(user: Account, targetUser: Account): Promise<void> {
        await this.delete({
            "user": {"id": user.id},
            "targetUser": {"id": targetUser.id}
        })
    }


}
