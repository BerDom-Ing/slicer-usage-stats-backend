// Show loading spinner 
console.time('Total loading time');

// Function to update the loading status
function updateLoadingStatus(message) {
    const statusElement = document.getElementById('loading-status');
    if (statusElement) {
        statusElement.textContent = message;
    }
}

// Function to update the loading count
function updateLoadingCount(count) {
    const countElement = document.getElementById('loading-count');
    if (countElement) {
        countElement.textContent = `${count.toLocaleString()} rows loaded`;
    }
}

// Function to update the progress bar
function updateProgressBar(percent) {
    const progressFill = document.getElementById('progress-fill');
    const progressPercentage = document.getElementById('progress-percentage');
    
    if (progressFill && progressPercentage) {
        progressFill.style.width = `${percent}%`;
        progressPercentage.textContent = `${percent}%`;
    }
}

// Load data with progress tracking
Promise.all([
    new Promise((resolve) => {
        console.time('CSV loading time');
        
        // Use d3.csv with a row callback to track progress
        let rowCount = 0;
        let lastUpdateTime = Date.now();
        
        // Start with CSV loading message
        updateLoadingStatus('Loading CSV data...');
        
        d3.csv('random_usage_data.csv', function(d) {
            // This callback runs for each row
            rowCount++;
            
            // Update count every 10,000 rows or 500ms, whichever comes first
            const currentTime = Date.now();
            if (rowCount % 10000 === 0 || currentTime - lastUpdateTime > 500) {
                updateLoadingCount(rowCount);
                // Add estimated progress - assuming we'll have around 100,000 rows
                const estimatedProgress = Math.min(Math.round((rowCount / 100000) * 50), 50); // Max 50% for loading phase
                updateProgressBar(estimatedProgress);
                lastUpdateTime = currentTime;
            }
            
            return d;
        }).then(data => {
            console.timeEnd('CSV loading time');
            console.log(`Loaded ${data.length} rows total`);
            updateLoadingCount(data.length);
            resolve(data);
        });
    }),
    d3.json('world.geojson')
]).then(function([data, worldData]) {
    console.time('Data processing time');
    
    // Update loading status for processing phase
    updateLoadingStatus('Processing data...');
    
    // Parse dates and create a numerical representation for crossfilter
    const parseDate = d3.timeParse("%Y-%m-%d");
    
    // Process in batches to keep UI responsive
    const batchSize = 10000;
    const totalRows = data.length;
    let processedRows = 0;
    let expandedData = [];
    
    function processBatch() {
        // Update status with percentage progress
        const progressPercent = Math.round((processedRows / totalRows) * 100);
        updateLoadingStatus(`Processing data... ${progressPercent}%`);
        
        // Update the progress bar - processing phase takes the second 50%
        const totalProgress = 30 + Math.round((processedRows / totalRows) * 30);
        updateProgressBar(totalProgress);

        // Process a batch of data
        const endIdx = Math.min(processedRows + batchSize, totalRows);
        const batchStartTime = performance.now();
        
        for (let i = processedRows; i < endIdx; i++) {
            data[i].date = parseDate(data[i].day);
            data[i].dateNum = data[i].date.getTime();
            const times = parseInt(data[i].times, 10);
            
            for (let j = 0; j < times; j++) {
                expandedData.push({ ...data[i] });
            }
        }
        
        processedRows = endIdx;
        updateLoadingCount(processedRows);
        
        // Measure batch processing time
        const batchTime = performance.now() - batchStartTime;
        
        if (processedRows < totalRows) {
            // Use requestAnimationFrame for smoother UI updates
            requestAnimationFrame(() => {
                // Calculate optimal delay based on batch processing time
                // If batch was fast, use minimal delay; if slow, give more time for UI updates
                const delay = batchTime > 100 ? 50 : 5;
                setTimeout(processBatch, delay);
            });
        } else {
            updateLoadingStatus(`Processing complete. Preparing visualization for ${expandedData.length.toLocaleString()} data points...`);
            
            // Use requestAnimationFrame to ensure UI updates before heavy processing
            requestAnimationFrame(() => {
                // Short delay to ensure status message is displayed
                setTimeout(initializeCrossfilter, 100);
            });
        }
    }
    
    function initializeCrossfilter() {
        // Progress through visualization steps with UI updates
        const steps = [
            { message: 'Initializing data structures...', delay: 0 },
            { message: 'Creating crossfilter indices...', delay: 50 },
            { message: 'Building dimensions...', delay: 50 },
            { message: 'Rendering charts(this might take a while)...', delay: 50 }
        ];
        
        let stepIndex = 0;
        
        function processStep() {
            if (stepIndex < steps.length) {
                updateLoadingStatus(steps[stepIndex].message);
                
                // Calculate progress percentage for visualization steps (80-95%)
                // Each step gets an equal portion of the 80-95% range
                const stepProgress = 80 + Math.round((stepIndex / steps.length) * 15);
                // Update progress bar
                updateProgressBar(stepProgress);

                // Use requestAnimationFrame for smoother UI updates
                requestAnimationFrame(() => {
                    setTimeout(() => {
                        stepIndex++;
                        processStep();
                    }, steps[stepIndex].delay);
                });
            } else {
                // All steps complete, do the actual initialization
                performInitialization();
            }
        }
        
        // Function to handle search functionality
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
            };
        }
        
        function performInitialization() {
            updateLoadingStatus('Initializing visualization...');
            updateProgressBar(95); // Start at 95%
            console.log('Expanded data length:', expandedData.length);
            
            // Initialize Crossfilter
            console.time('Crossfilter initialization');
            const cf = crossfilter(expandedData);
            console.timeEnd('Crossfilter initialization');
            
            updateLoadingStatus('Creating chart dimensions...');
            updateProgressBar(96);
            
            // Allow UI to update before continuing with heavy operations
            requestAnimationFrame(() => {
                // Create dimensions
                const dateDim = cf.dimension(d => d.date);
                const moduleDim = cf.dimension(d => d.component);
                const functionDim = cf.dimension(d => d.event);
                const countryDim = cf.dimension(d => d.country_code);
                const cityDim = cf.dimension(d => d.city);
                
                updateLoadingStatus('Building chart groups...');
                updateProgressBar(97);
                
                // Allow UI to update again
                requestAnimationFrame(() => {
                    // Create groups
                    const dateGroup = dateDim.group(d3.timeDay);
                    const moduleGroup = moduleDim.group().reduceCount();
                    const functionGroup = functionDim.group().reduceCount();
                    const countryGroup = countryDim.group().reduceCount();
                    const cityGroup = cityDim.group().reduceCount();
                    
                    updateLoadingStatus('Rendering charts...');
                    updateProgressBar(98);

                    
                    // Set up the charts
                    const timeChart = dc.barChart("#time-chart");
                    const moduleChart = dc.rowChart("#module-chart");
                    const functionChart = dc.rowChart("#function-chart");
                    const cityChart = dc.barChart("#city-chart");
                    
                    // Time chart
                    timeChart
                        .width(function() { return document.querySelector("#time-chart").offsetWidth; })
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
                        .width(function() { return document.querySelector("#module-chart").offsetWidth; })
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
                        .width(function() { return document.querySelector("#function-chart").offsetWidth; })
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
                    const mapContainer = document.querySelector("#map-chart");
                    const width = mapContainer.offsetWidth;
                    const height = width * 0.5; // Maintain aspect ratio

                    const svg = d3.select("#map-chart")
                        .append("svg")
                        .attr("width", "100%")
                        .attr("height", height)
                        .attr("viewBox", `0 0 ${width} ${height}`)
                        .attr("preserveAspectRatio", "xMidYMid meet");

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
                    
                    // Initial map render
                    updateMap();
                    
                    // Set up event handlers
                    document.getElementById('module-search').addEventListener('input', createSearchFunction(moduleDim, moduleChart));
                    document.getElementById('function-search').addEventListener('input', createSearchFunction(functionDim, functionChart));
                    
                    // Update map when any chart is filtered
                    function onFiltered() {
                        updateMap();
                    }
                    
                    timeChart.on("filtered", onFiltered);
                    moduleChart.on("filtered", onFiltered);
                    functionChart.on("filtered", onFiltered);
                    cityChart.on("filtered", onFiltered);
                    
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
                    
                    window.addEventListener('resize', function() {
                        // Resize the charts
                        timeChart.width(document.querySelector("#time-chart").offsetWidth);
                        moduleChart.width(document.querySelector("#module-chart").offsetWidth);
                        functionChart.width(document.querySelector("#function-chart").offsetWidth);
                        
                        // For map, update the size
                        const mapContainer = document.querySelector("#map-chart");
                        const newWidth = mapContainer.offsetWidth;
                        const newHeight = newWidth * 0.5;
                        
                        svg.attr("width", "100%")
                            .attr("height", newHeight)
                            .attr("viewBox", `0 0 ${newWidth} ${newHeight}`);
                            
                        // Update projection to fit new dimensions
                        projection.translate([newWidth / 2, newHeight / 2]);
                        
                        // Redraw all charts
                        dc.renderAll();
                        updateMap();
                    }, 250);
                    
                    setTimeout(() => {
                        
                        document.getElementById('loading-spinner').style.display = 'none';
                        // Set progress to 100% when complete
                        updateProgressBar(100);
                        console.timeEnd('Total loading time');
                    }, 500);
                });
            });
        }
        
        // Start the step-by-step process
        processStep();
    }
    
    // Start the batch processing
    processBatch();
});