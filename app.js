/* Planetary Defense (reverse asteroids?)
* - Defend your planets against attackers
* - Build and upgrade defenses
* - Expand your planetary empire
*/
$(document).ready(function() {
	app.initialize();
});
var app = {
	width: 640,
	height: 360,
	stars: [],
	planet: {},
	towers: [],
	enemies: [],
	projectiles: [],
	spawnRate: 2000,
	numEnemies: 1,
	initialize: function() {
		// Init canvas
		canvas = document.getElementById("stage");
		canvas.width  = app.width;
		canvas.height = app.height;
		ctx = canvas.getContext("2d");

		// Init entities
		app.initStars();
		app.initPlanet();
		app.spawnEnemies();
		app.buildTower();

		// Start main loop
		setInterval(app.gameLoop, 25);
	},
	gameLoop: function() {
		app.clearCanvas();
		app.drawStars();
		app.drawPlanet();
		if(app.projectiles.length > 0) {
			app.updateProjectiles();
		}
		if(app.towers.length > 0) {
			app.updateTowers();
		}
		if(app.enemies.length > 0) {
			app.updateEnemies();
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
		app.planet.color1 = "rgba(255, 255, 255, 1)";
		app.planet.color2 = app.randColor();
		app.planet.x = app.width/2;
		app.planet.y = app.height/2;
		app.planet.radius = 100;
		app.planet.hp = 100;
		app.planet.team = "base";
	},
	drawPlanet: function() {
		var x = app.planet.x;
		var y = app.planet.y;
		var innerRadius = 1;
		var outerRadius = app.planet.radius;
		var gradient = ctx.createRadialGradient(x, y, innerRadius, x, y, outerRadius);
		gradient.addColorStop(0, app.planet.color1);
		gradient.addColorStop(1, app.planet.color2);
		ctx.fillStyle = gradient;
		ctx.beginPath();
		ctx.arc(x, y, outerRadius, 0, Math.PI * 2, true);
		ctx.closePath();
		ctx.fill();
	},
	// Generate a tower (temp)
	buildTower: function() {
		var x = 438;
		var y = 243;
		var radius = 10;
		var range = 50;
		var ammo = 3;
		var rate = 500;
		app.towers.push({
			'x':x,
			'y':y,
			'radius':radius,
			'range':range,
			'ammo':ammo,
			'rate':rate,
			'delay': false,
			'target':'',
			'type':'bullet',
			'team':'player',
			'hp':20,
			'damage':5
		});
	},
	// Generate enemies
	spawnEnemies: function(num) {
		for(i=0; i < num; i++) {
			var size = 10;
			var x = app.width+(Math.random()*60)-10;
			var y = app.height+(Math.random()*60)-10;
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
				'type':'bullet',
				'team':'creep',
				'hp':10,
				'damage':2
			});
		}
		window.setTimeout(function() {
		    app.spawnEnemies(app.numEnemies);
		}, app.spawnRate);
	},
	updateTowers: function() {
		app.towers.forEach(function(tower) {
			ctx.fillStyle = '#0084ff';
			ctx.beginPath();
			ctx.arc(tower.x, tower.y, tower.radius, 0, Math.PI * 2, true);
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
		ctx.fillStyle = "red";
		app.enemies.forEach(function(enemy) {
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
					ctx.arc(projectile.x, projectile.y, projectile.radius, 0, Math.PI * 2, true);
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
		} else {
			enemy = app.enemies;
		}
		// Loop through targettable enemies
		for(j=0; j < enemy.length; j++) {
			if(app.inRange(unit, enemy[j])) {
				console.log("New target found!");
				console.log(enemy);
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
					'radius':2,
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
	inRange: function(unit1, unit2) {
		// TODO: Better method of range detection
		var distance = Math.sqrt(Math.pow(unit1.x - unit2.x, 2) + Math.pow(unit1.y - unit2.y, 2)).toFixed(2);
		if(distance > unit1.range) {
			return false;
		} else {
			return true;
		}
	},
	collideDetect: function(unit1, unit2) {
		// TODO: Better collision detection. Optimize.
		var distance = Math.sqrt(Math.pow(unit1.x - unit2.x, 2) + Math.pow(unit1.y - unit2.y, 2)).toFixed(2);
		if(distance > 3) {
			return false;
		} else {
			return true;
		}
	},
	checkHealth: function(unit) {
		if(unit.hp <= 0) {
			if(unit.team != 'player') {
				var type;
				if(unit.team == 'player') {
					type = app.towers;
				} else if(unit.team == 'creep') {
					type = app.enemies;
				} else {
					console.log("Unidentified object shot:");
					console.log(unit);
				}
				for(i=0;i<type.length;i++) {
					if(unit == type[i]) {
						type.splice(i, 1);
					}
				}
			} else {
				app.planet = '';
			}	
		}
	},
	// Generate a random color
	randColor: function() {
		return '#'+ ('000000' + Math.floor(Math.random()*16777215).toString(16)).slice(-6);
	}
}