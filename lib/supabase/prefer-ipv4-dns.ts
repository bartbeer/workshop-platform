import dns from "node:dns";

/**
 * Node kiest soms een kapotte IPv6-route naar Supabase; dan faalt `fetch` tijdelijk.
 * `ipv4first` helpt op Windows én elders — alleen Node server bundles importeren, niet Edge middleware.
 */
if (typeof dns.setDefaultResultOrder === "function") {
  dns.setDefaultResultOrder("ipv4first");
}
