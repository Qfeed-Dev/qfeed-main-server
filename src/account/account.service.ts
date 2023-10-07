import { Injectable, UnauthorizedException, BadRequestException, InternalServerErrorException, ConflictException, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt'
import { HttpService } from '@nestjs/axios';

import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcryptjs';

import { AccountInSign, AccountInUpdate, UsersResponse, TokenDto, UserDto, checkNickname, UserProfileDto, UsersProfileResponse } from './account.dto';
import { AccountRepository, BlockRepository, FollowRepository } from './account.repository';
import { AxiosRequestConfig } from 'axios';
import { map, lastValueFrom } from 'rxjs';
import { Account, Block, Follow } from './account.entity';



@Injectable()
export class AccountService {
    constructor(
        @InjectRepository(AccountRepository)
        private accountRepository: AccountRepository,
        
        @InjectRepository(FollowRepository)
        private followRepository: FollowRepository,

        @InjectRepository(BlockRepository)
        private blockRepository: BlockRepository,

        private jwtService: JwtService,
        private readonly httpService: HttpService
    ) {}
        
    
    async create(AccountInSign: AccountInSign): Promise<TokenDto> {
        try{
            const account = await this.accountRepository.createAccount(AccountInSign)
            const payload = { id: account.id, email: account.email };
            
            const accessToken = this.jwtService.sign(payload);
            const currentTime = new Date();
            const expireTime = new Date(currentTime.getTime() + 60 * 60 * 24 * 2 * 1000);
            return new TokenDto(accessToken, expireTime);
        } catch (error) {
            if(error.code === '23505') throw new ConflictException('Existing email');
            else throw new InternalServerErrorException('signup failed');
            
        }
    }
    
    async login(AccountInSign: AccountInSign): Promise<TokenDto> {
        const account = await this.accountRepository.getAccountByEmail(AccountInSign.email);
        if(!account) {
            throw new NotFoundException(`Can't find account with email: ${AccountInSign.email}`);
        }
        else if(account && (await bcrypt.compare(AccountInSign.password, account.password))) {
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
        if (!account) throw new NotFoundException(`Can't find account with id: ${id}`);
        return account
    }

    async updateAccount(id: number, AccountInUpdate: AccountInUpdate): Promise<Account> {
        let account = await this.accountRepository.getAccountById(id);
        if (!account) throw new NotFoundException(`Can't find account with id: ${id}`);
        try {
            account = await this.accountRepository.updateAccount(account, AccountInUpdate)
        } catch (error) {
            if(error.code === '23505') throw new ConflictException('Existing nickname');
            else throw new InternalServerErrorException('update failed');
        }
        return account
    }
    
    async delete(id: number) : Promise<void> {
        await this.accountRepository.delete({id: id});
    }

    async fetch(user: Account, keyword: string, offset: number, limit: number): Promise<UsersProfileResponse> {
        // 나를 차단한 유저를 제외함
        const currentUser = await this.accountRepository.findOne({
            relations: ["blockers.user"], 
            where: { id: user.id }
        })
        const blockedUserIds = currentUser.blockers.map((block) => block.user.id);
        const [accounts, count] = await this.accountRepository.fetchAccounts(keyword, blockedUserIds, offset, limit);
        return new UsersProfileResponse(
            accounts.map((account: Account) => new UserProfileDto(user.id, account)),
            count
        );
    }
    
    async kakaoLogin(code: string, redirectUrl: string): Promise<TokenDto>{
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
        try {
            const userInfo = this.jwtService.decode(idToken)
            if (!userInfo.hasOwnProperty('sub')) {
                throw new BadRequestException('sub is required');
            }
            const token = await this.socialLogin(userInfo.sub, userInfo['email'] || null);
            return token;
        }
        catch (error) {
            throw new BadRequestException('invalid idToken');
        }
    
    }
        

    private async socialLogin(socialId: string, socialEmail: string | null ): Promise<TokenDto> {
        let account = await this.accountRepository.getAccountBySocialId(socialId);
        if(!account) {
            try {
                account = await this.accountRepository.createAccountBySocialInfo(socialId, socialEmail);
            } catch (error) {
                if(error.code === '23505') throw new ConflictException('Existing socialInfo');
                else throw new InternalServerErrorException('signup failed');
            }
        }
        const payload = { id: account.id };
        const token = this.jwtService.sign(payload);
        const currentTime = new Date();
        const expireTime = new Date(currentTime.getTime() + 60 * 60 * 24 * 2 * 1000);
        return new TokenDto(token, expireTime);
    }

    async followUser(user: Account, targetUserId: number): Promise<void> {
        if (user.id === targetUserId) {
            throw new BadRequestException("자기 자신은 팔로우할 수 없습니다.");
        }
        try {
            await this.followRepository.createFollow(user, targetUserId);
        } catch (error) {
            if (error.code === '23505') throw new ConflictException("이미 팔로우 한 사용자입니다.");
            else if (error.code === '23503') throw new NotFoundException("존재하지 않는 사용자입니다.");
            else throw new InternalServerErrorException("팔로우에 실패했습니다.");
        }
    }

    async unfollowUser(user: Account, targetUserId: number): Promise<void> {
        if (user.id === targetUserId) {
            throw new BadRequestException("자기 자신은 언팔로우 할 수 없습니다.");
        }
        try {
            await this.followRepository.deleteFollow(user, targetUserId);   
        } catch (error) {
            throw new InternalServerErrorException("언팔로우에 실패했습니다.");
        }
    }

    async fetchFollowings(user: Account, keyword: string, offset: number, limit: number): Promise<UsersResponse> {
        // 나를 차단한 유저를 제외함. 내가 차단한 유저는 서비스로직에서 차단할 때 following 이 해제 됨
        const currentUser = await this.accountRepository.findOne({
            relations: ["blockers.user"], 
            where: { id: user.id }
        })
        const blockedUserIds = currentUser.blockers.map((block) => block.user.id);
        const [followings, count] = await this.followRepository.fetchFollowings(user, keyword, blockedUserIds, offset, limit);
        return new UsersResponse(
            followings.map((follow: Follow) => new UserDto(follow.targetUser)),
            count
        );
    }

    async fetchFollowers(user: Account, offset: number, limit: number): Promise<UsersResponse> {
        const [followers, count] = await this.followRepository.fetchFollowers(user, offset, limit);
        return new UsersResponse(
            followers.map((follow: Follow) => new UserDto(follow.user)),
            count
        );
    }


    async fetchUnfollowings(user: Account, offset: number, limit: number): Promise<UsersResponse> {
        // 기존 팔로잉 유저, 내가 차단한 유저와 나를 차단한 유저, 그리고 본인을 제외함
        const currentUser = await this.accountRepository.findOne({
            relations: ["followings.targetUser", "blockings.targetUser", "blockers.user" ], 
            where: { id: user.id }
        })
        const followingIds = currentUser.followings.map((follow: Follow) => follow.targetUser.id);
        const blockingUserIds = currentUser.blockings.map((block: Block) => block.targetUser.id);
        const blockedUserIds = currentUser.blockers.map((block: Block) => block.user.id);
        const exceptedIds = [...followingIds, ...blockingUserIds, ...blockedUserIds, user.id];

        const [unfollowingUsers, count] = await this.accountRepository.fetchUnfollowings(exceptedIds, offset, limit);
        return new UsersResponse(
            unfollowingUsers.map((account: Account) => new UserDto(account)),
            count
        );
    }


    async blockUser(user: Account, targetUserId: number): Promise<void> {
        if (user.id === targetUserId) {
            throw new BadRequestException("자기 자신은 차단할 수 없습니다.");
        }
        try {
            // TODO: transaction 묶기
            await this.followRepository.deleteFollow(user, targetUserId);
            await this.blockRepository.createBlock(user, targetUserId);
        } catch (error) {
            if (error.code === '23505') throw new ConflictException("이미 차단한 사용자입니다.");
            else if (error.code === '23503') throw new NotFoundException("존재하지 않는 사용자입니다.");
            else throw new InternalServerErrorException("차단에 실패했습니다.");
        }
    }

    async unblockUser(user: Account, targetUserId: number): Promise<void> {
        if (user.id === targetUserId) {
            throw new BadRequestException("자기 자신은 차단해제할 수 없습니다.");
        }
        try {
            await this.blockRepository.deleteBlock(user, targetUserId);
        } catch (error) {
            throw new InternalServerErrorException("차단해제에 실패했습니다.");
        }
    }

}