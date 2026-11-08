// Receiver for the ZKTeco SenseFace 3A (ADMS push, access-control mode).
//
// The machine calls fixed /iclock/... paths, so it reaches this function through
// the relay in tools/iclock-relay. It has no way to send a login, so this is
// deployed with --no-verify-jwt and accepts only serial numbers in `devices`.
//
// Replies copy what tools/device-probe proved the machine accepts. A scan only
// gets "OK" after the database commits it; any other reply makes the machine
// send it again.
//
// Enrollment uploads (face templates, fingerprints, photos) are discarded here
// without being read or logged. They must never be stored.

import { createClient } from 'npm:@supabase/supabase-js@2';

const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
  auth: { persistSession: false },
});

const MAX_BODY_CHARS = 1_000_000;
const REGISTRY_CODE = 'FITLIFE';
const SERIAL = /^[A-Za-z0-9_-]{4,64}$/;
const LOCAL_TIME = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/;

const text = (body: string, status = 200) =>
  new Response(body, { status, headers: { 'Content-Type': 'text/plain' } });

// RequestDelay=30 is how often the machine asks for commands. Scans are still
// pushed immediately because of Realtime=1.
const handshake = (sn: string) =>
  [
    'registry=ok',
    `RegistryCode=${REGISTRY_CODE}`,
    'ServerVersion=3.1.2',
    'ServerName=FitLife',
    'PushProtVer=3.1.2',
    'ErrorDelay=30',
    'RequestDelay=30',
    'TransTimes=00:00;14:00',
    'TransInterval=1',
    'TransTables=User Transaction',
    'Realtime=1',
    `SessionID=fitlife-${sn}`,
    'TimeoutSec=10',
  ].join('\n');

const toInt = (value: string | undefined) => {
  const n = Number(value);
  return value !== undefined && value !== '' && Number.isInteger(n) ? n : null;
};

// One record per line, tab-separated key=value pairs. Bad lines are skipped so
// that one of them can't make the machine resend the whole batch forever.
function parseAccessLog(body: string) {
  const rows = [];
  for (const line of body.split(/\r?\n/)) {
    if (!line.trim()) continue;
    const f = Object.fromEntries(
      line.split('\t').map((part) => {
        const at = part.indexOf('=');
        return at < 0 ? [part, ''] : [part.slice(0, at), part.slice(at + 1)];
      }),
    );
    const event = toInt(f.event);
    if (!LOCAL_TIME.test(f.time ?? '') || !/^\d+$/.test(f.pin ?? '') || event === null) {
      console.warn('Skipped a malformed access record');
      continue;
    }
    rows.push({
      local_time: f.time,
      pin: f.pin,
      event,
      verify: toInt(f.verifytype),
      in_out: toInt(f.inoutstatus),
      card: f.cardno && f.cardno !== '0' ? f.cardno : null,
      log_index: toInt(f.index),
    });
  }
  return rows;
}

const registryField = (body: string, key: string) =>
  body.match(new RegExp(`(?:^|,)~?${key}=([^,]*)`))?.[1] || null;

async function readBody(req: Request) {
  const body = await req.text();
  if (body.length > MAX_BODY_CHARS) throw new RangeError('Body too large');
  return body;
}

Deno.serve(async (req) => {
  const url = new URL(req.url);
  const path = url.pathname.toLowerCase();
  const at = path.lastIndexOf('/iclock/');
  if (at < 0) return text('Not found', 404);

  const route = path.slice(at + '/iclock/'.length);
  const sn = url.searchParams.get('SN') ?? url.searchParams.get('sn') ?? '';
  if (!SERIAL.test(sn)) return text('Bad serial number', 400);

  try {
    let registryBody = '';
    if (route === 'registry' && req.method === 'POST') registryBody = await readBody(req);

    const { data: known, error } = await db.rpc('device_heartbeat', {
      p_serial: sn,
      p_ip: registryField(registryBody, 'IPAddress'),
      p_firmware: registryField(registryBody, 'FirmVer'),
    });
    if (error) throw error;
    if (!known) {
      await req.body?.cancel();
      return text('Unknown device', 403);
    }

    if (route === 'registry') return text(`RegistryCode=${REGISTRY_CODE}`);
    if (route === 'push') {
      await req.body?.cancel();
      return text(handshake(sn));
    }

    if (route === 'cdata') {
      if (req.method === 'GET') return text(handshake(sn));

      if (url.searchParams.get('table') === 'rtlog') {
        const rows = parseAccessLog(await readBody(req));
        if (rows.length > 0) {
          const { error: saveError } = await db.rpc('record_device_scans', { p_serial: sn, p_rows: rows });
          if (saveError) throw saveError;
        }
        return text('OK');
      }

      // Door status, user lists and biometric uploads: accepted, not kept.
      await req.body?.cancel();
      return text('OK');
    }

    return text('OK'); // getrequest, ping, devicecmd
  } catch (err) {
    if (err instanceof RangeError) return text('Too large', 413);
    console.error('iclock failed:', err instanceof Error ? err.message : 'unknown error');
    return text('Temporarily unavailable', 500);
  }
});
