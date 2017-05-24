document.addEventListener('DOMContentLoaded', function(){
  /*
  Global variables
  */
  // The new data to update the charts, based on user interaction
  var updateData;
  // An object that holds the current max values for each institution
  var maxPoints;
  // the number of periods for the financial model
  var numPeriods = 72;
  // The three variable components for the financial model
  var variables = {
    sd: parseInt($('input[name="starting_deposit"]').val().replace(/,/g, '')),
    mbr: parseInt($('input[name="monthly_burn_rate"]').val().replace(/,/g, '')),
    moc: parseInt($('.input-stepper input').val())
  };
  // The interest rates for the three institutions
  var rates = {
    treasure: 1.15,
    community: .75,
    insitutional: .25
  };
  // An array of time units to be used in the financial model
  // Also used for building the x-axis
  periods = [];
  for (var i=0; i<=numPeriods; i++) {
    periods.push(i);
  }

  /*
  DOM Events
  */
  // Bind change event to starting deposit text box
  $('input[name="starting_deposit"]').change(function(event) {
    var sdVal = parseInt($(this).val().replace(/,/g, ''));
    variables.sd = sdVal;
    $('input.starting_deposit_slider').val(sdVal).change();
    updateData = genData();
    drawChart(updateData);
  });
  // Bind change event to monthly burn rate text box
  $('input[name="monthly_burn_rate"]').change(function(event) {
    var mbrVal = parseInt($(this).val().replace(/,/g, ''));
    variables.mbr = mbrVal;
    $('input.monthly_burn_rate_slider').val(mbrVal).change();
    updateData = genData();
    drawChart(updateData);
  });
  // Bind change event to starting 'months of operating capital' text box
  $('.input-stepper input').change(function() {
    variables.moc = parseInt($(this).val().replace(/,/g, ''));
    updateData = genData();
    drawChart(updateData);
  });

  $('input.starting_deposit_slider').rangeslider({
    polyfill: false,
    onInit:function(){
      $('starting_deposit_value').val($('input.starting_deposit_slider').val());
    },
    onSlide:function(position, value){
      $('.starting_deposit_value').val(addCommas(value));
      // On slide event, update variables, generate new data, and update chart
      variables.sd = value;
      updateData = genData();
      drawChart(updateData);
    },
    onSlideEnd: function(position, value) {
    }
  });

  $('input.monthly_burn_rate_slider').rangeslider({
    polyfill: false,
    onInit:function(){
      $('monthly_burn_rate_value').val($('input.monthly_burn_rate_slider').val());
    },
    onSlide:function(position, value){
      //console.log('onSlide');
      //console.log('position: ' + position, 'value: ' + value);
      $('.monthly_burn_rate_value').val(addCommas(value));
      // On slide event, update variables, generate new data, and update chart
      variables.mbr = value;
      updateData = genData();
      drawChart(updateData);
    },
    onSlideEnd: function(position, value) {
    }
  });

  $('input.starting_deposit_value').mask('000,000,000,000', {reverse: true});
  $('input.monthly_burn_rate_value').mask('000,000,000,000', {reverse: true});

  $('.input-stepper').inputStepper();

  $('a[href*="#"]')
  // Remove links that don't actually link to anything
  .not('[href="#"]')
  .not('[href="#0"]')
  .click(function(event) {
    // On-page links
    if (
      location.pathname.replace(/^\//, '') == this.pathname.replace(/^\//, '')
      &&
      location.hostname == this.hostname
    ) {
      // Figure out element to scroll to
      var target = $(this.hash);
      target = target.length ? target : $('[name=' + this.hash.slice(1) + ']');
      // Does a scroll target exist?
      if (target.length) {
        // Only prevent default if animation is actually gonna happen
        event.preventDefault();
        $('html, body').animate({
          scrollTop: target.offset().top
        }, 200, function() {
        });
      }
    }
  });

  /*
  Chart events
  */
  // Add window resize event to make chart responsive
  d3.select(window).on('resize', resize); 
  /* 
  Bind hover events to legend items and area PATHs on chart
  The first function is bound to start of hover (mousein)
  The second function is bound to end of hover (mouseout)
  Adds/removes classes to <li>, <path> and <area> elements
  */
  $('.legend li').hover( function(e) { 
    thisInst = $(this).attr('id');
    for (var inst in rates) { 
      if (thisInst != inst) {
        $('.legend #' + inst).addClass('dim-text');
        //document.querySelector('path.area.' + inst).classList.add('dim-area');
        //document.querySelector('path.line.' + inst).classList.add('dim-line');
        d3.selectAll('path.area.' + inst).classed('dim-area', true);
        d3.selectAll('path.line.' + inst).classed('dim-line', true);
      } else {
        d3.selectAll('path.line.' + inst).classed('highlight-line', true);
      }
    }
  }, function(e) {
    $('.legend li').removeClass('dim-text');
    thisInst = $(this).attr('id');
    for (var inst in rates) { 
      if (thisInst != inst) {
        //document.querySelector('path.area.' + inst).classList.remove('dim-area');
        //document.querySelector('path.line.' + inst).classList.remove('dim-line');
        d3.selectAll('path.area.' + inst).classed('dim-area', false);
        d3.selectAll('path.line.' + inst).classed('dim-line', false);
      } else {
        //document.querySelector('path.line.' + inst).classList.remove('highlight-line');
        d3.selectAll('path.line.' + inst).classed('highlight-line', false);
      }
    }
  });

  /*
  Financial Model
  */
  // The function to calculate compounding interest
  var financialFunction = function(sd, mbr, moc, rate, i) {
    var P = sd,
      C = mbr,
      n = numPeriods,
      t = i/12,
      r = rate/100,
      body = 1 + r/n,
      exponent = n * t;
    //return P + Math.pow(P, rate*i/72);)
    //console.log('i:', i, 'body:', body, 'exponent:', exponent, 'right:', Math.pow(body, exponent));
    return (P + C) * Math.pow(body, exponent);
  }

  /*
  Generate data for the chart based on variables in financial model
  chartdata is an Object in the format:
  {
  'treasure': [{'date': d, 'y': y}, {...}], 
  'community': [{'date': d, 'y': y}, {...}], 
  'insitutional': [{'date': d, 'y': y}, {...}]
  }
  */
  var genData = function() {  
    var chartData = {};
    for (var inst in rates) {
      chartData[inst] = [];
      var rate = rates[inst];
      for (i=0;i<periods.length;i++) {
        chartData[inst].push({
          date: periods[i],
          y: financialFunction(variables.sd, variables.mbr, variables.moc, rate, i)
        });
      }
    };
    return chartData;
  };

  /*
  Parameters for the chart
  */
  // Setup dimensions for the chart
  var w = parseInt(d3.select('div.chart').style('width'), 10), //700, //100%
    h = 320;    //320px
  var margin = {top: 20, right: 100, bottom: 45, left: 50},
    width = w - margin.left - margin.right,
    height = h - margin.top - margin.bottom;
  // x and y functions return pixel (chart) values for data values
  var x = d3.scale.linear()
    .range([0, width])
    .nice();
  var y = d3.scale.linear()
    .range([height, 0])
    .nice();
  // xAxis and yAxis create axes on the chart
  var xAxis = d3.svg.axis()
    .scale(x)
    .orient(function(d, i) {
      console.log("x axis tick:", d, i);
      return 'bottom';
    })
    //.tickValues([0,.33,.66,1])
    .tickFormat(function(d, i) {
      console.log("x axis tick:", d, i);
      switch(d) {
        case 0: 
          return 'Today';
          break;
        case .3:
        case 30:
          return'Two Years';
          break;
        case .6:
        case 50:
          return'Four Years';
          break;
        case 1:
        case 70:
          return'Six Years';
          break;
        default: return;
      } 
    });
  var yAxis = d3.svg.axis()
    .scale(y)
    .orient('right');
  // area function creates areal fill under the line
  var area = d3.svg.area()
    .interpolate("basis") 
    .x(function(d) { return x(d.date); })
    .y0(height)
    .y1(function(d) { return y(d.y); });
  // line function draws line for each institution
  var line = d3.svg.line()
    .interpolate("basis") 
    .x(function(d) { return x(d.date); })
    .y(function(d) { return y(d.y); });
  // initialize SVG  and G elements as chart containers
  var svg = d3.select('#d3chart').append('svg')
    .attr('width', width + margin.left + margin.right)
    .attr('height', height + margin.top + margin.bottom);
  chart = svg.append('g')
    .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');
  // add SVG definitions for linear gradient shading
  var svgDefs = svg.append('defs');
  var treasureGradient = svgDefs.append('linearGradient')
    .attr('id', 'treasure-gradient')
    .attr('gradientUnits', 'userSpaceOnUse')
    .attr('x1', x(x.domain()[1]))
    .attr('x2', x(x.domain()[1]))
    .attr('y1', y(y.domain()[0]));
  treasureGradient
    .append('stop')
    .attr('class', 'treasure-stop-left')
    .attr('offset', '0%');
  treasureGradient
    .append('stop')
    .attr('class', 'treasure-stop-right')
    .attr('offset', '90%');
  var communityGradient = svgDefs.append('linearGradient')
    .attr('id', 'community-gradient')
    .attr('gradientUnits', 'userSpaceOnUse')
    .attr('x1', x(x.domain()[1]))
    .attr('x2', x(x.domain()[1]))
    .attr('y1', y(y.domain()[0]));
  communityGradient
    .append('stop')
    .attr('class', 'community-stop-left')
    .attr('offset', '0%');
  communityGradient
    .append('stop')
    .attr('class', 'community-stop-right')
    .attr('offset', '90%');
  var institutionalGradient = svgDefs.append('linearGradient')
    .attr('id', 'institutional-gradient')
    .attr('gradientUnits', 'userSpaceOnUse')
    .attr('x1', x(x.domain()[1]))
    .attr('x2', x(x.domain()[1]))
    .attr('y1', y(y.domain()[0]));
  institutionalGradient
    .append('stop')
    .attr('class', 'institutional-stop-left')
    .attr('offset', '0%');
  institutionalGradient
    .append('stop')
    .attr('class', 'institutional-stop-right')
    .attr('offset', '90%');
  // create an Object of gradients
  var gradients = {
    'treasure' : treasureGradient,
    'community' : communityGradient,
    'institutional': institutionalGradient
  };
  // create a grouping for the x axis and build the axis
  var x_axis = chart.append('g')
    .attr('class', 'x axis')
    .attr('transform', 'translate(0,' + height + ')')
    .call(xAxis);
  // create a grouping for the y axis and build the axis
  var y_axis = chart.append('g')
    .attr('class', 'y axis')
    .attr('transform', 'translate(' + width + ',0)')
    .call(yAxis);
  // create groupings for area and line paths for each institution
  var areaPaths = {},
    linePaths = {};
  for (inst in rates) {
    areaPaths[inst] = chart.append('g').attr('class', 'area-path ' + inst);
    linePaths[inst] = chart.append('g').attr('class', 'line-path ' + inst);
  }
  // create groupings for endpoints and text labels on x axis
  var endpoints = chart.append('g')
    .attr('class', 'endpoints');
  var text = chart.append('g')
    .attr('class', 'text-labels');

  // one function to draw initial chart and update chart as the data changes
  var drawChart = function(chartData) {
    // initialize and update x and y domain
    setDomainLimits(chartData);
    maxPoints = [];
    // iterate through each institution and create lines and areas on chart for each
    for (var inst in chartData) {
      var d = chartData[inst]
      maxPoints.push( {
        inst: inst,
        date: d[d.length - 1].date,
        y: d[d.length - 1].y
      });
      // initialize and update y2 component of vertical line for linear gradient
      /*maxPoints.forEach(function(grad) { 
        console.log('grad:', grad, inst, grad.inst,gradients[inst])
        if (inst == grad.inst) {
          gradients[inst].attr('y2', y(grad.y));
        }
      }); */
      if (inst == 'treasure') {
        treasureGradient.attr('y2', y(maxPoints[0].y))
      } else if (inst == 'community') {
        communityGradient.attr('y2', y(maxPoints[1].y))
      } else {
        institutionalGradient.attr('y2', y(maxPoints[2].y))
      }

      ap = areaPaths[inst].selectAll('path').data([d]);
      ap
        .attr('class', function(d) { return 'area ' + inst; })
        .attr('d', area);
      ap.enter()
        .append('path')
        .attr('class', function(d) { return 'area ' + inst; })
        .attr('d', area);
      ap.exit().remove();

      lp = linePaths[inst].selectAll('path').data([d]);
      lp
        .attr('class', function(d) { return 'line ' + inst; })
        .attr('d', line);
      lp.enter()
        .append('path')
        .attr('class', function(d) { return 'line ' + inst; })
        .attr('d', line);
      lp.exit().remove();
    }
    // Add endpoints to the final (max) values for each institution
    ep  = endpoints.selectAll('.endpoint').data(maxPoints);
    ep
      .attr('class', function(d) { return 'endpoint ' + d.inst; })
      .attr('cx', function(d,i) { return x(d.date); })
      .attr('cy', function(d,i) { return y(d.y); })
      .attr('r', function(d,i) { return 6; });
    ep
      .enter()
      .append('circle')
      .attr('class', function(d) { return 'endpoint ' + d.inst; })
      .attr('cx', function(d,i) { return x(d.date); })
      .attr('cy', function(d,i) { return y(d.y); })
      .attr('r', function(d,i) { return 6; });
    ep.exit().remove();

    // Add text labels to the endpoints
    t = text.selectAll('text').data(maxPoints);
    t
      .attr('x', function(d,i) { return x(d.date) + 10; })
      .attr('y', function(d,i) { return y(d.y) + 4; })
      .text( function (d,i) { return '$' + parseInt(d.y).toLocaleString(); });
    t
      .enter()
      .append('text')
      .attr('x', function(d,i) { return x(d.date) + 10; })
      .attr('y', function(d,i) { return y(d.y) + 4; })
      .text( function (d,i) { return '$' + parseInt(d.y).toLocaleString(); });
    t.exit().remove();

    // Remove x and y axis ticks
    d3.selectAll('.y.axis .tick').remove();
    d3.selectAll('.x.axis .tick line').remove();
    // add class to ticks
    d3.selectAll('.x.axis g.tick')
      .select('text')
      .style('text-anchor', function(d) { 
        console.log(d);
        switch(d) {
          case 0.6:
            return 'start';
            break;
          case 30:
            return 'end';
            break;
          default:
            return 'middle';
        }
      });
  };

  /*
  Chart helper functions
  */
  // function to compute the initial and updated domain limits for the chart
  // this changes as the data changes
  function setDomainLimits(dl) {
    var domainLimits = {
      min_x: 300012,
      max_x: 0,
      min_y: 6000000,
      max_y: 0
    };

    for (inst in dl) {
      var dateArray = dl[inst].map(function(e) {
        return parseInt(e.date);
      });
      //console.log('date array:', dateArray);
      var yArray = dl[inst].map(function(e) {
        return e.y;
      });
      //console.log(yArray);
      var thisDateMin = Math.min.apply(null,dateArray),
        thisDateMax = Math.max.apply(null,dateArray),
        thisYMin = Math.min.apply(null,yArray),
        thisYMax = Math.max.apply(null,yArray);

      if (thisDateMin < domainLimits.min_x) {
        domainLimits.min_x = thisDateMin;
      }
      if (thisDateMax > domainLimits.max_x) {
        domainLimits.max_x = thisDateMax;
      }
      if (thisYMin < domainLimits.min_y) {
        domainLimits.min_y = thisYMin;
      }
      if (thisYMax > domainLimits.max_y) {
        domainLimits.max_y = thisYMax;
      }
    };
    //console.log(domainLimits);
    x.domain([domainLimits.min_x, domainLimits.max_x]);
    //y.domain([domainLimits.min_y, 6000000]);
    y.domain([domainLimits.min_y, domainLimits.max_y + 50000]);
  }

  // resize the chart when window is resized
  function resize() {
    // update width
    var w = parseInt(d3.select('div.chart').style('width'), 10);
      //h = 320; //parseInt(d3.select('div.chart').style('height'), 10);
    width = w - margin.left - margin.right;
    //height = h - margin.top - margin.bottom;
    // resize the chart
    d3.select(chart.node().parentNode)
      .attr('width', width + margin.left + margin.right);
      //.attr('height', height + margin.top + margin.bottom);
    x.range([0, width]);
    //y.range([height, 0]);
    chart.select('.x.axis')
      .call(xAxis);
    // Fix ticks!!!!
    //d3.selectAll('.x.axis g.tick')
    //  .attr('class', function(d,i) { return 'tick_' + d; });
    /*d3.selectAll('.x.axis g.tick')
      .filter(function(d){ return d==30; } )
      .select('text')
      .style('text-anchor', 'end');*/
    
    //xAxis
    //  .scale(x)
    //  .tickValues([0,.33,.66,1]);
    //chart.select('.y.axis')
    //  .call(yAxis);
    // redraw the chart
    drawChart(updateData);
  }

  /*
  Initialize the chart
  */
  var updateData = genData();
  drawChart(updateData); 

});


$(function () {
  $('#subForm').submit(function (e) {
    e.preventDefault();
    $.getJSON(
    this.action + "?callback=?",
    $(this).serialize(),
    function (data) {
      if (data.Status === 400) {
        $('#subForm').fadeOut();
        $('#message').append('Thanks! We will be in touch when we\'re ready for users.');
      } else { // 200
          alert(data.Message);
      }
    });
  });
});

/* script.js */
addCommas = function(input){
  // If the regex doesn't match, `replace` returns the string unmodified
  return (input.toString()).replace(
    // Each parentheses group (or 'capture') in this regex becomes an argument
    // to the function; in this case, every argument after 'match'
    /^([-+]?)(0?)(\d+)(.?)(\d+)$/g, function(match, sign, zeros, before, decimal, after) {

      // Less obtrusive than adding 'reverse' method on all strings
      var reverseString = function(string) { return string.split('').reverse().join(''); };

      // Insert commas every three characters from the right
      var insertCommas  = function(string) {

        // Reverse, because it's easier to do things from the left
        var reversed           = reverseString(string);

        // Add commas every three characters
        var reversedWithCommas = reversed.match(/.{1,3}/g).join(',');

        // Reverse again (back to normal)
        return reverseString(reversedWithCommas);
      };

      // If there was no decimal, the last capture grabs the final digit, so
      // we have to put it back together with the 'before' substring
      return sign + (decimal ? insertCommas(before) + decimal + after : insertCommas(before + after));
    }
  );
};