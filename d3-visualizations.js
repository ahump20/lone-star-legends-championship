/**
 * D3.js Data Visualization Module
 * Creates interactive charts and visualizations for baseball statistics
 */

import * as d3 from 'd3';

export class BaseballDataViz {
  constructor(container) {
    this.container = container || document.body;
    this.charts = {};
    this.colors = {
      primary: '#2E8B57',
      secondary: '#8B4513',
      accent: '#FFD700',
      danger: '#DC143C',
      success: '#228B22',
      text: '#2F2F2F',
      background: '#F5F5F5'
    };
  }

  /**
   * Create a strike zone heat map
   */
  createStrikeZoneHeatMap(data, containerId) {
    const margin = { top: 40, right: 40, bottom: 60, left: 60 };
    const width = 400 - margin.left - margin.right;
    const height = 500 - margin.top - margin.bottom;

    // Clear previous chart
    d3.select(`#${containerId}`).selectAll("*").remove();

    const svg = d3.select(`#${containerId}`)
      .append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Strike zone dimensions (in feet)
    const zoneWidth = 17 / 12; // 17 inches
    const zoneHeight = 2.5; // From knees to chest
    
    // Create scales
    const xScale = d3.scaleLinear()
      .domain([-zoneWidth/2, zoneWidth/2])
      .range([0, width]);

    const yScale = d3.scaleLinear()
      .domain([1.5, 4]) // Typical strike zone height
      .range([height, 0]);

    // Create grid for heat map
    const gridSize = 20;
    const xGridCount = Math.ceil(width / gridSize);
    const yGridCount = Math.ceil(height / gridSize);

    // Process data into grid cells
    const heatmapData = this.processHeatMapData(data, xGridCount, yGridCount, xScale, yScale);

    // Color scale
    const colorScale = d3.scaleSequential(d3.interpolateReds)
      .domain([0, d3.max(heatmapData, d => d.value)]);

    // Draw heat map cells
    svg.selectAll("rect")
      .data(heatmapData)
      .enter()
      .append("rect")
      .attr("x", d => d.x * gridSize)
      .attr("y", d => d.y * gridSize)
      .attr("width", gridSize)
      .attr("height", gridSize)
      .style("fill", d => colorScale(d.value))
      .style("opacity", 0.8);

    // Draw strike zone border
    svg.append("rect")
      .attr("x", xScale(-zoneWidth/2))
      .attr("y", yScale(3.5))
      .attr("width", xScale(zoneWidth/2) - xScale(-zoneWidth/2))
      .attr("height", yScale(1.5) - yScale(3.5))
      .style("fill", "none")
      .style("stroke", this.colors.text)
      .style("stroke-width", 2)
      .style("stroke-dasharray", "5,5");

    // Add title
    svg.append("text")
      .attr("x", width / 2)
      .attr("y", -20)
      .attr("text-anchor", "middle")
      .style("font-size", "16px")
      .style("font-weight", "bold")
      .text("Strike Zone Heat Map");

    // Add axes
    svg.append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(xScale));

    svg.append("g")
      .call(d3.axisLeft(yScale));

    return svg;
  }

  /**
   * Create a batting average trend line chart
   */
  createBattingAverageTrend(data, containerId) {
    const margin = { top: 40, right: 40, bottom: 60, left: 60 };
    const width = 600 - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;

    // Clear previous chart
    d3.select(`#${containerId}`).selectAll("*").remove();

    const svg = d3.select(`#${containerId}`)
      .append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Parse dates and create scales
    const parseDate = d3.timeParse("%Y-%m-%d");
    data.forEach(d => {
      d.date = parseDate(d.date);
      d.average = +d.average;
    });

    const xScale = d3.scaleTime()
      .domain(d3.extent(data, d => d.date))
      .range([0, width]);

    const yScale = d3.scaleLinear()
      .domain([0, 0.400]) // Batting average range
      .range([height, 0]);

    // Create line generator
    const line = d3.line()
      .x(d => xScale(d.date))
      .y(d => yScale(d.average))
      .curve(d3.curveMonotoneX);

    // Add gradient
    const gradient = svg.append("defs")
      .append("linearGradient")
      .attr("id", "line-gradient")
      .attr("gradientUnits", "userSpaceOnUse")
      .attr("x1", 0).attr("y1", height)
      .attr("x2", 0).attr("y2", 0);

    gradient.append("stop")
      .attr("offset", "0%")
      .attr("stop-color", this.colors.primary)
      .attr("stop-opacity", 0.2);

    gradient.append("stop")
      .attr("offset", "100%")
      .attr("stop-color", this.colors.primary)
      .attr("stop-opacity", 1);

    // Add area under line
    const area = d3.area()
      .x(d => xScale(d.date))
      .y0(height)
      .y1(d => yScale(d.average))
      .curve(d3.curveMonotoneX);

    svg.append("path")
      .datum(data)
      .attr("fill", "url(#line-gradient)")
      .attr("d", area);

    // Add the line
    svg.append("path")
      .datum(data)
      .attr("fill", "none")
      .attr("stroke", this.colors.primary)
      .attr("stroke-width", 3)
      .attr("d", line);

    // Add dots for data points
    svg.selectAll(".dot")
      .data(data)
      .enter().append("circle")
      .attr("class", "dot")
      .attr("cx", d => xScale(d.date))
      .attr("cy", d => yScale(d.average))
      .attr("r", 4)
      .attr("fill", this.colors.primary)
      .on("mouseover", function(event, d) {
        // Tooltip
        const tooltip = d3.select("body").append("div")
          .attr("class", "tooltip")
          .style("opacity", 0)
          .style("position", "absolute")
          .style("background", "rgba(0,0,0,0.8)")
          .style("color", "white")
          .style("padding", "5px")
          .style("border-radius", "5px");

        tooltip.transition()
          .duration(200)
          .style("opacity", .9);
        
        tooltip.html(`Date: ${d.date.toLocaleDateString()}<br/>AVG: ${d.average.toFixed(3)}`)
          .style("left", (event.pageX + 10) + "px")
          .style("top", (event.pageY - 28) + "px");
      })
      .on("mouseout", function() {
        d3.selectAll(".tooltip").remove();
      });

    // Add axes
    svg.append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(xScale)
        .tickFormat(d3.timeFormat("%m/%d")));

    svg.append("g")
      .call(d3.axisLeft(yScale)
        .tickFormat(d3.format(".3f")));

    // Add title
    svg.append("text")
      .attr("x", width / 2)
      .attr("y", -20)
      .attr("text-anchor", "middle")
      .style("font-size", "16px")
      .style("font-weight", "bold")
      .text("Batting Average Trend");

    // Add axis labels
    svg.append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", 0 - margin.left)
      .attr("x", 0 - (height / 2))
      .attr("dy", "1em")
      .style("text-anchor", "middle")
      .text("Batting Average");

    svg.append("text")
      .attr("transform", `translate(${width / 2}, ${height + margin.bottom})`)
      .style("text-anchor", "middle")
      .text("Date");

    return svg;
  }

  /**
   * Create a pitch velocity distribution chart
   */
  createPitchVelocityDistribution(data, containerId) {
    const margin = { top: 40, right: 40, bottom: 60, left: 60 };
    const width = 500 - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;

    // Clear previous chart
    d3.select(`#${containerId}`).selectAll("*").remove();

    const svg = d3.select(`#${containerId}`)
      .append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Create histogram bins
    const histogram = d3.histogram()
      .value(d => d.velocity)
      .domain([70, 105])
      .thresholds(d3.range(70, 105, 2));

    const bins = histogram(data);

    // Create scales
    const xScale = d3.scaleLinear()
      .domain([70, 105])
      .range([0, width]);

    const yScale = d3.scaleLinear()
      .domain([0, d3.max(bins, d => d.length)])
      .range([height, 0]);

    // Create bars
    svg.selectAll("rect")
      .data(bins)
      .enter()
      .append("rect")
      .attr("x", d => xScale(d.x0))
      .attr("y", d => yScale(d.length))
      .attr("width", d => xScale(d.x1) - xScale(d.x0) - 1)
      .attr("height", d => height - yScale(d.length))
      .attr("fill", d => {
        const avgVelocity = d.x0 + (d.x1 - d.x0) / 2;
        if (avgVelocity >= 95) return this.colors.danger;
        if (avgVelocity >= 90) return this.colors.accent;
        return this.colors.primary;
      })
      .style("opacity", 0.8);

    // Add average line
    const avgVelocity = d3.mean(data, d => d.velocity);
    svg.append("line")
      .attr("x1", xScale(avgVelocity))
      .attr("x2", xScale(avgVelocity))
      .attr("y1", 0)
      .attr("y2", height)
      .attr("stroke", this.colors.danger)
      .attr("stroke-width", 2)
      .attr("stroke-dasharray", "5,5");

    // Add axes
    svg.append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(xScale));

    svg.append("g")
      .call(d3.axisLeft(yScale));

    // Add title
    svg.append("text")
      .attr("x", width / 2)
      .attr("y", -20)
      .attr("text-anchor", "middle")
      .style("font-size", "16px")
      .style("font-weight", "bold")
      .text("Pitch Velocity Distribution");

    // Add axis labels
    svg.append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", 0 - margin.left)
      .attr("x", 0 - (height / 2))
      .attr("dy", "1em")
      .style("text-anchor", "middle")
      .text("Frequency");

    svg.append("text")
      .attr("transform", `translate(${width / 2}, ${height + margin.bottom - 10})`)
      .style("text-anchor", "middle")
      .text("Velocity (mph)");

    return svg;
  }

  /**
   * Create a spray chart for batted balls
   */
  createSprayChart(data, containerId) {
    const size = 500;
    const margin = 40;
    const radius = (size - 2 * margin) / 2;

    // Clear previous chart
    d3.select(`#${containerId}`).selectAll("*").remove();

    const svg = d3.select(`#${containerId}`)
      .append("svg")
      .attr("width", size)
      .attr("height", size);

    const g = svg.append("g")
      .attr("transform", `translate(${size/2},${size - margin})`);

    // Draw field outline
    const fieldPath = d3.arc()
      .innerRadius(0)
      .outerRadius(radius)
      .startAngle(-Math.PI / 2)
      .endAngle(Math.PI / 2);

    g.append("path")
      .attr("d", fieldPath)
      .attr("fill", this.colors.background)
      .attr("stroke", this.colors.text)
      .attr("stroke-width", 2);

    // Draw infield
    const infieldPath = d3.arc()
      .innerRadius(0)
      .outerRadius(radius * 0.3)
      .startAngle(-Math.PI / 2)
      .endAngle(Math.PI / 2);

    g.append("path")
      .attr("d", infieldPath)
      .attr("fill", this.colors.secondary)
      .attr("opacity", 0.3);

    // Plot hits
    const angleScale = d3.scaleLinear()
      .domain([-45, 45])
      .range([-Math.PI / 4, Math.PI / 4]);

    const distanceScale = d3.scaleLinear()
      .domain([0, 450])
      .range([0, radius]);

    // Add hit points
    g.selectAll(".hit")
      .data(data)
      .enter()
      .append("circle")
      .attr("class", "hit")
      .attr("cx", d => {
        const r = distanceScale(d.distance);
        const angle = angleScale(d.angle);
        return r * Math.sin(angle);
      })
      .attr("cy", d => {
        const r = distanceScale(d.distance);
        const angle = angleScale(d.angle);
        return -r * Math.cos(angle);
      })
      .attr("r", 4)
      .attr("fill", d => {
        switch(d.result) {
          case 'homerun': return this.colors.danger;
          case 'triple': return this.colors.accent;
          case 'double': return this.colors.success;
          case 'single': return this.colors.primary;
          default: return this.colors.text;
        }
      })
      .attr("opacity", 0.7)
      .on("mouseover", function(event, d) {
        d3.select(this).attr("r", 6);
        
        const tooltip = d3.select("body").append("div")
          .attr("class", "tooltip")
          .style("opacity", 0)
          .style("position", "absolute")
          .style("background", "rgba(0,0,0,0.8)")
          .style("color", "white")
          .style("padding", "5px")
          .style("border-radius", "5px");

        tooltip.transition()
          .duration(200)
          .style("opacity", .9);
        
        tooltip.html(`${d.result}<br/>Distance: ${d.distance}ft<br/>Exit Velo: ${d.exitVelocity}mph`)
          .style("left", (event.pageX + 10) + "px")
          .style("top", (event.pageY - 28) + "px");
      })
      .on("mouseout", function() {
        d3.select(this).attr("r", 4);
        d3.selectAll(".tooltip").remove();
      });

    // Add title
    svg.append("text")
      .attr("x", size / 2)
      .attr("y", 20)
      .attr("text-anchor", "middle")
      .style("font-size", "16px")
      .style("font-weight", "bold")
      .text("Spray Chart");

    // Add legend
    const legend = svg.append("g")
      .attr("transform", `translate(${size - 100}, 40)`);

    const legendData = [
      { type: 'homerun', color: this.colors.danger },
      { type: 'triple', color: this.colors.accent },
      { type: 'double', color: this.colors.success },
      { type: 'single', color: this.colors.primary }
    ];

    legendData.forEach((item, i) => {
      legend.append("circle")
        .attr("cx", 0)
        .attr("cy", i * 20)
        .attr("r", 4)
        .attr("fill", item.color);

      legend.append("text")
        .attr("x", 10)
        .attr("y", i * 20 + 4)
        .text(item.type)
        .style("font-size", "12px");
    });

    return svg;
  }

  /**
   * Create a win probability chart
   */
  createWinProbabilityChart(data, containerId) {
    const margin = { top: 40, right: 40, bottom: 60, left: 60 };
    const width = 700 - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;

    // Clear previous chart
    d3.select(`#${containerId}`).selectAll("*").remove();

    const svg = d3.select(`#${containerId}`)
      .append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Create scales
    const xScale = d3.scaleLinear()
      .domain([0, 9]) // 9 innings
      .range([0, width]);

    const yScale = d3.scaleLinear()
      .domain([0, 1]) // 0-100% probability
      .range([height, 0]);

    // Create area generators for both teams
    const areaHome = d3.area()
      .x(d => xScale(d.inning))
      .y0(height / 2)
      .y1(d => yScale(d.homeWinProb))
      .curve(d3.curveMonotoneX);

    const areaAway = d3.area()
      .x(d => xScale(d.inning))
      .y0(height / 2)
      .y1(d => yScale(1 - d.homeWinProb))
      .curve(d3.curveMonotoneX);

    // Add areas
    svg.append("path")
      .datum(data)
      .attr("fill", this.colors.primary)
      .attr("opacity", 0.5)
      .attr("d", areaHome);

    svg.append("path")
      .datum(data)
      .attr("fill", this.colors.danger)
      .attr("opacity", 0.5)
      .attr("d", areaAway);

    // Add 50% line
    svg.append("line")
      .attr("x1", 0)
      .attr("x2", width)
      .attr("y1", height / 2)
      .attr("y2", height / 2)
      .attr("stroke", this.colors.text)
      .attr("stroke-width", 1)
      .attr("stroke-dasharray", "3,3")
      .attr("opacity", 0.5);

    // Add axes
    svg.append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(xScale)
        .ticks(9)
        .tickFormat(d => d === 0 ? "Start" : `${d}th`));

    svg.append("g")
      .call(d3.axisLeft(yScale)
        .tickFormat(d3.format(".0%")));

    // Add title
    svg.append("text")
      .attr("x", width / 2)
      .attr("y", -20)
      .attr("text-anchor", "middle")
      .style("font-size", "16px")
      .style("font-weight", "bold")
      .text("Win Probability");

    // Add team labels
    svg.append("text")
      .attr("x", 10)
      .attr("y", 20)
      .style("fill", this.colors.primary)
      .style("font-weight", "bold")
      .text("HOME");

    svg.append("text")
      .attr("x", 10)
      .attr("y", height - 10)
      .style("fill", this.colors.danger)
      .style("font-weight", "bold")
      .text("AWAY");

    return svg;
  }

  /**
   * Process data for heat map
   */
  processHeatMapData(data, xGridCount, yGridCount, xScale, yScale) {
    const heatmapData = [];
    const gridCounts = {};

    // Count pitches in each grid cell
    data.forEach(pitch => {
      const x = Math.floor((pitch.x - xScale.domain()[0]) / (xScale.domain()[1] - xScale.domain()[0]) * xGridCount);
      const y = Math.floor((pitch.y - yScale.domain()[0]) / (yScale.domain()[1] - yScale.domain()[0]) * yGridCount);
      
      const key = `${x},${y}`;
      gridCounts[key] = (gridCounts[key] || 0) + 1;
    });

    // Convert to array format
    for (let x = 0; x < xGridCount; x++) {
      for (let y = 0; y < yGridCount; y++) {
        heatmapData.push({
          x: x,
          y: y,
          value: gridCounts[`${x},${y}`] || 0
        });
      }
    }

    return heatmapData;
  }

  /**
   * Update all charts with new data
   */
  updateCharts(gameData) {
    // Update each chart type with relevant data
    if (gameData.strikeZone) {
      this.createStrikeZoneHeatMap(gameData.strikeZone, 'strike-zone-chart');
    }
    
    if (gameData.battingAverage) {
      this.createBattingAverageTrend(gameData.battingAverage, 'batting-average-chart');
    }
    
    if (gameData.pitchVelocity) {
      this.createPitchVelocityDistribution(gameData.pitchVelocity, 'pitch-velocity-chart');
    }
    
    if (gameData.sprayChart) {
      this.createSprayChart(gameData.sprayChart, 'spray-chart');
    }
    
    if (gameData.winProbability) {
      this.createWinProbabilityChart(gameData.winProbability, 'win-probability-chart');
    }
  }
}

// Export for use in game
export default BaseballDataViz;