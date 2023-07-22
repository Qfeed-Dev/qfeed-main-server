import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AccountController } from './account.controller';
import { AccountService } from './account.service';
import { TypeOrmExModule } from 'src/db/typeorm-ex.module';
import { AccountRepository } from './account.repository';
import { JwtStrategy } from './jwt.strategy';

@Module({
  exports: [AccountService, JwtStrategy, PassportModule],
  imports: [
    TypeOrmExModule.forCustomRepository([AccountRepository]),
    PassportModule.register({ defaultStrategy: 'jwt'}),
    JwtModule.register({
      secret: "SECRET_KEY",
      signOptions:{
        expiresIn: 60 * 60 * 24
      }
    }),
  ],
  controllers: [AccountController],
  providers: [AccountService, JwtStrategy]
})
export class AccountModule {}
