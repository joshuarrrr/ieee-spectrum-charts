/* jshint devel:true */
/* global Tabletop */
/* global d3 */
/* global pym */
(function () {
  'use strict';
  Tabletop.init( { 
      key: '1jJzPwjelCfRPbY49-L7R2gAo_uV0kRWQib9JAh2VnNg',
      callback: renderCharts
    } 
  );

  function renderCharts(sheets) {
    var data = sheets['Sheet1'];
    // console.log(data);
    
    function myData(data, filter) {
      /*
        Process data for nvd3 chart. You can optionally pass a filtering function to filter the array.
        But by default all data points are included. 
      */
      
      filter = typeof filter !== 'undefined' ? filter : function(d) { return d; };

      var series1 = [];
      var series2 = [];
      var series3 = [];
      for(var i = 0; i < data.length; i ++) {
        series1.push({
          x: +data[i]['year'], 
          y: +data[i]['crude price'],
          y1: +data[i]['crude price'],
          y2: +data[i]['crude price']
        });
        series2.push({
          x: +data[i]['year'], 
          y: +data[i]['crude price'],
          y1: +data[i]['crude price'],
          y2: +data[i]['crude price (inflation adjusted)']
        });
        series3.push({
          x: +data[i]['year'], 
          y: +data[i]['crude price (inflation adjusted)'],
          y1: +data[i]['crude price (inflation adjusted)'],
          y2: +data[i]['crude price (inflation and intensity adjusted)']
        });
      }

      // console.log(series1);
      // console.log(series2);
      // console.log(series3);

      return [
        {
          class: 'unadjusted',
          key: 'Unadjusted price',
          values: series1.filter(filter),
          color: '#000',
          annotation: 'Oil in 2014 <br>' +
            'seems to be <span class="highlight-number">50x</span> more expensive <br>' +
            'than in 1970&hellip;'
        },
        {
          class: 'inflation',
          key: 'Adjusted for inflation',
          values: series2.filter(filter),
          color: '#007fc0',
          annotation: 'But with inflation, <br>' +
            'oil in 2014 <br>' +
            'was only <span class="highlight-number">8x</span> more expensive <br>' +
            'than in 1970&hellip;'
        },
        {
          class: 'oil-intensity',
          key: 'Adjusted for inflation and intensity',
          values: series3.filter(filter),
          color: '#e30000',
          annotation: 'Correct for intensity, <br>' +
            'and oil in 2014 was only <span class="highlight-number">3x</span> more expensive than in 1970&mdash;<br>' +
            'still a large increase, but one the global economy could handle.'
        }
      ];
    }

    /* global nv */
    nv.addGraph(function() {
      var container = d3.select('#nvd3-chart');
      var chart = nv.models.lineChart()
        .options({
          duration: 1200,
          // useInteractiveGuideline: true,
          useVoronoi : true,
          // showVoronoi : true,
          yDomain: [0,120],
          interpolate: 'linear',
          pointSize: 50
        })
      ;

      

      chart.tooltip.valueFormatter(function (d) { return 'US $' + d.toFixed(2) + ' / barrel'; })
        .keyFormatter(function (d) { 
          var words = d.split(' ');
          return words.length > 3 ? words.slice(0,3).join(' ') + 
          '<br>' + words.slice(3,words.length).join(' ') : d; });

      // var series = myData(data.elements, function(d,i,arr) { return i % 5 === 0 || d.x === 2014; });
      var series = myData(data.elements);

      var annoText = series[0].annotation;

      // var adjust = container.select('#adjust')
      //   // .append('button')
      //   // .attr('id','adjust')
      //   // .attr('class','initial')
      //   // .text('compare prices')
      //   .attr('class','inflation')
      //   .text('Adjust for inflation');

      chart.xAxis
        .axisLabel('Year');

      chart.yAxis
        .axisLabel('US$ per barrel of oil (WTI)')
        .axisLabel('WTI crude oil, US $/ barrel')
        .tickFormat(d3.format(',f'))
        .showMaxMin(false);
        // .tickValues(function () {
        //   var ticks = [];
        //   for(var i = 1; i < 120; i++) {
        //     ticks.push(i * 20);
        //   }
        //   return ticks;
        // });

      // chart.interactiveLayer.tooltip
      //   // works as expected
      //   .headerFormatter(function(d) {
      //     var formatter = d3.format(',.2f');
      //     return formatter(d);
      //   })
      //   // doesn't work as expected
      //   .valueFormatter(function(d,i) {
      //     var formatter = d3.format(',.2f');
      //     return formatter(d);
      //   });

      var svg = container.select('svg')
        .datum([series[0]])
        .call(chart);

      var pymChild = new pym.Child();
      pymChild.sendHeight();

      

      // svg.select('g').selectAll('.barrel-2')
      //     .data([series[0]])
      //   .enter().append('rect')
      //     .attr('class', 'barrel-2')
      //     .attr('x', chart.xAxis.scale()(1970))
      //     .attr('width', chart.xAxis.scale()(1971))
      //     .attr('height', function (d) {
      //       console.log(d);
      //       return chart.yAxis.scale()(0) - chart.yAxis.scale()(d.values[0].y);
      //     })
      //     .attr('y', function (d) {
      //       return chart.yAxis.scale()(d.values[0].y);
      //     })
      //     .attr('stroke', 'black')
      //     .attr('stroke-width', 2)
      //     .attr('fill', 'white');
      

      var buttons = container.selectAll('button');

      buttons.on('click', function() {
        var button = d3.select(this);
        var i = 0;
        var seriesToDisplay = [series[0]];

        // if (button.classed('initial')) {
        //   // drawMultiples(series[0]);

        //   // button
        //   //   .attr('class','inflation')
        //   //   .text('Adjust for inflation');
        // }
        if (button.classed('reset')) {
          resetChart();
        }
        else if (button.classed('selected')) {
          if (button.classed('oil-intensity') && buttons.filter('.inflation').classed('selected')) {
            adjustForInflation();
            button.classed('selected', false);
            updateAnnotation();
          }
          else if (button.classed('inflation') && buttons.filter('.oil-intensity').classed('selected')) {
            svg.datum([series[0], series[2]]).transition().delay(chart.duration()).call(chart);
            button.classed('selected', false);
            d3.selectAll('.nv-series').selectAll('text')
              .style('fill', function(d) { return d.color; });
          }
          else {
            resetChart();
          }
        }
        else {
          buttons.filter('.reset').property('disabled', false);
          if (button.classed('inflation')) {
            if (buttons.filter('.oil-intensity').classed('selected')) {
              for(i = 0; i < series[1].values.length; i ++) {
                series[1].values[i].y = series[1].values[i].y1;
              }
              chart.update();
              adjustForInflation().each('end', function(d,i) { return i === svg.data().length - 1 ? adjustForIntensity() : null; });
            }
            else {
              seriesToDisplay.push(series[1]);
              adjustForInflation();
            }
          }
          else if (button.classed('oil-intensity')) {

            if (!buttons.filter('.inflation').classed('selected')) {
              buttons.filter('.inflation').classed('selected', true);
              adjustForInflation().each('end', function(d,i) { return i === svg.data().length - 1 ? adjustForIntensity() : null; });
            }
            else {
              adjustForIntensity();
            }
            
          }
          else {
            resetChart();
          }

          updateAnnotation();

          button.classed('selected', true);
          
          d3.selectAll('.nv-series').selectAll('text')
            .style('fill', function(d) { return d.color; });
          // chart.update();
        }
      });
      
      

      /***** For an HTML tooltip *****/ 
          
      //for the HTML tooltip, we're not interested in a
      //transformation relative to an internal SVG coordinate
      //system, but relative to the page body
      
      //We can't get that matrix directly,
      //but we can get the conversion to the
      //screen coordinates.

      // var annoAnchor = svg.select('g').append('g')
      //   .attr('class', 'anno-anchor')
      //   .attr('x', chart.xAxis.scale()(1970))
      //   .attr('y', chart.yAxis.scale()(series[0].values[series[0].values.length - 2].y));

      var annoHTML = d3.select('div.anno-layer');
      
      // var matrix = annoAnchor.node().getScreenCTM()
      //   .translate(+annoAnchor.node().getAttribute('x'),
      //       +annoAnchor.node().getAttribute('y'));

      // annoHTML
      //   .style('left', 
      //     (window.pageXOffset + matrix.e - 70) + 'px')
      //   .style('top',
      //     (window.pageYOffset + matrix.f - 75) + 'px')
      //   .html(annoText);

      annoHTML
        .style('left', '300px')
        .style('top', '60px')
        .html(annoText);


      nv.utils.windowResize(
        function() {
            chart.update();
          }
      );

      function updateAnnotation() {
        var anno = d3.select('div.anno-layer');
        // console.log(annoText);
        // console.log(anno);

        anno
          .html(annoText);

        anno
          .style('opacity', 1);
      }

      function resetChart() {
        for(var i = 0; i < series[2].values.length; i ++) {
            series[2].values[i].y = series[2].values[i].y1;
            series[1].values[i].y = series[1].values[i].y1;
          }

          // series[0].color = '#00f';
          // series[1].color = '#00f';

          svg.datum([series[0]]).transition().delay(chart.duration()).call(chart);

          annoText = series[0].annotation;
          annoHTML
            .style('max-width', null)
            .style('left', '300px')
            .style('color', series[0].color)
            .html(annoText);

          buttons.classed('selected', false);
          buttons.filter('.reset').property('disabled', true);

          // drawMultiples(series[0]);

          // button
          //   .attr('class','inflation')
          //   .text('Adjust for inflation');
      }

      function adjustForInflation() {
        svg
          .datum([series[0],series[1]])
          .transition().duration(chart.duration()).call(chart);

        for(var i = 0; i < series[1].values.length; i ++) {
          series[1].values[i].y = series[1].values[i].y2;
          series[2].values[i].y = series[2].values[i].y1;
        }

        // series[0].color = '#ddd';

        chart.update();

        annoText = series[1].annotation;
        annoHTML
          .style('color', series[1].color);

        // drawMultiples(series[1]);

        // button
        //   .attr('class','oil-intensity')
        //   .text('Adjust for oil intensity');
        return svg
          .datum([series[0],series[1]])
          .transition().duration(chart.duration()).call(chart);

      }

      function adjustForIntensity() {
        svg
          .datum(series)
          .transition().duration(chart.duration()).call(chart);


        for(var i = 0; i < series[2].values.length; i ++) {
          series[2].values[i].y = series[2].values[i].y2;
        }

        // series[1].color = '#bbb';

        chart.update();

        annoText = series[2].annotation;
        annoHTML
          .style('max-width', '245px')
          .style('left', '245px')
          .style('color', series[2].color)
          .html(annoText);
        
        d3.selectAll('.nv-series').selectAll('text')
          .style('fill', function(d) { return d.color; });

        // drawMultiples(series[2]);

        // button
        //   .attr('class','reset')
        //   .text('Reset chart');
      }

      // function drawMultiples (criteria) {
      //   var base = criteria.values[0];
      //   var comparison = criteria.values[criteria.values.length - 2];
      //   var multiples = d3.range(comparison.y / base.y);

      //   console.log(criteria.values[0]);

      //   var ref = svg.select('g').selectAll('.ref-price')
      //     .data([base]);

      //   var comp = svg.select('g').selectAll('.comp')
      //     .data(multiples);

      //   ref
      //       .transition()
      //     .duration(chart.duration())
      //       .attr('height', function (d) {
      //         return chart.yAxis.scale()(0) - chart.yAxis.scale()(d.y);
      //       })
      //       .attr('y', chart.yAxis.scale()(criteria.values[0].y));

        
      //   ref.enter().append('rect')
      //       .attr('id', 'ref-price')
      //       .attr('class', 'ref-price barrel')
      //       .attr('x', chart.xAxis.scale()(1970))
      //       .attr('width', chart.xAxis.scale()(1971))
      //       .attr('stroke', 'black')
      //       .attr('stroke-width', 1)
      //       .attr('fill-opacity', '0')
      //       .attr('height', function (d) {
      //         return chart.yAxis.scale()(0) - chart.yAxis.scale()(d.y);
      //       })
      //       .attr('y', chart.yAxis.scale()(criteria.values[0].y));

      //   console.log(comparison.y / base.y);

      //   comp
      //     .attr('stroke-opacity', 0)
      //     .attr('xlink:href', '#ref-price')
      //     .attr('y', function (d,i) {
      //       return chart.yAxis.scale()(0) - chart.yAxis.scale()(base.y * -i);
      //     })
      //       .transition()
      //     .delay(function (d,i) {
      //         console.log(i / multiples.length * chart.duration());
      //         return chart.duration() + (i / multiples.length * chart.duration());
      //       })
      //       .attr('stroke-opacity', 1)
      //       .each('start', function() {
      //         transitions++;
      //       })
      //       .each('end', function() {
      //         if( --transitions === 0 ) {
      //           updateAnnotation();
      //         }
      //       });

      //   var transitions = 0;

      //   comp.enter().append('use')
      //       .attr('class', 'comp barrel')
      //       .attr('xlink:href', '#ref-price')
      //       .attr('x', chart.xAxis.scale()(2014))
      //       .attr('y', function (d,i) {
      //         return chart.yAxis.scale()(0) - chart.yAxis.scale()(base.y * -i);
      //       })
      //       .attr('stroke-opacity', 0)
      //       .transition()
      //     .delay(function (d,i) {
      //         return (i / multiples.length * chart.duration());
      //       })
      //       .attr('stroke-opacity', 1)
      //       .each('start', function() {
      //         transitions++;
      //       })
      //       .each('end', function() {
      //         if( --transitions === 0 ) {
      //           updateAnnotation();
      //         }
      //       });

      //   comp.exit()
      //     .remove();

      //   // for(var i = 0; i < comparison.y / base.y; i ++) {
      //   //   svg.select('g').append('use')
      //   //     .attr('class', 'comp barrel')
      //   //     .attr('xlink:href', '#ref-price')
      //   //     .transition()
      //   //   .delay(chart.duration())
      //   //     .attr('x', chart.xAxis.scale()(2014))
      //   //     .attr('y', chart.yAxis.scale()(0) - chart.yAxis.scale()(base.y * (-i)));
      //   // }

      //   function updateAnnotation() {
      //     var anno = d3.select('div.anno-layer');
      //     console.log(annoText);
      //     console.log(anno);

      //     anno
      //       .html(annoText);

      //     anno
      //       .style('opacity', 1);
      //   }

      //   // function addSvgAnnotation () {
      //   //   var annoWidth = 0;

      //   //   var anno = svg.select('g').append('g')
      //   //     .attr('class', 'annotation')
      //   //   .append('text')
      //   //     .attr('x', chart.xAxis.scale()(1995))
      //   //     .attr('y', 45)
      //   //     .attr('width', annoWidth)
      //   //     .attr('height', annoWidth)
      //   //     .attr('transform', 'translate('+ chart.xAxis.scale()(1995) +',80)')
      //   //     .attr('style', 'text-align: center; text-anchor: middle;');

      //   //   anno.append('tspan')
      //   //     .attr('x', annoWidth / 2)
      //   //     .attr('y', '-3.0em')
      //   //     .attr('class', 'anno-line-pre-2')
      //   //     .text('Oil in 2014');

      //   //   anno.append('tspan')
      //   //     .attr('x', annoWidth / 2)
      //   //     .attr('y', '-1.8em')
      //   //     .attr('class', 'anno-line-pre-1')
      //   //     .text('seems to be');

      //   //   anno.append('tspan')
      //   //     .attr('x', annoWidth / 2)
      //   //     .attr('y', '0')
      //   //     .attr('class', 'anno-line-number')
      //   //     .attr('style', 'font-size:2em; line-height: 1em;')
      //   //     .text('50x');

      //   //   anno.append('tspan')
      //   //     .attr('x', annoWidth / 2)
      //   //     .attr('y', '1.2em')
      //   //     .attr('class', 'anno-line-post-1')
      //   //     .text('more expensive');

      //   //   anno.append('tspan')
      //   //     .attr('x', annoWidth / 2)
      //   //     .attr('y', '2.4em')
      //   //     .attr('class', 'anno-line-post-2')
      //   //     .text('than in 1970…');
      //   // }
        
      // }

      return chart;
    });
  }

  // (function() {
    
  // })();

  // // load C3.js chart
  // /* global c3 */
  // var chart = c3.generate({
  //   bindto: '#c3-chart',
  //   data: {
  //     columns: [
  //       ['data1', 30, 200, 100, 400, 150, 250],
  //       ['data2', 50, 20, 10, 40, 15, 25]
  //     ]
  //   }
  // });
}());