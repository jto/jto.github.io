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
          'opacity': [1, -1.4],
          'top': [0, -400, 'px']
        }
      },
      {
        el: $('.hi > h1 em'),
        props: {
          'top': [0, -450, 'px']
        }
      },
      {
        el: $('.hi > h2'),
        props: {
          'top': [0, -300, 'px']
        }
      }
    ]

  $(window).scroll(function(evt){
    var height = $(window).height(),
        scroll = $(window).scrollTop(),
        progress = (scroll / height) // % of page scrolled

    $(anims).each(function(i, a){

      var styles =
        _.reduce(_.pairs(a.props), function(ps, p){
          var name = p[0],
              vs = p[1],
              current = (vs[1] - vs[0]) * progress + vs[0] + (vs[2] | '');

            console.log("%o => %o", name, (vs[1] - vs[0]) * progress)

          var x = {}
          x[name] = current
          return _.extend({}, ps, x)
        }, {})

      a.el.css(styles)

    })

  })
})