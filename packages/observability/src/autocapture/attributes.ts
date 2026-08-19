export type AutocaptureAttributes = {
  "data-ph-capture": true;
  [key: `data-ph-capture-attribute-${string}`]: string;
};

export type NoAutocaptureAttributes = {
  "data-ph-no-autocapture": true;
};

function noAutocaptureAttributes(): NoAutocaptureAttributes {
  return { "data-ph-no-autocapture": true };
}

export function autocaptureAttributes(
  properties: Record<string, string | undefined>,
  options?: { capture?: boolean },
): AutocaptureAttributes | NoAutocaptureAttributes {
  if (options?.capture === false) {
    return noAutocaptureAttributes();
  }

  // eslint-disable-next-line anti-slop/no-known-value-widening -- the keys really are open: one data attribute per caller-supplied property.
  const attributes: AutocaptureAttributes = { "data-ph-capture": true };

  for (const [key, value] of Object.entries(properties)) {
    if (value === undefined) continue;
    attributes[`data-ph-capture-attribute-${key}`] = value;
  }

  return attributes;
}
