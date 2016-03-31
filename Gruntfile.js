module.exports = function(grunt) {
  // Project configuration
  grunt.initConfig({
    // Clean dirs
    clean: [
      '*.html',
      'js/babel',
      'js/build'
    ],

    // Convert from es6 to es5
    babel: {
      options: {
        presets: ['es2015']
      },
      dist: {
        files: {
          // dest: source
          'js/babel/adapter.js': 'js/src/adapter.js',
          'js/babel/server.js': 'js/src/server.js',
          'js/babel/client.js': 'js/src/client.js',
          'js/babel/app.js': 'js/src/app.js'
        }
      }
    },

    // Merge files so index.html has fewer includes
    uglify: {
      my_target: {
        options: {
          mangle: false,
          sourceMap: true,
          screwIE8: true
        },
        files: {
          // Firebase doesn't play nicely when merged with the other files, so
          // keep it separate
          'js/build/firebase.min.js': [
            'js/components/firebase/firebase.js',
          ],
          'js/build/main.min.js': [
            'js/components/jquery/dist/jquery.js',
            'js/babel/adapter.js',
            'js/babel/server.js',
            'js/babel/client.js',
            'js/babel/app.js'
          ]
        }
      }
    },

    // Now build a flat index.html file from
    bake: {
      my_target: {
        options: {
          // None
        },
        files: {
          // dest: source
          'index.html': 'html/src/index.html'
        }
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-babel');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-bake');

  // Default task(s).
  grunt.registerTask('default', ['clean', 'babel', 'uglify', 'bake']);
};
