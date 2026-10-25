import {motion} from './motion.js'

// Settings controls share the host accent and the motion used by the rest of
// the beautify UI. Glows are static, local shadows, never a rendering loop.
export const settingsControlsCss=`
  .dcb-settings {
    --dsh-settings-indicator: var(--dsh-settings-accent);
    --dsh-settings-indicator-shadow: none;
    --dcb-switch-off: rgba(120,120,128,.2);
    --dcb-switch-on: var(--dsh-settings-accent);
    --dcb-switch-border: rgba(60,60,67,.08);
    --dcb-switch-on-border: transparent;
    --dcb-switch-focus: var(--dsh-settings-accent);
    --dcb-switch-shadow: inset 0 1px 2px #00000006;
    --dcb-switch-on-shadow: inset 0 1px 1px #ffffff24,0 2px 6px color-mix(in srgb,var(--dsh-settings-accent) 18%,transparent);
  }
  body[data-ds-dark-theme] .dcb-settings {
    --dsh-settings-indicator: color-mix(in srgb,var(--dsh-settings-accent) 80%,#fff);
    --dsh-settings-indicator-shadow: 0 0 0 3px color-mix(in srgb,var(--dsh-settings-accent) 12%,transparent),0 0 9px color-mix(in srgb,var(--dsh-settings-accent) 65%,transparent),0 0 17px color-mix(in srgb,var(--dsh-settings-accent) 24%,transparent);
    --dcb-switch-off: rgba(120,120,128,.34);
    --dcb-switch-border: #ffffff0d;
    --dcb-switch-on-shadow: inset 0 1px 1px #ffffff30,0 0 12px color-mix(in srgb,var(--dsh-settings-accent) 23%,transparent);
  }
  .dcb-settings .dcb-switch {
    box-sizing:border-box; position:relative; display:inline-flex; flex:none;
    width:44px; height:26px; min-width:44px; padding:0;
    appearance:none; border:1px solid var(--dcb-switch-border); border-radius:999px;
    background:var(--dcb-switch-off); box-shadow:var(--dcb-switch-shadow);
    cursor:pointer; -webkit-tap-highlight-color:transparent; touch-action:manipulation;
    transition:background-color ${motion.time.quick}ms ${motion.ease.color},border-color ${motion.time.quick}ms ${motion.ease.color},box-shadow ${motion.time.control}ms ${motion.ease.color},opacity ${motion.time.quick}ms ${motion.ease.color},transform ${motion.time.control}ms ${motion.ease.snappy};
  }
  /* A 44px touch target without changing the visible settings-row geometry. */
  .dcb-settings .dcb-switch::before { content:''; position:absolute; inset:-10px -1px; border-radius:inherit; }
  .dcb-settings .dcb-switch::after {
    content:''; position:absolute; top:1px; left:1px; width:22px; height:22px;
    border-radius:50%; background:#fff;
    box-shadow:0 1px 3px #00000026,0 2px 5px #00000014,inset 0 0 0 1px #00000004;
    transform:translateX(0); transition:transform ${motion.time.control}ms ${motion.ease.snappy};
  }
  .dcb-settings .dcb-switch[aria-checked="true"] { background:var(--dcb-switch-on); border-color:var(--dcb-switch-on-border); box-shadow:var(--dcb-switch-on-shadow); }
  .dcb-settings .dcb-switch[aria-checked="true"]::after { transform:translateX(18px); }
  .dcb-settings .dcb-switch:active:enabled { transform:scale(.96); }
  .dcb-settings .dcb-switch:focus-visible { outline:2px solid var(--dcb-switch-focus); outline-offset:4px; }
  .dcb-settings .dcb-switch:disabled { opacity:.42; box-shadow:none; cursor:not-allowed; }
  .dcb-settings .dcb-settings-info::before { background:var(--dsh-settings-indicator); box-shadow:var(--dsh-settings-indicator-shadow); }
  .dcb-settings .dcb-style-option::after { transition:background-color ${motion.time.control}ms ${motion.ease.color},border-color ${motion.time.control}ms ${motion.ease.color},opacity ${motion.time.control}ms ${motion.ease.color},box-shadow ${motion.time.control}ms ${motion.ease.color}; }
  .dcb-settings .dcb-style-option[aria-checked="true"]::after { background:var(--dsh-settings-indicator); border-color:var(--dsh-settings-indicator); box-shadow:var(--dsh-settings-indicator-shadow); }
  @media(prefers-reduced-motion:reduce) {
    .dcb-settings .dcb-switch,.dcb-settings .dcb-switch::after,.dcb-settings .dcb-style-option::after { transition:none; }
    .dcb-settings .dcb-switch:active:enabled { transform:none; }
  }
  @media(forced-colors:active) {
    .dcb-settings .dcb-switch { background:ButtonFace; border-color:ButtonText; box-shadow:none; transition:none; }
    .dcb-settings .dcb-switch[aria-checked="true"] { background:Highlight; border-color:Highlight; box-shadow:none; }
    .dcb-settings .dcb-switch::after { background:ButtonText; box-shadow:none; transition:none; }
    .dcb-settings .dcb-switch[aria-checked="true"]::after { background:HighlightText; }
    .dcb-settings .dcb-switch:focus-visible { outline-color:Highlight; }
    .dcb-settings .dcb-settings-info::before,.dcb-settings .dcb-style-option[aria-checked="true"]::after { background:Highlight; border-color:Highlight; box-shadow:none; transition:none; }
    .dcb-settings .dcb-switch:active:enabled { transform:none; }
  }
`
