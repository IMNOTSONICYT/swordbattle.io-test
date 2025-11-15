import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Account } from 'src/accounts/account.entity';
import { Clan } from './clan.entity';

export enum InvitationStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  DECLINED = 'declined',
  EXPIRED = 'expired'
}

@Entity({ name: 'clan_invitations' })
export class ClanInvitation {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Clan, clan => clan.invitations, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'clan_id' })
  clan: Clan;

  @Column({ name: 'clan_id' })
  clanId: number;

  @ManyToOne(() => Account, { eager: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'inviter_id' })
  inviter: Account;

  @Column({ name: 'inviter_id' })
  inviterId: number;

  @ManyToOne(() => Account, { eager: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'invitee_id' })
  invitee: Account;

  @Column({ name: 'invitee_id' })
  inviteeId: number;

  @Column({
    type: 'enum',
    enum: InvitationStatus,
    default: InvitationStatus.PENDING
  })
  status: InvitationStatus;

  @CreateDateColumn()
  created_at: Date;

  @Column({ nullable: true })
  expires_at: Date;

  constructor(data: Partial<ClanInvitation> = {}) {
    Object.assign(this, data);
  }
}
