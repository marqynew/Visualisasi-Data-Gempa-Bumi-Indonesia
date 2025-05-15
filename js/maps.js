// Enhanced Earthquake Visualization 
var width = 1200;
var height = 800;
var allData = [];
var filteredData = [];
var currentYear = null;
var years = [];
var frequencyData = {};
var topRegions = []; // Store top 5 regions globally

// Setup SVG untuk peta
var svg = d3
  .select("#map")
  .append("svg")
  .attr("width", width)
  .attr("height", height);

// Referensi tooltip
var tooltip = d3.select(".tooltip");

// Proyeksi peta Indonesia
var projection = d3
  .geoMercator()
  .center([117, -5])
  .scale(1350)
  .translate([width / 2, height / 2]);

var path = d3.geoPath().projection(projection);

// Konstanta warna
var COLORS = {
  shallow: "#FBBC05",  // Kuning untuk gempa dangkal
  medium: "#34A853",   // Hijau untuk gempa menengah
  deep: "#4285F4",     // Biru untuk gempa dalam
  border: "#796F5E",   // Border peta
  land: "#CFB498",     // Warna daratan
  graticule: "#CFB498", // Grid peta
  headerBg: "#3498db", // Header legenda
  cardBorder: "#CCCCCC", // Border card
  // Tambahkan warna untuk 5 wilayah teratas
  topRegions: ["#e74c3c", "#9b59b6", "#f39c12", "#27ae60", "#16a085"]
};

// Konstanta teks
var FONT = {
  family: "Poppins",
  size: {
    small: "10px",
    normal: "12px",
    medium: "14px",
    large: "16px"
  },
  weight: {
    normal: "normal",
    bold: "bold"
  }
};

// Kategori kedalaman dan fungsi warna
var depthColorScale = function (depth) {
  if (depth <= 30) return COLORS.shallow;
  if (depth <= 70) return COLORS.medium;
  return COLORS.deep;
};

var getDepthCategory = function (depth) {
  if (depth <= 30) return "Dangkal";
  if (depth <= 70) return "Menengah";
  return "Dalam";
};

// Ukuran titik berdasarkan magnitudo
var magnitudeSize = function (mag) {
  if (mag < 5.0) return 3;
  if (mag < 7.0) return 6;
  return 12;
};

// Fungsi untuk menghitung statistik
function calculateStatistics(data) {
  const totalEarthquakes = data.length;
  const avgMagnitude = d3.mean(data, d => d.mag);
  const avgDepth = d3.mean(data, d => d.depth);
  const maxMagnitude = d3.max(data, d => d.mag);
  
  return {
    total: totalEarthquakes,
    avgMagnitude: avgMagnitude,
    avgDepth: avgDepth,
    maxMagnitude: maxMagnitude
  };
}

// Fungsi untuk membuat dashboard
function createDashboard(stats) {
  const dashboard = d3.select("#dashboard");
  dashboard.html("");

  const cards = [
    {
      title: "Total Gempa",
      value: stats.total.toLocaleString(),
      unit: "kejadian",
      color: "#3498db"
    },
    {
      title: "Rata-rata Magnitudo",
      value: stats.avgMagnitude.toFixed(2),
      unit: "M",
      color: "#e74c3c"
    },
    {
      title: "Rata-rata Kedalaman",
      value: stats.avgDepth.toFixed(1),
      unit: "km",
      color: "#f39c12"
    },
    {
      title: "Magnitudo Tertinggi",
      value: stats.maxMagnitude.toFixed(1),
      unit: "M",
      color: "#27ae60"
    }
  ];

  cards.forEach(card => {
    const cardElement = dashboard
      .append("div")
      .attr("class", "dashboard-card")
      .style("border-top-color", card.color);

    cardElement.append("h3").text(card.title);
    cardElement.append("div").attr("class", "value").style("color", card.color).text(card.value);
    cardElement.append("div").attr("class", "unit").text(card.unit);
  });
}

// Fungsi untuk menghitung korelasi Pearson
function calculateCorrelation(data) {
  const x = data.map(d => d.depth);
  const y = data.map(d => d.mag);
  const n = x.length;
  
  const sumX = d3.sum(x);
  const sumY = d3.sum(y);
  const sumXY = d3.sum(x.map((val, i) => val * y[i]));
  const sumXX = d3.sum(x.map(val => val * val));
  const sumYY = d3.sum(y.map(val => val * val));
  
  const numerator = n * sumXY - sumX * sumY;
  const denominator = Math.sqrt((n * sumXX - sumX * sumX) * (n * sumYY - sumY * sumY));
  
  return denominator === 0 ? 0 : numerator / denominator;
}

// Fungsi untuk membuat scatter plot
function createScatterPlot(data) {
  const container = d3.select("#scatter-plot");
  container.selectAll("*").remove();

  const margin = { top: 20, right: 30, bottom: 50, left: 60 };
  const chartWidth = 450;
  const chartHeight = 350;
  const innerWidth = chartWidth - margin.left - margin.right;
  const innerHeight = chartHeight - margin.top - margin.bottom;

  const plotSvg = container
    .append("svg")
    .attr("width", chartWidth)
    .attr("height", chartHeight);

  const g = plotSvg
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  // Skala
  const xScale = d3
    .scaleLinear()
    .domain([0, d3.max(data, d => d.depth)])
    .range([0, innerWidth]);

  const yScale = d3
    .scaleLinear()
    .domain([d3.min(data, d => d.mag) - 0.5, d3.max(data, d => d.mag) + 0.5])
    .range([innerHeight, 0]);

  // Sumbu
  g.append("g")
    .attr("transform", `translate(0,${innerHeight})`)
    .call(d3.axisBottom(xScale))
    .append("text")
    .attr("x", innerWidth / 2)
    .attr("y", 40)
    .attr("fill", "black")
    .style("text-anchor", "middle")
    .style("font-size", "14px")
    .text("Kedalaman (km)");

  g.append("g")
    .call(d3.axisLeft(yScale))
    .append("text")
    .attr("transform", "rotate(-90)")
    .attr("y", -40)
    .attr("x", -innerHeight / 2)
    .attr("fill", "black")
    .style("text-anchor", "middle")
    .style("font-size", "14px")
    .text("Magnitudo");

  // Titik-titik scatter
  g.selectAll(".scatter-dot")
    .data(data)
    .enter()
    .append("circle")
    .attr("class", "scatter-dot")
    .attr("cx", d => xScale(d.depth))
    .attr("cy", d => yScale(d.mag))
    .attr("r", 3)
    .attr("fill", d => depthColorScale(d.depth))
    .attr("opacity", 0.6)
    .attr("stroke", "white")
    .attr("stroke-width", 0.5)
    .on("mouseover", function(event, d) {
      d3.select(this).attr("r", 5).attr("opacity", 1);
      tooltip.transition().duration(200).style("opacity", 0.9);
      tooltip
        .html(`
          <strong>Lokasi:</strong> ${d.remark}<br/>
          <strong>Magnitudo:</strong> ${d.mag.toFixed(1)}<br/>
          <strong>Kedalaman:</strong> ${d.depth} km<br/>
          <strong>Tanggal:</strong> ${d.date.toLocaleDateString()}
        `)
        .style("left", (event.pageX + 10) + "px")
        .style("top", (event.pageY - 28) + "px");
    })
    .on("mouseout", function() {
      d3.select(this).attr("r", 3).attr("opacity", 0.6);
      tooltip.transition().duration(500).style("opacity", 0);
    });

  // Hitung dan tampilkan korelasi
  const correlation = calculateCorrelation(data);
  
  // Interpretasi korelasi
  let interpretation = "";
  let correlationColor = "#333";
  
  if (Math.abs(correlation) < 0.1) {
    interpretation = "Tidak ada korelasi";
    correlationColor = "#7f8c8d";
  } else if (Math.abs(correlation) < 0.3) {
    interpretation = "Korelasi lemah";
    correlationColor = "#f39c12";
  } else if (Math.abs(correlation) < 0.7) {
    interpretation = "Korelasi sedang";
    correlationColor = "#e67e22";
  } else {
    interpretation = "Korelasi kuat";
    correlationColor = "#27ae60";
  }
  
  if (correlation < 0) {
    interpretation += " (negatif)";
  } else if (correlation > 0) {
    interpretation += " (positif)";
  }

  d3.select("#correlation-analysis").html(`
    <h4>Analisis Korelasi</h4>
    <p>Koefisien Korelasi Pearson: <span class="correlation-value" style="color: ${correlationColor}">${correlation.toFixed(3)}</span></p>
    <p><strong>Interpretasi:</strong> ${interpretation}</p>
    <p><small>Korelasi menunjukkan hubungan linear antara kedalaman gempa dan magnitudo. 
    Nilai mendekati 0 menunjukkan tidak ada hubungan linear, 
    nilai mendekati ±1 menunjukkan hubungan linear yang kuat.</small></p>
  `);
}

// Fungsi untuk membuat bar chart wilayah teratas
function createTopRegionsChart(data) {
  const container = d3.select("#top-regions-chart");
  container.selectAll("*").remove();

  // Hitung frekuensi berdasarkan wilayah
  const regionCount = {};
  data.forEach(d => {
    const region = d.remark || "Tidak diketahui";
    regionCount[region] = (regionCount[region] || 0) + 1;
  });

  // Ambil 5 wilayah teratas
  topRegions = Object.entries(regionCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([region, count], index) => ({ 
      region, 
      count, 
      color: COLORS.topRegions[index] // Assign color based on index
    }));

  const margin = { top: 20, right: 30, bottom: 80, left: 60 };
  const chartWidth = 450;
  const chartHeight = 350;
  const innerWidth = chartWidth - margin.left - margin.right;
  const innerHeight = chartHeight - margin.top - margin.bottom;

  const chartSvg = container
    .append("svg")
    .attr("width", chartWidth)
    .attr("height", chartHeight);

  const g = chartSvg
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  // Skala
  const xScale = d3
    .scaleBand()
    .domain(topRegions.map(d => d.region))
    .range([0, innerWidth])
    .padding(0.1);

  const yScale = d3
    .scaleLinear()
    .domain([0, d3.max(topRegions, d => d.count)])
    .range([innerHeight, 0]);

  // Sumbu X
  g.append("g")
    .attr("transform", `translate(0,${innerHeight})`)
    .call(d3.axisBottom(xScale))
    .selectAll("text")
    .style("text-anchor", "end")
    .attr("dx", "-.8em")
    .attr("dy", ".15em")
    .attr("transform", "rotate(-45)")
    .style("font-size", "12px")
    .text(d => d.length > 15 ? d.substring(0, 15) + "..." : d);

  // Sumbu Y
  g.append("g")
    .call(d3.axisLeft(yScale))
    .append("text")
    .attr("transform", "rotate(-90)")
    .attr("y", -40)
    .attr("x", -innerHeight / 2)
    .attr("fill", "black")
    .style("text-anchor", "middle")
    .style("font-size", "14px")
    .text("Jumlah Gempa");

  // Bar chart with colors from topRegions
  g.selectAll(".bar")
    .data(topRegions)
    .enter()
    .append("rect")
    .attr("class", "bar")
    .attr("x", d => xScale(d.region))
    .attr("y", d => yScale(d.count))
    .attr("width", xScale.bandwidth())
    .attr("height", d => innerHeight - yScale(d.count))
    .attr("fill", d => d.color) // Use the assigned color
    .attr("stroke", "#2c3e50")
    .attr("stroke-width", 1)
    .on("mouseover", function(event, d) {
      d3.select(this).attr("opacity", 0.8);
      tooltip.transition().duration(200).style("opacity", 0.9);
      tooltip
        .html(`
          <strong>${d.region}</strong><br/>
          <strong>Jumlah Gempa:</strong> ${d.count}<br/>
          <strong>Persentase:</strong> ${((d.count / data.length) * 100).toFixed(1)}%
        `)
        .style("left", (event.pageX + 10) + "px")
        .style("top", (event.pageY - 28) + "px");
    })
    .on("mouseout", function(event, d) {
      d3.select(this).attr("opacity", 1);
      tooltip.transition().duration(500).style("opacity", 0);
    });

  // Label nilai di atas bar
  g.selectAll(".bar-label")
    .data(topRegions)
    .enter()
    .append("text")
    .attr("class", "bar-label")
    .attr("x", d => xScale(d.region) + xScale.bandwidth() / 2)
    .attr("y", d => yScale(d.count) - 5)
    .attr("text-anchor", "middle")
    .style("font-size", "12px")
    .style("font-weight", "bold")
    .text(d => d.count);
}

// Fungsi untuk memperbarui semua visualisasi
function updateVisualizations(year) {
  currentYear = year;
  
  // Filter data berdasarkan tahun
  const yearData = year === "all" ? allData : allData.filter(d => d.year == year);
  
  // Update statistik dashboard
  const stats = calculateStatistics(yearData);
  createDashboard(stats);
  
  // Update scatter plot
  createScatterPlot(yearData);
  
  // Update top regions chart
  createTopRegionsChart(yearData);
  
  // Update peta
  updateMapData(yearData);
}

  // Fungsi untuk memperbarui data peta (OPTIMIZED)
function updateMapData(data) {
  svg
    .selectAll(".earthquake")
    .data(data)
    .join(
      enter => enter
        .append("circle")
        .attr("class", "earthquake")
        .attr("cx", d => projection([d.lon, d.lat])[0])
        .attr("cy", d => projection([d.lon, d.lat])[1])
        .attr("r", d => magnitudeSize(d.mag))
        .attr("fill", d => depthColorScale(d.depth)) // Use normal depth-based color
        .attr("opacity", 0.9)
        .attr("stroke", "none")
        .on("mouseover", function(event, d) {
          d3.select(this).attr("stroke", "#000").attr("stroke-width", 2);
          tooltip.transition().duration(200).style("opacity", 0.9);
          tooltip
            .html(`
              <strong>Lokasi:</strong> ${d.remark}<br/>
              <strong>Magnitudo:</strong> ${d.mag.toFixed(1)}<br/>
              <strong>Kedalaman:</strong> ${d.depth} km<br/>
              <strong>Kategori:</strong> ${d.depthCategory}<br/>
              <strong>Waktu:</strong> ${d.date.toLocaleString()}
            `)
            .style("left", (event.pageX + 10) + "px")
            .style("top", (event.pageY - 28) + "px");
        })
        .on("mouseout", function() {
          d3.select(this).attr("stroke", "none");
          tooltip.transition().duration(500).style("opacity", 0);
        }),
      update => update
        .transition()
        .duration(500)
        .attr("cx", d => projection([d.lon, d.lat])[0])
        .attr("cy", d => projection([d.lon, d.lat])[1])
        .attr("r", d => magnitudeSize(d.mag))
        .attr("fill", d => depthColorScale(d.depth)), // Use normal depth-based color
      exit => exit
        .transition()
        .duration(500)
        .attr("opacity", 0)
        .remove()
    );
}

// Fungsi untuk membuat selector tahun
function createYearSelector(years) {
  const selector = d3.select("#year-select");
  
  // Tambahkan opsi 'semua tahun'
  selector.append("option")
    .attr("value", "all")
    .text("Semua Tahun (2009-2022)");

  // Tambahkan opsi untuk setiap tahun
  years.forEach(year => {
    selector.append("option").attr("value", year).text(year);
  });

  // Event listener untuk perubahan tahun
  selector.on("change", function() {
    updateVisualizations(this.value);
  });
}

// Fungsi untuk membuat peta (OPTIMIZED)
function createMap(data) {
  // Load GeoJSON Indonesia
  d3.json("indonesia-province.json").then(function(geojson) {
    // Background
    svg
      .append("rect")
      .attr("width", width)
      .attr("height", height)
      .attr("fill", "#EDE5DC");

    // Border frame - define clipping path for content
    const framePadding = 30;
    const frameWidth = width - 55;
    const frameHeight = height - 60;
    
    // Add clipping path
    svg.append("defs")
      .append("clipPath")
      .attr("id", "map-frame-clip")
      .append("rect")
      .attr("x", framePadding)
      .attr("y", framePadding)
      .attr("width", frameWidth)
      .attr("height", frameHeight);
    
    // Add border frame
    svg
      .append("rect")
      .attr("x", framePadding)
      .attr("y", framePadding)
      .attr("width", frameWidth)
      .attr("height", frameHeight)
      .attr("fill", "none")
      .attr("stroke", "#000")
      .attr("stroke-width", 2);

    // Create a group for the map content that respects the clipping path
    const mapGroup = svg.append("g")
      .attr("clip-path", "url(#map-frame-clip)");

    // Graticule - grid peta - properly clipped
    var graticule = d3.geoGraticule()
      .step([10, 10]);

    mapGroup
      .append("path")
      .datum(graticule)
      .attr("class", "graticule")
      .attr("d", path)
      .attr("fill", "none")
      .attr("stroke", COLORS.graticule)
      .attr("stroke-width", 0.8)
      .attr("stroke-dasharray", "2,2");

    // Label bujur dan lintang (dioptimalkan)
    addCoordinateLabels();

    // Draw country outline
    mapGroup
      .selectAll(".map-path")
      .data(geojson.features)
      .enter()
      .append("path")
      .attr("class", "map-path")
      .attr("d", path)
      .attr("fill", COLORS.land)
      .attr("stroke", COLORS.border)
      .attr("stroke-width", 0.8);
      
    // Legenda
    createMapLegend();

    // Tampilkan data awal
    updateVisualizations("all");
  });
}

// Fungsi helper untuk label koordinat - improved positioning
function addCoordinateLabels() {
  // Label longitude - adjusted positioning
  [100, 110, 120, 130, 140].forEach(function(lon) {
    svg.append("text")
      .attr("x", projection([lon, -14])[0])
      .attr("y", 25)
      .attr("text-anchor", "middle")
      .attr("font-family", FONT.family)
      .attr("font-size", FONT.size.small)  // Smaller text
      .attr("fill", "#333")  // Darker color for better readability
      .text(lon + "°E");  // Added 'E' for East
  });

  // Label latitude - adjusted positioning
  [0, -10].forEach(function(lat) {
    // Label kiri
    svg.append("text")
      .attr("x", 25)
      .attr("y", projection([95, lat])[1])
      .attr("text-anchor", "end")  // Better alignment
      .attr("font-family", FONT.family)
      .attr("font-size", FONT.size.small)  // Smaller text
      .attr("fill", "#333")  // Darker color
      .text(Math.abs(lat) + "°" + (lat >= 0 ? "N" : "S"));  // Added 'N' for North
    
    // Label kanan
    svg.append("text")
      .attr("x", width - 20)
      .attr("y", projection([95, lat])[1])
      .attr("text-anchor", "start")  // Better alignment
      .attr("font-family", FONT.family)
      .attr("font-size", FONT.size.small)  // Smaller text
      .attr("fill", "#333")  // Darker color
      .text(Math.abs(lat) + "°" + (lat >= 0 ? "N" : "S"));  // Added 'N' for North
  });
}

// Helper function untuk format angka
function formatNumber(num) {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
}

// Cleanup function untuk tooltip
function cleanupTooltips() {
  d3.selectAll('.tooltip').filter(function() {
    return d3.select(this).style("opacity") === "0";
  }).remove();
}

// Single event listener untuk window resize
window.addEventListener('resize', function() {
  // Implementasi responsiveness jika diperlukan dalam pengembangan lanjutan
  // Saat ini hanya placeholder
  console.log("Window resized - responsiveness diimplementasikan di versi berikutnya");
});

// Fungsi untuk analisis trend gempa berdasarkan wilayah
function calculateTrendsByRegion(data) {
  const regionTrends = {};
  
  data.forEach(d => {
    const region = d.remark || "Unknown";
    if (!regionTrends[region]) {
      regionTrends[region] = {
        count: 0,
        totalMag: 0,
        totalDepth: 0,
        years: new Set()
      };
    }
    
    regionTrends[region].count++;
    regionTrends[region].totalMag += d.mag;
    regionTrends[region].totalDepth += d.depth;
    regionTrends[region].years.add(d.year);
  });
  
  return Object.entries(regionTrends)
    .map(([region, data]) => ({
      region,
      count: data.count,
      avgMag: data.totalMag / data.count,
      avgDepth: data.totalDepth / data.count,
      activeYears: data.years.size
    }))
    .sort((a, b) => b.count - a.count);
}

// Fungsi untuk analisis magnitudo berdasarkan kedalaman
function analyzeDepthMagnitudeRelation(data) {
  const categories = {
    shallow: data.filter(d => d.depth <= 30),
    medium: data.filter(d => d.depth > 30 && d.depth <= 70),
    deep: data.filter(d => d.depth > 70)
  };
  
  return {
    shallow: {
      count: categories.shallow.length,
      avgMag: d3.mean(categories.shallow, d => d.mag) || 0,
      maxMag: d3.max(categories.shallow, d => d.mag) || 0,
      minMag: d3.min(categories.shallow, d => d.mag) || 0
    },
    medium: {
      count: categories.medium.length,
      avgMag: d3.mean(categories.medium, d => d.mag) || 0,
      maxMag: d3.max(categories.medium, d => d.mag) || 0,
      minMag: d3.min(categories.medium, d => d.mag) || 0
    },
    deep: {
      count: categories.deep.length,
      avgMag: d3.mean(categories.deep, d => d.mag) || 0,
      maxMag: d3.max(categories.deep, d => d.mag) || 0,
      minMag: d3.min(categories.deep, d => d.mag) || 0
    }
  };
}

// Fungsi untuk membuat legenda peta
function createMapLegend() {
  var legendX = 95;
  var legendY = height - 220;
  var legendWidth = 380;
  var legendHeight = 130;

  // Header legenda
  svg.append("rect")
    .attr("x", legendX)
    .attr("y", legendY)
    .attr("width", legendWidth)
    .attr("height", 30)
    .attr("fill", "#3498db")
    .attr("stroke", "none");

  svg.append("text")
    .attr("x", legendX + 190)
    .attr("y", legendY + 20)
    .attr("text-anchor", "middle")
    .attr("font-family", "Poppins")
    .attr("font-size", "16px")
    .attr("fill", "#FFFFFF")
    .attr("font-weight", "bold")
    .text("Legenda");

  // Body legenda
  svg.append("rect")
    .attr("x", legendX)
    .attr("y", legendY + 30)
    .attr("width", legendWidth)
    .attr("height", legendHeight)
    .attr("fill", "rgba(255, 255, 255, 0.9)")
    .attr("stroke", "#CCCCCC")
    .attr("stroke-width", 1);

  // Label kategori kedalaman
  svg.append("text")
    .attr("x", legendX + 90)
    .attr("y", legendY + 50)
    .attr("font-family", "Poppins")
    .attr("font-size", "12px")
    .attr("font-weight", "bold")
    .attr("fill", "#000")
    .text("Dangkal");

  svg.append("text")
    .attr("x", legendX + 190)
    .attr("y", legendY + 50)
    .attr("font-family", "Poppins")
    .attr("font-size", "12px")
    .attr("font-weight", "bold")
    .attr("fill", "#000")
    .text("Menengah");

  svg.append("text")
    .attr("x", legendX + 290)
    .attr("y", legendY + 50)
    .attr("font-family", "Poppins")
    .attr("font-size", "12px")
    .attr("font-weight", "bold")
    .attr("fill", "#000")
    .text("Dalam");

  // Keterangan kedalaman
  svg.append("text")
    .attr("x", legendX + 90)
    .attr("y", legendY + 65)
    .attr("font-family", "Poppins")
    .attr("font-size", "10px")
    .attr("fill", "#666")
    .text("(≤ 30 km)");

  svg.append("text")
    .attr("x", legendX + 190)
    .attr("y", legendY + 65)
    .attr("font-family", "Poppins")
    .attr("font-size", "10px")
    .attr("fill", "#666")
    .text("(30-70 km)");

  svg.append("text")
    .attr("x", legendX + 290)
    .attr("y", legendY + 65)
    .attr("font-family", "Poppins")
    .attr("font-size", "10px")
    .attr("fill", "#666")
    .text("(> 70 km)");

  // Label magnitudo
  var magLabels = ["M < 5.0", "5.0 ≤ M < 7.0", "M ≥ 7.0"];
  var magSizes = [3, 6, 12];

  magLabels.forEach((label, i) => {
    svg.append("text")
      .attr("x", legendX + 75)
      .attr("y", legendY + 90 + (i * 25))
      .attr("font-family", "Poppins")
      .attr("font-size", "11px")
      .attr("fill", "#000")
      .attr("text-anchor", "end")
      .text(label);
  });

  // Circles untuk legenda
  var colors = ["#FBBC05", "#34A853", "#4285F4"];
  magSizes.forEach((size, row) => {
    colors.forEach((color, col) => {
      svg.append("circle")
        .attr("cx", legendX + 110 + (col * 100))
        .attr("cy", legendY + 85 + (row * 25))
        .attr("r", size)
        .attr("fill", color)
        .attr("opacity", 0.8);
    });
  });
}

// Load dan proses data CSV
d3.csv("data.csv").then(function(data) {
  // Konversi data
  data.forEach(function(d) {
    d.mag = +d.mag;
    d.lon = +d.lon;
    d.lat = +d.lat;
    d.depth = +d.depth;
    d.date = new Date(d.tgl);
    d.year = d.date.getFullYear();
    d.depthCategory = getDepthCategory(d.depth);
  });

  // Simpan data global
  allData = data;
  
  // Ekstrak tahun unik
  years = Array.from(new Set(data.map(d => d.year))).sort();
  
  // Buat selector tahun
  createYearSelector(years);
  
  // Buat peta
  createMap(data);
  
  // Hitung statistik awal dan buat dashboard
  const initialStats = calculateStatistics(data);
  createDashboard(initialStats);
}).catch(function(error) {
  console.error("Error loading data:", error);
  // Tampilkan pesan error kepada user
  d3.select("#dashboard").html(`
    <div class="error-message" style="background: #f8d7da; color: #721c24; padding: 20px; border-radius: 10px; border: 1px solid #f5c6cb;">
      <h3>Error Loading Data</h3>
      <p>Unable to load earthquake data. Please check if the data.csv file exists and is accessible.</p>
      <p><small>Error details: ${error.message}</small></p>
    </div>
  `);
});

// Set interval untuk cleanup tooltips yang mungkin tidak terhapus (interval lebih lama untuk performa)
setInterval(cleanupTooltips, 60000); // Cleanup setiap 60 detik