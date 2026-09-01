import { useState } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  Percent,
  Check,
  X,
  Plus,
  Users,
  Lock,
} from 'lucide-react';
import { useGymData } from '../context/GymDataContext';

export default function SystemManagement() {
  const { roles, updateRolePermission, currentUserRole, setCurrentUserRole } = useGymData();

  return (
    <div className="page">
      {/* Header */}
      <div className="page-header">
        <div className="page-title-group">
          <h1 className="page-title">System Management & Access Control (RBAC)</h1>
          <p className="page-subtitle">
            Configure role privileges, financial authorization, member approval gates, and dynamic discount authority limits.
          </p>
        </div>
      </div>

      {/* Active Role Simulation Switcher */}
      <div style={{ background: 'var(--bg-card)', padding: '16px 20px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-base)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <ShieldCheck size={20} color="var(--primary)" />
          <div>
            <span style={{ fontSize: '12px', fontWeight: 800, color: 'var(--text-muted)' }}>CURRENT SIMULATED USER ROLE:</span>
            <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--primary)' }}>{currentUserRole}</div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {roles.map((r) => (
            <button
              key={r.id}
              className={`btn btn-sm ${currentUserRole === r.name ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setCurrentUserRole(r.name)}
            >
              Simulate: {r.name}
            </button>
          ))}
        </div>
      </div>

      {/* Roles & Permissions Matrix */}
      <div className="activity-card">
        <div className="activity-header">
          <span style={{ fontWeight: 800 }}>Role Permission & Dynamic Discount Authority Matrix</span>
        </div>

        <div className="table-responsive">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Role & Description</th>
                <th>Discount Privilege</th>
                <th>Max Discount %</th>
                <th>Approve Members</th>
                <th>Manage Lockers</th>
                <th>Financials</th>
                <th>Staff Count</th>
              </tr>
            </thead>
            <tbody>
              {roles.map((role) => (
                <tr key={role.id}>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontWeight: 800, fontSize: '14px', color: 'var(--text-primary)' }}>
                        {role.name}
                      </span>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        {role.description}
                      </span>
                    </div>
                  </td>

                  {/* Can Apply Discount Toggle */}
                  <td>
                    <button
                      className={`btn btn-sm ${role.canApplyDiscount ? 'btn-primary' : 'btn-danger'}`}
                      onClick={() => updateRolePermission(role.id, 'canApplyDiscount', !role.canApplyDiscount)}
                      title="Toggle discount privilege"
                    >
                      {role.canApplyDiscount ? '✓ Allowed' : '✗ Denied'}
                    </button>
                  </td>

                  {/* Max Discount % Input */}
                  <td>
                    {role.canApplyDiscount ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          style={{ width: '65px', padding: '4px 6px', fontSize: '12px' }}
                          className="form-input"
                          value={role.maxDiscountPercent}
                          onChange={(e) => updateRolePermission(role.id, 'maxDiscountPercent', Number(e.target.value))}
                        />
                        <span style={{ fontWeight: 700, fontSize: '12px' }}>%</span>
                      </div>
                    ) : (
                      <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>0% (Locked)</span>
                    )}
                  </td>

                  {/* Can Approve Members */}
                  <td>
                    <button
                      className={`btn btn-sm ${role.canApproveMembers ? 'btn-secondary' : 'btn-danger'}`}
                      onClick={() => updateRolePermission(role.id, 'canApproveMembers', !role.canApproveMembers)}
                    >
                      {role.canApproveMembers ? '✓ Yes' : '✗ No'}
                    </button>
                  </td>

                  {/* Can Manage Lockers */}
                  <td>
                    <button
                      className={`btn btn-sm ${role.canManageLockers ? 'btn-secondary' : 'btn-danger'}`}
                      onClick={() => updateRolePermission(role.id, 'canManageLockers', !role.canManageLockers)}
                    >
                      {role.canManageLockers ? '✓ Yes' : '✗ No'}
                    </button>
                  </td>

                  {/* Financials */}
                  <td>
                    <button
                      className={`btn btn-sm ${role.canManageFinances ? 'btn-secondary' : 'btn-danger'}`}
                      onClick={() => updateRolePermission(role.id, 'canManageFinances', !role.canManageFinances)}
                    >
                      {role.canManageFinances ? '✓ Full' : '✗ View Only'}
                    </button>
                  </td>

                  <td style={{ fontWeight: 700 }}>{role.usersCount} Users</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
