// ------------------ D3.js FAFSA Visualization Script ------------------ //

// Create Global Tooltip
const tooltip = d3.select("body")
  .append("div")
  .attr("class", "tooltip")
  .style("opacity", 0);

// Your existing chart functions: createBarChart, createHistogram, etc. here...
// (Already implemented above)

// ------------------ 6. CHOROPLETH MAP: FAFSA by State ------------------ //
function createChoroplethMap(data, quarter) {
  d3.select("#viz6").html("");

  const width = 800;
  const height = 500;

  const svg = d3.select("#viz6")
    .append("svg")
    .attr("width", width)
    .attr("height", height);

  const projection = d3.geoAlbersUsa().translate([width / 2, height / 2]).scale(1000);
  const path = d3.geoPath().projection(projection);

  const totals = d3.rollup(
    data,
    v => d3.sum(v, d => +d[`Quarterly Total_${quarter}`]),
    d => d.State
  );

  const color = d3.scaleQuantize()
    .domain([0, d3.max(Array.from(totals.values()))])
    .range(d3.schemeBlues[7]);

  d3.json("https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json").then(us => {
    const states = topojson.feature(us, us.objects.states).features;

    svg.selectAll("path")
      .data(states)
      .join("path")
      .attr("d", path)
      .attr("fill", d => {
        const stateName = nameFromId(d.id);
        const val = totals.get(stateName);
        return val ? color(val) : "#ddd";
      })
      .attr("stroke", "#fff")
      .on("mouseover", (event, d) => {
        const stateName = nameFromId(d.id);
        const val = totals.get(stateName) || 0;
        tooltip.transition().duration(200).style("opacity", 0.9);
        tooltip.html(`<strong>${stateName}</strong><br>${val.toLocaleString()} FAFSA apps`)
          .style("left", (event.pageX + 10) + "px")
          .style("top", (event.pageY - 28) + "px");
      })
      .on("mouseout", () => tooltip.transition().duration(300).style("opacity", 0));
  });
}

// Helper to map US state ID to state name
function nameFromId(id) {
  const statesMap = {
    1: "Alabama", 2: "Alaska", 4: "Arizona", 5: "Arkansas", 6: "California", 8: "Colorado",
    9: "Connecticut", 10: "Delaware", 11: "District of Columbia", 12: "Florida", 13: "Georgia",
    15: "Hawaii", 16: "Idaho", 17: "Illinois", 18: "Indiana", 19: "Iowa", 20: "Kansas", 21: "Kentucky",
    22: "Louisiana", 23: "Maine", 24: "Maryland", 25: "Massachusetts", 26: "Michigan", 27: "Minnesota",
    28: "Mississippi", 29: "Missouri", 30: "Montana", 31: "Nebraska", 32: "Nevada", 33: "New Hampshire",
    34: "New Jersey", 35: "New Mexico", 36: "New York", 37: "North Carolina", 38: "North Dakota",
    39: "Ohio", 40: "Oklahoma", 41: "Oregon", 42: "Pennsylvania", 44: "Rhode Island", 45: "South Carolina",
    46: "South Dakota", 47: "Tennessee", 48: "Texas", 49: "Utah", 50: "Vermont", 51: "Virginia",
    53: "Washington", 54: "West Virginia", 55: "Wisconsin", 56: "Wyoming"
  };
  return statesMap[id];
}

// ------------------ QUARTER SWITCH + INITIAL LOAD ------------------ //
d3.selectAll(".tab-button").on("click", function () {
  const quarter = d3.select(this).attr("data-quarter");
  d3.selectAll(".tab-button").classed("active", false);
  d3.select(this).classed("active", true);

  d3.csv("cleaned.csv").then(data => {
    createBarChart(data, quarter);
    createHistogram(data, quarter);
    createScatterPlot(data, quarter);
    createScatterByType(data, quarter);
    createChoroplethMap(data, quarter);
  });
});

// Initial load
const defaultQuarter = "Q1";
d3.csv("cleaned.csv").then(data => {
  createBarChart(data, defaultQuarter);
  createHistogram(data, defaultQuarter);
  createScatterPlot(data, defaultQuarter);
  createScatterByType(data, defaultQuarter);
  createChoroplethMap(data, defaultQuarter);
});
