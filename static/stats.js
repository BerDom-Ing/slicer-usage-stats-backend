// Load required libraries and data
Promise.all([
    d3.csv('data.csv'),
    d3.json('world.geojson')
]).then(function([data, worldData]) {
    // Parse dates and create a numerical representation for crossfilter
    const parseDate = d3.timeParse("%Y-%m-%d");
    let expandedData = [];
    data.forEach(d => {
        d.date = parseDate(d.day);
        d.dateNum = d.date.getTime();
        const times = parseInt(d.times, 10);
        for (let i = 0; i < times; i++) {
            expandedData.push({ ...d });
        }
    });

    // Initialize Crossfilter
    const cf = crossfilter(expandedData);

    // Create dimensions
    const dateDim = cf.dimension(d => d.date);
    const moduleDim = cf.dimension(d => d.component);
    const functionDim = cf.dimension(d => d.event);
    const countryDim = cf.dimension(d => d.country_code);
    const cityDim = cf.dimension(d => d.city);

    function createSearchFunction(dimension, chart) {
        return function() {
            const searchBox = this;
            const searchTerm = searchBox.value.toLowerCase();
            const originalGroup = dimension.group();
            
            // Clear previous filters
            dimension.filterAll();
            
            if (searchTerm !== '') {
                // Get matching keys based on search term
                const matchingKeys = originalGroup.all()
                    .filter(item => item.key.toLowerCase().includes(searchTerm))
                    .map(item => item.key);
                
                if (matchingKeys.length > 0) {
                    // Apply dimension filter to affect all charts
                    dimension.filterFunction(d => matchingKeys.includes(d));
                    
                    // Create filtered group that only shows matching items
                    const filteredGroup = {
                        all: function() {
                            return originalGroup.all().filter(d => matchingKeys.includes(d.key));
                        }
                    };
                    
                    // Update chart to use filtered group
                    chart.group(filteredGroup);
                }
            } else {
                // Reset to original group when search is cleared
                chart.group(originalGroup);
            }
            
            // Redraw all charts to reflect the new filter
            dc.redrawAll();
            updateMap();
        }
    }
    // Create groups
    const dateGroup = dateDim.group(d3.timeDay);
    const moduleGroup = moduleDim.group().reduceCount();
    const functionGroup = functionDim.group().reduceCount();
    const countryGroup = countryDim.group().reduceCount();
    const cityGroup = cityDim.group().reduceCount();

    // Set up the charts
    const timeChart = dc.barChart("#time-chart");
    const moduleChart = dc.rowChart("#module-chart");
    const functionChart = dc.rowChart("#function-chart");
    const cityChart = dc.barChart("#city-chart");

    // Time chart
    timeChart
        .width(800)
        .height(200)
        .margins({top: 10, right: 10, bottom: 20, left: 40})
        .dimension(dateDim)
        .group(dateGroup)
        .x(d3.scaleTime().domain(d3.extent(data, d => d.date)))
        .round(d3.timeDay.round)
        .xUnits(d3.timeDays)
        .elasticY(true)
        .renderHorizontalGridLines(true)
        .brushOn(true);


// Module chart
moduleChart
    .width(280)  // Slightly smaller to account for scrollbar
    .height(function() {
        const itemCount = moduleGroup.all().length;
        const barAndGapHeight = 33; // 30px bar + 3px gap
        return itemCount * barAndGapHeight + 40; // 40 for top/bottom margins
    })
    .margins({top: 20, left: 10, right: 10, bottom: 20})
    .dimension(moduleDim)
    .group(moduleGroup)
    .elasticX(true)
    .ordering(d => -d.value)
    .title(d => `${d.key}: ${d.value}`)
    .fixedBarHeight(30)  // Add fixed height for each bar
    .gap(3)  // Space between bars
    .on('renderlet', function(chart) {
        chart.selectAll('g.row text')
            .style('fill', 'black');
    });
    moduleChart.filterHandler((dimension, filters) => {
        dimension.filter(null);
        if (filters.length) dimension.filterFunction(d => filters.includes(d));
        return filters;
    });

// Function chart (same modifications)
functionChart
    .width(280)
    .height(function() {
        const itemCount = functionGroup.all().length;
        const barAndGapHeight = 33; // 30px bar + 3px gap
        return itemCount * barAndGapHeight + 40; // 40 for top/bottom margins
    })
    .margins({top: 20, left: 10, right: 10, bottom: 20})
    .dimension(functionDim)
    .group(functionGroup)
    .elasticX(true)
    .ordering(d => -d.value)
    .title(d => `${d.key}: ${d.value}`)
    .fixedBarHeight(30)
    .gap(3)
    .on('renderlet', function(chart) {
        chart.selectAll('g.row text')
            .style('fill', 'black');
    });
    functionChart.filterHandler((dimension, filters) => {
        dimension.filter(null);
        if (filters.length) dimension.filterFunction(d => filters.includes(d));
        return filters;
    });

    // City chart
    cityChart
    .width(400)
    .height(300)
    .margins({top: 20, right: 20, bottom: 100, left: 40})
    .dimension(cityDim)
    .group(cityGroup)
    .x(d3.scaleBand())
    .xUnits(dc.units.ordinal)
    .elasticY(true)
    .ordering(d => -d.value)
    .renderHorizontalGridLines(true)
    .on('renderlet', function(chart) {
        chart.selectAll('g.x text')
            .attr('transform', 'translate(-10,10) rotate(270)');
    });    

    dc.renderAll();

    // World Map
    const width = 800;
    const height = 400;

    const svg = d3.select("#map-chart")
        .append("svg")
        .attr("width", width)
        .attr("height", height);

    const projection = d3.geoMercator()
        .scale(100)
        .center([0,20])
        .translate([width / 2, height / 2]);

    const path = d3.geoPath().projection(projection);

    const colorScale = d3.scaleThreshold()
        .domain([1, 5, 10, 20, 50, 100])
        .range(d3.schemeBlues[7]);

    function updateMap() {
        const countryData = countryGroup.all().reduce((acc, d) => {
            acc[d.key] = d.value;
            return acc;
        }, {});
    
        const currentFilter = countryDim.currentFilter();
        const selectedCountries = currentFilter ? (Array.isArray(currentFilter) ? currentFilter : [currentFilter]) : [];
    
        svg.selectAll("path")
            .data(worldData.features)
            .join("path")
            .attr("d", path)
            .attr("fill", d => {
                const count = countryData[d.id] || 0;
                return colorScale(count);
            })
            .attr("stroke", d => selectedCountries.includes(d.id) ? "rgb(220, 68, 68)" : "#fff")
            .attr("stroke-width", d => selectedCountries.includes(d.id) ? 2 : 0.5)
            .on("click", function(event, d) {
                const country = d.id;
                if (selectedCountries.includes(country)) {
                    countryDim.filterAll(); // Clear the filter if it's already applied
                } else {
                    countryDim.filter(country);
                }
                dc.redrawAll();
                updateMap();
            })
            .on("mouseover", function(event, d) {
                if (!selectedCountries.includes(d.id)) {
                    d3.select(this).attr("stroke", "black").attr("stroke-width", 1.5);
                }
                const count = countryData[d.id] || 0;
                d3.select("#tooltip")
                    .style("opacity", 1)
                    .html(`${d.id}: ${count}`)
                    .style("left", (event.pageX + 10) + "px")
                    .style("top", (event.pageY - 15) + "px");
            })
            .on("mouseout", function(event, d) {
                if (!selectedCountries.includes(d.id)) {
                    d3.select(this).attr("stroke", "#fff").attr("stroke-width", 0.5);
                }
                d3.select("#tooltip").style("opacity", 0);
            });
    }

    document.getElementById('module-search').addEventListener('input', createSearchFunction(moduleDim, moduleChart));
    document.getElementById('function-search').addEventListener('input', createSearchFunction(functionDim, functionChart));

    // Add reset button
    d3.select('#reset-button')
    .on('click', function() {
        dc.filterAll();
        countryDim.filterAll();
        cityDim.filterAll();
        
        // Clear search boxes
        document.getElementById('module-search').value = '';
        document.getElementById('function-search').value = '';

        moduleChart.group(moduleGroup);
        functionChart.group(functionGroup);
        
        dc.renderAll();
        updateMap();
    });



    // Update map when any chart is filtered
    function onFiltered() {
        updateMap();
    }

    timeChart.on("filtered", onFiltered);
    moduleChart.on("filtered", onFiltered);
    functionChart.on("filtered", onFiltered);
    cityChart.on("filtered", onFiltered);
});