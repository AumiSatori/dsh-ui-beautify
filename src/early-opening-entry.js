import {startEarlyOpening} from './early-opening.js'
// Injected at the end of the host body, before its deferred module executes.
if(typeof document!=='undefined'&&document.body)startEarlyOpening(document,window)
