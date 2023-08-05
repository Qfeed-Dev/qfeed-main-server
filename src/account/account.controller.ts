import { Body, Controller, Delete, Get, Post,Patch, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { AccountDto, AccountInSign, AccountInUpdate, TokenDto, checkNickname } from './account.dto';
import { AccountService } from './account.service';
import { AuthGuard } from '@nestjs/passport';
import { GetAccount } from './get-user.decorator';
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

    @Get('/check-nickname')
    @ApiResponse({ status: 200, description: 'Check nickname', type: checkNickname })
    @ApiOperation({ summary: 'Check nickname' })
    async checkNickname(@Query('nickname') nickname: string): Promise<checkNickname> {
        return await this.accountService.checkNickname(nickname);
    }
    @Get('/me')
    @ApiBearerAuth('JWT')
    @UseGuards(AuthGuard())
    @ApiResponse({ status: 200, description: 'Account info about myself', type: AccountDto })
    @ApiOperation({ summary: 'me' })
    getAccount(@GetAccount() account: Account): AccountDto {
        return new AccountDto(account);
    }

    @Delete('me/hard-delete')
    @ApiBearerAuth('JWT')
    @UseGuards(AuthGuard())
    @ApiResponse({ status: 200, description: 'Hard Delete Account' })
    @ApiOperation({ summary: 'delete' })
    async hardDeleteAccount(@GetAccount() account: Account): Promise<any> {
        await this.accountService.delete(account.id);
        return {"message": "success"}
    }

    @Patch('/me')
    @ApiBearerAuth('JWT')
    @UseGuards(AuthGuard())
    @ApiResponse({ status: 200, description: 'Account info about myself', type: AccountDto })
    @ApiOperation({ summary: 'me' })
    async updateAccount(@GetAccount() account: Account, @Body() AccountInUpdate: AccountInUpdate): Promise<AccountDto> {
        const updatedAccount = await this.accountService.update(account.id, AccountInUpdate);
        return new AccountDto(updatedAccount);
    }
    
    @ApiOperation({ summary: 'kakao login' })
    @Get('/kakao/login')
    kakaoLogin(@Query('code') code: string, @Query('redirectUrl') redirectUrl: string) {
        return this.accountService.kakaoLogin(code, redirectUrl);
    }
    
    @ApiOperation({ summary: 'kakao callback' })
    @Get('/kakao/callback')
    kakaocallback(@Query('code') code: string) {
        return this.accountService.kakaoLogin(code);
    }


}
