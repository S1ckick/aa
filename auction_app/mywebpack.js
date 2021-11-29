module.exports = {
  entry: {
    main: "./public/player.js",
    second: "./public/admin.js",
    third: "./public/arts.js",
    forth: "./public/auction.js",
  },
  output: {
    filename: "./dist/[name].js",
  },
  module: {
    rules: [
      {
        test: /public\.css$/,
        exclude: /node_modules/,
        use: { loader: "style-loader!css-loader" },
      },
    ],
  },
};
