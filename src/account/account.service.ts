import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt'
import { HttpService } from '@nestjs/axios';

import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcryptjs';

import { AccountInSignIn, AccountInSignUp, TokenDto } from './account.dto';
import { AccountRepository } from './account.repository';
import { AxiosRequestConfig } from 'axios';
import { lastValueFrom, map } from 'rxjs';



@Injectable()
export class AccountService {
    constructor(
        @InjectRepository(AccountRepository)
        private accountRepository: AccountRepository,
        private jwtService: JwtService,
        private readonly httpService: HttpService
    ) {}
        
    async delete(id: number) : Promise<void> {
        await this.accountRepository.deleteAccountById(id)
    }

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

    async socialLogin(email: string): Promise<TokenDto> {
        const account = await this.accountRepository.getAccountByEmail(email);
        if(account) {
            const payload = { id: account.id, email: account.email };
            const accessToken = this.jwtService.sign(payload);

            const currentTime = new Date();
            const expireTime = new Date(currentTime.getTime() + 60 * 60 * 24 * 2 * 1000);
            return new TokenDto(accessToken, expireTime);
        } else {
            const account = await this.accountRepository.createAccount({email: email, password: "추후 랜덤 생성"})
            const payload = { id: account.id, email: account.email };
            const accessToken = this.jwtService.sign(payload);

            const currentTime = new Date();
            const expireTime = new Date(currentTime.getTime() + 60 * 60 * 24 * 2 * 1000);
            return new TokenDto(accessToken, expireTime);
        }
    }


    private async getKakaoAccessToken(code: string) {
        
        console.log(code)
        const requestUrl = 'https://kauth.kakao.com/oauth/token';
        const requestConfig: AxiosRequestConfig = {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8',
            },
          };
        const data = {
            'grant_type': 'authorization_code',
            'client_id': process.env.KAKAO_CLIENT_ID,
            'redirect_uri': `${process.env.BASE_URL}/account/kakao/callback`,
            'code': code,
        }

        const responseData = await lastValueFrom(
            this.httpService.post(requestUrl, data, requestConfig).pipe(
                map((response) => {
                    return response.data;
                }),
            )
        );
        return responseData.access_token;
    }

    private async getKakaoUserInfo(accessToken: string) {
        const requestUrl = 'https://kapi.kakao.com/v2/user/me';
        const requestConfig: AxiosRequestConfig = {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8',
            }
          };
        
        const responseData = await lastValueFrom(
            this.httpService.get(requestUrl, requestConfig).pipe(
                map((response) => {
                    return response.data;
                }
            )
        ));
        return responseData;

    }

    async kakaoLogin(code: string): Promise<TokenDto>{
        const accessToken = await this.getKakaoAccessToken(code);
        const userInfo = await this.getKakaoUserInfo(accessToken);
        const token = await this.socialLogin(userInfo.kakao_account.email);
        return token;
    }

}