const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");

module.exports = (env, argv) => ({
  entry: { index: "./src/index.ts" },
  output: { path: path.resolve(__dirname, "dist"), filename: "[name].js", clean: true },
  mode: "production",
  // Source maps only while developing (`npm run dev`); they would triple the published bundle
  devtool: argv.mode === "development" ? "inline-source-map" : false,
  resolve: { extensions: [".ts", ".js"] },
  module: {
    rules: [
      { test: /\.ts$/, use: "ts-loader", exclude: /node_modules/ },
      { test: /\.css$/, use: ["style-loader", "css-loader"] }
    ]
  },
  // The extension icon is packaged from the root images/ folder (see vss-extension.json "files")
  plugins: [
    new HtmlWebpackPlugin({ template: "src/index.html", chunks: ["index"] })
  ]
});
