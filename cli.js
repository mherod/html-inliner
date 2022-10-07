#!/usr/bin/env node

const { transformAll } = require("./index");

console.log("hi")
console.log(__dirname)

if (process.argv) {
  transformAll();
}
