// visualization.js with Quarter Interactivity

(async function () {
  const data = await d3.csv("cleaned.csv", d3.autoType);
  const quarters = ["Q1", "Q2", "Q3", "Q4", "Q5"];

  const margin = { top: 20, right: 20, bottom: 60, left: 60 };
  const width = 800 - margin.left - margin.right;
  const height = 400 - margin.top - margin.bottom;

  const svg1 = d3.select("#viz1").append("svg").attr("width", 800).attr("height", 400);
  const g1 = svg1.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

  const svg2 = d3.select("#viz2").append("svg").attr("width", 800).attr("height", 400);
  const g2 = svg2.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

  const svg3 = d3.select("#viz3").append("svg").attr("width", 800).attr("height", 400);
  const g3 = svg3.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

  const svg4 = d3.select("#viz4").append("svg").attr("width", 800).attr("height", 400);
  const g4 = svg4.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

  function updateCharts(quarter) {
    g1.selectAll("*").remove();
    g2.selectAll("*").remove();
    g3.selectAll("*").remove();
    g4.selectAll("*").remove();

    // Chart 1: Bar
    const stateTotals = d3.rollup(
      data,
      v => d3.sum(v, d => d[`Quarterly Total_${quarter}`]),
      d => d.State
    );
    const barData = Array.from(stateTotals, ([state, total]) => ({ state, total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 20);
    const x1 = d3.scaleBand().domain(barData.map(d => d.state)).range([0, width]).padding(0.1);
    const y1 = d3.scaleLinear().domain([0, d3.max(barData, d => d.total)]).range([height, 0]);
    g1.append("g").call(d3.axisLeft(y1));
    g1.append("g").attr("transform", `translate(0,${height})`).call(d3.axisBottom(x1)).selectAll("text")
      .attr("transform", "rotate(-45)").style("text-anchor", "end");
    g1.selectAll("rect")
      .data(barData).enter().append("rect")
      .attr("x", d => x1(d.state)).attr("y", d => y1(d.total))
      .attr("width", x1.bandwidth()).attr("height", d => height - y1(d.total))
      .attr("fill", "steelblue");

    // Chart 2: Histogram
    const values = data.map(d => d[`Quarterly Total_${quarter}`]);
    const x2 = d3.scaleLinear().domain([0, d3.max(values)]).range([0, width]);
    const bins = d3.bin().domain(x2.domain()).thresholds(20)(values);
    const y2 = d3.scaleLinear().domain([0, d3.max(bins, d => d.length)]).range([height, 0]);
    g2.append("g").call(d3.axisLeft(y2));
    g2.append("g").attr("transform", `translate(0,${height})`).call(d3.axisBottom(x2));
    g2.selectAll("rect")
      .data(bins).enter().append("rect")
      .attr("x", d => x2(d.x0)).attr("y", d => y2(d.length))
      .attr("width", d => x2(d.x1) - x2(d.x0) - 1).attr("height", d => height - y2(d.length))
      .attr("fill", "#66c2a5");

    // Chart 3: Scatter Dep vs Ind
    const x3 = d3.scaleLinear().domain([0, d3.max(data, d => d[`Dependent_${quarter}`])]).range([0, width]);
    const y3 = d3.scaleLinear().domain([0, d3.max(data, d => d[`Independent_${quarter}`])]).range([height, 0]);
    g3.append("g").call(d3.axisLeft(y3));
    g3.append("g").attr("transform", `translate(0,${height})`).call(d3.axisBottom(x3));
    g3.selectAll("circle")
      .data(data).enter().append("circle")
      .attr("cx", d => x3(d[`Dependent_${quarter}`])).attr("cy", d => y3(d[`Independent_${quarter}`]))
      .attr("r", 3).attr("fill", "#ff7f00");

    // Chart 4: School Type vs Total
    const types = Array.from(new Set(data.map(d => d["School Type"])));
    const x4 = d3.scalePoint().domain(types).range([0, width]).padding(0.5);
    const y4 = d3.scaleLinear().domain([0, d3.max(data, d => d[`Quarterly Total_${quarter}`])]).range([height, 0]);
    g4.append("g").call(d3.axisLeft(y4));
    g4.append("g").attr("transform", `translate(0,${height})`).call(d3.axisBottom(x4));
    g4.selectAll("circle")
      .data(data).enter().append("circle")
      .attr("cx", d => x4(d["School Type"]))
      .attr("cy", d => y4(d[`Quarterly Total_${quarter}`]))
      .attr("r", 3).attr("fill", "#984ea3");
  }

  // Add event listeners to tab buttons
  d3.selectAll(".tab-button").on("click", function () {
    const quarter = d3.select(this).attr("data-quarter");
    d3.selectAll(".tab-button").classed("active", false);
    d3.select(this).classed("active", true);
    updateCharts(quarter);
  });

  updateCharts("Q1");
})();
