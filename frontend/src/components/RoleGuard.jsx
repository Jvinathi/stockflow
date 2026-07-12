import { useAuth } from '../context/AuthContext';

/**
 * Wraps any UI element and only renders it if the logged-in user's role
 * is in the allowedRoles list. Example:
 *   <RoleGuard allowedRoles={['OWNER', 'MANAGER']}>
 *     <button>Delete Product</button>
 *   </RoleGuard>
 * A STAFF user simply won't see this button at all.
 *
 * NOTE: this is a UX convenience only -- the REAL security enforcement
 * always happens on the backend (require_roles dependency). Never rely on
 * this alone to protect sensitive actions.
 */
export default function RoleGuard({ allowedRoles, children }) {
  const { user } = useAuth();

  if (!user || !allowedRoles.includes(user.role)) {
    return null;
  }

  return children;
}