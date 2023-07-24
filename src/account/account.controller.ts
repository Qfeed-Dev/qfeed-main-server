import { Body, Controller, Delete, Get, Post, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { AccountDto, AccountInSignUp, TokenDto } from './account.dto';
import { AccountService } from './account.service';
import { AuthGuard } from '@nestjs/passport';
import { GetAccount } from './get-user.decorator';
import { Account } from './account.entity';


@Controller('account')
@ApiTags('Account')
export class AccountController {
    constructor(private readonly accountService: AccountService) {}

    @Post('/sign-up')
    @ApiBody({ type: AccountInSignUp })
    @ApiResponse({ status: 201, description: 'Account has been successfully created', type: AccountDto })
    @ApiOperation({ summary: 'Create' })
    async createAccount(@Body() AccountInSignUp: AccountInSignUp): Promise<TokenDto> {
        const token = await this.accountService.create(AccountInSignUp);
        return token;
    }

    @Post('/sign-in')
    @ApiBody({ type: AccountInSignUp })
    @ApiResponse({ status: 200, description: 'Account has been successfully logged in', type: TokenDto })
    @ApiOperation({ summary: 'Login' })
    async loginAccount(@Body() AccountInSignUp: AccountInSignUp): Promise<TokenDto> {
        return await this.accountService.login(AccountInSignUp);
    }
    
    @Get('/me')
    @ApiBearerAuth('JWT')
    @UseGuards(AuthGuard())
    @ApiResponse({ status: 200, description: 'Account info about myself', type: AccountDto })
    @ApiOperation({ summary: 'me' })
    getAccount(@GetAccount() account: Account): AccountDto {
        return new AccountDto(account.id, account.email);
    }

    @Delete('/hard-delete')
    @ApiBearerAuth('JWT')
    @UseGuards(AuthGuard())
    @ApiResponse({ status: 200, description: 'Hard Delete Account' })
    @ApiOperation({ summary: 'delete' })
    async hardDeleteAccount(@GetAccount() account: Account): Promise<any> {
        await this.accountService.delete(account.id);
        return {"message": "success"}
    }

}
