const isoDay = /^\d{4}-\d{2}-\d{2}$/;

export function currentWeek(now = new Date()) {
  const date = new Date(now.toLocaleDateString('sv-SE', { timeZone: 'Europe/Berlin' }) + 'T00:00:00Z');
  date.setUTCDate(date.getUTCDate() - (date.getUTCDay() + 6) % 7);
  const from = date.toISOString().slice(0, 10);
  date.setUTCDate(date.getUTCDate() + 6);
  return { from, to: date.toISOString().slice(0, 10) };
}

// Only accept the two responses the normal schedule page loaded for this department.
export function resourceFor(value, department, week) {
  const url = new URL(value);
  const path = '/scheduling/departments/' + department + '/day_based/';
  for (const [service, field] of [['shift', 'shifts'], ['people', 'employees']]) {
    if (url.origin !== 'https://scheduling-' + service + '-api.prod-westeurope.planday.cloud' ||
        url.pathname !== path + field) continue;
    const from = url.searchParams.get('from'), to = url.searchParams.get('to');
    if (field === 'employees' && !from && !to) return field;
    if (isoDay.test(from) && isoDay.test(to) && from === week.from && to === week.to) return field;
  }
  return null;
}

export function snapshot(shifts, employees, department, week, now = new Date()) {
  const scheduled = shifts.filter(s => s.employee_id && !['Open', 'Draft'].includes(s.status));
  const ids = new Set(scheduled.map(s => s.employee_id));
  return {
    department, ...week, updated: now.toISOString(),
    shifts: scheduled.map(s => ({
      id: s.id, employeeId: s.employee_id, date: s.date, timeZone: s.time_zone,
      startDateTime: s.start_date_time, endDateTime: s.end_date_time
    })),
    employees: employees.map(e => ids.has(e.id) ? {
      id: e.id, first: e.name?.first_name ?? e.first_name, last: e.name?.last_name ?? e.last_name,
      display: e.display_name
    } : { id: e.id })
  };
}
