

const vibration = 0;
const numParticles = 40000
const scale = 1;
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

var color = RED


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
const params = [new ChladniParams(4, 1, 0.03)];

class Particle {
  constructor(pos, color, size) {
    this.pos = pos;
    this.color = color;
    this.size = size;
  }
  draw(can) {}
}

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

class ChladniPlate {
  constructor() {
    this.width = Math.ceil(WIDTH / scale);
    this.height = Math.ceil(HEIGHT / scale);
    this.scale = scale;
    this.vibrations = [];
    this.imageData = context.getImageData(0, 0, this.width, this.height);
    this.buffer = new Uint32Array(this.imageData.data.buffer);
    this.particles = [];
    for (let index = 0; index < numParticles; index++) {
      const pos = new Vector2(WIDTH * Math.random(), HEIGHT * Math.random());
      this.particles.push( new Particle(pos, PURPLE, 1));
    }
    canvas.setAttribute("width", this.width);
    canvas.setAttribute("height", this.height);
    this.computeVibrations(params[0]);
    this.update()
    
  }
  vibrateParticles() {
    for (let particle of this.particles) {
      let newPos = new Vector2(
        (Math.random() - 0.5) * vibration,
        (Math.random() - 0.5) * vibration
      );
      particle.pos.add(newPos.x, newPos.y);
    }
  }

  moveTowardsPattern() {
    
    var gradients = Array(Math.round(this.width * this.height))
    for (let y = 1; y < Math.round(this.height) - 1; y++) {
      for (let x = 1; x < Math.round(this.width) - 1; x++) {
        const idx = y * Math.round(this.width) + x;
        const vibration = this.vibrations[idx];

        if (vibration < minVibrationToMove) {
          gradients[idx] = new Vector2(0, 0);
          continue;
        }

        var minVibration = 100;
        var candidates = [];
        candidates.push(new Vector2(0,0))
        for (let ny of [-1, 0, 1]) {
          for (let nx of [-1, 0, 1]) {
            if (ny == 0 && nx == 0) {
              continue;
            }

            const nIdx = (y + ny) * Math.round(this.width) + (x + nx);
            const nVibration = this.vibrations[nIdx];
            
            if (nVibration <= minVibration) {
              if (nVibration < minVibration) {
                minVibration = nVibration;
                // candidates = [];
              }
              candidates.push(new Vector2(nx, ny));
            }
          }
        }
        var chosenIndex  = candidates.length == 1 ? 0 : Math.floor(Math.random() * candidates.length)
        var chosenCandidate = candidates[chosenIndex];
        gradients[idx] = chosenCandidate;
      }
    }
    for (let particle of this.particles) {
      var idx =
        Math.round(particle.pos.y / this.scale) * Math.round(this.width) +
        Math.round(particle.pos.x / this.scale);
      var gradient = gradients[idx];

      if (gradient == undefined){
        continue
      }
      particle.pos.add(gradient.x, gradient.y)
    }
  }

  update() {
    this.vibrateParticles();
    this.moveTowardsPattern();

    this.buffer.fill(4278190080)

    for (let i = 0; i < this.particles.length; i ++) {
        let x = this.particles[i].pos.x;
        let y = this.particles[i].pos.y;

        this.buffer[Math.round(y) * this.width + Math.round(x)] = color;
    }
    context.putImageData(this.imageData, 0, 0);

    requestAnimationFrame(this.update.bind(this));

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
    this.vibrations = Array.from(Array(Math.round(this.width * this.height)).keys())
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

  draw() {
    for (let particle of this.particles) {
      particle.draw();
    }
  }
  

}

new ChladniPlate()
