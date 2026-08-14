export type ConversionEvent =
  | "pricing_billing_toggle"
  | "pricing_tier_cta_clicked"
  | "pricing_campaign_preview_clicked"
  | "marketing_comparison_interacted";

type EventProperties = Record<string, string | number | boolean>;

declare global {
  interface Window {
    umami?: {
      track?: (eventName: string, properties?: EventProperties) => void;
    };
  }
}

/**
 * Sends aggregate conversion events to the existing privacy-focused analytics endpoint.
 * Deliberately accepts no user identifiers, email addresses, donation amounts, or form values.
 */
export function trackConversion(eventName: ConversionEvent, properties?: EventProperties) {
  if (typeof window === "undefined") return;

  try {
    window.umami?.track?.(eventName, properties);
  } catch {
    // Analytics must never interrupt navigation or conversion actions.
  }
}
