// Debug wrapper
try {
    console.log('D3 loaded:', typeof d3);
    console.log('D3.sankey available:', typeof d3.sankey);
    console.log('D3.sankeyLinkHorizontal available:', typeof d3.sankeyLinkHorizontal);

    if (typeof d3.sankey === 'undefined') {
        throw new Error('d3.sankey is not defined - library not loaded correctly');
    }

    // Dimensions - increased width, added space for legend
    const width = 1400;
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

    // Create SVG
    const svg = d3.select("#chart")
        .append("svg")
        .attr("width", width)
        .attr("height", height);

    const chartGroup = svg.append("g")
        .attr("transform", `translate(${margin.left}, ${margin.top})`);

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
    link.on("mouseover", function(event, d) {
        d3.select(this).raise().attr("stroke-opacity", 0.85);
        tooltip.classed("hidden", false)
            .style("left", (event.pageX + 12) + "px")
            .style("top", (event.pageY - 12) + "px")
            .html(`<strong>${d.sourceName}</strong> → <strong>${d.targetName}</strong><br/>Customers: <span class="value">${formatNumber(d.value * 1000)}</span>`);
    })
    .on("mousemove", function(event) {
        tooltip.style("left", (event.pageX + 12) + "px").style("top", (event.pageY - 12) + "px");
    })
    .on("mouseout", function() {
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
        .style("font-size", "11px")
        .style("font-weight", "500")
        .style("fill", "#333");

    // Node hover
    node.on("mouseover", function(event, d) {
        link.attr("stroke-opacity", l => (l.source === d || l.target === d) ? 0.85 : 0.1);
        node.selectAll("rect").attr("opacity", n => 
            (n === d || graph.links.some(l => (l.source === d && l.target === n) || (l.target === d && l.source === n))) ? 1 : 0.2
        );
        tooltip.classed("hidden", false)
            .style("left", (event.pageX + 12) + "px")
            .style("top", (event.pageY - 12) + "px")
            .html(`<strong>${d.name}</strong><br/>Total Inflow: <span class="value">${formatNumber(d.inflow * 1000)}</span><br/>Total Outflow: <span class="value">${formatNumber(d.outflow * 1000)}</span>`);
    })
    .on("mousemove", function(event) {
        tooltip.style("left", (event.pageX + 12) + "px").style("top", (event.pageY - 12) + "px");
    })
    .on("mouseout", function() {
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
        .attr("transform", `translate(${legendX}, ${legendY})`);

    legend.append("text")
        .attr("x", 0)
        .attr("y", -10)
        .style("font-size", "13px")
        .style("font-weight", "600")
        .style("fill", "#333");

    const legendItems = legend.selectAll(".legend-item")
        .data(legendData)
        .enter()
        .append("g")
        .attr("class", "legend-item")
        .attr("transform", (d, i) => `translate(0, ${i * 28 })`);

    legendItems.append("rect")
        .attr("width", 16)
        .attr("height", 16)
        .attr("rx", 2)
        .attr("fill", d => d.color);

    legendItems.append("text")
        .attr("x", 22)
        .attr("y", 12)
        .style("font-size", "11px")
        .style("fill", "#444")
        .text(d => d.label);

    console.log('Sankey diagram rendered successfully!');

} catch (error) {
    console.error('Error rendering Sankey:', error);
    document.getElementById('chart').innerHTML = `<p style="color:red;padding:20px;font-size:14px;">Error: ${error.message}<br><br>Stack: ${error.stack}</p>`;
}
