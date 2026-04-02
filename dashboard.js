(function () {
    // Set up dimensions - EQUAL SIZE for both radar and coxcomb
    // Each chart takes half the dashboard width (accounting for margins)
    const width = 600;
    const height = 500;
    // Margins adjusted to accommodate legend and axis labels
    const margin = { top: 40, right: 40, bottom: 40, left: 40 };
    
    // Calculate available space for the chart
    const availableWidth = width - margin.left - margin.right;
    const availableHeight = height - margin.top - margin.bottom;
    
    // Calculate radius to use 82% of available space (accounting for axis labels extending outward)
    const maxRadius = Math.min(availableWidth, availableHeight) / 2.3;
    const radius = maxRadius * 0.82; // 82% of maximum possible radius
    
    // Center point for the chart - perfectly centered
    const centerX = width / 2;
    const centerY = height / 2;

    // Create SVG container with viewBox for responsiveness
    const svg = d3.select("#radar-chart")
        .append("svg")
        .attr("width", "100%")
        .attr("height", "auto")
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

    // Product colors - updated to EcoWear palette
    const colors = {
        "Product_A_Winter_Jacket": "#66c2a5", // Teal/green
        "Product_B_Rain_Boots": "#fc8d62",    // Coral/orange
        "Product_C_Sunglasses": "#8da0cb"     // Purple/blue
    };

    const productLabels = {
        "Product_A_Winter_Jacket": "Product A Winter Jacket",
        "Product_B_Rain_Boots": "Product B Rain Boots",
        "Product_C_Sunglasses": "Product C Sunglasses"
    };

    // Load data
    d3.csv("1/student24880019_product_weather_normalized.csv").then(data => {

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
                .style("font-size", "11px")
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

        // Position: Top Left corner relative to chart center
        // Chart center is at (centerX, centerY) in SVG coordinates
        // Legend positioned relative to the transformed group (which is at center)
        const legendX = -availableWidth / 2 + -20;
        const legendY = -availableHeight / 2 + -65;

        const legendGroup = svg.append("g")
            .attr("transform", `translate(${legendX}, ${legendY})`);

        const legendItems = legendGroup.selectAll(".legend-item")
            .data(formattedData)
            .enter()
            .append("g")
            .attr("class", "legend-item")
            .attr("transform", (d, i) => `translate(0, ${i * 28})`); // Vertical stacking

        legendItems.append("rect")
            .attr("width", 18)
            .attr("height", 18)
            .attr("rx", 3)
            .attr("fill", d => colors[d.product]);

        legendItems.append("text")
            .attr("x", 24)
            .attr("y", 14)
            .text(d => productLabels[d.product])
            .style("font-size", "13px")
            .style("font-weight", "500")
            .style("fill", "#333");

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
})();

(function () {
    // Stacked Coxcomb chart (D3 v7) - EQUAL SIZE with radar chart
    // Each chart takes half the dashboard width (accounting for margins)
    const width = 600;
    const height = 500;
    const margin = { top: 40, right: 120, bottom: 20, left: 20 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;
    const centerX = innerWidth / 2 + margin.left;
    const centerY = innerHeight / 2 + margin.top;
    const maxOuterRadius = Math.min(innerWidth, innerHeight) / 2 - 30;

    const svg = d3.select('#coxcomb-chart')
        .append('svg')
        .attr('width', '100%')
        .attr('height', 'auto')
        .attr('viewBox', `0 0 ${width} ${height}`)
        .attr('preserveAspectRatio', 'xMidYMid meet');

    const g = svg.append('g')
        .attr('transform', `translate(${centerX},${centerY})`);

    const tooltip = d3.select('#tooltip')
        .style('position', 'absolute')
        .style('pointer-events', 'none')
        .attr('class', 'tooltip hidden');

    // load data
    d3.csv('3/EcoWear_Product_Sales.csv', d => ({
        Product: d.Product,
        CustomerSegment: d.CustomerSegment,
        Sales: +d.Sales
    })).then(data => {
        const products = Array.from(new Set(data.map(d => d.Product)));
        const segments = Array.from(new Set(data.map(d => d.CustomerSegment)));

        // nest data by segment and produce product order
        const segmentMap = new Map();
        segments.forEach(s => segmentMap.set(s, {}));
        data.forEach(d => {
            segmentMap.get(d.CustomerSegment)[d.Product] = d.Sales;
        });

        // compute stacked sums and max total per segment
        const stackedBySegment = segments.map(seg => {
            const item = { segment: seg, values: [] };
            let cum = 0;
            products.forEach(p => {
                const val = segmentMap.get(seg)[p] || 0;
                item.values.push({ product: p, value: val });
            });
            item.total = item.values.reduce((s, v) => s + v.value, 0);
            return item;
        });

        const maxTotal = d3.max(stackedBySegment, d => d.total);

        const radiusScale = d3.scaleLinear()
            .domain([0, maxTotal])
            .range([0, maxOuterRadius]);

        const anglePer = (2 * Math.PI) / segments.length;

        // EcoWear color scheme
        const colorMap = {
            'Winter Jacket': '#66c2a5',
            'Rain Boots': '#fc8d62',
            'Sunglasses': '#8da0cb'
        };
        const color = d3.scaleOrdinal()
            .domain(products)
            .range(products.map(p => colorMap[p] || '#999'));

        // For each segment, compute inner/outer radii for each product stack
        stackedBySegment.forEach((segObj, i) => {
            let cum = 0;
            segObj.stack = segObj.values.map(v => {
                const inner = cum;
                cum += v.value;
                const outer = cum;
                return {
                    product: v.product,
                    value: v.value,
                    inner: radiusScale(inner),
                    outer: radiusScale(outer),
                    startAngle: i * anglePer,
                    endAngle: (i + 1) * anglePer
                };
            });
        });

        const arc = d3.arc()
            .cornerRadius(2)
            .padAngle(0.01)
            .padRadius(10);

        // draw segments
        const segGroups = g.selectAll('.segment')
            .data(stackedBySegment)
            .enter()
            .append('g')
            .attr('class', 'segment');

        segGroups.selectAll('path')
            .data(d => d.stack)
            .enter()
            .append('path')
            .attr('d', d => arc({ innerRadius: d.inner, outerRadius: d.outer, startAngle: d.startAngle, endAngle: d.endAngle }))
            .attr('fill', d => color(d.product))
            .attr('stroke', '#fff')
            .attr('stroke-width', 0.8)
            .on('mousemove', (event, d) => {
                const [x, y] = d3.pointer(event);
                tooltip
                    .style('left', (event.pageX + 12) + 'px')
                    .style('top', (event.pageY + 12) + 'px')
                    .html(`<strong>Product:</strong> ${d.product}<br/><strong>Sales:</strong> ${d.value}k`)
                    .classed('hidden', false);
            })
            .on('mouseover', function (event, d) {
                d3.select(this).attr('opacity', 0.9);
            })
            .on('mouseout', function () {
                tooltip.classed('hidden', true);
                d3.select(this).attr('opacity', 1);
            });

        // add segment labels (outside)
        segGroups.append('text')
            .attr('x', (d, i) => {
                const angle = (i + 0.5) * anglePer - Math.PI / 2;
                return Math.cos(angle) * (maxOuterRadius + 20);
            })
            .attr('y', (d, i) => {
                const angle = (i + 0.5) * anglePer - Math.PI / 2;
                return Math.sin(angle) * (maxOuterRadius + 20);
            })
            .attr('text-anchor', 'middle')
            .attr('alignment-baseline', 'middle')
            .text(d => d.segment)
            .style('font-size', '13px');

        // Legend (vertical, top left inside SVG)
        const legendGroup = svg.append('g')
            .attr('class', 'legend')
            .attr('transform', `translate(${margin.left + 0}, ${margin.top + -65})`);

        const legendItem = legendGroup.selectAll('.legendItem')
            .data(products)
            .enter()
            .append('g')
            .attr('class', 'legendItem')
            .attr('transform', (d, i) => `translate(0, ${i * 28})`);

        legendItem.append('rect')
            .attr('x', 0)
            .attr('y', 0)
            .attr('width', 18)
            .attr('height', 18)
            .attr('fill', d => color(d))
            .attr('rx', 3);

        legendItem.append('text')
            .attr('x', 24)
            .attr('y', 14)
            .text(d => d)
            .style('font-size', '13px')
            .style('font-weight', '500')
            .attr('fill', '#333');

    }).catch(err => console.error(err));
})();

(function () {
    // Debug wrapper
    try {
        console.log('D3 loaded:', typeof d3);
        console.log('D3.sankey available:', typeof d3.sankey);
        console.log('D3.sankeyLinkHorizontal available:', typeof d3.sankeyLinkHorizontal);

        if (typeof d3.sankey === 'undefined') {
            throw new Error('d3.sankey is not defined - library not loaded correctly');
        }

        // Dimensions - increased width, added space for legend
        const width = 1335;
        const height = 400;
        const margin = { top: 40, right: 120, bottom: 40, left: 20 };

        // Node color scheme
        const nodeColors = {
            "Organic Search": "#3B82F6",
            "Paid Ads": "#3B82F6",
            "Social Media": "#3B82F6",
            "Product View": "#A0A0A0",
            "Add to Cart": "#A0A0A0",
            "Begin Checkout": "#A0A0A0",
            "Payment Initiated": "#A0A0A0",
            "Payment Completed": "#A0A0A0",
            "Order Confirmed": "#2CA02C",
            "Retained Customer": "#2CA02C",
            "Drop at Product View": "#D62728",
            "Drop at Cart": "#D62728",
            "Drop at Payment": "#D62728",
            "Payment Failed": "#D62728",
            "No Conversion": "#D62728",
            "Churned Customer": "#FFA500",
            "Returned Item": "#FFA500"
        };

        // Link color function
        function getLinkColor(source, target) {
            const acquisitionChannels = ["Organic Search", "Paid Ads", "Social Media"];
            const dropOffNodes = ["Drop at Product View", "Drop at Cart", "Drop at Payment", "Payment Failed", "No Conversion", "Churned Customer", "Returned Item"];

            if (acquisitionChannels.includes(source)) return "#888888";
            if (dropOffNodes.includes(target)) return "#D62728";
            return "#2B8CBE";
        }

        // Create SVG — keep Sankey drawing a fixed pixel size so external
        // changes to the SVG element do not scale the chart.
        const svg = d3.select("#sankey-chart")
            .append("svg")
            .attr("width", width)
            .attr("height", height)
            .attr('viewBox', `0 0 ${width} ${height}`)
            .attr('preserveAspectRatio', 'xMinYMin meet')
            .style('width', width + 'px')
            .style('height', height - '500px');

        const chartGroup = svg.append("g")
            .attr("transform", `translate(${margin.left}, ${margin.top - 20})`);

        const tooltip = d3.select("#tooltip");
        const formatNumber = d3.format(",");

        // Data
        const csvData = [
            { source: "Organic Search", target: "Product View", value: 10 },
            { source: "Paid Ads", target: "Product View", value: 8 },
            { source: "Social Media", target: "Product View", value: 6 },
            { source: "Product View", target: "Add to Cart", value: 18 },
            { source: "Product View", target: "Drop at Product View", value: 6 },
            { source: "Add to Cart", target: "Begin Checkout", value: 9 },
            { source: "Add to Cart", target: "Drop at Cart", value: 9 },
            { source: "Begin Checkout", target: "Payment Initiated", value: 9 },
            { source: "Payment Initiated", target: "Payment Completed", value: 7 },
            { source: "Payment Initiated", target: "Drop at Payment", value: 2 },
            { source: "Payment Completed", target: "Order Confirmed", value: 7 },
            { source: "Order Confirmed", target: "Retained Customer", value: 5 },
            { source: "Order Confirmed", target: "Churned Customer", value: 1 },
            { source: "Order Confirmed", target: "Returned Item", value: 1 },
            { source: "Drop at Product View", target: "No Conversion", value: 6 },
            { source: "Drop at Cart", target: "No Conversion", value: 9 },
            { source: "Drop at Payment", target: "No Conversion", value: 2 }
        ];

        // Extract unique nodes
        const nodesSet = new Set();
        csvData.forEach(d => {
            nodesSet.add(d.source);
            nodesSet.add(d.target);
        });

        const nodes = Array.from(nodesSet).map(name => ({ name }));

        // Create links - use node names directly (not indices) since we use nodeId(d => d.name)
        const links = csvData.map(d => ({
            source: d.source,
            target: d.target,
            value: +d.value,
            sourceName: d.source,
            targetName: d.target
        })).filter(d => d.value > 0);

        console.log('Nodes:', nodes);
        console.log('Links:', links);

        // Sankey generator
        const sankey = d3.sankey()
            .nodeId(d => d.name)
            .nodeWidth(18)
            .nodePadding(20)
            .extent([[0, 0], [width - margin.left - margin.right - 180, height - margin.top - margin.bottom]]);

        // Generate layout
        const graph = sankey({
            nodes: nodes.map(d => Object.assign({}, d)),
            links: links.map(d => Object.assign({}, d))
        });

        console.log('Graph generated:', graph);

        // Calculate inflow/outflow
        graph.nodes.forEach(node => {
            node.inflow = d3.sum(graph.links.filter(l => l.target === node), l => l.value);
            node.outflow = d3.sum(graph.links.filter(l => l.source === node), l => l.value);
        });

        // Draw links
        const linkGroup = chartGroup.append("g")
            .attr("class", "links")
            .attr("fill", "none");

        const link = linkGroup.selectAll(".link")
            .data(graph.links)
            .enter()
            .append("path")
            .attr("class", "link")
            .attr("d", d3.sankeyLinkHorizontal())
            .attr("stroke", d => getLinkColor(d.sourceName, d.targetName))
            .attr("stroke-width", d => Math.max(1, d.width))
            .attr("stroke-opacity", 0.55)
            .style("mix-blend-mode", "multiply");

        // Link hover
        link.on("mouseover", function (event, d) {
            d3.select(this).raise().attr("stroke-opacity", 0.85);
            tooltip.classed("hidden", false)
                .style("left", (event.pageX + 12) + "px")
                .style("top", (event.pageY - 12) + "px")
                .html(`<strong>${d.sourceName}</strong> → <strong>${d.targetName}</strong><br/>Customers: <span class="value">${formatNumber(d.value * 1000)}</span>`);
        })
            .on("mousemove", function (event) {
                tooltip.style("left", (event.pageX + 12) + "px").style("top", (event.pageY - 12) + "px");
            })
            .on("mouseout", function () {
                d3.select(this).attr("stroke-opacity", 0.55);
                tooltip.classed("hidden", true);
            });

        // Draw nodes
        const node = chartGroup.append("g")
            .attr("class", "nodes")
            .selectAll(".node")
            .data(graph.nodes)
            .enter()
            .append("g")
            .attr("class", "node");

        node.append("rect")
            .attr("x", d => d.x0)
            .attr("y", d => d.y0)
            .attr("height", d => Math.max(1, d.y1 - d.y0))
            .attr("width", d => d.x1 - d.x0)
            .attr("fill", d => nodeColors[d.name] || "#999")
            .attr("stroke", "#333")
            .attr("stroke-width", 0.5)
            .attr("rx", 2)
            .attr("ry", 2);

        node.append("text")
            .attr("x", d => d.x1 + 6)
            .attr("y", d => (d.y1 + d.y0) / 2)
            .attr("dy", "0.35em")
            .attr("text-anchor", "start")
            .text(d => d.name)
            .style("font-size", "13px")
            .style("font-weight", "500")
            .style("fill", "#333");

        // Node hover
        node.on("mouseover", function (event, d) {
            link.attr("stroke-opacity", l => (l.source === d || l.target === d) ? 0.85 : 0.1);
            node.selectAll("rect").attr("opacity", n =>
                (n === d || graph.links.some(l => (l.source === d && l.target === n) || (l.target === d && l.source === n))) ? 1 : 0.2
            );
            tooltip.classed("hidden", false)
                .style("left", (event.pageX + 12) + "px")
                .style("top", (event.pageY - 12) + "px")
                .html(`<strong>${d.name}</strong><br/>Total Inflow: <span class="value">${formatNumber(d.inflow * 1000)}</span><br/>Total Outflow: <span class="value">${formatNumber(d.outflow * 1000)}</span>`);
        })
            .on("mousemove", function (event) {
                tooltip.style("left", (event.pageX + 12) + "px").style("top", (event.pageY - 12) + "px");
            })
            .on("mouseout", function () {
                link.attr("stroke-opacity", 0.55);
                node.selectAll("rect").attr("opacity", 1);
                tooltip.classed("hidden", true);
            });

        // Legend - vertical on right side
        const legendData = [
            { label: "Acquisition Channels", color: "#3B82F6" },
            { label: "Funnel Stages", color: "#A0A0A0" },
            { label: "Success Outcomes", color: "#2CA02C" },
            { label: "Drop-off Points", color: "#D62728" },
            { label: "Churn/Returns", color: "#FFA500" }
        ];

        const legendX = width - margin.right + 20;
        const legendY = margin.top + 20;

        const legend = svg.append("g")
            .attr("class", "legend")
            .attr("transform", `translate(${legendX - 60}, ${legendY - 60})`);

        const legendItems = legend.selectAll(".legend-item")
            .data(legendData)
            .enter()
            .append("g")
            .attr("class", "legend-item")
            .attr("transform", (d, i) => `translate(0, ${i * 28})`);

        legendItems.append("rect")
            .attr("width", 18)
            .attr("height", 18)
            .attr("rx", 3)
            .attr("fill", d => d.color);

        legendItems.append("text")
            .attr("x", 24)
            .attr("y", 14)
            .style("font-size", "13px")
            .style("font-weight", "500")
            .style("fill", "#333")
            .text(d => d.label);

        console.log('Sankey diagram rendered successfully!');

    } catch (error) {
        console.error('Error rendering Sankey:', error);
        document.getElementById('sankey-chart').innerHTML = `<p style="color:red;padding:20px;font-size:14px;">Error: ${error.message}<br><br>Stack: ${error.stack}</p>`;
    }
})();

(function () {
    // Stacked Bar Chart for EcoWear Monthly Sales

    const outerWidth = 1335;
    const outerHeight = 400;
    const margin = { top: 40, right: 140, bottom: 60, left: 60 };
    const width = outerWidth - margin.left - margin.right;
    const height = outerHeight - margin.top - margin.bottom;

    // Create SVG
    const svg = d3.select('#bar-chart')
        .append('svg')
        .attr('width', outerWidth)
        .attr('height', outerHeight)
        .append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);

    // Tooltip
    const tooltip = d3.select('#tooltip');

    // Month order for proper sorting
    const monthOrder = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];

    // Load and process data
    d3.csv('4/EcoWear_Monthly_Sales.csv').then(data => {
        // Parse sales as numbers
        data.forEach(d => {
            d.Sales = +d.Sales;
        });

        // Aggregate sales by month and product (sum across all customer segments)
        const aggregated = d3.rollup(
            data,
            v => d3.sum(v, d => d.Sales),
            d => d.Month,
            d => d.Product
        );

        // Transform to array format suitable for stacking
        const products = ['Winter Jacket', 'Rain Boots', 'Sunglasses'];
        const processedData = monthOrder.map(month => {
            const monthData = { month: month };
            products.forEach(product => {
                monthData[product] = aggregated.get(month)?.get(product) || 0;
            });
            return monthData;
        });

        // Create scales
        const x = d3.scaleBand()
            .domain(monthOrder)
            .range([0, width])
            .padding(0.3);

        const maxY = d3.max(processedData, d =>
            products.reduce((sum, product) => sum + d[product], 0)
        );

        const y = d3.scaleLinear()
            .domain([0, maxY])
            .nice()
            .range([height, 0]);

        // Color scale - EcoWear palette for product colors
        const barColorMap = {
            'Winter Jacket': '#66c2a5',
            'Rain Boots': '#fc8d62',
            'Sunglasses': '#8da0cb'
        };
        const color = d3.scaleOrdinal()
            .domain(products)
            .range(products.map(p => barColorMap[p] || '#999'));

        // Stack generator
        const stack = d3.stack()
            .keys(products);

        const stackedData = stack(processedData);

        // Draw bars
        const barGroups = svg.selectAll('.bar-group')
            .data(stackedData)
            .enter()
            .append('g')
            .attr('class', 'bar-group')
            .attr('fill', d => color(d.key));

        barGroups.selectAll('rect')
            .data(d => d)
            .enter()
            .append('rect')
            .attr('x', d => x(d.data.month))
            .attr('y', d => y(d[1]))
            .attr('height', d => y(d[0]) - y(d[1]))
            .attr('width', x.bandwidth())
            .attr('class', 'bar-segment')
            .on('mouseover', function (event, d) {
                d3.select(this).attr('opacity', 0.8);

                const product = d3.select(this.parentNode).datum().key;
                const sales = d[1] - d[0];
                const month = d.data.month;

                tooltip
                    .html(`
                    <strong>Month:</strong> ${month}<br/>
                    <strong>Product:</strong> ${product}<br/>
                    <strong>Sales:</strong> ${sales.toFixed(1)}k units
                `)
                    .style('left', (event.pageX + 10) + 'px')
                    .style('top', (event.pageY - 10) + 'px')
                    .classed('hidden', false);
            })
            .on('mouseout', function () {
                d3.select(this).attr('opacity', 1);
                tooltip.classed('hidden', true);
            });

        // Add X axis
        svg.append('g')
            .attr('class', 'x-axis')
            .attr('transform', `translate(0,${height})`)
            .call(d3.axisBottom(x))
            .selectAll('text')
            .attr('transform', 'rotate(-45)')
            .style('text-anchor', 'end')
            .style('font-size', '13px')
            .attr('dx', '-.8em')
            .attr('dy', '.15em');

        // Add Y axis
        svg.append('g')
            .attr('class', 'y-axis')
            .call(d3.axisLeft(y).ticks(8));

        // Y axis label
        svg.append('text')
            .attr('class', 'y-axis-label')
            .attr('transform', 'rotate(-90)')
            .attr('y', -margin.left + 15)
            .attr('x', -height / 2)
            .attr('text-anchor', 'middle')
            .style('font-size', '13px')
            .style('font-weight', '500')
            .text('Sales (thousands of units)');

        // Legend
        const legend = svg.append('g')
            .attr('class', 'legend')
            .attr('transform', `translate(${width + 20}, 0)`);

        const legendItems = legend.selectAll('.legend-item')
            .data(products)
            .enter()
            .append('g')
            .attr('class', 'legend-item')
            .attr('transform', (d, i) => `translate(0, ${i * 28})`);

        legendItems.append('rect')
            .attr('width', 18)
            .attr('height', 18)
            .attr('fill', d => color(d))
            .attr('rx', 3);

        legendItems.append('text')
            .attr('x', 24)
            .attr('y', 14)
            .text(d => d)
            .style('font-size', '13px')
            .style('font-weight', '500')
            .attr('fill', '#333');

    }).catch(error => console.error('Error loading data:', error));
})();

