module.exports = {
    entry: "./js/script.js",
    output: {
        path: __dirname,
        filename: "bundle.js"
    },
    module: {
        rules: [
            { test: /\.(vert|frag)$/, use: "raw-loader" },
            {
                test: /\.js$/,
                exclude: /node_modules/,
                use: {
                    loader: "babel-loader",
                    options: { 
                        presets: [ "@babel/preset-env" ] 
                    } 
                }
            }
        ]
    }
};