/* Planetary Defense
* - Defend your planets against attackers
* - Build and upgrade defenses
* TODOs: 
* - Indicate where enemies are coming from on the map ~5 seconds before they spawn
* - Include a cancel button when placing a tower
* - Tower upgrades (only increasing stats for now)
* - New enemy wave types, increasing wave difficulty
* - Increase wave stats based on wave level
* - Planet should crack to display damage
* - Towers should float away when the planet is destroyed
* - Target-less bullets should impact enemies they pass through
* - Drag and drop towers.
* - Explain buildable area better
* - Ensure projectiles don't overshoot their targets
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
	canvas.addEventListener('mousemove', app.moveHandle);
}
var app = {
	width: 640,
	height: 480,
	stars: [],
	planet: {},
	towers: [],
	enemies: [],
	projectiles: [],
	newTower: {},
	FPS:30,
	mode:'normal', // Hard mode enables enemies to attack towers
	initialize: function() {
		// Init canvas
		canvas.width = app.width;
		canvas.height = app.height;
		ctx = canvas.getContext("2d");
		// Init entities
		app.initStars();
		app.initPlanet();
		// Start main loop
		setInterval(app.gameLoop, 1000/app.FPS);
		app.smw = new Image();
		app.smw.src = 'smw2.png';
	},
	// Environment
	clearCanvas: function() {
		ctx.clearRect(0,0,app.width,app.height);
	},
	initStars: function() {
        for (i=0; i<=140; i++) {
          // Get random positions for stars
          var starx = ~~(Math.random() * (app.width*2));
          var stary = ~~(Math.random() * app.height);

          starFill = "rgba(255, 255, 255, "+Math.random()+")";
		  var colors = ['rgba(202,252,216,0.5)','rgba(4,191,191,0.5)'];
		  var color = (Math.random()*colors.length - 1).toFixed(0);
		  var blur = ((Math.random()*6)+1).toFixed(0);

          starSize = ~~(Math.random() * 3);
          app.stars.push([starFill, starx, stary, starSize, colors[color], blur]);
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
			ctx.shadowBlur = app.stars[i][5];
			ctx.shadowColor = app.stars[i][4];
			// Draw the given star
			ctx.fillStyle = app.stars[i][0];
			ctx.beginPath();
			ctx.arc(x, y, app.stars[i][3], 0, Math.PI * 2, true);
			ctx.closePath();
			ctx.fill();
		}
		ctx.shadowBlur = 0;
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
			ctx.shadowBlur = 10;
			ctx.shadowColor = "#FF5200";
			ctx.fillStyle = "#EEF66C";
			ctx.beginPath();
			ctx.arc(x, y, size, 0, Math.PI * 2, true);
			ctx.closePath();
			ctx.fill();
			ctx.shadowBlur = 0;
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
		app.planet.y = ((app.height - app.menus.gameplay.ticker.height - app.menus.gameplay.bottom.height)/2);
		app.planet.size = 100;
		app.planet.hp = 100;
		app.planet.array = 0;
		app.planet.alive = true;
		app.planet.range = (app.planet.size + 40)*2;
	},
	drawPlanet: function() {
		var x = app.planet.x;
		var y = app.planet.y;
		var innerRadius = 1;
		var outerRadius = app.planet.size;
		var gradient = ctx.createRadialGradient(x, y, innerRadius, x, y, outerRadius);
		gradient.addColorStop(0, app.planet.shine);
		gradient.addColorStop(1, app.planet.style);
		ctx.shadowBlur = 10;
		ctx.shadowColor = app.planet.style;
		ctx.fillStyle = gradient;
		ctx.beginPath();
		ctx.arc(x, y, outerRadius, 0, Math.PI * 2, true);
		ctx.closePath();
		ctx.fill();
		ctx.shadowBlur = 0;
	},
	menus: {
		main: {
			start: {
				x: 295.5,
				y: 240,
				w: 60,
				h: 30,
				str: "PLAY"
			},
			draw: function() {
				// Draw menu items
				var current = app.menus.main.start;
				// Title
				ctx.font = "28px Helvetica";
				ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
				str = "PLANET DEFENSE";
				var x = (app.width/2) - ctx.measureText(str).width/2;
				ctx.fillText(str, x, 140);
				// Start
				ctx.font = "20px Helvetica";
				var x = (app.width/2) - ctx.measureText(current.str).width/2; 
				ctx.fillText(current.str, x, current.y);
				// ctx.fillStyle = "red";
				// ctx.fillRect(current.x,current.y-current.h,current.w,current.h);
			}
		},
		gameplay: {
			towers: {
				height: 40,
				buttons: [{
						name: 'basic',
						description: 'Basic ballistic defense satellite.',
						x: 120,
						y: 10,
						boundx: 100,
						boundy: 0,
						boundw: 40,
						boundh: 40,
						size: 12,
						//Stats
						ammo: 3,
						rate: 500,
						hp: 20,
						damage: 5,
						price: 10,
						range: 60,
						style: 'rgba(0,132,255,1)',
						image: ''
					}, {
						name: 'laser',
						description: 'Defense satellite utilizing a directed-energy weapon.',
						x: 162,
						y: 10,
						boundx: 142,
						boundy: 0,
						boundw: 40,
						boundh: 40,
						size: 12,
						//Stats
						ammo: 1,
						rate: 100,
						hp: 15,
						damage: 1,
						price: 20,
						range: 50,
						style: "#FF8638",
						image: ''
					}, {
						name: 'shock',
						description: 'EMP satellite pulses a disabling field.',
						x: 204,
						y: 10,
						boundx: 184,
						boundy: 0,
						boundw: 40,
						boundh: 40,
						size: 12,
						//Stats
						ammo: 1,
						rate: 1000,
						hp: 25,
						damage: 2,
						price: 30,
						range: 30,
						style: "#EFC94C",
						image: ''
					}, {
						name: 'rocket',
						description: 'Satellite launches mid-range missiles.',
						x: 246,
						y: 10,
						boundx: 226,
						boundy: 0,
						boundw: 40,
						boundh: 40,
						size: 12,
						//Stats
						ammo: 2,
						rate: 1500,
						hp: 30,
						damage: 8,
						price: 40,
						range: 40,
						style: "#F3210A",
						image: ''
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
						ctx.strokeStyle = style;
						ctx.strokeRect(x, context.buttons[i].y, 12, 12);
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
				startTime: 0,
				elapsed: function() {
					return Date.now() - app.menus.gameplay.timer.startTime - app.menus.pause.elapsedTime;
				},
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
					if(app.planet.hp > 0) {
						hpw = (app.planet.hp * w)/100;
						y += 1;
						h -= 2;
						ctx.fillStyle = "rgba(149, 209, 39, 0.9)";
						ctx.fillRect(x, y, hpw, h);
					}
				},
			},
			ticker: {
				height: 20,
				draw: function() {
					var context = app.menus.gameplay.ticker;
					// Menu background
					ctx.fillStyle = "rgba(25, 25, 25, 0.75)";
					var y = app.height-app.menus.gameplay.bottom.height-context.height;
					ctx.fillRect(0, y, app.width, context.height);
					// Menu border
					ctx.fillStyle = "rgba(255, 255, 255, 0.1)";
					y -= 1;
					ctx.fillRect(0, y, app.width, 1);
				},
			},
			bottom: {
				height: 90,
				draw: function() {
					var context = app.menus.gameplay.bottom;
					// Menu background
					ctx.fillStyle = "rgba(25, 25, 25, 0.5)";
					var y = app.height-context.height;
					ctx.fillRect(0, y, app.width, context.height);
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
					window.setTimeout(function() {
						app.state.current = 'gameover';
						app.menus.gameOver.finalTime = app.menus.gameplay.timer.elapsedTime();
					}, 3000);
				}
			},
			retry: {
				x: 295.5,
				y: 240,
				w: 60,
				h: 30,
				str: "RETRY"
			},
			draw: function() {
				var current = app.menus.gameOver.retry;
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
				// Draw retry
				var x = (app.width/2) - (ctx.measureText(current.str).width/2);
				ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
				ctx.fillText(current.str, x, current.y);
				// ctx.fillStyle = "red";
				// ctx.fillRect(current.x,current.y-current.h,current.w,current.h);
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
		current: 'mainmenu',
		mainmenu: function() {
			app.clearCanvas();
			app.drawStars();
			app.menus.main.draw();
		},
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
				// if(!app.menus.gameOver.active) {
					app.wave.check();
				// }
				// Only draw UI while game is active
				app.menus.gameplay.towers.draw();
				app.menus.gameplay.timer.draw();
				app.menus.gameplay.health.draw();
				app.menus.pause.button.draw();
				// Bottom
				app.menus.gameplay.ticker.draw();
				app.menus.gameplay.bottom.draw();
				// Display tooltip
				app.tooltip.draw();
			}
			if(app.planet.hp <= 0) {
				app.menus.gameOver.activate();
			}
		},
		gameover: function() {
			app.clearCanvas();
			app.drawStars();
			app.menus.gameOver.end();
		},
	},
	player: {
		cash: 50,
		updateCash: function(amount) {
			if(amount > 0) {
				// Color green
			} else {
				// color red
			}
			app.player.cash = parseInt(app.player.cash) + parseInt(amount);
		},
	},
	gameLoop: function() {
		if(app.state.current == 'mainmenu') {
			app.state.mainmenu();
		} else if(app.state.current == 'gameplay') {
			app.state.gameplay();
		} else if(app.state.current == 'gameover') {
			app.state.gameover();
		}
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
		// Get mouse position
		var mousePos = app.getMousePos(canvas, e);
		mousePos.size = 1;
		// console.log(mousePos);
		if(app.state.current == 'mainmenu') {
			var current = app.menus.main.start;
			if(app.checkButton(mousePos,current.x,current.y-current.h,current.w,current.h)) {
				app.state.current = 'gameplay';
				app.menus.gameplay.timer.startTime = Date.now();
			}
		} else if(app.state.current == 'gameplay') {
			if(!app.menus.pause.active) { // Game is active
				// Tower placement
				if(app.placeNewTower) {
					if(mousePos.y > app.menus.gameplay.towers.height) {
						if(!app.addTower.checkNewCollide()) {
							app.buildTower(app.newTower.x, app.newTower.y, app.newTower);
							if(!e.shiftKey || app.player.cash < app.newTower.price) {
								app.placeNewTower = false;
							}
						}
					}
				} else {
					var tip = false;
					// Display tooltips
					app.towers.forEach(function(tower) {
						// Clicked on a tower?
						if(tower.bobNum <= -1) {
							tower.bob = 1;
						} else if(tower.bobNum >= 1) {
							tower.bob = 0;
						}
						if(tower.bob) {
							tower.bobNum += 0.02;
						} else {
							tower.bobNum -= 0.02;
						}
						var y = tower.bobNum + tower.y;
						if(app.checkButton(mousePos,tower.x,y,tower.size,tower.size)) {
							console.log("Tower clicked!");
							app.tooltip.target = tower;
							app.tooltip.active = true;
							tip = true;
						}
					});
					// Clicked on tooltip
					var bottom = app.menus.gameplay.bottom;
					var ticker = app.menus.gameplay.ticker;
					var w = 200;
					var h = 40;
					var x = 0;
					var y = app.height - bottom.height - ticker.height - h - 10;
					if(app.checkButton(mousePos,x,y,w,h)) {
						// Tooltip clicked
						tip = true;
						sell = app.tooltip.buttons.sell.dim();
						if(app.checkButton(mousePos,sell.x,sell.y,sell.w,sell.h)) {
							// Sell
							if(app.tooltip.target) {
								app.removeEntity(app.tooltip.target);
								var value = (app.tooltip.target.value*0.75).toFixed(0);
								app.player.updateCash(value);
								app.tooltip.target = 0;
							}
							tip = false;
						}
						upgrade = app.tooltip.buttons.upgrade.dim();
						if(app.checkButton(mousePos,upgrade.x,upgrade.y,upgrade.w,upgrade.h)) {
							// Upgrade
							if(app.tooltip.target) {
								if(app.tooltip.target.level < 5) {
									var price = app.tooltip.target.value*1.75;
									if(app.player.cash >= price) {
										app.level.upgrade(app.tooltip.target);
										app.player.updateCash(-price);
									}
								}
							}
						}
					}
					// Clicked on bottom menu
					y = app.height - bottom.height;
					w = app.width;
					if(app.checkButton(mousePos,0,y,w,bottom.height)) {
						// Bottom menu clicked
						tip = true;
						console.log('Bottom menu clicked');
					}
					if(!tip) {
						app.tooltip.active = false;
					}
					// Clicked on top menu
					if(mousePos.y <= app.menus.gameplay.towers.height) {
						// Tower clicked
						var current = app.menus.gameplay.towers.buttons;
						for(i=0;i < current.length;i++) {
							if(app.checkButton(mousePos,current[i].boundx,current[i].boundy,current[i].boundw,current[i].boundh)) {
								// Add Tower
								app.addTower.init(current[i]);
							}
						}
						// Pause clicked
						var current = app.menus.pause.button;
						if(app.checkButton(mousePos,current.x,current.y,current.w,current.h)) {
							app.menus.pause.toggle();
						}
					}
				}
			} else { // Game is paused
				app.menus.pause.toggle();
			}
		} else if(app.state.current == 'gameover') {
			var current = app.menus.main.start;
			if(app.checkButton(mousePos,current.x,current.y-current.h,current.w,current.h)) {
				// Reset game
				app.initPlanet();
				app.enemies = [];
				app.towers = [];
				app.projectiles = [];
				app.particles.items = [];
				app.player.cash = 50;
				app.wave.reset();
				app.menus.gameOver.active = false;
				app.menus.gameplay.timer.startTime = Date.now();
				app.tooltip.active = 0;
				app.tooltip.target = 0;
				app.state.current = 'gameplay';
			}
		}
	},
	moveHandle: function(e) {
		// Get mouse position
		var mousePos = app.getMousePos(canvas, e);
		mousePos.size = 1;
		if(app.state.current == 'mainmenu') {
			//
		} else if(app.state.current == 'gameplay') {
			if(!app.menus.pause.active) {
				// Game is active
				var tip = false;
				// Hover top menu
				if(mousePos.y <= app.menus.gameplay.towers.height) {
					// Tower clicked
					var current = app.menus.gameplay.towers.buttons;
					for(i=0;i < current.length;i++) {
						if(app.checkButton(mousePos,current[i].boundx,current[i].boundy,current[i].boundw,current[i].boundh)) {
							// Display tooltip
							if(app.tooltip.target2 != current[i]) {
								app.tooltip.target2 = current[i];
							}
							tip = true;
						}
					}
				}
				if(!tip) {
					if(app.tooltip.target2) {
						app.tooltip.target2 = 0;
					}
				}
			}
		}
	},
	checkButton: function(pos,x,y,w,h) {
		var mousePos = pos;
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
	},
	addTower: {
		init: function(tower) {
			// "tower" contains button object
			if(app.player.cash >= tower.price) {
				app.placeNewTower = true;
				app.newTower = tower;
				app.newTower = {
					'type':tower.name,
					'size':tower.size,
					'style':tower.style,
					'image':tower.image,
					//Stats
					'ammo':tower.ammo,
					'rate':tower.rate,
					'hp':tower.hp,
					'damage':tower.damage,
					'price':tower.price,
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
			var vision = false;
			app.towers.forEach(function(tower) {
				if(app.collideDetect(app.newTower, tower)) {
					noRoom = true;
				}
				if(app.inVision(tower, app.newTower)) {
					vision = true;
				}
			});
			if(app.inVision(app.planet, app.newTower)) {
					vision = true;
			}
			if(app.collideDetect(app.newTower, app.planet) || noRoom || !vision) {
				return true;
			} else {
				return false;
			}
		},
		showBuildable: function() {
			// Planet range
			ctx.beginPath();
			ctx.arc(app.planet.x, app.planet.y, app.planet.range/2, 0, Math.PI * 2, true);
			app.towers.forEach(function(tower) {
				var x = tower.x +(tower.size/2);
				var y = tower.y +(tower.size/2);
				ctx.moveTo(x,y);
				ctx.arc(x, y, 30, 0, Math.PI * 2, true);
			});
			ctx.closePath();
			ctx.fillStyle = "rgba(100,100,100,0.2)";
			ctx.fill();
		},
		updateNewTower: function() {
			if(app.newTower.y > app.menus.gameplay.towers.height) {
				// Buildable
				app.addTower.showBuildable();
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
		target2: 0,
		buttons: {
			sell: {
				dim: function() {
					var bottom = app.menus.gameplay.bottom;
					var ticker = app.menus.gameplay.ticker;
					var w = 80;
					var h = 20;
					var x = 5;
					var y = app.height - bottom.height - ticker.height - h - 20;
					var dim = {
						'x':x,
						'y':y,
						'w':w,
						'h':h
					};
					return dim;
				},
				draw: function(unit) {
					// BG
					var dim = app.tooltip.buttons.sell.dim();
					ctx.fillStyle = "rgba(255,255,255,0.1)";
					ctx.fillRect(dim.x, dim.y, dim.w, dim.h);
					// STR
					var price = unit.value*0.75;
					var str = "Sell $"+price.toFixed(0);
					var x = dim.x+dim.w/2-ctx.measureText(str).width/2;
					ctx.font = "bold 12px Helvetica";
					ctx.fillStyle = "rgba(255,255,255,1)";
					ctx.fillText(str, x, dim.y+15);
				},
			},
			upgrade: {
				dim: function() {
					var current = app.tooltip.buttons;
					var bottom = app.menus.gameplay.bottom;
					var ticker = app.menus.gameplay.ticker;
					var sellDim = current.sell.dim();
					var w = 100;
					var h = 20;
					var x = sellDim.x + sellDim.w + 5;
					var y = app.height - bottom.height - ticker.height - h - 20;
					var dim = {
						'x':x,
						'y':y,
						'w':w,
						'h':h
					};
					return dim;
				},
				draw: function(unit) {
					// BG
					var dim = app.tooltip.buttons.upgrade.dim();
					ctx.fillStyle = "rgba(255,255,255,0.1)";
					ctx.fillRect(dim.x, dim.y, dim.w, dim.h);
					// STR
					if(unit.level < 5) {
						var price = unit.value*1.75;
						var str = "Upgrade $"+price.toFixed(0);
					} else {
						var str = "MAXED";
					}
					var x = dim.x+dim.w/2-ctx.measureText(str).width/2;
					ctx.font = "bold 12px Helvetica";
					ctx.fillStyle = "rgba(255,255,255,1)";
					ctx.fillText(str, x, dim.y+15);
				},
			},
		},
		draw: function() {
			var unit = app.tooltip.target;
			var bottom = app.menus.gameplay.bottom;
			var ticker = app.menus.gameplay.ticker;
			if(app.tooltip.active) {
				if(app.tooltip.target.alive) {
					// Show range
					ctx.strokeStyle = unit.style;
					var x = unit.x +(unit.size/2);
					var y = unit.y +(unit.size/2);
					ctx.beginPath();
					ctx.arc(x, y, unit.range, 0, Math.PI * 2, true);
					ctx.closePath();
					ctx.stroke();
					// UPGRADE/SELL
					app.tooltip.buttons.sell.draw(unit);
					app.tooltip.buttons.upgrade.draw(unit);
					// Panel BG
					var w = 200;
					var h = 40;
					x = 0;
					y = app.height - bottom.height - ticker.height - h - 10;
					ctx.strokeStyle = "rgba(255,255,255,0.4)";
					ctx.lineWidth = 0.5;
					ctx.strokeRect(x, y, w, h);
					ctx.fillStyle = "rgba(0,0,0,0.4)";
					ctx.fillRect(x, y, w, h);
					ctx.lineWidth = 1;
					// Bottom
					y = app.height - bottom.height;
					// Stats
					ctx.font = "14px Helvetica";
					ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
					var str = unit.type+" "+unit.level;
					x += 10;
					y += 20;
					ctx.fillText(str.toUpperCase(), x, y);
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
					str = "Rate: "+(unit.rate/100).toFixed(1);
					ctx.fillText(str, x, y);
					// Upgrades
					if(unit.level < 5) {
						var upgrades = app.level.next(unit);
						ctx.font = "14px Helvetica";
						ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
						x = 120;
						y = app.height - bottom.height + 20;
						str = "Level "+upgrades.level;
						ctx.fillText(str.toUpperCase(), x, y);
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
						str = "Rate: ";
						ctx.fillText(str, x, y);
						var strlen = ctx.measureText(str).width;
						str = ((unit.rate-upgrades.rate)/100).toFixed(1);
						ctx.fillStyle = "rgba(149, 209, 39, 0.9)";
						ctx.fillText(str, x+strlen, y);
						ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
					}
				}
			}
			if(app.tooltip.target2) {
				var target = app.tooltip.target2;
				var maxWidth = app.width/2 - 40;
				var lineHeight = 16;
				x = app.width/2 + 10;
				y = app.height - bottom.height + 16;
				// Name
				ctx.font = "12px Helvetica";
				str = target.name;
				str += ' Satellite';
				ctx.fillStyle = "rgba(255, 255, 255, 1)";
				ctx.fillText(str.toUpperCase(), x, y);
				// Stats
				y += 20;
				var rate = (target.rate/100).toFixed(1);
				str = 'Damage: '+target.damage+'  Range: '+target.range+'  Rate: '+rate;
				if(app.mode == 'hard') {
					str += '  HP: '+target.hp;
				}
				ctx.fillText(str, x, y);
				// Description
				y += 20;
				str = target.description;
				ctx.fillStyle = "rgba(255, 255, 255, 1)";
				app.wrapText(ctx, str, x, y, maxWidth, lineHeight);
			}
		},
	},
	level : {
		next: function(tower) {
			// console.log(tower);
			var level = tower.level + 1;
			var price = level*tower.value;
			if(tower.type == 'basic') {
				var range = ~~(tower.range*0.2);
				var ammo = 2;
				var rate = 100;
				var hp = tower.hp;
				var damage = ~~(tower.damage*1.25);
				var image;
			} else if(tower.type == 'laser') {
				var range = ~~(tower.range*0.2);
				var ammo = 0;
				var rate = 0;
				var hp = tower.hp;
				var damage = ~~(tower.damage*1.3);
				var image;
			} else if(tower.type == 'shock') {
				var range = ~~(tower.range*0.2);
				var ammo = 0;
				var rate = 100;
				var hp = tower.hp;
				var damage = tower.damage;
				var image;
			} else if(tower.type == 'rocket') {
				var range = ~~(tower.range*0.2);
				var ammo = 1;
				var rate = 100;
				var hp = tower.hp;
				var damage = ~~(tower.damage*1.5);
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
		},
		upgrade: function(tower) {
			var l = app.level;
			var s = l.next(tower);
			if(s.range) {
				tower.range += s.range;
			}
			if(s.ammo) {
				tower.ammo += s.ammo;
			}
			if(s.rate) {
				tower.rate -= s.rate;
			}
			if(s.maxhp) {
				tower.maxhp += s.maxhp;
				tower.hp += s.maxhp;
			}
			if(s.damage) {
				tower.damage += s.damage;	
			}
			tower.level = s.level;
			tower.value = s.price;
		},
	},
	buildTower: function(x, y, tower) {
		app.player.cash -= tower.price;
		app.towers.push({
			'x':x,
			'y':y,
			'size':tower.size,
			'range':tower.range,
			'ammo':tower.ammo,
			'rate':tower.rate,
			'delay': false,
			'target':'',
			'type':tower.type,
			'alignment':'player',
			'hp':tower.hp,
			'maxhp':tower.hp,
			'damage':tower.damage,
			'defaultStyle':tower.style,
			'style':tower.style,
			'image':tower.image,
			'level':1,
			'value':tower.price,
			'alive':true,
			'bob':0,
			'bobNum':0
		});
	},
	wave: {
		active: true,
		waveNum: 0,
		qNum: 0,
		qi: 0,
		toSpawn: 0,
		start: 0,
		elapsed: 0,
		// qStart: 0,
		// qElapsed: 0,
		ready: false,
		level: 1,
		types: [{
			'type':'basic',
			'formation':1,
		}, {
			'type':'slow',
			'formation':1,
		}, {
			'type':'fast',
			'formation':1,
		}, {
			'type':'boss',
			'formation':1,
		}],
		// [type, num, delay, sector]
		waves: [
			[[0,3,10,1],[0,5,5,1],[1,1,5,1],[0,5,5,1],[1,2,1,1]],
			[[0,20,15,1],[2,5,15,1],[2,5,0,1],[3,3,10,1],[2,8,5,1],[2,8,0,1]],
			[[3,1,15,1],[3,1,0,1],[3,1,0,1],[3,1,0,1],[3,1,0,1]],
			[[3,1,15,1],[3,1,0,1],[3,1,0,1],[3,1,0,1],[3,1,0,1]],
			[[3,1,0,1],[3,1,0,1],[3,1,0,1],[3,1,0,1],[3,1,0,1]],
		],
		queue: [],
		check: function() {
			w = app.wave;
			var e = app.menus.gameplay.timer.elapsed();
			var time = (e/1000).toFixed(0);
			// console.log(time%12);
			if(app.wave.queue.length == 0) {
				if(time%10 == 1) {
					w.start = Date.now();
					w.queue.push(w.waves[w.waveNum]);
				}
			}
			if(app.wave.queue.length > 0) {
				// Spawn next queue wave
				if(w.ready) {
					w.spawn();
					w.ready = false;
					w.start = Date.now();
				} else {
					// Updated elapsed time
					w.elapsed = Date.now() - w.start - app.menus.pause.elapsedTime;
					// console.log((w.elapsed/1000).toFixed(0));
					// console.log((w.queue[w.qNum][w.qi][2]));
					var delay = w.queue[w.qNum][w.qi][2];
					if((w.elapsed/1000).toFixed(0) <= delay 
						&& (w.elapsed/1000).toFixed(0) >= delay - 10) {
						// Alert
						w.alert(w.queue[w.qNum][w.qi][3]);
					}
					if((w.elapsed/1000).toFixed(0) >= delay) {
						// Spawn next queued item
						w.ready = true;
					}
				}
			}
		},
		spawn: function() {
			w = app.wave;
			typeNum = w.queue[w.qNum][w.qi][0];
			num = w.queue[w.qNum][w.qi][1]; // Number of enemies
			sector = w.queue[w.qNum][w.qi][3]; // Sector
			type = w.types[typeNum]; // Type
			app.spawnEnemies(type.type,type.formation,num,sector);
			// --w.queue[w.qNum][w.qi][1];
			// if(w.queue[w.qNum][w.qi][1] <= 0) {
				w.qi++;
				// w.ready = false;
				w.qStart = 0;
			// }
			if(w.qi >= w.queue[w.qNum].length) {
				// Reset queue item
				w.qi = 0;
				w.qNum++;
			}
			if(w.qNum >= w.queue.length) {
				// Reset queue
				w.qNum = 0;
				w.queue = [];
				w.waveNum++;
				w.start = 0;
			}
			if(w.waveNum >= w.waves.length) {
				// Reset waves
				w.waveNum = 0;
				w.level++;
				// TODO
				// Increase wave stats based on wave level
			}
		},
		alertGlow: 1,
		alertGlowD: 0,
		alert: function(sector) {
			var w = app.wave;
			var bottom = app.menus.gameplay.bottom;
			var x,y;
			var bottomEdge = app.height - 40 - bottom.height;
			if(sector == 1) {
				x = app.width - 20;
				y = (app.height/3)/2+20;
			} else if(sector == 2) {
				x = app.width - 20;
				y = app.height/2-40;
			} else if(sector == 3) {
				x = app.width - 20;
				y = app.height - bottom.height - 40;
			} else if(sector == 4) {
				x = (app.width/3)/2+(app.width/3)*2;
				y = bottomEdge;
			} else if(sector == 5) {
				x = app.width/2;
				y = bottomEdge;
			} else if(sector == 6) {
				x = (app.width/3)/2;
				y = bottomEdge;
			} else if(sector == 7) {
				x = 20;
				y = bottomEdge;
			} else if(sector == 8) {
				x = 20;
				y = app.height/2-40;
			} else if(sector == 9) {
				x = 20;
				y = (app.height/3)/2+20;
			}
			// ctx.fillStyle = "rgba(185,18,27,1)";
			// ctx.fillRect(x, y, 10, 10);
			var style = "rgba(185,18,27,1)";
			ctx.shadowColor = "#FF3125";
			ctx.shadowBlur = w.alertGlow;
			str = "!";
			ctx.font = "bold 20px Helvetica";
			ctx.fillStyle = style;
			ctx.strokeStyle = style;
			ctx.fillText(str, x, y);
			x -= 7;
			y += 2;
			var y2 = y - 24;
			var x2 = x + 24;
			var x3 = x + 24/2;
			ctx.beginPath();
			ctx.moveTo(x,y);
			ctx.lineTo(x2,y);
			ctx.lineTo(x3,y2);
			ctx.lineTo(x,y);
			ctx.closePath();
			ctx.stroke();
			// Update glow
			if(w.alertGlowD == 0) {
				w.alertGlow -= 0.5;
			} else {
				w.alertGlow += 0.5;
			}
			if(w.alertGlow > 8) {
				w.alertGlowD = 0;
			}
			if(w.alertGlow <= 1) {
				w.alertGlowD = 1;
			}
			// console.log(w.alertGlow);
			ctx.shadowBlur = 0;
		},
		reset: function() {
			var w = app.wave;
			w.active = true;
			w.waveNum = 0;
			w.qNum = 0;
			w.qi = 0;
			w.toSpawn = 0;
			w.start = 0;
			w.elapsed = 0;
			w.ready = false;
			w.level = 1;
			w.queue = [];
		},
	},
	// Generate enemies
	spawnEnemies: function(type, formation, num, sector) {
		// Default stats
		var size = 10;
		var range = 20;
		var speed = 1.5;
		var ammo = 2;
		var rate = 500;
		var damage = 2;
		var maxhp = 5;
		var value = 1;
		if(type == 'basic') {
			//
		}
		if(type == 'slow') {
			size = 12;
			maxhp = 20;
			value = 2;
			speed = 1;
		}
		if(type == 'fast') {
			size = 8;
			maxhp = 3;
			speed = 2;
		}
		if(type == 'boss') {
			size = 15;
			maxhp = 25;
			speed = 0.5;
		}
		var level = app.wave.level;
		for(i=0;i<level;i++) {
			rate = rate * 0.8;
			damage = damage * 1.2;
			maxhp = maxhp * 2;
			value = value * 2;
		}

		// Sectors
		console.log("Spawning enemies in sector: "+sector);
		var x,y;
		var distance = Math.random()*60;
		if(sector == 1) { // Right
			y = ~~((Math.random()*(app.height/3-40))+40);
			x = app.width+(distance)-10;
		} else if(sector == 2) {
			y = ~~((Math.random()*(app.height/3-40))+40+app.height/3);
			x = app.width+(distance)-10;
		} else if(sector == 3) {
			y = ~~((Math.random()*(app.height/3-40))+40+(app.height/3)*2);
			x = app.width+(distance)-10;
		} else if(sector == 4) { // Bottom
			y = app.height+(distance)-10;
			x = ~~((Math.random()*(app.width/3))+(app.width/3)*2);
		} else if(sector == 5) {
			y = app.height+(distance)-10;
			x = ~~((Math.random()*(app.width/3))+(app.width/3));
		} else if(sector == 6) {
			y = app.height+(distance)-10;
			x = ~~((Math.random()*app.width/3));
		} else if(sector == 7) { // Left
			y = ~~((Math.random()*(app.height/3-40))+40+(app.height/3)*2);
			x = -(distance)-10;
		} else if(sector == 8) {
			y = ~~((Math.random()*(app.height/3-40))+40+app.height/3);
			x = -(distance)-10;
		} else if(sector == 9) {
			y = ~~((Math.random()*(app.height/3-40))+40);
			x = -(distance)-10;
		}
		var offset;
		if(formation == 1) {
			if(sector == 1 || sector == 2 || sector == 3) {
				offset = [{
					x: size + 10,
				}];
			} else if(sector == 4 || sector == 5 || sector == 6) {
				offset = [{
					y: size + 10,
				}];
			} else if(sector == 7 || sector == 8 || sector == 9) {
				offset = [{
					x: -(size) - 10,
				}];
			}
		}
		for(i=0; i < num; i++) {
			var stats = {
				'sector':sector,
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
				'alignment':'invaders',
				'hp':maxhp,
				'maxhp':maxhp,
				'damage':damage,
				'defaultStyle':"red",
				'style':"red",
				'alive':true,
				'value':value,
				'slowed':false
			}
			app.enemies.push(stats);
			if(offset[0].x) {
				x += offset[0].x;
			}
			if(offset[0].y) {
				y += offset[0].y;
			}
		}
	},
	updateTowers: function() {
		app.towers.forEach(function(tower) {
			// Bob
			if(tower.bobNum <= -1) {
				tower.bob = 1;
			} else if(tower.bobNum >= 1) {
				tower.bob = 0;
			}
			if(tower.bob) {
				tower.bobNum += 0.02;
			} else {
				tower.bobNum -= 0.02;
			}
			var y = tower.bobNum + tower.y;

			// Draw Tower
			function drawTower() {
				ctx.fillStyle = "rgba(20,20,20,1)";
				ctx.strokeStyle = tower.style;
				ctx.fillRect(tower.x, y, tower.size, tower.size);
				ctx.strokeRect(tower.x, y, tower.size, tower.size);
				
				ctx.fillStyle = tower.style;
				// ctx.drawImage(app.smw,9,244,18,18,tower.x,y,20,20);
				if(tower.type == 'basic') {
					ctx.strokeRect(tower.x+tower.size/4, y+tower.size/4, tower.size/2, tower.size/2);
				} else if(tower.type == 'laser') {
					ctx.fillRect(tower.x+tower.size/4, y+tower.size/4, tower.size/2, tower.size/2);
				}
			}
			// Anchor
			ctx.beginPath();
			// move to the last tracked coordinates in the set, then draw a line to the current x and y
			ax = tower.x + tower.size/2;
			ay = y + tower.size/2;
			ctx.moveTo(ax, ay);
			ay += 14;
			ctx.lineTo(ax, ay);
			ctx.strokeStyle = app.planet.defaultStyle;
			ctx.stroke();
			ctx.closePath();
			ctx.strokeStyle = app.planet.defaultStyle;
			ctx.beginPath();
			ctx.arc(ax, ay, 2, 0, Math.PI * 2, true);
			ctx.closePath();
			ctx.stroke();
			// Tower
			if(tower.target) {
				ctx.save();
				var transx = tower.x + 0.5*tower.size;
				var transy = y + 0.5*tower.size;
				ctx.translate(transx, transy);
				var rotation = Math.atan2(tower.target.y - y, tower.target.x - tower.x);
				// * (180 / Math.PI) //rads
				ctx.rotate(rotation);
				ctx.translate(-transx, -transy);
				drawTower();
				ctx.restore();
			} else {
				drawTower();
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
				var y = tower.y - 5 + tower.bobNum;
				ctx.fillStyle = "rgba(255, 255, 255, 0.1)";
				ctx.fillRect(x, y, w, h);
				// Health
				hpw = (tower.hp * w)/tower.maxhp;
				y += 1;
				h -= 2;
				ctx.fillStyle = "rgba(149, 209, 39, 0.9)";
				ctx.fillRect(x, y, hpw, h);
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
			ctx.strokeStyle = enemy.style;
			ctx.translate(-transx, -transy);
			// Test Shape
			var x = enemy.x;
			var y = enemy.y;

			var y2 = y + enemy.size;

			var x2 = x + enemy.size;
			var y3 = y2 - enemy.size/2;
			ctx.beginPath();
			ctx.moveTo(x,y);
			ctx.lineTo(x,y2);
			ctx.lineTo(x2,y3);
			ctx.lineTo(x,y);
			ctx.closePath();
			// ctx.fill();
			ctx.stroke();
			// ctx.fillRect(enemy.x, enemy.y, enemy.size, enemy.size);
			// ctx.drawImage(app.smw,177,1124,20,20,enemy.x,enemy.y,20,20);
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
				hpw = (enemy.hp * w)/enemy.maxhp;
				y += 1;
				h -= 2;
				ctx.fillStyle = "rgba(149, 209, 39, 0.9)";
				ctx.fillRect(x, y, hpw, h);
			}
		});
	},
	updateProjectiles: function() {
		app.projectiles.forEach(function(prj, i, arr) {
			if(prj.owner.type == 'basic') {
		    	// Check collision
		    	if(prj.target.alive) {
					app.moveTarget(prj);
					var collide = false;
					var speed = 1;
					if(prj.speed > 1) {
						speed = prj.speed.toFixed(0);
					}
					for(i=0;i<speed;i++) {
						// TODO: calculate each step and check for collision
						if(app.collideDetect(prj, prj.target)) {
							collide = true;
						}
					}
			    	if(collide) {
				    	// Return ammo
				    	++prj.owner.ammo;
				    	// Remove health
				    	app.damageEntity(prj.target,prj.owner.damage);

				    	// Remove prj
				    	prj.alive = false;
				    }
			    } else {
					// slow down the particle
					prj.speed *= prj.friction;
					// apply velocity
					prj.x += Math.cos( prj.angle ) * prj.speed;
					prj.y += Math.sin( prj.angle ) * prj.speed + prj.gravity;
			    	if(prj.y+prj.size > app.height 
			    		|| prj.y+prj.size < 0 
			    		|| prj.x+prj.size > app.width 
			    		|| prj.x+prj.size < 0) {
				    	// Return ammo
				    	++prj.owner.ammo;
			    		// Remove prj
				    	prj.alive = false;
			    	}
			    }
		    	// Draw prj
			    ctx.fillStyle = prj.style;
				ctx.beginPath();
				ctx.arc(prj.x, prj.y, prj.size, 0, Math.PI * 2, true);
				ctx.closePath();
				ctx.fill();
		    } else if(prj.owner.type == 'laser') {
		    	if(prj.target.hp > 0 && app.inRange(prj.owner, prj.target)) {
			    	ctx.lineWidth = 1;
					ctx.strokeStyle = prj.style;
					ctx.beginPath();
					var oX = prj.owner.x + prj.owner.size/2;
					var oY = prj.owner.y + prj.owner.size/2;
					var tX = prj.target.x + prj.target.size/2;
					var tY = prj.target.y + prj.target.size/2;
			    	ctx.moveTo(oX,oY);
			    	ctx.lineTo(tX,tY);
			    	ctx.stroke();
		    	} else {
			    	// Remove prj
					prj.alive = false;
		    		// Remove damage interval
		    		clearInterval(prj.owner.damageInterval);
		    		prj.owner.damageInterval = 0;
		    		// Refill ammo
		    		++prj.owner.ammo;
		    	}
		    } else if(prj.owner.type == 'shock') {
		    	var x = prj.owner.x + (prj.owner.size/2);
		    	var y = prj.owner.y + (prj.owner.size/2);
		    	prj.size = prj.size*0.8;
		    	if(prj.owner.shockStyle == "rgba(69,178,157,0)") {
		    		prj.size = prj.owner.range;
		    	}
		    	// Draw prj
			    ctx.fillStyle = prj.owner.shockStyle;
				ctx.beginPath();
				ctx.arc(x, y, prj.size, 0, Math.PI * 2, true);
				ctx.closePath();
				ctx.fill();
				// Destroy if owner removed
				if(prj.owner.alive == false || prj.owner == null) {
					prj.alive = false;
				}
		    } else if(prj.owner.type == 'rocket') {
		    	if(prj.explode == 0) {
					app.moveTarget(prj);
			    	// Check collision
			    	if(app.collideDetect(prj, prj.target)) {
				    	// Return ammo
				    	++prj.owner.ammo;
			    		// Explode
			    		prj.explode = 1;
			    		prj.size = prj.range;
			    		for(i=0;i<app.enemies.length;i++) {
			    			if(app.inRange(prj,app.enemies[i])) {
			    				app.damageEntity(app.enemies[i],prj.owner.damage);
			    			}
			    		}
					}
				} else if(prj.explode == 1) {
			    	// Explode, then remove prj
			    	// prj.explode = 2;
					var outerRadius = 20;
					var gradient = ctx.createRadialGradient(prj.x, prj.y, prj.rad, prj.x, prj.y, outerRadius);
					gradient.addColorStop(0, "rgba(239,201,76,0)");
					gradient.addColorStop(1, "rgba(243,33,10,1)");
			    	prj.style = gradient;
			    	prj.size -= 2;
			    	if(prj.size <= 0) {
			    		prj.alive = false;
			    	}
				}
		    	// Draw prj
			    ctx.fillStyle = prj.style;
				ctx.beginPath();
				ctx.arc(prj.x, prj.y, prj.size, 0, Math.PI * 2, true);
				ctx.closePath();
				ctx.fill();
		    }
		});
		app.projectiles = app.projectiles.filter(function(projectile) {
			return projectile.alive;
		});
	},
	moveTarget: function(unit) {

		// Get coords for center of target
		var x = unit.target.x - unit.size/2;
		var y = unit.target.y - unit.size/2;
		// Rotate us to face the target
	    var rotation = Math.atan2(y - unit.y, x - unit.x);
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
		/* 
		 * TODO: Fix this; fast bullets will overshoot targets.
		 * Loop through moving one pixel at a time (detect collision/etc),
		 * then draw at final destination.
		 */
		if(unit.type == 'basic') {
			if(unit.ammo > 0) {
				if(!unit.delay) {
					var angle = Math.atan2(unit.target.y - unit.y, unit.target.x - unit.x);
					app.projectiles.push({
						'x':unit.x+unit.size/2,
						'y':unit.y+unit.size/2,
						'target':unit.target,
						'size':1,
						'owner':unit,
						'alive':true,
						'style':'#F1A20D',
						'alignment':'projectiles',
						// set a random angle in all possible directions, in radians
						'angle': angle,
						'speed':4,
						// friction will slow the particle down
						friction: 1.01,
						// gravity will be applied and pull the particle down
						gravity: 0.1, // This is space!
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
					'alignment':'projectiles'
				});
				current.damageInterval = setInterval(function() {
					if(unit.target) {
						if(current.delay) {
				    		// Remove health
				    		if(!app.menus.pause.active) {
						    	app.damageEntity(unit.target, unit.damage);
				    		}
					    	// Remove entity
					    	// if(unit.target.hp <= 0) {
					    	// 	clearInterval(current.damageInterval);
					    	// 	current.damageInterval = 0;
					    	// 	current.delay = false;
					    	// }
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
					'size':unit.range,
					'maxSize':unit.range,
					'owner':unit,
					'alive':true,
					// 'style':'rgba(69,178,157,0.5)',
					'alignment':'projectiles'
				});
				current.shockStyle = "rgba(69,178,157,0)";
				current.damageInterval = setInterval(function() {
					if(current.alive) {
						var innerRadius = 1;
						var outerRadius = unit.range;
						var gradient = ctx.createRadialGradient(current.x+6, current.y+6, innerRadius, current.x+6, current.y+6, outerRadius);
						gradient.addColorStop(0, "rgba(239,201,76,0)");
						gradient.addColorStop(1, "rgba(239,201,76,1)");
						// Flash on shock
				    	current.shockStyle = gradient;
				    	// current.shockStyle = "rgba(69,178,157,0.4)";
				    	window.setTimeout(function() {
						    current.shockStyle = "rgba(69,178,157,0)";
						}, 250);
			    		// Damage nearby enemies
			    		// TODO: Fix shock towers may be attempting to slow enemies that aren't alive
			    		for(i=0;i<app.enemies.length;i++) {
			    			if(app.inRange(unit,app.enemies[i])) {
			    				if(app.enemies[i].alive) {
			    					if(!app.enemies[i].slowed) {
								    	app.enemies[i].speed = app.enemies[i].speed*0.75;
								    	if(app.enemies[i].speed < 0.5) {
								    		app.enemies[i].slowed = true;
								    	}
			    					}
				    				app.damageEntity(app.enemies[i],unit.damage);
			    				}
			    			}
			    		}
					} else {
						clearInterval(current.damageInterval);
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
						'alignment':'projectiles',
						'explode':0,
						'range':20,
						'rad':2
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
	inVision: function(unit1, unit2) {
		// TODO: Better method of range detection
		var maxDist;
		if(unit1 == app.planet) {
			maxDist = app.planet.range/2;
		} else {
			maxDist = 30;
		}
		var distance = Math.sqrt(Math.pow(unit1.x - unit2.x, 2) + Math.pow(unit1.y - unit2.y, 2)).toFixed(2);
		if(distance > maxDist) {
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
			var particleCount = 10;
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
				friction: 1.01,
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
		if(unit.alignment) {
			if(unit.alignment == 'invaders') {
				console.log("ADDED CASH");
				app.player.updateCash(unit.value);
			}
			unit.alive = false;
		} else if(unit == app.planet) {
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
	wrapText: function(context, text, x, y, maxWidth, lineHeight) {
		var words = text.split(' ');
		var line = '';

		for(var n = 0; n < words.length; n++) {
		  var testLine = line + words[n] + ' ';
		  var metrics = context.measureText(testLine);
		  var testWidth = metrics.width;
		  if (testWidth > maxWidth && n > 0) {
		    context.fillText(line, x, y);
		    line = words[n] + ' ';
		    y += lineHeight;
		  }
		  else {
		    line = testLine;
		  }
		}
		context.fillText(line, x, y);
	}
}