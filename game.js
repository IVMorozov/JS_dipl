'use strict';

class Vector {
  constructor(x = 0, y = 0) {
    this.x = x;
    this.y = y;
  }

  plus(vector) {
    if (vector instanceof Vector) {
      const x = this.x + vector.x;
      const y = this.y + vector.y;
      return new Vector(x, y);
    }
    throw new Error('Можно прибавлять к вектору только вектор типа ');
  }

  times(mult) {
    const x = this.x * mult;
    const y = this.y * mult;
    return new Vector(x, y);
  }
}
/*---------------------------------------------------------*/
class Actor {
  constructor(pos = new Vector(), size = new Vector(1, 1), speed = new Vector()) {
    if (!(pos instanceof Vector) || !(size instanceof Vector) || !(speed instanceof Vector)) {
          throw Error('Ошибка аргументов');
        }
    this.pos = pos;
    this.size = size;
    this.speed = speed;
    this.$type = 'actor';
  }
	act(){}

  get left() {
    return this.pos.x;
  }

  get top() {
    return this.pos.y;
  }

  get right() {
    return this.pos.x + this.size.x;
  }

  get bottom() {
    return this.pos.y + this.size.y;
  }

  get type() {
    return this.$type;
  }

  isIntersect(actor) {
    if (!(actor instanceof Actor) || actor === undefined) {
          throw Error('Ошибка аргументов');
    }

    if (actor === this || actor.size.x < 0 || actor.size.y < 0) {
          return false;
      }

  return !(actor.left >= this.right || actor.right <= this.left || actor.top >= this.bottom || actor.bottom <= this.top);
  }
}
/*---------------------------------------------------------*/

class Level {
  constructor(grid = [], actors = []) {
    this.grid = grid;
    this.actors = actors;
    this.height = grid.length;
    this.width = grid.reduce((accumulator, value) => value.length > accumulator ? value.length : accumulator, 0);
    this.status = null;
    this.finishDelay = 1;
    this.player = actors.find(value => value.type === 'player');
  }

  isFinished() {
    return this.status !== null && this.finishDelay < 0 ? true : false;
  }

  actorAt(actor) {
    if (!actor || !(actor instanceof Actor)) {
      throw Error('Ошибка аргументов');
    }
    return this.actors.find(value => value.isIntersect(actor));
  }

  isObstacle(x, y) {
    const wall = 'wall';
    const lava = 'lava';
    const grid = this.grid;
    return (grid[y] && grid[y][x] && ((grid[y][x] === wall) || (grid[y][x] === lava)));
  }

  obstacleAt(nextPos, size) {
    if (!(nextPos instanceof Vector) ||
        !(size instanceof Vector)) {
      throw Error('Ошибка аргументов');
    }
    const sizeX = size.x - 0.0001;
    const sizeY = size.y - 0.0001;
    const grid = this.grid;
    const x = nextPos.x;
    const y = nextPos.y;
    const left = Math.floor(x);
    const top = Math.floor(y);
    const bottom = Math.floor(y + sizeY);
    const rigth = Math.floor(x + sizeX);
    const middle = Math.round(top + sizeY / 2);

    if (this.isObstacle(left, top)) {
      return grid[top][left];
    }
    if (this.isObstacle(rigth, top)) {
      return grid[top][rigth];
    }
    if (this.isObstacle(left, bottom)) {
        return grid[bottom][left];
    }
    if (this.isObstacle(rigth, bottom)) {
        return grid[bottom][rigth];
    }
    if (this.isObstacle(left, middle)) {
        return grid[middle][left];
    }
    if (this.isObstacle(rigth, middle)) {
        return grid[middle][rigth];
    }
    if (left < 0 || x + sizeX > this.width || top < 0) {
      return 'wall';
    }
    if (y + sizeY > this.height) {
      return 'lava';
    }
  }

  removeActor(actor) {
    this.actors = this.actors.filter(el => el !== actor);
  }

  noMoreActors(type) {
    const result = this.actors.filter(el => el.type === type);
    return result.length > 0 ? false : true;
  }

  playerTouched(type, actor) {
    if (this.status !== null) {
      return;
    }
    if (type === 'lava' || type === 'fireball') {
      this.status = 'lost';
    } else if (type === 'coin') {
      this.removeActor(actor);
      if (!this.actors.find(value => value.type === 'coin')) {
        this.status = 'won';
      }
    }
  }
}
/*---------------------------------------------------------*/

class LevelParser {
  constructor(dic) {
    this.dic = dic;
  }

  actorFromSymbol(symbol) {
    if (!symbol) return;
    const key = Object.keys(this.dic).find(key => key === symbol);
    return key ? this.dic[key] : key;
  }

  obstacleFromSymbol(symbol) {
    switch(symbol) {
      case 'x': return 'wall';
      case '!': return 'lava';
      default: return;
    }
  }

  createGrid(mapOfString) {
    return mapOfString.map(str => str.split('').map(value => {
      if(value === '!') {
        return 'lava';
      } else if (value === 'x') {
        return 'wall';
      }
    }));
  }

  createActors(arrayActors) {
    const arr = arrayActors.map(str => str.split(''));
    const actors = [];
    arr.forEach((row, y) => {
      row.forEach((cell, x) => {
        if (this.dic && this.dic[cell] && typeof this.dic[cell] === 'function') {
          const actor = new this.dic[cell] (new Vector(x, y));
          if (actor instanceof Actor) {
              actors.push(actor);
          }
        }
      });
    });
    return actors;
  }

  parse(plan) {
    const grid = this.createGrid(plan);
    const actors = this.createActors(plan);
    return new Level(grid, actors);
  }
}
/*---------------------------------------------------------*/

class Player extends Actor {
  constructor(loc) {
    super(loc, new Vector(0.8, 1.5));
    this.$type = 'player';
    this.pos.y -= 0.5;
  }
}
/*---------------------------------------------------------*/

class Fireball extends Actor {
  constructor(loc = new Vector(), speed = new Vector()) {
    super(loc, undefined, speed);
    this.$type = 'fireball';
  }

  getNextPosition(time = 1) {
    return new Vector(this.pos.x + this.speed.x * time, this.pos.y + this.speed.y * time);
  }

  handleObstacle() {
    if (this.speed.x > 0 || this.speed.y > 0) {
      this.speed.x = -this.speed.x;
      this.speed.y = -this.speed.y;
    } else {
      this.speed.x = Math.abs(this.speed.x);
      this.speed.y = Math.abs(this.speed.y);
    }
  }

  act(time, level) {
    const nextPos = this.getNextPosition(time);
    const obj = level.obstacleAt(nextPos, this.size);
    if (obj) {
      this.handleObstacle();
      return;
    }
    this.pos = nextPos;
  }
}
/*---------------------------------------------------------*/

class HorizontalFireball extends Fireball {
  constructor(loc) {
    super(loc, new Vector(2, 0));
  }
}
/*---------------------------------------------------------*/

class VerticalFireball extends Fireball {
  constructor(loc) {
    super(loc, new Vector(0, 2));
    `console.log(loc)`
    
  }
}
/*---------------------------------------------------------*/

class FireRain extends Fireball {
  constructor(loc) {
    super(loc, new Vector(0, 3));
    this.start = loc;
    `console.log(this.start)`
    
  }

  handleObstacle() {
    this.pos = this.start;
  }
}
/*---------------------------------------------------------*/

class Coin extends Actor {
  constructor(loc = new Vector()) {
    super(loc, new Vector(0.6, 0.6));
    this.pos.x += 0.2;
    this.pos.y += 0.1;
    this.$type = 'coin';
    this.loc = loc;
    this.springSpeed = 8;
    this.springDist = 0.07;
    this.spring = 2 * Math.random() * Math.PI;
  }

  act(time) {
    const next = this.getNextPosition(time);
    this.pos = next;
  }

  updateSpring(time = 1) {
    this.spring += this.springSpeed * time;
  }

  getSpringVector() {
		return new Vector(0, Math.sin(this.spring) * this.springDist);
  }

  getNextPosition(time = 1) {
    this.updateSpring(time);
		const newVector = this.getSpringVector();
	`console.log(this.loc.y)`
    return new Vector(this.loc.x + newVector.x, this.loc.y + newVector.y);
  }
}
/*---------------------------------------------------------*/

const schemas = [
  [
    "     v                 ",
    "                       ",
    "                       ",
    "                       ",
    "                       ",
    "  |                    ",
    "  o                 o  ",
    "  x               = x  ",
    "  x          o o    x  ",
    "  x  @       xxxxx  x  ",
    "  xxxxx             x  ",
    "      x!!!!!!!!!!!!!x  ",
    "      xxxxxxxxxxxxxxx  ",
    "                       "
  ],
  [
    "        |           |  ",
    "                       ",
    "                       ",
    "                       ",
    "                       ",
    "                       ",
    "                       ",
    "                       ",
    "                       ",
    "     |                 ",
    "                       ",
    "         =      |      ",
    " @ |  o            o   ",
    "xxxxxxxxx!!!!!!!xxxxxxx",
    "                       "
  ],
  [
    "                       ",
    "                       ",
    "                       ",
    "    o                  ",
    "    x      | x!!x=     ",
    "         x             ",
    "                      x",
    "                       ",
    "                       ",
    "                       ",
    "               xxx     ",
    "                       ",
    "                       ",
    "       xxx  |          ",
    "                       ",
    " @                     ",
    "xxx                    ",
    "                       "
  ], [
    "   v         v",
    "              ",
    "         !o!  ",
    "              ",
    "              ",
    "              ",
    "              ",
    "         xxx  ",
    "          o   ",
    "        =     ",
    "  @           ",
    "  xxxx        ",
    "  |           ",
    "      xxx    x",
    "              ",
    "          !   ",
    "              ",
    "              ",
    " o       x    ",
    " x      x     ",
    "       x      ",
    "      x       ",
    "   xx         ",
    "              "
  ]
];
/*---------------------------------------------------------*/

const actorDict = {
  '@': Player,
  'v': FireRain,
  '=': HorizontalFireball,
  '|': VerticalFireball,
  'o': Coin
};
/*---------------------------------------------------------*/

const parser = new LevelParser(actorDict);
runGame(schemas, parser, DOMDisplay)
  .then(() => console.log('Вы выиграли приз!'))
	.catch(error => alert(error)); 
/*	loadLevels()
  .then(schema => runGame(JSON.parse(schema), parser, DOMDisplay))
  .then(() => alert('Вы выиграли приз!'))
  .catch(error => alert(error));*/