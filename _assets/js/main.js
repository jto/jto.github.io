/*!
 * Jto v0.1.0, 2013-05-05
 *
 * Hosted on
 * Copyright (c) jto ()
 * Licensed under MIT license.
 */
$(function(){
  $(document.body).addClass('ready');

  var anims =
    [
      {
        el: $('.hi > *'),
        props: {
          'opacity': [1, 0],
          'top': [0, -50, '%']
        },
        bounds: [0, .5],
        start: true,
        end: true
      },
      {
        el: $('.hi > h1 em'),
        props: {
          'top': [0, -450, 'px']
        },
        bounds: [0, 1],
        start: true,
        end: true
      },
      {
        el: $('.hi > h2'),
        props: {
          'top': [0, -300, 'px']
        },
        bounds: [0, 1],
        start: true,
        end: true
      },
      {
        el: $('.webapps h2'),
        props: {
          'opacity': [.4, 1]
        },
        bounds: [.3, .6],
        start: true,
        end: true
      },
      {
        el: $('.webapps .cloud.scalable'),
        props: {
          'left': [-40, 37, '%']
        },
        bounds: [.4, .6],
        start: true
      },
      {
        el: $('.webapps .cloud.scalable'),
        props: {
          'left': [37, 110, '%']
        },
        bounds: [.6, .7],
        end: true
      },
      {
        el: $('.webapps .cloud.distributed'),
        props: {
          'left': [-40, 37, '%']
        },
        bounds: [.6, .7],
        start: true
      },
      {
        el: $('.webapps .cloud.distributed'),
        props: {
          'left': [37, 110, '%']
        },
        bounds: [.7, .8],
        end: true
      },
      {
        el: $('.webapps .cloud.web'),
        props: {
          'left': [-40, 37, '%']
        },
        bounds: [.7, .9],
        start: true
      }
    ]

  // t: current time
  // b: start value
  // c: change in value
  // d: duration
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
    easeInOutSin: function (t, b, c, d) {
      console.log("%o => %o", c, c)
      return -c / 2 * (Math.cos(Math.PI * t / d) - 1) + b;
    }
  }

  $(window).scroll(function(evt){
    var height = $(window).height(),
        scroll = $(window).scrollTop(),
        progress = (scroll / height) // % of screen scrolled

    for(i in anims) {
      var a = anims[i],
          bs = a.bounds || [0, Number.MAX_VALUE]
      if((bs[0] < progress) && (bs[1] >= progress)){

        for(name in a.props) {
          var vs = a.props[name],
              currentTime = progress - bs[0],
              startValue = vs[0]
              duration = bs[1] - bs[0],
              perFrame = (vs[1] - vs[0]) / duration,
              eased = E.linearTween(currentTime, startValue, perFrame, duration)

          a.el.css(name, eased + (vs[2] || ''))
        }
      }
      // force extreme cases just in case
      else if(bs[0] > progress && a.start){
        for(name in a.props) {
          var vs = a.props[name]
          a.el.css(name, vs[0] + (vs[2] || ''))
        }
      } else if(bs[1] < progress && a.end) {
        for(name in a.props) {
          var vs = a.props[name]
          a.el.css(name, vs[1] + (vs[2] || ''))
        }
      }
    }

  })
})