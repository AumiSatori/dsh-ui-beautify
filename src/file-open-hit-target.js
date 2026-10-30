// Application logos are decoration inside native file controls. Let the button
// receive the hit, so document-level image viewers cannot steal its activation.
// Native data attributes cover compact, fallback and asynchronously loaded icons.
export const fileOpenHitTargetCss = `
  [data-open-target] img,
  [data-open-path-open] img,
  [data-open-path-more] img,
  [data-open-path-unpreviewable] img { pointer-events:none; cursor:inherit; }
`
