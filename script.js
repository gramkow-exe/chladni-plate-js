

// Variáveis
const vibration = 1;
const numParticles = 200000
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

// Modificar cor das partículas
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

// Parâmetros para a placa (M, N e L)
var m1 = 4
var n1 = 5
var l1 = 0.04
const params = [new ChladniParams(m1, n1, l1)];

// Classe partícula
class Particle {
  constructor(pos, color, size) {
    this.pos = pos;
    this.color = color;
    this.size = size;
  }
}

// Classe para posição 2D
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

// Classe principal, com métodos de atualização da placa chladni
class ChladniPlate {
  constructor() {
    this.width = Math.ceil(WIDTH / scale);
    this.height = Math.ceil(HEIGHT / scale);
    this.scale = scale;
    this.vibrations = [];
    this.imageData = context.getImageData(0, 0, this.width, this.height);
    this.buffer = new Uint32Array(this.imageData.data.buffer);

    // Cria lista de partículas
    this.particles = [];
    for (let index = 0; index < numParticles; index++) {
      const pos = new Vector2(this.width * Math.random(), this.height * Math.random());
      this.particles.push( new Particle(pos, PURPLE, 1));
    }
    canvas.setAttribute("width", this.width);
    canvas.setAttribute("height", this.height);

    // Computa o padrão uma vez
    this.computeVibrations(params[0]);
    requestAnimationFrame(this.update.bind(this))
  }

  vibrateParticles() {
    // Movimenta as partículas aleatoriamente, simulando a vibração da placa
    for (let i = this.particles.length; i--;) {
      this.particles[i].pos.add(
        (Math.random() - 0.5) * vibration,
        (Math.random() - 0.5) * vibration,
      )
    }
  }

  moveTowardsPattern() {
    // Cria lista de gradientes (nova posição das partículas)
    let gradients = Array(Math.round(this.width * this.height / this.scale));

    for (let particle of this.particles) {
      let x = Math.round(particle.pos.x / this.scale);
      let y = Math.round(particle.pos.y / this.scale);
      let gradientIndex = y * this.width + x;
      let gradient = gradients[gradientIndex];

      // Se o gradiente não existe, ir para a próxima partícula
      if (gradient == undefined) {
        // Se a vibração para essa partícula for muito baixa, a partícula não se move
        if (this.vibrations[gradientIndex] < minVibrationToMove) {
          gradient = new Vector2(0, 0);
        } else {
          let minVibration = 100;
          let candidates = [];

          candidates.push(new Vector2(0, 0));

          // Calcula a nova posição baseado na célula vizinha com maior intensidade de vibração
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

          // Seleciona um vizinho aleatório
          if (candidates.length == 1) {
            gradient = candidates[0];
          } else {
            gradient = candidates[Math.floor(Math.random() * candidates.length)]
          }
        }

        gradients[gradientIndex] = gradient
      }

      // Movimenta a partícula de acordo com o padrão de vibração
      particle.pos.add(gradient.x, gradient.y)
    }
  }

  update() {
    // Vibra as partículas e movimenta elas em direção ao padrão
    this.vibrateParticles();
    this.moveTowardsPattern();

    // Desenha as partículas no canvas
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
    // Verifica se alguma partícula saiu da tela; se sim, reposiciona ela aleatoriamente na tela
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
    // Cálculo principal para padrão de vibração
    const M = chladniParams.m;
    const N = chladniParams.n;
    const L = chladniParams.l * this.scale;
    this.vibrations = Array.from(Array(Math.round(this.width * this.height)))
    for (let y = 0; y < Math.round(this.height); y++) {
      for (let x = 0; x < Math.round(this.width); x++) {
        // Para cada célula/pixel no canvas, calcula a vibração baseado em alguns parâmetros modificáveis
        var scaledX = x * L;
        var scaledY = y * L;
        var MX = M * scaledX;
        var NX = N * scaledX;
        var MY = M * scaledY;
        var NY = N * scaledY;
        var value = Math.cos(NX) * Math.cos(MY) - Math.cos(MX) * Math.cos(NY);
        value /= 2;
        value *= Math.sign(value);

        // Adiciona o novo valor na lista de vibrações
        var index = y * Math.round(this.width) + x;
        this.vibrations[index] = value;
      }
    }

    // Vibra as partículas algumas vezes para espalhá-las para o próximo padrão
    for (let i = 1; i < 15; i++) {
      this.vibrateParticles();
    }

  }
}

var plate = new ChladniPlate()

function handleMoreM(){
  params[0].m +=1
  plate.computeVibrations(params[0])
}

function handleLessM(){
  params[0].m -=1
  plate.computeVibrations(params[0])
}

function handleMoreN(){
  params[0].n +=1
  plate.computeVibrations(params[0])
}

function handleLessN(){
  params[0].n -=1
  plate.computeVibrations(params[0])
}
