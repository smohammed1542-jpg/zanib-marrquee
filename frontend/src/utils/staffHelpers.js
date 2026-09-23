export function staffDisplayName(member) {
  return `${member?.first_name || ''} ${member?.last_name || ''}`.trim() || member?.email || member?.username || '—';
}

export function isStaffActive(member) {
  return member?.profile_status !== false && member?.is_active !== false;
}

export function staffPayrollTotal(members) {
  return (members || []).reduce((sum, member) => sum + (Number(member.salary) || 0), 0);
}

export function exportStaffCsv(members, filename = 'employees.csv') {
  const headers = ['Name', 'Username', 'Email', 'Role', 'Phone', 'Salary (PKR)', 'Joining Date', 'Status'];
  const rows = (members || []).map((member) => [
    staffDisplayName(member),
    member.username || '',
    member.email || '',
    member.role || '',
    member.phone || '',
    Number(member.salary) || 0,
    member.joining_date || '',
    isStaffActive(member) ? 'Active' : 'Inactive',
  ]);

  const escape = (value) => `"${String(value).replace(/"/g, '""')}"`;
  const csv = [headers, ...rows].map((row) => row.map(escape).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
