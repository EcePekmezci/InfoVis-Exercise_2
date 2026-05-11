let mapWidth = 800;
let mapHeight = 500;
let map = null;
let mapData = null;

const skipCols = new Set([
    "Country Name", "Country Code", "year",
    "Land area (sq. km)", "Surface area (sq. km)"
]);

const DETAIL_INDICATORS = [
    "Employment in agriculture (% of total employment) (modeled ILO estimate)",
    "Employment in agriculture, female (% of female employment) (modeled ILO estimate)",
    "Employment in agriculture, male (% of male employment) (modeled ILO estimate)",
    "Agricultural nitrous oxide emissions (thousand metric tons of CO2 equivalent)",
    "Agricultural methane emissions (thousand metric tons of CO2 equivalent)",
    "Rural population",
    "Rural population (% of total population)",
    "Population, total"
];

let selectedYear = 2019;
let selectedIndicator = "Employment in agriculture (% of total employment) (modeled ILO estimate)";

function getIndicators() {
    return Object.keys(data[0]).filter(k => !skipCols.has(k));
}

function getColorScale() {
    const values = data
        .filter(r => r["year"] === selectedYear)
        .map(r => r[selectedIndicator])
        .filter(v => v != null && !isNaN(v));

    return d3.scaleSequential()
        .domain([d3.min(values), d3.max(values)])
        .interpolator(d3.interpolateYlGn);
}

function initMap() {
    const indicators = getIndicators();
    const dropdown = d3.select("#indicator_change");

    dropdown.selectAll("option")
        .data(indicators)
        .enter()
        .append("option")
        .attr("value", d => d)
        .text(d => d)
        .property("selected", d => d === selectedIndicator);

    dropdown.on("change", function() {
        selectedIndicator = this.value;
        updateMap();
    });

    d3.json("../static/data/world-topo.json").then(function(countries) {

        let projection = d3.geoEqualEarth()
            .scale(180)
            .translate([mapWidth / 2, mapHeight / 2]);

        let path = d3.geoPath().projection(projection);

        let svg = d3.select("#svg_map")
            .attr("width", mapWidth)
            .attr("height", mapHeight);

        mapData = topojson.feature(countries, countries.objects.countries).features;

        map = svg.append("g")
            .selectAll("path")
            .data(mapData)
            .enter().append("path")
            .attr("d", path)
            .attr("stroke", "black")
            .attr("stroke-width", 0.5)
            .attr("fill", "white");

        // Tooltip
        const tooltip = d3.select("body")
            .append("div")
            .attr("class", "tooltip")
            .style("opacity", 0);

        // Hover events
        map.on("mouseover", function(event, d) {
                const code = d.properties.id;
                const name = d.properties.admin;
                const yearData = data.filter(r => r["year"] === selectedYear);
                const row = yearData.find(r => r["Country Code"] === code);

                d3.select(this)
                    .attr("stroke-width", 2)
                    .attr("stroke", "red")
                    .attr("fill", "red");

                let html = `<strong style="font-size:13px">${name}</strong><br><br>`;
                if (row) {
                    DETAIL_INDICATORS.forEach(ind => {
                        const val = row[ind];
                        const displayVal = (val != null && !isNaN(val)) ? Number(val).toFixed(2) : "No data";
                        html += `<span style="font-size:11px"><b>${ind}:</b> ${displayVal}</span><br>`;
                    });
                } else {
                    html += "No data available";
                }

                tooltip
                    .style("opacity", 1)
                    .style("width", "320px")
                    .style("height", "auto")
                    .html(html)
                    .style("left", (event.pageX + 15) + "px")
                    .style("top", (event.pageY - 10) + "px");
            })
            .on("mousemove", function(event) {
                tooltip
                    .style("left", (event.pageX + 15) + "px")
                    .style("top", (event.pageY - 10) + "px");
            })
            .on("mouseout", function(event, d) {
                const code = d.properties.id;
                const yearData = data.filter(r => r["year"] === selectedYear);
                const row = yearData.find(r => r["Country Code"] === code);
                const val = row ? row[selectedIndicator] : null;
                const colorScale = getColorScale();

                d3.select(this)
                    .attr("stroke-width", 0.5)
                    .attr("stroke", "black")
                    .attr("fill", (val != null && !isNaN(val)) ? colorScale(val) : "white");

                tooltip.style("opacity", 0);
            });

        updateMap();
    });
}

function updateMap() {
    const yearData = data.filter(d => d["year"] === selectedYear);

    const valueByCode = {};
    yearData.forEach(d => {
        valueByCode[d["Country Code"]] = d[selectedIndicator];
    });

    const colorScale = getColorScale();

    map.attr("fill", d => {
        const code = d.properties.id;
        const val = valueByCode[code];
        if (val == null || isNaN(val)) return "white";
        return colorScale(val);
    });
}