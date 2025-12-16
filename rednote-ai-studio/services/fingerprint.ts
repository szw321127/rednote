// Simple browser fingerprint generator
// Generates a unique identifier based on browser and device characteristics

export async function generateFingerprint(): Promise<string> {
  const components: string[] = [];

  // User Agent
  components.push(navigator.userAgent);

  // Screen resolution
  components.push(`${screen.width}x${screen.height}x${screen.colorDepth}`);

  // Timezone
  components.push(Intl.DateTimeFormat().resolvedOptions().timeZone);

  // Language
  components.push(navigator.language);

  // Platform
  components.push(navigator.platform);

  // Hardware concurrency (CPU cores)
  components.push(String(navigator.hardwareConcurrency || 0));

  // Device memory (if available)
  const deviceMemory = (navigator as any).deviceMemory;
  if (deviceMemory) {
    components.push(String(deviceMemory));
  }

  // Touch support
  components.push(String('ontouchstart' in window));

  // Plugins (legacy browsers)
  if (navigator.plugins) {
    const plugins = Array.from(navigator.plugins)
      .map(p => p.name)
      .sort()
      .join(',');
    components.push(plugins);
  }

  // Canvas fingerprint
  try {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (ctx) {
      canvas.width = 200;
      canvas.height = 50;
      ctx.textBaseline = 'top';
      ctx.font = '14px Arial';
      ctx.fillStyle = '#f60';
      ctx.fillRect(125, 1, 62, 20);
      ctx.fillStyle = '#069';
      ctx.fillText('Canvas Fingerprint', 2, 15);
      ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
      ctx.fillText('Canvas Fingerprint', 4, 17);

      const dataUrl = canvas.toDataURL();
      components.push(dataUrl.substring(dataUrl.length - 100)); // Last 100 chars
    }
  } catch (e) {
    // Canvas may be blocked
    components.push('canvas-blocked');
  }

  // Combine all components
  const combined = components.join('|||');

  // Generate hash using simple hash function
  const hash = await simpleHash(combined);

  return hash;
}

// Simple hash function (SHA-256 like behavior using built-in crypto API)
async function simpleHash(str: string): Promise<string> {
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const msgUint8 = new TextEncoder().encode(str);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
  }

  // Fallback for environments without crypto.subtle
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(16);
}

// Get or generate fingerprint (with caching)
let cachedFingerprint: string | null = null;

export async function getFingerprint(): Promise<string> {
  if (cachedFingerprint) {
    return cachedFingerprint;
  }

  cachedFingerprint = await generateFingerprint();

  // Store in sessionStorage for consistency during session
  try {
    sessionStorage.setItem('browser_fingerprint', cachedFingerprint);
  } catch (e) {
    // Storage may be disabled
  }

  return cachedFingerprint;
}

// Initialize fingerprint from storage if available
try {
  const stored = sessionStorage.getItem('browser_fingerprint');
  if (stored) {
    cachedFingerprint = stored;
  }
} catch (e) {
  // Storage may be disabled
}
