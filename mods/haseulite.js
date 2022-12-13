var modName = "mods/haseulite.js";
var loonaMod = "mods/funny elements 2022-11-15.js";
var fireMod = "mods/fire_mod.js";
var runAfterAutogenMod = "mods/runAfterAutogen and onload restructure.js";
var explodeAtPlusMod = "mods/explodeAtPlus.js";
var libraryMod = "mods/code_library.js";

if(enabledMods.includes(loonaMod) && enabledMods.includes(fireMod) && enabledMods.includes(runAfterAutogenMod) && enabledMods.includes(explodeAtPlusMod) && enabledMods.includes(libraryMod)) {
	//move explodeAt to YG Entertainment's dungeon

	oldExplodeAt = explodeAt;
	explodeAt = explodeAtPlus;
	haseuliteSpreadWhitelist = ["haseulite","haseulite_powder","molten_haseulite"];
	jinsouliteSpreadWhitelist = ["jinsoulite","jinsoulite_powder","molten_jinsoulite"];

	function coldExplosionAfterCooling(pixel,x,y,radius,fire,smoke,power,damage) {
		pixel.temp -= 2*damage*radius*power;
	};

	function reactionStealerImmutableElem2(pixel,newPixel,reactionTarget,ignoreSelf=true) {
		if(!elements[reactionTarget]) {
			throw new Error(`No such element ${reactionTarget}!`);
		};
		if(typeof(newPixel) === "undefined") { //timing issue?
			return false;
		};
		var newElement = newPixel.element;
		if(ignoreSelf && newElement === pixel.element) {
			return false;
		};
		var newInfo = elements[newElement];
		if(typeof(newInfo.reactions) === "undefined") {
			return false;
		};
		if(typeof(newInfo.reactions[reactionTarget]) === "undefined") {
			return false;
		};
		var pixel2 = pixel;
		var pixel1 = newPixel;
		var r = newInfo.reactions[reactionTarget];
		
		if (r.setting && settings[r.setting]===0) {
			return false;
		}
		// r has the attribute "y" which is a range between two y values
		// r.y example: [10,30]
		// return false if y is defined and pixel1's y is not in the range
		if (r.tempMin !== undefined && pixel1.temp < r.tempMin) {
			return false;
		}
		if (r.tempMax !== undefined && pixel1.temp > r.tempMax) {
			return false;
		}
		if (r.charged && !pixel.charge) {
			return false;
		}
		if (r.chance !== undefined && Math.random() > r.chance) {
			return false;
		}
		if (r.y !== undefined && (pixel1.y < r.y[0] || pixel1.y > r.y[1])) {
			return false;
		}
		if (r.elem1 !== undefined) {
			// if r.elem1 is an array, set elem1 to a random element from the array, otherwise set it to r.elem1
			if (Array.isArray(r.elem1)) {
				var elem1 = r.elem1[Math.floor(Math.random() * r.elem1.length)];
			} else { var elem1 = r.elem1; }
			
			if (elem1 == null) {
				deletePixel(pixel1.x,pixel1.y);
			}
			else {
				changePixel(pixel1,elem1);
			}
		}
		if (r.charge1) { pixel1.charge = r.charge1; }
		if (r.temp1) { pixel1.temp += r.temp1; pixelTempCheck(pixel1); }
		if (r.color1) { // if it's a list, use a random color from the list, else use the color1 attribute
			pixel1.color = pixelColorPick(pixel1, Array.isArray(r.color1) ? r.color1[Math.floor(Math.random() * r.color1.length)] : r.color1);
		}
		if (r.attr1) { // add each attribute to pixel1
			for (var key in r.attr1) {
				pixel1[key] = r.attr1[key];
			}
		}
		if (r.charge2) { pixel2.charge = r.charge2; }
		if (r.temp2) { pixel2.temp += r.temp2; pixelTempCheck(pixel2); }
		if (r.color2) { // if it's a list, use a random color from the list, else use the color2 attribute
			pixel2.color = pixelColorPick(pixel2, Array.isArray(r.color2) ? r.color2[Math.floor(Math.random() * r.color2.length)] : r.color2);
		}
		if (r.attr2) { // add each attribute to pixel2
			for (var key in r.attr2) {
				pixel2[key] = r.attr2[key];
			}
		}
		if (r.func) { r.func(pixel1,pixel2); }
		return r.elem1!==undefined;
	};

	elements.loona = {
		color: ["#6f7d54","#4f5d34","#7c8a61"],
		behavior: behaviors.POWDER,
		tempHigh: 1031,
		category: "random rocks",
		state: "solid",
		density: 2466.73,
		hardness: 0.56,
		breakInto: ["rock","sulfur","loona_gravel","loona_gravel","loona_gravel","haseulite_powder", "rock","sulfur","loona_gravel","loona_gravel","loona_gravel","haseulite_powder", "rock","sulfur","loona_gravel","loona_gravel","loona_gravel","heejinite_powder"],
	};

	var backupCategoryWhitelist = ["land","powders","weapons","food","life","corruption","states","fey","Fantastic Creatures","dyes","energy liquids","random liquids","random gases","random rocks"];
	var backupElementWhitelist = ["mercury", "chalcopyrite_ore", "chalcopyrite_dust", "copper_concentrate", "fluxed_copper_concentrate", "unignited_pyrestone", "ignited_pyrestone", "everfire_dust", "extinguished_everfire_dust", "mistake", "polusium_oxide", "vaporized_polusium_oxide", "glowstone_dust", "redstone_dust", "soul_mud", "wet_soul_sand", "nitrogen_snow", "fusion_catalyst", "coal", "coal_coke", "blast_furnace_fuel", "molten_mythril"];

	function spoutCriteria(name) {
		if(typeof(elements[name]) !== "object") {
			throw new Error(`Nonexistent element ${name}`);
		};
		var info = elements[name];
		//console.log(`${name} (${JSON.stringify(elements[name])})`);
		if(typeof(info.state) === "undefined") {
			var state = null;
		} else {
			var state = info.state;
		};
		if(typeof(info.category) === "undefined") {
			var category = "other";
		} else {
			var category = info.category;
		};
		if(excludedSpoutElements.includes(name)) {
			return false
		};
		var include = false;
		if(["liquid","gas"].includes(state)) {
			include = true;
		};
		if(info.movable) {
			include = true;
		};
		if(backupCategoryWhitelist.includes(category)) {
			include = true;
		};
		if(backupElementWhitelist.includes(name)) {
			include = true;
		};
		if(category.includes("mudstone")) {
			include = true;
		};
		//console.log(include);
		return include;
	};
	
	function heejiniteHeatCriteria(name) {
		if(typeof(elements[name]) !== "object") {
			throw new Error(`Nonexistent element ${name}`);
		};
		var info = elements[name];
		//console.log(`${name} (${JSON.stringify(elements[name])})`);
		if(typeof(info.tempLow) === "undefined") {
			return false;
		};
		if(typeof(info.tempHigh) !== "undefined" && info.tempHigh < elements.heejinite.tempHigh) {
			return false;
		};
		return (info.tempLow < elements.heejinite.tempHigh) || ((typeof(info.state) !== "undefined") && (info.state === "gas"));
	};

	spoutCriteria = function(name) {
		if(typeof(elements[name]) !== "object") {
			throw new Error(`Nonexistent element ${name}`);
		};
		var info = elements[name];
		//console.log(`${name} (${JSON.stringify(elements[name])})`);
		if(typeof(info.state) === "undefined") {
			var state = null;
		} else {
			var state = info.state;
		};
		if(typeof(info.category) === "undefined") {
			var category = "other";
		} else {
			var category = info.category;
		};
		var include = false;
		if(["liquid","gas"].includes(state)) {
			include = true;
		};
		if(info.movable) {
			include = true;
		};
		if(backupCategoryWhitelist.includes(category)) {
			include = true;
		};
		if(backupElementWhitelist.includes(name)) {
			include = true;
		};
		if(category.includes("mudstone")) {
			include = true;
		};
		//console.log(include);
		return include;
	};

	//it doesn't want to acknowledge spoutCriteria, so...

	runAfterAutogen(function() {
		elements.loona.stateHigh = ["molten_loona","rock","rock","rock","sulfur_gas","sulfur_gas","molten_haseulite","molten_loona","rock","rock","rock","sulfur_gas","sulfur_gas","molten_haseulite","molten_loona","rock","rock","rock","sulfur_gas","sulfur_gas","molten_heejinite"];
		hotHeejiniteElements = Object.keys(elements).filter(function(e) {
			return spoutCriteria(e) && heejiniteHeatCriteria(e) && !elements[e].excludeRandom && !e.startsWith("rad");
		});
	});

	elements.loona_gravel = {
		color: ["#b3be98","#919a6f","#68744b","#515931"],
		behavior: behaviors.POWDER,
		tempHigh: 1031,
		stateHigh: ["molten_loona","rock","rock","rock","sulfur_gas","sulfur_gas","molten_haseulite","molten_loona","rock","rock","rock","sulfur_gas","sulfur_gas","molten_haseulite","molten_loona","rock","rock","rock","sulfur_gas","sulfur_gas","molten_heejinite"],
		category: "random rocks",
		state: "solid",
		density: 1625.14,
		hardness: 0.97,
		breakInto: ["rock","sulfur","rock","haseulite_powder","rock","sulfur","rock","haseulite_powder","rock","sulfur","rock","heejinite_powder"],
	};

	haseuliteValueObject = {
		light: 1,
		radiation: 4,
		fire: [6, "smoke"],
		rad_fire: [10, "rad_smoke"],
		liquid_fire: [12, ["fire","liquid_smoke","smoke"]],
		plasma: [15, "fire"],
		liquid_rad_fire: [20, [null,"rad_fire","rad_fire","rad_smoke","rad_smoke"]],
		liquid_plasma: [30, ["plasma","liquid_fire","fire"]],
		liquid_irradium: [4, null]
	};

	jinsouliteValueObject = {
		steam: [1, ["steam",null]],
		cloud: [1, ["cloud",null]],
		snow_cloud: [1, ["snow_cloud",null]],
		hail_cloud: [1, ["hail_cloud",null]],
		rain_cloud: [3, ["rain_cloud","rain_cloud",null]]
	};

	/*function customStaining(pixel,customColorRgb,stainOverride=null) {
		if (settings["stainoff"]) { return }
		var stain = (stainOverride !== null ? stainOverride : elements[pixel.element].stain);
		if (stain > 0) {
			var newColor = customColorRgb.match(/\d+/g);
		}
		else {
			var newColor = null;
		}

		for (var i = 0; i < adjacentCoords.length; i++) {
			var x = pixel.x+adjacentCoords[i][0];
			var y = pixel.y+adjacentCoords[i][1];
			if (!isEmpty(x,y,true)) {
				var newPixel = pixelMap[x][y];
				if (elements[pixel.element].ignore && elements[pixel.element].ignore.indexOf(newPixel.element) !== -1) {
					continue;
				}
				if ((elements[newPixel.element].id !== elements[pixel.element].id || elements[newPixel.element].stainSelf) && (solidStates[elements[newPixel.element].state] || elements[newPixel.element].id === elements[pixel.element].id)) {
					if (Math.random() < Math.abs(stain)) {
						if (stain < 0) {
							if (newPixel.origColor) {
								newColor = newPixel.origColor;
							}
							else { continue; }
						}
						else if (!newPixel.origColor) {
							newPixel.origColor = newPixel.color.match(/\d+/g);
						}
						// if newPixel.color doesn't start with rgb, continue
						if (!newPixel.color.match(/^rgb/)) { continue; }
						// parse rgb color string of newPixel rgb(r,g,b)
						var rgb = newPixel.color.match(/\d+/g);
						if (elements[pixel.element].stainSelf && elements[newPixel.element].id === elements[pixel.element].id) {
							// if rgb and newColor are the same, continue
							if (rgb[0] === newColor[0] && rgb[1] === newColor[1] && rgb[2] === newColor[2]) { continue; }
							var avg = [];
							for (var j = 0; j < rgb.length; j++) {
								avg[j] = Math.round((rgb[j]*(1-Math.abs(stain))) + (newColor[j]*Math.abs(stain)));
							}
						}
						else {
							// get the average of rgb and newColor, more intense as stain reaches 1 
							var avg = [];
							for (var j = 0; j < rgb.length; j++) {
								avg[j] = Math.floor((rgb[j]*(1-Math.abs(stain))) + (newColor[j]*Math.abs(stain)));
							}
						}
						// set newPixel color to avg
						newPixel.color = "rgb("+avg.join(",")+")";
					}
				}
			}
		}
	}*/

	function valueSpreading(pixel,whitelist=null) {
		var randomNeighborOffset = adjacentCoords[Math.floor(Math.random() * adjacentCoords.length)];
		var rX = randomNeighborOffset[0];
		var rY = randomNeighborOffset[1];
		var rfX = pixel.x+rX;
		var rfY = pixel.y+rY;
		if(!isEmpty(rfX,rfY,true)) {
			var rOtherPixel = pixelMap[rfX][rfY];
			var rOtherElement = rOtherPixel.element;
			if(whitelist === null || (whitelist !== null && whitelist.includes(rOtherElement))) {
				if(typeof(rOtherPixel.value) !== "number") {
					rOtherPixel.value = 0;
				};
				if(typeof(rOtherPixel) === "undefined" || isEmpty(rfX,rfY,true)) {
					return false;
				};
				var averageValue = (pixel.value + rOtherPixel.value) / 2;
				pixel.value = averageValue;
				rOtherPixel.value = averageValue;
			};
		};
		return true;
	};

	function valueAbsorbency(pixel,valueObject) {
		for(i = 0; i < adjacentCoords.length; i++) {
			var oX = adjacentCoords[i][0];
			var oY = adjacentCoords[i][1];
			var fX = pixel.x+oX;
			var fY = pixel.y+oY;
			if(!isEmpty(fX,fY,true)) {
				var otherPixel = pixelMap[fX][fY];
				var otherElement = otherPixel.element;
				var otherInfo = elements[otherElement];
				if(valueObject[otherElement]) {
					if(typeof(otherPixel) === "undefined" || isEmpty(fX,fY,true)) {
						return false;
					};
					var ValueData = valueObject[otherElement];
					if(ValueData instanceof Array) {
						var finalElement = ValueData[1];
						if(finalElement instanceof Array) {
							finalElement = finalElement[Math.floor(Math.random() * finalElement.length)];
						};
						if(finalElement !== null) {
							if(finalElement === -1) {
								deletePixel(otherPixel.x,otherPixel.y);
							} else {
								changePixel(otherPixel,finalElement);
							};
						};
						pixel.value += ValueData[0];
					} else if(typeof(ValueData) === "number") {
						deletePixel(otherPixel.x,otherPixel.y);
						pixel.value += ValueData[0];
					};
				};
			};
		};
		return true;
	};

	function valueFunction(pixel,valueObject,elementWhitelist=null) {
		if(typeof(pixel.value) === "undefined") {
			pixel.value = 0;
		};

		var oldValue = pixel.value;
		if(!valueAbsorbency(pixel,valueObject) || isNaN(pixel.value)) {
			pixel.value = oldValue;
		};

		var oldValue = pixel.value;
		if(!valueSpreading(pixel,elementWhitelist) || isNaN(pixel.value)) {
			pixel.value = oldValue;
		};
	}

	function haseulitoidTick(pixel) {
		valueFunction(pixel,haseuliteValueObject,haseuliteSpreadWhitelist);
		if(pixel.oldColor === null) { pixel.oldColor = pixel.color };
		pixel.color = lightenColor(pixel.oldColor,pixel.value / 3);
		
		if(pixel.value >= 350) {
			var coldBoomChance = Math.max(0.008 * ((pixel.value - 350) / 100), 0.001);
			if(Math.random() < coldBoomChance) {
				var coldBoomRadius = Math.min(30,Math.floor(7 + ((pixel.value - 350) / 100)));
				explodeAtPlus(pixel.x,pixel.y,coldBoomRadius,"cold_fire","cold_smoke",null,coldExplosionAfterCooling);
			};
		};
	}

	elements.haseulite = {
		color: ["#3cb00e", "#25d119", "#79f553"],
		fireColor: ["#08a953", "#2ea332", "#d1e0d3"],
		properties: {
			value: 0,
			oldColor: null
		},
		behavior: behaviors.WALL,
		tick: function(pixel) { haseulitoidTick(pixel) },
		excludeVelocity: true, //wall shouldn't move
		tempHigh: 1757,
		onExplosionBreakOrSurvive: function(pixel,x,y,radius) {
			/*power is always radius/10
				r 5: value 7
				r 10: value 14
				r 15: value 28 
				r 20: value 56 
				r 25: value 112 
				r 30: value 224 
			*/
			pixel.value += (2**(((radius) / 5) - 1) * 7);
		},
		category: "solids",
		state: "solid",
		density: 7550,
		hardness: 0.93,
		breakInto: "haseulite_powder",
		conduct: 0.84,
	};

	if(!elements.steel.reactions) {
		elements.steel.reactions = {};
	};

	elements.steel.reactions.haseulite_powder = {
		elem1: "haseulite_vent",
		elem2: null,
		chance: 0.01,
		tempMin: 1200,
	};

	adjacentCoordsInverted = [[0,-1],[0,1],[-1,0],[1,0]];

	elements.haseulite_vent = {
		color: "#88b058",
		fireColor: ["#08a953", "#2ea332", "#d1e0d3"],
		behavior: behaviors.WALL,
		rotatable: true,
		desc: "This uses rotation, so just use debug to see the r value. r 0 means it vents haseulite below it upwards, r 1 means it vents haseulite above it downwards, r 2 means it vents left, and r 3 means it vents right.",
		tick: function(pixel) { 
			if(isNaN(pixel.r)) {
				pixel.r = 0;
			};
			pixel.r = pixel.r % 4;
			var coord = adjacentCoords[pixel.r];
			var invertCoord = adjacentCoordsInverted[pixel.r];	

			var fX = pixel.x+coord[0];
			var fY = pixel.y+coord[1];

			if(!isEmpty(fX,fY,true)) {
				var otherPixel = pixelMap[fX][fY];
				var otherElement = otherPixel.element;
				var otherInfo = elements[otherElement];
				if(typeof(otherPixel) === "undefined" || isEmpty(fX,fY,true)) {
					return false;
				};
				if(haseuliteSpreadWhitelist.includes(otherElement)) {
					var ventLimit = Math.min(10,Math.floor(1 + (Math.sqrt(Math.max(otherPixel.value,1)) / 2)));
					for(i = 1; i <= ventLimit; i++) {
						if(otherPixel.value >= 3) {
							var fIX = pixel.x+(invertCoord[0] * i);
							var fIY = pixel.y+(invertCoord[1] * i);
							if(isEmpty(fIX,fIY,false)) {
								createPixel("cold_fire",fIX,fIY);
								otherPixel.value -= 3;
							} else { //if the pixel to place isn't empty
								if(!outOfBounds(fIX,fIY)) { //if it isn't OoB
									if(pixelMap[fIX][fIY].element !== "cold_fire") { //if it isn't cold fire
										break;
									};
								} else { //if it is OoB
									break;
								};
							};
						} else {
							break;
						};
					};
				};
			};
			return true;
		},
		excludeVelocity: true, //wall shouldn't move
		tempHigh: elements.steel.tempHigh,
		stateHigh: ["molten_steel","haseulite_powder"],
		breakInto: ["metal_scrap","haseulite_powder"],
		category: "machines",
		state: "solid",
		density: 7550,
		hardness: 0.93,
		breakInto: "haseulite_powder",
		conduct: 0.84,
	}

	elements.haseulite_powder = {
		color: ["#5fb33e", "#32ba29", "#63d141"],
		properties: {
			value: 0,
			oldColor: null
		},
		category: "powders",
		fireColor: ["#08a953", "#2ea332", "#d1e0d3"],
		tempHigh: 1757,
		behavior: behaviors.POWDER,
		tick: function(pixel) { haseulitoidTick(pixel) },
		onExplosionBreakOrSurvive: function(pixel,x,y,radius) {
			/*power is always radius/10
				r 5: value 7
				r 10: value 14
				r 15: value 28 
				r 20: value 56 
				r 25: value 112 
				r 30: value 224 
			*/
			pixel.value += (2**(((radius) / 5) - 1) * 7);
		},
		stateHigh: "molten_haseulite",
		category: "powders",
		state: "solid",
		hidden: true,
		density: 4512,
		hardness: 0.7,
		conduct: 0.43,
	};

	elements.molten_haseulite = {
		color: ["#cbf569","#f1ffd6","#fdffb5", "#fffa99"],
		fireColor: ["#08a953", "#2ea332", "#d1e0d3"],
		properties: {
			value: 0,
			oldColor: null
		},
		tick: function(pixel) { haseulitoidTick(pixel) },
		onExplosionBreakOrSurvive: function(pixel,x,y,radius) {
			/*power is always radius/10
				r 5: value 7
				r 10: value 14
				r 15: value 28 
				r 20: value 56 
				r 25: value 112 
				r 30: value 224 
			*/
			pixel.value += (2**(((radius) / 5) - 1) * 7);
		},
		density: 7214,
		hardness: 0.52,
		breakInto: "haseulite_gas",
		temp: 1957,
		tempHigh: 3100,
		conduct: 0.23,
	};

	elements.haseulite_gas = {
		color: ["#ffff9d", "#ffffff", "#e9ffe6", "#ffffe5"],
		fireColor: ["#08a953", "#2ea332", "#d1e0d3"],
		properties: {
			value: 0,
			oldColor: null
		},
		tick: function(pixel) { haseulitoidTick(pixel) },
		onExplosionBreakOrSurvive: function(pixel,x,y,radius) {
			/*power is always radius/10
				r 5: value 7
				r 10: value 14
				r 15: value 28 
				r 20: value 56 
				r 25: value 112 
				r 30: value 224 
			*/
			pixel.value += (2**(((radius) / 5) - 1) * 7);
		},
		density: 0.289,
		temp: 3700,
		hardness: 1,
		conduct: 0.13,
	};

	/*
	var shimmeringColor = convertHslObjects(hslColorStringToObject(`hsl(${(pixelTicks / 2) % 360},100%,50%)`,"rgb"));
	customStaining(pixel,shimmeringColor,0.2);
	*/

	function heejinitoidTick(pixel) {
		if(pixel.oldColor === null) { pixel.oldColor = pixel.color };
		var color = rgbStringToHSL(convertColorFormats(pixel.oldColor,"rgb"),"json");
		var heejiniteHueSpread = 30 + (pixel.temp/9.25)
		var hueOffset = (Math.sin(pixelTicks / 11) * heejiniteHueSpread) + 15; color.h += hueOffset;
		var color = convertHslObjects(color,"rgb");
		pixel.color = color;
	};

	function hotHeejinitoidTick(pixel) {
		if(Math.random() < (pixel.temp >= 1500 ? 0.02 : 0.01)) {
			if(pixel.temp >= 1387.5) {
				var randomNeighborOffset = adjacentCoords[Math.floor(Math.random() * adjacentCoords.length)];
				var rX = randomNeighborOffset[0];
				var rY = randomNeighborOffset[1];
				var rfX = pixel.x+rX;
				var rfY = pixel.y+rY;
				if(isEmpty(rfX,rfY,false)) {
					var randomEligibleHotElement = hotHeejiniteElements[Math.floor(Math.random() * hotHeejiniteElements.length)];
					createPixel(randomEligibleHotElement,rfX,rfY);
					pixelMap[rfX][rfY].temp = pixel.temp;
				};
			};
		};
	}

	elements.heejinite = {
		color: ["#cf1172", "#fa1977", "#ff619e"],
		fireColor: ["#a9085e", "#a32e61", "#fca7c6"],
		properties: {
			oldColor: null
		},
		behavior: behaviors.WALL,
		tick: function(pixel) { heejinitoidTick(pixel) },
		excludeVelocity: true, //wall shouldn't move
		tempHigh: 837,
		category: "solids",
		state: "solid",
		density: 3773,
		stain: 0.1,
		hardness: 0.79,
		breakInto: "heejinite_powder",
		conduct: 0.86,
	};

	elements.heejinite_powder = {
		color: ["#d64790", "#e63e84", "#f054ac"],
		fireColor: ["#a9085e", "#a32e61", "#fca7c6"],
		properties: {
			oldColor: null
		},
		behavior: behaviors.POWDER,
		tick: function(pixel) { heejinitoidTick(pixel) },
		excludeVelocity: true, //wall shouldn't move
		tempHigh: 837,
		hidden: true,
		stateHigh: "molten_heejinite",
		category: "powders",
		state: "solid",
		density: 1412,
		stain: 0.1,
		hardness: 0.66,
		breakInto: "heejinite_powder",
		conduct: 0.42,
	};

	elements.molten_heejinite = {
		color: ["#ff0f77","#ff59c2","#ff405c", "#fa5a48"],
		fireColor: ["#a9085e", "#a32e61", "#fca7c6"],
		properties: {
			oldColor: null
		},
		tick: function(pixel) {
			heejinitoidTick(pixel);
			hotHeejinitoidTick(pixel);
		},
		density: 3121,
		hardness: 0.5,
		breakInto: "heejinite_gas",
		temp: 1000,
		tempHigh: 1501,
		conduct: 0.22,
	};

	elements.heejinite_gas = {
		color: ["#fffab8", "#ffdab3", "#ffd1d1", "#ffc4df", "#ffb0eb"],
		fireColor: ["#a9085e", "#a32e61", "#fca7c6"],
		properties: {
			oldColor: null
		},
		tick: function(pixel) {
			heejinitoidTick(pixel);
			hotHeejinitoidTick(pixel);
		},
		density: 0.117,
		temp: 1800,
		hardness: 1,
		conduct: 0.12,
	};

	jinsouliteReducedSwapWhitelist = ["slime","glue","soda","milk","chocolate_milk","fruit_milk","ink","blood","vaccine","antibody","infection","sap","ketchup","spirit_tear","enchanted_ketchup","lean","poisoned_ketchup","dirty_ketchup","zombie_blood"];

	function jinsouliteDissolution(pixel) {
		var did = false;
		for(i = 0; i < 2; i++) {
			var randomNeighborOffset = adjacentCoords[Math.floor(Math.random() * adjacentCoords.length)];
			if(Math.random() < 0.6) { randomNeighborOffset = [0,-1] }; //bias upwards
			var rfX = pixel.x+randomNeighborOffset[0];
			var rfY = pixel.y+randomNeighborOffset[1];
			if(!isEmpty(rfX,rfY,true)) {
				var rOtherPixel = pixelMap[rfX][rfY];
				if(!rOtherPixel) { return false };
				var rOtherElement = rOtherPixel.element;
				if(rOtherElement.includes("water") || (Math.random() < 0.3 && jinsouliteReducedSwapWhitelist.includes(rOtherElement))) {
					swapPixels(pixel,rOtherPixel);
					did = true;
				};
			};
		};
		return did;
	};

	function jinsouliteMovement(pixel,move1Spots,move2Spots) {		
		if(move1Spots.length > 0) {
			var randomMove1 = move1Spots[Math.floor(Math.random() * move1Spots.length)];
			if(!tryMove(pixel, pixel.x+randomMove1[0], pixel.y+randomMove1[1])) {
				//console.log((pixel.x+randomMove1[0]) + " " + (pixel.y+randomMove1[1]))
				var newPixel = null;
				if(!outOfBounds(pixel.x+randomMove1[0],pixel.y+randomMove1[1])) {
					newPixel = pixelMap[pixel.x+randomMove1[0]][pixel.y+randomMove1[1]]; //newPixel is AAA
				};
				if(outOfBounds(pixel.x+randomMove1[0],pixel.y+randomMove1[1]) || !reactionStealerImmutableElem2(pixel,newPixel,"water")) {
					if(move2Spots.length > 0) {
						var randomMove2 = move2Spots[Math.floor(Math.random() * move2Spots.length)];
						if(!tryMove(pixel, pixel.x+randomMove2[0], pixel.y+randomMove2[1])) {
							var newPixel = null;
							if(!outOfBounds(pixel.x+randomMove1[0],pixel.y+randomMove1[1])) {
								newPixel = pixelMap[pixel.x+randomMove1[0]][pixel.y+randomMove1[1]]; //newPixel is AAA
							};
							if(newPixel !== null) { reactionStealerImmutableElem2(pixel,newPixel,"water") };
						};
					};
				};
			};
		};
		doDefaults(pixel);
	};

	function jinsouliteSolidNonWaterSideReactions(pixel) {
		var randomNeighborOffset = adjacentCoords[Math.floor(Math.random() * adjacentCoords.length)];
		var rfX = pixel.x+randomNeighborOffset[0];
		var rfY = pixel.y+randomNeighborOffset[1];
		if(!isEmpty(rfX,rfY,true)) {
			var rOtherPixel = pixelMap[rfX][rfY];
			if(typeof(rOtherPixel) === "undefined" || isEmpty(rfX,rfY,true)) {
				return false;
			};
			reactionStealerImmutableElem2(pixel,rOtherPixel,"water");
		};
		return true;
	};
	
	function jinsouliteSolidWaterSideReactions(pixel) {
		var randomNeighborOffset = adjacentCoords[Math.floor(Math.random() * adjacentCoords.length)];
		var rfX = pixel.x+randomNeighborOffset[0];
		var rfY = pixel.y+randomNeighborOffset[1];
		if(!isEmpty(rfX,rfY,true)) {
			var pixel2 = pixelMap[rfX][rfY];
			if(typeof(pixel2) === "undefined" || isEmpty(rfX,rfY,true)) {
				return false;
			};
			var rOtherElement = pixel2.element;
			var waterReactions = elements.water.reactions;
			if(waterReactions[rOtherElement]) {
				var r = waterReactions[rOtherElement];				

				if (r.setting && settings[r.setting]===0) {
					return false;
				}
				// r has the attribute "y" which is a range between two y values
				// r.y example: [10,30]
				// return false if y is defined and pixel1's y is not in the range
				if (r.tempMin !== undefined && pixel1.temp < r.tempMin) {
					return false;
				}
				if (r.tempMax !== undefined && pixel1.temp > r.tempMax) {
					return false;
				}
				if (r.charged && !pixel.charge) {
					return false;
				}
				if (r.chance !== undefined && Math.random() > r.chance) {
					return false;
				}
				if (r.y !== undefined && (pixel1.y < r.y[0] || pixel1.y > r.y[1])) {
					return false;
				}
				if (r.charge1) { pixel1.charge = r.charge1; }
				if (r.temp1) { pixel1.temp += r.temp1; pixelTempCheck(pixel1); }
				if (r.color1) { // if it's a list, use a random color from the list, else use the color1 attribute
					pixel1.color = pixelColorPick(pixel1, Array.isArray(r.color1) ? r.color1[Math.floor(Math.random() * r.color1.length)] : r.color1);
				}
				if (r.attr1) { // add each attribute to pixel1
					for (var key in r.attr1) {
						pixel1[key] = r.attr1[key];
					}
				}
				if (r.elem2 !== undefined) {
					// if r.elem2 is an array, set elem2 to a random element from the array, otherwise set it to r.elem2
					if (Array.isArray(r.elem2)) {
						var elem2 = r.elem2[Math.floor(Math.random() * r.elem2.length)];
					} else { var elem2 = r.elem2; }

					if (elem2 == null) {
						deletePixel(pixel2.x,pixel2.y);
					}
					else {
						changePixel(pixel2,elem2);
					}
				}
				if (r.charge2) { pixel2.charge = r.charge2; }
				if (r.temp2) { pixel2.temp += r.temp2; pixelTempCheck(pixel2); }
				if (r.color2) { // if it's a list, use a random color from the list, else use the color2 attribute
					pixel2.color = pixelColorPick(pixel2, Array.isArray(r.color2) ? r.color2[Math.floor(Math.random() * r.color2.length)] : r.color2);
				}
				if (r.attr2) { // add each attribute to pixel2
					for (var key in r.attr2) {
						pixel2[key] = r.attr2[key];
					}
				}
				if (r.func) { r.func(pixel1,pixel2); }
				return r.elem1!==undefined || r.elem2!==undefined;
			};
		};
		return true;
	};

	function jinsouliteValue(pixel) {
		valueFunction(pixel,jinsouliteValueObject,jinsouliteSpreadWhitelist);
		if(pixel.oldColor === null) { pixel.oldColor = pixel.color };
		pixel.color = changeSaturation(pixel.oldColor,pixel.value / 3,"subtract","rgb")
		
		if(pixel.value > 1) {
			if(Math.random() < Math.min((pixel.value / 200),0.5)) {
				var randomNeighborOffset = adjacentCoords[Math.floor(Math.random() * adjacentCoords.length)];
				var rX = randomNeighborOffset[0];
				var rY = randomNeighborOffset[1];
				var rfX = pixel.x+rX;
				var rfY = pixel.y+rY;
				if(isEmpty(rfX,rfY,false)) {
					createPixel("water",rfX,rfY);
					pixel.value--;
				};
			};
		};
	}

	function jinsoulitoidTick(pixel,move1Spots=[],move2Spots=[]) {
		if(jinsouliteDissolution(pixel)) {
			return;
		};
		jinsouliteValue(pixel);
		jinsouliteMovement(pixel,move1Spots,move2Spots);
	};

	elements.jinsoulite = {
		color: ["#0e51b0", "#2129ff", "#3b3dbf"],
		fireColor: ["#121978", "#6a9fe6", "#5963d9"],
		behavior: [
			"XX|CR:water%0.03|XX",
			"CR:water%0.03|XX|CR:water%0.03",
			"XX|CR:water%0.03|XX"
		],
		behaviorOn: [
			"XX|CR:water%0.1|XX",
			"CR:water%0.1|XX|CR:water%0.1",
			"XX|CR:water%0.1|XX"
		],
		properties: {
			value: 0,
			oldColor: null
		},
		tick: function(pixel) { 
			jinsouliteValue(pixel);
			jinsouliteSolidNonWaterSideReactions(pixel);
			jinsouliteSolidWaterSideReactions(pixel);
		},
		tempHigh: 2606,
		category: "solids",
		state: "solid",
		density: 8331,
		hardness: 0.82,
		breakInto: "jinsoulite_powder",
		conduct: 0.93,
	};

	elements.jinsoulite_powder = {
		color: ["#4580ba", "#355eb0", "#2d6fc4"],
		fireColor: ["#121978", "#6a9fe6", "#5963d9"],
		tempHigh: 2606,
		behavior: [
			"XX|CR:water%0.03|XX",
			"CR:water%0.03|XX|CR:water%0.03",
			"XX|CR:water%0.03|XX"
		],
		properties: {
			value: 0,
			oldColor: null
		},
		category: "powders",
		behaviorOn: [
			"XX|CR:water%0.1|XX",
			"CR:water%0.1|XX|CR:water%0.1",
			"XX|CR:water%0.1|XX"
		],
		tick: function(pixel) { jinsoulitoidTick(pixel,[[0,1]],[[-1,1],[1,1]]) },
		stateHigh: "molten_jinsoulite",
		category: "powders",
		state: "solid",
		hidden: true,
		density: 5801,
		hardness: 0.7,
		conduct: 0.43,
	};

	elements.molten_jinsoulite = {
		behavior: [
			"XX|CR:fire,fire,steam%0.5|XX",
			"XX|XX|XX",
			"XX|XX|XX"
		],
		behaviorOn: [
			"XX|CR:fire,steam,steam%0.7|XX",
			"CR:steam%0.1|XX|CR:steam%0.1",
			"XX|CR:steam%0.1|XX"
		],
		properties: {
			value: 0,
			oldColor: null
		},
		color: ["#4e35db","#7767eb","#a876f5", "#78acff"],
		fireColor: ["#121978", "#6a9fe6", "#5963d9"],
		fireElement: ["fire","fire","steam"],
		tick: function(pixel) { jinsoulitoidTick(pixel,[[-1,1],[0,1],[1,1]],[[-1,0],[1,0]]); },
		density: 6448,
		hardness: 0.61,
		breakInto: "jinsoulite_gas",
		temp: 3000,
		tempHigh: 5532.8509,
		conduct: 0.34,
	};

	elements.jinsoulite_gas = {
		color: ["#c0f0ef", "#c2c1db", "#c0bff5", "#cdcce6"],
		behavior: [
			"XX|CR:steam%0.5|XX",
			"CR:steam%0.5|XX|CR:steam%0.5",
			"XX|CR:steam%0.5|XX",
		],
		behaviorOn: [
			"XX|CR:steam%1|XX",
			"CR:steam%1|XX|CR:steam%1",
			"XX|CR:steam%1|XX",
		],
		fireColor: ["#08a953", "#2ea332", "#d1e0d3"],
		properties: {
			value: 0,
			oldColor: null
		},
		tick: function(pixel) { jinsoulitoidTick(pixel,adjacentCoords,[[-1,-1],[1,-1],[1,1],[-1,1]]) },
		density: 0.5833,
		temp: 6000,
		hardness: 1,
		conduct: 0.19,
	};

	runAfterLoad(function() {
		for(key in elements.water.reactions) {
			var value = JSON.parse(JSON.stringify(elements.water.reactions[key]));
			if(value.elem2 === null && value.elem1 !== null) { 
				value.elem2 = value.elem1;
			};
			delete value.elem1;
			
			var movableJinsoulitoids = ["jinsoulite_powder","molten_jinsoulite","jinsoulite_gas"];
			for(j = 0; j < movableJinsoulitoids.length; j++) {
				var jinsoulitoid = movableJinsoulitoids[j];
				if(typeof(elements[jinsoulitoid].reactions) === "undefined") {
					elements[jinsoulitoid].reactions = {};
				};
				if(typeof(elements[jinsoulitoid].reactions[key]) === "undefined") {
					elements[jinsoulitoid].reactions[key] = value;
				};
			};
		};
	});
} else {
	if(!enabledMods.includes(loonaMod))				{ enabledMods.splice(enabledMods.indexOf(modName),0,loonaMod) };
	if(!enabledMods.includes(fireMod))				{ enabledMods.splice(enabledMods.indexOf(modName),0,fireMod) };
	if(!enabledMods.includes(runAfterAutogenMod))	{ enabledMods.splice(enabledMods.indexOf(modName),0,runAfterAutogenMod) };
	if(!enabledMods.includes(explodeAtPlusMod))		{ enabledMods.splice(enabledMods.indexOf(modName),0,explodeAtPlusMod) };
	if(!enabledMods.includes(libraryMod))			{ enabledMods.splice(enabledMods.indexOf(modName),0,libraryMod) };
	localStorage.setItem("enabledMods", JSON.stringify(enabledMods));
	alert(`The "${runAfterAutogenMod}", "${loonaMod}", "${fireMod}", "${libraryMod}", and "${explodeAtPlusMod}" mods are all required; any missing mods in this list have been automatically inserted (reload for this to take effect).`)
};