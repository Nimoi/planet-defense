/* Planetary Defense
* - Defend your planets against attackers
* - Build and upgrade defenses
* - Expand your planetary empire
*/
var canvas;
window.onload = function() {
	// Init app
	canvas = document.getElementById('stage');
	app.initialize();
	// Pause when window loses focus
	window.addEventListener('blur', function() {
		//app.menus.pause.activate();
	});
	// Canvas Handlers
	canvas.addEventListener('click', app.clickHandle);
}
var app = {
	width: 640,
	height: 360,
	stars: [],
	planet: {},
	towers: [],
	enemies: [],
	projectiles: [],
	newTower: {},
	spawnRate: 0.01,
	numEnemies: 1,
	FPS:30,
	mode:'normal', // Hard mode enables enemies to attack towers
	initialize: function() {
		// Init canvas
		canvas.width  = app.width;
		canvas.height = app.height;
		ctx = canvas.getContext("2d");
		// Init entities
		app.initStars();
		app.initPlanet();
		app.spawnEnemies();
		// Start main loop
		setInterval(app.gameLoop, 1000/app.FPS);
	},
	menus: {
		gameplay: {
			towers: {
				height: 40,
				buttons: [{
						name: 'basic',
						x: 120,
						y: 10,
						size: 12,
						boundx: 100,
						boundy: 0,
						boundw: 40,
						boundh: 40,
						price: 15,
						range: 60,
						style: 'rgba(0,132,255,1)'
					}, {
						name: 'laser',
						x: 162,
						y: 10,
						size: 12,
						boundx: 142,
						boundy: 0,
						boundw: 40,
						boundh: 40,
						price: 25,
						range: 50,
						style: "#FF8638"
					}, {
						name: 'shock',
						x: 204,
						y: 10,
						size: 12,
						boundx: 184,
						boundy: 0,
						boundw: 40,
						boundh: 40,
						price: 40,
						range: 20,
						style: "#EFC94C"
					}, {
						name: 'rocket',
						x: 246,
						y: 10,
						size: 12,
						boundx: 226,
						boundy: 0,
						boundw: 40,
						boundh: 40,
						price: 60,
						range: 40,
						style: "#F3210A"
					},
				],
				draw: function() {
					var context = app.menus.gameplay.towers;
					// Menu background
					ctx.fillStyle = "rgba(25, 25, 25, 0.5)";
					ctx.fillRect(0, 0, app.width, context.height);
					// Menu border
					ctx.fillStyle = "rgba(255, 255, 255, 0.1)";
					ctx.fillRect(0, context.height, app.width, 1);
					// Display cash
					ctx.font = "bold 16px Helvetica";
					ctx.fillStyle = "#F9E873";
					if(app.player.cash < 1000) {
						var str = "$ "+app.player.cash+"m";
					} else {
						var numbil = app.player.cash*0.001;
						var str = "$ "+numbil.toFixed(1)+"b";
					}
					var x = 10;
					var y = 25;
					ctx.fillText(str, x, y);
					// Display buttons
					for(i=0;i < context.buttons.length;i++) {
						// Button Background
						var width = 40;
						ctx.fillStyle = "rgba(45, 45, 45, 0.5)";
						ctx.fillRect(context.buttons[i].boundx, 
							context.buttons[i].boundy, 
							context.buttons[i].boundw, 
							context.buttons[i].boundh);
						// Preview tower
						// Tower styles
						var style = context.buttons[i].style;
						if(app.player.cash < context.buttons[i].price) {
							style = 'rgba(200,200,200,0.7)';
						}
						// Center preview
						var x = context.buttons[i].x - 6;
						ctx.fillStyle = style;
						ctx.fillRect(x, context.buttons[i].y, 12, 12);
						// Draw price
						if(app.player.cash >= context.buttons[i].price) {
							ctx.fillStyle = "rgba(255, 255, 255, 1)";
						} else {
							ctx.fillStyle = 'rgba(230, 230, 230, 0.7)';
						}
						ctx.font = "10px Helvetica";
						var str = "$"+context.buttons[i].price;
						var x = context.buttons[i].x - (ctx.measureText(str).width/2);
						var y = context.buttons[i].y + 12 + 12;
						ctx.fillText(str, x, y);
					};
				},
			},
			timer: {
				startTime: Date.now(),
				elapsedTime: function() {
					var time = Date.now() - app.menus.gameplay.timer.startTime - app.menus.pause.elapsedTime;
					var s = time/1000;
					var str = "";
					if (s > 86400) {
						str = ~~(s/86400) + "d ";
						s %= 86400;
					}
					if (s > 3600) {
						str += ~~(s/3600) + "h ";
						s %= 3600;
					}
					if (s > 60) {
						str += ~~(s/60) + "m ";
						s %= 60;
					}
					str += s.toFixed(1) + "s";
					return str;
				},
				draw: function() {
					var str = app.menus.gameplay.timer.elapsedTime();
					ctx.font = "10px Helvetica";
					var x = 560-ctx.measureText(str).width;
					var y = 24;
					ctx.fillText(str, x, y);
				},
			},
			health: {
				draw: function() {
					// Background
					w = 100;
					h = 8;
					var x = (app.width/2) - (w/2);
					var y = 42;
					ctx.fillStyle = "rgba(255, 255, 255, 0.1)";
					ctx.fillRect(x, y, w, h);
					// Health
					y += 1;
					h -= 2;
					ctx.fillStyle = "rgba(149, 209, 39, 0.9)";
					ctx.fillRect(x, y, app.planet.hp, h);
				},
			},
		},
		pause: {
			active: false,
			pauseTime: 0,
			elapsedTime: 0,
			activate: function() {
				if(app.state.current == 'gameplay') {
					if(!app.menus.pause.active) {
						app.menus.pause.active = true;
						app.menus.fade(); 
						app.menus.pause.draw();
					}
				}
			},
			toggle: function() {
				if(app.state.current == 'gameplay') {
					if(!app.menus.pause.active) {
						app.menus.pause.pauseTime = Date.now();
						app.menus.pause.active = true;
						app.menus.fade();
						app.menus.pause.draw();
					} else {
						app.menus.pause.elapsedTime = app.menus.pause.elapsedTime + (Date.now() - app.menus.pause.pauseTime);
						app.menus.pause.active = false;
						console.log('Time paused: '+app.menus.pause.elapsedTime);
						console.log('Time played: '+app.elapsedTime());
					}
				}
			},
			draw: function() {
				// Draw text
				ctx.font = "30px Helvetica";
				ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
				var str = "PAUSED";
				var x = (app.width/2) - (ctx.measureText(str).width/2);
				ctx.fillText(str, x, 160);

				ctx.font = "14px Helvetica";
				ctx.fillStyle = "rgba(255, 255, 255, 1)";
				var str = "Click to resume";
				var x = (app.width/2) - (ctx.measureText(str).width/2);
				ctx.fillText(str, x, 200);
			},
			button: {
				x: 580,
				y: 0,
				w: 47,
				h: 40,
				str: "PAUSE",
				draw: function() {
					var current = app.menus.pause.button;
					ctx.font = "14px Helvetica";
					ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
					ctx.fillText(current.str, current.x, 24);
				},
			},
		},
		gameOver: {
			active: false,
			finalTime: 0,
			activate: function() {
				if(!app.menus.gameOver.active) {
					app.menus.gameOver.active = true;
					app.state.current = 'gameover';
					app.menus.gameOver.finalTime = app.menus.gameplay.timer.elapsedTime();
				}
			},
			draw: function() {
				// Draw text
				ctx.font = "30px Helvetica";
				ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
				var str = "GAME OVER";
				var x = (app.width/2) - (ctx.measureText(str).width/2);
				ctx.fillText(str, x, 160);
				// Draw time
				ctx.font = "16px Helvetica";
				ctx.fillStyle = "#DA0734";
				var str = "You survived: "+app.menus.gameOver.finalTime;
				var x = (app.width/2) - (ctx.measureText(str).width/2);
				ctx.fillText(str, x, 200);
			},
			end: function() {
				// End game
				app.menus.fade();
				app.menus.gameOver.draw();
			}
		},
		fade: function() {
			// Darken background
			ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
			ctx.fillRect(0, 0, app.width, app.height);
		},
	},
	state: {
		current: 'gameplay',
		gameplay: function() {
			// Game is active
			if(!app.menus.pause.active) {
				app.clearCanvas();
				app.drawStars();
				app.sun.draw();
				app.drawPlanet();
				// Particles
				if(app.particles.items.length > 0) {
					app.particles.draw();
				}
				// Move projectiles
				if(app.projectiles.length > 0) {
					app.updateProjectiles();
				}
				// Display towers
				if(app.towers.length > 0) {
					app.updateTowers();
				}
				// Move enemies
				if(app.enemies.length > 0) {
					app.updateEnemies();
				}
				// Float text
				if(app.floats.length > 0) {
					app.updateFloats();
				}
				// Place-tower indicator
				if(app.placeNewTower == true) {
					app.addTower.updateNewTower();
				}
				// Spawn enemies
				if(!app.menus.gameOver.active) {
					app.spawnWave();
				}
				// Display tooltip
				if(app.tooltip.active) {
					app.tooltip.draw(); 
				}
				// Game Over
				if(app.menus.gameOver.active) {
					app.menus.gameOver.end();
				} else {
					// Only draw UI while game is active
					app.menus.gameplay.towers.draw();
					app.menus.gameplay.timer.draw();
					app.menus.gameplay.health.draw();
					app.menus.pause.button.draw();
				}
			}
			if(app.planet.hp <= 0) {
				app.menus.gameOver.activate();
			}
		},
	},
	player: {
		cash: 50,
		addCash: function(amount) {
			app.player.cash += amount;
		},
	},
	gameLoop: function() {
		if(app.state.current == 'gameplay') {
			app.state.gameplay();
		} else if(app.state.current == 'gameover') {
			app.state.gameplay();
		}
	},
	clearCanvas: function() {
		ctx.clearRect(0,0,app.width,app.height);
	},
	initStars: function() {
        for (i=0; i<=140; i++) {
          // Get random positions for stars
          var starx = ~~(Math.random() * (app.width*2));
          var stary = ~~(Math.random() * app.height);

          // Make the stars white
          starFill = "rgba(255, 255, 255, "+Math.random()+")";

          // Get random size for stars
          starSize = ~~(Math.random() * 3);
          app.stars.push([starFill, starx, stary, starSize]);
        }
	},
	drawStars: function() {
		for (i=0; i < app.stars.length; i++) {
			if(app.planet.hp > 0) {
				app.stars[i][1] += 0.19;
				if(app.stars[i][1] > (app.width*2)) {
					app.stars[i][1] = -app.stars[i][3];
				}
			}
			var x = app.stars[i][1];
			var y = app.stars[i][2];
			// Draw the given star
			ctx.fillStyle = app.stars[i][0];
			ctx.beginPath();
			ctx.arc(x, y, app.stars[i][3], 0, Math.PI * 2, true);
			ctx.closePath();
			ctx.fill();
		}
	},
	sun: {
		pos: {
			x:-200,
			y:50
		},
		draw: function() {
			// Sun
			var size = 20;
			var glow = 200;
			if(app.planet.hp > 0) {
				app.sun.pos.x += 0.2;
				app.sun.pos.y += 0.02;
				if(app.sun.pos.x > (app.width*2)) {
					app.sun.pos.x = -glow;
					app.sun.pos.y = 50;
				}
			}
			var x = app.sun.pos.x;
			var y = app.sun.pos.y;
			ctx.fillStyle = "#EEF66C";
			ctx.beginPath();
			ctx.arc(x, y, size, 0, Math.PI * 2, true);
			ctx.closePath();
			ctx.fill();
			// Glow
			var innerRadius = 1;
			var outerRadius = glow;
			var gradient = ctx.createRadialGradient(x, y, innerRadius, x, y, outerRadius);
			gradient.addColorStop(0, "rgba(253,184,19,0.15)");
			gradient.addColorStop(1, "rgba(255,255,255,0)");
	    	ctx.fillStyle = gradient;
	    	ctx.beginPath();
			ctx.arc(x, y, glow, 0, Math.PI * 2, true);
			ctx.closePath();
			ctx.fill();
		},
	},
	initPlanet: function() {
		function getColor() {
			return app.randColor();
		}
		var randColor = getColor();
		app.planet.shine = "rgba(255, 255, 255, 1)";
		app.planet.defaultStyle = randColor;
		app.planet.style = randColor;
		app.planet.x = app.width/2;
		app.planet.y = app.height/2;
		app.planet.size = 100;
		app.planet.hp = 100;
		app.planet.array = 0;
		app.planet.alive = true;
	},
	drawPlanet: function() {
		var x = app.planet.x;
		var y = app.planet.y;
		var innerRadius = 1;
		var outerRadius = app.planet.size;
		var gradient = ctx.createRadialGradient(x, y, innerRadius, x, y, outerRadius);
		gradient.addColorStop(0, app.planet.shine);
		gradient.addColorStop(1, app.planet.style);
		ctx.fillStyle = gradient;
		ctx.beginPath();
		ctx.arc(x, y, outerRadius, 0, Math.PI * 2, true);
		ctx.closePath();
		ctx.fill();
	},
	// Controls
	getMousePos: function(canvas, evt) {
		var rect = canvas.getBoundingClientRect();
		return {
			x: evt.clientX - rect.left,
			y: evt.clientY - rect.top
		};
	},
	clickHandle: function(e) {
		if(!app.menus.pause.active) { // Game is active
			// Get mouse position
			var mousePos = app.getMousePos(canvas, e);
			mousePos.size = 1;
			// console.log(mousePos);
			// Tower placement
			if(app.placeNewTower) {
				if(mousePos.y > app.menus.gameplay.towers.height) {
					if(!app.addTower.checkNewCollide()) {
						app.buildTower(app.newTower.x, app.newTower.y, app.newTower);
						app.placeNewTower = false;
					}
				}
			} else {
				// Display tooltips
				app.tooltip.active = false;
				app.towers.forEach(function(tower) {
					if(app.collideDetect(mousePos, tower)) {
						console.log("Tower clicked!");
						app.tooltip.target = tower;
						app.tooltip.active = true;
					}
				});
				// Clicked on Menu
				if(mousePos.y <= app.menus.gameplay.towers.height) {
					function checkButton(x,y,w,h) {
						var x1 = x;
						var x2 = x1 + w;
						var y1 = y;
						var y2 = y1 + h;
						if(mousePos.x > x1 && mousePos.x < x2) {
							if(mousePos.y > y1 && mousePos.y < y2) {
								return true;
							} else {
								return false;
							}
						}
					}
					// Tower clicked
					var current = app.menus.gameplay.towers.buttons;
					for(i=0;i < current.length;i++) {
						if(checkButton(current[i].boundx,current[i].boundy,current[i].boundw,current[i].boundh)) {
							// Add Tower
							app.addTower.init(current[i]);
						}
					}
					// Pause clicked
					var current = app.menus.pause.button;
					if(checkButton(current.x,current.y,current.w,current.h)) {
						if(app.state.current == 'gameplay') {
							app.menus.pause.toggle();
						}
					}
				}
			}
		} else { // Game is paused
			app.menus.pause.active = false;
		}
	},
	addTower: {
		init: function(tower) {
			// "tower" contains button object
			if(app.player.cash >= tower.price) {
				app.placeNewTower = true;
				app.newTower = {
					'type':tower.name,
					'price':tower.price,
					'style':tower.style,
					'size':tower.size,
					'range':tower.range
				}
				canvas.addEventListener('mousemove', app.addTower.setNewPos);
			}
		},
		setNewPos: function(e) {
			var mousePos = app.getMousePos(canvas, e);
			var size = 12;
			app.newTower.x = mousePos.x-(app.newTower.size/2);
			app.newTower.y = mousePos.y-(app.newTower.size/2);
		},
		checkNewCollide: function() {
			var noRoom = false;
			app.towers.forEach(function(tower) {
				if(app.collideDetect(app.newTower, tower)) {
					noRoom = true;
				}
			});
			if(app.collideDetect(app.newTower, app.planet) || noRoom) {
				return true;
			} else {
				return false;
			}
		},
		updateNewTower: function() {
			if(app.newTower.y > app.menus.gameplay.towers.height) {
				// Tower range
				ctx.fillStyle = "rgba(200,200,200,0.2)";
				if(app.addTower.checkNewCollide()) {
					ctx.fillStyle = "rgba(199,27,27,0.1)";
				}
				var x = app.newTower.x +(app.newTower.size/2);
				var y = app.newTower.y +(app.newTower.size/2);
				ctx.beginPath();
				ctx.arc(x, y, app.newTower.range, 0, Math.PI * 2, true);
				ctx.closePath();
				ctx.fill();
				// Tower
				ctx.fillStyle = app.newTower.style;
				if(app.addTower.checkNewCollide()) {
					ctx.fillStyle = "rgba(199,27,27,0.5)";
				}
				ctx.fillRect(app.newTower.x, app.newTower.y, app.newTower.size, app.newTower.size);
			}
		},
	},
	tooltip: {
		active: false,
		target: 0,
		draw: function() {
			if(app.tooltip.target) {
				var unit = app.tooltip.target;
				// Show range
				ctx.fillStyle = "rgba(100,100,100,0.2)";
				var x = unit.x +(unit.size/2);
				var y = unit.y +(unit.size/2);
				ctx.beginPath();
				ctx.arc(x, y, unit.range, 0, Math.PI * 2, true);
				ctx.closePath();
				ctx.fill();
				// Panel BG
				x = 0;
				y = 260;
				var w = 220;
				var h = 100;
				ctx.strokeStyle = "rgba(255,255,255,0.4)";
				ctx.lineWidth = 0.5;
				ctx.strokeRect(x, y, w, h);
				ctx.fillStyle = "rgba(0,0,0,0.4)";
				ctx.fillRect(x, y, w, h);
				// Stats
				ctx.font = "14px Helvetica";
				ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
				var str = "Level "+unit.level;
				x += 10;
				y += 20;
				ctx.fillText(str, x, y);
				ctx.font = "11px Helvetica";
				// Damage
				y += 20;
				str = "Damage: "+unit.damage;
				ctx.fillText(str, x, y);
				// Range
				y += 20;
				str = "Range: "+unit.range;
				ctx.fillText(str, x, y);
				// Attack Rate
				y += 20;
				str = "Fire Rate: "+(unit.rate/100).toFixed(1);
				ctx.fillText(str, x, y);
				// Upgrades
				if(unit.level < 5) {
					var upgrades = app.level.next(unit);
					ctx.font = "14px Helvetica";
					ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
					x = 120;
					y = 280;
					str = "Level "+upgrades.level;
					ctx.fillText(str, x, y);
					ctx.font = "11px Helvetica";
					// Damage
					y += 20;
					str = "Damage: ";
					ctx.fillText(str, x, y);
					var strlen = ctx.measureText(str).width;
					str = unit.damage + upgrades.damage;
					ctx.fillStyle = "rgba(149, 209, 39, 0.9)";
					ctx.fillText(str, x+strlen, y);
					ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
					// Range
					y += 20;
					str = "Range: ";
					ctx.fillText(str, x, y);
					var strlen = ctx.measureText(str).width;
					str = unit.range + upgrades.range;
					ctx.fillStyle = "rgba(149, 209, 39, 0.9)";
					ctx.fillText(str, x+strlen, y);
					ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
					// Attack Rate
					y += 20;
					str = "Fire Rate: ";
					ctx.fillText(str, x, y);
					var strlen = ctx.measureText(str).width;
					str = ((unit.rate-upgrades.rate)/100).toFixed(1);
					ctx.fillStyle = "rgba(149, 209, 39, 0.9)";
					ctx.fillText(str, x+strlen, y);
					ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
				}
			}
		},
	},
	level : {
		next: function(tower) {
			var level = tower.level + 1;
			var price = level*tower.price;
			if(tower.type == 'basic') {
				var range = 10;
				var ammo = 1;
				var rate = 100;
				var hp = 10;
				var damage = 2;
				var image;
			} else if(tower.type == 'laser') {
				var range = 7;
				var ammo = 0;
				var rate = 0;
				var hp = 10;
				var damage = 2;
				var image;
			} else if(tower.type == 'shock') {
				var range = 10;
				var ammo = 0;
				var rate = 100;
				var hp = 10;
				var damage = 2;
				var image;
			} else if(tower.type == 'rocket') {
				var range = 10;
				var ammo = 1;
				var rate = 100;
				var hp = 10;
				var damage = 3;
				var image;
			}
			upgrades = {
				'range':range,
				'ammo':ammo,
				'rate':rate,
				'maxhp':hp,
				'damage':damage,
				'image':image,
				'level':level,
				'price':price
			};
			return upgrades;
		}
	},
	buildTower: function(x, y, tower) {
		if(tower.type == 'basic') {
			app.player.cash -= 15;
			var size = 12;
			var ammo = 3;
			var rate = 500;
			var hp = 20;
			var damage = 5;
			var style = "rgba(0,132,255,1)";
			var image;
		}
		if(tower.type == 'laser') {
			app.player.cash -= 25;
			var size = 12;
			var ammo = 1;
			var rate = 100;
			var hp = 15;
			var damage = 1;
			var style = "#FF8638";
			var image;
		}
		if(tower.type == 'shock') {
			app.player.cash -= 40;
			var size = 12;
			var ammo = 1;
			var rate = 1000;
			var hp = 25;
			var damage = 2;
			var style = "#EFC94C";
			var image;
		}
		if(tower.type == 'rocket') {
			app.player.cash -= 60;
			var size = 12;
			var ammo = 2;
			var rate = 1500;
			var hp = 30;
			var damage = 8;
			var style = "#F3210A";
			var image;
		}
		app.towers.push({
			'x':x,
			'y':y,
			'size':size,
			'range':tower.range,
			'ammo':ammo,
			'rate':rate,
			'delay': false,
			'target':'',
			'type':tower.type,
			'array':app.towers,
			'hp':hp,
			'maxhp':hp,
			'damage':damage,
			'defaultStyle':style,
			'style':style,
			'image':image,
			'level':1,
			'price':(tower.price*1.3).toFixed(1),
			'alive':true
		});
	},
	spawnWave: function() {
		if(Math.random() < app.spawnRate) {
			app.spawnEnemies(app.numEnemies);
			if(Math.random() < 0.5) {
				app.spawnRate += 0.001;
				ntils.colorLog("Spawn rate: "+app.spawnRate, "orangered");
			}
		}
	},
	// Generate enemies
	spawnEnemies: function(num) {
		for(i=0; i < num; i++) {
			var size = 10;
			var x = app.width+(Math.random()*60)-10;
			// var y = (app.height/2)+(Math.random()*60)-10;
			var y = ~~((Math.random()*(app.height-40))+40);
			var range = 40;
			var speed = 2;
			var ammo = 2;
			var rate = 500; // rate between shots
			app.enemies.push({
				'x':x,
				'y':y,
				'size':size,
				'speed':speed,
				'range':range,
				'ammo':ammo,
				'rate':rate,
				'delay': false,
				'target':app.planet,
				'type':'basic',
				'array':app.enemies,
				'hp':10,
				'maxhp':10,
				'damage':2,
				'defaultStyle':"red",
				'style':"red",
				'alive':true
			});
		}
	},
	updateTowers: function() {
		app.towers.forEach(function(tower) {
			// Draw Tower
			if(tower.target) {
				ctx.save();
				var transx = tower.x + 0.5*tower.size;
				var transy = tower.y + 0.5*tower.size;
				ctx.translate(transx, transy);
				var rotation = Math.atan2(tower.target.y - tower.y, tower.target.x - tower.x);
				// * (180 / Math.PI) //rads
				ctx.rotate(rotation);
				ctx.fillStyle = tower.style;
				ctx.translate(-transx, -transy);
				ctx.fillRect(tower.x, tower.y, tower.size, tower.size);
				ctx.restore();
			} else {
				ctx.fillStyle = tower.style;
				ctx.fillRect(tower.x, tower.y, tower.size, tower.size);
			}

			if(tower.type != 'shock') {
				// Tower AI
				if(!tower.target) {
					// Has no target
					app.findTarget(tower, 'creep');
				} else if(app.inRange(tower, tower.target)) {
					// Has target in range
					if(tower.target.hp > 0) {
						// Target is alive
						app.shootTarget(tower);
					} else {
						tower.target = null;
					}
				} else {
					// Has target, not in range
					tower.target = null;
				}
			} else {
				if(tower.ammo) {
					app.shootTarget(tower);
				}
			}

			// Health bar
			if(tower.hp < tower.maxhp) {
				// Background
				w = tower.size;
				h = 4;
				var x = tower.x;
				var y = tower.y - 5;
				ctx.fillStyle = "rgba(255, 255, 255, 0.1)";
				ctx.fillRect(x, y, w, h);
				// Health
				y += 1;
				h -= 2;
				ctx.fillStyle = "rgba(149, 209, 39, 0.9)";
				ctx.fillRect(x, y, tower.hp, h);
			}
		});
	},
	updateEnemies: function() {
		app.enemies.forEach(function(enemy) {
			ctx.save();
			// enemy.x += 0.2;
			var transx = enemy.x + 0.5*enemy.size;
			var transy = enemy.y + 0.5*enemy.size;
			ctx.translate(transx, transy);
			var rotation = Math.atan2(enemy.target.y - enemy.y, enemy.target.x - enemy.x);
			// * (180 / Math.PI) //rads
			ctx.rotate(rotation);
			ctx.fillStyle = enemy.style;
			ctx.translate(-transx, -transy);
			ctx.fillRect(enemy.x, enemy.y, enemy.size, enemy.size);
			ctx.restore();
			// Targetting
			if(enemy.target == app.planet) {
				if(app.mode == 'hard') {
					app.findTarget(enemy, 'towers');
				}
			}
			// Is target in range?
			if(app.inRange(enemy, enemy.target)) {
				// Is target alive?
				if(enemy.target.hp > 0) {
					app.shootTarget(enemy);
				} else {
					app.findTarget(enemy, 'towers');
				}
			} else {
				app.moveTarget(enemy);
			}
			// Health bar
			if(enemy.hp < enemy.maxhp) {
				// Background
				w = enemy.size;
				h = 4;
				var x = enemy.x;
				var y = enemy.y - 5;
				ctx.fillStyle = "rgba(255, 255, 255, 0.1)";
				ctx.fillRect(x, y, w, h);
				// Health
				y += 1;
				h -= 2;
				ctx.fillStyle = "rgba(149, 209, 39, 0.9)";
				ctx.fillRect(x, y, enemy.hp, h);
			}
		});
	},
	updateProjectiles: function() {
		app.projectiles.forEach(function(projectile) {
			if(projectile.owner.type == 'basic') {
				app.moveTarget(projectile);
		    	// Check collision
		    	if(app.collideDetect(projectile, projectile.target)) {
			    	// Return ammo
			    	++projectile.owner.ammo;
			    	// Remove health
			    	app.damageEntity(projectile.target,projectile.owner.damage);

			    	// Remove projectile
			    	projectile.alive = false;
			    } else {
			    	// Draw projectile
				    ctx.fillStyle = projectile.style;
					ctx.beginPath();
					ctx.arc(projectile.x, projectile.y, projectile.size, 0, Math.PI * 2, true);
					ctx.closePath();
					ctx.fill();
			    }
		    } else if(projectile.owner.type == 'laser') {
		    	if(projectile.target.hp > 0 && app.inRange(projectile.target, projectile.owner)) {
			    	ctx.lineWidth = 1;
					ctx.strokeStyle = projectile.style;
					ctx.beginPath();
					var oX = projectile.owner.x + projectile.owner.size/2;
					var oY = projectile.owner.y + projectile.owner.size/2;
					var tX = projectile.target.x + projectile.target.size/2;
					var tY = projectile.target.y + projectile.target.size/2;
			    	ctx.moveTo(oX,oY);
			    	ctx.lineTo(tX,tY);
			    	ctx.stroke();
		    	} else {
			    	// Remove Projectile
					projectile.alive = false;
		    		// Remove damage interval
		    		clearInterval(projectile.owner.damageInterval);
		    		projectile.owner.damageInterval = 0;
		    		// Refill ammo
		    		++projectile.owner.ammo;
		    	}
		    } else if(projectile.owner.type == 'shock') {
		    	var x = projectile.owner.x + (projectile.owner.size/2);
		    	var y = projectile.owner.y + (projectile.owner.size/2);
		    	// Draw projectile
			    ctx.fillStyle = projectile.owner.shockStyle;
				ctx.beginPath();
				ctx.arc(x, y, projectile.size, 0, Math.PI * 2, true);
				ctx.closePath();
				ctx.fill();
		    } else if(projectile.owner.type == 'rocket') {
		    	if(projectile.explode == 0) {
					app.moveTarget(projectile);
			    	// Check collision
			    	if(app.collideDetect(projectile, projectile.target)) {
				    	// Return ammo
				    	++projectile.owner.ammo;
			    		// Explode
			    		projectile.explode = 1;
			    		for(i=0;i<app.enemies.length;i++) {
			    			if(app.inRange(projectile,app.enemies[i])) {
			    				app.damageEntity(app.enemies[i],projectile.owner.damage);
			    			}
			    		}
					}
				} else if(projectile.explode == 1) {
			    	// Explode, then remove projectile
			    	projectile.explode = 2;
			    	var innerRadius = 1;
					var outerRadius = 20;
					var gradient = ctx.createRadialGradient(projectile.x+projectile.size/2, projectile.y+projectile.size/2, innerRadius, projectile.x+projectile.size/2, projectile.y+projectile.size/2, outerRadius);
					gradient.addColorStop(0, "rgba(239,201,76,0)");
					gradient.addColorStop(1, "rgba(243,33,10,1)");
			    	projectile.style = gradient;
			    	projectile.size = 20;
			    	window.setTimeout(function() {
				    	projectile.alive = false;
					}, 200);
				}
		    	// Draw projectile
			    ctx.fillStyle = projectile.style;
				ctx.beginPath();
				ctx.arc(projectile.x, projectile.y, projectile.size, 0, Math.PI * 2, true);
				ctx.closePath();
				ctx.fill();
		    }
		});
		app.projectiles = app.projectiles.filter(function(projectile) {
			return projectile.alive;
		});
	},
	moveTarget: function(unit) {
		// Rotate us to face the target
	    var rotation = Math.atan2(unit.target.y - unit.y, unit.target.x - unit.x);
	    // Move towards the target
	    unit.x += Math.cos(rotation) * unit.speed;
	    unit.y += Math.sin(rotation) * unit.speed;
	},
	findTarget: function(unit, target) {
		if(target == 'towers') {
			target = app.towers;
			// Set target to planet in case no towers in range
			unit.target = app.planet;
		} else {
			target = app.enemies;
		}
		// Loop through targettable enemies
		for(j=0; j < target.length; j++) {
			if(app.inRange(unit, target[j])) {
				unit.target = target[j];
				break;
			}
		}
	},
	shootTarget: function(unit) {
		// console.log(unit.ammo);
		// console.log(unit.delay);
		if(unit.type == 'basic') {
			if(unit.ammo > 0) {
				if(!unit.delay) {
					app.projectiles.push({
						'x':unit.x,
						'y':unit.y,
						'speed':4,
						'target':unit.target,
						'size':1.5,
						'owner':unit,
						'alive':true,
						'style':'#F1A20D',
						'array':app.projectiles
					});
					--unit.ammo;
					// Delayed rate of firing
					unit.delay = true;
					var current = unit;
					window.setTimeout(function() {
					    current.delay = false;
					}, unit.rate);
				}
			}
		} else if(unit.type == 'laser') {
			if(unit.ammo) {
				var current = unit;
				current.delay = true;
				app.projectiles.push({
					'x':unit.x,
					'y':unit.y,
					'speed':1,
					'target':unit.target,
					'size':1,
					'owner':unit,
					'alive':true,
					'style':'#F1A20D',
					'array':app.projectiles
				});
				current.damageInterval = setInterval(function() {
					if(unit.target) {
						if(current.delay) {
				    		// Remove health
					    	app.damageEntity(unit.target, unit.damage);
					    	// Remove entity
					    	if(unit.target.hp <= 0) {
					    		clearInterval(current.damageInterval);
					    		current.damageInterval = 0;
					    		current.delay = false;
					    	} else {
					    		// Enemy
					    	}
						}
					}
		    	}, unit.rate);
				--unit.ammo;
			}
		} else if(unit.type == 'shock') {
			if(unit.ammo) {
				var current = unit;
				current.delay = true;
				app.projectiles.push({
					'x':unit.x,
					'y':unit.y,
					'speed':1,
					'size':20,
					'owner':unit,
					'alive':true,
					// 'style':'rgba(69,178,157,0.5)',
					'array':app.projectiles
				});
				current.shockStyle = "rgba(69,178,157,0)";
				current.damageInterval = setInterval(function() {
					var innerRadius = 1;
					var outerRadius = 20;
					var gradient = ctx.createRadialGradient(current.x+6, current.y+6, innerRadius, current.x+6, current.y+6, outerRadius);
					gradient.addColorStop(0, "rgba(239,201,76,0)");
					gradient.addColorStop(1, "rgba(239,201,76,1)");
					// Flash on shock
			    	current.shockStyle = gradient;
			    	// current.shockStyle = "rgba(69,178,157,0.4)";
			    	window.setTimeout(function() {
					    current.shockStyle = "rgba(69,178,157,0)";
					}, 200);
		    		// Damage nearby enemies
		    		for(i=0;i<app.enemies.length;i++) {
		    			if(app.inRange(unit,app.enemies[i])) {
		    				app.damageEntity(app.enemies[i],unit.damage);
					    	app.enemies[i].speed = 1;
		    			}
		    		}
		    	}, unit.rate);
				--unit.ammo;
			}
		} else if(unit.type == 'rocket') {
			if(unit.ammo > 0) {
				if(!unit.delay) {
					app.projectiles.push({
						'x':unit.x,
						'y':unit.y,
						'speed':3,
						'target':unit.target,
						'size':3,
						'owner':unit,
						'alive':true,
						'style':'#F1A20D',
						'array':app.projectiles,
						'explode':0,
						'range':20
					});
					--unit.ammo;
					// Delayed rate of firing
					unit.delay = true;
					var current = unit;
					window.setTimeout(function() {
					    current.delay = false;
					}, unit.rate);
				}
			}
		}
	},
	inRange: function(unit1, unit2) {
		// TODO: Better method of range detection
		var distance = Math.sqrt(Math.pow(unit1.x - unit2.x, 2) + Math.pow(unit1.y - unit2.y, 2)).toFixed(2);
		if(distance > unit1.range+unit2.size) {
			return false;
		} else {
			return true;
		}
	},
	collideDetect: function(unit1, unit2) {
		// TODO: Better collision detection
		var distance = Math.sqrt(Math.pow(unit1.x - unit2.x, 2) + Math.pow(unit1.y - unit2.y, 2)).toFixed(2);
		if(distance > unit2.size) {
			return false;
		} else {
			return true;
		}
	},
	floats: [],
	damageEntity: function(unit, dmg) {
		// Damage
		unit.hp -= dmg;
		// Flash on hit
    	unit.style = "rgba(255,100,100,1)";
    	window.setTimeout(function() {
    		if(unit.hp > 0 && unit) {
			    unit.style = unit.defaultStyle;
    		}
		}, 50);
		// Float damage on crit
		var str = "-"+dmg;
		ctx.font = "12px Helvetica";
		var crit = 0;
		if(crit) {
			function getCoords() {
				return {
					x:unit.x,
					y:unit.y
				};
			}
			var coords = getCoords();
			var x = coords.x - ctx.measureText(str).width/2;
			var y = coords.y - unit.size/2 - 4;
			var opacity = 1;
			app.floats.push({
				'owner':unit,
				'str':"-"+dmg,
				'alive':true,
				'rgb':'254,58,37',
				'opacity':0,
				'y':y,
				'x':x
			});
		}
		// Remove entity
		if(unit.hp <= 0) {
    		if(unit.alive) {
    			app.removeEntity(unit);
    		}
    	}
	},
	updateFloats: function() {
		app.floats.forEach(function(float) {
			// if(float.owner.hp > 0) {
				if(float.opacity < 1) {
					ctx.font = "12px Helvetica";
					float.y -= 1;
					float.opacity += 0.1;
					ctx.fillStyle = "rgba("+float.rgb+","+float.opacity+")";
					ctx.fillText(float.str, float.x, float.y);
				} else {
					float.alive = false;
				}
			// }
		});
		// Clear floats
		app.floats = app.floats.filter(function(float) {
			return float.alive;
		});
	},
	particles: {
		/* Mostly adapted from:
		 * http://thecodeplayer.com/walkthrough/canvas-fireworks-tutorial
		 */
		hue: 0,
		items: [],
		init: function(unit) {
			var particleCount = 20;
			if(unit == app.planet) {
				particleCount = 200;
			}
			while( particleCount-- ) {
				app.particles.add(unit.x,unit.y);
			}
		},
		add: function(x, y) {
			var p = app.particles;
			var coordinates = [];
			var coordinateCount = 2;
			while(coordinateCount--) {
				coordinates.push([x, y]);
			}
			app.particles.items.push({
				x: x,
				y: y,
				// set a random angle in all possible directions, in radians
				angle: app.random( 0, Math.PI * 2 ),
				speed: app.random( 1, 10 ),
				// friction will slow the particle down
				friction: 0.99,
				// track the past coordinates of each particle to create a trail effect, increase the coordinate count to create more prominent trails
				coordinates: coordinates,
				// gravity will be applied and pull the particle down
				gravity: 0.1, // This is space!
				// set the hue to a app.random number +-20 of the overall hue variable
				hue: app.random( p.hue - 20, p.hue + 20 ),
				brightness: app.random( 50, 80 ),
				alpha: 1,
				// set how fast the particle fades out
				decay: app.random( 0.015, 0.03 ),
				alive: true
			});
		},
		draw: function() {
			app.particles.items.forEach(function(item) {
				// remove last item in coordinates array
				item.coordinates.pop();
				// add current coordinates to the start of the array
				item.coordinates.unshift( [ item.x, item.y ] );
				// slow down the particle
				item.speed *= item.friction;
				// apply velocity
				item.x += Math.cos( item.angle ) * item.speed;
				item.y += Math.sin( item.angle ) * item.speed + item.gravity;
				// fade out the particle
				item.alpha -= item.decay;

				// remove the particle once the alpha is low enough, based on the passed in index
				if( item.alpha <= item.decay ) {
					item.alive = false;
				}
				// Draw
				ctx.beginPath();
				// move to the last tracked coordinates in the set, then draw a line to the current x and y
				ctx.moveTo(item.coordinates[item.coordinates.length - 1][0], item.coordinates[item.coordinates.length - 1][1]);
				ctx.lineTo(item.x, item.y);
				ctx.strokeStyle = 'hsla(' + item.hue + ', 100%, ' + item.brightness + '%, ' + item.alpha + ')';
				ctx.stroke();
				app.particles.hue += 0.5;
				if(app.particles.hue > 30) {
					app.particles.hue = 0;
				}
			});
			app.particles.items = app.particles.items.filter(function(p) {
				return p.alive;
			});
		},
	},
	removeEntity: function(unit) {
		// Explode before removing reference
		app.particles.init(unit);
		// Remove from proper array
		console.log('Removing: '+unit.array);
		if(unit.array) {
			if(unit.type == 'basic') {
				app.player.addCash(1);
			}
			unit.alive = false;
		} else {
			// Planet
			console.log(app.planet.hp);
			app.planet.shine = "rgba(0,0,0,0)";
			app.planet.style = "rgba(0,0,0,0)";
		}
		app.towers = app.towers.filter(function(u) {
			return u.alive;
		});
		app.enemies = app.enemies.filter(function(u) {
			return u.alive;
		});
		app.projectiles = app.projectiles.filter(function(u) {
			return u.alive;
		});
	},
	random: function(min, max) {
		return Math.random() * (max - min) + min;
	},
	// Generate a random color
	randColor: function() {
		return '#'+ ('000000' + Math.floor(Math.random()*16777215).toString(16)).slice(-6);
	},
}

ntils = {
	colorLog: function(msg, color) {
		console.log("%c" + msg, "color:" + color + ";font-weight:bold;");
	}
}