import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AccountController } from './account.controller';
import { AccountService } from './account.service';
import { TypeOrmExModule } from 'src/db/typeorm-ex.module';
import { AccountRepository, BlockRepository, FollowRepository } from './account.repository';
import { JwtStrategy } from './jwt.strategy';
import { HttpModule } from '@nestjs/axios';

@Module({
  exports: [AccountService, JwtStrategy, PassportModule],
  imports: [
    TypeOrmExModule.forCustomRepository([AccountRepository, FollowRepository, BlockRepository]),
    PassportModule.register({ defaultStrategy: 'jwt'}),
    JwtModule.register({
      secret: process.env.SECRET_KEY,
      signOptions:{
        expiresIn: 60 * 60 * 24 * 30,
      }
    }),
    HttpModule.registerAsync({
      useFactory: () => ({
        timeout: 5000,
        maxRedirects: 5,
      })
    })
  ],
  controllers: [AccountController],
  providers: [AccountService, JwtStrategy]
})
export class AccountModule {}
