import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Search, Trash2, Shield, Ban, UserCheck, History } from "lucide-react";
import toast from "react-hot-toast";
import { adminApi } from "../../api/adminApi";
import ConfirmDialog from "../components/ConfirmDialog";
import Modal from "../components/Modal";
import EmptyState from "../components/EmptyState";

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [historyUser, setHistoryUser] = useState(null);
  const [enrollments, setEnrollments] = useState([]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data } = await adminApi.getUsers({ search, page, limit: 10 });
      setUsers(data.users);
      setPages(data.pages);
    } catch {
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const t = setTimeout(fetchUsers, 300);
    return () => clearTimeout(t);
  }, [search, page]);

  const handleRoleChange = async (user, role) => {
    try {
      await adminApi.updateUserRole(user._id, role);
      toast.success(`Role updated to ${role}`);
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed");
    }
  };

  const handleBlock = async (user) => {
    try {
      const { data } = await adminApi.toggleBlockUser(user._id);
      toast.success(data.user.isBlocked ? "User blocked" : "User unblocked");
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed");
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await adminApi.deleteUser(deleteTarget._id);
      toast.success("User deleted");
      setDeleteTarget(null);
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || "Delete failed");
    } finally {
      setDeleting(false);
    }
  };

  const viewHistory = async (user) => {
    setHistoryUser(user);
    try {
      const { data } = await adminApi.getUserEnrollments(user._id);
      setEnrollments(data.enrollments);
    } catch {
      toast.error("Failed to load enrollments");
    }
  };

  return (
    <div className="space-y-6">
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
        <input
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder="Search users..."
          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-gray-900 border border-gray-800 text-white text-sm outline-none focus:ring-2 focus:ring-brand-500"
        />
      </div>

      <motion.div className="rounded-2xl border border-gray-800 overflow-hidden bg-gray-900/40">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800 text-gray-400 text-left">
                <th className="p-4">User</th>
                <th className="p-4 hidden md:table-cell">Role</th>
                <th className="p-4 hidden sm:table-cell">Enrollments</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array(5).fill(0).map((_, i) => (
                  <tr key={i}><td colSpan={5} className="p-4"><div className="h-10 bg-gray-800 rounded animate-pulse" /></td></tr>
                ))
              ) : users.length === 0 ? (
                <tr><td colSpan={5}><EmptyState title="No users" description="No users match your search" /></td></tr>
              ) : (
                users.map((user) => (
                  <tr key={user._id} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-500 to-accent-violet flex items-center justify-center text-white font-bold">
                          {user.name?.charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium text-white">{user.name}</p>
                          <p className="text-xs text-gray-500">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 hidden md:table-cell">
                      <select
                        value={user.role}
                        onChange={(e) => handleRoleChange(user, e.target.value)}
                        className="px-2 py-1 rounded-lg bg-gray-800 border border-gray-700 text-white text-xs"
                      >
                        <option value="user">User</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                    <td className="p-4 hidden sm:table-cell text-gray-400">{user.enrollmentCount ?? 0}</td>
                    <td className="p-4">
                      {user.isBlocked ? (
                        <span className="px-2 py-1 rounded-lg text-xs bg-red-500/20 text-red-400">Blocked</span>
                      ) : (
                        <span className="px-2 py-1 rounded-lg text-xs bg-green-500/20 text-green-400">Active</span>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="flex justify-end gap-1">
                        <button onClick={() => viewHistory(user)} title="Enrollment history" className="p-2 rounded-lg hover:bg-white/10 text-gray-400">
                          <History className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleBlock(user)} title={user.isBlocked ? "Unblock" : "Block"} className="p-2 rounded-lg hover:bg-yellow-500/20 text-yellow-400">
                          {user.isBlocked ? <UserCheck className="w-4 h-4" /> : <Ban className="w-4 h-4" />}
                        </button>
                        <button onClick={() => setDeleteTarget(user)} className="p-2 rounded-lg hover:bg-red-500/20 text-red-400">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {pages > 1 && (
          <div className="flex justify-center gap-2 p-4 border-t border-gray-800">
            {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
              <button key={p} onClick={() => setPage(p)} className={`px-3 py-1 rounded-lg text-sm ${page === p ? "bg-brand-600 text-white" : "text-gray-400"}`}>{p}</button>
            ))}
          </div>
        )}
      </motion.div>

      <ConfirmDialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} title="Delete User" message={`Delete ${deleteTarget?.name}? This cannot be undone.`} loading={deleting} />

      <Modal open={!!historyUser} onClose={() => setHistoryUser(null)} title={`Enrollments — ${historyUser?.name}`}>
        {enrollments.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No enrollments</p>
        ) : (
          <div className="space-y-3">
            {enrollments.map((e) => (
              <div key={e._id} className="flex justify-between p-3 rounded-xl bg-gray-800/50">
                <span className="text-white">{e.course?.title}</span>
                <span className="text-gray-500">{e.progress}% · {e.status}</span>
              </div>
            ))}
          </div>
        )}
      </Modal>
    </div>
  );
}
