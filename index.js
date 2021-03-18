const url = "https://raw.githubusercontent.com/freeCodeCamp/ProjectReferenceData/master/global-temperature.json";

fetch(url)
.then(response => response.json())
.then(data => {
  const colorScheme = [
    '#31378b',
    '#4575b5',
    '#75acd2',
    '#abd9e9',
    '#e0f3f9',
    '#ffffbf',
    '#ffe090',
    '#fdae61',
    '#f56d43',
    '#d73027',
    '#86150e'
  ];
  /*Extracting the temperatures into an array. I add the variance of each object to the main temperature to get the final value. See the .json file for a clearer picture.*/
  const baseTemp = data.baseTemperature;
  const temps = data.monthlyVariance.map(obj => obj.variance + baseTemp);
  const min = d3.min(temps);
  const max = d3.max(temps);
  const step = (max - min) / colorScheme.length;
  //Setting the correct step values for the threshold scale
  const dom = colorScheme.map((v, i) => min + (i + 1) * step);
  
  /*A threshold scale that allows access to the correct color representation for each temperature value.
  Everything less than min gets the same color as min. The same goes for values bigger than max.*/
  const threshold = d3
    .scaleThreshold()
    .domain(dom)
    .range(colorScheme);
    
  makeLegend(min, max, threshold);
  makeChart(data, threshold, baseTemp);
});

/*------------------------THE LEGEND--------------------*/
function makeLegend(min, max, threshold) {
  
  //THE SVG
  const w = 400;
  const h = 50;
  const padding = 20;  
  
  const svg = d3.select("#legendContainer")
    .append("svg")
    .attr("id", "legendSvg")
    .attr("width", w)
    .attr("height", h)
    .attr("id", "legend");  
    
  //THE SCALE
  const scale = d3
    .scaleLinear()
    .domain([min, max])
    .range([padding, w - padding]);
  
  //THE AXIS
  const format = d3.format(".1f");
  /*Here I slice the array used to display the tick values, because I want the first and the last to be empty.*/
  const legendAxis = d3
    .axisBottom(scale)
    .tickValues(threshold.domain().slice(0, threshold.domain().length - 1))
    .tickFormat(format);
  /*Reminder: .invertExtent() works like this in this case: you provide it a color from your range and it returns you the extent of values which would get that color.*/
  const colorData = threshold.range().map(color => {
    const d = threshold.invertExtent(color);
    if (d[0] === undefined) d[0] = scale.domain()[0];
    return d;
  });
  
  svg.append("g")
           .attr("transform", `translate (0, ${h - padding})`)
           .call(legendAxis);
  
  svg.selectAll("rect")
    .data(colorData)
    .enter()
    .append("rect")
    .attr("height", 40)
    .attr("x", d => scale(d[0])) 
    .attr("y", h - padding - 40)
    .attr("width", d => scale(d[1]) - scale(d[0]))
    .attr("fill", d => threshold(d[0]));
  
}
  /*------------------------THE CHART------------------------*/
function makeChart(dataset, threshold, baseTemp) {  
  const h = 400;
  const w = 1600;
  const paddingLR = 100;
  const paddingB = 30;
  
  const data = dataset.monthlyVariance;
  const years = data.map(obj => obj.year);
  
  //THE DESCRIPTION
  d3.select("h3")
    .text(`${d3.min(years)} - ${d3.max(years)}: base temperature ${baseTemp} °C`);
  
  //THE SVG
  const svg = d3
    .select("#container")
    .append("svg")
    .attr("id", "mainSvg")
    .attr("height", h)
    .attr("width", w);
  
  //THE SCALES  
  const xScale = d3
    .scaleTime()
    .domain(d3.extent(years))
    .range([paddingLR, w - paddingLR]);
  //The months array is for actual scaling
  const months = Array(12).fill(1).map((v, i) => i + 1);
  //monthsDates is for the tick values
  const monthsDates = months.map((v, i) => new Date().setMonth(i));
  //The scale for displaying the y axis
  const yAxisScale = d3
    .scaleBand()
    .domain(monthsDates)
    .range([paddingB, h - paddingB]);
  //The scale to do actual scaling 
  const yScale = d3
    .scaleBand()
    .domain(months)
    .range(yAxisScale.range());
  
  //THE AXES
  const xAxis = d3.axisBottom(xScale).tickFormat(d3.format("d"));  
  svg.append("g")
     .attr("id", "x-axis")
     .attr("transform", `translate(0, ${h - paddingB})`)
     .call(xAxis);
  
  const yAxis = d3.axisLeft(yAxisScale)
                  .tickValues(yAxisScale.domain())
                  .tickFormat(d3.timeFormat("%B"));
  svg.append("g")
     .attr("id", "y-axis")
     .attr("transform", `translate(${paddingLR}, 0)`)
     .call(yAxis);
  
  //The cells
  const cellW = w / data.length * 12;
  const cellH = (h - paddingB * 2) / 12;
  
  const cells = svg
    .selectAll("rect")
    .data(data)
    .enter()
    .append("rect")
    .attr("class", "cell")
    .attr("data-year", d => d.year)
    .attr("data-month", d => d.month - 1)
    .attr("data-temp", d => d.variance + baseTemp)
    .attr("x", d => xScale(d.year) + 1)
    .attr("y", d => yScale(d.month))
    .attr("width", cellW)
    .attr("height", cellH)
    .attr("fill", d => threshold(d.variance + baseTemp));
  
  //THE TOOLTIPS
  const tooltip = d3
    .select("#container")
    .append("div")
    .attr("id", "tooltip");
  
  function handleMouseOver(evt, d) {
    const varn = Math.round(d.variance * 10) / 10; 
    const temp = Math.round((varn + baseTemp) * 10) / 10;
    
    tooltip
      .attr("data-year", d.year)
      .style("left", `${evt.pageX}px`)
      .style("top", `${evt.pageY}px`)
      .style("opacity", 1)
      .html(`<p>${d.year} - ${d3.timeFormat("%B")(monthsDates[d.month-1])}</p>
      <p>${temp} °C</p>
      <p>${varn} °C</p>`)
  }
  
  function handleMouseOut() {
    tooltip.style("opacity", 0);
  }
  
  cells
    .on("mouseover", handleMouseOver)
    .on("mouseout", handleMouseOut);
}           
                 