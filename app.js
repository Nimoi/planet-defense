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
						size: 10,
						boundx: 142,
						boundy: 0,
						boundw: 40,
						boundh: 40,
						name: 'laser',
						price: 25,
						style: "#DA0734"
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
					for(i=0;i < context.buttons.length;i++) {
						// Display buttons
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
						var x = context.buttons[i].x - context.buttons[i].size*0.5;
						ctx.fillStyle = style;
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
			console.log(mousePos);
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
					var current = app.menus.gameplay.towers;
					for(i=0;i < current.buttons.length;i++) {
						var x1 = current.buttons[i].boundx;
						var x2 = x1 + current.buttons[i].boundw;
						var y1 = current.buttons[i].boundy;
						var y2 = y1 + current.buttons[i].boundh;
						if(mousePos.x > x1 && mousePos.x < x2) {
							if(mousePos.y > y1 && mousePos.y < y2) {
								// Add Tower
								app.addTower.init(current.buttons[i]);
							}
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
			var size = 10;
			var range = 60;
			var ammo = 1;
			var rate = 100;
			var hp = 15;
			var damage = 1;
			var style = "#DA0734";
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
	// Generate enemies
	spawnEnemies: function(num) {
		for(i=0; i < num; i++) {
			var size = 10;
			var x = app.width+(Math.random()*60)-10;
			var y = (app.height/2)+(Math.random()*60)-10;
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
			    	projectile.target.hp -= projectile.owner.damage;
			    	if(projectile.target.hp <= 0) {
			    		app.removeEntity(projectile.target, projectile.target.type);
			    	}
			    	// app.checkHealth(projectile.target);
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
				    if (projectile.owner.type == 'basic') {
						ctx.beginPath();
						ctx.arc(projectile.x, projectile.y, projectile.size, 0, Math.PI * 2, true);
						ctx.closePath();
						ctx.fill();
				    }
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
			    	// var laserPerams = {
			    	// 	ownerX: oX,
			    	// 	ownerY: oY,
			    	// 	targetX: tX,
			    	// 	targetY: tY
			    	// }
			    	// console.log(laserPerams);
		    	} else {
			    	// Remove Projectile
					projectile.active = false;
		    		// Remove damage interval
		    		clearInterval(projectile.owner.damageInterval);
		    		projectile.owner.damageInterval = 0;
		    		// Refill ammo
		    		++projectile.owner.ammo;
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
					    	unit.target.hp -= unit.damage;
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
	checkHealth: function(unit) { // Going to remove this!
		if(unit.hp <= 0) {
			if(unit.array != 'base') {
				var type;
				if(unit.array == 'player') {
					type = app.towers;
				} else if(unit.array == 'creep') {
					type = app.enemies;
				} else {
					console.log("Unidentified object shot:");
					console.log(unit);
				}
				// Remove unit from type
				app.removeEntity(unit);
			} else {
				// Planet
				console.log(app.planet.hp);
				app.planet.shine = "rgba(0,0,0,0)";
				app.planet.style = "rgba(0,0,0,0)";
			}	
		}
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