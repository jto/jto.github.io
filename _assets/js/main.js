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
        bounds: [0, .5]
      },
      {
        el: $('.hi > h1 em'),
        props: {
          'top': [0, -450, 'px']
        },
        bounds: [0, 1]
      },
      {
        el: $('.hi > h2'),
        props: {
          'top': [0, -300, 'px']
        },
        bounds: [0, 1]
      },
      {
        el: $('.webapps .cloud.scalable'),
        props: {
          'left': [-40, 37, '%']
        },
        bounds: [.3, .4]
      },
      {
        el: $('.webapps .cloud.scalable'),
        props: {
          'left': [37, 110, '%']
        },
        bounds: [.6, .7]
      },
      {
        el: $('.webapps .cloud.distributed'),
        props: {
          'left': [-40, 37, '%']
        },
        bounds: [.7, .8]
      },
      {
        el: $('.webapps .cloud.distributed'),
        props: {
          'left': [37, 110, '%']
        },
        bounds: [1, 1.1]
      },
      {
        el: $('.webapps .cloud.web'),
        props: {
          'left': [-40, 37, '%']
        },
        bounds: [1.1, 1.2]
      }
      ,
      {
        el: $('.webapps .cloud.web'),
        props: {
          'left': [37, 110, '%']
        },
        bounds: [1.3, 1.5]
      }
    ]

  $(window).scroll(_.debounce(function(evt){
    var height = $(window).height(),
        scroll = $(window).scrollTop(),
        progress = (scroll / height) // % of screen scrolled

    $(anims)
      .filter(function(i, a){
        var bs = a.bounds || [0, Number.MAX_VALUE]
        return (bs[0] < progress) && (bs[1] >= progress)
      })
      .each(function(i, a){
        var bs = a.bounds || [0, Number.MAX_VALUE]
        var styles =
          _.reduce(_.pairs(a.props), function(ps, p){
            var name = p[0],
                vs = p[1],
                delta = bs[1] - bs[0]
                coef =  (progress - bs[0]) / delta
                current = (vs[1] - vs[0]) * coef + vs[0] + (vs[2] || '');

            var x = {}
            x[name] = current
            return _.extend({}, ps, x)
          }, {})
        a.el.css(styles)
      })

  }, 15))
})