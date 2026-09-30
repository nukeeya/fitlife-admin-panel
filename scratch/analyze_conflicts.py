import re, subprocess

def git(*args):
    return subprocess.run(['git', *args], capture_output=True).stdout

files = [l.split(':', 1)[1] for l in git('grep', '-l', '<<<<<<<', 'HEAD').decode().splitlines() if l]
print(f"{len(files)} conflicted files\n")

pat = re.compile(
    rb'^<<<<<<< Updated upstream\r?\n(.*?)^=======\r?\n(.*?)^>>>>>>> Stashed changes\r?\n',
    re.S | re.M)

for f in files:
    head = open(f, 'rb').read()
    hunks = pat.findall(head)
    # reconstruct: ours = keep upstream side, theirs = keep stash side
    def rebuild(idx):
        pos = 0
        out = []
        for m in pat.finditer(head):
            out.append(head[pos:m.start()])
            out.append(m.group(1 + idx))
            pos = m.end()
        out.append(head[pos:])
        return b''.join(out)
    ours, theirs = rebuild(0), rebuild(1)
    prod = git('show', f'cccfc2f:{f}')
    stash = git('show', f'fbf1971:{f}')
    def d(a, b):
        import difflib
        al, bl = a.splitlines(), b.splitlines()
        sm = difflib.SequenceMatcher(None, al, bl)
        same = sum(b.size for b in sm.get_matching_blocks())
        return f"{100 - 100*same/max(len(al),1):.0f}% diff" if al else "empty"
    n = len(hunks)
    o_lines = sum(len(h[0].splitlines()) for h in hunks)
    t_lines = sum(len(h[1].splitlines()) for h in hunks)
    print(f"{f}: {n} hunks | upstream-side {o_lines}L vs stash-side {t_lines}L")
    print(f"    ours-rebuild vs production(cccfc2f): {d(ours, prod)} | vs stash-side-rebuild vs stash-tree: {d(theirs, stash)}")
