#!/usr/bin/env node
/**
 * Device probe: a throwaway receiver that shows exactly what the ZKTeco
 * SenseFace 3A sends in push (ADMS) mode, before we build the real receiver.
 *
 * Run it on a laptop on the same network as the machine:
 *     node tools/device-probe/probe.mjs            (port 8081)
 *     node tools/device-probe/probe.mjs 9000       (another port)
 *
 * Then set the machine's Cloud Server address to this laptop's IP and port
 * (see README.md). Every request is printed and also appended to
 * probe-log.jsonl next to this file. That log holds user numbers and scan
 * times, so it is git-ignored. Delete it when you're done.
 *
 * It doesn't touch the app or the database. It answers just enough for the
 * machine to keep talking:
 *   - the handshake gets a set of default options,
 *   - registration gets a fixed registry code,
 *   - "any commands for me?" gets OK (no commands),
 *   - uploaded data gets OK.
 * The real receiver will check the serial number against the devices table.
 * This one accepts any machine.
 */

import http from 'node:http';
import os from 'node:os';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const PORT = Number(process.argv[2]) || 8081;
const LOG_FILE = path.join(path.dirname(fileURLToPath(import.meta.url)), 'probe-log.jsonl');

// Options sent back on the handshake. Realtime=1 asks for each scan as it
// happens instead of in batches; the delays keep the conversation quick.
const handshakeReply = (sn) =>
  [
    `registry=ok`,
    `RegistryCode=FITLIFEPROBE`,
    `ServerVersion=3.1.2`,
    `ServerName=FitLifeProbe`,
    `PushProtVer=3.1.2`,
    `ErrorDelay=30`,
    `RequestDelay=3`,
    `TransTimes=00:00;14:00`,
    `TransInterval=1`,
    `TransTables=User Transaction`,
    `Realtime=1`,
    `SessionID=probe-${sn || 'unknown'}`,
    `TimeoutSec=10`,
  ].join('\n');

function replyFor(req, url) {
  const p = url.pathname.toLowerCase();
  const sn = url.searchParams.get('SN') || url.searchParams.get('sn') || '';
  if (p.endsWith('/registry')) return `RegistryCode=FITLIFEPROBE`;
  if (p.endsWith('/push')) return handshakeReply(sn);
  if (p.endsWith('/cdata') && req.method === 'GET') return handshakeReply(sn);
  return 'OK'; // getrequest, cdata POST, devicecmd, ping, anything else
}

// Body lines are tab-separated key=value pairs (e.g. "time=...\tpin=27\tevent=0").
// Parse them so the scans are easy to read in the console.
function parseLines(body) {
  return body
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => {
      const pairs = line.split('\t').map((part) => part.split('='));
      return pairs.every((kv) => kv.length >= 2)
        ? Object.fromEntries(pairs.map(([k, ...v]) => [k, v.join('=')]))
        : line;
    });
}

const server = http.createServer((req, res) => {
  const chunks = [];
  req.on('data', (c) => chunks.push(c));
  req.on('end', () => {
    const url = new URL(req.url, `http://${req.headers.host || 'device'}`);
    const body = Buffer.concat(chunks).toString('utf8');
    const reply = replyFor(req, url);

    const entry = {
      at: new Date().toISOString(),
      from: req.socket.remoteAddress,
      method: req.method,
      path: url.pathname,
      query: Object.fromEntries(url.searchParams),
      headers: req.headers,
      body,
      reply,
    };
    fs.appendFileSync(LOG_FILE, `${JSON.stringify(entry)}\n`);

    const time = new Date().toLocaleTimeString();
    console.log(`\n[${time}] ${req.method} ${url.pathname}${url.search}  (from ${entry.from})`);
    if (body) {
      console.log('  body:');
      for (const line of parseLines(body)) console.log('   ', typeof line === 'string' ? line : JSON.stringify(line));
    }
    console.log(`  replied: ${reply.split('\n')[0]}${reply.includes('\n') ? ' …' : ''}`);

    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end(reply);
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Device probe listening on port ${PORT}. Logging to ${LOG_FILE}`);
  console.log('Set the machine\'s Cloud Server address to one of these IPs:');
  for (const [name, addrs] of Object.entries(os.networkInterfaces())) {
    for (const a of addrs || []) {
      if (a.family === 'IPv4' && !a.internal) console.log(`  ${a.address}   (${name})`);
    }
  }
  console.log('Waiting for the machine… (Ctrl+C to stop)');
});
