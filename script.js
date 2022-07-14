

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

const WHITE = (255, 255, 255);
const RED = 4278190335;
const BLUE = (0, 0, 255);
const GREEN = 4278255360;
const PINK = 4294902015
const PURPLE = (127, 0, 255);

let color = {
  r: 255,
  g: 0,
  b: 0,
  a: 255, // alpha (transparente = 0, totalmente visivel = 255)
}

function handleGreenClick(){
  color.r = 0;
  color.g = 255;
  color.b = 0;
}

function handleRedClick(){
  color.r = 255;
  color.g = 0;
  color.b = 0;
}

function handlePinkClick(){
  color.r = 216;
  color.g = 112;
  color.b = 147;
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
const params = [new ChladniParams(m1, n1, l1)];

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
    // O CANVAS atualiza apenas quando for ser desenhado
    let drawFunc = this.draw.bind(this);
    requestAnimationFrame(function drawLoop() {
      drawFunc();
      requestAnimationFrame(drawLoop);
    });

    // mas a simulação acontece todo milisegundo
    setInterval(this.update.bind(this), 1);
  }

  draw() {
    // so ter isso aqui ganha uns 5 fps???
    // valeu javascript
    const {r, g, b, a} = color;
    const colorBuffer = this.imageData.data
    
    colorBuffer.fill(0);

    for (let i = this.particles.length; i--;) {
      let pos = this.particles[i].pos;
      let index = (Math.round(pos.y) * this.width + Math.round(pos.x)) * 4;

      colorBuffer[index] = r;
      colorBuffer[index+1] = g;
      colorBuffer[index+2] = b;
      colorBuffer[index+3] = a;
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
    // não acho que é necessário tanto Math.round?
    // width e height são inicializados sempre com inteiros
    let gradients = Array(Math.round(this.width * this.height / this.scale));

    for (let particle of this.particles) {
      let x = Math.round(particle.pos.x / this.scale);
      let y = Math.round(particle.pos.y / this.scale);
      let gradientIndex = y * this.width + x;
      let gradient = gradients[gradientIndex];

      // gradiente sera calculado somente quando necessário
      // nem sei se isso ajuda, mas vamos tentar
      // ^^^^^AJUDOU  MUITOOOO
      if (gradient == undefined) {
        // por algum motivo havia a possibilidade de não haver gradiente
        // sla né
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
            gradient = candidates[Math.floor(Math.random() * candidates.length)];
          }
        }

        gradients[gradientIndex] = gradient;
      }

      particle.pos.add(gradient.x, gradient.y);
    }
  }

  update() {
    this.vibrateParticles();
    this.moveTowardsPattern();
  }

  checkFallenParticles(offScreenLimit = 0) {
    for (let particle of this.particles) {
      if (
        particle.pos.x < -offScreenLimit ||
        particle.pos.x > WIDTH + offScreenLimit ||
        particle.pos.y < -offScreenLimit ||
        particle.pos.y > WIDTH + offScreenLimit
      ) {
        particle.pos = new Vector2(Math.random() * WIDTH, Math.random() * HEIGHT);
      }
    }
  }

  computeVibrations(chladniParams) {
    const M = chladniParams.m;
    const N = chladniParams.n;
    const L = chladniParams.l * this.scale;
    this.vibrations = Array.from(Array(Math.round(this.width * this.height)))
    for (let y = 0; y < Math.round(this.height); y++) {
      for (let x = 0; x < Math.round(this.width); x++) {
        var scaledX = x * L;
        var scaledY = y * L;
        var MX = M * scaledX;
        var NX = N * scaledX;
        var MY = M * scaledY;
        var NY = N * scaledY;
        var value = Math.cos(NX) * Math.cos(MY) - Math.cos(MX) * Math.cos(NY);
        value /= 2;
        value *= Math.sign(value);

        var index = y * Math.round(this.width) + x;
        this.vibrations[index] = value;
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
