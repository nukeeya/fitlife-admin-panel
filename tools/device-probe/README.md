# Device probe (SenseFace 3A)

A throwaway test that shows exactly what the face/fingerprint machine sends
before we build the real receiver. It runs on your laptop at the gym and
never touches the app or the database.

## What you need

- Your laptop with Node.js on the **same network** as the machine (same router)
- The machine's admin password (for its menu)
- This repo on the laptop

## 1. Before changing anything, note the current settings

Menu → **COMM** → **Cloud Server Setting**: take a photo of the screen. If it already points at
ZKBio software or another server, ask the gym first. Changing it disconnects that software.

Also take a photo of Menu → **System Info** → **Device Info** (serial number, firmware version).

The door keeps working the whole time. The machine checks faces and fingerprints
itself; the server only receives copies of the scans.

## 2. Start the probe on the laptop

```
node tools/device-probe/probe.mjs
```

It prints the laptop's IP addresses, e.g. `192.168.0.105`. Use the one on the
same network as the machine (its IP is under Menu → COMM → Ethernet; the first
three numbers should match).

**Windows firewall:** the first time, Windows asks whether Node.js may accept
connections. Allow it on **Private networks**. If nothing ever arrives, this is the
usual cause.

## 3. Point the machine at the laptop

Menu → **COMM** → **Cloud Server Setting**:

| Setting | Value |
|---|---|
| Server Mode | **ADMS** |
| Enable Domain Name | **Off** |
| Server Address | the laptop IP from step 2 |
| Server Port | **8081** |
| Enable Proxy Server | Off |
| HTTPS (if shown) | **Off** for this test, but note whether the option exists |

**Don't** switch the push mode to TA (time & attendance). Keep it in AC push, because it runs the door.

Within about a minute the probe should print the first request. A cloud icon on the
machine's main screen usually turns from crossed out to normal.

## 4. Things to try (watch the probe after each)

1. Wait for the first contact (handshake / registry)
2. Scan a **face** of an enrolled user
3. Scan a **fingerprint**
4. Try a face that is **not enrolled**
5. Enroll a new test user on the machine, then check whether the probe receives the user info
6. Unplug the laptop's network for a minute while someone scans, plug it back in, and check whether the missed scan arrives afterwards

## 5. Send me

- The file `tools/device-probe/probe-log.jsonl`. It contains user numbers and scan times
  but no fingerprints or photos, and it's git-ignored.
- The photos from step 1
- Whether the HTTPS option exists, and whether "Enable Domain Name" accepts a web address

## 6. Afterwards

Put the Cloud Server setting back as it was (or leave it pointed at the laptop until
the real receiver is ready). Delete `probe-log.jsonl` once I have it.
