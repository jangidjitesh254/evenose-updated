import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Bell } from 'lucide-react';
import { authAPI } from '../services/api';
import Badge from './ui/Badge';

export default function InvitationsNotification() {
  const [pendingCount, setPendingCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPendingInvitations();
  }, []);

  const fetchPendingInvitations = async () => {
    try {
      const response = await authAPI.getMe();
      const pending = response.data.user.coordinatorFor?.filter(
        (coord) => coord.status === 'pending'
      ) || [];
      setPendingCount(pending.length);
    } catch (error) {
      console.error('Failed to fetch invitations:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || pendingCount === 0) return null;

  return (
    <Link
      to="/invitations"
      className="relative flex items-center gap-2 px-4 py-2 bg-yellow-50 hover:bg-yellow-100 text-yellow-900 rounded-xl border-2 border-yellow-200 transition-all hover:scale-105"
    >
      <Mail className="w-5 h-5" />
      <span className="font-medium">My Invitations</span>
      <Badge variant="warning" className="ml-1">
        {pendingCount}
      </Badge>
      <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-500 rounded-full animate-pulse" />
    </Link>
  );
}