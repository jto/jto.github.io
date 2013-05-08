module.exports = function(grunt) {
  grunt.loadNpmTasks('grunt-contrib-less');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-shell');
  grunt.loadNpmTasks('grunt-contrib-watch');

  grunt.initConfig({

    watch: {
      less: {
        files: ['_assets/less/*.less'],
        tasks: 'less-build'
      },
      js: {
        files: ['_assets/js/*.js'],
        tasks: 'js-copy'
      },
      jekyllSources: {
        files: [
          // capture all except css - add your own
          '*.html',
          '*.yml',
          //'_assets/js/**.js',
          //'_assets/less/**.less',
          '_posts/**',
          '_includes/**'
        ],
        tasks: 'jekyll-build',
      }
    },

    // Generate _site using jekyll
    shell: {
      jekyll: {
        command: 'rm -rf _site/*; jekyll --no-auto',
        stdout: true
      }
    },

    less: {
      development: {
        options: {
          paths: ["_assets/less"],
          strictImports: true
        },
        files: {
          "_site/assets/css/main.css": "_assets/less/main.less"
        }
      }
    },

    copy: {
      development: {
        files: [
          { expand: true, cwd: '_assets', src: ['js/*'], dest: '_site/assets/' },
          { expand: true, cwd: '_assets', src: ['images/*'], dest: '_site/assets/'},
          { expand: true, cwd: '_assets', src: ['font/*'], dest: '_site/assets/' },
          { expand: true, cwd: '_assets', src: ['*'], dest: 'assets/' }
        ]
      }
    }

  });

  grunt.registerTask('less-build', ['less:development']);
  grunt.registerTask('js-copy', ['copy:development']);
  grunt.registerTask('jekyll-build', ['shell:jekyll','less-build', 'js-copy']);
  grunt.registerTask('default', 'watch');

};