import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, Unique } from 'typeorm';
import { Account } from 'src/accounts/account.entity';
import { Clan } from './clan.entity';

export enum ClanRole {
  OWNER = 'owner',
  ADMIN = 'admin',
  MEMBER = 'member'
}

@Entity({ name: 'clan_members' })
@Unique(['clan', 'account'])
export class ClanMember {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Clan, clan => clan.members, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'clan_id' })
  clan: Clan;

  @Column({ name: 'clan_id' })
  clanId: number;

  @ManyToOne(() => Account, { eager: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'account_id' })
  account: Account;

  @Column({ name: 'account_id' })
  accountId: number;

  @Column({
    type: 'enum',
    enum: ClanRole,
    default: ClanRole.MEMBER
  })
  role: ClanRole;

  @CreateDateColumn()
  joined_at: Date;

  constructor(data: Partial<ClanMember> = {}) {
    Object.assign(this, data);
  }
}
