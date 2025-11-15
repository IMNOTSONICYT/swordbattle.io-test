import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Clan } from './clan.entity';
import { ClanMember, ClanRole } from './clanMember.entity';
import { ClanInvitation, InvitationStatus } from './clanInvitation.entity';
import { Account } from 'src/accounts/account.entity';
import { validateClantag } from 'src/helpers/validateClantag';

@Injectable()
export class ClansService {
  constructor(
    @InjectRepository(Clan)
    private clanRepository: Repository<Clan>,
    @InjectRepository(ClanMember)
    private clanMemberRepository: Repository<ClanMember>,
    @InjectRepository(ClanInvitation)
    private clanInvitationRepository: Repository<ClanInvitation>,
    @InjectRepository(Account)
    private accountRepository: Repository<Account>,
  ) {}

  async createClan(account: Account, tag: string, name: string, description?: string): Promise<Clan> {
    // Check if user is already in a clan
    const existingMembership = await this.clanMemberRepository.findOne({
      where: { accountId: account.id }
    });

    if (existingMembership) {
      throw new BadRequestException('You are already in a clan. Please leave your current clan first.');
    }

    // Validate clan tag
    const validation = validateClantag(tag);
    if (!validation.valid) {
      throw new BadRequestException(validation.error);
    }

    const upperTag = tag.toUpperCase();

    // Check if clan tag already exists
    const existingClan = await this.clanRepository.findOne({
      where: { tag: upperTag }
    });

    if (existingClan) {
      throw new BadRequestException('A clan with this tag already exists.');
    }

    // Create the clan
    const clan = this.clanRepository.create({
      tag: upperTag,
      name: name.trim(),
      description: description?.trim() || '',
      ownerId: account.id,
      max_members: 50, // Default max members
      is_open: false
    });

    const savedClan = await this.clanRepository.save(clan);

    // Add the creator as owner
    const member = this.clanMemberRepository.create({
      clanId: savedClan.id,
      accountId: account.id,
      role: ClanRole.OWNER
    });

    await this.clanMemberRepository.save(member);

    // Update account's clan field for backward compatibility
    await this.accountRepository.update(account.id, { clan: upperTag });

    return savedClan;
  }

  async invitePlayer(inviterId: number, inviteeUsername: string, clanId: number): Promise<ClanInvitation> {
    // Check if inviter is in the clan and has permission
    const inviterMembership = await this.clanMemberRepository.findOne({
      where: { accountId: inviterId, clanId: clanId },
      relations: ['clan']
    });

    if (!inviterMembership) {
      throw new ForbiddenException('You are not a member of this clan.');
    }

    if (inviterMembership.role === ClanRole.MEMBER) {
      throw new ForbiddenException('Only clan admins and owners can invite players.');
    }

    // Find the invitee
    const invitee = await this.accountRepository.findOne({
      where: { username: inviteeUsername }
    });

    if (!invitee) {
      throw new NotFoundException('Player not found.');
    }

    // Check if invitee is already in a clan
    const inviteeMembership = await this.clanMemberRepository.findOne({
      where: { accountId: invitee.id }
    });

    if (inviteeMembership) {
      throw new BadRequestException('This player is already in a clan.');
    }

    // Check if there's already a pending invitation
    const existingInvitation = await this.clanInvitationRepository.findOne({
      where: {
        clanId: clanId,
        inviteeId: invitee.id,
        status: InvitationStatus.PENDING
      }
    });

    if (existingInvitation) {
      throw new BadRequestException('This player already has a pending invitation to this clan.');
    }

    // Create the invitation
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // Expires in 7 days

    const invitation = this.clanInvitationRepository.create({
      clanId: clanId,
      inviterId: inviterId,
      inviteeId: invitee.id,
      status: InvitationStatus.PENDING,
      expires_at: expiresAt
    });

    return await this.clanInvitationRepository.save(invitation);
  }

  async getPendingInvitations(accountId: number): Promise<ClanInvitation[]> {
    const invitations = await this.clanInvitationRepository.find({
      where: {
        inviteeId: accountId,
        status: InvitationStatus.PENDING
      },
      relations: ['clan', 'inviter'],
      order: { created_at: 'DESC' }
    });

    // Filter out expired invitations and mark them as expired
    const now = new Date();
    const validInvitations = [];

    for (const invitation of invitations) {
      if (invitation.expires_at && invitation.expires_at < now) {
        invitation.status = InvitationStatus.EXPIRED;
        await this.clanInvitationRepository.save(invitation);
      } else {
        validInvitations.push(invitation);
      }
    }

    return validInvitations;
  }

  async acceptInvitation(accountId: number, invitationId: number): Promise<ClanMember> {
    const invitation = await this.clanInvitationRepository.findOne({
      where: { id: invitationId, inviteeId: accountId, status: InvitationStatus.PENDING },
      relations: ['clan']
    });

    if (!invitation) {
      throw new NotFoundException('Invitation not found or already processed.');
    }

    // Check if invitation has expired
    if (invitation.expires_at && invitation.expires_at < new Date()) {
      invitation.status = InvitationStatus.EXPIRED;
      await this.clanInvitationRepository.save(invitation);
      throw new BadRequestException('This invitation has expired.');
    }

    // Check if user is already in a clan
    const existingMembership = await this.clanMemberRepository.findOne({
      where: { accountId: accountId }
    });

    if (existingMembership) {
      throw new BadRequestException('You are already in a clan. Please leave your current clan first.');
    }

    // Check clan member limit
    const memberCount = await this.clanMemberRepository.count({
      where: { clanId: invitation.clanId }
    });

    if (invitation.clan.max_members > 0 && memberCount >= invitation.clan.max_members) {
      throw new BadRequestException('This clan has reached its maximum member limit.');
    }

    // Create clan membership
    const member = this.clanMemberRepository.create({
      clanId: invitation.clanId,
      accountId: accountId,
      role: ClanRole.MEMBER
    });

    const savedMember = await this.clanMemberRepository.save(member);

    // Update invitation status
    invitation.status = InvitationStatus.ACCEPTED;
    await this.clanInvitationRepository.save(invitation);

    // Update account's clan field for backward compatibility
    await this.accountRepository.update(accountId, { clan: invitation.clan.tag });

    return savedMember;
  }

  async declineInvitation(accountId: number, invitationId: number): Promise<void> {
    const invitation = await this.clanInvitationRepository.findOne({
      where: { id: invitationId, inviteeId: accountId, status: InvitationStatus.PENDING }
    });

    if (!invitation) {
      throw new NotFoundException('Invitation not found or already processed.');
    }

    invitation.status = InvitationStatus.DECLINED;
    await this.clanInvitationRepository.save(invitation);
  }

  async leaveClan(accountId: number): Promise<void> {
    const membership = await this.clanMemberRepository.findOne({
      where: { accountId: accountId },
      relations: ['clan']
    });

    if (!membership) {
      throw new BadRequestException('You are not in a clan.');
    }

    if (membership.role === ClanRole.OWNER) {
      // Check if there are other members
      const memberCount = await this.clanMemberRepository.count({
        where: { clanId: membership.clanId }
      });

      if (memberCount > 1) {
        throw new BadRequestException('You must transfer ownership or remove all members before leaving as the owner.');
      }

      // Delete the clan if owner is the only member
      await this.clanRepository.delete(membership.clanId);
    }

    await this.clanMemberRepository.delete(membership.id);

    // Update account's clan field for backward compatibility
    await this.accountRepository.update(accountId, { clan: '7Z9XQ' });
  }

  async kickMember(kickerId: number, clanId: number, memberId: number): Promise<void> {
    // Check if kicker has permission
    const kickerMembership = await this.clanMemberRepository.findOne({
      where: { accountId: kickerId, clanId: clanId }
    });

    if (!kickerMembership) {
      throw new ForbiddenException('You are not a member of this clan.');
    }

    if (kickerMembership.role === ClanRole.MEMBER) {
      throw new ForbiddenException('Only clan admins and owners can kick members.');
    }

    // Get the member to kick
    const memberToKick = await this.clanMemberRepository.findOne({
      where: { id: memberId, clanId: clanId },
      relations: ['account']
    });

    if (!memberToKick) {
      throw new NotFoundException('Member not found.');
    }

    // Can't kick yourself
    if (memberToKick.accountId === kickerId) {
      throw new BadRequestException('You cannot kick yourself. Use the leave clan option instead.');
    }

    // Can't kick the owner
    if (memberToKick.role === ClanRole.OWNER) {
      throw new ForbiddenException('You cannot kick the clan owner.');
    }

    // Admins can't kick other admins
    if (kickerMembership.role === ClanRole.ADMIN && memberToKick.role === ClanRole.ADMIN) {
      throw new ForbiddenException('Admins cannot kick other admins.');
    }

    await this.clanMemberRepository.delete(memberId);

    // Update account's clan field for backward compatibility
    await this.accountRepository.update(memberToKick.accountId, { clan: '7Z9XQ' });
  }

  async getClanInfo(clanId: number): Promise<any> {
    const clan = await this.clanRepository.findOne({
      where: { id: clanId },
      relations: ['owner']
    });

    if (!clan) {
      throw new NotFoundException('Clan not found.');
    }

    const members = await this.clanMemberRepository.find({
      where: { clanId: clanId },
      relations: ['account'],
      order: { role: 'ASC', joined_at: 'ASC' }
    });

    const totalXp = members.reduce((sum, member) => sum + (member.account?.xp || 0), 0);

    return {
      id: clan.id,
      tag: clan.tag,
      name: clan.name,
      description: clan.description,
      owner: {
        id: clan.owner.id,
        username: clan.owner.username
      },
      created_at: clan.created_at,
      member_count: members.length,
      max_members: clan.max_members,
      total_xp: totalXp,
      is_open: clan.is_open,
      members: members.map(m => ({
        id: m.id,
        account: {
          id: m.account.id,
          username: m.account.username,
          xp: m.account.xp
        },
        role: m.role,
        joined_at: m.joined_at
      }))
    };
  }

  async getClanByTag(tag: string): Promise<any> {
    const clan = await this.clanRepository.findOne({
      where: { tag: tag.toUpperCase() }
    });

    if (!clan) {
      throw new NotFoundException('Clan not found.');
    }

    return this.getClanInfo(clan.id);
  }

  async getMyClan(accountId: number): Promise<any> {
    const membership = await this.clanMemberRepository.findOne({
      where: { accountId: accountId },
      relations: ['clan']
    });

    if (!membership) {
      return null;
    }

    const clanInfo = await this.getClanInfo(membership.clanId);
    return {
      ...clanInfo,
      my_role: membership.role
    };
  }

  async updateClan(accountId: number, clanId: number, updateData: { name?: string; description?: string; max_members?: number; is_open?: boolean }): Promise<Clan> {
    // Check if user is the owner
    const membership = await this.clanMemberRepository.findOne({
      where: { accountId: accountId, clanId: clanId }
    });

    if (!membership || membership.role !== ClanRole.OWNER) {
      throw new ForbiddenException('Only the clan owner can update clan settings.');
    }

    const clan = await this.clanRepository.findOne({
      where: { id: clanId }
    });

    if (!clan) {
      throw new NotFoundException('Clan not found.');
    }

    if (updateData.name !== undefined) {
      clan.name = updateData.name.trim();
    }

    if (updateData.description !== undefined) {
      clan.description = updateData.description.trim();
    }

    if (updateData.max_members !== undefined) {
      clan.max_members = updateData.max_members;
    }

    if (updateData.is_open !== undefined) {
      clan.is_open = updateData.is_open;
    }

    return await this.clanRepository.save(clan);
  }

  async promoteMember(promoterId: number, clanId: number, memberId: number, newRole: ClanRole): Promise<void> {
    // Check if promoter is the owner
    const promoterMembership = await this.clanMemberRepository.findOne({
      where: { accountId: promoterId, clanId: clanId }
    });

    if (!promoterMembership || promoterMembership.role !== ClanRole.OWNER) {
      throw new ForbiddenException('Only the clan owner can promote/demote members.');
    }

    const memberToPromote = await this.clanMemberRepository.findOne({
      where: { id: memberId, clanId: clanId }
    });

    if (!memberToPromote) {
      throw new NotFoundException('Member not found.');
    }

    if (memberToPromote.role === ClanRole.OWNER) {
      throw new BadRequestException('Cannot change the owner role.');
    }

    if (newRole === ClanRole.OWNER) {
      throw new BadRequestException('Use transfer ownership to make someone else the owner.');
    }

    memberToPromote.role = newRole;
    await this.clanMemberRepository.save(memberToPromote);
  }

  async transferOwnership(currentOwnerId: number, clanId: number, newOwnerId: number): Promise<void> {
    // Verify current owner
    const currentOwnerMembership = await this.clanMemberRepository.findOne({
      where: { accountId: currentOwnerId, clanId: clanId }
    });

    if (!currentOwnerMembership || currentOwnerMembership.role !== ClanRole.OWNER) {
      throw new ForbiddenException('Only the clan owner can transfer ownership.');
    }

    // Get new owner
    const newOwnerMembership = await this.clanMemberRepository.findOne({
      where: { accountId: newOwnerId, clanId: clanId }
    });

    if (!newOwnerMembership) {
      throw new NotFoundException('New owner must be a member of the clan.');
    }

    // Update roles
    currentOwnerMembership.role = ClanRole.ADMIN;
    newOwnerMembership.role = ClanRole.OWNER;

    await this.clanMemberRepository.save([currentOwnerMembership, newOwnerMembership]);

    // Update clan owner
    await this.clanRepository.update(clanId, { ownerId: newOwnerId });
  }
}
