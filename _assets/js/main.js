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
        bounds: [.4, .5]
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
        bounds: [.9, 1]
      },
      {
        el: $('.webapps .cloud.web'),
        props: {
          'left': [-40, 37, '%']
        },
        bounds: [.95, 1]
      }
    ]

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
              delta = bs[1] - bs[0]
              coef =  (progress - bs[0]) / delta
              current = (vs[1] - vs[0]) * coef + vs[0] + (vs[2] || '');

          a.el.css(name, current)
        }
      }
    }

  })
})