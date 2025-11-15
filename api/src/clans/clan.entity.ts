import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { Account } from 'src/accounts/account.entity';
import { ClanMember } from './clanMember.entity';
import { ClanInvitation } from './clanInvitation.entity';

@Entity({ name: 'clans' })
export class Clan {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true, length: 4 })
  tag: string;

  @Column({ length: 50 })
  name: string;

  @Column({ type: 'text', default: '' })
  description: string;

  @ManyToOne(() => Account, { eager: true })
  @JoinColumn({ name: 'owner_id' })
  owner: Account;

  @Column({ name: 'owner_id' })
  ownerId: number;

  @CreateDateColumn()
  created_at: Date;

  @OneToMany(() => ClanMember, member => member.clan)
  members: ClanMember[];

  @OneToMany(() => ClanInvitation, invitation => invitation.clan)
  invitations: ClanInvitation[];

  @Column({ default: 0 })
  max_members: number;

  @Column({ default: false })
  is_open: boolean; // If true, anyone can join without invitation

  constructor(data: Partial<Clan> = {}) {
    Object.assign(this, data);
  }
}
