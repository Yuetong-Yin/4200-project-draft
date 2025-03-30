let currentQuarter = "Q1";
let globalData = [];
let selectedState = "ALL";

const quarterColors = {
  Q1: "#1f77b4",
  Q2: "#ff7f0e",
  Q3: "#2ca02c",
  Q4: "#d62728",
  Q5: "#9467bd"
};

document.addEventListener("DOMContentLoaded", function () {
  d3.csv("cleaned.csv").then(data => {
    globalData = data;
    populateStateDropdown();
    updateCharts(currentQuarter);
  });

  document.getElementById("cutoffRange").addEventListener("input", function () {
    document.getElementById("cutoffValue").textContent = this.value;
    embedAltairScatter(currentQuarter);
  });

  document.getElementById("stateDropdown").addEventListener("change", function () {
    selectedState = this.value;
    drawScatterPlot(currentQuarter);
  });

  document.querySelectorAll(".tab-button").forEach(button => {
    button.addEventListener("click", function () {
      document.querySelectorAll(".tab-button").forEach(b => b.classList.remove("active"));
      this.classList.add("active");
      currentQuarter = this.getAttribute("data-quarter");
      updateCharts(currentQuarter);
    });
  });
});

function populateStateDropdown() {
  const dropdown = document.getElementById("stateDropdown");
  const states = Array.from(new Set(globalData.map(d => d.State))).sort();
  dropdown.innerHTML = '<option value="ALL">ALL</option>';
  states.forEach(state => {
    const option = document.createElement("option");
    option.value = state;
    option.textContent = state;
    dropdown.appendChild(option);
  });
}

function updateCharts(quarter) {
  drawBarChart(quarter);
  drawMapPlotly(quarter);
  drawScatterPlot(quarter);
  embedAltairScatter(quarter);
  embedAltairHistogram(quarter);
}

function drawBarChart(quarter) {
  const col = "Quarterly Total_" + quarter;
  const data = globalData
    .filter(d => d[col] && !isNaN(parseInt(d[col].replace(/,/g, ''))))
    .sort((a, b) => parseInt(b[col].replace(/,/g, '')) - parseInt(a[col].replace(/,/g, '')))
    .slice(0, 10);

  d3.select("#bar-chart").html("");
  const svg = d3.select("#bar-chart").append("svg").attr("width", 900).attr("height", 420);

  const x = d3.scaleBand().domain(data.map(d => d.School.trim())).range([100, 850]).padding(0.3);
  const y = d3.scaleLinear()
    .domain([0, d3.max(data, d => parseInt(d[col].replace(/,/g, '')))])
    .range([370, 50]);

  svg.append("g")
    .attr("transform", "translate(0,600)")
    .call(d3.axisBottom(x))
    .selectAll("text")
    .attr("transform", "rotate(-45)")
    .style("text-anchor", "end")
    .style("font-size", "10px");

  svg.append("g")
    .attr("transform", "translate(100,0)")
    .call(d3.axisLeft(y).tickFormat(d3.format(",")));

  const tooltip = d3.select("#bar-chart").append("div")
    .attr("class", "tooltip")
    .style("opacity", 0);

  svg.selectAll("rect")
    .data(data)
    .join("rect")
    .attr("x", d => x(d.School.trim()))
    .attr("y", d => y(parseInt(d[col].replace(/,/g, ''))))
    .attr("width", x.bandwidth())
    .attr("height", d => 370 - y(parseInt(d[col].replace(/,/g, ''))))
    .attr("fill", quarterColors[quarter])
    .on("mouseover", function (event, d) {
      d3.select(this).attr("fill", "#333");
      tooltip.transition().duration(200).style("opacity", 1);
      tooltip.html(`<strong>${d.School.trim()}</strong><br>${d[col]}`)
        .style("left", (event.pageX + 10) + "px")
        .style("top", (event.pageY - 40) + "px");
    })
    .on("mouseout", function () {
      d3.select(this).attr("fill", quarterColors[quarter]);
      tooltip.transition().duration(200).style("opacity", 0);
    });
}

function drawMapPlotly(quarter) {
  const col = "Quarterly Total_" + quarter;
  const stateData = {};
  globalData.forEach(d => {
    const val = parseInt(d[col]?.replace(/,/g, ''));
    if (!isNaN(val)) {
      stateData[d.State] = (stateData[d.State] || 0) + val;
    }
  });

  const states = Object.keys(stateData);
  const values = states.map(s => stateData[s]);

  const data = [{
    type: 'choropleth',
    locationmode: 'USA-states',
    locations: states,
    z: values,
    colorscale: 'Blues',
    colorbar: {
      title: `${quarter} Total`,
    },
  }];

  const layout = {
    geo: {
      scope: 'usa',
    },
    margin: { t: 0, b: 0 },
  };

  Plotly.newPlot('map', data, layout);
}

function drawScatterPlot(quarter) {
  const depCol = `Dependent Students_${quarter}`;
  const indCol = `Independent Students_${quarter}`;

  let data = globalData.filter(d => d[depCol] && d[indCol]);

  if (selectedState !== "ALL") {
    data = data.filter(d => d.State === selectedState);
  }

  d3.select("#scatter-plot").html("");
  const svg = d3.select("#scatter-plot").append("svg").attr("width", 800).attr("height", 400);

  const x = d3.scaleLinear()
    .domain([0, d3.max(data, d => +d[depCol].replace(/,/g, ''))])
    .range([60, 750]);

  const y = d3.scaleLinear()
    .domain([0, d3.max(data, d => +d[indCol].replace(/,/g, ''))])
    .range([350, 50]);

  svg.append("g").attr("transform", "translate(0,350)").call(d3.axisBottom(x));
  svg.append("g").attr("transform", "translate(60,0)").call(d3.axisLeft(y));

  svg.selectAll("circle")
    .data(data)
    .join("circle")
    .attr("cx", d => x(+d[depCol].replace(/,/g, '')))
    .attr("cy", d => y(+d[indCol].replace(/,/g, '')))
    .attr("r", 4)
    .attr("fill", "#1f77b4");
}

function embedAltairScatter(quarter) {
  const cutoff = +document.getElementById("cutoffRange").value;
  const field = `Quarterly Total_${quarter}`;

  const chart = {
    $schema: "https://vega.github.io/schema/vega-lite/v5.json",
    description: "Altair Scatter Plot with Cutoff",
    data: { url: "cleaned.csv" },
    transform: [
      { filter: `datum[\"${field}\"] != null && toNumber(datum[\"${field}\"]) >= ${cutoff}` }
    ],
    mark: "point",
    encoding: {
      x: { field: `Dependent Students_${quarter}`, type: "quantitative" },
      y: { field: `Independent Students_${quarter}`, type: "quantitative" },
      tooltip: [{ field: "School", type: "nominal" }]
    }
  };

  vegaEmbed("#altair-scatter", chart, { actions: false });
}

function embedAltairHistogram(quarter) {
  const chart = {
    $schema: "https://vega.github.io/schema/vega-lite/v5.json",
    description: "Altair Histogram",
    data: { url: "cleaned.csv" },
    mark: "bar",
    encoding: {
      x: {
        field: `Quarterly Total_${quarter}`,
        bin: true,
        type: "quantitative",
        title: `FAFSA Total Applications (${quarter})`
      },
      y: { aggregate: "count", type: "quantitative" }
    }
  };
  vegaEmbed("#altair-histogram", chart, { actions: false });
}
