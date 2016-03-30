module.exports = function(grunt) {
  // Project configuration
  grunt.initConfig({
    babel: {
      options: {
        sourceMap: true,
        presets: ['es2015']
      },
      dist: {
        files: {
          'js/babel/adapter.js': 'js/src/adapter.js',
          'js/babel/server.js': 'js/src/server.js',
          'js/babel/client.js': 'js/src/client.js',
          'js/babel/app.js': 'js/src/app.js'
        }
      }
    },
    uglify: {
      my_target: {
        options: {
          sourceMap: true,
          sourceMapName: 'sourceMap.map'
        },
        files: {
          'js/build/main.min.js': [
            'js/components/jquery/dist/jquery.js', // Remove me (eventually)
            'js/babel/adapter.js',
            'js/babel/server.js',
            'js/babel/client.js',
            'js/babel/app.js'
          ]
        }
      }
    }
  });

  // Load the plugin that provides the "babel" task.
  grunt.loadNpmTasks('grunt-babel');

  // Load the plugin that provides the "uglify" task.
  grunt.loadNpmTasks('grunt-contrib-uglify');

  // Default task(s).
  grunt.registerTask('default', ['babel', 'uglify']);
};
