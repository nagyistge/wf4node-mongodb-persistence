"use strict";

/* global describe,it */

var es6 = true;
try {
    eval("(function *(){})");
} catch (err) {
    es6 = false;
}

var es = es6 ? "es6" : "es5";

let wf4node = require("workflow-4-node");
let MongoDDPersistence = require("../../").MongoDDPersistence;
let hostingTestCommon = require("../../node_modules/workflow-4-node/tests/" + es + "/hosting/hostingTestCommon");
let Serializer = require("backpack-node").system.Serializer;

let connStr = process.env.MONGO_URL;
let persistence = connStr ? new MongoDDPersistence({connection: connStr}) : null;

if (persistence) {
    describe("WorkflowHost", function () {
        this.timeout(5000);
        this.beforeEach(function(done) {
            persistence.__clear().nodeify(done);
        });

        function getInfo(options) {
            return `lazy: ${options.lazyPersistence ? "yes" : "no"}, serializer: ${options.serializer ? "yes" : "no"}, alwaysLoad: ${options.alwaysLoadState ? "yes" : "no"}`;
        }

        function testBasic(options) {
            it("should run by: " + getInfo(options), function (done) {
                hostingTestCommon.doBasicHostTest(options).nodeify(done);
            });
        }

        function testCalc(options) {
            it("should run by: " + getInfo(options), function (done) {
                hostingTestCommon.doCalculatorTest(options).nodeify(done);
            });
        }

        function testDelayTo(options) {
            it("should run by: " + getInfo(options), function (done) {
                hostingTestCommon.doDelayTest(options).nodeify(done);
            });
        }

        let allOptions = [
            {
                persistence: persistence,
                lazyPersistence: false,
                serializer: null,
                alwaysLoadState: false
            },
            {
                persistence: persistence,
                lazyPersistence: true,
                serializer: null,
                alwaysLoadState: false
            },
            {
                persistence: persistence,
                lazyPersistence: false,
                serializer: new Serializer(),
                alwaysLoadState: false
            },
            {
                persistence: persistence,
                lazyPersistence: true,
                serializer: new Serializer(),
                alwaysLoadState: false
            },
            {
                persistence: persistence,
                lazyPersistence: false,
                serializer: new Serializer(),
                alwaysLoadState: true
            },
            {
                persistence: persistence,
                lazyPersistence: true,
                serializer: new Serializer(),
                alwaysLoadState: true
            }
        ];

        describe("With MongoDB Persistence", function () {
            describe("Basic Example", function () {
                for (let opt of allOptions) {
                    testBasic(opt);
                }
            });

            describe("Calculator Example", function () {
                for (let opt of allOptions) {
                    testCalc(opt);
                }
            });

            describe("DelayTo Example", function () {
                for (let opt of allOptions) {
                    testDelayTo(opt);
                }
            });
        });
    });
}