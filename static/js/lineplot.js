let lineWidth = 900;
let lineHeight = 300;
let lineMargin = { top: 40, right: 130, bottom: 50, left: 70 };
let lineSvg = null;

function initLineplot() {
    lineSvg = d3.select("#svg_line_plot")
        .append("svg")
        .attr("width", lineWidth)
        .attr("height", lineHeight);

    updateLineplot();
}

function updateLineplot() {
    lineSvg.selectAll("*").remove();

    const countriesToShow =
        selectedCountries.length > 0
            ? selectedCountries
            : selectedCountry
                ? [selectedCountry]
                : [];

    if (countriesToShow.length === 0) {
        lineSvg.append("text")
            .attr("x", 30)
            .attr("y", 50)
            .text("Click a country or brush countries in the scatterplot.");
        return;
    }

    const innerWidth = lineWidth - lineMargin.left - lineMargin.right;
    const innerHeight = lineHeight - lineMargin.top - lineMargin.bottom;

    const rows = data
        .filter(d =>
            countriesToShow.includes(d["Country Name"]) &&
            d[selectedIndicator] != null &&
            !isNaN(d[selectedIndicator])
        )
        .map(d => ({
            country: d["Country Name"],
            year: +d.year,
            value: +d[selectedIndicator]
        }))
        .sort((a, b) => a.year - b.year);

    if (rows.length === 0) {
        lineSvg.append("text")
            .attr("x", 30)
            .attr("y", 50)
            .text("No data available for this selection and indicator.");
        return;
    }

    const g = lineSvg.append("g")
        .attr("transform", `translate(${lineMargin.left},${lineMargin.top})`);

    const x = d3.scaleLinear()
        .domain([1960, 2020])
        .range([0, innerWidth]);

    const y = d3.scaleLinear()
        .domain(d3.extent(rows, d => d.value))
        .nice()
        .range([innerHeight, 0]);

    g.append("g")
        .attr("transform", `translate(0,${innerHeight})`)
        .call(d3.axisBottom(x).tickFormat(d3.format("d")));

    g.append("g")
        .call(d3.axisLeft(y));

    const line = d3.line()
        .x(d => x(d.year))
        .y(d => y(d.value));

    const grouped = d3.group(rows, d => d.country);
    const color = d3.scaleOrdinal(d3.schemeCategory10);

    g.selectAll(".line")
        .data(grouped)
        .enter()
        .append("path")
        .attr("class", "line")
        .attr("fill", "none")
        .attr("stroke", d => color(d[0]))
        .attr("stroke-width", 2)
        .attr("d", d => line(d[1]));

    g.append("text")
        .attr("x", innerWidth / 2)
        .attr("y", -15)
        .attr("text-anchor", "middle")
        .style("font-weight", "bold")
        .text(`${selectedIndicator} for selected countries`);

    g.append("text")
        .attr("x", innerWidth / 2)
        .attr("y", innerHeight + 40)
        .attr("text-anchor", "middle")
        .text("Year");

    const legend = g.append("g")
        .attr("transform", `translate(${innerWidth + 20}, 20)`);

    legend.selectAll("rect")
        .data(Array.from(grouped.keys()))
        .enter()
        .append("rect")
        .attr("x", 0)
        .attr("y", (d, i) => i * 18)
        .attr("width", 10)
        .attr("height", 10)
        .attr("fill", d => color(d));

    legend.selectAll("text")
        .data(Array.from(grouped.keys()))
        .enter()
        .append("text")
        .attr("x", 15)
        .attr("y", (d, i) => i * 18 + 9)
        .style("font-size", "11px")
        .text(d => d);
}
