module.exports = function(grunt) {
  // Project configuration
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),

    // Clean dirs
    clean: [
      '*.html',
      'js/babel',
      'js/build',
      'css/build'
    ],

    jshint: {
      options: {
        esversion: 6,
        eqeqeq: true,
        freeze: true,
        latedef: true,
        nocomma: true,
        nonbsp: true,
        // unused: true
        // strict: 'global',
        varstmt: true
      },
      src: ['js/src/**/*.js']
    },

    // Convert from es6 to es5
    babel: {
      all: {
        options: {
          presets: ['es2015']
        },
        files: {
          // dest: source
          'js/babel/adapter.js': 'js/src/adapter.js',
          'js/babel/server.js': 'js/src/server.js',
          'js/babel/client.js': 'js/src/client.js',
          'js/babel/app.js': 'js/src/app.js'
        }
      }
    },

    // Merge files so index.html has fewer includes. The keys here are
    // arbitrary.
    uglify: {
      all: {
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

    sass: {
      all: {
        options: {
          style: 'expanded'
        },
        files: {
          // dest: source
          'css/build/main.css': 'css/src/main.scss'
        }
      }
    },

    // Now build a flat index.html file from. The keys here are arbitrary.
    bake: {
      all: {
        options: {
          // None
        },
        files: {
          // dest: source
          'index.html': 'html/src/index.html'
        }
      }
    },

    // Recompile on src changes. The keys here are arbitrary.
    watch: {
      config_files: {
        files: ['Gruntfile.js'],
        options: {
          reload: true
        }
      },
      html_src: {
        files: ['html/src/**/*.html'],
        tasks: ['bake']
      },
      css_src: {
        files: ['css/src/**/*.scss'],
        tasks: ['sass']
      },
      js_src: {
        files: ['js/src/**/*.js'],
        tasks: ['babel', 'uglify']
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-clean');   // clear
  grunt.loadNpmTasks('grunt-contrib-jshint');  // lint
  grunt.loadNpmTasks('grunt-babel');           // js
  grunt.loadNpmTasks('grunt-contrib-uglify');  // js
  grunt.loadNpmTasks('grunt-contrib-sass');    // css
  grunt.loadNpmTasks('grunt-bake');            // html
  grunt.loadNpmTasks('grunt-contrib-watch');   // watch

  // Tasks!
  grunt.registerTask('default', [
    'clean',
    'jshint',
    'babel',
    'uglify',
    'sass',
    'bake'
  ]);
};
