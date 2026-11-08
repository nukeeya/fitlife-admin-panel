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

// One result per line: ID=17&Return=0&CMD=DATA
function parseCommandResults(body: string) {
  const results = [];
  for (const line of body.split(/\r?\n/)) {
    const fields = new URLSearchParams(line.trim());
    const id = toInt(fields.get('ID') ?? undefined);
    const returnCode = toInt(fields.get('Return') ?? undefined);
    if (id !== null && id > 0 && returnCode !== null) results.push({ id, returnCode });
  }
  return results;
}

// A remote-scan upload: one template per line, key=value pairs.
function parseFaceUploads(body: string) {
  return body
    .split(/\r?\n/)
    .filter((line) => line.trim())
    .slice(0, 12)
    .map((line) => {
      const parts = line.includes('\t') ? line.split('\t') : line.split('&');
      return Object.fromEntries(
        parts.map((part) => {
          const at = part.indexOf('=');
          const key = (at < 0 ? part : part.slice(0, at)).trim().split(/\s+/).pop()!.toLowerCase();
          return [key, at < 0 ? '' : part.slice(at + 1)];
        }),
      ) as Record<string, string>;
    });
}

// Only short, plain names, so a malformed upload can't leak values into the log.
const safeFieldNames = (fields: Record<string, string>) =>
  Object.keys(fields).filter((k) => /^[a-z_]{1,12}$/.test(k)).slice(0, 20).join(',');

function faceReturnCommand(f: Record<string, string>) {
  const tmp = f.tmp ?? f.template ?? '';
  if (!/^[1-9]\d{0,8}$/.test(f.pin ?? '') || !/^[A-Za-z0-9+/]+={0,2}$/.test(tmp)) return null;
  const num = (value: string | undefined, fallback: string) => (/^\d{1,4}$/.test(value ?? '') ? value : fallback);
  return {
    pin: f.pin,
    command:
      `DATA UPDATE biodata Pin=${f.pin}\tNo=${num(f.no, '0')}\tIndex=${num(f.index, '0')}` +
      `\tValid=${num(f.valid, '1')}\tDuress=${num(f.duress, '0')}\tType=${num(f.type, '9')}` +
      `\tMajorVer=${num(f.majorver, '40')}\tMinorVer=${num(f.minorver, '1')}\tFormat=${num(f.format, '0')}\tTmp=${tmp}`,
  };
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

      // A remote scan's face. It only goes back to the machine, and only if the
      // server asked for that scan (migration 025). Never log the values.
      if (url.searchParams.get('type')?.toLowerCase() === 'biodata') {
        const uploads = parseFaceUploads(await readBody(req));
        for (const fields of uploads) {
          const item = faceReturnCommand(fields);
          if (!item) {
            console.warn(`Unusable face upload. Fields: ${safeFieldNames(fields)}`);
            continue;
          }
          const { data: queued, error: queueError } = await db.rpc('queue_face_template_return', {
            p_serial: sn,
            p_pin: item.pin,
            p_command: item.command,
          });
          if (queueError) throw new Error('Could not queue the face return');
          if (!queued) console.warn('Face upload ignored: no matching scan was requested');
        }
        return text('OK');
      }

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

    if (route === 'getrequest') {
      const { data: command, error: commandError } = await db.rpc('next_device_command', { p_serial: sn });
      if (commandError) throw commandError;
      return text(command ?? 'OK');
    }

    if (route === 'devicecmd' && req.method === 'POST') {
      for (const result of parseCommandResults(await readBody(req))) {
        const { error: resultError } = await db.rpc('record_device_command_result', {
          p_serial: sn,
          p_command_id: result.id,
          p_return_code: result.returnCode,
        });
        if (resultError) throw resultError;
      }
      return text('OK');
    }

    return text('OK'); // ping
  } catch (err) {
    if (err instanceof RangeError) return text('Too large', 413);
    console.error('iclock failed:', err instanceof Error ? err.message : 'unknown error');
    return text('Temporarily unavailable', 500);
  }
});
