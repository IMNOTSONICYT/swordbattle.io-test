import { Controller, Post, Get, Put, Delete, Body, Param, UseGuards, Request, HttpCode, HttpStatus } from '@nestjs/common';
import { ClansService } from './clans.service';
import { AccountGuard } from 'src/auth/account.guard';
import { ClanRole } from './clanMember.entity';

@Controller('clans')
export class ClansController {
  constructor(private readonly clansService: ClansService) {}

  @Post('create')
  @UseGuards(AccountGuard)
  async createClan(
    @Request() req,
    @Body() body: { tag: string; name: string; description?: string }
  ) {
    const clan = await this.clansService.createClan(req.account, body.tag, body.name, body.description);
    return {
      success: true,
      clan: {
        id: clan.id,
        tag: clan.tag,
        name: clan.name,
        description: clan.description
      }
    };
  }

  @Post(':clanId/invite')
  @UseGuards(AccountGuard)
  async invitePlayer(
    @Request() req,
    @Param('clanId') clanId: number,
    @Body() body: { username: string }
  ) {
    const invitation = await this.clansService.invitePlayer(req.account.id, body.username, clanId);
    return {
      success: true,
      invitation: {
        id: invitation.id,
        invitee: invitation.invitee.username,
        expires_at: invitation.expires_at
      }
    };
  }

  @Get('invitations')
  @UseGuards(AccountGuard)
  async getMyInvitations(@Request() req) {
    const invitations = await this.clansService.getPendingInvitations(req.account.id);
    return {
      invitations: invitations.map(inv => ({
        id: inv.id,
        clan: {
          id: inv.clan.id,
          tag: inv.clan.tag,
          name: inv.clan.name
        },
        inviter: {
          username: inv.inviter.username
        },
        created_at: inv.created_at,
        expires_at: inv.expires_at
      }))
    };
  }

  @Post('invitations/:invitationId/accept')
  @UseGuards(AccountGuard)
  async acceptInvitation(
    @Request() req,
    @Param('invitationId') invitationId: number
  ) {
    await this.clansService.acceptInvitation(req.account.id, invitationId);
    return { success: true, message: 'Successfully joined the clan!' };
  }

  @Post('invitations/:invitationId/decline')
  @UseGuards(AccountGuard)
  @HttpCode(HttpStatus.OK)
  async declineInvitation(
    @Request() req,
    @Param('invitationId') invitationId: number
  ) {
    await this.clansService.declineInvitation(req.account.id, invitationId);
    return { success: true, message: 'Invitation declined.' };
  }

  @Post('leave')
  @UseGuards(AccountGuard)
  @HttpCode(HttpStatus.OK)
  async leaveClan(@Request() req) {
    await this.clansService.leaveClan(req.account.id);
    return { success: true, message: 'You have left the clan.' };
  }

  @Delete(':clanId/members/:memberId')
  @UseGuards(AccountGuard)
  async kickMember(
    @Request() req,
    @Param('clanId') clanId: number,
    @Param('memberId') memberId: number
  ) {
    await this.clansService.kickMember(req.account.id, clanId, memberId);
    return { success: true, message: 'Member has been kicked from the clan.' };
  }

  @Get(':clanId')
  async getClanInfo(@Param('clanId') clanId: number) {
    const clanInfo = await this.clansService.getClanInfo(clanId);
    return clanInfo;
  }

  @Get('tag/:tag')
  async getClanByTag(@Param('tag') tag: string) {
    const clanInfo = await this.clansService.getClanByTag(tag);
    return clanInfo;
  }

  @Get('my/clan')
  @UseGuards(AccountGuard)
  async getMyClan(@Request() req) {
    const clanInfo = await this.clansService.getMyClan(req.account.id);
    return clanInfo || { message: 'You are not in a clan.' };
  }

  @Put(':clanId')
  @UseGuards(AccountGuard)
  async updateClan(
    @Request() req,
    @Param('clanId') clanId: number,
    @Body() body: { name?: string; description?: string; max_members?: number; is_open?: boolean }
  ) {
    const clan = await this.clansService.updateClan(req.account.id, clanId, body);
    return {
      success: true,
      clan: {
        id: clan.id,
        tag: clan.tag,
        name: clan.name,
        description: clan.description,
        max_members: clan.max_members,
        is_open: clan.is_open
      }
    };
  }

  @Post(':clanId/members/:memberId/promote')
  @UseGuards(AccountGuard)
  @HttpCode(HttpStatus.OK)
  async promoteMember(
    @Request() req,
    @Param('clanId') clanId: number,
    @Param('memberId') memberId: number,
    @Body() body: { role: ClanRole }
  ) {
    await this.clansService.promoteMember(req.account.id, clanId, memberId, body.role);
    return { success: true, message: 'Member role updated.' };
  }

  @Post(':clanId/transfer-ownership')
  @UseGuards(AccountGuard)
  @HttpCode(HttpStatus.OK)
  async transferOwnership(
    @Request() req,
    @Param('clanId') clanId: number,
    @Body() body: { newOwnerId: number }
  ) {
    await this.clansService.transferOwnership(req.account.id, clanId, body.newOwnerId);
    return { success: true, message: 'Ownership transferred successfully.' };
  }
}
