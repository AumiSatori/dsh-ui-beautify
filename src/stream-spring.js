// Continuous, critically damped scroll compensation. The follower design was
// informed by https://github.com/Laplace-bit/dsh-smooth-stream; this implementation
// only paints offsets over the host's existing scroll position.
const FREQUENCY=12,EPSILON=.18

export function sampleStreamSpring(spring,elapsedMs){
  const seconds=Math.max(0,elapsedMs)/1000,distance=spring.from-spring.to
  const slope=spring.velocity+FREQUENCY*distance,decay=Math.exp(-FREQUENCY*seconds)
  return {
    position:spring.to+(distance+slope*seconds)*decay,
    velocity:(slope-FREQUENCY*(distance+slope*seconds))*decay,
  }
}

export function streamSpring(from,to,velocity=0,started=0){
  const distance=to-from,direction=Math.sign(distance)
  // Carry useful momentum, with a bound that keeps the trajectory on its
  // starting side of the destination even after a layout contraction.
  velocity=direction*Math.min(Math.max(0,direction*velocity),Math.abs(distance)*FREQUENCY)
  const spring={from,to,velocity,started,duration:1200}
  for(let ms=320;ms<=1200;ms+=32){
    const state=sampleStreamSpring(spring,ms)
    if(Math.abs(state.position-to)<EPSILON&&Math.abs(state.velocity)<2){spring.duration=ms;break}
  }
  return spring
}

export function streamSpringKeyframes(spring){
  const steps=Math.ceil(spring.duration/32)
  return Array.from({length:steps+1},(_,index)=>({
    offset:index/steps,
    translate:`0px ${index===steps?spring.to:sampleStreamSpring(spring,index/steps*spring.duration).position}px`,
  }))
}
