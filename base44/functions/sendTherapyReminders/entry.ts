import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const WINDOW = 5; // minuti (allineato al cron */5)

function romeMinutes(now) {
  const fmt = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Rome',
    hour: '2-digit', minute: '2-digit', hour12: false,
    weekday: 'short', day: '2-digit',
  });
  const o = {};
  fmt.formatToParts(now).forEach((p) => { o[p.type] = p.value; });
  const hh = o.hour === '24' ? '00' : o.hour;
  return {
    totalMin: parseInt(hh, 10) * 60 + parseInt(o.minute, 10),
    weekdayNum: WEEKDAYS.indexOf(o.weekday),
    day: parseInt(o.day, 10),
  };
}

function timeToMinutes(s) {
  const [hh, mm] = s.split(':');
  return (parseInt(hh, 10) || 0) * 60 + (parseInt(mm, 10) || 0);
}

function isDosingDay(med, p) {
  const freq = med.frequency || 'giornaliero';
  if (freq === 'giornaliero') return true;
  const sd = med.start_date ? new Date(med.start_date + 'T00:00:00') : null;
  if (freq === 'bisettimanale') return p.weekdayNum === 1 || p.weekdayNum === 4; // lunedì e giovedì
  if (freq === 'settimanale') return sd ? (sd.getDay() === p.weekdayNum) : true;
  if (freq === 'mensile') return sd ? (sd.getDate() === p.day) : true;
  return false; // al_bisogno: nessun promemoria programmato
}

function parseTimes(raw) {
  return String(raw || '')
    .split(/[\s,;]+/)
    .map((s) => s.trim().replace('.', ':'))
    .filter(Boolean);
}

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const meds = await base44.asServiceRole.entities.Medication.filter({ active: true });
    const p = romeMinutes(new Date());
    const floor = Math.floor(p.totalMin / WINDOW) * WINDOW;
    let sent = 0;
    const errors = [];

    for (const m of meds) {
      if (!m.times || !m.created_by_id) continue;
      if (!isDosingDay(m, p)) continue;
      const due = parseTimes(m.times).some((tm) => {
        const t = timeToMinutes(tm);
        return t >= floor && t < floor + WINDOW;
      });
      if (!due) continue;
      try {
        await base44.asServiceRole.integrations.Core.SendPushNotification({
          user_id: m.created_by_id,
          title: 'Promemoria terapia',
          content: `${m.name}${m.dosage ? ' · ' + m.dosage : ''}`,
          action_label: 'Apri IBD Care',
          action_url: '/meds',
        });
        sent++;
      } catch (e) {
        errors.push(String((e && e.message) || e));
      }
    }

    return Response.json({ sent, floor, errors });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}