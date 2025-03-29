// D3.js Script to Render FAFSA Visualizations

const width = 600;
const height = 400;
let currentQuarter = "Q1";

// Load and render all charts once DOM is ready
d3.csv("cleaned.csv").then(data => {
  renderAllCharts(data, currentQuarter);

  document.querySelectorAll(".tab-button").forEach(btn => {
    btn.addEventListener("click", function () {
      document.querySelectorAll(".tab-button").forEach(b => b.classList.remove("active"));
      this.classList.add("active");
      currentQuarter = this.getAttribute("data-quarter");
      renderAllCharts(data, currentQuarter);
    });
  });
});

function renderAllCharts(data, quarter) {
  console.log("Rendering charts for quarter:", quarter);
  createBarChart(data, quarter);
  createHistogram(data, quarter);
  createScatterDependent(data, quarter);
  createScatterSchoolType(data, quarter);
  createMapVisualization(quarter); // ✅ Keep your map
}

// Chart 1: Bar Chart – Total FAFSA by State
function createBarChart(data, quarter) {
  console.log("Bar chart data:", data);
  // [Bar Chart Implementation Goes Here]
}

// Chart 2: Histogram – FAFSA Totals Distribution
function createHistogram(data, quarter) {
  console.log("Histogram data:", data);
  // [Histogram Implementation Goes Here]
}

// Chart 3: Scatter Plot – Dependent vs. Independent
function createScatterDependent(data, quarter) {
  console.log("Scatter Plot (Dep vs Ind) data:", data);
  // [Scatter Plot 1 Implementation Goes Here]
}

// Chart 4: Scatter Plot – School Type vs Applications
function createScatterSchoolType(data, quarter) {
  console.log("Scatter Plot (School Type) data:", data);
  // [Scatter Plot 2 Implementation Goes Here]
}

// Chart 6: Interactive Map
function createMapVisualization(quarter) {
  console.log("Map for quarter:", quarter);
  // [Map Rendering Logic Goes Here]
}
