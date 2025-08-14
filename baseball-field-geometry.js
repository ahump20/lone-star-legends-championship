/**
 * Baseball Field Geometry Module
 * Ported from sportyR package for accurate baseball field rendering
 * Source: https://github.com/sportsdataverse/sportyR
 */

// Field dimension configurations for different leagues
export const FIELD_DIMENSIONS = {
  mlb: {
    fieldUnits: 'ft',
    leftFieldDistance: 355.0,
    rightFieldDistance: 355.0,
    centerFieldDistance: 400.0,
    baselineDistance: 90.0,
    runningLaneStartDistance: 45.0,
    runningLaneDepth: 3.0,
    runningLaneLength: 48.0,
    pitchersMoundCenterToHomePlate: 59.0,
    pitchersMoundRadius: 9.0,
    pitchersPlateToHomePlate: 60.5,
    pitchersPlateWidth: 0.5,
    pitchersPlateLength: 2.0,
    baseSideLength: 1.5,
    homePlateEdgeLength: 1.4167,
    infieldArcRadius: 95.0,
    baseAnchorToInfieldGrassRadius: 13.0,
    lineWidth: 0.25,
    foulLineToInfieldGrass: 3.0,
    foulLineToFoulGrass: 3.0,
    battersBoxLength: 6.0,
    battersBoxWidth: 4.0,
    battersBoxYAdj: 0.7083,
    homePlateSideToBattersBox: 0.5,
    catchersBoxShape: 'rectangle',
    catchersBoxDepth: 8.0,
    catchersBoxWidth: 3.5833,
    backstopRadius: 60.0,
    homePlateCircleRadius: 13.0
  },
  littleLeague: {
    fieldUnits: 'ft',
    leftFieldDistance: 200.0,
    rightFieldDistance: 200.0,
    centerFieldDistance: 200.0,
    baselineDistance: 60.0,
    runningLaneStartDistance: 30.0,
    runningLaneDepth: 2.5,
    runningLaneLength: 30.0,
    pitchersMoundCenterToHomePlate: 46.0,
    pitchersMoundRadius: 5.0,
    pitchersPlateToHomePlate: 47.0,
    pitchersPlateWidth: 0.5,
    pitchersPlateLength: 2.0,
    baseSideLength: 1.25,
    homePlateEdgeLength: 1.4167,
    infieldArcRadius: 50.0,
    baseAnchorToInfieldGrassRadius: 9.0,
    lineWidth: 0.1667,
    foulLineToInfieldGrass: 1.5,
    foulLineToFoulGrass: 2.5,
    battersBoxLength: 7.0,
    battersBoxWidth: 3.0,
    battersBoxYAdj: 1.1792,
    homePlateSideToBattersBox: 0.3333,
    catchersBoxShape: 'trapezoid',
    catchersBoxDepth: 6.3640,
    backstopRadius: 30.0,
    homePlateCircleRadius: 9.0
  },
  milb: {
    fieldUnits: 'ft',
    leftFieldDistance: 355.0,
    rightFieldDistance: 355.0,
    centerFieldDistance: 400.0,
    baselineDistance: 90.0,
    runningLaneStartDistance: 45.0,
    runningLaneDepth: 3.0,
    runningLaneLength: 48.0,
    pitchersMoundCenterToHomePlate: 59.0,
    pitchersMoundRadius: 9.0,
    pitchersPlateToHomePlate: 60.5,
    pitchersPlateWidth: 0.5,
    pitchersPlateLength: 2.0,
    baseSideLength: 1.5,
    homePlateEdgeLength: 1.4167,
    infieldArcRadius: 95.0,
    baseAnchorToInfieldGrassRadius: 13.0,
    lineWidth: 0.1667,
    foulLineToInfieldGrass: 3.0,
    foulLineToFoulGrass: 3.0,
    battersBoxLength: 6.0,
    battersBoxWidth: 4.0,
    battersBoxYAdj: 0.7083,
    homePlateSideToBattersBox: 0.5,
    catchersBoxShape: 'rectangle',
    catchersBoxDepth: 8.0,
    catchersBoxWidth: 3.5833,
    backstopRadius: 60.0,
    homePlateCircleRadius: 13.0
  }
};

/**
 * Helper function to convert feet to pixels based on scale
 */
export function feetToPixels(feet, scale = 2) {
  return feet * scale;
}

/**
 * Calculate base positions relative to home plate
 * @param {Object} dimensions - Field dimensions object
 * @param {number} scale - Scale factor for conversion to pixels
 * @returns {Object} Base positions in pixels
 */
export function calculateBasePositions(dimensions, scale = 2) {
  const baseline = feetToPixels(dimensions.baselineDistance, scale);
  
  return {
    homePlate: { x: 0, y: 0 },
    firstBase: { x: baseline, y: 0 },
    secondBase: { x: baseline, y: baseline },
    thirdBase: { x: 0, y: baseline },
    pitchersMound: { 
      x: baseline / 2, 
      y: feetToPixels(dimensions.pitchersMoundCenterToHomePlate, scale) 
    }
  };
}

/**
 * Generate home plate shape coordinates
 * @param {number} scale - Scale factor for conversion to pixels
 * @returns {Array} Array of coordinate points for home plate
 */
export function generateHomePlate(scale = 2) {
  const edgeLength = feetToPixels(1.4167, scale); // Standard home plate size
  const halfEdge = edgeLength / 2;
  
  return [
    { x: 0, y: 0 },                    // Back point
    { x: -halfEdge, y: halfEdge },     // Left corner
    { x: -halfEdge, y: edgeLength },   // Left front
    { x: halfEdge, y: edgeLength },    // Right front
    { x: halfEdge, y: halfEdge }       // Right corner
  ];
}

/**
 * Generate pitcher's mound circle
 * @param {Object} dimensions - Field dimensions object
 * @param {number} scale - Scale factor for conversion to pixels
 * @returns {Object} Pitcher's mound data
 */
export function generatePitchersMound(dimensions, scale = 2) {
  return {
    center: {
      x: feetToPixels(dimensions.baselineDistance / 2, scale),
      y: feetToPixels(dimensions.pitchersMoundCenterToHomePlate, scale)
    },
    radius: feetToPixels(dimensions.pitchersMoundRadius, scale),
    platePosition: {
      x: feetToPixels(dimensions.baselineDistance / 2, scale),
      y: feetToPixels(dimensions.pitchersPlateToHomePlate, scale)
    },
    plateWidth: feetToPixels(dimensions.pitchersPlateWidth, scale),
    plateLength: feetToPixels(dimensions.pitchersPlateLength, scale)
  };
}

/**
 * Generate batter's box coordinates
 * @param {Object} dimensions - Field dimensions object
 * @param {string} side - 'left' or 'right'
 * @param {number} scale - Scale factor for conversion to pixels
 * @returns {Object} Batter's box coordinates
 */
export function generateBattersBox(dimensions, side = 'left', scale = 2) {
  const boxWidth = feetToPixels(dimensions.battersBoxWidth, scale);
  const boxLength = feetToPixels(dimensions.battersBoxLength, scale);
  const yAdj = feetToPixels(dimensions.battersBoxYAdj, scale);
  const xOffset = feetToPixels(dimensions.homePlateSideToBattersBox, scale);
  
  const xPos = side === 'left' ? -xOffset - boxWidth : xOffset;
  
  return {
    x: xPos,
    y: -yAdj,
    width: boxWidth,
    height: boxLength
  };
}

/**
 * Generate infield arc path
 * @param {Object} dimensions - Field dimensions object
 * @param {number} scale - Scale factor for conversion to pixels
 * @returns {string} SVG path string for the infield arc
 */
export function generateInfieldArc(dimensions, scale = 2) {
  const radius = feetToPixels(dimensions.infieldArcRadius, scale);
  const centerY = feetToPixels(dimensions.pitchersMoundCenterToHomePlate, scale);
  
  // Calculate arc endpoints based on foul lines
  const startAngle = -45 * (Math.PI / 180); // First base line
  const endAngle = -135 * (Math.PI / 180); // Third base line
  
  const startX = radius * Math.cos(startAngle);
  const startY = centerY + radius * Math.sin(startAngle);
  const endX = radius * Math.cos(endAngle);
  const endY = centerY + radius * Math.sin(endAngle);
  
  // SVG arc path
  return `M ${startX} ${startY} A ${radius} ${radius} 0 0 0 ${endX} ${endY}`;
}

/**
 * Generate outfield fence coordinates
 * @param {Object} dimensions - Field dimensions object
 * @param {number} scale - Scale factor for conversion to pixels
 * @returns {Object} Outfield fence data
 */
export function generateOutfieldFence(dimensions, scale = 2) {
  return {
    leftField: {
      distance: feetToPixels(dimensions.leftFieldDistance, scale),
      angle: -45 // degrees from home plate
    },
    centerField: {
      distance: feetToPixels(dimensions.centerFieldDistance, scale),
      angle: -90 // degrees from home plate
    },
    rightField: {
      distance: feetToPixels(dimensions.rightFieldDistance, scale),
      angle: -135 // degrees from home plate
    }
  };
}

/**
 * Generate foul lines
 * @param {Object} dimensions - Field dimensions object
 * @param {number} scale - Scale factor for conversion to pixels
 * @returns {Object} Foul line coordinates
 */
export function generateFoulLines(dimensions, scale = 2) {
  const leftFieldDist = feetToPixels(dimensions.leftFieldDistance, scale);
  const rightFieldDist = feetToPixels(dimensions.rightFieldDistance, scale);
  
  return {
    firstBaseLine: {
      start: { x: 0, y: 0 },
      end: { x: rightFieldDist, y: 0 }
    },
    thirdBaseLine: {
      start: { x: 0, y: 0 },
      end: { x: 0, y: leftFieldDist }
    }
  };
}

/**
 * Complete field generator combining all elements
 * @param {string} league - League type ('mlb', 'littleLeague', 'milb')
 * @param {number} scale - Scale factor for conversion to pixels
 * @returns {Object} Complete field geometry data
 */
export function generateFieldGeometry(league = 'mlb', scale = 2) {
  const dimensions = FIELD_DIMENSIONS[league];
  
  if (!dimensions) {
    throw new Error(`Unknown league type: ${league}`);
  }
  
  return {
    dimensions,
    bases: calculateBasePositions(dimensions, scale),
    homePlate: generateHomePlate(scale),
    pitchersMound: generatePitchersMound(dimensions, scale),
    battersBoxLeft: generateBattersBox(dimensions, 'left', scale),
    battersBoxRight: generateBattersBox(dimensions, 'right', scale),
    infieldArc: generateInfieldArc(dimensions, scale),
    outfieldFence: generateOutfieldFence(dimensions, scale),
    foulLines: generateFoulLines(dimensions, scale)
  };
}

/**
 * Draw field on canvas
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {Object} fieldGeometry - Field geometry data
 * @param {Object} colors - Color configuration
 */
export function drawField(ctx, fieldGeometry, colors = {}) {
  const defaultColors = {
    grass: '#2E8B57',
    dirt: '#8B4513',
    lines: '#FFFFFF',
    bases: '#F5F5F5',
    mound: '#8B4513',
    ...colors
  };
  
  // Clear canvas with grass color
  ctx.fillStyle = defaultColors.grass;
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  
  // Draw infield dirt (simplified as a diamond for now)
  ctx.fillStyle = defaultColors.dirt;
  ctx.beginPath();
  const bases = fieldGeometry.bases;
  ctx.moveTo(bases.homePlate.x, bases.homePlate.y);
  ctx.lineTo(bases.firstBase.x, bases.firstBase.y);
  ctx.lineTo(bases.secondBase.x, bases.secondBase.y);
  ctx.lineTo(bases.thirdBase.x, bases.thirdBase.y);
  ctx.closePath();
  ctx.fill();
  
  // Draw pitcher's mound
  const mound = fieldGeometry.pitchersMound;
  ctx.beginPath();
  ctx.arc(mound.center.x, mound.center.y, mound.radius, 0, Math.PI * 2);
  ctx.fill();
  
  // Draw foul lines
  ctx.strokeStyle = defaultColors.lines;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(fieldGeometry.foulLines.firstBaseLine.end.x, 0);
  ctx.moveTo(0, 0);
  ctx.lineTo(0, fieldGeometry.foulLines.thirdBaseLine.end.y);
  ctx.stroke();
  
  // Draw bases
  ctx.fillStyle = defaultColors.bases;
  const baseSize = 15; // pixels
  for (const [baseName, position] of Object.entries(bases)) {
    if (baseName !== 'homePlate' && baseName !== 'pitchersMound') {
      ctx.fillRect(
        position.x - baseSize/2, 
        position.y - baseSize/2, 
        baseSize, 
        baseSize
      );
    }
  }
  
  // Draw home plate
  ctx.beginPath();
  const homePlate = fieldGeometry.homePlate;
  ctx.moveTo(homePlate[0].x, homePlate[0].y);
  for (let i = 1; i < homePlate.length; i++) {
    ctx.lineTo(homePlate[i].x, homePlate[i].y);
  }
  ctx.closePath();
  ctx.fill();
}

// Export for use in game
export default {
  FIELD_DIMENSIONS,
  generateFieldGeometry,
  drawField,
  feetToPixels
};