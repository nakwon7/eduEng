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
];

export function isHostingOrg(org: string | null | undefined): boolean {
  if (!org) return false;
  const o = org.toUpperCase();
  return HOSTING_ORG_KEYWORDS.some((k) => o.includes(k));
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
