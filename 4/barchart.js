// Stacked bar chart for monthly sales (D3 v7)

const margin = {top: 40, right: 20, bottom: 60, left: 60};
const width = 900 - margin.left - margin.right;
const height = 500 - margin.top - margin.bottom;

const svg = d3.select('#chart').append('svg')
	.attr('width', width + margin.left + margin.right)
	.attr('height', height + margin.top + margin.bottom)
	.append('g')
	.attr('transform', `translate(${margin.left},${margin.top})`);

const tooltip = d3.select('#tooltip')
	.style('position', 'absolute')
	.style('pointer-events', 'none')
	.attr('class', 'tooltip hidden');

d3.csv('EcoWear_Monthly_Sales.csv', d => ({
	Month: d.Month,
	Product: d.Product,
	Sales: +d.Sales
})).then(raw => {
	const monthsOrder = ['January','February','March','April','May','June','July','August','September','October','November','December'];
	const products = Array.from(new Set(raw.map(d => d.Product)));

	// aggregate across customer segments: rollup by Month and Product
	const roll = d3.rollup(raw, v => d3.sum(v, d => d.Sales), d => d.Month, d => d.Product);

	// build data array for stack
	const data = monthsOrder.map(m => {
		const obj = {Month: m};
		products.forEach(p => {
			const v = (roll.get(m) && roll.get(m).get(p)) ? roll.get(m).get(p) : 0;
			obj[p] = v;
		});
		return obj;
	});

	const stackGen = d3.stack().keys(products);
	const series = stackGen(data);

	const x = d3.scaleBand()
		.domain(monthsOrder)
		.range([0, width])
		.padding(0.1);

	const y = d3.scaleLinear()
		.domain([0, d3.max(data, d => products.reduce((s,p)=> s + d[p], 0))])
		.nice()
		.range([height, 0]);

	const color = d3.scaleOrdinal()
		.domain(products)
		.range(d3.schemeSet2);

	// axes
	svg.append('g')
		.attr('class', 'x-axis')
		.attr('transform', `translate(0,${height})`)
		.call(d3.axisBottom(x))
		.selectAll('text')
		.attr('transform', 'rotate(-40)')
		.style('text-anchor', 'end');

	svg.append('g')
		.attr('class', 'y-axis')
		.call(d3.axisLeft(y));

	// draw bars
	svg.selectAll('.series')
		.data(series)
		.enter()
		.append('g')
		.attr('fill', d => color(d.key))
		.selectAll('rect')
		.data(d => d)
		.enter()
		.append('rect')
		.attr('x', d => x(d.data.Month))
		.attr('y', d => y(d[1]))
		.attr('height', d => y(d[0]) - y(d[1]))
		.attr('width', x.bandwidth())
		.on('mousemove', (event, d) => {
			const product = d3.select(event.currentTarget.parentNode).datum().key;
			const value = d.data[product];
			tooltip
				.style('left', (event.pageX + 12) + 'px')
				.style('top', (event.pageY + 12) + 'px')
				.html(`<strong>Month:</strong> ${d.data.Month}<br/><strong>Product:</strong> ${product}<br/><strong>Sales:</strong> ${value}k`)
				.classed('hidden', false);
		})
		.on('mouseover', function () { d3.select(this).attr('opacity', 0.8); })
		.on('mouseout', function () { tooltip.classed('hidden', true); d3.select(this).attr('opacity', 1); });

	// legend
	const legend = d3.select('#legend')
		.append('svg')
		.attr('width', 500)
		.attr('height', 40);

	const item = legend.selectAll('.item')
		.data(products)
		.enter()
		.append('g')
		.attr('transform', (d,i) => `translate(${i*160},10)`);

	item.append('rect')
		.attr('width', 18)
		.attr('height', 18)
		.attr('fill', d => color(d));

	item.append('text')
		.attr('x', 24)
		.attr('y', 14)
		.text(d => d)
		.style('font-size', '12px');

}).catch(err => console.error(err));

