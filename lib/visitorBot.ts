const BOT_UA_PATTERNS = [
  "bot",
  "crawler",
  "spider",
  "curl",
  "wget",
  "python-requests",
  "python-urllib",
  "go-http-client",
  "headlesschrome",
  "scan",
  "facebookexternalhit",
  "bingpreview",
];

export function isBotUserAgent(ua: string | null | undefined): boolean {
  if (!ua) return false;
  const u = ua.toLowerCase();
  // 취약점 스캐너가 UA 헤더에 URL을 통째로 넣는 경우 (예: wp-admin/install.php 스캔)
  if (u.startsWith("http://") || u.startsWith("https://")) return true;
  return BOT_UA_PATTERNS.some((p) => u.includes(p));
}

const HOSTING_ORG_KEYWORDS = [
  "HOST",
  "CLOUD",
  "VPS",
  "DATACENTER",
  "DATA CENTER",
  "COLOCATION",
  "SERVER",
  "AMAZON",
  "GOOGLE LLC",
  "MICROSOFT",
  "DIGITALOCEAN",
  "LINODE",
  "VULTR",
  "OVH",
  "HETZNER",
  "RACKNERD",
  "CONTABO",
  "SHARKTECH",
  "COGENT",
  "LEASEWEB",
  "CHOOPA",
  "FRANTECH",
  "TZULO",
  "WHITE LABEL",
  "TENCENT",
  "ALIBABA",
  "ALIYUN",
  "HUAWEI CLOUD",
  "ORACLE CORPORATION",
  "SCALEWAY",
];

export function isHostingOrg(org: string | null | undefined): boolean {
  if (!org) return false;
  const o = org.toUpperCase();
  return HOSTING_ORG_KEYWORDS.some((k) => o.includes(k));
}

const SUSPICIOUS_UA_MIN_DISTINCT_IPS = 3;

// 같은 UA가 한 시간 내 여러 IP(지역)에서 찍히면 IP를 돌려가며 접속하는 봇으로 간주.
// hosting IP 키워드 목록에 없는 클라우드/프록시 대역을 잡아내기 위한 보조 수단.
export function findSuspiciousUaHourBuckets(
  rows: { ip: string; user_agent: string | null; hour_bucket: string }[]
): Set<string> {
  const ipsByKey = new Map<string, Set<string>>();
  for (const r of rows) {
    if (!r.user_agent) continue;
    const key = `${r.hour_bucket}||${r.user_agent}`;
    if (!ipsByKey.has(key)) ipsByKey.set(key, new Set());
    ipsByKey.get(key)!.add(r.ip);
  }
  const suspicious = new Set<string>();
  for (const [key, ips] of ipsByKey) {
    if (ips.size >= SUSPICIOUS_UA_MIN_DISTINCT_IPS) suspicious.add(key);
  }
  return suspicious;
}

export async function fetchRegionAndHosting(
  ip: string
): Promise<{ region: string | null; isHosting: boolean }> {
  try {
    const res = await fetch(`https://ipwho.is/${ip}`, {
      headers: { "User-Agent": "turingcall/1.0" },
      signal: AbortSignal.timeout(3000),
    });
    const json = await res.json();
    if (json?.success === false) return { region: null, isHosting: false };

    const city: string = json?.city || "";
    const countryCode: string = json?.country_code || "";
    const region = city && countryCode ? `${city}, ${countryCode}` : countryCode || null;
    const org: string = json?.connection?.org || "";

    return { region, isHosting: isHostingOrg(org) };
  } catch {
    return { region: null, isHosting: false };
  }
}
