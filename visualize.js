let currentQuarter = "Q1";
let globalData = [];

document.addEventListener("DOMContentLoaded", function () {
  d3.csv("cleaned.csv").then(data => {
    globalData = data;
    init();
    updateCharts(currentQuarter);
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

function init() {}

function updateCharts(quarter) {
  drawBarChart(quarter);
  drawMapPlotly(quarter);
  drawGroupedBarChart(quarter);
  embedAltairBoxplot(quarter);
  embedAltairHistogram(quarter);
}

function drawBarChart(quarter) {
  const col = "Quarterly Total_" + quarter;
  const data = globalData
    .filter(d => d[col] && !isNaN(parseInt(d[col].replace(/,/g, ''))))
    .sort((a, b) => parseInt(b[col].replace(/,/g, '')) - parseInt(a[col].replace(/,/g, '')))
    .slice(0, 10);

  d3.select("#bar-chart").html("");
  const svg = d3.select("#bar-chart").append("svg").attr("width", 800).attr("height", 400);

  const x = d3.scaleBand().domain(data.map(d => d.School)).range([60, 750]).padding(0.3);
  const y = d3.scaleLinear()
    .domain([0, d3.max(data, d => parseInt(d[col].replace(/,/g, '')))])
    .range([350, 50]);

  svg.append("g")
    .attr("transform", "translate(0,350)")
    .call(d3.axisBottom(x))
    .selectAll("text")
    .attr("transform", "rotate(-40)")
    .style("text-anchor", "end");

  svg.append("g")
    .attr("transform", "translate(60,0)")
    .call(d3.axisLeft(y));

  const tooltip = d3.select("#bar-chart").append("div")
    .attr("class", "tooltip")
    .style("opacity", 0);

  svg.selectAll("rect")
    .data(data)
    .join("rect")
    .attr("x", d => x(d.School))
    .attr("y", d => y(parseInt(d[col].replace(/,/g, ''))))
    .attr("width", x.bandwidth())
    .attr("height", d => 350 - y(parseInt(d[col].replace(/,/g, ''))))
    .attr("fill", "#69b3a2")
    .on("mouseover", function (event, d) {
      d3.select(this).attr("fill", "#4287f5");
      tooltip.transition().duration(200).style("opacity", 1);
      tooltip.html(`${d.School}: ${d[col]}`)
        .style("left", (event.pageX - 80) + "px")
        .style("top", (event.pageY - 50) + "px");
    })
    .on("mouseout", function () {
      d3.select(this).attr("fill", "#69b3a2");
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

function drawGroupedBarChart(quarter) {
  const depCol = `Dependent Students_${quarter}`;
  const indCol = `Independent Students_${quarter}`;
  const stateData = {};

  globalData.forEach(d => {
    const dep = parseInt(d[depCol]?.replace(/,/g, '') || 0);
    const ind = parseInt(d[indCol]?.replace(/,/g, '') || 0);
    if (!stateData[d.State]) {
      stateData[d.State] = { dep: 0, ind: 0 };
    }
    stateData[d.State].dep += dep;
    stateData[d.State].ind += ind;
  });

  const topStates = Object.entries(stateData)
    .sort((a, b) => (b[1].dep + b[1].ind) - (a[1].dep + a[1].ind))
    .slice(0, 10)
    .flatMap(([state, values]) => [
      { State: state, Type: "Dependent", Applications: values.dep },
      { State: state, Type: "Independent", Applications: values.ind }
    ]);

  const chart = {
    $schema: "https://vega.github.io/schema/vega-lite/v5.json",
    description: "Grouped Bar Chart: FAFSA Applications by Top States",
    data: { values: topStates },
    mark: "bar",
    encoding: {
      x: {
        field: "State",
        type: "nominal",
        axis: { labelAngle: -30, labelFontSize: 12, titleFontSize: 16 }
      },
      y: {
        field: "Applications",
        type: "quantitative",
        axis: { labelFontSize: 12, titleFontSize: 16 }
      },
      color: { field: "Type", type: "nominal" },
      column: {
        field: "Type",
        type: "nominal",
        header: { labelFontSize: 14 }
      },
      tooltip: [
        { field: "State", type: "nominal" },
        { field: "Type", type: "nominal" },
        { field: "Applications", type: "quantitative" }
      ]
    }
  };

  vegaEmbed("#grouped-bar", chart, { actions: false });
}

function embedAltairBoxplot(quarter) {
  const chart = {
    $schema: "https://vega.github.io/schema/vega-lite/v5.json",
    description: "Boxplot of FAFSA Applications by Institution Type",
    data: { url: "cleaned.csv" },
    transform: [
      {
        calculate: `datum["School Type"] == null || datum["School Type"] === "" ? "Unknown" : datum["School Type"]`,
        as: "InstitutionType"
      },
      {
        calculate: `toNumber(datum["Quarterly Total_${quarter}"])`,
        as: "Total"
      },
      {
        filter: `datum["Total"] != null && isFinite(datum["Total"])`
      }
    ],
    mark: {
      type: "boxplot",
      tooltip: true
    },
    encoding: {
      x: {
        field: "InstitutionType",
        type: "nominal",
        title: "Institution Type",
        axis: { labelFontSize: 14, titleFontSize: 16 }
      },
      y: {
        field: "Total",
        type: "quantitative",
        title: `FAFSA Applications (${quarter})`,
        axis: { labelFontSize: 14, titleFontSize: 16 }
      },
      color: { field: "InstitutionType", type: "nominal" },
      tooltip: [
        { field: "School", type: "nominal" },
        { field: "State", type: "nominal" },
        { field: "InstitutionType", type: "nominal" },
        { field: "Total", type: "quantitative" }
      ]
    }
  };

  vegaEmbed("#altair-boxplot", chart, { actions: false });
}

function embedAltairHistogram(quarter) {
  const chart = {
    $schema: "https://vega.github.io/schema/vega-lite/v5.json",
    description: "Histogram of FAFSA Total Applications",
    data: { url: "cleaned.csv" },
    mark: "bar",
    encoding: {
      x: {
        field: `Quarterly Total_${quarter}`,
        bin: true,
        type: "quantitative",
        title: `FAFSA Total Applications (${quarter})`,
        axis: { labelFontSize: 14, titleFontSize: 16 }
      },
      y: {
        aggregate: "count",
        type: "quantitative",
        axis: { labelFontSize: 14, titleFontSize: 16 }
      },
      tooltip: [
        { field: `Quarterly Total_${quarter}`, type: "quantitative", title: "Applications" }
      ]
    }
  };
  vegaEmbed("#altair-histogram", chart, { actions: false });
}
