const path = require("path");
const CopyPlugin = require("copy-webpack-plugin");
const TerserPlugin = require("terser-webpack-plugin");

module.exports = {
    entry: "./js/script.js",
    output: {
        path: path.resolve(__dirname, "dist"),
        filename: "bundle.js",
    },
    optimization: {
        minimize: true,
        minimizer: [new TerserPlugin()],
    },
    plugins: [new CopyPlugin([{ from: "public", to: "." }])],
    module: {
        rules: [
            { test: /\.(vert|frag)$/, use: "raw-loader" },
            { test: /\.png$/i, use: "url-loader" },
        ],
    },
};
