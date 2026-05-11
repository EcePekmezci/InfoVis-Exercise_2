let scatterWidth = 500;
let scatterHeight = 500;
let scatterMargin = { top: 20, right: 20, bottom: 50, left: 60 };
let scatterSvg = null;
let xScale = null;
let yScale = null;

function initScatterplot(pcaData) {

    let innerWidth = scatterWidth - scatterMargin.left - scatterMargin.right;
    let innerHeight = scatterHeight - scatterMargin.top - scatterMargin.bottom;

    scatterSvg = d3.select("#svg_plot")
        .attr("width", scatterWidth)
        .attr("height", scatterHeight)
        .append("g")
        .attr("transform", `translate(${scatterMargin.left}, ${scatterMargin.top})`);

    // scales
    xScale = d3.scaleLinear()
        .domain(d3.extent(pcaData, d => d.pc1)).nice()
        .range([0, innerWidth]);

    yScale = d3.scaleLinear()
        .domain(d3.extent(pcaData, d => d.pc2)).nice()
        .range([innerHeight, 0]);

    // axes
    scatterSvg.append("g")
        .attr("transform", `translate(0, ${innerHeight})`)
        .call(d3.axisBottom(xScale));

    scatterSvg.append("g")
        .call(d3.axisLeft(yScale));

    // axis labels
    scatterSvg.append("text")
        .attr("x", innerWidth / 2)
        .attr("y", innerHeight + 40)
        .attr("text-anchor", "middle")
        .text("PC1");

    scatterSvg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("x", -innerHeight / 2)
        .attr("y", -45)
        .attr("text-anchor", "middle")
        .text("PC2");

    // dots
    scatterSvg.selectAll("circle")
        .data(pcaData, d => d.country)
        .enter()
        .append("circle")
        .attr("cx", d => xScale(d.pc1))
        .attr("cy", d => yScale(d.pc2))
        .attr("r", 5)
        .attr("fill", "steelblue")
        .attr("opacity", 0.8);

    // country labels
    scatterSvg.selectAll(".country-label")
        .data(pcaData, d => d.country)
        .enter()
        .append("text")
        .attr("class", "country-label")
        .attr("x", d => xScale(d.pc1) + 7)
        .attr("y", d => yScale(d.pc2) + 4)
        .style("font-size", "9px")
        .text(d => d.country);
}