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



document.addEventListener('DOMContentLoaded', function(){
});

$(function () {
  // Document ready
  $('input[name="starting_deposit"').change(function(event) {
    variables.sd = parseInt($(this).val().replace(',', ''));
    updateData = genData();
    drawChart(updateData);
  });
  $('input[name="monthly_burn_rate"').change(function(event) {
    variables.mbr = parseInt($(this).val().replace(',', ''));
    updateData = genData();
    drawChart(updateData);
  });
  $('.input-stepper input').change(function() {
    variables.moc = parseInt($(this).val().replace(',', ''));
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
      variables.sd = value;
      updateData = genData();
      drawChart(updateData);
    },
    onSlideEnd: function(position, value) {
      //variables.sd = value;
      //console.log(variables,value);
      //updateData = genData();
      //drawChart(updateData);
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
      variables.mbr = value;
      updateData = genData();
      drawChart(updateData);
    },
    onSlideEnd: function(position, value) {
      //variables.mbr = value;
      //updateData = genData();
      //(updateData);
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
  $('.legend li').hover( function(e) { 
    thisInst = $(this).attr('id');
    for (var inst in rates) { 
      if (thisInst != inst) {
        $('.legend #' + inst).addClass('dim-text');
        document.querySelector('path.area.' + inst).classList.add('dim-area');
        document.querySelector('path.line.' + inst).classList.add('dim-line');
      } else {
        document.querySelector('path.line.' + inst).classList.add('highlight-line');
      }
    }
  }, function(e) {
    $('.legend li').removeClass('dim-text');
    thisInst = $(this).attr('id');
    for (var inst in rates) { 
      if (thisInst != inst) {
        document.querySelector('path.area.' + inst).classList.remove('dim-area');
        document.querySelector('path.line.' + inst).classList.remove('dim-line');
      } else {
        document.querySelector('path.line.' + inst).classList.remove('highlight-line');
      }
    }
  });
});

var variables = {
  sd: parseInt($('input[name="starting_deposit"').val().replace(',', '')),
  mbr: parseInt($('input[name="monthly_burn_rate"').val().replace(',', '')),
  moc: parseInt($('.input-stepper input').val().replace(',', ''))
};
var rates = {
  treasure: 1.15,
  community: .75,
  banks: .25
};
var updateData;

periods = [];
for (var i=0; i<72; i++) {
  periods.push(i);
}
//console.log(periods);
/*for (var i=0; i < 3; i++) { 
  var year = String(2017 + i);
  for (var j = 1; j < 13; j++) { 
    var month = j < 10 ? '0' + String(j) : j;
    periods.push(year+month); 
  } 
}*/

var financialFunction = function(sd, mbr, moc, rate, i) {
  //return (Math.pow(sd, rate) * i - mbr) ;
  var P = sd,
    n = 72,
    t = i/12,
    r = rate/100,
    body = 1 + r/n,
    exponent = n * t;
  return (P + mbr) * Math.pow(body, exponent);
}

var genData = function() {  
  console.log(variables);
  var chartData = {};
  for (var inst in rates) {
    chartData[inst] = [];
    var rate = rates[inst],
      accrued = variables.sd;
    for (i=0;i<periods.length;i++) {
      // eventually convert this to date
      //items.date.push(dateFormat.parse(periods[i]));
      //var items = {};
      //items.date = periods[i];
      //items.y = financialFunction(variables.sd, variables.mbr, variables.moc, rate, i);
      //items.y = (variables.sd - variables.mbr) * (Math.pow(i,2) * rates[rate]);
      chartData[inst].push({
        date: periods[i],
        y: financialFunction(variables.sd, variables.mbr, variables.moc, rate, i)
      });
      //console.log(financialFunction(variables.sd, variables.mbr, variables.moc, rate, i));
    }
  };
  return chartData;
};
 
var w = 700,
  h = 320;
var margin = {top: 20, right: 20, bottom: 45, left: 50},
  width = w - margin.left - margin.right,
  height = h - margin.top - margin.bottom;
var dateFormat = d3.time.format('%Y%m');

// Eventually convert this to date scale
//var x = d3.time.scale()
//    .range([0, width]);
var x = d3.scale.linear()
  .range([0, width])
  .nice();

var y = d3.scale.linear()
  .range([height, 0])
  .nice();

var xAxis = d3.svg.axis()
  .scale(x)
  .orient('bottom')
  .tickFormat(function(d, i) {
    //console.log("x axis tick:", d);
    switch(d) {
      case 0: 
        return 'Today';
        break;
      case 0.3: 
        return'One Year';
        break;
      case 0.6: 
        return'Two Years';
        break;
      case 1: 
        return'Three Years';
        break;
      default: return;
    }
  });

var yAxis = d3.svg.axis()
  .scale(y)
  .orient('right');

var area = d3.svg.area()
  .interpolate("basis") 
  .x(function(d) { return x(d.date); })
  .y0(height)
  .y1(function(d) { return y(d.y); });

var line = d3.svg.line()
  .interpolate("basis") 
  .x(function(d) { return x(d.date); })
  .y(function(d) { return y(d.y); });

var svg = d3.select('#d3chart').append('svg')
  .attr('width', width + margin.left + margin.right)
  .attr('height', height + margin.top + margin.bottom)
  .append('g')
  .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

svg.append('g')
  .attr('class', 'x axis')
  .attr('transform', 'translate(0,' + height + ')')
  .call(xAxis);
d3.selectAll('.x.axis g.tick')
  .filter(function(d){ return d==0 || d == 1;} )
  .select('text')
  .style('text-anchor', 'end');
d3.selectAll('.x.axis g.tick')
  .filter(function(d){ return d==0.3 || d == 0.6;} )
  .select('text')
  .style('text-anchor', 'start');

svg.append('g')
  .attr('class', 'y axis')
  .attr('transform', 'translate(' + width + ',0)')
  .call(yAxis);

var areaPaths = {},
  linePaths = {};

for (inst in rates) {
  areaPaths[inst] = svg.append('g').attr('class', 'area-path ' + inst);
  linePaths[inst] = svg.append('g').attr('class', 'line-path ' + inst);
}
var endpoints = svg.append('g')
  .attr('class', 'endpoints');

var text = svg.append('g')
  .attr('class', 'text-labels');

var setDomainLimits = function(dl) {
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
    console.log(dateArray);
    var yArray = dl[inst].map(function(e) {
      return e.y;
    });
    console.log(yArray);
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
  console.log(domainLimits);
  x.domain([domainLimits.min_x, domainLimits.max_x]);
  y.domain([domainLimits.min_y, domainLimits.max_y]);
}


var drawChart = function(chartData) {
  setDomainLimits(chartData);
  var maxPoints = [];
  for (var inst in chartData) {
    var d = chartData[inst],
      lastIndex = d.length - 1;
    maxPoints.push( {
      inst: inst,
      date: d[d.length - 1].date,
      y: d[d.length - 1].y
    });

    if (inst != 'banks111') {
      ap = areaPaths[inst].selectAll('path').data([d]);
      ap
        .attr('class', function(d) { return 'area ' + inst; })
        .attr('d', area);
      ap.enter()
        .append('path')
        .attr('class', function(d) { return 'area ' + inst; })
        .attr('d', area);
      ap.exit().remove();

      /*svg.append('path')
        .data([d])
        .attr('class', function(d) { return 'area ' + inst; })
        .attr('d', area); */

      lp = linePaths[inst].selectAll('path').data([d]);
      lp
        .attr('class', function(d) { return 'line ' + inst; })
        .attr('d', line);
      lp.enter()
        .append('path')
        .attr('class', function(d) { return 'line ' + inst; })
        .attr('d', line);
      lp.exit().remove();

      /*svg.append('path')
        .data([d])
        .attr('class', function(d) { return 'line ' + inst; })
        .attr('d', line);*/

      /*svg.selectAll('.circle')
        .data(d)
        .enter().append('circle')
        .attr('class', function(d) { return 'endpoint_' + inst; })
        .attr('cx', function(d,i) { if (i == lastIndex) { return x(d.date); } else return; })
        .attr('cy', function(d,i) { if (i == lastIndex) { return y(d.y); } else return; })
        .attr('r', function(d,i) { if (i == lastIndex) { return 6; } else return 0; })

      var text = svg.selectAll('circle')
        .data(d)
        .enter()
        .append('text');
      var textLabels = text
        .attr('x', function(d,i) { if (i == lastIndex) { return x(d.date) - 10; } else return; })
        .attr('y', function(d,i) { if (i == lastIndex) { return y(d.y); } else return; })
        .attr('text-anchor', 'end')
        .text( function (d,i) { if (i == lastIndex) { return '$' + addCommas(parseInt(d.y)); } else return; }); */
    }
  }
  console.log(maxPoints);
  //var endpoints = svg.append('g')
    //.attr('class', 'endpoints')
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

  t = text.selectAll('text').data(maxPoints);
  t
    .attr('x', function(d,i) { return x(d.date) - 10; })
    .attr('y', function(d,i) { return y(d.y); })
    .attr('text-anchor', 'end')
    .text( function (d,i) { return '$' + parseInt(d.y).toLocaleString(); });
  t
    .enter()
    .append('text')
    .attr('x', function(d,i) { return x(d.date) - 10; })
    .attr('y', function(d,i) { return y(d.y); })
    .attr('text-anchor', 'end')
    .text( function (d,i) { return '$' + parseInt(d.y).toLocaleString(); });
  t.exit().remove();

  /*var textLabels = text
    .attr('x', function(d,i) { return x(d.date) - 10; })
    .attr('y', function(d,i) { return y(d.y); })
    .attr('text-anchor', 'end')
    .text( function (d,i) { return '$' + addCommas(parseInt(d.y)); }); */
  // Remove y axis ticks
  d3.selectAll('.y.axis .tick').remove();
  d3.selectAll('.x.axis .tick line').remove();
};

var updateChart = function(updateData) {
  console.log('calling updatechart');
  setDomainLimits(updateData);
  for (var inst in updateData) {
    var lastIndex = updateData[inst].length - 1;
    console.log(inst,lastIndex);
    //for (var i in d) { d[i].y = d[i].y * 1.1; };

    if (inst != 'banks1111') {
      //svg.selectAll('path.area.' + inst).remove();
      /*var areas = svg.select('path.area.' + inst);
      areas
        .data([d])
        .attr('d', area);*/
      //console.log(areas);
      /*svg.append('path')
        .data([d])
        .attr('class', function(d) { return 'area ' + inst; })
        .attr('d', area);*/

      //svg.selectAll('path.line.' + inst).remove();
      var lines = svg.select('path.line.' + inst);
      lines
        .data([updateData[inst]])
        .attr('d', line);
      /*svg.append('path')
        .data([d])
        .attr('class', function(d) { return 'line ' + inst; })
        .attr('d', line);*/

      //svg.selectAll('.endpoint_' + inst).remove();
      svg.selectAll('.endpoint_' + inst)
        .data(updateData[inst])
        .attr('cx', function(d,i) { if (i == lastIndex) { return x(d.date); } else return; })
        .attr('cy', function(d,i) { if (i == lastIndex) { return y(d.y); } else return; })
        .attr('r', function(d,i) { if (i == lastIndex) { return 6; } else return 0; })
      /*svg.selectAll('.dot')
        .data(d)
        .enter().append('circle')
        .attr('class', function(d) { return 'endpoint_' + inst; })
        .attr('cx', function(d,i) { if (i == lastIndex) { return x(d.date); } else return; })
        .attr('cy', function(d,i) { if (i == lastIndex) { return y(d.y); } else return; })
        .attr('r', function(d,i) { if (i == lastIndex) { return 6; } else return 0; })*/
    }
  };
};

var data = genData();
//console.log(data);
drawChart(data); 

var chart;
chart = c3.generate({
  bindto: '#chart',
  data: {
    columns: [
      ['treasury', 5, 12, 25, 38, 53, 70, 82, 100, 128, 155, 170, 200],
      ['community', 5, 10, 21, 32, 44, 56, 69, 84, 97, 110, 128, 143],
      ['banks', 5, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 110]
    ],
    names: {
      treasury: 'Treasure',
      community: 'Community Banks',
      banks: 'Institutional Banks'
    },
    types: {
      'treasury': 'area-spline',
      'community': 'area-spline',
      'banks': 'area-spline'
    }
  },
  axis: {
    x: {
      show: false
    },
    y: {
      show: false
    }
  },
  tooltip: {
    show: false
  },
  point: {
    show: false
  },
  color: {
    pattern: ['#00c6f8', '#7ee4ed', '#a9beee']
  },
  padding: {
    bottom: 20
  }
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