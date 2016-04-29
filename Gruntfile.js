module.exports = function(grunt) {
  // Project configuration
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),

    // Clean dirs
    clean: [
      'js/babel',
      'js/browserify',
      'js/build',
      'css/build'
    ],

    eslint: {
      options: {
        configFile: '.eslintrc'
      },
      target: [
        'js/src/**/*.js',  // src
        'test/**/*.js'     // test
      ]
    },

    browserify: {
      dist: {
        options: {
          transform: [
            ['babelify', {
              presets: ['es2015']
            }]
          ]
        },
        src: [
          'js/src/**/*.js',
        ],
        dest: 'js/browserify/main.js'
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
            'js/browserify/main.js'
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

    // Recompile on src changes. The keys here are arbitrary.
    watch: {
      config_files: {
        files: ['Gruntfile.js'],
        options: {
          reload: true
        }
      },
      css_src: {
        files: ['css/src/**/*.scss'],
        tasks: ['sass']
      },
      js_src: {
        files: [
          'js/src/**/*.js',
          'js/src/**/*.jsx'
        ],
        tasks: ['browserify', 'uglify']
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-clean');   // clear
  grunt.loadNpmTasks('grunt-eslint');          // lint
  grunt.loadNpmTasks('grunt-browserify');      // use modules and require
  grunt.loadNpmTasks('grunt-contrib-uglify');  // js
  grunt.loadNpmTasks('grunt-contrib-sass');    // css
  grunt.loadNpmTasks('grunt-contrib-watch');   // watch

  // Tasks!
  grunt.registerTask('default', [
    'clean',
    'eslint',
    'browserify',
    'uglify',
    'sass'
  ]);
};
