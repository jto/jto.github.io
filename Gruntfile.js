module.exports = function(grunt) {
  grunt.loadNpmTasks('grunt-contrib-less');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-shell');
  grunt.loadNpmTasks('grunt-contrib-watch');

  grunt.initConfig({

    watch: {
      less: {
        // Using less to render styles.
        // Watch for the *.less file sonly
        files: ['_assets/less/*.less'],
        tasks: 'less-build'
      },
      jekyllSources: {
        files: [
          // capture all except css - add your own
          '*.html',
          '*.yml',
          'assets/js/**.js',
          'assets/less/**.less',
          '_posts/**',
          '_includes/**'
        ],
        tasks: 'shell:jekyll',
      }
    },

    // Generate _site using jekyll
    shell: {
      jekyll: {
        command: 'rm -rf _site/*; jekyll',
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
    }

  });

  // less watch
  grunt.registerTask('less-build', ['less:development']);
  // Default task.
  grunt.registerTask('default', 'watch');

};