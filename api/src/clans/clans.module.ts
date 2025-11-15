import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClansController } from './clans.controller';
import { ClansService } from './clans.service';
import { Clan } from './clan.entity';
import { ClanMember } from './clanMember.entity';
import { ClanInvitation } from './clanInvitation.entity';
import { Account } from 'src/accounts/account.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Clan, ClanMember, ClanInvitation, Account])
  ],
  controllers: [ClansController],
  providers: [ClansService],
  exports: [ClansService]
})
export class ClansModule {}
