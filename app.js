/* Planetary Defense
* - Defend your planets against attackers
* - Build and upgrade defenses
* - Expand your planetary empire
* 
*/
var canvas;
$(document).ready(function() {
	// Init app
	canvas = document.getElementById('stage');
	app.initialize();
	// Pause functionality
	// Pause when window loses focus
	window.addEventListener('blur', function() {
		//app.menus.pause.activate();
	});
	// TEMP MENUS
	// Pause when user clicks "Pause" btn
	$('.action-pause').on('click', function() {
		if(app.state.current == 'gameplay') {
			app.menus.pause.toggle();
		}
	});
	// Create tower
	$('.action-tower').on('click', function() {
		if(!app.menus.pause.active) {
			app.addTower.init();
		}
	});
	// Canvas Handlers
	canvas.addEventListener('click', app.clickHandle);
});
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
						x: 100,
						y: 10,
						size: 12,
						boundx: 80,
						boundy: 0,
						boundw: 40,
						boundh: 40,
						name: 'basic',
						price: 25,
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
						var str = "$ "+app.player.cash+"mil";
					} else {
						var numbil = app.player.cash*0.001;
						var str = "$ "+numbil.toFixed(1)+"bil";
					}
					var x = 10;
					var y = 25;
					ctx.fillText(str, x, y);
					
					for(i=0;i < context.buttons.length;i++) {
						// Draw default tower
						// TODO - add switch for other towers
						// Button Background
						var width = 40;
						ctx.fillStyle = "rgba(45, 45, 45, 0.5)";
						ctx.fillRect(context.buttons[i].boundx, 
							context.buttons[i].boundy, 
							context.buttons[i].boundw, 
							context.buttons[i].boundh);
						// Preview tower
						if(app.player.cash >= context.buttons[i].price) {
							ctx.fillStyle = 'rgba(0,132,255,1)';
						} else {
							ctx.fillStyle = 'rgba(200,200,200,0.7)';
						}
						var x = context.buttons[i].x - context.buttons[i].size*0.5; // Center preview
						ctx.fillRect(x, context.buttons[i].y, context.buttons[i].size, context.buttons[i].size);
						// Draw price
						if(app.player.cash >= context.buttons[i].price) {
							ctx.fillStyle = "rgba(255, 255, 255, 1)";
						} else {
							ctx.fillStyle = 'rgba(230, 230, 230, 0.7)';
						}
						ctx.font = "10px Helvetica";
						var str = "$"+context.buttons[i].price;
						var x = context.buttons[i].x - (ctx.measureText(str).width/2);
						var y = context.buttons[i].y + context.buttons[i].size + 12;
						ctx.fillText(str, x, y);
					};
				},
			},
		},
		pause: {
			active: false,
			activate: function() {
				if(app.state.current == 'gameplay') {
					if(!app.menus.pause.active) {
						app.menus.pause.active = true;
						app.menus.fade(); 
						app.menus.pause.draw();
						$('.action-pause').html("Play");
					}
				}
			},
			toggle: function() {
				if(app.state.current == 'gameplay') {
					if(!app.menus.pause.active) {
						app.menus.pause.active = true;
						app.menus.fade();
						app.menus.pause.draw();
						$('.action-pause').html("Play");
					} else {
						app.menus.pause.active = false;
						$('.action-pause').html("Pause");
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
		},
		gameOver: {
			active: false,
			activate: function() {
				if(!app.menus.gameOver.active) {
					app.menus.gameOver.active = true;
					app.state.current = 'gameover';
				}
			},
			draw: function() {
				// Draw text
				ctx.font = "30px Helvetica";
				ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
				var str = "GAME OVER";
				var x = (app.width/2) - (ctx.measureText(str).width/2);
				ctx.fillText(str, x, 160);
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
				// Place-tower indicator
				if(app.placeNewTower == true) {
					app.addTower.updateNewTower();
				}
				// Spawn enemies
				if(!app.menus.gameOver.active) {
					if(Math.random() < app.spawnRate) {
						app.spawnEnemies(app.numEnemies);
						if(Math.random() < 0.5) {
							app.spawnRate += 0.001;
							ntils.colorLog("Spawn rate: "+app.spawnRate, "orangered");
						}
					}
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
		app.planet.team = "base";
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
			console.log(mousePos);
			// Tower placement
			if(app.placeNewTower) {
				if(mousePos.y > app.menus.gameplay.towers.height) {
					if(!app.addTower.checkNewCollide()) {
						app.buildTower(app.newTower.x, app.newTower.y, 'basic');
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
					var current = app.menus.gameplay.towers;
					var x1 = current.buttons[0].boundx;
					var x2 = x1 + current.buttons[0].boundw;
					var y1 = current.buttons[0].boundy;
					var y2 = y1 + current.buttons[0].boundh;
					if(mousePos.x > x1 && mousePos.x < x2) {
						if(mousePos.y > y1 && mousePos.y < y2) {
							// Add Tower
							app.addTower.init();
						}
					}
				}
			}
		} else { // Game is paused
			app.menus.pause.active = false;
			$('.action-pause').html("Pause");
		}
	},
	addTower: {
		init: function() {
			if(app.player.cash >= 25) {
				app.placeNewTower = true;
				canvas.addEventListener('mousemove', app.addTower.setNewPos);
			}
		},
		setNewPos: function(e) {
			var mousePos = app.getMousePos(canvas, e);
			var size = 12;
			app.newTower = {
				"x": mousePos.x,
				"y": mousePos.y,
				"size": size
			}
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
				if(app.addTower.checkNewCollide()) {
					ctx.fillStyle = "rgba(228,16,16,0.5)";
				} else {
					ctx.fillStyle = "rgba(0,132,255,0.5)";
				}
				ctx.fillStyle = app.newTower.style;
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
			app.player.cash -= 25;
			var size = 12;
			var range = 80;
			var ammo = 3;
			var rate = 500;
			var hp = 20;
			var damage = 5;
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
			'team':'player',
			'hp':hp,
			'damage':damage,
			'style':'rgba(0,132,255,1)'
		});
	},
	// Generate enemies
	spawnEnemies: function(num) {
		for(i=0; i < num; i++) {
			var size = 10;
			var x = app.width+(Math.random()*60)-10;
			var y = (app.height/2)+(Math.random()*60)-10;
			var range = 50;
			var vision = 80;
			var speed = 2;
			var ammo = 2;
			var rate = 500; // rate between shots
			app.enemies.push({
				'x':x,
				'y':y,
				'size':size,
				'speed':speed,
				'range':range,
				'vision':vision,
				'ammo':ammo,
				'rate':rate,
				'delay': false,
				'target':app.planet,
				'type':'basic',
				'team':'creep',
				'hp':10,
				'damage':2,
				'style':"red"
			});
		}
	},
	updateTowers: function() {
		app.towers.forEach(function(tower) {
			// ctx.beginPath();
			// ctx.arc(tower.x, tower.y, tower.size, 0, Math.PI * 2, true);
			// ctx.closePath();
			// ctx.fill();

			// Draw Tower
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

			// Tower AI
			if(tower.target == '') {
				app.findTarget(tower, 'creep');
				// Is target in range?
			} else if(app.inRange(tower, tower.target)) {
				// Is target alive?
				if(tower.target.hp > 0) {
					app.shootTarget(tower, tower.target);
				} else {
					app.findTarget(tower, 'creep');
				}
			} else {
				app.findTarget(tower, 'creep');
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
				// app.findTarget(enemy, 'towers');
			}

			// Is target in range?
			if(app.inRange(enemy, enemy.target)) {
				// Is target alive?
				if(enemy.target.hp > 0) {
					app.shootTarget(enemy, enemy.target);
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
			app.moveTarget(projectile);
	    	// Check collision
	    	if(app.collideDetect(projectile, projectile.target)) {
		    	// Return ammo
		    	++projectile.owner.ammo;
		    	// Remove health
		    	projectile.target.hp -= projectile.owner.damage;
		    	app.checkHealth(projectile.target);
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
		    	if(projectile.owner.team == 'player') {
				    ctx.fillStyle = '#0084ff';
		    	} else {
				    ctx.fillStyle = 'red';
		    	}
			    if (projectile.owner.type == 'basic') {
					ctx.beginPath();
					ctx.arc(projectile.x, projectile.y, projectile.size, 0, Math.PI * 2, true);
					ctx.closePath();
					ctx.fill();
			    }
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
			if(app.inSight(unit, target[j])) {
				unit.target = target[j];
				break;
			}
		}
	},
	shootTarget: function(unit) {
		// console.log(unit.ammo);
		// console.log(unit.delay);
		if(unit.ammo > 0) {
			if(!unit.delay) {
				app.projectiles.push({
					'x':unit.x,
					'y':unit.y,
					'speed':4,
					'target':unit.target,
					'size':1.5,
					'owner':unit,
					'active':true
				});
				--unit.ammo;
				unit.delay = true;
				var current = unit;
				window.setTimeout(function() {
				    current.delay = false;
				}, unit.rate);
			}
		}
	},
	inSight: function(unit1, unit2) {
		// TODO: Better method of range detection
		var distance = Math.sqrt(Math.pow(unit1.x - unit2.x, 2) + Math.pow(unit1.y - unit2.y, 2)).toFixed(2);
		if(distance > unit1.vision+unit2.size) {
			return false;
		} else {
			return true;
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
	checkHealth: function(unit) {
		if(unit.hp <= 0) {
			if(unit.team != 'base') {
				var type;
				if(unit.team == 'player') {
					type = app.towers;
				} else if(unit.team == 'creep') {
					type = app.enemies;
					app.player.addCash(2);
				} else {
					console.log("Unidentified object shot:");
					console.log(unit);
				}
				// Remove unit
				for(i=0;i<type.length;i++) {
					if(unit == type[i]) {
						type.splice(i, 1);
					}
				}
			} else {
				// Planet
				console.log(app.planet.hp);
				app.planet.shine = "rgba(0,0,0,0)";
				app.planet.style = "rgba(0,0,0,0)";
			}	
		}
	},
	// Generate a random color
	randColor: function() {
		return '#'+ ('000000' + Math.floor(Math.random()*16777215).toString(16)).slice(-6);
	},
	test: function() {
		var x = 100;
		var y = 100;
		var w = 100;
		var h = 100;
		var tx = 250;
		var ty = 250;
		if(testrotate) {
			ctx.save();
			var transx = x + 0.5*w;
			var transy = y + 0.5*h;
			ctx.translate(transx, transy);
			console.log('translate x: '+transx);
			console.log('translate y: '+transy);
			var rotation = Math.atan2(ty - y, tx - x);
			ctx.rotate(rotation);
			ctx.fillStyle = "#fff";
			ctx.translate(-transx, -transy);
			ctx.fillRect(x, y, w, h);
			ctx.restore();
		} else {
			ctx.fillStyle = "#fff";
			ctx.fillRect(x, y, w, h);
		}
	}
}

var testrotate = false;

ntils = {
	colorLog: function(msg, color) {
		console.log("%c" + msg, "color:" + color + ";font-weight:bold;");
	}
}