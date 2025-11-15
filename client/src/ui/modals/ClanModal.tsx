import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUsers, faSignOut, faCrown, faShield, faUserPlus, faEdit, faTrash, faArrowUp, faArrowDown } from '@fortawesome/free-solid-svg-icons';
import api from '../../api';
import './ClanModal.scss';

interface ClanMember {
  id: number;
  account: {
    id: number;
    username: string;
    xp: number;
  };
  role: string;
  joined_at: string;
}

interface ClanInfo {
  id: number;
  tag: string;
  name: string;
  description: string;
  owner: {
    id: number;
    username: string;
  };
  created_at: string;
  member_count: number;
  max_members: number;
  total_xp: number;
  is_open: boolean;
  members: ClanMember[];
  my_role?: string;
}

interface ClanModalProps {
  account: any;
  onClose?: () => void;
}

export default function ClanModal({ account, onClose }: ClanModalProps) {
  const [view, setView] = useState<'main' | 'create' | 'invitations'>('main');
  const [clanInfo, setClanInfo] = useState<ClanInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Create clan form
  const [clanTag, setClanTag] = useState('');
  const [clanName, setClanName] = useState('');
  const [clanDescription, setClanDescription] = useState('');

  // Invite form
  const [inviteUsername, setInviteUsername] = useState('');

  useEffect(() => {
    loadClanInfo();
  }, []);

  const loadClanInfo = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get('/clans/my/clan');
      if (response.data && response.data.id) {
        setClanInfo(response.data);
      } else {
        setClanInfo(null);
      }
    } catch (err: any) {
      console.error('Error loading clan info:', err);
      setClanInfo(null);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateClan = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const response = await api.post('/clans/create', {
        tag: clanTag,
        name: clanName,
        description: clanDescription
      });

      if (response.data.success) {
        alert('Clan created successfully!');
        setView('main');
        await loadClanInfo();
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create clan');
    }
  };

  const handleInvitePlayer = async () => {
    if (!inviteUsername.trim() || !clanInfo) return;

    setError('');
    try {
      const response = await api.post(`/clans/${clanInfo.id}/invite`, {
        username: inviteUsername
      });

      if (response.data.success) {
        alert(`Invitation sent to ${inviteUsername}!`);
        setInviteUsername('');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to send invitation');
    }
  };

  const handleLeaveClan = async () => {
    if (!window.confirm('Are you sure you want to leave the clan?')) return;

    try {
      const response = await api.post('/clans/leave');
      if (response.data.success) {
        alert('You have left the clan.');
        await loadClanInfo();
        window.location.reload();
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to leave clan');
    }
  };

  const handleKickMember = async (memberId: number, username: string) => {
    if (!window.confirm(`Are you sure you want to kick ${username}?`)) return;
    if (!clanInfo) return;

    try {
      const response = await api.delete(`/clans/${clanInfo.id}/members/${memberId}`);
      if (response.data.success) {
        alert(`${username} has been kicked from the clan.`);
        await loadClanInfo();
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to kick member');
    }
  };

  const handlePromoteMember = async (memberId: number, username: string, newRole: string) => {
    if (!window.confirm(`Are you sure you want to ${newRole === 'admin' ? 'promote' : 'demote'} ${username}?`)) return;
    if (!clanInfo) return;

    try {
      const response = await api.post(`/clans/${clanInfo.id}/members/${memberId}/promote`, {
        role: newRole
      });
      if (response.data.success) {
        alert(`${username} has been ${newRole === 'admin' ? 'promoted' : 'demoted'}.`);
        await loadClanInfo();
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to change member role');
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner': return <FontAwesomeIcon icon={faCrown} className="role-icon owner" />;
      case 'admin': return <FontAwesomeIcon icon={faShield} className="role-icon admin" />;
      default: return <FontAwesomeIcon icon={faUsers} className="role-icon member" />;
    }
  };

  const canManageMembers = clanInfo?.my_role === 'owner' || clanInfo?.my_role === 'admin';
  const isOwner = clanInfo?.my_role === 'owner';

  if (loading) {
    return (
      <div className="clan-modal">
        <h2>Loading...</h2>
      </div>
    );
  }

  if (view === 'create') {
    return (
      <div className="clan-modal">
        <h2>Create a Clan</h2>
        <form onSubmit={handleCreateClan} className="create-clan-form">
          <div className="form-group">
            <label>Clan Tag (1-4 characters):</label>
            <input
              type="text"
              value={clanTag}
              onChange={(e) => setClanTag(e.target.value)}
              maxLength={4}
              required
              placeholder="TAG"
            />
          </div>
          <div className="form-group">
            <label>Clan Name:</label>
            <input
              type="text"
              value={clanName}
              onChange={(e) => setClanName(e.target.value)}
              maxLength={50}
              required
              placeholder="My Awesome Clan"
            />
          </div>
          <div className="form-group">
            <label>Description (optional):</label>
            <textarea
              value={clanDescription}
              onChange={(e) => setClanDescription(e.target.value)}
              maxLength={200}
              placeholder="Tell others about your clan..."
            />
          </div>
          {error && <div className="error-message">{error}</div>}
          <div className="button-group">
            <button type="submit" className="btn btn-primary">Create Clan</button>
            <button type="button" className="btn btn-secondary" onClick={() => setView('main')}>Cancel</button>
          </div>
        </form>
      </div>
    );
  }

  if (view === 'invitations') {
    return <InvitationsView onBack={() => setView('main')} />;
  }

  // Main view
  if (!clanInfo) {
    return (
      <div className="clan-modal">
        <h2>Clan System</h2>
        <p className="no-clan-message">You are not currently in a clan.</p>
        <div className="button-group">
          <button className="btn btn-primary" onClick={() => setView('create')}>
            <FontAwesomeIcon icon={faUsers} /> Create a Clan
          </button>
          <button className="btn btn-secondary" onClick={() => setView('invitations')}>
            View Invitations
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="clan-modal">
      <div className="clan-header">
        <h2>
          <span className="clan-tag">[{clanInfo.tag}]</span> {clanInfo.name}
        </h2>
        {getRoleIcon(clanInfo.my_role || 'member')}
      </div>

      {clanInfo.description && (
        <p className="clan-description">{clanInfo.description}</p>
      )}

      <div className="clan-stats">
        <div className="stat">
          <strong>Members:</strong> {clanInfo.member_count}/{clanInfo.max_members || '∞'}
        </div>
        <div className="stat">
          <strong>Total XP:</strong> {clanInfo.total_xp.toLocaleString()}
        </div>
        <div className="stat">
          <strong>Created:</strong> {new Date(clanInfo.created_at).toLocaleDateString()}
        </div>
      </div>

      {canManageMembers && (
        <div className="invite-section">
          <h3><FontAwesomeIcon icon={faUserPlus} /> Invite Player</h3>
          <div className="invite-form">
            <input
              type="text"
              value={inviteUsername}
              onChange={(e) => setInviteUsername(e.target.value)}
              placeholder="Enter username..."
            />
            <button className="btn btn-primary" onClick={handleInvitePlayer}>
              Invite
            </button>
          </div>
        </div>
      )}

      <div className="members-section">
        <h3><FontAwesomeIcon icon={faUsers} /> Members ({clanInfo.members.length})</h3>
        <div className="members-list">
          {clanInfo.members.map((member) => (
            <div key={member.id} className="member-item">
              <div className="member-info">
                {getRoleIcon(member.role)}
                <span className="member-name">{member.account.username}</span>
                <span className="member-xp">{member.account.xp.toLocaleString()} XP</span>
              </div>
              {canManageMembers && member.account.id !== account.id && member.role !== 'owner' && (
                <div className="member-actions">
                  {isOwner && member.role === 'member' && (
                    <button
                      className="btn btn-small btn-promote"
                      onClick={() => handlePromoteMember(member.id, member.account.username, 'admin')}
                      title="Promote to Admin"
                    >
                      <FontAwesomeIcon icon={faArrowUp} />
                    </button>
                  )}
                  {isOwner && member.role === 'admin' && (
                    <button
                      className="btn btn-small btn-demote"
                      onClick={() => handlePromoteMember(member.id, member.account.username, 'member')}
                      title="Demote to Member"
                    >
                      <FontAwesomeIcon icon={faArrowDown} />
                    </button>
                  )}
                  <button
                    className="btn btn-small btn-danger"
                    onClick={() => handleKickMember(member.id, member.account.username)}
                    title="Kick Member"
                  >
                    <FontAwesomeIcon icon={faTrash} />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="button-group">
        <button className="btn btn-secondary" onClick={() => setView('invitations')}>
          View Invitations
        </button>
        <button className="btn btn-danger" onClick={handleLeaveClan}>
          <FontAwesomeIcon icon={faSignOut} /> Leave Clan
        </button>
      </div>
    </div>
  );
}

// Invitations view component
interface InvitationsViewProps {
  onBack: () => void;
}

function InvitationsView({ onBack }: InvitationsViewProps) {
  const [invitations, setInvitations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadInvitations();
  }, []);

  const loadInvitations = async () => {
    setLoading(true);
    try {
      const response = await api.get('/clans/invitations');
      setInvitations(response.data.invitations || []);
    } catch (err: any) {
      setError('Failed to load invitations');
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (invitationId: number) => {
    try {
      const response = await api.post(`/clans/invitations/${invitationId}/accept`);
      if (response.data.success) {
        alert('You have joined the clan!');
        window.location.reload();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to accept invitation');
    }
  };

  const handleDecline = async (invitationId: number) => {
    try {
      const response = await api.post(`/clans/invitations/${invitationId}/decline`);
      if (response.data.success) {
        await loadInvitations();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to decline invitation');
    }
  };

  if (loading) {
    return (
      <div className="clan-modal">
        <h2>Loading invitations...</h2>
      </div>
    );
  }

  return (
    <div className="clan-modal">
      <h2>Clan Invitations</h2>
      {invitations.length === 0 ? (
        <p className="no-invitations">You have no pending clan invitations.</p>
      ) : (
        <div className="invitations-list">
          {invitations.map((invitation) => (
            <div key={invitation.id} className="invitation-item">
              <div className="invitation-info">
                <div className="invitation-clan">
                  <span className="clan-tag">[{invitation.clan.tag}]</span> {invitation.clan.name}
                </div>
                <div className="invitation-details">
                  Invited by: <strong>{invitation.inviter.username}</strong>
                </div>
                <div className="invitation-date">
                  {new Date(invitation.created_at).toLocaleDateString()}
                </div>
              </div>
              <div className="invitation-actions">
                <button className="btn btn-primary" onClick={() => handleAccept(invitation.id)}>
                  Accept
                </button>
                <button className="btn btn-secondary" onClick={() => handleDecline(invitation.id)}>
                  Decline
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      {error && <div className="error-message">{error}</div>}
      <button className="btn btn-secondary" onClick={onBack}>
        Back
      </button>
    </div>
  );
}
