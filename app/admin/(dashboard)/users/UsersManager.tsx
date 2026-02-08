'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { AdminUserRow } from '@/app/actions/admin-users';
import {
  listAdminUsers,
  createAdminUser,
  updateAdminUser,
  deleteAdminUser,
} from '@/app/actions/admin-users';

function Modal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div
      className="submission-detail-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="users-modal-title"
    >
      <div className="submission-detail-modal" style={{ maxWidth: 420 }} onClick={(e) => e.stopPropagation()}>
        <div className="submission-detail-header">
          <h3 id="users-modal-title" className="submission-title">
            {title}
          </h3>
          <button
            type="button"
            className="btn-close-detail"
            onClick={onClose}
            aria-label="Close"
          >
            ✕
          </button>
        </div>
        <div style={{ padding: '1rem 1.5rem' }}>{children}</div>
      </div>
    </div>
  );
}

export function UsersManager({
  initialUsers,
  currentAdminId,
}: {
  initialUsers: AdminUserRow[];
  currentAdminId: string;
}) {
  const router = useRouter();
  const [users, setUsers] = useState<AdminUserRow[]>(initialUsers);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [modal, setModal] = useState<'add' | 'edit' | 'delete' | null>(null);
  const [editingUser, setEditingUser] = useState<AdminUserRow | null>(null);
  const [deletingUser, setDeletingUser] = useState<AdminUserRow | null>(null);

  // Form state for add/edit
  const [formEmail, setFormEmail] = useState('');
  const [formFullName, setFormFullName] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formIsActive, setFormIsActive] = useState(true);

  function clearForm() {
    setFormEmail('');
    setFormFullName('');
    setFormPassword('');
    setFormIsActive(true);
    setEditingUser(null);
    setDeletingUser(null);
    setError('');
    setSuccess('');
  }

  function openAdd() {
    clearForm();
    setModal('add');
  }

  function openEdit(user: AdminUserRow) {
    setEditingUser(user);
    setFormEmail(user.email);
    setFormFullName(user.full_name ?? '');
    setFormPassword('');
    setFormIsActive(user.is_active);
    setModal('edit');
    setError('');
  }

  function openDelete(user: AdminUserRow) {
    setDeletingUser(user);
    setModal('delete');
    setError('');
  }

  function closeModal() {
    setModal(null);
    clearForm();
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    const result = await createAdminUser({
      email: formEmail,
      password: formPassword,
      full_name: formFullName || null,
    });
    setLoading(false);
    if (result.ok) {
      setSuccess('User created.');
      const list = await listAdminUsers();
      if (list.ok) setUsers(list.users);
      setTimeout(() => {
        closeModal();
        setSuccess('');
        router.refresh();
      }, 600);
    } else {
      setError(result.error ?? 'Failed to create user');
    }
  }

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (!editingUser) return;
    setError('');
    setLoading(true);
    const result = await updateAdminUser(editingUser.id, {
      email: formEmail,
      full_name: formFullName || null,
      is_active: editingUser.id === currentAdminId ? true : formIsActive,
      password: formPassword || undefined,
    });
    setLoading(false);
    if (result.ok) {
      setSuccess('User updated.');
      const list = await listAdminUsers();
      if (list.ok) setUsers(list.users);
      setTimeout(() => {
        closeModal();
        setSuccess('');
        router.refresh();
      }, 600);
    } else {
      setError(result.error ?? 'Failed to update user');
    }
  }

  async function handleDelete() {
    if (!deletingUser) return;
    if (deletingUser.id === currentAdminId) {
      setError('You cannot delete your own account.');
      return;
    }
    setError('');
    setLoading(true);
    const result = await deleteAdminUser(deletingUser.id);
    setLoading(false);
    if (result.ok) {
      setUsers((prev) => prev.filter((u) => u.id !== deletingUser.id));
      closeModal();
      setSuccess('User deleted.');
      setTimeout(() => setSuccess(''), 3000);
      router.refresh();
    } else {
      setError(result.error ?? 'Failed to delete user');
    }
  }

  return (
    <>
      <div className="card">
        <div className="form-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h2>Users</h2>
            <p>Manage admin users who can access the dashboard.</p>
          </div>
          <button type="button" className="btn btn-primary" onClick={openAdd}>
            Add user
          </button>
        </div>

        {success && (
          <div className="alert alert-success" role="status">
            {success}
          </div>
        )}

        {users.length === 0 ? (
          <p style={{ textAlign: 'center', color: 'var(--text-light)', padding: '2rem' }}>
            No users yet. Add one to get started.
          </p>
        ) : (
          <div className="table-container" style={{ marginTop: '1rem' }}>
            <table className="report-table">
              <thead>
                <tr>
                  <th>Email</th>
                  <th>Full name</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th style={{ width: 120 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
                    <td>{u.email}</td>
                    <td>{u.full_name ?? '—'}</td>
                    <td>
                      <span style={{
                        padding: '0.25rem 0.5rem',
                        borderRadius: 6,
                        fontSize: '0.8rem',
                        fontWeight: 500,
                        background: u.is_active ? 'var(--success)' : 'var(--text-light)',
                        color: 'white',
                      }}>
                        {u.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>{new Date(u.created_at).toLocaleDateString()}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <button
                          type="button"
                          className="btn btn-secondary"
                          style={{ padding: '0.4rem 0.75rem', fontSize: '0.85rem' }}
                          onClick={() => openEdit(u)}
                        >
                          Edit
                        </button>
                        {u.id !== currentAdminId ? (
                          <button
                            type="button"
                            className="btn"
                            style={{
                              padding: '0.4rem 0.75rem',
                              fontSize: '0.85rem',
                              background: 'var(--error)',
                              color: 'white',
                            }}
                            onClick={() => openDelete(u)}
                          >
                            Delete
                          </button>
                        ) : (
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-light)' }}>You</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modal === 'add' && (
        <Modal title="Add user" onClose={closeModal}>
          {error && (
            <div className="alert alert-error" role="alert" style={{ marginBottom: '1rem' }}>
              {error}
            </div>
          )}
          <form onSubmit={handleCreate}>
            <div className="form-group">
              <label htmlFor="add-email">Email</label>
              <input
                id="add-email"
                type="email"
                value={formEmail}
                onChange={(e) => setFormEmail(e.target.value)}
                required
                autoComplete="email"
                style={{ width: '100%', padding: '0.5rem 0.75rem', border: '2px solid var(--border-color)', borderRadius: 8 }}
              />
            </div>
            <div className="form-group">
              <label htmlFor="add-fullname">Full name (optional)</label>
              <input
                id="add-fullname"
                type="text"
                value={formFullName}
                onChange={(e) => setFormFullName(e.target.value)}
                autoComplete="name"
                style={{ width: '100%', padding: '0.5rem 0.75rem', border: '2px solid var(--border-color)', borderRadius: 8 }}
              />
            </div>
            <div className="form-group">
              <label htmlFor="add-password">Password</label>
              <input
                id="add-password"
                type="password"
                value={formPassword}
                onChange={(e) => setFormPassword(e.target.value)}
                required
                minLength={6}
                autoComplete="new-password"
                style={{ width: '100%', padding: '0.5rem 0.75rem', border: '2px solid var(--border-color)', borderRadius: 8 }}
              />
              <span style={{ fontSize: '0.8rem', color: 'var(--text-light)' }}>At least 6 characters</span>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem' }}>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Creating…' : 'Create user'}
              </button>
              <button type="button" className="btn btn-secondary" onClick={closeModal}>
                Cancel
              </button>
            </div>
          </form>
        </Modal>
      )}

      {modal === 'edit' && editingUser && (
        <Modal title="Edit user" onClose={closeModal}>
          {error && (
            <div className="alert alert-error" role="alert" style={{ marginBottom: '1rem' }}>
              {error}
            </div>
          )}
          <form onSubmit={handleUpdate}>
            <div className="form-group">
              <label htmlFor="edit-email">Email</label>
              <input
                id="edit-email"
                type="email"
                value={formEmail}
                onChange={(e) => setFormEmail(e.target.value)}
                required
                autoComplete="email"
                style={{ width: '100%', padding: '0.5rem 0.75rem', border: '2px solid var(--border-color)', borderRadius: 8 }}
              />
            </div>
            <div className="form-group">
              <label htmlFor="edit-fullname">Full name (optional)</label>
              <input
                id="edit-fullname"
                type="text"
                value={formFullName}
                onChange={(e) => setFormFullName(e.target.value)}
                autoComplete="name"
                style={{ width: '100%', padding: '0.5rem 0.75rem', border: '2px solid var(--border-color)', borderRadius: 8 }}
              />
            </div>
            <div className="form-group">
              <label htmlFor="edit-password">New password (leave blank to keep current)</label>
              <input
                id="edit-password"
                type="password"
                value={formPassword}
                onChange={(e) => setFormPassword(e.target.value)}
                minLength={6}
                autoComplete="new-password"
                placeholder="••••••••"
                style={{ width: '100%', padding: '0.5rem 0.75rem', border: '2px solid var(--border-color)', borderRadius: 8 }}
              />
            </div>
            {editingUser.id === currentAdminId ? (
              <p style={{ fontSize: '0.85rem', color: 'var(--text-light)' }}>
                You cannot deactivate your own account.
              </p>
            ) : (
              <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input
                  id="edit-active"
                  type="checkbox"
                  checked={formIsActive}
                  onChange={(e) => setFormIsActive(e.target.checked)}
                />
                <label htmlFor="edit-active" style={{ marginBottom: 0 }}>Active</label>
              </div>
            )}
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem' }}>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Saving…' : 'Save changes'}
              </button>
              <button type="button" className="btn btn-secondary" onClick={closeModal}>
                Cancel
              </button>
            </div>
          </form>
        </Modal>
      )}

      {modal === 'delete' && deletingUser && (
        <Modal title="Delete user" onClose={closeModal}>
          {error && (
            <div className="alert alert-error" role="alert" style={{ marginBottom: '1rem' }}>
              {error}
            </div>
          )}
          <p>
            Are you sure you want to delete <strong>{deletingUser.email}</strong>? This cannot be undone.
          </p>
          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem' }}>
            <button
              type="button"
              className="btn"
              style={{ background: 'var(--error)', color: 'white' }}
              onClick={handleDelete}
              disabled={loading}
            >
              {loading ? 'Deleting…' : 'Delete'}
            </button>
            <button type="button" className="btn btn-secondary" onClick={closeModal}>
              Cancel
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}
