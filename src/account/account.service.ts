import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt'
import { HttpService } from '@nestjs/axios';

import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcryptjs';

import { AccountInSign, AccountInUpdate, UsersResponse, TokenDto, UserDto, checkNickname, UserProfileDto, UsersProfileResponse } from './account.dto';
import { AccountRepository, FollowRepository } from './account.repository';
import { AxiosRequestConfig } from 'axios';
import { map, lastValueFrom } from 'rxjs';
import { Account, Follow } from './account.entity';
import { In, IsNull, Like, Not } from 'typeorm';



@Injectable()
export class AccountService {
    constructor(
        @InjectRepository(AccountRepository)
        private accountRepository: AccountRepository,
        
        @InjectRepository(FollowRepository)
        private followRepository: FollowRepository,

        private jwtService: JwtService,
        private readonly httpService: HttpService
    ) {}
        
    
    async create(AccountInSign: AccountInSign): Promise<TokenDto> {
        const account = await this.accountRepository.createAccount(AccountInSign)
        const payload = { id: account.id, email: account.email };
        const accessToken = this.jwtService.sign(payload);
        
        const currentTime = new Date();
        const expireTime = new Date(currentTime.getTime() + 60 * 60 * 24 * 2 * 1000);
        return new TokenDto(accessToken, expireTime);
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

    async checkNickname(nickname: string): Promise<checkNickname> {   
        const nicknameRegex = /^[\w\d_]+$/;
        const account = await this.accountRepository.findOne({where: {"nickname": nickname}})
        
        if (nickname.length < 4 || nickname.length > 12) {
            return new checkNickname(nickname, false, "닉네임은 4자 이상 12자 이하만 가능합니다.");
        }
        if (!nicknameRegex.test(nickname)) {
            return new checkNickname(nickname, false, "닉네임은 영문, 숫자, _ 만 가능합니다.");
        }
        if(account) {
            return new checkNickname(nickname, false, "이미 사용중인 닉네임 입니다." );            
        }
        return new checkNickname(nickname, true, "사용 가능한 닉네임 입니다." );

    }

    async getAccountById(id: number): Promise<Account> {
        const account = await this.accountRepository.getAccountById(id);
        return account
    }

    async updateAccount(id:number, AccountInUpdate: AccountInUpdate): Promise<Account> {
        const account = await this.accountRepository.updateAccount(id, AccountInUpdate)
        return account
    }
    
    async delete(id: number) : Promise<void> {
        await this.accountRepository.deleteAccountById(id)
    }

    async fetch(user: Account, keyword: string, offset: number, limit: number): Promise<UsersProfileResponse> {
        const accounts = await this.accountRepository.fetchAccounts(keyword, offset, limit);
        console.log(accounts)
        const count = await this.accountRepository.count({
            where: [
                { name : Like(`%${keyword}%`) },
                { nickname: Like(`%${keyword}%`) }
            ],
        });
        
        return new UsersProfileResponse(
            accounts.map((account: Account) => new UserProfileDto(user.id, account)),
            count
        );
    }
    
    async kakaoLogin(code: string, redirectUrl: string = `${process.env.BASE_URL}/account/kakao/callback`): Promise<TokenDto>{
        try {
            const accessToken = await this.getKakaoAccessToken(code, redirectUrl);
            const userInfo = await this.getKakaoUserInfo(accessToken);
            const token = await this.socialLogin(userInfo.id, userInfo.kakao_account.email);
            return token;

        } catch (error) {
            throw new BadRequestException(error.response.data.error_description);
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
    
    // TODO: 검증과정 추가, POST 로 변경, payload로 받기
    async appleLogin(idToken: string): Promise<TokenDto>{
        const userInfo = this.jwtService.decode(idToken)
        if (!userInfo.hasOwnProperty('sub')) {
            throw new BadRequestException('sub is required');
        }
        const token = await this.socialLogin(userInfo.sub, userInfo['email'] || null);
        return token;
    }

    private async socialLogin(socialId: string, socialEmail: string | null ): Promise<TokenDto> {
        let account: Account;
        try {
            account = await this.accountRepository.getAccountBySocialId(socialId);
        }
        catch (error){
            account = await this.accountRepository.createAccountBySocialInfo(socialId, socialEmail);
        }
        finally{
            const payload = { id: account.id };
            const token = this.jwtService.sign(payload);
            const currentTime = new Date();
            const expireTime = new Date(currentTime.getTime() + 60 * 60 * 24 * 2 * 1000);
            return new TokenDto(token, expireTime);
        }
    }

    async followUser(user: Account, targetUser: Account): Promise<Account> {
        await this.followRepository.createFollow(user, targetUser);
        return targetUser;
    }

    async unfollowUser(user: Account, targetUser: Account): Promise<Account> {
        await this.followRepository.deleteFollow(user, targetUser);
        return targetUser;
    }

    async fetchFollowings(user: Account, keyword: string, offset: number, limit: number): Promise<UsersResponse> {
        const followings = await this.followRepository.fetchFollowings(user, keyword, offset, limit);
        const count = await this.followRepository.count({
            where: [
                { user: {id: user.id}, targetUser: { name: Like(`%${keyword}%`) } },
                { user: {id: user.id}, targetUser: { nickname: Like(`%${keyword}%`) } }
            ]
        });

        return new UsersResponse(
            followings.map((follow: Follow) => new UserDto(follow.targetUser)),
            count
        );
    }

    async fetchFollowers(user: Account, offset: number, limit: number): Promise<UsersResponse> {
        const followers = await this.followRepository.fetchFollowers(user, offset, limit);
        const count = await this.followRepository.count(
            { where: {"targetUser": {"id": user.id} } }
        );
                    
        return new UsersResponse(
            followers.map((follow: Follow) => new UserDto(follow.user)),
            count
        );
    }


    async fetchUnfollowings(user: Account, offset: number, limit: number): Promise<UsersResponse> {
        const followings = await this.followRepository.find({
            relations: ["targetUser"],
            where: { user: { id: user.id } },
        });
        const followingIds = followings.map((follow: Follow) => follow.targetUser.id);
        const unfollowingUsers = await this.accountRepository.fetchUnfollowings(user, followingIds, offset, limit);
        const count = await this.accountRepository.count({
            where: {
                id: Not(In(followingIds.concat(user.id))),
                nickname: Not(IsNull())
            },
        });
        return new UsersResponse(
            unfollowingUsers.map((account: Account) => new UserDto(account)),
            count
        );
    }  
}