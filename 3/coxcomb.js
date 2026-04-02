// Stacked Coxcomb chart (D3 v7)

const width = 800;
const height = 600;
const margin = { top: 50, right: 50, bottom: 80, left: 50 };
const innerWidth = width - margin.left - margin.right;
const innerHeight = height - margin.top - margin.bottom;
const centerX = width / 2;
const centerY = height / 2;
const maxOuterRadius = Math.min(innerWidth, innerHeight) / 1.7;
const radius = maxOuterRadius * 0.98; // 82% of available space for consistent sizing with radar

const svg = d3.select('#chart')
	.append('svg')
	.attr('width', '100%')
	.attr('height', '600px')
	.attr('viewBox', `0 0 ${width} ${height}`)
	.attr('preserveAspectRatio', 'xMidYMid meet');

const g = svg.append('g')
	.attr('transform', `translate(${centerX}, ${centerY})`); // Perfectly centered

const tooltip = d3.select('#tooltip')
	.style('position', 'absolute')
	.style('pointer-events', 'none')
	.attr('class', 'tooltip hidden');

// load data
d3.csv('EcoWear_Product_Sales.csv', d => ({
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
		.range([0, radius]);

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
			return Math.cos(angle) * (radius + 5);
		})
		.attr('y', (d, i) => {
			const angle = (i + 0.5) * anglePer - Math.PI / 2;
			return Math.sin(angle) * (radius + 5);
		})
		.attr('text-anchor', 'middle')
		.attr('alignment-baseline', 'middle')
		.text(d => d.segment)
		.style('font-size', '15px');

	// Legend (vertical, top left inside SVG)
	const legendGroup = svg.append('g')
		.attr('class', 'legend')
		.attr('transform', `translate(${margin.left + 20}, ${margin.top + 10})`);

	const legendItem = legendGroup.selectAll('.legendItem')
		.data(products)
		.enter()
		.append('g')
		.attr('class', 'legendItem')
		.attr('transform', (d, i) => `translate(0, ${i * 22})`);

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
		.style('font-weight', '400')
		.attr('fill', '#333');

}).catch(err => console.error(err));

