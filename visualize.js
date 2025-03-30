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
    .attr("transform", "translate(0,370)")
    .call(d3.axisBottom(x))
    .selectAll("text")
    .attr("transform", "rotate(-35)")
    .style("text-anchor", "end")
    .style("font-size", "12px");

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

// ⚠️ Paste the rest of your original drawMapPlotly, drawScatterPlot, embedAltairScatter, and embedAltairHistogram below this
