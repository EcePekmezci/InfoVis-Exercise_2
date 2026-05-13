let scatterWidth = 500;
let scatterHeight = 500;
let scatterMargin = { top: 20, right: 20, bottom: 50, left: 60 };

let scatterSvg = null;
let xScale = null;
let yScale = null;

let brushActive = false;

function initScatterplot(pcaData) {
    let innerWidth = scatterWidth - scatterMargin.left - scatterMargin.right;
    let innerHeight = scatterHeight - scatterMargin.top - scatterMargin.bottom;

    scatterSvg = d3.select("#svg_plot")
        .attr("width", scatterWidth)
        .attr("height", scatterHeight)
        .append("g")
        .attr("transform", `translate(${scatterMargin.left}, ${scatterMargin.top})`);

    xScale = d3.scaleLinear()
        .domain(d3.extent(pcaData, d => d.pc1))
        .nice()
        .range([0, innerWidth]);

    yScale = d3.scaleLinear()
        .domain(d3.extent(pcaData, d => d.pc2))
        .nice()
        .range([innerHeight, 0]);

    scatterSvg.append("g")
        .attr("transform", `translate(0, ${innerHeight})`)
        .call(d3.axisBottom(xScale));

    scatterSvg.append("g")
        .call(d3.axisLeft(yScale));

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

    scatterSvg.selectAll("circle")
        .data(pcaData, d => d.country)
        .enter()
        .append("circle")
        .attr("class", d => "scatter-dot country-" + d.code)
        .attr("cx", d => xScale(d.pc1))
        .attr("cy", d => yScale(d.pc2))
        .attr("r", 5)
        .attr("fill", d => getCountryColor(d.code))
        .attr("opacity", 0.8)
        .on("mouseover", function(event, d) {
            d3.select(this)
                .attr("r", 9)
                .attr("fill", "red");

            d3.select(".map-country.country-" + d.code)
                .attr("stroke-width", 2)
                .attr("stroke", "red")
                .attr("fill", "red");
        })
        .on("mouseout", function(event, d) {
            if (!brushActive) {
                d3.select(this)
                    .attr("r", 5)
                    .attr("fill", getCountryColor(d.code));
                    

                resetMapCountry(d.code);
            }
        });

    const brush = d3.brush()
        .extent([[0, 0], [innerWidth, innerHeight]])
        .on("end", brushed);

    scatterSvg.append("g")
        .attr("class", "brush")
        .call(brush);

    scatterSvg.selectAll(".scatter-dot").raise();

    function brushed(event) {
        if (!event.selection) {
            brushActive = false;
            selectedCountries = [];
            selectedCountry = null;

            d3.selectAll(".scatter-dot")
                .attr("fill", d => getCountryColor(d.code))
                .attr("r", 5);

            d3.selectAll(".map-country")
                .attr("stroke", "black")
                .attr("stroke-width", 0.5);

            updateMap();
            updateLineplot();

            return;
        }

        brushActive = true;

        const [[x0, y0], [x1, y1]] = event.selection;

        selectedCountries = pcaData
            .filter(d => {
                const x = xScale(d.pc1);
                const y = yScale(d.pc2);

                return x0 <= x && x <= x1 &&
                       y0 <= y && y <= y1;
            })
            .map(d => d.country);

        updateLineplot();

        scatterSvg.selectAll(".scatter-dot")
            .attr("fill", function(d) {
                const x = xScale(d.pc1);
                const y = yScale(d.pc2);

                const selected =
                    x0 <= x && x <= x1 &&
                    y0 <= y && y <= y1;

                if (selected) {
                    d3.select(".map-country.country-" + d.code)
                        .attr("stroke", "red")
                        .attr("stroke-width", 2)
                        .attr("fill", "red");

                    return "red";
                }

                resetMapCountry(d.code);
                return getCountryColor(d.code);
            })
            .attr("r", function(d) {
                const x = xScale(d.pc1);
                const y = yScale(d.pc2);

                const selected =
                    x0 <= x && x <= x1 &&
                    y0 <= y && y <= y1;

                return selected ? 8 : 5;
            });
    }
}

function updateScatterplotColors() {
    if (brushActive) return;

    d3.selectAll(".scatter-dot")
        .attr("fill", d => getCountryColor(d.code));
}
