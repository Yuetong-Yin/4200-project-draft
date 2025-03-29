// Revised visualization.js with proper chart rendering and error handling

// Load the data once and initialize charts
(async function () {
  const data = await d3.csv("cleaned.csv");

  // Convert numeric fields
  const quarters = ["Q1", "Q2", "Q3", "Q4", "Q5"];
  quarters.forEach((q, i) => {
    data.forEach(d => {
      d[`Quarterly Total_Q${i + 1}`] = +d[`Quarterly Total_Q${i + 1}`];
      d[`Dependent_Q${i + 1}`] = +d[`Dependent_Q${i + 1}`];
      d[`Independent_Q${i + 1}`] = +d[`Independent_Q${i + 1}`];
    });
  });

  // Initial quarter
  let currentQuarter = "Q1";
  renderAllCharts(currentQuarter);

  // Add button interactions
  d3.selectAll(".tab-button").on("click", function () {
    d3.selectAll(".tab-button").classed("active", false);
    d3.select(this).classed("active", true);
    currentQuarter = d3.select(this).attr("data-quarter");
    renderAllCharts(currentQuarter);
  });

  function renderAllCharts(quarter) {
    console.log("Rendering charts for quarter:", quarter);

    renderBarChart(data, quarter);
    renderHistogram(data, quarter);
    renderScatterDepInd(data, quarter);
    renderScatterSchoolType(data, quarter);
    renderMap(data, quarter);
  }

  function renderBarChart(data, quarter) {
    const stateData = d3.rollups(
      data,
      v => d3.sum(v, d => d[`Quarterly Total_${quarter}`]),
      d => d.State
    ).map(([state, total]) => ({ state, total }));

    console.log("Bar chart data:", stateData);
    const width = 600, height = 300;
    const svg = d3.select("#viz1").html("").append("svg")
      .attr("width", width)
      .attr("height", height);

    const x = d3.scaleBand()
      .domain(stateData.map(d => d.state))
      .range([40, width])
      .padding(0.2);

    const y = d3.scaleLinear()
      .domain([0, d3.max(stateData, d => d.total)])
      .range([height - 40, 20]);

    svg.append("g")
      .attr("transform", `translate(0,${height - 40})`)
      .call(d3.axisBottom(x).tickFormat(d => d).tickSizeOuter(0))
      .selectAll("text")
      .attr("transform", "rotate(-45)")
      .style("text-anchor", "end");

    svg.append("g")
      .attr("transform", "translate(40,0)")
      .call(d3.axisLeft(y));

    svg.selectAll("rect")
      .data(stateData)
      .enter()
      .append("rect")
      .attr("x", d => x(d.state))
      .attr("y", d => y(d.total))
      .attr("width", x.bandwidth())
      .attr("height", d => height - 40 - y(d.total))
      .attr("fill", "steelblue");
  }

  function renderHistogram(data, quarter) {
    const totals = data.map(d => d[`Quarterly Total_${quarter}`]);
    console.log("Histogram data:", totals);
    const bins = d3.bin().thresholds(20)(totals);
    const width = 600, height = 300;
    const svg = d3.select("#viz2").html("").append("svg")
      .attr("width", width)
      .attr("height", height);

    const x = d3.scaleLinear()
      .domain([0, d3.max(totals)])
      .range([40, width]);

    const y = d3.scaleLinear()
      .domain([0, d3.max(bins, d => d.length)])
      .range([height - 40, 20]);

    svg.append("g")
      .attr("transform", `translate(0,${height - 40})`)
      .call(d3.axisBottom(x));

    svg.append("g")
      .attr("transform", "translate(40,0)")
      .call(d3.axisLeft(y));

    svg.selectAll("rect")
      .data(bins)
      .enter().append("rect")
      .attr("x", d => x(d.x0))
      .attr("y", d => y(d.length))
      .attr("width", d => x(d.x1) - x(d.x0) - 1)
      .attr("height", d => height - 40 - y(d.length))
      .attr("fill", "darkorange");
  }

  function renderScatterDepInd(data, quarter) {
    const filtered = data.map(d => ({
      dep: d[`Dependent_${quarter}`],
      ind: d[`Independent_${quarter}`]
    })).filter(d => !isNaN(d.dep) && !isNaN(d.ind));

    console.log("Scatter Plot (Dep vs Ind) data:", filtered);

    const width = 600, height = 300;
    const svg = d3.select("#viz3").html("").append("svg")
      .attr("width", width)
      .attr("height", height);

    const x = d3.scaleLinear()
      .domain([0, d3.max(filtered, d => d.dep)])
      .range([40, width]);

    const y = d3.scaleLinear()
      .domain([0, d3.max(filtered, d => d.ind)])
      .range([height - 40, 20]);

    svg.append("g")
      .attr("transform", `translate(0,${height - 40})`)
      .call(d3.axisBottom(x));

    svg.append("g")
      .attr("transform", "translate(40,0)")
      .call(d3.axisLeft(y));

    svg.selectAll("circle")
      .data(filtered)
      .enter()
      .append("circle")
      .attr("cx", d => x(d.dep))
      .attr("cy", d => y(d.ind))
      .attr("r", 3)
      .attr("fill", "orange");
  }

  function renderScatterSchoolType(data, quarter) {
    const grouped = d3.groups(data, d => d["School Type"]);
    const typeData = grouped.map(([type, entries]) => {
      const total = d3.sum(entries, d => d[`Quarterly Total_${quarter}`]);
      return { type, total };
    });

    console.log("Scatter Plot (School Type) data:", typeData);
    const width = 600, height = 300;
    const svg = d3.select("#viz4").html("").append("svg")
      .attr("width", width)
      .attr("height", height);

    const x = d3.scaleBand()
      .domain(typeData.map(d => d.type))
      .range([40, width])
      .padding(0.2);

    const y = d3.scaleLinear()
      .domain([0, d3.max(typeData, d => d.total)])
      .range([height - 40, 20]);

    svg.append("g")
      .attr("transform", `translate(0,${height - 40})`)
      .call(d3.axisBottom(x));

    svg.append("g")
      .attr("transform", "translate(40,0)")
      .call(d3.axisLeft(y));

    svg.selectAll("circle")
      .data(typeData)
      .enter()
      .append("circle")
      .attr("cx", d => x(d.type) + x.bandwidth() / 2)
      .attr("cy", d => y(d.total))
      .attr("r", 5)
      .attr("fill", "green");
  }

  function renderMap(data, quarter) {
    console.log("Map for quarter:", quarter);
    // If you're embedding a separate HTML map like explore_map.html, nothing is needed here
    // Otherwise, implement D3/TopoJSON choropleth rendering in this block
  }
})();
