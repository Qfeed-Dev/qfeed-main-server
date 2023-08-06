import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt'
import { HttpService } from '@nestjs/axios';

import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcryptjs';

import { AccountInSign, AccountInUpdate, TokenDto, checkNickname } from './account.dto';
import { AccountRepository } from './account.repository';
import { AxiosRequestConfig } from 'axios';
import { map, lastValueFrom } from 'rxjs';
import { Account } from './account.entity';



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

    async create(AccountInSign: AccountInSign): Promise<TokenDto> {
        const account = await this.accountRepository.createAccount(AccountInSign)
        const payload = { id: account.id, email: account.email };
        const accessToken = this.jwtService.sign(payload);

        const currentTime = new Date();
        const expireTime = new Date(currentTime.getTime() + 60 * 60 * 24 * 2 * 1000);
        return new TokenDto(accessToken, expireTime);
    }

    async update(id:number, AccountInUpdate: AccountInUpdate): Promise<Account> {
        const account = await this.accountRepository.updateAccount(id, AccountInUpdate)
        return account
    }

    async checkNickname(nickname: string): Promise<checkNickname> {   
        const nicknameRegex = /^[\w\d_]+$/;
        if (!nicknameRegex.test(nickname)) {
            return new checkNickname(nickname, false, "닉네임은 영문, 숫자, _ 만 가능합니다.");
        }
        const account = await this.accountRepository.findOne({where: {"nickname": nickname}})
        if(account) {
            return new checkNickname(nickname, false, "이미 사용중인 닉네임 입니다." );            ;
        }
        return new checkNickname(nickname, true, "사용 가능한 닉네임 입니다." );

    }
    
    async login(AccountInSign: AccountInSign): Promise<TokenDto> {
        const account = await this.accountRepository.getAccountByEmail(AccountInSign.email);
        if(account && (await bcrypt.compare(AccountInSign.password, account.password))) {
            const payload = { id: account.id, email: account.email };
            const accessToken = this.jwtService.sign(payload);

            const currentTime = new Date();
            const expireTime = new Date(currentTime.getTime() + 60 * 60 * 24 * 2 * 1000);
            return new TokenDto(accessToken, expireTime);

        } else {
            throw new UnauthorizedException('login failed')
        }
    }
    
    private async getKakaoAccessToken(code: string, redirectUrl: string) {
        const requestUrl = 'https://kauth.kakao.com/oauth/token';
        const requestConfig: AxiosRequestConfig = {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8',
            },
        };
        const requestData = {
            'grant_type': 'authorization_code',
            'client_id': process.env.KAKAO_CLIENT_ID,
            'redirect_uri': redirectUrl,
            'code': code,
        }
        const responseData = await lastValueFrom(
            this.httpService.post(requestUrl, requestData, requestConfig).pipe(
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
            ),
        ));
        return responseData;
    }
    
    private async socialLogin(socialId: string): Promise<TokenDto> {
        let account: Account;
        try {
            account = await this.accountRepository.getAccountBySocialId(socialId);
        }
        catch (error){
            account = await this.accountRepository.createAccountBySocialId(socialId);
        }
        finally{
            const payload = { id: account.id };
            const token = this.jwtService.sign(payload);
            const currentTime = new Date();
            const expireTime = new Date(currentTime.getTime() + 60 * 60 * 24 * 2 * 1000);
            return new TokenDto(token, expireTime);
        }
    }

    async kakaoLogin(code: string, redirectUrl: string = `${process.env.BASE_URL}/account/kakao/callback`): Promise<TokenDto>{
        try {
            const accessToken = await this.getKakaoAccessToken(code, redirectUrl);
            const userInfo = await this.getKakaoUserInfo(accessToken);
            const token = await this.socialLogin(userInfo.id);
            return token;

        } catch (error) {
            throw new BadRequestException(error.response.data.error_description);
        }
    }
}