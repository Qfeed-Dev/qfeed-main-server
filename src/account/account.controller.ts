import { Body, Controller, Delete, Get, Post,Patch, Query, UseGuards, Param, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AccountDto, AccountInSign, AccountInUpdate, UsersResponse, TokenDto, UserDto, checkNickname, UsersProfileResponse, UserProfileDto } from './account.dto';
import { AccountService } from './account.service';
import { AuthGuard } from '@nestjs/passport';
import { CurrentUser } from './get-user.decorator';
import { Account } from './account.entity';


@Controller('account')
@ApiTags('Account')
export class AccountController {
    constructor(private readonly accountService: AccountService) {}

    @Post('/sign-up')
    @ApiBody({ type: AccountInSign })
    @ApiResponse({ status: 201, description: 'Account has been successfully created', type: AccountDto })
    @ApiOperation({ summary: 'Create' })
    async createAccount(@Body() AccountInSign: AccountInSign): Promise<TokenDto> {
        const token = await this.accountService.create(AccountInSign);
        return token;
    }

    @Post('/sign-in')
    @ApiBody({ type: AccountInSign })
    @ApiResponse({ status: 200, description: 'Account has been successfully logged in', type: TokenDto })
    @ApiOperation({ summary: 'Login' })
    async loginAccount(@Body() AccountInSign: AccountInSign): Promise<TokenDto> {
        return await this.accountService.login(AccountInSign);
    }

    @ApiOperation({ summary: 'kakao login' })
    @Get('/kakao/login')
    async kakaoLogin(@Query('code') code: string, @Query('redirectUrl') redirectUrl: string) {
        return await this.accountService.kakaoLogin(code, redirectUrl);
    }

    @Get('/check-nickname')
    @ApiResponse({ status: 200, description: 'Check nickname', type: checkNickname })
    @ApiOperation({ summary: 'Check nickname' })
    async checkNickname(@Query('nickname') nickname: string): Promise<checkNickname> {
        return await this.accountService.checkNickname(nickname);
    }

    @Get('/me')
    @ApiBearerAuth('JWT')
    @UseGuards(AuthGuard('jwt'))
    @ApiResponse({ status: 200, description: 'Account info about myself', type: AccountDto })
    @ApiOperation({ summary: 'me summary' })
    getAccount(@CurrentUser() account: Account): AccountDto {
        return new AccountDto(account);
    }

    @ApiOperation({ summary: 'me update' })
    @ApiResponse({ status: 200, description: 'Account info about myself', type: AccountDto })
    @ApiBearerAuth('JWT')
    @UseGuards(AuthGuard('jwt'))
    @Patch('/me')
    async updateAccount(@CurrentUser() account: Account, @Body() AccountInUpdate: AccountInUpdate): Promise<AccountDto> {
        const updatedAccount = await this.accountService.update(account.id, AccountInUpdate);
        return new AccountDto(updatedAccount);
    }

    @Delete('me/hard-delete')
    @ApiBearerAuth('JWT')
    @UseGuards(AuthGuard('jwt'))
    @ApiResponse({ status: 200, description: 'Hard Delete Account' })
    @ApiOperation({ summary: 'delete' })
    async hardDeleteAccount(@CurrentUser() account: Account): Promise<any> {
        await this.accountService.delete(account.id);
        return {"message": "success"}
    }

    @Get('/me/followings')
    @ApiResponse({ status: 200, description: 'fetch followings', type:  UsersResponse})
    @ApiOperation({ summary: 'fetch followings' })
    @ApiBearerAuth('JWT')
    @UseGuards(AuthGuard('jwt'))
    @ApiQuery({ name: 'keyword', required: false, type: String })
    @ApiQuery({ name: 'offset', required: false, type: Number })
    @ApiQuery({ name: 'limit', required: false, type: Number })
    async fetchFollowings(
        @CurrentUser() user: Account, 
        @Query('keyword') keyword: string = "",
        @Query('offset') offset: number = 0,
        @Query('limit') limit: number = 20,
    ): Promise<UsersResponse> {
        return await this.accountService.fetchFollowings(user, keyword, offset, limit);
    }

    @Get('/me/followers')
    @ApiResponse({ status: 200, description: 'fetch followers', type:  UsersResponse})
    @ApiOperation({ summary: 'fetch followers' })
    @ApiBearerAuth('JWT')
    @UseGuards(AuthGuard('jwt'))
    @ApiQuery({ name: 'offset', required: false, type: Number })
    @ApiQuery({ name: 'limit', required: false, type: Number })
    async fetchFollowers(
        @CurrentUser() user: Account,
        @Query('offset') offset: number = 0,
        @Query('limit') limit: number = 20,
    ): Promise<UsersResponse> {
        return await this.accountService.fetchFollowers(user, offset, limit);
    }

    @Get('/me/unfollowings')
    @ApiResponse({ status: 200, description: 'fetch unfollowings', type:  UsersResponse})
    @ApiOperation({ summary: 'fetch unfollowings' })
    @ApiBearerAuth('JWT')
    @UseGuards(AuthGuard('jwt'))
    @ApiQuery({ name: 'offset', required: false, type: Number })
    @ApiQuery({ name: 'limit', required: false, type: Number })
    async fetchUnfollowings(
        @CurrentUser() user: Account,
        @Query('offset') offset: number = 0,
        @Query('limit') limit: number = 20,
    ): Promise<UsersResponse> {
        return await this.accountService.fetchUnfollowings(user, offset, limit);
    }

    @Get('/fetch')
    @ApiResponse({ status: 200, description: 'fetch users', type: UsersProfileResponse })
    @ApiOperation({ summary: 'fetch users' })
    @ApiBearerAuth('JWT')
    @UseGuards(AuthGuard('jwt'))
    @ApiQuery({ name: 'keyword', required: false, type: String })
    @ApiQuery({ name: 'offset', required: false, type: Number })
    @ApiQuery({ name: 'limit', required: false, type: Number })
    async fetchUsers(
        @CurrentUser() user: Account,
        @Query('keyword') keyword: string = "",
        @Query('offset') offset: number = 0,
        @Query('limit') limit: number = 20,
    ): Promise<UsersProfileResponse> {
        return await this.accountService.fetch(user, keyword, offset, limit);
    }

    @ApiOperation({ summary: 'get user' })
    @ApiResponse({ status: 200, description: 'Account info about target user', type: UserProfileDto })
    @ApiBearerAuth('JWT')
    @UseGuards(AuthGuard('jwt'))
    @Get('/:id')
    async getUser(
        @CurrentUser() user: Account,
        @Param('id', ParseIntPipe) id: number
    ): Promise<UserProfileDto>  {
        const account = await this.accountService.getAccountById(id);
        return new UserProfileDto(user.id, account);
    }

    @ApiOperation({ summary: 'follow user' })
    @ApiResponse({ status: 201, description: 'follow user', type: UserDto })
    @ApiBearerAuth('JWT')
    @UseGuards(AuthGuard('jwt'))
    @Post('/:targetUserId/follow')
    async followUser(
        @CurrentUser() user: Account,
        @Param('targetUserId', ParseIntPipe) targetUserId: number
    ): Promise<UserDto> {
        const targetUser = await this.accountService.getAccountById(targetUserId);
        await this.accountService.followUser(user, targetUser);
        return new UserDto(targetUser);
    }

    @ApiOperation({ summary: 'unfollow user' })
    @ApiResponse({ status: 200, description: 'unfollow user', type: UserDto })
    @ApiBearerAuth('JWT')
    @UseGuards(AuthGuard('jwt'))
    @Delete('/:targetUserId/unfollow')
    async unfollowUser(
        @CurrentUser() user: Account,
        @Param('targetUserId', ParseIntPipe) targetUserId: number
    ): Promise<UserDto> {
        const targetUser = await this.accountService.getAccountById(targetUserId);
        await this.accountService.unfollowUser(user, targetUser);
        return new UserDto(targetUser);
    }

}
