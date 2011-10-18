(function() {
  var Ant, Food, NeuralNet, ScentMap, Sim, antID, antWedge, clamp, hudPrint, hudString, rand;
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };
  window.requestAnimFrame = (function() {
    return window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || window.oRequestAnimationFrame || window.msRequestAnimationFrame || function(callback, element) {
      return window.setTimeout(callback, 1000 / 60);
    };
  })();
  rand = function(base, range) {
    return base + (Math.random() * 2 - 1.0) * range;
  };
  clamp = function(v, min, max) {
    return Math.min(max, Math.max(min, v));
  };
  antWedge = Math.PI * 0.5;
  hudString = "";
  hudPrint = function(str) {
    return hudString += str + '<br/>';
  };
  Food = (function() {
    function Food(xCenter, xRange, yCenter, yRange) {
      this.xCenter = xCenter;
      this.xRange = xRange;
      this.yCenter = yCenter;
      this.yRange = yRange;
      this.reset();
    }
    Food.prototype.reset = function() {
      this.amount = 1000;
      this.spawn = 5;
      this.x = rand(this.xCenter, this.xRange);
      return this.y = rand(this.yCenter, this.yRange);
    };
    Food.prototype.loop = function(ctx, dt, draw) {
      if (draw) {
        this.r = this.amount * 0.01;
        ctx.fillStyle = '#9f4';
        ctx.fillRect(this.x - this.r, this.y - this.r, this.r * 2, this.r * 2);
      }
      this.r = this.amount * 0.02;
      if (this.amount <= 300) {
        this.spawn -= dt;
        if (this.spawn <= 0) {
          return this.reset();
        }
      }
    };
    Food.prototype.bite = function(x, y, dt) {
      var res;
      if (this.amount < 0) {
        return 0;
      }
      if (Math.abs(this.x - x) > this.r) {
        return 0;
      }
      if (Math.abs(this.y - y) > this.r) {
        return 0;
      }
      res = 500 * dt;
      this.amount -= res;
      return res;
    };
    return Food;
  })();
  NeuralNet = (function() {
    function NeuralNet(inputCount, outputCount, layerCount, layerSize) {
      var i, l, lastLayer, layer, n, neuron, w, _ref, _ref2, _ref3, _ref4, _ref5, _ref6, _ref7, _ref8;
      this.inputCount = inputCount;
      this.outputCount = outputCount;
      this.layerCount = layerCount;
      this.layerSize = layerSize;
      this.inputs = (function() {
        var _ref, _results;
        _results = [];
        for (i = 0, _ref = this.inputCount; 0 <= _ref ? i < _ref : i > _ref; 0 <= _ref ? i++ : i--) {
          _results.push(0.0);
        }
        return _results;
      }).call(this);
      this.outputs = (function() {
        var _ref, _results;
        _results = [];
        for (i = 0, _ref = this.outputCount; 0 <= _ref ? i < _ref : i > _ref; 0 <= _ref ? i++ : i--) {
          _results.push(0.0);
        }
        return _results;
      }).call(this);
      this.work = [];
      for (l = 0, _ref = this.layerCount; 0 <= _ref ? l < _ref : l > _ref; 0 <= _ref ? l++ : l--) {
        layer = [];
        for (n = 0, _ref2 = this.layerSize; 0 <= _ref2 ? n < _ref2 : n > _ref2; 0 <= _ref2 ? n++ : n--) {
          layer.push(0);
        }
        this.work.push(layer);
      }
      this.layers = [];
      for (i = 0, _ref3 = this.layerCount; 0 <= _ref3 ? i < _ref3 : i > _ref3; 0 <= _ref3 ? i++ : i--) {
        layer = [];
        for (n = 0, _ref4 = this.layerSize; 0 <= _ref4 ? n < _ref4 : n > _ref4; 0 <= _ref4 ? n++ : n--) {
          neuron = [];
          if (i === 0) {
            for (w = 0, _ref5 = this.inputCount; 0 <= _ref5 ? w < _ref5 : w > _ref5; 0 <= _ref5 ? w++ : w--) {
              neuron.push(0);
            }
          } else {
            for (w = 0, _ref6 = this.layerSize; 0 <= _ref6 ? w < _ref6 : w > _ref6; 0 <= _ref6 ? w++ : w--) {
              neuron.push(0);
            }
          }
          layer.push(neuron);
        }
        this.layers.push(layer);
      }
      lastLayer = [];
      for (i = 0, _ref7 = this.outputCount; 0 <= _ref7 ? i < _ref7 : i > _ref7; 0 <= _ref7 ? i++ : i--) {
        neuron = [];
        for (w = 0, _ref8 = this.layerSize; 0 <= _ref8 ? w < _ref8 : w > _ref8; 0 <= _ref8 ? w++ : w--) {
          neuron.push(0);
        }
        lastLayer.push(neuron);
      }
      this.layers.push(lastLayer);
    }
    NeuralNet.prototype.getDNA = function() {
      var layer, n, res, _i, _j, _len, _len2, _ref;
      res = [];
      _ref = this.layers;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        layer = _ref[_i];
        for (_j = 0, _len2 = layer.length; _j < _len2; _j++) {
          n = layer[_j];
          res = res.concat(n);
        }
      }
      return res;
    };
    NeuralNet.prototype.setDNA = function(dna) {
      var i, idx, layer, n, _i, _len, _ref, _results;
      idx = 0;
      _ref = this.layers;
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        layer = _ref[_i];
        _results.push((function() {
          var _j, _len2, _results2;
          _results2 = [];
          for (_j = 0, _len2 = layer.length; _j < _len2; _j++) {
            n = layer[_j];
            _results2.push((function() {
              var _ref2, _results3;
              _results3 = [];
              for (i = 0, _ref2 = n.length; 0 <= _ref2 ? i < _ref2 : i > _ref2; 0 <= _ref2 ? i++ : i--) {
                _results3.push(n[i] = dna[idx++]);
              }
              return _results3;
            })());
          }
          return _results2;
        })());
      }
      return _results;
    };
    NeuralNet.prototype.mutate = function(severity) {
      var i, layer, n, _i, _len, _ref, _results;
      _ref = this.layers;
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        layer = _ref[_i];
        _results.push((function() {
          var _j, _len2, _results2;
          _results2 = [];
          for (_j = 0, _len2 = layer.length; _j < _len2; _j++) {
            n = layer[_j];
            _results2.push((function() {
              var _ref2, _results3;
              _results3 = [];
              for (i = 0, _ref2 = n.length; 0 <= _ref2 ? i < _ref2 : i > _ref2; 0 <= _ref2 ? i++ : i--) {
                _results3.push(n[i] = clamp(n[i] + rand(0, severity), -1, 1));
              }
              return _results3;
            })());
          }
          return _results2;
        })());
      }
      return _results;
    };
    NeuralNet.prototype.clone = function(source) {
      var i, layer, li, neuron, ni, _len, _ref, _results;
      _ref = this.layers;
      _results = [];
      for (li = 0, _len = _ref.length; li < _len; li++) {
        layer = _ref[li];
        _results.push((function() {
          var _len2, _results2;
          _results2 = [];
          for (ni = 0, _len2 = layer.length; ni < _len2; ni++) {
            neuron = layer[ni];
            _results2.push((function() {
              var _ref2, _results3;
              _results3 = [];
              for (i = 0, _ref2 = neuron.length; 0 <= _ref2 ? i < _ref2 : i > _ref2; 0 <= _ref2 ? i++ : i--) {
                _results3.push(neuron[i] = source.layers[li][ni][i]);
              }
              return _results3;
            })());
          }
          return _results2;
        })());
      }
      return _results;
    };
    NeuralNet.prototype.execute = function() {
      var i, l, lastLayer, layer, n, o, oWork, prev, work, _ref, _ref2, _ref3, _ref4, _ref5, _ref6, _results;
      for (n = 0, _ref = this.layerSize; 0 <= _ref ? n < _ref : n > _ref; 0 <= _ref ? n++ : n--) {
        this.work[0][n] = 0;
        layer = this.layers[0][n];
        for (i = 0, _ref2 = this.inputCount; 0 <= _ref2 ? i < _ref2 : i > _ref2; 0 <= _ref2 ? i++ : i--) {
          this.work[0][n] += this.inputs[i] * layer[i];
        }
      }
      for (l = 1, _ref3 = this.layerCount; 1 <= _ref3 ? l < _ref3 : l > _ref3; 1 <= _ref3 ? l++ : l--) {
        work = this.work[l];
        prev = this.work[l - 1];
        for (n = 0, _ref4 = this.layerSize; 0 <= _ref4 ? n < _ref4 : n > _ref4; 0 <= _ref4 ? n++ : n--) {
          work[n] = 0;
          layer = this.layers[l][n];
          for (i = 0, _ref5 = this.layerSize; 0 <= _ref5 ? i < _ref5 : i > _ref5; 0 <= _ref5 ? i++ : i--) {
            work[n] += prev[i] * layer[i];
          }
        }
      }
      oWork = this.work[this.layerCount - 1];
      lastLayer = this.layers[this.layerCount];
      _results = [];
      for (o = 0, _ref6 = this.outputCount; 0 <= _ref6 ? o < _ref6 : o > _ref6; 0 <= _ref6 ? o++ : o--) {
        this.outputs[o] = 0;
        _results.push((function() {
          var _ref7, _results2;
          _results2 = [];
          for (n = 0, _ref7 = this.layerSize; 0 <= _ref7 ? n < _ref7 : n > _ref7; 0 <= _ref7 ? n++ : n--) {
            _results2.push(this.outputs[o] += oWork[n] * lastLayer[o][n]);
          }
          return _results2;
        }).call(this));
      }
      return _results;
    };
    return NeuralNet;
  })();
  antID = 0;
  Ant = (function() {
    function Ant(owner) {
      this.owner = owner;
      this.getNewID();
      this.net = new NeuralNet(4, 4, 8, 4);
      this.net.mutate(0.1);
      this.radius = 10;
      this.x = 0;
      this.y = 0;
      this.maxHealth = 3000;
      this.reset();
    }
    Ant.prototype.teleport = function(x, y) {
      this.x = x;
      this.y = y;
      return null;
    };
    Ant.prototype.reset = function() {
      this.leftLeg = 0;
      this.rightLeg = 0;
      this.health = this.maxHealth * 0.5;
      this.dead = false;
      this.ndx = rand(0, 1);
      this.ndy = Math.sqrt(1 - this.ndx * this.ndx);
      if (Math.random() > 0.5) {
        this.ndy = -this.ndy;
      }
      this.age = 0;
      this.sinceFood = 0;
      this.collided = 0;
      return null;
    };
    Ant.prototype.getNewID = function() {
      return this.id = antID++;
    };
    Ant.prototype.loop = function(ctx, dt, draw) {
      var angle, ate, circumference, co, div, energy, food, inl, inr, legScale, m00, m01, m10, m11, m20, m21, res, scent, si, tRadius, tX, tY, txx, tyy;
      if (!this.dead) {
        this.age += dt;
        this.sinceFood += dt;
        ate = 0;
        if ((this.health / this.maxHealth) < 1) {
          food = this.owner.getFood(this.x, this.y, dt);
          if (food > 0) {
            ate = 1;
            this.sinceFood = 0;
          }
          this.health += food;
        }
        scent = this.owner.getScent(this.x, this.y);
        this.net.inputs[0] = this.health / this.maxHealth;
        this.net.inputs[1] = clamp(this.sinceFood * 0.2, 0, 1);
        this.net.inputs[2] = scent[0] / 255.0;
        this.net.inputs[3] = scent[1] / 255.0;
        this.net.execute();
        legScale = 10;
        this.leftLeg = clamp(this.net.outputs[0] * legScale, -70, 80);
        this.rightLeg = clamp(this.net.outputs[1] * legScale, -70, 80);
        if (this.net.outputs[2] > 0) {
          this.owner.scentMap.markGreen(this.x, this.y);
        }
        if (this.net.outputs[3] > 0) {
          this.owner.scentMap.markRed(this.x, this.y);
        }
        energy = 15 + (Math.abs(this.leftLeg) + Math.abs(this.rightLeg)) * 0.1;
        this.health -= dt * energy;
        if (this.health < 0) {
          this.dead = true;
          this.health = 0;
        }
      }
      if (!this.dead) {
        inl = 1.0 / this.leftLeg;
        inr = 1.0 / this.rightLeg;
        div = inl - inr;
        if (div === 0) {
          this.x += dt * this.leftLeg * this.ndx;
          this.y += dt * this.leftLeg * this.ndy;
        } else {
          if (this.leftLeg === 0 || this.rightLeg === 0) {
            tRadius = this.radius;
          } else {
            tRadius = Math.abs(this.radius * (inl + inr) / div);
          }
          circumference = Math.PI * (tRadius + this.radius) * 2;
          if (Math.abs(this.leftLeg) > Math.abs(this.rightLeg)) {
            angle = this.leftLeg / -circumference * dt * Math.PI * 2;
            tX = this.x - this.ndy * tRadius;
            tY = this.y + this.ndx * tRadius;
          } else {
            angle = this.rightLeg / circumference * dt * Math.PI * 2;
            tX = this.x + this.ndy * tRadius;
            tY = this.y - this.ndx * tRadius;
          }
          if (draw) {
            ctx.fillStyle = '#555';
            ctx.strokeStyle = '#555';
            ctx.fillRect(tX, tY, 2, 2);
            ctx.beginPath();
            ctx.arc(tX, tY, Math.abs(tRadius), 0, Math.PI * 2, true);
            ctx.closePath();
            ctx.stroke();
          }
          si = Math.sin(angle);
          co = Math.cos(angle);
          m00 = co;
          m01 = -si;
          m10 = si;
          m11 = co;
          m20 = -tX * co - tY * si + tX;
          m21 = -tX * -si - tY * co + tY;
          txx = this.x;
          tyy = this.y;
          this.x = txx * m00 + tyy * m10 + m20;
          this.y = txx * m01 + tyy * m11 + m21;
          txx = this.ndx;
          tyy = this.ndy;
          this.ndx = txx * m00 + tyy * m10;
          this.ndy = txx * m01 + tyy * m11;
        }
      }
      if (this.dead) {
        res = 0;
      } else {
        res = 1;
      }
      if (!draw) {
        return res;
      }
      ctx.save();
      ctx.transform(this.ndx, this.ndy, -this.ndy, this.ndx, this.x, this.y);
      ctx.fillStyle = '#000';
      ctx.beginPath();
      ctx.arc(0, 0, this.radius, -antWedge, antWedge, false);
      ctx.closePath();
      ctx.fill();
      if (!this.dead) {
        ctx.beginPath();
        ctx.arc(0, 0, this.radius * this.health / this.maxHealth * 2.0, -antWedge, antWedge, true);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = ['rgb(', (this.leftLeg * -5).toFixed(0), ',', (this.leftLeg * 5).toFixed(0), ',1)'].join('');
        ctx.fillRect(-this.radius, -this.radius, this.radius * 2, -2);
        ctx.fillStyle = ['rgb(', (this.rightLeg * -5).toFixed(0), ',', (this.rightLeg * 5).toFixed(0), ',1)'].join('');
        ctx.fillRect(-this.radius, this.radius, this.radius * 2, 2);
      }
      ctx.restore();
      return res;
    };
    Ant.prototype.inspect = function() {
      var i, ins, layer, _i, _len, _ref;
      ins = "<table>";
      ins += "<tr><td>" + ((function() {
        var _i, _len, _ref, _results;
        _ref = this.net.inputs;
        _results = [];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          i = _ref[_i];
          _results.push(i.toFixed(2));
        }
        return _results;
      }).call(this)).join('</td><td>') + "</td></tr>";
      _ref = this.net.work;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        layer = _ref[_i];
        ins += "<tr><td>" + ((function() {
          var _j, _len2, _results;
          _results = [];
          for (_j = 0, _len2 = layer.length; _j < _len2; _j++) {
            i = layer[_j];
            _results.push(i.toFixed(2));
          }
          return _results;
        })()).join('</td><td>') + "</td></tr>";
      }
      ins += "<tr><td>" + ((function() {
        var _j, _len2, _ref2, _results;
        _ref2 = this.net.outputs;
        _results = [];
        for (_j = 0, _len2 = _ref2.length; _j < _len2; _j++) {
          i = _ref2[_j];
          _results.push(i.toFixed(2));
        }
        return _results;
      }).call(this)).join('</td><td>') + "</td></tr>";
      ins += "</table>";
      return ins;
    };
    return Ant;
  })();
  ScentMap = (function() {
    function ScentMap(scentMapName, worldW, worldH) {
      this.scentMapName = scentMapName;
      this.worldW = worldW;
      this.worldH = worldH;
      this.canvas = $(this.scentMapName)[0];
      this.ctx = $(this.scentMapName)[0].getContext("2d");
      this.w = $(this.scentMapName).attr('width');
      this.h = $(this.scentMapName).attr('height');
      this.map = this.ctx.getImageData(0, 0, this.w, this.h);
      this.clear();
      this.decay = 0;
      this.toMapX = this.w / this.worldW;
      this.toMapY = this.h / this.worldH;
    }
    ScentMap.prototype.clear = function() {
      var pi, pix, _ref;
      pix = this.map.data;
      for (pi = 0, _ref = pix.length; pi < _ref; pi += 4) {
        pix[pi] = 0;
        pix[pi + 1] = 0;
        pix[pi + 2] = 0;
        pix[pi + 3] = 128;
      }
      return this.decay = 0;
    };
    ScentMap.prototype.markGreen = function(x, y) {
      var pi, pix, px, py;
      px = Math.floor(x * this.toMapX);
      py = Math.floor(y * this.toMapY);
      if (px < 0 || px >= this.w || py < 0 || py >= this.h) {
        return 0;
      }
      pix = this.map.data;
      pi = (py * this.w + px) * 4;
      return pix[pi + 1] = 255;
    };
    ScentMap.prototype.markRed = function(x, y) {
      var pi, pix, px, py;
      px = Math.floor(x * this.toMapX);
      py = Math.floor(y * this.toMapY);
      if (px < 0 || px >= this.w || py < 0 || py >= this.h) {
        return 0;
      }
      pix = this.map.data;
      pi = (py * this.w + px) * 4;
      return pix[pi] = 255;
    };
    ScentMap.prototype.readMap = function(x, y) {
      var pi, pix, px, py;
      px = Math.floor(x * this.toMapX);
      py = Math.floor(y * this.toMapY);
      if (px < 0 || px >= this.w || py < 0 || py >= this.h) {
        return [0, 0];
      }
      pix = this.map.data;
      pi = (py * this.w + px) * 4;
      return [pix[pi], pix[pi + 1]];
    };
    ScentMap.prototype.loop = function(ctx, dt, draw) {
      var decay, pi, pix, _ref;
      pix = this.map.data;
      this.decay += dt * 7;
      if (this.decay > 1) {
        decay = Math.floor(this.decay);
        this.decay -= decay;
        for (pi = 0, _ref = pix.length; pi < _ref; pi += 4) {
          pix[pi] -= decay;
          pix[pi + 1] -= decay;
        }
      }
      if (draw) {
        this.ctx.clearRect(0, 0, this.w, this.h);
        this.ctx.putImageData(this.map, 0, 0);
        return ctx.drawImage(this.canvas, 0, 0, this.worldW, this.worldH);
      }
    };
    return ScentMap;
  })();
  Sim = (function() {
    function Sim(canvasName, sparkCanvasName, scentMapName) {
      var foodx, foodxr, foody, foodyr, num;
      this.canvasName = canvasName;
      this.sparkCanvasName = sparkCanvasName;
      this.ctx = $(canvasName)[0].getContext("2d");
      this.width = $(canvasName).width();
      this.height = $(canvasName).height();
      this.elapsed = 0;
      this.drawSkip = 0;
      this.scentMap = new ScentMap(scentMapName, this.width, this.height);
      this.generation = 0;
      if (true) {
        foodx = this.width / 3;
        foodxr = this.width / 4;
        foody = this.height / 2;
        foodyr = this.height / 3;
      } else {
        foodx = 200;
        foodxr = 100;
        foody = 200;
        foodyr = 100;
      }
      this.ants = (function() {
        var _results;
        _results = [];
        for (num = 1; num <= 10; num++) {
          _results.push(new Ant(this));
        }
        return _results;
      }).call(this);
      this.foods = (function() {
        var _results;
        _results = [];
        for (num = 1; num <= 15; num++) {
          _results.push(new Food(foodx, foodxr, foody, foodyr));
        }
        return _results;
      })();
      this.lastBestTime = 0;
      this.bestRunningAverage = 0;
      this.sparkData = [];
      this.startNewGeneration();
    }
    Sim.prototype.collide = function(xx, yy) {
      var x, y;
      x = clamp(xx, 0, this.width);
      y = clamp(yy, 0, this.height);
      return [x, y, xx !== x || yy !== y];
    };
    Sim.prototype.getFood = function(x, y, dt) {
      var food, yum, _i, _len, _ref;
      yum = 0;
      _ref = this.foods;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        food = _ref[_i];
        yum += food.bite(x, y, dt);
      }
      return yum;
    };
    Sim.prototype.startNewGeneration = function() {
      var ant, anySwaps, food, i, id, mutation, swapPass, w, _i, _j, _k, _len, _len2, _len3, _ref, _ref2, _ref3, _ref4;
      this.elapsed = 0;
      id = "<p>Ant: " + this.ants[0].id + " gen / " + (this.lastBestTime.toFixed(2)) + " secs last time / " + (this.bestRunningAverage.toFixed(2)) + " secs average</p>";
      id += "<p class='dna'><i>" + (((function() {
        var _i, _len, _ref, _results;
        _ref = this.ants[0].net.getDNA();
        _results = [];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          w = _ref[_i];
          _results.push(w.toFixed(2));
        }
        return _results;
      }).call(this)).join('</i><i>')) + " </i></p>";
      $('#ant-id').html(id);
      _ref = this.ants;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        ant = _ref[_i];
        ant.age += ant.health / ant.maxHealth;
      }
      anySwaps = false;
      swapPass = __bind(function() {
        var r, _ref2, _ref3, _results;
        _results = [];
        for (r = 0, _ref2 = this.ants.length - 1; 0 <= _ref2 ? r < _ref2 : r > _ref2; 0 <= _ref2 ? r++ : r--) {
          _results.push(this.ants[r].age < this.ants[r + 1].age ? (anySwaps = true, (_ref3 = [this.ants[r + 1], this.ants[r]], this.ants[r] = _ref3[0], this.ants[r + 1] = _ref3[1], _ref3)) : void 0);
        }
        return _results;
      }, this);
      swapPass();
      while (anySwaps) {
        anySwaps = false;
        swapPass();
      }
      this.lastBestTime = this.ants[0].age;
      this.bestRunningAverage += (this.lastBestTime - this.bestRunningAverage) * 0.02;
      if ((this.generation % 50) === 0) {
        this.sparkData.push(this.bestRunningAverage);
      }
      mutation = 0.15;
      if (this.bestRunningAverage > 200) {
        mutation /= 10;
      }
      if (this.bestRunningAverage > 500) {
        mutation /= 100;
      }
      if (this.bestRunningAverage > 1000) {
        mutation /= 200;
      }
      for (i = 5, _ref2 = this.ants.length; 5 <= _ref2 ? i < _ref2 : i > _ref2; 5 <= _ref2 ? i++ : i--) {
        this.ants[i].net.clone(this.ants[i % 5].net);
        this.ants[i].net.mutate(mutation * 10);
        this.ants[i].id = this.generation;
      }
      this.ants[this.ants.length - 1].net.mutate(0.15);
      for (i = 0; i < 5; i++) {
        this.ants[i].net.mutate(mutation);
      }
      _ref3 = this.foods;
      for (_j = 0, _len2 = _ref3.length; _j < _len2; _j++) {
        food = _ref3[_j];
        food.reset();
      }
      _ref4 = this.ants;
      for (_k = 0, _len3 = _ref4.length; _k < _len3; _k++) {
        ant = _ref4[_k];
        ant.reset();
        ant.teleport(rand(this.width / 2, 100), rand(this.height / 4, 20));
      }
      this.scentMap.clear();
      this.scentTimer = 0;
      this.drawSpark();
      this.generation++;
      return null;
    };
    Sim.prototype.subloop = function(dt, draw) {
      var alive, ant, food, _i, _j, _len, _len2, _ref, _ref2;
      this.scentMap.loop(this.ctx, dt, draw);
      _ref = this.foods;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        food = _ref[_i];
        food.loop(this.ctx, dt, draw);
      }
      alive = 0;
      _ref2 = this.ants;
      for (_j = 0, _len2 = _ref2.length; _j < _len2; _j++) {
        ant = _ref2[_j];
        alive += ant.loop(this.ctx, dt, draw);
      }
      this.elapsed += dt;
      this.scentTimer += dt;
      return alive;
    };
    Sim.prototype.loop = function(dt) {
      var alive, deadline, tick, _ref;
      hudString = "";
      for (tick = 1, _ref = window.drawSkipCount; 1 <= _ref ? tick < _ref : tick > _ref; 1 <= _ref ? tick++ : tick--) {
        this.subloop(dt, false);
      }
      this.ctx.clearRect(0, 0, this.width, this.height);
      alive = this.subloop(dt, true);
      deadline = 500;
      if (this.generation > 500) {
        deadline = 5000;
      }
      if (this.elapsed > deadline || alive === 0) {
        this.startNewGeneration();
      }
      hudPrint("elapsed: " + this.elapsed.toFixed(2) + " secs");
      hudPrint("" + alive + " ants alive");
      hudPrint("generation " + this.generation);
      $('#output').html(hudString);
      $('#ant-inspect').html(this.ants[0].inspect());
      return true;
    };
    Sim.prototype.drawSpark = function() {
      var ctx, h, max, p, stepX, stepY, w, x, _len, _ref;
      if (this.sparkCanvasName != null) {
        ctx = $(this.sparkCanvasName)[0].getContext("2d");
        w = $(this.sparkCanvasName).width();
        h = $(this.sparkCanvasName).height();
        ctx.clearRect(0, 0, w, h);
        max = Math.max.apply(this, this.sparkData);
        stepX = w / (this.sparkData.length - 1);
        stepY = h / max;
        ctx.beginPath();
        _ref = this.sparkData;
        for (x = 0, _len = _ref.length; x < _len; x++) {
          p = _ref[x];
          ctx.lineTo(x * stepX, h - p * stepY);
        }
        return ctx.stroke();
      }
    };
    Sim.prototype.getScent = function(x, y) {
      return this.scentMap.readMap(x, y);
    };
    return Sim;
  })();
  $(document).ready(function() {
    var animLoop, net;
    window.sim = new Sim('#stage', '#age-spark', '#scent-map');
    window.simSpeed = 0.01;
    window.drawSkipCount = 100;
    $('#realtime').click(function() {
      window.drawSkipCount = 0;
      return window.simSpeed = 0.001;
    });
    $('#fast').click(function() {
      window.drawSkipCount = 0;
      return window.simSpeed = 0.01;
    });
    $('#reallyfast').click(function() {
      window.drawSkipCount = 1000;
      return window.simSpeed = 0.01;
    });
    $('#realtime').click();
    animLoop = function(frameCallback, element) {
      var frameExec, lastFrame, running;
      running = new Date;
      lastFrame = new Date;
      frameExec = function(now) {
        if (running !== false) {
          now = now != null ? now : new Date;
          running = frameCallback((now - lastFrame) * window.simSpeed);
          lastFrame = now;
          if (window.drawSkipCount === 0) {
            return requestAnimFrame(frameExec, element);
          } else {
            return setTimeout(frameExec, 1);
          }
        }
      };
      return frameExec(lastFrame);
    };
    animLoop(function(deltaT) {
      return sim.loop(deltaT);
    }, $('#stage').get(0));
    net = new NeuralNet(2, 2, 2, 4);
    net.inputs[0] = rand(100, 50);
    net.inputs[1] = rand(100, 50);
    net.execute();
    return console.log(net, net.outputs[0], net.outputs[1]);
  });
}).call(this);
