const { execSync, exec } = require('child_process');
const { existsSync } = require('fs');
const { path } = require("path");
const playwright = require('playwright');

module.exports = {
    name: "test",
    help: "",
    async execute(lms, args) {
        console.log("Hello world");
    }
}