// Built-in interactive cube opening. The scene is designed and built in the
// separate dsh-cube-opening workspace; vendor/cube-opening/scene.js is its
// prebuilt output (three.js bundled, no network). It runs in the same
// sandboxed iframe as code openings and ends with window.dshWelcomeDone().
import {cubeSceneScript} from '../vendor/cube-opening/scene.js'
export {cubeLogo} from './welcome-cube-logo.js'

export function cubeOpeningSource({logo=null,text='DeepSeek Harness'}={}){
  const config=JSON.stringify({logo,text}).replace(/</g,'\u003c')
  return `<script>window.__dcbCube=${config}</script><script>${cubeSceneScript}</script>`
}
