/* Planetary Defense
* - Defend your planets against attackers
* - Build and upgrade defenses
* - Expand your planetary empire
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
			if(app.player.cash >= 20) {
				app.addTower.init();
			}
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
	gameLoop: function() {
		if(app.state.current == 'gameplay') {
			app.state.gameplay();
		} else if(app.state.current == 'gameover') {
			app.state.gameplay();
		}
	},
	menus: {
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
					app.state.drawUI();
				}
			}

			if(app.planet.hp <= 0) {
				app.menus.gameOver.activate();
			}
		},
		drawUI: function() {
			ctx.font = "14px Helvetica";
			ctx.fillStyle = "rgba(255, 255, 255, 1)";
			var str = "$ "+app.player.cash;
			var x = (app.width - ctx.measureText(str).width) - 10;
			var y = 20;
			ctx.fillText(str, x, y);
		},
	},
	player: {
		cash: 50,
		addCash: function(amount) {
			app.player.cash += amount;
		},
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
			// Tower placement
			if(app.placeNewTower) {
				if(app.addTower.checkNewCollide()) {
					// Error, cannot place
				} else {
					app.buildTower(app.newTower.x, app.newTower.y, 'bullet');
					app.placeNewTower = false;
				}
			} else if(!app.tooltip) {
			// Select tower
				var mousePos = app.getMousePos(canvas, e);
				mousePos.size = 1;
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
		} else { // Game is paused
			app.menus.pause.active = false;
			$('.action-pause').html("Pause");
		}
	},
	addTower: {
		init: function() {
			app.placeNewTower = true;
			canvas.addEventListener('mousemove', app.addTower.setNewPos);
		},
		setNewPos: function(e) {
			var mousePos = app.getMousePos(canvas, e);
			var size = 10;
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
			if(app.addTower.checkNewCollide()) {
				ctx.fillStyle = "rgba(228,16,16,0.5)";
			} else {
				ctx.fillStyle = "rgba(0,132,255,0.5)";
			}
			ctx.beginPath();
			ctx.arc(app.newTower.x, app.newTower.y, app.newTower.size, 0, Math.PI * 2, true);
			ctx.closePath();
			ctx.fill();
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
		app.player.cash -= 20;
		var size = 10;
		var range = 50;
		var ammo = 3;
		var rate = 500;
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
			'hp':20,
			'damage':5,
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
				'type':'bullet',
				'team':'creep',
				'hp':10,
				'damage':2,
				'style':"red"
			});
		}
	},
	updateTowers: function() {
		app.towers.forEach(function(tower) {
			ctx.fillStyle = tower.style;
			ctx.beginPath();
			ctx.arc(tower.x, tower.y, tower.size, 0, Math.PI * 2, true);
			ctx.closePath();
			ctx.fill();

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
			}
		});
	},
	updateEnemies: function() {
		app.enemies.forEach(function(enemy) {
			ctx.fillStyle = enemy.style;
			ctx.fillRect(enemy.x, enemy.y, enemy.size, enemy.size);

			if(enemy.target == app.planet) {
				app.findTarget(enemy, 'towers');
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
				    console.log(projectile.target);
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
			    if (projectile.owner.type == 'bullet') {
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
	findTarget: function(unit, enemy) {
		if(enemy == 'towers') {
			enemy = app.towers;
			// Set target to planet in case no towers in range
			unit.target = app.planet;
		} else {
			enemy = app.enemies;
		}
		// Loop through targettable enemies
		for(j=0; j < enemy.length; j++) {
			if(app.inSight(unit, enemy[j])) {
				unit.target = enemy[j];
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
					'size':2,
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
					app.player.addCash(5);
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
	}
}