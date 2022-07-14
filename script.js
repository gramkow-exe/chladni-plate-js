const vibration = 1;
const numParticles = 50000
const scale = 2;
const changePatternDelay = 1e10;
const minVibrationToMove = 0.2;

const HEIGHT = window.innerHeight;
const WIDTH = window.innerWidth;

const canvas = document.createElement("canvas");
const context = canvas.getContext("2d");
document.body.appendChild(canvas);

const RED = 4278190335;
const GREEN = 4278255360;
const PINK = 4294902015

// feio para caralho. mais funciona ? eu acho
const BLACK = (new Uint32Array(new Uint8ClampedArray([0, 0, 0, 255])))[0];

let color = RED
function handleGreenClick(){
  color = GREEN;
}
function handleRedClick(){
  color = RED;
}
function handlePinkClick(){
  color = PINK;
}

class ChladniParams {
  constructor(M, N, L) {
    this.m = M;
    this.n = N;
    this.l = L;
  }
}

var m1 = 2
var n1 = 5
var l1 = 0.04

const params = [
  new ChladniParams(m1, n1, l1)
];

class Vector2 {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }

  add(x, y) {
    this.x += x;
    this.y += y;
  }
}

class Particle {
  constructor(pos, color, size) {
    /** @type {Vector2} */
    this.pos = pos;
    this.color = color;
    this.size = size;
  }
}

class ChladniPlate {
  constructor() {
    this.width = Math.ceil(WIDTH / scale);
    this.height = Math.ceil(HEIGHT / scale);
    this.scale = scale;

    canvas.setAttribute("width", this.width);
    canvas.setAttribute("height", this.height);
    
    /** @type {ImageData} */
    this.imageData = context.getImageData(0, 0, this.width, this.height)

    /** @type {Particle[]} */
    this.particles = Array(numParticles);
    this.vibrations = [];

    for (let i = 0; i < numParticles; i++) {
      let pos = new Vector2(
        this.width * Math.random(),
        this.height * Math.random()
      );

      this.particles[i] = new Particle(pos, 0, 1);
    }
    
    this.computeVibrations(params[0]);
  }

  startLoops() {
    let drawFunc = this.draw.bind(this);
    requestAnimationFrame(function drawLoop() {
      drawFunc();
      requestAnimationFrame(drawLoop);
    });


    setInterval(this.update.bind(this), 1);
  }

  draw() {
    this.imageData.data.fill(0);

    for (let particle of this.particles) {
      let index = Math.round(particle.pos.y) * this.width + Math.round(particle.pos.x);
      index *= 4;

      this.imageData.data[index] = 255;
      this.imageData.data[index+1] = 0;
      this.imageData.data[index+2] = 0;
      this.imageData.data[index+3] = 255;
    }

    context.putImageData(this.imageData, 0, 0);
  }

  vibrateParticles() {
    for (let particle of this.particles) {
      particle.pos.add(
        (Math.random() - 0.5) * vibration,
        (Math.random() - 0.5) * vibration
      );
    }
  }

  moveTowardsPattern() {
    let gradients = Array(Math.round(this.width * this.height / this.scale));

    for (let particle of this.particles) {
      let x = Math.round(particle.pos.x / this.scale);
      let y = Math.round(particle.pos.y / this.scale);
      let gradientIndex = y * this.width + x;
      let gradient = gradients[gradientIndex];

      if (gradient == undefined) {
        if (y < 1 || y >= this.height || x < 1 || x >= this.width) {
          continue;
        }

        if (this.vibrations[gradientIndex] < minVibrationToMove) {
          gradient = new Vector2(0, 0);
        } else {
          let minVibration = 100;
          let candidates = [];

          candidates.push(new Vector2(0, 0));

          for (let nx = -1; nx <= 1; ++nx) {
            for (let ny = -1; ny <= 1; ++ny) {
              if (nx == 0 && ny == 0) {
                continue;
              }
              
              const nIdx = (y + ny) * this.width + (x + nx);
              const nVibration = this.vibrations[nIdx];

              if (nVibration <= minVibration) {
                minVibration = nVibration;
                candidates.push(new Vector2(nx, ny));
              }
            }
          }

          if (candidates.length == 1) {
            gradient = candidates[0];
          } else {
            gradient = candidates[Math.floor(Math.random() * candidates.length)]
          }
        }

        gradients[gradientIndex] = gradient
      }

      particle.pos.add(gradient.x, gradient.y);
    }
  }

  update() {
    this.vibrateParticles();
    this.moveTowardsPattern();
  }

  computeVibrations(chladniParams) {
    const mscale = chladniParams.m * chladniParams.l * this.scale;
    const nscale = chladniParams.n * chladniParams.l * this.scale;

    this.vibrations = Array(this.width * this.height);

    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        let value =
            Math.cos(nscale*x) * Math.cos(mscale*y)
          - Math.cos(mscale*x) * Math.cos(nscale*y);

        let index = y * Math.round(this.width) + x;
        this.vibrations[index] = Math.abs(value/2);
      }
    }
  }
}

let a = new ChladniPlate()
a.startLoops();

function handleMoreH(){
  params[0].m +=1
  a.computeVibrations(params[0])
  console.log(params[0])
  
}

function handleLessH(){
  params[0].m -=1
  a.computeVibrations(params[0])
  console.log(params[0])

}

function handleMoreV(){
  params[0].n +=1
  a.computeVibrations(params[0])
  console.log(params[0])
  
}

function handleLessV(){
  params[0].n -=1
  a.computeVibrations(params[0])
  console.log(params[0])

}
