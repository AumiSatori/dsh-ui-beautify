// Only the content controls are unfilled. The outer glass material, scope switch,
// optical highlights and file reader keep their original styles and motion.
const values=name=>`:is([${name}="clear"],[${name}="css"],[${name}="glass"])`
const panel=`:is(.dcb-summary,[data-dcb-task-panel])${values('data-card-style')}`

export const glassSurfacesCss=`
 @media(forced-colors:none) {
  body ${panel} { --dcb-content-tile:transparent; }
  body ${panel} :is(.dcb-module-toggle,.dcb-resource-summary,.dcb-plan-toggle,.dcb-follow,.dcb-turn-navigation button,.dcb-close) { background:transparent!important; }
  body ${panel} :is(.dcb-output,.dcb-artifact,.dcb-artifact-cover,.dcb-artifact-placeholder,.dcb-tile) { background:transparent!important; }
  body ${panel} :is(.dcb-output,.dcb-artifact):is(:hover,:focus-visible,:focus-within) { background:var(--dcb-content-hover,rgba(127,127,127,.08))!important; }
  body ${panel} .dcb-artifact:is(:hover,:focus-within) > .dcb-artifact-open { background:transparent!important; }
 }
`
