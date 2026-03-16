import React, { useState, useEffect } from 'react';
import { User, UserRole } from '../lib/types';
import { getAllUsers, updateUserRole, deleteUser } from '../services/dataService';
import { Shield, Search, ArrowLeft, Check, AlertCircle, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Mono: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = "" }) => (
  <span className={`font-mono text-xs tracking-widest uppercase ${className}`}>
    {children}
  </span>
);

const BlockTable: React.FC<{ title: string; children: React.ReactNode; icon?: React.ReactNode }> = ({ title, children, icon }) => (
  <div className="border-2 border-brand-charcoal bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,0.1)]">
    <div className="p-4 border-b-2 border-brand-charcoal bg-brand-bone flex justify-between items-center">
      <div className="flex items-center gap-2">
        {icon}
        <h3 className="font-black uppercase tracking-wide text-sm">{title}</h3>
      </div>
    </div>
    <div>{children}</div>
  </div>
);

const UserManagementPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const data = await getAllUsers();
      setUsers(data);
    } catch (err) {
      setError('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleRoleUpdate = async (userId: string, newRole: UserRole) => {
    let gymName: string | undefined = undefined;

    if (newRole === 'gymowner') {
      const input = window.prompt('Enter Gym Name for this owner:');
      if (input === null) return; // Cancelled
      gymName = input;
    }

    setUpdatingId(userId);
    setError(null);
    try {
      await updateUserRole(userId, newRole, gymName);
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole, ownedGymName: gymName || u.ownedGymName } : u));
    } catch (err) {
      setError('Failed to update user role');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDelete = async (userId: string, userName: string) => {
    if (!window.confirm(`ARE YOU SURE? This will permanently remove ${userName} from the public registry. This action cannot be reversed.`)) {
      return;
    }

    setUpdatingId(userId);
    setError(null);
    try {
      await deleteUser(userId);
      setUsers(prev => prev.filter(u => u.id !== userId));
    } catch (err) {
      console.error(err);
      setError('Deletion failed. The user might have active bookings or dependencies.');
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-10 font-mono text-xs uppercase text-gray-400">
        Syncing Database...
      </div>
    );
  }

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-10 py-12 animate-reveal">
      {/* Header */}
      <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <button
            onClick={() => navigate('/admin')}
            className="flex items-center gap-2 text-brand-blue font-mono text-xs font-bold uppercase hover:text-brand-red transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </button>
          <Mono className="text-brand-blue">Security • Authority • Identity</Mono>
          <h1 className="text-5xl font-black uppercase text-brand-charcoal mt-2">User Registry</h1>
        </div>

        <div className="relative max-w-sm w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by Name or Email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white border-2 border-brand-charcoal p-4 pl-12 font-mono text-sm uppercase focus:bg-brand-bone transition-colors outline-none"
          />
        </div>
      </div>

      {error && (
        <div className="mb-8 p-4 bg-brand-red text-white font-mono text-xs font-bold uppercase flex items-center gap-3">
          <AlertCircle className="w-5 h-5" /> {error}
        </div>
      )}

      {/* Main Table */}
      <BlockTable title={`All Registered Fighters (${filteredUsers.length})`} icon={<Shield className="w-5 h-5" />}>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead className="bg-brand-bone font-mono text-xs font-bold text-brand-blue uppercase sticky top-0 z-10 border-b-2 border-brand-charcoal">
              <tr>
                <th className="p-6">Identity</th>
                <th className="p-6">Unique ID</th>
                <th className="p-6">Access Level</th>
                <th className="p-6">Affiliate Status</th>
                <th className="p-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="font-mono text-xs">
              {filteredUsers.length > 0 ? filteredUsers.map(user => (
                <tr key={user.id} className="border-b border-gray-100 hover:bg-brand-bone/50 transition-colors">
                  <td className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full border-2 border-brand-charcoal overflow-hidden shrink-0 shadow-sm bg-gray-100">
                        {user.avatar ? (
                          <img src={user.avatar} className="w-full h-full object-cover" alt={user.name} />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center font-black text-brand-charcoal bg-gray-200">
                            {user.name.charAt(0)}
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="font-black text-sm uppercase text-brand-charcoal truncate">{user.name}</div>
                        <div className="text-gray-400 truncate text-[10px] lowercase">{user.email}</div>
                        {user.role === 'gymowner' && user.ownedGymName && (
                          <div className="text-brand-blue font-bold text-[9px] uppercase mt-1">Gym: {user.ownedGymName}</div>
                        )}
                      </div>
                    </div>
                  </td>

                  <td className="p-6">
                    <span className="bg-gray-100 px-3 py-1 border border-gray-200 text-gray-500 font-mono text-[10px] uppercase">
                      {user.id.slice(0, 16)}...
                    </span>
                  </td>

                  <td className="p-6">
                    <div className="flex items-center gap-3">
                      <select
                        value={user.role}
                        onChange={(e) => handleRoleUpdate(user.id, e.target.value as UserRole)}
                        disabled={updatingId === user.id}
                        className={`bg-white border-2 p-3 pr-8 font-mono text-xs uppercase font-black focus:border-brand-blue outline-none transition-all cursor-pointer appearance-none relative ${user.role === 'admin' ? 'border-brand-red text-brand-red' :
                            user.role === 'gymowner' ? 'border-brand-blue text-brand-blue' :
                              'border-brand-charcoal text-brand-charcoal'
                          }`}
                        style={{
                          backgroundImage: 'url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%231A1A1A%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E")',
                          backgroundRepeat: 'no-repeat',
                          backgroundPosition: 'right 0.7rem top 50%',
                          backgroundSize: '0.65rem auto'
                        }}
                      >
                        <option value="customer">Customer</option>
                        <option value="gymowner">Owner</option>
                        <option value="admin">Admin</option>
                      </select>
                      {updatingId === user.id && (
                        <div className="w-4 h-4 border-2 border-brand-blue border-t-transparent rounded-full animate-spin"></div>
                      )}
                      {!updatingId && user.role === 'admin' && (
                        <Shield className="w-4 h-4 text-brand-red" />
                      )}
                    </div>
                  </td>

                  <td className="p-6 text-right">
                    <div className="flex flex-col items-end gap-1">
                      <span className={`px-3 py-1 border-2 text-[10px] font-black uppercase tracking-widest ${user.affiliateStatus === 'active' ? 'border-green-500 text-green-600 bg-green-50' :
                          user.affiliateStatus === 'pending' ? 'border-brand-blue text-brand-blue bg-blue-50 animate-pulse' :
                            user.affiliateStatus === 'rejected' ? 'border-brand-red text-brand-red bg-red-50' :
                              'border-gray-200 text-gray-400'
                        }`}>
                        {user.affiliateStatus}
                      </span>
                      {user.affiliateCode && (
                        <div className="text-[9px] font-mono text-gray-400 mt-1 uppercase">CODE: {user.affiliateCode}</div>
                      )}
                    </div>
                  </td>

                  <td className="p-6 text-right">
                    <button
                      onClick={() => handleDelete(user.id, user.name)}
                      disabled={updatingId === user.id}
                      className="text-gray-400 hover:text-brand-red transition-colors p-2 disabled:opacity-30"
                      title="Delete User Record"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={4} className="p-12 text-center text-gray-400 uppercase font-mono italic">
                    No registry entries found matching search...
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </BlockTable>

      <div className="mt-12 bg-brand-charcoal p-8 border-l-8 border-brand-red">
        <h4 className="text-white font-black uppercase mb-4 flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-brand-red" /> Security Protocol
        </h4>
        <p className="text-brand-bone font-mono text-xs opacity-70 leading-relaxed max-w-2xl">
          Role modifications take effect immediately across all sessions. Elevating a user to "Admin" grants full system override capabilities, including transaction authorization and registry management. Ensure identity verification before granting "Owner" or "Admin" access levels.
        </p>
      </div>
    </div>
  );
};

export default UserManagementPage;
