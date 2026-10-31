// SSRF guard (Architecture 7a): addresses a student-submitted URL must never reach. Pure.
// The production VM sits on 172.16.x, next to the database and MinIO, so private ranges are
// as dangerous as localhost and the cloud metadata address.
import net from 'node:net';

const V4_BLOCKED = [
    ['0.0.0.0', 8], ['10.0.0.0', 8], ['100.64.0.0', 10], ['127.0.0.0', 8], ['169.254.0.0', 16],
    ['172.16.0.0', 12], ['192.0.0.0', 24], ['192.168.0.0', 16], ['198.18.0.0', 15], ['224.0.0.0', 4], ['240.0.0.0', 4],
].map(([base, bits]) => [v4ToInt(base), bits]);

function v4ToInt(ip) {
    return ip.split('.').reduce((n, part) => (n << 8) + Number(part), 0) >>> 0;
}

function v4Blocked(ip) {
    const n = v4ToInt(ip);
    return V4_BLOCKED.some(([base, bits]) => {
        const mask = bits === 0 ? 0 : (~0 << (32 - bits)) >>> 0;
        return (n & mask) === (base & mask);
    });
}

// Expands an IPv6 address to 8 numbers (handles "::" and a trailing dotted IPv4 part).
function v6Groups(ip) {
    let text = ip.toLowerCase().split('%')[0];
    const dotted = text.match(/(\d+\.\d+\.\d+\.\d+)$/);
    if (dotted) {
        const n = v4ToInt(dotted[1]);
        text = text.slice(0, -dotted[1].length) + `${(n >>> 16).toString(16)}:${(n & 0xffff).toString(16)}`;
    }
    const [head, tail] = text.split('::');
    const h = head ? head.split(':') : [];
    const t = tail !== undefined && tail !== '' ? tail.split(':') : [];
    const fill = tail !== undefined ? Array(8 - h.length - t.length).fill('0') : [];
    return [...h, ...fill, ...t].map((g) => parseInt(g || '0', 16));
}

function v6Blocked(ip) {
    const g = v6Groups(ip);
    if (g.length !== 8 || g.some((x) => Number.isNaN(x))) return true; // unparseable: refuse
    if (g.every((x) => x === 0)) return true; // ::
    if (g.slice(0, 7).every((x) => x === 0) && g[7] === 1) return true; // ::1
    if ((g[0] & 0xfe00) === 0xfc00) return true; // fc00::/7 unique local
    if ((g[0] & 0xffc0) === 0xfe80) return true; // fe80::/10 link local
    if ((g[0] & 0xff00) === 0xff00) return true; // ff00::/8 multicast
    if ((g[0] & 0xffc0) === 0xfec0) return true; // fec0::/10 old site-local
    if (g[0] === 0x64 && g[1] === 0xff9b && g[2] === 1) return true; // 64:ff9b:1::/48 local-use NAT64
    if (g[0] === 0x2001 && g[1] === 0) return true; // 2001::/32 Teredo (client address is obfuscated)

    // Forms that carry an IPv4 address, which a NAT64 / 6to4 gateway would connect to: judge that address.
    const v4 = (hi, lo) => v4Blocked(`${hi >> 8}.${hi & 0xff}.${lo >> 8}.${lo & 0xff}`);
    const zeros = (from, to) => g.slice(from, to).every((x) => x === 0);
    // IPv4-mapped (::ffff:a.b.c.d) and IPv4-compatible (::a.b.c.d)
    if (zeros(0, 5) && (g[5] === 0xffff || g[5] === 0)) return v4(g[6], g[7]);
    // IPv4-translated (::ffff:0:a.b.c.d)
    if (zeros(0, 4) && g[4] === 0xffff && g[5] === 0) return v4(g[6], g[7]);
    // NAT64 well-known prefix 64:ff9b::/96
    if (g[0] === 0x64 && g[1] === 0xff9b && zeros(2, 6)) return v4(g[6], g[7]);
    // 6to4 2002:aabb:ccdd::/48 = a.b.c.d
    if (g[0] === 0x2002) return v4(g[1], g[2]);
    return false;
}

// true = never connect. Anything that is not a valid IP address is blocked too.
export function isBlockedAddress(ip) {
    const family = net.isIP(String(ip ?? '').split('%')[0]);
    if (family === 4) return v4Blocked(ip);
    if (family === 6) return v6Blocked(ip);
    return true;
}
