// ------------------ D3.js FAFSA Visualization Script ------------------ //

// Create Global Tooltip
const tooltip = d3.select("body")
  .append("div")
  .attr("class", "tooltip")
  .style("opacity", 0);

// ------------------ 1. BAR PLOT: Total FAFSA by State (Overview) ------------------ //
function createBarChart(data, quarter) {
  const svg = d3.select("#viz1").html("").append("svg")
    .attr("width", 800).attr("height", 500);

  const states = Array.from(new Set(data.map(d => d.State)));

  const totals = d3.rollup(data,
    v => d3.sum(v, d => +d[`Quarterly Total_${quarter}`]),
    d => d.State
  );

  const stateData = Array.from(totals, ([State, Total]) => ({ State, Total }))
    .sort((a, b) => d3.descending(a.Total, b.Total)).slice(0, 20);

  const x = d3.scaleBand().domain(stateData.map(d => d.State)).range([50, 750]).padding(0.2);
  const y = d3.scaleLinear().domain([0, d3.max(stateData, d => d.Total)]).range([450, 50]);

  svg.selectAll("rect")
    .data(stateData)
    .enter()
    .append("rect")
    .attr("x", d => x(d.State))
    .attr("y", d => y(d.Total))
    .attr("width", x.bandwidth())
    .attr("height", d => 450 - y(d.Total))
    .attr("fill", "#007acc")
    .on("mouseover", (event, d) => {
      tooltip.style("opacity", 1).html(`<strong>${d.State}</strong>: ${d.Total.toLocaleString()}`);
    })
    .on("mousemove", (event) => {
      tooltip.style("left", (event.pageX + 10) + "px").style("top", (event.pageY - 28) + "px");
    })
    .on("mouseout", () => tooltip.style("opacity", 0));

  svg.append("g").attr("transform", "translate(0,450)").call(d3.axisBottom(x));
  svg.append("g").attr("transform", "translate(50,0)").call(d3.axisLeft(y));
}

// ------------------ 2. HISTOGRAM: Total FAFSA Apps Distribution ------------------ //
function createHistogram(data, quarter) {
  const svg = d3.select("#viz2").html("").append("svg")
    .attr("width", 800).attr("height", 400);

  const totals = data.map(d => +d[`Quarterly Total_${quarter}`]);
  const x = d3.scaleLinear().domain(d3.extent(totals)).nice().range([60, 740]);
  const bins = d3.histogram().domain(x.domain()).thresholds(x.ticks(30))(totals);
  const y = d3.scaleLinear().domain([0, d3.max(bins, d => d.length)]).nice().range([350, 40]);

  svg.selectAll("rect")
    .data(bins)
    .enter().append("rect")
    .attr("x", d => x(d.x0))
    .attr("y", d => y(d.length))
    .attr("width", d => x(d.x1) - x(d.x0) - 1)
    .attr("height", d => 350 - y(d.length))
    .attr("fill", "#00b4d8")
    .on("mouseover", (event, d) => {
      tooltip.style("opacity", 1).html(`${d.length} schools<br>(${Math.round(d.x0)} – ${Math.round(d.x1)})`);
    })
    .on("mousemove", (event) => {
      tooltip.style("left", (event.pageX + 10) + "px").style("top", (event.pageY - 28) + "px");
    })
    .on("mouseout", () => tooltip.style("opacity", 0));

  svg.append("g").attr("transform", "translate(0,350)").call(d3.axisBottom(x));
  svg.append("g").attr("transform", "translate(60,0)").call(d3.axisLeft(y));
}

// ------------------ 3. SCATTER PLOT: Dependent vs. Independent ------------------ //
function createScatterPlot(data, quarter) {
  const svg = d3.select("#viz3").html("").append("svg")
    .attr("width", 800).attr("height", 450);

  const x = d3.scaleLinear().domain([0, d3.max(data, d => +d[`Dependent Students_${quarter}`])]).nice().range([50, 740]);
  const y = d3.scaleLinear().domain([0, d3.max(data, d => +d[`Independent Students_${quarter}`])]).nice().range([400, 40]);

  svg.selectAll("circle")
    .data(data)
    .enter().append("circle")
    .attr("cx", d => x(+d[`Dependent Students_${quarter}`]))
    .attr("cy", d => y(+d[`Independent Students_${quarter}`]))
    .attr("r", 3)
    .attr("fill", "#007acc")
    .on("mouseover", (event, d) => {
      tooltip.style("opacity", 1).html(`<strong>${d.School}</strong><br>Dep: ${d[`Dependent Students_${quarter}`]}<br>Ind: ${d[`Independent Students_${quarter}`]}`);
    })
    .on("mousemove", (event) => {
      tooltip.style("left", (event.pageX + 10) + "px").style("top", (event.pageY - 28) + "px");
    })
    .on("mouseout", () => tooltip.style("opacity", 0));

  svg.append("g").attr("transform", "translate(0,400)").call(d3.axisBottom(x));
  svg.append("g").attr("transform", "translate(50,0)").call(d3.axisLeft(y));
}

// ------------------ 4. SCATTER PLOT 2: FAFSA by School Type ------------------ //
function createScatterByType(data, quarter) {
  const svg = d3.select("#viz4").html("").append("svg")
    .attr("width", 800).attr("height", 450);

  const typeMap = { Public: "#007acc", Private: "#f77f00", "For-profit": "#d62828" };

  const x = d3.scaleLinear().domain([0, d3.max(data, d => +d[`Quarterly Total_${quarter}`])]).nice().range([50, 740]);
  const y = d3.scalePoint().domain([...new Set(data.map(d => d["School Type"]))]).range([400, 50]);

  svg.selectAll("circle")
    .data(data)
    .enter().append("circle")
    .attr("cx", d => x(+d[`Quarterly Total_${quarter}`]))
    .attr("cy", d => y(d["School Type"]))
    .attr("r", 4)
    .attr("fill", d => typeMap[d["School Type"]] || "gray")
    .on("mouseover", (event, d) => {
      tooltip.style("opacity", 1).html(`<strong>${d.School}</strong><br>${d["School Type"]}: ${d[`Quarterly Total_${quarter}`]}`);
    })
    .on("mousemove", (event) => {
      tooltip.style("left", (event.pageX + 10) + "px").style("top", (event.pageY - 28) + "px");
    })
    .on("mouseout", () => tooltip.style("opacity", 0));

  svg.append("g").attr("transform", "translate(0,400)").call(d3.axisBottom(x));
  svg.append("g").attr("transform", "translate(50,0)").call(d3.axisLeft(y));
}

// ------------------ 5. MAP: FAFSA Totals by State ------------------ //
// You already had a map implementation earlier. Insert your full map function here.

// ------------------ QUARTER TAB CONTROL ------------------ //
d3.selectAll(".tab-button").on("click", function () {
  const quarter = d3.select(this).attr("data-quarter");
  d3.selectAll(".tab-button").classed("active", false);
  d3.select(this).classed("active", true);

  d3.csv("cleaned.csv").then(data => {
    createBarChart(data, quarter);
    createHistogram(data, quarter);
    createScatterPlot(data, quarter);
    createScatterByType(data, quarter);
    // Add your updateMap(data, quarter) function here if needed
  });
});

// ------------------ INITIAL LOAD ------------------ //
d3.csv("cleaned.csv").then(data => {
  createBarChart(data, "Q1");
  createHistogram(data, "Q1");
  createScatterPlot(data, "Q1");
  createScatterByType(data, "Q1");
  // Add createMap or updateMap if you have one
});
