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
						x: 120,
						y: 10,
						size: 12,
						boundx: 100,
						boundy: 0,
						boundw: 40,
						boundh: 40,
						name: 'basic',
						price: 15,
						style: 'rgba(0,132,255,1)'
					}, {
						x: 162,
						y: 10,
						size: 12,
						boundx: 142,
						boundy: 0,
						boundw: 40,
						boundh: 40,
						name: 'laser',
						price: 25,
						style: "#DA0734"
					}, {
						x: 204,
						y: 10,
						size: 12,
						boundx: 184,
						boundy: 0,
						boundw: 40,
						boundh: 40,
						name: 'shock',
						price: 40,
						style: "#EFC94C"
					}, {
						x: 246,
						y: 10,
						size: 12,
						boundx: 226,
						boundy: 0,
						boundw: 40,
						boundh: 40,
						name: 'rocket',
						price: 60,
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
				app.drawPlanet();
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
				if(app.tooltip) {
					app.displayTooltip(); 
				}
				// Game Over
				if(app.menus.gameOver.active) {
					app.menus.gameOver.end();
				} else {
					// Only draw UI while game is active
					app.menus.gameplay.towers.draw();
					app.menus.gameplay.timer.draw();
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
        for (i=0; i<=70; i++) {
          // Get random positions for stars
          var starx = ~~(Math.random() * app.width);
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
          // Draw the given star
          ctx.fillStyle = app.stars[i][0];
          ctx.beginPath();
          ctx.arc(app.stars[i][1], app.stars[i][2], app.stars[i][3], 0, Math.PI * 2, true);
          ctx.closePath();
          ctx.fill();
        }
	},
	initPlanet: function() {
		app.planet.shine = "rgba(255, 255, 255, 1)";
		app.planet.style = app.randColor();
		app.planet.x = 20;
		app.planet.y = app.height/2;
		app.planet.size = 100;
		app.planet.hp = 100;
		app.planet.array = "base";
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
						app.buildTower(app.newTower.x, app.newTower.y, app.newTower.type);
						app.placeNewTower = false;
					}
				}
			} else {
				// Display tooltips
				if(!app.tooltip) {
					// Select tower
					app.towers.forEach(function(tower) {
						if(app.collideDetect(mousePos, tower)) {
							console.log("Tower clicked!");
							app.displayTooltip(tower);
							app.tooltip = true;
						}
					});
				} else { // Deselect (select nothing)
					app.tooltip = false;
				}
				if(mousePos.y <= app.menus.gameplay.towers.height) { // Clicked on Menu
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
				}
				canvas.addEventListener('mousemove', app.addTower.setNewPos);
			}
		},
		setNewPos: function(e) {
			var mousePos = app.getMousePos(canvas, e);
			var size = 12;
			app.newTower.x = mousePos.x;
			app.newTower.y = mousePos.y;
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
				ctx.fillStyle = app.newTower.style;
				if(app.addTower.checkNewCollide()) {
					ctx.fillStyle = "rgba(255,255,255,0.5)";
				}
				ctx.fillRect(app.newTower.x, app.newTower.y, app.newTower.size, app.newTower.size);
			}
		},
	},
	displayTooltip: function(unit) {
		ctx.strokeStyle = "rgba(255,255,255,0.4)";
		ctx.lineWidth = 0.5;
		ctx.strokeRect(0, 260, 220, 100);
		ctx.fillStyle = "rgba(0,0,0,0.4)";
		ctx.fillRect(0, 260, 220, 100);
	},
	displayHealth: function(unit) {

	},
	buildTower: function(x, y, type) {
		if(type == 'basic') {
			app.player.cash -= 15;
			var size = 12;
			var range = 80;
			var ammo = 3;
			var rate = 500;
			var hp = 20;
			var damage = 5;
			var style = "rgba(0,132,255,1)";
			var image;
		}
		if(type == 'laser') {
			app.player.cash -= 25;
			var size = 12;
			var range = 60;
			var ammo = 1;
			var rate = 100;
			var hp = 15;
			var damage = 1;
			var style = "#DA0734";
			var image;
		}
		if(type == 'shock') {
			app.player.cash -= 40;
			var size = 12;
			var range = 20;
			var ammo = 1;
			var rate = 1000;
			var hp = 25;
			var damage = 2;
			var style = "#EFC94C";
			var image;
		}
		if(type == 'rocket') {
			app.player.cash -= 60;
			var size = 12;
			var range = 40;
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
			'range':range,
			'ammo':ammo,
			'rate':rate,
			'delay': false,
			'target':'',
			'type':type,
			'array':'towers',
			'hp':hp,
			'damage':damage,
			'style':style,
			'image':image
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
			var range = 50;
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
				'array':'enemies',
				'hp':10,
				'damage':2,
				'style':"red",
				'active':true
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

			if(tower.showHealth) {
				// Display health
			}
		});
	},
	updateEnemies: function() {
		app.enemies.forEach(function(enemy) {
			ctx.save();
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
			    	if(projectile.target.hp <= 0) {
			    		app.removeEntity(projectile.target, projectile.target.type);
			    	}
			    	// Flash on hit
			    	var normalStyle = projectile.target.style;
			    	projectile.target.style = "#fff";
			    	window.setTimeout(function() {
					    projectile.target.style = normalStyle;
					}, 25);

			    	// Remove projectile
			    	projectile.active = false;
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
					projectile.active = false;
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
						    	if(app.enemies[i].hp <= 0) {
							    	app.player.addCash(1);
							    	app.enemies[i].active = false;
						    	}
			    			}
			    		}
			    		app.enemies = app.enemies.filter(function(enemy) {
							return enemy.active;
						});
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
				    	projectile.active = false;
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
			return projectile.active;
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
						'active':true,
						'style':'#F1A20D',
						'array':'projectiles'
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
					'active':true,
					'style':'#F1A20D',
					'array':'projectiles'
				});
				current.damageInterval = setInterval(function() {
					if(unit.target) {
						if(current.delay) {
					    	// Flash on hit
							//var normalStyle = unit.target.style;
							//unit.target.style = "#fff";
							//window.setTimeout(function() {
							//	if(unit.target) {
							// 	    unit.target.style = normalStyle;
							// 	}
							// }, 25);
				    		// Remove health
					    	// unit.target.hp -= unit.damage;
					    	app.damageEntity(unit.target, unit.damage);
					    	// console.log("Enemy HP: "+unit.target.hp);
					    	if(unit.target.hp <= 0) {
					    		clearInterval(current.damageInterval);
					    		current.damageInterval = 0;
					    		app.removeEntity(unit.target);
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
					'active':true,
					// 'style':'rgba(69,178,157,0.5)',
					'array':'projectiles'
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
					    	if(app.enemies[i].hp <= 0) {
						    	// app.removeEntity(app.enemies[i]);
						    	// breaks loop too early
						    	app.player.addCash(1);
						    	app.enemies[i].active = false;
					    	}
		    			}
		    		}
		    		app.enemies = app.enemies.filter(function(enemy) {
						return enemy.active;
					});
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
						'active':true,
						'style':'#F1A20D',
						'array':'projectiles',
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
		// TODO: Better collision detection. Optimize.
		var distance = Math.sqrt(Math.pow(unit1.x - unit2.x, 2) + Math.pow(unit1.y - unit2.y, 2)).toFixed(2);
		if(distance > unit2.size) {
			return false;
		} else {
			return true;
		}
	},
	floats: [],
	damageEntity: function(unit, dmg) {
		unit.hp -= dmg;
		var str = "-"+dmg;
		ctx.font = "12px Helvetica";
		function getCoords() {
			return {
				x:unit.x,
				y:unit.y
			};
		}
		var coords = getCoords();
		var x = coords.x - ctx.measureText(str).width/2;
		var y = coords.y - unit.size/2 - 4;
		// console.log('x: '+x+' y: '+y);
		var opacity = 1;
		app.floats.push({
			'owner':unit,
			'str':"-"+dmg,
			'active':true,
			'rgb':'254,58,37',
			'opacity':0,
			'y':y,
			'x':x
		});
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
					float.active = false;
				}
			// }
		});
		// Clear floats
		app.floats = app.floats.filter(function(float) {
			return float.active;
		});
	},
	removeEntity: function(unit) {
		var type = null;
		console.log('removing: '+unit.array);
		if(unit.array == 'projectiles') {
			type = app.projectiles;
		} else if(unit.array == 'towers') {
			type = app.towers;
		} else if(unit.array == 'enemies') {
			type = app.enemies;
		}
		if(type) {
			for(i=0;i<type.length;i++) {
				if(unit == type[i]) {
					if(type == app.enemies) {
						if(type[i].type == 'basic') {
							app.player.addCash(1);
						} 
					}
					type.splice(i, 1);
				}
			}
		} else {
			// Planet
			console.log(app.planet.hp);
			app.planet.shine = "rgba(0,0,0,0)";
			app.planet.style = "rgba(0,0,0,0)";
		}
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