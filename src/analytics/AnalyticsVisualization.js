export class AnalyticsVisualization {
    constructor() {
        this.renderers = new Map();
        this.themes = new ThemeManager();
        this.animations = new AnimationEngine();
        this.interactions = new InteractionManager();
        
        this.initializeRenderers();
    }

    initializeRenderers() {
        this.renderers.set('line', new LineChartRenderer());
        this.renderers.set('bar', new BarChartRenderer());
        this.renderers.set('scatter', new ScatterPlotRenderer());
        this.renderers.set('heatmap', new HeatMapRenderer());
        this.renderers.set('radar', new RadarChartRenderer());
        this.renderers.set('boxplot', new BoxPlotRenderer());
        this.renderers.set('gauge', new GaugeRenderer());
        this.renderers.set('sparkline', new SparklineRenderer());
    }

    createVisualization(type, container, data, options = {}) {
        const renderer = this.renderers.get(type);
        if (!renderer) {
            throw new Error(`Unknown visualization type: ${type}`);
        }

        const config = this.prepareConfig(options);
        const visualization = renderer.create(container, data, config);
        
        this.setupInteractions(visualization, config);
        this.applyTheme(visualization, config.theme);
        
        return visualization;
    }

    prepareConfig(options) {
        return {
            width: options.width || 800,
            height: options.height || 400,
            theme: options.theme || 'dark',
            animated: options.animated !== false,
            interactive: options.interactive !== false,
            responsive: options.responsive !== false,
            ...options
        };
    }
}

export class LineChartRenderer {
    create(container, data, options) {
        const canvas = this.createCanvas(container, options);
        const ctx = canvas.getContext('2d');
        
        const chart = new LineChart(ctx, data, options);
        chart.render();
        
        return chart;
    }

    createCanvas(container, options) {
        const canvas = document.createElement('canvas');
        canvas.width = options.width;
        canvas.height = options.height;
        canvas.style.maxWidth = '100%';
        canvas.style.height = 'auto';
        
        if (typeof container === 'string') {
            document.getElementById(container).appendChild(canvas);
        } else {
            container.appendChild(canvas);
        }
        
        return canvas;
    }
}

export class LineChart {
    constructor(ctx, data, options) {
        this.ctx = ctx;
        this.data = data;
        this.options = options;
        this.width = ctx.canvas.width;
        this.height = ctx.canvas.height;
        this.padding = options.padding || { top: 40, right: 40, bottom: 60, left: 80 };
        
        this.calculateBounds();
        this.setupScales();
    }

    calculateBounds() {
        this.chartWidth = this.width - this.padding.left - this.padding.right;
        this.chartHeight = this.height - this.padding.top - this.padding.bottom;
        this.chartLeft = this.padding.left;
        this.chartTop = this.padding.top;
    }

    setupScales() {
        // X Scale
        this.xMin = Math.min(...this.data.map(d => d.x));
        this.xMax = Math.max(...this.data.map(d => d.x));
        this.xScale = this.chartWidth / (this.xMax - this.xMin);

        // Y Scale  
        this.yMin = Math.min(...this.data.map(d => d.y));
        this.yMax = Math.max(...this.data.map(d => d.y));
        const yRange = this.yMax - this.yMin;
        this.yMin -= yRange * 0.1; // Add 10% padding
        this.yMax += yRange * 0.1;
        this.yScale = this.chartHeight / (this.yMax - this.yMin);
    }

    render() {
        this.clear();
        this.drawBackground();
        this.drawGrid();
        this.drawAxes();
        this.drawLine();
        this.drawPoints();
        this.drawLabels();
        this.drawLegend();
    }

    clear() {
        this.ctx.clearRect(0, 0, this.width, this.height);
    }

    drawBackground() {
        this.ctx.fillStyle = this.options.theme === 'dark' ? '#1a1a2e' : '#ffffff';
        this.ctx.fillRect(0, 0, this.width, this.height);
    }

    drawGrid() {
        this.ctx.strokeStyle = this.options.theme === 'dark' ? '#333' : '#e0e0e0';
        this.ctx.lineWidth = 1;

        // Vertical grid lines
        const xTicks = 10;
        for (let i = 0; i <= xTicks; i++) {
            const x = this.chartLeft + (i * this.chartWidth / xTicks);
            this.ctx.beginPath();
            this.ctx.moveTo(x, this.chartTop);
            this.ctx.lineTo(x, this.chartTop + this.chartHeight);
            this.ctx.stroke();
        }

        // Horizontal grid lines
        const yTicks = 8;
        for (let i = 0; i <= yTicks; i++) {
            const y = this.chartTop + (i * this.chartHeight / yTicks);
            this.ctx.beginPath();
            this.ctx.moveTo(this.chartLeft, y);
            this.ctx.lineTo(this.chartLeft + this.chartWidth, y);
            this.ctx.stroke();
        }
    }

    drawAxes() {
        this.ctx.strokeStyle = this.options.theme === 'dark' ? '#fff' : '#000';
        this.ctx.lineWidth = 2;

        // X axis
        this.ctx.beginPath();
        this.ctx.moveTo(this.chartLeft, this.chartTop + this.chartHeight);
        this.ctx.lineTo(this.chartLeft + this.chartWidth, this.chartTop + this.chartHeight);
        this.ctx.stroke();

        // Y axis
        this.ctx.beginPath();
        this.ctx.moveTo(this.chartLeft, this.chartTop);
        this.ctx.lineTo(this.chartLeft, this.chartTop + this.chartHeight);
        this.ctx.stroke();
    }

    drawLine() {
        if (this.data.length < 2) return;

        this.ctx.strokeStyle = this.options.lineColor || '#00ff88';
        this.ctx.lineWidth = this.options.lineWidth || 3;
        this.ctx.beginPath();

        for (let i = 0; i < this.data.length; i++) {
            const x = this.chartLeft + (this.data[i].x - this.xMin) * this.xScale;
            const y = this.chartTop + this.chartHeight - (this.data[i].y - this.yMin) * this.yScale;

            if (i === 0) {
                this.ctx.moveTo(x, y);
            } else {
                this.ctx.lineTo(x, y);
            }
        }

        this.ctx.stroke();

        // Fill area under line if requested
        if (this.options.fillArea) {
            this.ctx.fillStyle = this.options.fillColor || 'rgba(0, 255, 136, 0.2)';
            this.ctx.lineTo(this.chartLeft + (this.data[this.data.length - 1].x - this.xMin) * this.xScale, this.chartTop + this.chartHeight);
            this.ctx.lineTo(this.chartLeft + (this.data[0].x - this.xMin) * this.xScale, this.chartTop + this.chartHeight);
            this.ctx.closePath();
            this.ctx.fill();
        }
    }

    drawPoints() {
        if (!this.options.showPoints) return;

        this.ctx.fillStyle = this.options.pointColor || '#00ff88';
        const radius = this.options.pointRadius || 4;

        for (const point of this.data) {
            const x = this.chartLeft + (point.x - this.xMin) * this.xScale;
            const y = this.chartTop + this.chartHeight - (point.y - this.yMin) * this.yScale;

            this.ctx.beginPath();
            this.ctx.arc(x, y, radius, 0, Math.PI * 2);
            this.ctx.fill();

            // Highlight point on hover
            if (point.highlighted) {
                this.ctx.strokeStyle = '#fff';
                this.ctx.lineWidth = 2;
                this.ctx.stroke();
            }
        }
    }

    drawLabels() {
        this.ctx.fillStyle = this.options.theme === 'dark' ? '#fff' : '#000';
        this.ctx.font = '12px Arial';
        this.ctx.textAlign = 'center';

        // X axis labels
        const xTicks = 5;
        for (let i = 0; i <= xTicks; i++) {
            const value = this.xMin + (i * (this.xMax - this.xMin) / xTicks);
            const x = this.chartLeft + (i * this.chartWidth / xTicks);
            const y = this.chartTop + this.chartHeight + 20;
            
            this.ctx.fillText(this.formatXValue(value), x, y);
        }

        // Y axis labels
        this.ctx.textAlign = 'right';
        const yTicks = 6;
        for (let i = 0; i <= yTicks; i++) {
            const value = this.yMin + (i * (this.yMax - this.yMin) / yTicks);
            const x = this.chartLeft - 10;
            const y = this.chartTop + this.chartHeight - (i * this.chartHeight / yTicks) + 4;
            
            this.ctx.fillText(this.formatYValue(value), x, y);
        }

        // Axis titles
        if (this.options.xLabel) {
            this.ctx.textAlign = 'center';
            this.ctx.font = '14px Arial';
            this.ctx.fillText(this.options.xLabel, this.chartLeft + this.chartWidth / 2, this.height - 10);
        }

        if (this.options.yLabel) {
            this.ctx.save();
            this.ctx.translate(20, this.chartTop + this.chartHeight / 2);
            this.ctx.rotate(-Math.PI / 2);
            this.ctx.textAlign = 'center';
            this.ctx.font = '14px Arial';
            this.ctx.fillText(this.options.yLabel, 0, 0);
            this.ctx.restore();
        }
    }

    drawLegend() {
        if (!this.options.legend) return;

        const legendItems = this.options.legend.items || [];
        const legendX = this.width - 150;
        const legendY = 50;

        this.ctx.fillStyle = this.options.theme === 'dark' ? 'rgba(0, 0, 0, 0.8)' : 'rgba(255, 255, 255, 0.9)';
        this.ctx.fillRect(legendX - 10, legendY - 10, 140, legendItems.length * 25 + 20);

        this.ctx.strokeStyle = this.options.theme === 'dark' ? '#555' : '#ccc';
        this.ctx.strokeRect(legendX - 10, legendY - 10, 140, legendItems.length * 25 + 20);

        for (let i = 0; i < legendItems.length; i++) {
            const item = legendItems[i];
            const itemY = legendY + i * 25;

            // Color indicator
            this.ctx.fillStyle = item.color;
            this.ctx.fillRect(legendX, itemY, 15, 15);

            // Text
            this.ctx.fillStyle = this.options.theme === 'dark' ? '#fff' : '#000';
            this.ctx.font = '12px Arial';
            this.ctx.textAlign = 'left';
            this.ctx.fillText(item.label, legendX + 25, itemY + 12);
        }
    }

    formatXValue(value) {
        if (this.options.xFormat) {
            return this.options.xFormat(value);
        }
        return Math.round(value * 10) / 10;
    }

    formatYValue(value) {
        if (this.options.yFormat) {
            return this.options.yFormat(value);
        }
        return Math.round(value * 100) / 100;
    }

    // Animation methods
    animateIn() {
        // Animate line drawing
        const totalLength = this.data.length;
        let currentIndex = 0;
        
        const animate = () => {
            if (currentIndex < totalLength) {
                this.render(currentIndex);
                currentIndex++;
                requestAnimationFrame(animate);
            }
        };
        
        animate();
    }

    // Interaction methods
    onMouseMove(event) {
        const rect = this.ctx.canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        
        const dataIndex = this.findNearestDataPoint(x, y);
        if (dataIndex !== -1) {
            this.highlightPoint(dataIndex);
            this.showTooltip(dataIndex, x, y);
        }
    }

    findNearestDataPoint(mouseX, mouseY) {
        let nearestIndex = -1;
        let nearestDistance = Infinity;

        for (let i = 0; i < this.data.length; i++) {
            const dataX = this.chartLeft + (this.data[i].x - this.xMin) * this.xScale;
            const dataY = this.chartTop + this.chartHeight - (this.data[i].y - this.yMin) * this.yScale;
            
            const distance = Math.sqrt(Math.pow(mouseX - dataX, 2) + Math.pow(mouseY - dataY, 2));
            
            if (distance < nearestDistance && distance < 20) {
                nearestDistance = distance;
                nearestIndex = i;
            }
        }

        return nearestIndex;
    }

    highlightPoint(index) {
        // Reset all highlights
        this.data.forEach(d => d.highlighted = false);
        
        if (index >= 0 && index < this.data.length) {
            this.data[index].highlighted = true;
            this.render();
        }
    }

    showTooltip(index, x, y) {
        if (this.options.onTooltip) {
            const dataPoint = this.data[index];
            this.options.onTooltip(dataPoint, x, y);
        }
    }
}

export class BarChartRenderer {
    create(container, data, options) {
        const canvas = this.createCanvas(container, options);
        const ctx = canvas.getContext('2d');
        
        const chart = new BarChart(ctx, data, options);
        chart.render();
        
        return chart;
    }

    createCanvas(container, options) {
        const canvas = document.createElement('canvas');
        canvas.width = options.width;
        canvas.height = options.height;
        canvas.style.maxWidth = '100%';
        
        if (typeof container === 'string') {
            document.getElementById(container).appendChild(canvas);
        } else {
            container.appendChild(canvas);
        }
        
        return canvas;
    }
}

export class BarChart {
    constructor(ctx, data, options) {
        this.ctx = ctx;
        this.data = data;
        this.options = options;
        this.width = ctx.canvas.width;
        this.height = ctx.canvas.height;
        this.padding = options.padding || { top: 40, right: 40, bottom: 80, left: 80 };
        
        this.calculateBounds();
        this.setupScales();
    }

    calculateBounds() {
        this.chartWidth = this.width - this.padding.left - this.padding.right;
        this.chartHeight = this.height - this.padding.top - this.padding.bottom;
        this.chartLeft = this.padding.left;
        this.chartTop = this.padding.top;
    }

    setupScales() {
        this.maxValue = Math.max(...this.data.map(d => d.value));
        this.minValue = Math.min(...this.data.map(d => d.value));
        
        if (this.minValue > 0) this.minValue = 0; // Start from 0 for positive values
        
        this.valueRange = this.maxValue - this.minValue;
        this.barWidth = this.chartWidth / this.data.length * 0.8;
        this.barSpacing = this.chartWidth / this.data.length * 0.2;
    }

    render() {
        this.clear();
        this.drawBackground();
        this.drawGrid();
        this.drawAxes();
        this.drawBars();
        this.drawLabels();
        this.drawLegend();
    }

    clear() {
        this.ctx.clearRect(0, 0, this.width, this.height);
    }

    drawBackground() {
        this.ctx.fillStyle = this.options.theme === 'dark' ? '#1a1a2e' : '#ffffff';
        this.ctx.fillRect(0, 0, this.width, this.height);
    }

    drawGrid() {
        this.ctx.strokeStyle = this.options.theme === 'dark' ? '#333' : '#e0e0e0';
        this.ctx.lineWidth = 1;

        const ticks = 8;
        for (let i = 0; i <= ticks; i++) {
            const y = this.chartTop + (i * this.chartHeight / ticks);
            this.ctx.beginPath();
            this.ctx.moveTo(this.chartLeft, y);
            this.ctx.lineTo(this.chartLeft + this.chartWidth, y);
            this.ctx.stroke();
        }
    }

    drawAxes() {
        this.ctx.strokeStyle = this.options.theme === 'dark' ? '#fff' : '#000';
        this.ctx.lineWidth = 2;

        // X axis
        this.ctx.beginPath();
        this.ctx.moveTo(this.chartLeft, this.chartTop + this.chartHeight);
        this.ctx.lineTo(this.chartLeft + this.chartWidth, this.chartTop + this.chartHeight);
        this.ctx.stroke();

        // Y axis
        this.ctx.beginPath();
        this.ctx.moveTo(this.chartLeft, this.chartTop);
        this.ctx.lineTo(this.chartLeft, this.chartTop + this.chartHeight);
        this.ctx.stroke();
    }

    drawBars() {
        for (let i = 0; i < this.data.length; i++) {
            const data = this.data[i];
            const barHeight = Math.abs(data.value - this.minValue) / this.valueRange * this.chartHeight;
            const barX = this.chartLeft + (i * this.chartWidth / this.data.length) + (this.barSpacing / 2);
            const barY = this.chartTop + this.chartHeight - barHeight;

            // Bar color
            this.ctx.fillStyle = data.color || this.options.barColor || '#00ff88';
            
            // Draw bar
            this.ctx.fillRect(barX, barY, this.barWidth, barHeight);

            // Bar border
            if (this.options.showBorder) {
                this.ctx.strokeStyle = this.options.borderColor || '#fff';
                this.ctx.lineWidth = 1;
                this.ctx.strokeRect(barX, barY, this.barWidth, barHeight);
            }

            // Value labels on bars
            if (this.options.showValues) {
                this.ctx.fillStyle = this.options.theme === 'dark' ? '#fff' : '#000';
                this.ctx.font = '12px Arial';
                this.ctx.textAlign = 'center';
                this.ctx.fillText(
                    this.formatValue(data.value),
                    barX + this.barWidth / 2,
                    barY - 5
                );
            }
        }
    }

    drawLabels() {
        this.ctx.fillStyle = this.options.theme === 'dark' ? '#fff' : '#000';
        this.ctx.font = '12px Arial';

        // X axis labels
        this.ctx.textAlign = 'center';
        for (let i = 0; i < this.data.length; i++) {
            const labelX = this.chartLeft + (i * this.chartWidth / this.data.length) + (this.chartWidth / this.data.length / 2);
            const labelY = this.chartTop + this.chartHeight + 20;
            
            this.ctx.fillText(this.data[i].label || `Item ${i + 1}`, labelX, labelY);
        }

        // Y axis labels
        this.ctx.textAlign = 'right';
        const ticks = 8;
        for (let i = 0; i <= ticks; i++) {
            const value = this.minValue + (i * this.valueRange / ticks);
            const labelX = this.chartLeft - 10;
            const labelY = this.chartTop + this.chartHeight - (i * this.chartHeight / ticks) + 4;
            
            this.ctx.fillText(this.formatValue(value), labelX, labelY);
        }
    }

    drawLegend() {
        // Similar to LineChart legend implementation
        if (!this.options.legend) return;
        // Implementation details...
    }

    formatValue(value) {
        if (this.options.valueFormat) {
            return this.options.valueFormat(value);
        }
        return Math.round(value * 100) / 100;
    }

    animateIn() {
        const duration = this.options.animationDuration || 1000;
        const startTime = Date.now();
        
        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            this.clear();
            this.drawBackground();
            this.drawGrid();
            this.drawAxes();
            this.drawBarsAnimated(progress);
            this.drawLabels();
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };
        
        animate();
    }

    drawBarsAnimated(progress) {
        const easeOutCubic = t => 1 - Math.pow(1 - t, 3);
        const easedProgress = easeOutCubic(progress);
        
        for (let i = 0; i < this.data.length; i++) {
            const data = this.data[i];
            const fullBarHeight = Math.abs(data.value - this.minValue) / this.valueRange * this.chartHeight;
            const animatedHeight = fullBarHeight * easedProgress;
            
            const barX = this.chartLeft + (i * this.chartWidth / this.data.length) + (this.barSpacing / 2);
            const barY = this.chartTop + this.chartHeight - animatedHeight;

            this.ctx.fillStyle = data.color || this.options.barColor || '#00ff88';
            this.ctx.fillRect(barX, barY, this.barWidth, animatedHeight);
        }
    }
}

// Additional renderer classes would follow similar patterns:
// - ScatterPlotRenderer
// - HeatMapRenderer  
// - RadarChartRenderer
// - BoxPlotRenderer
// - GaugeRenderer
// - SparklineRenderer

export class ThemeManager {
    constructor() {
        this.themes = new Map();
        this.setupDefaultThemes();
    }

    setupDefaultThemes() {
        this.themes.set('dark', {
            background: '#1a1a2e',
            text: '#ffffff',
            grid: '#333333',
            primary: '#00ff88',
            secondary: '#00d4ff',
            accent: '#ff6b35',
            series: ['#00ff88', '#00d4ff', '#ff6b35', '#f1c40f', '#e74c3c']
        });

        this.themes.set('light', {
            background: '#ffffff',
            text: '#000000',
            grid: '#e0e0e0',
            primary: '#2196f3',
            secondary: '#4caf50',
            accent: '#ff9800',
            series: ['#2196f3', '#4caf50', '#ff9800', '#9c27b0', '#f44336']
        });

        this.themes.set('baseball', {
            background: '#0d5016', // Baseball field green
            text: '#ffffff',
            grid: '#1a7022',
            primary: '#ffffff', // Baseball white
            secondary: '#8b4513', // Baseball brown
            accent: '#ff0000', // Warning red
            series: ['#ffffff', '#8b4513', '#ff0000', '#ffff00', '#0080ff']
        });
    }

    getTheme(name) {
        return this.themes.get(name) || this.themes.get('dark');
    }

    addTheme(name, theme) {
        this.themes.set(name, theme);
    }
}

export class AnimationEngine {
    constructor() {
        this.activeAnimations = new Map();
    }

    animate(target, properties, duration = 1000, easing = 'easeOutCubic') {
        const animationId = Date.now() + Math.random();
        const startTime = Date.now();
        const startValues = {};
        
        // Store starting values
        for (const prop in properties) {
            startValues[prop] = target[prop];
        }

        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const easedProgress = this.applyEasing(progress, easing);

            // Update properties
            for (const prop in properties) {
                const startValue = startValues[prop];
                const endValue = properties[prop];
                target[prop] = startValue + (endValue - startValue) * easedProgress;
            }

            if (progress < 1) {
                this.activeAnimations.set(animationId, requestAnimationFrame(animate));
            } else {
                this.activeAnimations.delete(animationId);
                if (target.render) target.render();
            }

            if (target.render) target.render();
        };

        animate();
        return animationId;
    }

    applyEasing(t, easing) {
        const easings = {
            linear: t => t,
            easeInQuad: t => t * t,
            easeOutQuad: t => t * (2 - t),
            easeInOutQuad: t => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
            easeInCubic: t => t * t * t,
            easeOutCubic: t => (--t) * t * t + 1,
            easeInOutCubic: t => t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1
        };

        return easings[easing] ? easings[easing](t) : easings.easeOutCubic(t);
    }

    stopAnimation(animationId) {
        if (this.activeAnimations.has(animationId)) {
            cancelAnimationFrame(this.activeAnimations.get(animationId));
            this.activeAnimations.delete(animationId);
        }
    }

    stopAllAnimations() {
        for (const [id, frameId] of this.activeAnimations) {
            cancelAnimationFrame(frameId);
        }
        this.activeAnimations.clear();
    }
}

export class InteractionManager {
    constructor() {
        this.handlers = new Map();
    }

    addInteraction(element, type, handler) {
        const key = `${element}_${type}`;
        this.handlers.set(key, handler);
        
        if (typeof element === 'string') {
            element = document.getElementById(element);
        }
        
        element.addEventListener(type, handler);
    }

    removeInteraction(element, type) {
        const key = `${element}_${type}`;
        const handler = this.handlers.get(key);
        
        if (handler) {
            if (typeof element === 'string') {
                element = document.getElementById(element);
            }
            
            element.removeEventListener(type, handler);
            this.handlers.delete(key);
        }
    }

    removeAllInteractions() {
        for (const [key, handler] of this.handlers) {
            const [elementId, type] = key.split('_');
            const element = document.getElementById(elementId);
            
            if (element) {
                element.removeEventListener(type, handler);
            }
        }
        
        this.handlers.clear();
    }
}