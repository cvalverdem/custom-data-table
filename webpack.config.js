const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const CopyWebpackPlugin = require("copy-webpack-plugin");
const webpack = require("webpack");

module.exports = {
  entry: { index: "./src/index.ts" },
  output: { path: path.resolve(__dirname, "dist"), filename: "[name].js", clean: true },
  mode: "production",
  devtool: "inline-source-map",
  resolve: { extensions: [".ts", ".js"] },
  module: {
    rules: [
      { test: /\.ts$/, use: "ts-loader", exclude: /node_modules/ },
      { test: /\.css$/, use: ["style-loader", "css-loader"] }
    ]
  },
  plugins: [
    new HtmlWebpackPlugin({ template: "src/index.html", chunks: ["index"] }),
    new CopyWebpackPlugin({ patterns: [{ from: "images", to: "images" }] }),
    new webpack.ProvidePlugin({ $: "jquery", jQuery: "jquery", "window.jQuery": "jquery" })
  ]
};
