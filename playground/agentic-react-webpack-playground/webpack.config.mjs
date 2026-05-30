import path from 'node:path';
import { fileURLToPath } from 'node:url';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import withAgenticReactWebpack from '@jazelly/agentic-react/webpack';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const devServerPort = Number(
  process.env.AGENTIC_REACT_WEBPACK_PLAYGROUND_PORT ||
    process.env.PORT ||
    51425,
);

const baseConfig = {
  mode: 'development',
  entry: './src/index.jsx',
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'dist'),
    clean: true,
  },
  module: {
    rules: [
      {
        test: /\.jsx?$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: [
              [
                '@babel/preset-react',
                { runtime: 'automatic', development: true },
              ],
            ],
          },
        },
      },
      {
        test: /\.css$/i,
        use: ['style-loader', 'css-loader'],
      },
    ],
  },
  resolve: {
    extensions: ['.js', '.jsx'],
    fullySpecified: false,
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './public/index.html',
    }),
  ],
  devServer: {
    host: '127.0.0.1',
    port: devServerPort,
    hot: true,
  },
};

export default (env = {}, argv = {}) =>
  withAgenticReactWebpack(baseConfig, {
    mode: argv.mode || env.mode || 'development',
  });
