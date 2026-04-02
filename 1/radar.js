// Set up dimensions - using consistent sizing with coxcomb chart
const width = 800;
const height = 1000; // Extended to accommodate interpretation section at bottom
const margin = { top: 50, right: 50, bottom: 250, left: 50 }; // Increased bottom margin for interpretation

// Calculate available space for the chart
const availableWidth = width - margin.left - margin.right;
const availableHeight = height - margin.top - margin.bottom;

// Calculate radius to use 82% of available space
const maxRadius = Math.min(availableWidth, availableHeight) / 2.4;
const radius = maxRadius * 0.82; // 82% of maximum possible radius

// Center point for the chart - perfectly centered
const centerX = width / 2;
const centerY = height / 2 - 180;

// Create SVG container with viewBox for responsiveness
const svg = d3.select("#chart")
    .append("svg")
    .attr("width", "100%")
    .attr("height", "900px")
    .attr("viewBox", `0 0 ${width} ${height}`)
    .attr("preserveAspectRatio", "xMidYMid meet")
    .append("g")
    .attr("transform", `translate(${centerX}, ${centerY})`); // Perfectly centered

// Key mapping for readable labels
const featureMap = {
    "tavg": "Avg Temp",
    "tmin": "Min Temp",
    "tmax": "Max Temp",
    "prcp": "Precipitation",
    "snow": "Snowfall",
    "wspd": "Wind Speed",
    "tsun": "Sunny Days",
    "pres": "Pressure"
};

const features = Object.keys(featureMap);
const angleSlice = Math.PI * 2 / features.length;

// Radial scale
const rScale = d3.scaleLinear()
    .range([0, radius])
    .domain([0, 1]);

// Product colors
const colors = {
    "Product_A_Winter_Jacket": "#4ECDC4", // Teal/green
    "Product_B_Rain_Boots": "#FF6B6B",    // Coral/orange
    "Product_C_Sunglasses": "#95A5C6"     // Purple/blue
};

const productLabels = {
    "Product_A_Winter_Jacket": "Product A Winter Jacket",
    "Product_B_Rain_Boots": "Product B Rain Boots",
    "Product_C_Sunglasses": "Product C Sunglasses"
};

// Load data
d3.csv("student24880019_product_weather_normalized.csv").then(data => {

    // Process data: Convert to array of points for lineRadial
    // Each data point will be array of {axis: "name", value: 1.2} 
    const formattedData = data.map(d => {
        const points = features.map(key => ({
            axis: featureMap[key],
            value: +d[key]
        }));
        return {
            product: d.product,
            points: points
        };
    });

    // --- Draw Grid ---

    // Grid levels
    const levels = 5;
    const gridWrapper = svg.append("g").attr("class", "gridWrapper");

    // Circular levels
    for (let level = 0; level < levels; level++) {
        const levelFactor = radius * ((level + 1) / levels);

        gridWrapper.selectAll(".levels")
            .data([1]) // dummy data
            .enter()
            .append("circle")
            .attr("r", levelFactor)
            .style("fill", "#CDCDCD")
            .style("stroke", "#CDCDCD")
            .style("fill-opacity", 0.1)
            .style("filter", "url(#glow)");
    }

    // Text indicating levels
    for (let level = 0; level < levels; level++) {
        const levelFactor = radius * ((level + 1) / levels);
        gridWrapper.append("text")
            .attr("x", 4)
            .attr("y", -levelFactor)
            .attr("dy", "0.4em")
            .style("font-size", "13px")
            .style("fill", "#737373")
            .text(((level + 1) / levels).toString());
    }

    // --- Draw Axes ---

    const axisGrid = svg.append("g").attr("class", "axisWrapper");

    const axis = axisGrid.selectAll(".axis")
        .data(features)
        .enter()
        .append("g")
        .attr("class", "axis");

    // Axis lines
    axis.append("line")
        .attr("x1", 0)
        .attr("y1", 0)
        .attr("x2", (d, i) => rScale(1.1) * Math.cos(angleSlice * i - Math.PI / 2))
        .attr("y2", (d, i) => rScale(1.1) * Math.sin(angleSlice * i - Math.PI / 2))
        .attr("class", "line")
        .style("stroke", "white")
        .style("stroke-width", "2px");

    // Axis labels
    axis.append("text")
        .attr("class", "legend")
        .style("font-size", "13px")
        .attr("text-anchor", "middle")
        .attr("dy", "0.35em")
        .attr("x", (d, i) => rScale(1.25) * Math.cos(angleSlice * i - Math.PI / 2))
        .attr("y", (d, i) => rScale(1.25) * Math.sin(angleSlice * i - Math.PI / 2))
        .text(d => featureMap[d])
        .call(wrap, 60);

    // --- Draw Radar Polygons ---

    const radarLine = d3.lineRadial()
        .curve(d3.curveLinearClosed)
        .radius(d => rScale(d.value))
        .angle((d, i) => i * angleSlice);

    const blobWrapper = svg.selectAll(".radarWrapper")
        .data(formattedData)
        .enter().append("g")
        .attr("class", "radarWrapper");

    // Append the backgrounds
    blobWrapper.append("path")
        .attr("class", "radarArea")
        .attr("d", d => radarLine(d.points))
        .style("fill", d => colors[d.product])
        .style("fill-opacity", 0.3)
        .on("mouseover", function (event, d) {
            // Dim others
            d3.selectAll(".radarArea")
                .transition().duration(200)
                .style("fill-opacity", 0.1);
            // Highlight current
            d3.select(this)
                .transition().duration(200)
                .style("fill-opacity", 0.7);

            // Show tooltip
            const tooltip = d3.select("#tooltip");
            tooltip.style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY - 10) + "px")
                .classed("hidden", false);

            let tooltipContent = `<strong>${productLabels[d.product]}</strong><br/>`;
            d.points.forEach(p => {
                tooltipContent += `${p.axis}: ${p.value.toFixed(2)}<br/>`;
            });
            tooltip.html(tooltipContent);
        })
        .on("mouseout", function () {
            // Bring back to normal
            d3.selectAll(".radarArea")
                .transition().duration(200)
                .style("fill-opacity", 0.3);

            d3.select("#tooltip").classed("hidden", true);
        });

    // Create the outlines
    blobWrapper.append("path")
        .attr("class", "radarStroke")
        .attr("d", d => radarLine(d.points))
        .style("stroke-width", "3px")
        .style("stroke", d => colors[d.product])
        .style("fill", "none")
        .style("filter", "url(#glow)");

    // Append the circles
    blobWrapper.selectAll(".radarCircle")
        .data(d => d.points.map(p => ({ ...p, product: d.product }))) // Pass product info
        .enter().append("circle")
        .attr("class", "radarCircle")
        .attr("r", 4)
        .attr("cx", (d, i) => rScale(d.value) * Math.cos(angleSlice * i - Math.PI / 2))
        .attr("cy", (d, i) => rScale(d.value) * Math.sin(angleSlice * i - Math.PI / 2))
        .style("fill", d => colors[d.product])
        .style("fill-opacity", 0.8);

    // --- Legend ---

    // Position: Top Left corner of the SVG
    // We need to account for the chart's translation. 
    // Chart group is at (width/2, 420).
    // So top-left of SVG relative to this group is roughly (-width/2, -420).

    const legendX = -width / 2 + 20;
    const legendY = -250 + 20;

    const legendGroup = svg.append("g")
        .attr("transform", `translate(${legendX-20}, ${legendY-60})`);

    const legendItems = legendGroup.selectAll(".legend-item")
        .data(formattedData)
        .enter()
        .append("g")
        .attr("class", "legend-item")
        .attr("transform", (d, i) => `translate(0, ${i * 25})`); // Vertical stacking

    legendItems.append("rect")
        .attr("width", 15)
        .attr("height", 15)
        .style("fill", d => colors[d.product]);

    legendItems.append("text")
        .attr("x", 20)
        .attr("y", 12)
        .text(d => productLabels[d.product])
        .style("font-size", "13px")
        .style("fill", "#333");

    // --- Interpretation Text ---

    // Move down below the chart. 
    // Chart center is (0,0) in our transformed group.
    // Chart radius is `radius`.
    // Let's start text at `radius + 60`.

    const textStartY = radius + 60;

    const textGroup = svg.append("g")
        .attr("transform", `translate(${-width / 2 + 90}, ${textStartY})`); // Left aligned with padding

    const interpretationData = [
        "Product A (Winter Jacket):",
        "Demonstrates strong performance in cold-weather metrics, specifically showing correlations with Snowfall, Wind Speed, and high Precipitation. The low correlation with Sunny Days and Temperature confirms its seasonality for winter.",
        "",
        "Product B (Rain Boots):",
        "Shows data points skewing towards high Precipitation and Pressure, with moderate performance in cooler temperatures. This aligns with wet, transitional seasons like spring and autumn.",
        "",
        "Product C (Sunglasses):",
        "Exhibits a distinct spike in Sunny Days and Maximum Temperature, with negligible values for Snowfall and Precipitation. This clearly indicates peak performance during summer months.",
        "",
        "Business Implications:",
        "Inventory for Winter Jackets should be stocked prior to pressure drops and wind speed increases. Rain Boots marketing should be triggered by precipitation forecasts. Sunglasses promotions should align with rising UV/temperature trends."
    ];

    let currentDy = 0;

    interpretationData.forEach(line => {
        if (line === "") {
            currentDy += 10; // Extra spacing for paragraph break
            return;
        }

        // Check if line looks like a header (Product name or Business Implications)
        const isHeader = line.includes("Product") || line.includes("Business Implications");

        const textEl = textGroup.append("text")
            .attr("x", 0)
            .attr("y", currentDy)
            .attr("dy", "1em")
            .style("font-size", "14px")
            .style("fill", "#444")
            .style("font-weight", isHeader ? "bold" : "normal");

        // Simple wrapping logic if needed, but for now assuming lines are somewhat managed or we rely on SVG width
        // The prompt asked to "manually break into multiple text elements".

        if (!isHeader && line.length > 90) { // arbitrary char limit for wrapping
            const words = line.split(/\s+/);
            let lineStr = [];
            let dyOffset = 0;

            // Build lines word by word
            let currentLine = [];
            words.forEach(word => {
                currentLine.push(word);
                if (currentLine.join(" ").length > 90) {
                    // Pop last word, print line, start new
                    currentLine.pop();
                    textGroup.append("text")
                        .attr("x", 0)
                        .attr("y", currentDy + dyOffset)
                        .attr("dy", "1em")
                        .style("font-size", "14px")
                        .style("fill", "#444")
                        .text(currentLine.join(" "));

                    currentLine = [word];
                    dyOffset += 20;
                }
            });
            // Print remaining
            textGroup.append("text")
                .attr("x", 0)
                .attr("y", currentDy + dyOffset)
                .attr("dy", "1em")
                .style("font-size", "14px")
                .style("fill", "#444")
                .text(currentLine.join(" "));
            currentDy += dyOffset + 24;

        } else {
            textEl.text(line);
            currentDy += 24;
        }
    });

});

// Helper function to wrap text (for axis labels)
function wrap(text, width) {
    text.each(function () {
        var text = d3.select(this),
            words = text.text().split(/\s+/).reverse(),
            word,
            line = [],
            lineNumber = 0,
            lineHeight = 1.4, // ems
            y = text.attr("y"),
            x = text.attr("x"),
            dy = parseFloat(text.attr("dy")),
            tspan = text.text(null).append("tspan").attr("x", x).attr("y", y).attr("dy", dy + "em");

        while (word = words.pop()) {
            line.push(word);
            tspan.text(line.join(" "));
            if (tspan.node().getComputedTextLength() > width) {
                line.pop();
                tspan.text(line.join(" "));
                line = [word];
                tspan = text.append("tspan").attr("x", x).attr("y", y).attr("dy", ++lineNumber * lineHeight + dy + "em").text(word);
            }
        }
    });
}
