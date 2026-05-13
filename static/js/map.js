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
        .interpolator(t => d3.interpolateYlGn(0.35 + 0.65 * t));
}

function initMap() {
    const indicators = getIndicators();
    const dropdown = d3.select("#indicator_change");
    const slider = d3.select("#year_slider");
    const yearLabel = d3.select("#year_label");

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
        updateScatterplotColors();
        updateLineplot();
        
    });
    
    slider.on("input", function() {

        selectedYear = +this.value;

        yearLabel.text(selectedYear);

        updateMap();
        updateScatterplotColors();

        if (selectedCountry) {
            updateLineplot();
        }
    
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
            .attr("class", d => "map-country country-" + d.properties.id)
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
                d3.select(".scatter-dot.country-" + code)
    		    .attr("r", 9)
    		    .attr("fill", "red");
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
                    
                d3.select(".scatter-dot.country-" + code)
    		    .attr("r", 5)
                    .attr("fill", "steelblue");

                tooltip.style("opacity", 0);
            });
            
            map.on("click", function(event, d) {
		const code = d.properties.id;
		const row = data.find(r => r["Country Code"] === code);
		
		console.log("Clicked:", code, row);

		if (row) {
		    selectCountry(row["Country Name"]);
		}
            });

        updateMap();
        updateScatterplotColors();
    });
}

function updateMap() {
    const yearData = data.filter(d => d["year"] === selectedYear);

    const valueByCode = {};
    yearData.forEach(d => {
        valueByCode[String(d["Country Code"])] = d[selectedIndicator];
    });

    const colorScale = getColorScale();

    map.attr("fill", d => {
        const code = d.properties.id;
        const val = valueByCode[code];
        if (val == null || isNaN(val)) return "white";
        return colorScale(val);
    });
}

function resetMapCountry(code) {
    const yearData = data.filter(r => r["year"] === selectedYear);
    const row = yearData.find(r => r["Country Code"] === code);
    const val = row ? row[selectedIndicator] : null;
    const colorScale = getColorScale();

    d3.select(".map-country.country-" + code)
        .attr("stroke-width", 0.5)
        .attr("stroke", "black")
        .attr("fill", (val != null && !isNaN(val)) ? colorScale(val) : "white");
}

function getCountryColor(code) {
    const yearData = data.filter(r => +r["year"] === selectedYear);
    const row = yearData.find(r => String(r["Country Code"]) === String(code));
    const val = row ? row[selectedIndicator] : null;
    const colorScale = getColorScale();

    return (val != null && !isNaN(val)) ? colorScale(val) : "white";
}
