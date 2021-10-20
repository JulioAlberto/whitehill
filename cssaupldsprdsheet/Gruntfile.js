module.exports = function (grunt) {
    grunt.initConfig({
        openui5_preload: {
            component: {
                options: {
                    resources: {
                        cwd: 'webapp',
                        prefix: 'com/bianix',
                        src: [
                            '**/*.js',
                            '**/*.fragment.xml',
                            '**/*.view.xml',
                            '**/*.properties',
                            '**/*.css',
                            '**/*.json',
                        ]
                    },
                    dest: 'webapp'
                },
                components: true
            }
        },

    });

    grunt.loadNpmTasks('grunt-openui5');

    grunt.registerTask('default', [
        'openui5_preload'
    ]);
};
