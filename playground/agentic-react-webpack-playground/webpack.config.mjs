import path from 'node:path';
import { fileURLToPath } from 'node:url';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import withAgenticReactWebpack from '@agentic-react/webpack';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const devServerPort = Number(
  process.env.AGENTIC_REACT_WEBPACK_PLAYGROUND_PORT ||
    process.env.PORT ||
    51425,
);
const toolkit = {
  tuningModal: {
    classNames: {
      surface: 'webpack-playground-tuning-surface',
      panel: 'webpack-playground-tuning-panel',
      control: 'webpack-playground-tuning-control',
    },
    tokens: {
      panelRadius: '12px',
      controlRadius: '9px',
      primaryButtonBackground: '#1d4ed8',
      primaryButtonColor: '#ffffff',
      panelShadow: '0 24px 72px rgba(29, 78, 216, 0.22)',
    },
    styles: {
      surface: {
        filter: 'drop-shadow(0 18px 40px rgba(29, 78, 216, 0.16))',
      },
      panel: {
        border: '1px solid rgba(29, 78, 216, 0.24)',
      },
      targetTag: {
        background: '#eff6ff',
        color: '#1d4ed8',
      },
      sectionTitle: {
        color: '#1d4ed8',
      },
    },
  },
};

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
  withAgenticReactWebpack(
    baseConfig,
    {
      mode: argv.mode || env.mode || 'development',
    },
    {
      toolkit,
    },
  );
