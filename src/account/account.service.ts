import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt'

import { InjectRepository } from '@nestjs/typeorm';
import { Account } from './account.entity';
import * as bcrypt from 'bcryptjs';

import { AccountInSignIn, AccountInSignUp, TokenDto } from './account.dto';
import { AccountRepository } from './account.repository';


@Injectable()
export class AccountService {
    constructor(
        @InjectRepository(AccountRepository)
        private accountRepository: AccountRepository,
        private jwtService: JwtService
    ) {}

    async create(AccountInSignUp: AccountInSignUp): Promise<TokenDto> {
        const account = await this.accountRepository.createAccount(AccountInSignUp)
        const payload = { id: account.id, email: account.email };
        const accessToken = this.jwtService.sign(payload);

        const currentTime = new Date();
        const expireTime = new Date(currentTime.getTime() + 60 * 60 * 24 * 2 * 1000);
        return new TokenDto(accessToken, expireTime);
    }

    async login(AccountInSignIn: AccountInSignIn): Promise<TokenDto> {
        const account = await this.accountRepository.getAccountByEmail(AccountInSignIn.email);
        if(account && (await bcrypt.compare(AccountInSignIn.password, account.password))) {
            const payload = { id: account.id, email: account.email };
            const accessToken = this.jwtService.sign(payload);

            const currentTime = new Date();
            const expireTime = new Date(currentTime.getTime() + 60 * 60 * 24 * 2 * 1000);
            return new TokenDto(accessToken, expireTime);

        } else {
            throw new UnauthorizedException('login failed')
        }
    }

    async get(id: number): Promise<Account> {
        const account = await this.accountRepository.getAccountById(id)
        return account
    }

    async delete(id: number) : Promise<void> {
        await this.accountRepository.deleteAccountById(id)
    }

}