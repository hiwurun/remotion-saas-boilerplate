# Synthesises the opening's sound effects (clean click, low "whoosh" sweep, soft thud). Pure python, no deps.
import math, random, struct, wave
SR = 44100
random.seed(7)

def write(name, samples):
    peak = max(1e-9, max(abs(s) for s in samples))
    data = b"".join(struct.pack("<h", int(max(-1, min(1, s / peak * 0.8)) * 32767)) for s in samples)
    with wave.open(f"public/openvlab-strategy/sfx/{name}.wav", "wb") as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes(data)

def lp(x, a):  # one-pole low-pass
    y, out = 0.0, []
    for v in x:
        y += a * (v - y); out.append(y)
    return out

# --- click: real mechanical-mouse "ta": a ~25ms bright noise transient + a tiny low "ka" body, then a lighter release ~110ms later.
def hp(x, a):  # one-pole high-pass
    y, prev, out = 0.0, 0.0, []
    for v in x:
        y = a * (y + v - prev); prev = v; out.append(y)
    return out

def tick(n, gain, f_body, f_hi, tau_nz, tau_body, tau_hi, seed):
    rnd = random.Random(seed)
    nz = hp(lp([rnd.uniform(-1, 1) for _ in range(n)], 0.75), 0.82)   # band-limited ~1.5k..8k noise
    out = []
    for i in range(n):
        t = i / SR
        s = 1.00 * nz[i] * math.exp(-t / tau_nz)                                   # bright transient (~3ms)
        s += 0.7 * math.sin(2 * math.pi * f_hi * t + 0.4) * math.exp(-t / tau_hi) # plastic shell ring
        s += 0.26 * math.sin(2 * math.pi * f_body * t) * math.exp(-t / tau_body)   # low "ka" body
        s *= min(1, t / 0.0003)                                                    # 0.3ms attack, no pop
        out.append(s * gain)
    return out

N = int(SR * 0.24)
click = [0.0] * N
down = tick(int(SR * 0.05), 1.0, 150, 3100, 0.0032, 0.005, 0.0028, 11)
up = tick(int(SR * 0.035), 0.42, 260, 4200, 0.0022, 0.004, 0.0016, 23)
lead = int(SR * 0.002)
for i, v in enumerate(down): click[lead + i] += v
off = lead + int(SR * 0.110)
for i, v in enumerate(up): click[off + i] += v
write("click", click)

# --- thud: soft impact (bottom of the fall)
dur = 0.9
n = int(SR * dur)
nz = lp([random.uniform(-1, 1) for _ in range(n)], 0.05)
out = []
for i in range(n):
    t = i / SR
    f = 52 + 70 * math.exp(-t * 18)
    s = math.sin(2 * math.pi * f * t) * math.exp(-t * 6.5) + 0.5 * nz[i] * math.exp(-t * 22)
    s *= min(1, t * 2000)
    out.append(s)
write("thud", out)
print("ok")
