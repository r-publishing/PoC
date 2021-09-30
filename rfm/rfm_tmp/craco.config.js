const path = require('path');
const { ESLINT_MODES } = require("@craco/craco");

module.exports = {
  plugins: [
    {
      plugin: require('craco-plugin-scoped-css'),
    },
  ],
  eslint: {
    mode: ESLINT_MODES.extends,
    configure: {
      rules: {
        "no-unused-vars": "off"
      }
    }
  },
  /*
    eslint: {
      mode: ESLINT_MODES.extends,
      configure: () => {
        return require('./.eslintrc')
      }
    },
    */
  webpack: {
    rules: [
      //...
      {
        test: /\.(png|jp(e*)g|svg|gif)$/,
        use: [
          {
            loader: 'file-loader',
            options: {
              name: 'images/[hash]-[name].[ext]',
            },
          },
        ],
      },
    ],
  },
};
