/*!
 * Jto v0.1.0, 2013-05-05
 *
 * Hosted on
 * Copyright (c) jto ()
 * Licensed under MIT license.
 */
 "use strict"
$(function(){
  $(document.body).addClass('ready');

  // t: current time
  // b: start value
  // c: change in value
  // d: duration
  // http://www.gizma.com/easing/
  var E = {
    linearTween: function (t, b, c, d) {
      return c * t / d + b;
    },
    easeInOutQuart: function (t, b, c, d) {
      t /= d/2;
      if (t < 1) return c / 2 * t * t * t * t + b;
      t -= 2;
      return -c / 2 * (t * t * t * t - 2) + b;
    },
    easeOutQuad: function (t, b, c, d) {
    	t /= d;
    	return -c * t*(t-2) + b;
    }
  }

  var anims =
    [
      {
        el: $('.hi > *'),
        props: {
          'opacity': { values: [1, 0] },
          'top': { values: [0, -50], unit: '%' }
        },
        bounds: [0, .7],
        start: true,
        end: true
      },
      {
        el: $('.hi > h1 em'),
        props: {
          'top': { values: [0, -450], unit: 'px' }
        },
        bounds: [0, 1.2],
        start: true,
        end: true
      },
      {
        el: $('.hi > h2'),
        props: {
          'top': { values: [0, -300], unit: 'px' }
        },
        bounds: [0, 1.2],
        start: true,
        end: true
      },

      // page 2
      {
        el: $('.webapps h2'),
        props: {
          'opacity': { values: [.2, 1], ƒ: E.easeOutQuad }
        },
        bounds: [.3, .9],
        start: true,
        end: true
      },

      //page 2 - Big clouds
      {
        el: $('.webapps .cloud.scalable'),
        props: {
          'left': { values: [5, 15], unit: '%', ƒ: E.easeOutQuad }
        },
        bounds: [.2, 1.7],
        start: true,
        end: true
      },
      {
        el: $('.webapps .cloud.distributed'),
        props: {
          'left': { values: [20, 35], unit: '%', ƒ: E.easeOutQuad }
        },
        bounds: [.2, 1.7],
        start: true,
        end: true
      },
      {
        el: $('.webapps .cloud.web'),
        props: {
          'left': { values: [40, 65], unit: '%', ƒ: E.easeOutQuad }
        },
        bounds: [.2, 1.7],
        start: true,
        end: true
      },
      // page 2 - paralax
      {
        el: $('.webapps .cloud.small:nth-of-type(1)'),
        props: {
          'left': { values: [45, 65], unit: '%' },
        },
        bounds: [.2, 1.7],
        start: true,
        end: true
      },
      {
        el: $('.webapps .cloud.small:nth-of-type(2)'),
        props: {
          'left': { values: [30, 40], unit: '%'},
        },
        bounds: [.2, 1.7],
        start: true,
        end: true
      },
      {
        el: $('.webapps .cloud.small:nth-of-type(3)'),
        props: {
          'left': { values: [10, 15], unit: '%' },
        },
        bounds: [.2, 1.7],
        start: true,
        end: true
      },
      //skills
      {
        el: $('.skills #functionnal'),
        props: {
          'bottom': { values: [900, 240], unit: 'px' },
          'opacity': { values: [.6, 1] }
        },
        bounds: [1.6, 1.8],
        end: true
      },
      {
        el: $('.skills #scala'),
        props: {
          'bottom': { values: [900, 10], unit: 'px' },
          'opacity': { values: [.2, 1] }
        },
        bounds: [1.3, 1.8],
        end: true
      },
      {
        el: $('.skills #nix'),
        props: {
          'bottom': { values: [900, 10], unit: 'px' },
          'opacity': { values: [.7, 1] }
        },
        bounds: [.9, 1.8],
        end: true
      },
      {
        el: $('.skills #git'),
        props: {
          'bottom': { values: [900, 125], unit: 'px' },
          'opacity': { values: [.6, 1] }
        },
        bounds: [1, 1.9],
        end: true
      },
      {
        el: $('.skills #play'),
        props: {
          'bottom': { values: [900, 240], unit: 'px' },
          'opacity': { values: [.4, 1] }
        },
        bounds: [1.3, 2],
        end: true
      },
      {
        el: $('.skills #akka'),
        props: {
          'bottom': { values: [900, 10], unit: 'px' },
          'opacity': { values: [.8, 1] }
        },
        bounds: [.9, 1.7],
        end: true
      },
      {
        el: $('.skills #js'),
        props: {
          'bottom': { values: [900, 10], unit: 'px' },
          'opacity': { values: [.3, 1] }
        },
        bounds: [1.5, 1.8],
        end: true
      },
      {
        el: $('.skills #haskell'),
        props: {
          'bottom': { values: [900, 125], unit: 'px' },
          'opacity': { values: [.5, 1] }
        },
        bounds: [1.7, 2],
        end: true
      }
    ]


  $(window).scroll(function(evt){

    var height = $(window).height(),
        scroll = $(window).scrollTop(),
        progress = (scroll / height) // % of screen scrolled

    for(var i in anims) {
      var a = anims[i],
          bs = a.bounds || [0, Number.MAX_VALUE]

      if((bs[0] < progress) && (bs[1] >= progress)){
        for(name in a.props) {
          var vs = a.props[name].values,
              duration = (bs[1] - bs[0]) * 100,
              currentTime = (progress - bs[0]) * 100,
              startValue = vs[0],
              eƒ = a.props[name].ƒ || E.linearTween,
              eased = eƒ(currentTime, startValue, vs[1] - vs[0], duration)

          a.el.css(name, eased + (a.props[name].unit || ''))
        }
      }
      // force extreme cases just in case
      else if(bs[0] > progress && a.start){
        for(name in a.props) {
          var unit = a.props[name].unit || '',
                vs = a.props[name].values
          a.el.css(name, vs[0] + unit)
        }
      } else if(bs[1] < progress && a.end) {
        for(name in a.props) {
          var unit = a.props[name].unit || '',
                vs = a.props[name].values
          a.el.css(name, vs[1] + unit)
        }
      }
    }

  })
})