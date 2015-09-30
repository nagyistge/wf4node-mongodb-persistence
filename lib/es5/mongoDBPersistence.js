"use strict";
var Bluebird = require("bluebird");
var _ = require("lodash");
var mongodb = require("mongodb");
var MongoClient = mongodb.MongoClient;
var common = require("workflow-4-node").common;
var async = common.asyncHelpers.async;
var errors = common.errors;
function MongoDBPersistence(options) {
  if (!_.isObject(options)) {
    throw new TypeError("Object argument 'options' expected.");
  }
  if (!_.isString(options.connection)) {
    throw new Error("Connection expected in the options.");
  }
  this._options = _.extend({
    connectionOptions: {db: {native_parser: false}},
    stateCollectionName: "WFState",
    promotedPropertiesCollectionName: "WFPromotedProperties",
    locksCollectionName: "WFLocks",
    stringifyState: true,
    enablePromotions: true,
    w: "majority"
  }, options);
  this._db = null;
  this._stateCollection = null;
  this._promotedPropertiesCollection = null;
  this._locksCollection = null;
  this._connectedAndInitialized = false;
  this._w = {w: this._options.w};
}
Object.defineProperties(MongoDBPersistence.prototype, {options: {get: function() {
      return this._options;
    }}});
MongoDBPersistence.prototype._connectAndInit = async($traceurRuntime.initGeneratorFunction(function $__3() {
  var db;
  return $traceurRuntime.createGeneratorInstance(function($ctx) {
    while (true)
      switch ($ctx.state) {
        case 0:
          $ctx.state = (!this._connectedAndInitialized) ? 1 : -2;
          break;
        case 1:
          $ctx.state = 2;
          return MongoClient.connect(this.options.connection, this.options.connectionOptions);
        case 2:
          db = $ctx.sent;
          $ctx.state = 4;
          break;
        case 4:
          $ctx.state = 6;
          return db.createCollection(this.options.stateCollectionName, this._w);
        case 6:
          this._stateCollection = $ctx.sent;
          $ctx.state = 8;
          break;
        case 8:
          $ctx.state = 10;
          return db.createCollection(this.options.locksCollectionName, this._w);
        case 10:
          this._locksCollection = $ctx.sent;
          $ctx.state = 12;
          break;
        case 12:
          $ctx.state = 14;
          return db.createCollection(this.options.promotedPropertiesCollectionName, this._w);
        case 14:
          this._promotedPropertiesCollection = $ctx.sent;
          $ctx.state = 16;
          break;
        case 16:
          $ctx.state = 18;
          return this._ensureIndexes();
        case 18:
          $ctx.maybeThrow();
          $ctx.state = 20;
          break;
        case 20:
          this._db = db;
          this._connectedAndInitialized = true;
          $ctx.state = -2;
          break;
        default:
          return $ctx.end();
      }
  }, $__3, this);
}));
MongoDBPersistence.prototype._ensureIndexes = function() {
  var self = this;
  return Bluebird.all([self._locksCollection.ensureIndex({name: 1}, {
    w: this._w.w,
    unique: true
  }), self._locksCollection.ensureIndex({heldTo: 1}, {
    w: this._w.w,
    unique: false
  }), self._locksCollection.ensureIndex({activeDelays: 1}, {
    w: this._w.w,
    unique: false
  }), self._stateCollection.ensureIndex({"activeDelays.methodName": 1}, {
    w: this._w.w,
    unique: false
  }), self._stateCollection.ensureIndex({"activeDelays.delayTo": 1}, {
    w: this._w.w,
    unique: false
  })]);
};
MongoDBPersistence.prototype.close = async($traceurRuntime.initGeneratorFunction(function $__4() {
  return $traceurRuntime.createGeneratorInstance(function($ctx) {
    while (true)
      switch ($ctx.state) {
        case 0:
          $ctx.state = (this._connectedAndInitialized) ? 1 : -2;
          break;
        case 1:
          $ctx.state = 2;
          return this._db.close();
        case 2:
          $ctx.maybeThrow();
          $ctx.state = 4;
          break;
        case 4:
          this._connectedAndInitialized = false;
          this._db = this._stateCollection = this._locksCollection = this._promotedPropertiesCollection = null;
          $ctx.state = -2;
          break;
        default:
          return $ctx.end();
      }
  }, $__4, this);
}));
MongoDBPersistence.prototype.__clear = function() {
  var self = this;
  return self._connectAndInit().then(function() {
    return Bluebird.all([self._locksCollection.deleteMany({}, {w: self._w.w}), self._stateCollection.deleteMany({}, {w: self._w.w}), self._promotedPropertiesCollection.deleteMany({}, {w: self._w.w})]);
  });
};
MongoDBPersistence.prototype.enterLock = async($traceurRuntime.initGeneratorFunction(function $__5(lockName, inLockTimeoutMs) {
  var now,
      result,
      e;
  return $traceurRuntime.createGeneratorInstance(function($ctx) {
    while (true)
      switch ($ctx.state) {
        case 0:
          $ctx.state = 2;
          return this._connectAndInit();
        case 2:
          $ctx.maybeThrow();
          $ctx.state = 4;
          break;
        case 4:
          $ctx.state = 6;
          return this._removeOldLocks();
        case 6:
          $ctx.maybeThrow();
          $ctx.state = 8;
          break;
        case 8:
          $ctx.pushTry(25, null);
          $ctx.state = 28;
          break;
        case 28:
          now = new Date();
          $ctx.state = 19;
          break;
        case 19:
          $ctx.state = 10;
          return this._locksCollection.insertOne({
            name: lockName,
            heldTo: now.addMilliseconds(inLockTimeoutMs)
          }, {w: this._w.w});
        case 10:
          result = $ctx.sent;
          $ctx.state = 12;
          break;
        case 12:
          $ctx.state = (result.insertedCount === 0) ? 13 : 14;
          break;
        case 13:
          $ctx.returnValue = null;
          $ctx.state = -2;
          break;
        case 14:
          $ctx.returnValue = {
            id: result.ops[0]._id,
            name: result.ops[0].name,
            heldTo: result.ops[0].heldTo
          };
          $ctx.state = -2;
          break;
        case 17:
          $ctx.popTry();
          $ctx.state = -2;
          break;
        case 25:
          $ctx.popTry();
          $ctx.maybeUncatchable();
          e = $ctx.storedException;
          $ctx.state = 22;
          break;
        case 22:
          $ctx.state = (e.code === 11000) ? 20 : 21;
          break;
        case 20:
          $ctx.returnValue = null;
          $ctx.state = -2;
          break;
        case 21:
          throw e;
          $ctx.state = -2;
          break;
        default:
          return $ctx.end();
      }
  }, $__5, this);
}));
MongoDBPersistence.prototype.renewLock = async($traceurRuntime.initGeneratorFunction(function $__6(lockId, inLockTimeoutMs) {
  var now,
      r;
  return $traceurRuntime.createGeneratorInstance(function($ctx) {
    while (true)
      switch ($ctx.state) {
        case 0:
          $ctx.state = 2;
          return self._connectAndInit();
        case 2:
          $ctx.maybeThrow();
          $ctx.state = 4;
          break;
        case 4:
          now = new Date();
          $ctx.state = 10;
          break;
        case 10:
          $ctx.state = 6;
          return this._locksCollection.update({
            _id: lockId,
            heldTo: {$lte: now}
          }, {$set: {heldTo: now.addMilliseconds(inLockTimeoutMs)}}, {w: this._w.w});
        case 6:
          r = $ctx.sent;
          $ctx.state = 8;
          break;
        case 8:
          if (r.nModified === 0) {
            throw new errors.ActivityRuntimeError("Lock by id '" + lockId + "' doesn't exists or not held.");
          }
          $ctx.state = -2;
          break;
        default:
          return $ctx.end();
      }
  }, $__6, this);
}));
MongoDBPersistence.prototype.exitLock = async($traceurRuntime.initGeneratorFunction(function $__7(lockId) {
  return $traceurRuntime.createGeneratorInstance(function($ctx) {
    while (true)
      switch ($ctx.state) {
        case 0:
          $ctx.state = 2;
          return this._connectAndInit();
        case 2:
          $ctx.maybeThrow();
          $ctx.state = 4;
          break;
        case 4:
          $ctx.state = 6;
          return this._locksCollection.deleteOne({_id: lockId}, {w: this._w.w});
        case 6:
          $ctx.maybeThrow();
          $ctx.state = -2;
          break;
        default:
          return $ctx.end();
      }
  }, $__7, this);
}));
MongoDBPersistence.prototype._removeOldLocks = async($traceurRuntime.initGeneratorFunction(function $__8() {
  var now;
  return $traceurRuntime.createGeneratorInstance(function($ctx) {
    while (true)
      switch ($ctx.state) {
        case 0:
          now = new Date();
          $ctx.state = 10;
          break;
        case 10:
          $ctx.state = 2;
          return this._connectAndInit();
        case 2:
          $ctx.maybeThrow();
          $ctx.state = 4;
          break;
        case 4:
          $ctx.state = 6;
          return this._locksCollection.remove({heldTo: {$lt: now}}, {w: this._w.w});
        case 6:
          $ctx.maybeThrow();
          $ctx.state = -2;
          break;
        default:
          return $ctx.end();
      }
  }, $__8, this);
}));
MongoDBPersistence.prototype.isRunning = async($traceurRuntime.initGeneratorFunction(function $__9(workflowName, instanceId) {
  var r;
  return $traceurRuntime.createGeneratorInstance(function($ctx) {
    while (true)
      switch ($ctx.state) {
        case 0:
          $ctx.state = 2;
          return this._connectAndInit();
        case 2:
          $ctx.maybeThrow();
          $ctx.state = 4;
          break;
        case 4:
          instanceId = instanceId.toString();
          $ctx.state = 12;
          break;
        case 12:
          $ctx.state = 6;
          return this._stateCollection.findOne({_id: {
              workflowName: workflowName,
              instanceId: instanceId
            }}, {
            w: this._w.w,
            fields: {_id: 1}
          });
        case 6:
          r = $ctx.sent;
          $ctx.state = 8;
          break;
        case 8:
          $ctx.returnValue = !!r;
          $ctx.state = -2;
          break;
        default:
          return $ctx.end();
      }
  }, $__9, this);
}));
MongoDBPersistence.prototype.persistState = async($traceurRuntime.initGeneratorFunction(function $__10(state) {
  function persistState() {
    return self._stateCollection.update({_id: {
        workflowName: state.workflowName,
        instanceId: instanceId
      }}, {
      workflowVersion: state.workflowVersion,
      createdOn: state.createdOn,
      updatedOn: state.updatedOn,
      activeDelays: state.activeDelays || null,
      state: self.options.stringifyState ? JSON.stringify(state.state) : state.state
    }, {
      w: self._w.w,
      upsert: true
    });
  }
  var self,
      instanceId;
  return $traceurRuntime.createGeneratorInstance(function($ctx) {
    while (true)
      switch ($ctx.state) {
        case 0:
          self = this;
          $ctx.state = 15;
          break;
        case 15:
          $ctx.state = 2;
          return self._connectAndInit();
        case 2:
          $ctx.maybeThrow();
          $ctx.state = 4;
          break;
        case 4:
          instanceId = state.instanceId.toString();
          $ctx.state = 17;
          break;
        case 17:
          $ctx.state = (state.promotedProperties && self.options.enablePromotions) ? 5 : 9;
          break;
        case 5:
          $ctx.state = 6;
          return Bluebird.all([persistState(), self._promotedPropertiesCollection.update({_id: {
              workflowName: state.workflowName,
              instanceId: instanceId
            }}, {
            workflowVersion: state.workflowVersion,
            createdOn: state.createdOn,
            updatedOn: state.updatedOn,
            properties: state.promotedProperties
          }, {
            w: self._w.w,
            upsert: true
          })]);
        case 6:
          $ctx.maybeThrow();
          $ctx.state = -2;
          break;
        case 9:
          $ctx.state = 10;
          return persistState();
        case 10:
          $ctx.maybeThrow();
          $ctx.state = -2;
          break;
        default:
          return $ctx.end();
      }
  }, $__10, this);
}));
MongoDBPersistence.prototype.getRunningInstanceIdHeader = async($traceurRuntime.initGeneratorFunction(function $__11(workflowName, instanceId) {
  var result;
  return $traceurRuntime.createGeneratorInstance(function($ctx) {
    while (true)
      switch ($ctx.state) {
        case 0:
          $ctx.state = 2;
          return this._connectAndInit();
        case 2:
          $ctx.maybeThrow();
          $ctx.state = 4;
          break;
        case 4:
          instanceId = instanceId.toString();
          $ctx.state = 15;
          break;
        case 15:
          $ctx.state = 6;
          return this._stateCollection.findOne({_id: {
              workflowName: workflowName,
              instanceId: instanceId
            }}, {
            w: this._w.w,
            fields: {
              _id: 0,
              updatedOn: 1,
              workflowVersion: 1
            }
          });
        case 6:
          result = $ctx.sent;
          $ctx.state = 8;
          break;
        case 8:
          $ctx.state = (!result) ? 9 : 10;
          break;
        case 9:
          $ctx.returnValue = null;
          $ctx.state = -2;
          break;
        case 10:
          $ctx.returnValue = {
            workflowName: workflowName,
            instanceId: instanceId,
            updatedOn: result.updatedOn,
            workflowVersion: result.workflowVersion
          };
          $ctx.state = -2;
          break;
        default:
          return $ctx.end();
      }
  }, $__11, this);
}));
MongoDBPersistence.prototype.loadState = async($traceurRuntime.initGeneratorFunction(function $__12(workflowName, instanceId) {
  var r;
  return $traceurRuntime.createGeneratorInstance(function($ctx) {
    while (true)
      switch ($ctx.state) {
        case 0:
          $ctx.state = 2;
          return this._connectAndInit();
        case 2:
          $ctx.maybeThrow();
          $ctx.state = 4;
          break;
        case 4:
          instanceId = instanceId.toString();
          $ctx.state = 12;
          break;
        case 12:
          $ctx.state = 6;
          return this._stateCollection.findOne({_id: {
              workflowName: workflowName,
              instanceId: instanceId
            }}, {
            w: this._w.w,
            fields: {_id: 0}
          });
        case 6:
          r = $ctx.sent;
          $ctx.state = 8;
          break;
        case 8:
          if (this.options.stringifyState) {
            r.state = JSON.parse(r.state);
          }
          r.workflowName = workflowName;
          r.instanceId = instanceId;
          $ctx.state = 14;
          break;
        case 14:
          $ctx.returnValue = r;
          $ctx.state = -2;
          break;
        default:
          return $ctx.end();
      }
  }, $__12, this);
}));
MongoDBPersistence.prototype.removeState = async($traceurRuntime.initGeneratorFunction(function $__13(workflowName, instanceId) {
  function remove() {
    return self._stateCollection.remove({_id: {
        workflowName: workflowName,
        instanceId: instanceId
      }}, {w: self._w.w});
  }
  var self;
  return $traceurRuntime.createGeneratorInstance(function($ctx) {
    while (true)
      switch ($ctx.state) {
        case 0:
          self = this;
          $ctx.state = 15;
          break;
        case 15:
          $ctx.state = 2;
          return self._connectAndInit();
        case 2:
          $ctx.maybeThrow();
          $ctx.state = 4;
          break;
        case 4:
          instanceId = instanceId.toString();
          $ctx.state = 17;
          break;
        case 17:
          $ctx.state = (self.options.enablePromotions) ? 5 : 9;
          break;
        case 5:
          $ctx.state = 6;
          return Bluebird.all([remove(), self._promotedPropertiesCollection.remove({_id: {
              workflowName: workflowName,
              instanceId: instanceId
            }}, {w: self._w.w})]);
        case 6:
          $ctx.maybeThrow();
          $ctx.state = -2;
          break;
        case 9:
          $ctx.state = 10;
          return remove();
        case 10:
          $ctx.maybeThrow();
          $ctx.state = -2;
          break;
        default:
          return $ctx.end();
      }
  }, $__13, this);
}));
MongoDBPersistence.prototype.loadPromotedProperties = async($traceurRuntime.initGeneratorFunction(function $__14(workflowName, instanceId) {
  var pp;
  return $traceurRuntime.createGeneratorInstance(function($ctx) {
    while (true)
      switch ($ctx.state) {
        case 0:
          $ctx.state = (!this.options.enablePromotions) ? 1 : 2;
          break;
        case 1:
          $ctx.returnValue = null;
          $ctx.state = -2;
          break;
        case 2:
          $ctx.state = 5;
          return this._connectAndInit();
        case 5:
          $ctx.maybeThrow();
          $ctx.state = 7;
          break;
        case 7:
          instanceId = instanceId.toString();
          $ctx.state = 15;
          break;
        case 15:
          $ctx.state = 9;
          return this._promotedPropertiesCollection.findOne({_id: {
              workflowName: workflowName,
              instanceId: instanceId
            }}, {
            w: this._w.w,
            fields: {properties: 1}
          });
        case 9:
          pp = $ctx.sent;
          $ctx.state = 11;
          break;
        case 11:
          $ctx.returnValue = pp ? pp.properties : null;
          $ctx.state = -2;
          break;
        default:
          return $ctx.end();
      }
  }, $__14, this);
}));
MongoDBPersistence.prototype.getNextWakeupables = async($traceurRuntime.initGeneratorFunction(function $__15(count) {
  var result;
  return $traceurRuntime.createGeneratorInstance(function($ctx) {
    while (true)
      switch ($ctx.state) {
        case 0:
          $ctx.state = 2;
          return this._connectAndInit();
        case 2:
          $ctx.maybeThrow();
          $ctx.state = 4;
          break;
        case 4:
          $ctx.state = 6;
          return this._stateCollection.aggregate([{$match: {activeDelays: {$ne: null}}}, {$project: {activeDelays: 1}}, {$unwind: "$activeDelays"}, {$sort: {
              updatedOn: 1,
              "activeDelays.delayTo": 1
            }}, {$limit: count}]).toArray();
        case 6:
          result = $ctx.sent;
          $ctx.state = 8;
          break;
        case 8:
          $ctx.returnValue = result.map(function(r) {
            return {
              instanceId: r._id.instanceId,
              workflowName: r._id.workflowName,
              activeDelay: {
                methodName: r.activeDelays.methodName,
                delayTo: r.activeDelays.delayTo
              }
            };
          });
          $ctx.state = -2;
          break;
        default:
          return $ctx.end();
      }
  }, $__15, this);
}));
MongoDBPersistence.prototype.getRunningInstanceHeadersForOtherVersion = async($traceurRuntime.initGeneratorFunction(function $__16(workflowName, version) {
  var list;
  return $traceurRuntime.createGeneratorInstance(function($ctx) {
    while (true)
      switch ($ctx.state) {
        case 0:
          $ctx.state = 2;
          return this._connectAndInit();
        case 2:
          $ctx.maybeThrow();
          $ctx.state = 4;
          break;
        case 4:
          $ctx.state = 6;
          return this._stateCollection.find({
            "_id.workflowName": {$eq: workflowName},
            workflowVersion: {$ne: version}
          }, {fields: {workflowVersion: 1}}).toArray();
        case 6:
          list = $ctx.sent;
          $ctx.state = 8;
          break;
        case 8:
          $ctx.returnValue = list.map(function(r) {
            return {
              instanceId: r._id.instanceId,
              workflowName: r._id.workflowName,
              workflowVersion: r.workflowVersion
            };
          });
          $ctx.state = -2;
          break;
        default:
          return $ctx.end();
      }
  }, $__16, this);
}));
module.exports = MongoDBPersistence;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1vbmdvREJQZXJzaXN0ZW5jZS5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUVBLEFBQUksRUFBQSxDQUFBLFFBQU8sRUFBSSxDQUFBLE9BQU0sQUFBQyxDQUFDLFVBQVMsQ0FBQyxDQUFDO0FBQ2xDLEFBQUksRUFBQSxDQUFBLENBQUEsRUFBSSxDQUFBLE9BQU0sQUFBQyxDQUFDLFFBQU8sQ0FBQyxDQUFDO0FBQ3pCLEFBQUksRUFBQSxDQUFBLE9BQU0sRUFBSSxDQUFBLE9BQU0sQUFBQyxDQUFDLFNBQVEsQ0FBQyxDQUFDO0FBQ2hDLEFBQUksRUFBQSxDQUFBLFdBQVUsRUFBSSxDQUFBLE9BQU0sWUFBWSxDQUFDO0FBQ3JDLEFBQUksRUFBQSxDQUFBLE1BQUssRUFBSSxDQUFBLE9BQU0sQUFBQyxDQUFDLGlCQUFnQixDQUFDLE9BQU8sQ0FBQztBQUM5QyxBQUFJLEVBQUEsQ0FBQSxLQUFJLEVBQUksQ0FBQSxNQUFLLGFBQWEsTUFBTSxDQUFDO0FBQ3JDLEFBQUksRUFBQSxDQUFBLE1BQUssRUFBSSxDQUFBLE1BQUssT0FBTyxDQUFDO0FBRTFCLE9BQVMsbUJBQWlCLENBQUUsT0FBTSxDQUFHO0FBQ2pDLEtBQUksQ0FBQyxDQUFBLFNBQVMsQUFBQyxDQUFDLE9BQU0sQ0FBQyxDQUFHO0FBQ3RCLFFBQU0sSUFBSSxVQUFRLEFBQUMsQ0FBQyxxQ0FBb0MsQ0FBQyxDQUFDO0VBQzlEO0FBQUEsQUFDQSxLQUFJLENBQUMsQ0FBQSxTQUFTLEFBQUMsQ0FBQyxPQUFNLFdBQVcsQ0FBQyxDQUFHO0FBQ2pDLFFBQU0sSUFBSSxNQUFJLEFBQUMsQ0FBQyxxQ0FBb0MsQ0FBQyxDQUFDO0VBQzFEO0FBQUEsQUFDQSxLQUFHLFNBQVMsRUFBSSxDQUFBLENBQUEsT0FBTyxBQUFDLENBQ3BCO0FBQ0ksb0JBQWdCLENBQUcsRUFBRSxFQUFDLENBQUcsRUFBRSxhQUFZLENBQUcsTUFBSSxDQUFFLENBQUU7QUFDbEQsc0JBQWtCLENBQUcsVUFBUTtBQUM3Qixt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QUFHLEVBQ2hCLEdBQUUsQ0FBRyxhQUFXLENBQ3BCO0FBQ0EsMEJBQWMsQ0FBRyxFQUNiLEdBQUUsQ0FBRyxRQUFNLENBQ2Y7QUFBQSxVQUNKLENBQUcsRUFBRSxNQUFLLENBQUcsRUFBQyxlQUFjLENBQUcsRUFBQSxDQUFDLENBQUMsQ0FBQyxRQUFRLEFBQUMsRUFBQzs7ZUFyYWhELENBQUEsSUFBRyxLQUFLOzs7O0FBQVIsYUFBRyxZQUFZLEVBdWFKLENBQUEsSUFBRyxJQUFJLEFBQUMsQ0FBQyxTQUFTLENBQUEsQ0FBRztBQUN4QixpQkFBTztBQUNILHVCQUFTLENBQUcsQ0FBQSxDQUFBLElBQUksV0FBVztBQUMzQix5QkFBVyxDQUFHLENBQUEsQ0FBQSxJQUFJLGFBQWE7QUFDL0IsNEJBQWMsQ0FBRyxDQUFBLENBQUEsZ0JBQWdCO0FBQUEsWUFDckMsQ0FBQztVQUNMLENBQUMsQUE3YThCLENBQUE7Ozs7QUFBbkMsZUFBTyxDQUFBLElBQUcsSUFBSSxBQUFDLEVBQUMsQ0FBQTs7QUFDbUIsRUFDL0IsUUFBNkIsS0FBRyxDQUFDLENBQUM7QUE0YXRDLENBOWF1RCxDQThhdEQsQ0FBQztBQUVGLEtBQUssUUFBUSxFQUFJLG1CQUFpQixDQUFDO0FBQ25DIiwiZmlsZSI6Im1vbmdvREJQZXJzaXN0ZW5jZS5qcyIsInNvdXJjZVJvb3QiOiJsaWIvZXM2Iiwic291cmNlc0NvbnRlbnQiOlsiXCJ1c2Ugc3RyaWN0XCI7XG5cbmxldCBCbHVlYmlyZCA9IHJlcXVpcmUoXCJibHVlYmlyZFwiKTtcbmxldCBfID0gcmVxdWlyZShcImxvZGFzaFwiKTtcbmxldCBtb25nb2RiID0gcmVxdWlyZShcIm1vbmdvZGJcIik7XG5sZXQgTW9uZ29DbGllbnQgPSBtb25nb2RiLk1vbmdvQ2xpZW50O1xubGV0IGNvbW1vbiA9IHJlcXVpcmUoXCJ3b3JrZmxvdy00LW5vZGVcIikuY29tbW9uO1xubGV0IGFzeW5jID0gY29tbW9uLmFzeW5jSGVscGVycy5hc3luYztcbmxldCBlcnJvcnMgPSBjb21tb24uZXJyb3JzO1xuXG5mdW5jdGlvbiBNb25nb0RCUGVyc2lzdGVuY2Uob3B0aW9ucykge1xuICAgIGlmICghXy5pc09iamVjdChvcHRpb25zKSkge1xuICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwiT2JqZWN0IGFyZ3VtZW50ICdvcHRpb25zJyBleHBlY3RlZC5cIik7XG4gICAgfVxuICAgIGlmICghXy5pc1N0cmluZyhvcHRpb25zLmNvbm5lY3Rpb24pKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcIkNvbm5lY3Rpb24gZXhwZWN0ZWQgaW4gdGhlIG9wdGlvbnMuXCIpO1xuICAgIH1cbiAgICB0aGlzLl9vcHRpb25zID0gXy5leHRlbmQoXG4gICAgICAgIHtcbiAgICAgICAgICAgIGNvbm5lY3Rpb25PcHRpb25zOiB7IGRiOiB7IG5hdGl2ZV9wYXJzZXI6IGZhbHNlIH0gfSxcbiAgICAgICAgICAgIHN0YXRlQ29sbGVjdGlvbk5hbWU6IFwiV0ZTdGF0ZVwiLFxuICAgICAgICAgICAgcHJvbW90ZWRQcm9wZXJ0aWVzQ29sbGVjdGlvbk5hbWU6IFwiV0ZQcm9tb3RlZFByb3BlcnRpZXNcIixcbiAgICAgICAgICAgIGxvY2tzQ29sbGVjdGlvbk5hbWU6IFwiV0ZMb2Nrc1wiLFxuICAgICAgICAgICAgc3RyaW5naWZ5U3RhdGU6IHRydWUsXG4gICAgICAgICAgICBlbmFibGVQcm9tb3Rpb25zOiB0cnVlLFxuICAgICAgICAgICAgdzogXCJtYWpvcml0eVwiXG4gICAgICAgIH0sXG4gICAgICAgIG9wdGlvbnMpO1xuICAgIHRoaXMuX2RiID0gbnVsbDtcbiAgICB0aGlzLl9zdGF0ZUNvbGxlY3Rpb24gPSBudWxsO1xuICAgIHRoaXMuX3Byb21vdGVkUHJvcGVydGllc0NvbGxlY3Rpb24gPSBudWxsO1xuICAgIHRoaXMuX2xvY2tzQ29sbGVjdGlvbiA9IG51bGw7XG4gICAgdGhpcy5fY29ubmVjdGVkQW5kSW5pdGlhbGl6ZWQgPSBmYWxzZTtcbiAgICB0aGlzLl93ID0geyB3OiB0aGlzLl9vcHRpb25zLncgfTtcbn1cblxuT2JqZWN0LmRlZmluZVByb3BlcnRpZXMoXG4gICAgTW9uZ29EQlBlcnNpc3RlbmNlLnByb3RvdHlwZSxcbiAgICB7XG4gICAgICAgIG9wdGlvbnM6IHtcbiAgICAgICAgICAgIGdldDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLl9vcHRpb25zO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfSk7XG5cbk1vbmdvREJQZXJzaXN0ZW5jZS5wcm90b3R5cGUuX2Nvbm5lY3RBbmRJbml0ID0gYXN5bmMoZnVuY3Rpb24qICgpIHtcbiAgICBpZiAoIXRoaXMuX2Nvbm5lY3RlZEFuZEluaXRpYWxpemVkKSB7XG4gICAgICAgIGxldCBkYiA9IHlpZWxkIE1vbmdvQ2xpZW50LmNvbm5lY3QodGhpcy5vcHRpb25zLmNvbm5lY3Rpb24sIHRoaXMub3B0aW9ucy5jb25uZWN0aW9uT3B0aW9ucyk7XG4gICAgICAgIHRoaXMuX3N0YXRlQ29sbGVjdGlvbiA9IHlpZWxkIGRiLmNyZWF0ZUNvbGxlY3Rpb24odGhpcy5vcHRpb25zLnN0YXRlQ29sbGVjdGlvbk5hbWUsIHRoaXMuX3cpO1xuICAgICAgICB0aGlzLl9sb2Nrc0NvbGxlY3Rpb24gPSB5aWVsZCBkYi5jcmVhdGVDb2xsZWN0aW9uKHRoaXMub3B0aW9ucy5sb2Nrc0NvbGxlY3Rpb25OYW1lLCB0aGlzLl93KTtcbiAgICAgICAgdGhpcy5fcHJvbW90ZWRQcm9wZXJ0aWVzQ29sbGVjdGlvbiA9IHlpZWxkIGRiLmNyZWF0ZUNvbGxlY3Rpb24odGhpcy5vcHRpb25zLnByb21vdGVkUHJvcGVydGllc0NvbGxlY3Rpb25OYW1lLCB0aGlzLl93KTtcblxuICAgICAgICB5aWVsZCB0aGlzLl9lbnN1cmVJbmRleGVzKCk7XG4gICAgICAgIHRoaXMuX2RiID0gZGI7XG4gICAgICAgIHRoaXMuX2Nvbm5lY3RlZEFuZEluaXRpYWxpemVkID0gdHJ1ZTtcbiAgICB9XG59KTtcblxuTW9uZ29EQlBlcnNpc3RlbmNlLnByb3RvdHlwZS5fZW5zdXJlSW5kZXhlcyA9IGZ1bmN0aW9uICgpIHtcbiAgICBsZXQgc2VsZiA9IHRoaXM7XG5cbiAgICByZXR1cm4gQmx1ZWJpcmQuYWxsKFtcbiAgICAgICAgc2VsZi5fbG9ja3NDb2xsZWN0aW9uLmVuc3VyZUluZGV4KHsgbmFtZTogMSB9LCB7IHc6IHRoaXMuX3cudywgdW5pcXVlOiB0cnVlIH0pLFxuICAgICAgICBzZWxmLl9sb2Nrc0NvbGxlY3Rpb24uZW5zdXJlSW5kZXgoeyBoZWxkVG86IDEgfSwgeyB3OiB0aGlzLl93LncsIHVuaXF1ZTogZmFsc2UgfSksXG4gICAgICAgIHNlbGYuX2xvY2tzQ29sbGVjdGlvbi5lbnN1cmVJbmRleCh7IGFjdGl2ZURlbGF5czogMSB9LCB7IHc6IHRoaXMuX3cudywgdW5pcXVlOiBmYWxzZSB9KSxcbiAgICAgICAgc2VsZi5fc3RhdGVDb2xsZWN0aW9uLmVuc3VyZUluZGV4KFxuICAgICAgICAgICAgeyBcImFjdGl2ZURlbGF5cy5tZXRob2ROYW1lXCI6IDEgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICB3OiB0aGlzLl93LncsXG4gICAgICAgICAgICAgICAgdW5pcXVlOiBmYWxzZVxuICAgICAgICAgICAgfVxuICAgICAgICApLFxuICAgICAgICBzZWxmLl9zdGF0ZUNvbGxlY3Rpb24uZW5zdXJlSW5kZXgoXG4gICAgICAgICAgICB7IFwiYWN0aXZlRGVsYXlzLmRlbGF5VG9cIjogMSB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIHc6IHRoaXMuX3cudyxcbiAgICAgICAgICAgICAgICB1bmlxdWU6IGZhbHNlXG4gICAgICAgICAgICB9XG4gICAgICAgIClcbiAgICBdKTtcbn07XG5cbk1vbmdvREJQZXJzaXN0ZW5jZS5wcm90b3R5cGUuY2xvc2UgPSBhc3luYyhmdW5jdGlvbiogKCkge1xuICAgIGlmICh0aGlzLl9jb25uZWN0ZWRBbmRJbml0aWFsaXplZCkge1xuICAgICAgICB5aWVsZCB0aGlzLl9kYi5jbG9zZSgpO1xuICAgICAgICB0aGlzLl9jb25uZWN0ZWRBbmRJbml0aWFsaXplZCA9IGZhbHNlO1xuICAgICAgICB0aGlzLl9kYiA9IHRoaXMuX3N0YXRlQ29sbGVjdGlvbiA9IHRoaXMuX2xvY2tzQ29sbGVjdGlvbiA9IHRoaXMuX3Byb21vdGVkUHJvcGVydGllc0NvbGxlY3Rpb24gPSBudWxsO1xuICAgIH1cbn0pO1xuXG4vLyBJbnRlcm5hbFxuTW9uZ29EQlBlcnNpc3RlbmNlLnByb3RvdHlwZS5fX2NsZWFyID0gZnVuY3Rpb24gKCkge1xuICAgIGxldCBzZWxmID0gdGhpcztcbiAgICByZXR1cm4gc2VsZi5fY29ubmVjdEFuZEluaXQoKVxuICAgICAgICAudGhlbihmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gQmx1ZWJpcmQuYWxsKFtcbiAgICAgICAgICAgICAgICBzZWxmLl9sb2Nrc0NvbGxlY3Rpb24uZGVsZXRlTWFueSh7fSwgeyB3OiBzZWxmLl93LncgfSksXG4gICAgICAgICAgICAgICAgc2VsZi5fc3RhdGVDb2xsZWN0aW9uLmRlbGV0ZU1hbnkoe30sIHsgdzogc2VsZi5fdy53IH0pLFxuICAgICAgICAgICAgICAgIHNlbGYuX3Byb21vdGVkUHJvcGVydGllc0NvbGxlY3Rpb24uZGVsZXRlTWFueSh7fSwgeyB3OiBzZWxmLl93LncgfSldKTtcbiAgICAgICAgfSk7XG59O1xuXG4vLyBMT0NLSU5HXG5Nb25nb0RCUGVyc2lzdGVuY2UucHJvdG90eXBlLmVudGVyTG9jayA9IGFzeW5jKGZ1bmN0aW9uKiAobG9ja05hbWUsIGluTG9ja1RpbWVvdXRNcykge1xuICAgIHlpZWxkIHRoaXMuX2Nvbm5lY3RBbmRJbml0KCk7XG4gICAgeWllbGQgdGhpcy5fcmVtb3ZlT2xkTG9ja3MoKTtcbiAgICB0cnkge1xuICAgICAgICBsZXQgbm93ID0gbmV3IERhdGUoKTtcbiAgICAgICAgbGV0IHJlc3VsdCA9IHlpZWxkIHRoaXMuX2xvY2tzQ29sbGVjdGlvbi5pbnNlcnRPbmUoXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgbmFtZTogbG9ja05hbWUsXG4gICAgICAgICAgICAgICAgaGVsZFRvOiBub3cuYWRkTWlsbGlzZWNvbmRzKGluTG9ja1RpbWVvdXRNcylcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7IHc6IHRoaXMuX3cudyB9XG4gICAgICAgICk7XG5cbiAgICAgICAgaWYgKHJlc3VsdC5pbnNlcnRlZENvdW50ID09PSAwKSB7XG4gICAgICAgICAgICByZXR1cm4gbnVsbDsgLy8gSXQncyBoZWxkLlxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIGlkOiByZXN1bHQub3BzWzBdLl9pZCxcbiAgICAgICAgICAgIG5hbWU6IHJlc3VsdC5vcHNbMF0ubmFtZSxcbiAgICAgICAgICAgIGhlbGRUbzogcmVzdWx0Lm9wc1swXS5oZWxkVG9cbiAgICAgICAgfTtcbiAgICB9XG4gICAgY2F0Y2ggKGUpIHtcbiAgICAgICAgaWYgKGUuY29kZSA9PT0gMTEwMDApIHtcbiAgICAgICAgICAgIHJldHVybiBudWxsOyAvLyBJdCdzIGhlbGQuXG4gICAgICAgIH1cbiAgICAgICAgdGhyb3cgZTsgLy8gU29tZSBNb25nb0RCIGVycm9yXG4gICAgfVxufSk7XG5cbk1vbmdvREJQZXJzaXN0ZW5jZS5wcm90b3R5cGUucmVuZXdMb2NrID0gYXN5bmMoZnVuY3Rpb24qIChsb2NrSWQsIGluTG9ja1RpbWVvdXRNcykge1xuICAgIHlpZWxkIHNlbGYuX2Nvbm5lY3RBbmRJbml0KCk7XG4gICAgbGV0IG5vdyA9IG5ldyBEYXRlKCk7XG4gICAgbGV0IHIgPSB5aWVsZCB0aGlzLl9sb2Nrc0NvbGxlY3Rpb24udXBkYXRlKFxuICAgICAgICB7XG4gICAgICAgICAgICBfaWQ6IGxvY2tJZCxcbiAgICAgICAgICAgIGhlbGRUbzogeyAkbHRlOiBub3cgfVxuICAgICAgICB9LFxuICAgICAgICB7XG4gICAgICAgICAgICAkc2V0OiB7IGhlbGRUbzogbm93LmFkZE1pbGxpc2Vjb25kcyhpbkxvY2tUaW1lb3V0TXMpIH1cbiAgICAgICAgfSxcbiAgICAgICAgeyB3OiB0aGlzLl93LncgfVxuICAgICk7XG4gICAgaWYgKHIubk1vZGlmaWVkID09PSAwKSB7XG4gICAgICAgIHRocm93IG5ldyBlcnJvcnMuQWN0aXZpdHlSdW50aW1lRXJyb3IoXCJMb2NrIGJ5IGlkICdcIiArIGxvY2tJZCArIFwiJyBkb2Vzbid0IGV4aXN0cyBvciBub3QgaGVsZC5cIik7XG4gICAgfVxufSk7XG5cbk1vbmdvREJQZXJzaXN0ZW5jZS5wcm90b3R5cGUuZXhpdExvY2sgPSBhc3luYyhmdW5jdGlvbiogKGxvY2tJZCkge1xuICAgIHlpZWxkIHRoaXMuX2Nvbm5lY3RBbmRJbml0KCk7XG4gICAgeWllbGQgdGhpcy5fbG9ja3NDb2xsZWN0aW9uLmRlbGV0ZU9uZShcbiAgICAgICAgeyBfaWQ6IGxvY2tJZCB9LFxuICAgICAgICB7IHc6IHRoaXMuX3cudyB9XG4gICAgKTtcbn0pO1xuXG5Nb25nb0RCUGVyc2lzdGVuY2UucHJvdG90eXBlLl9yZW1vdmVPbGRMb2NrcyA9IGFzeW5jKGZ1bmN0aW9uKiAoKSB7XG4gICAgbGV0IG5vdyA9IG5ldyBEYXRlKCk7XG4gICAgeWllbGQgdGhpcy5fY29ubmVjdEFuZEluaXQoKTtcbiAgICB5aWVsZCB0aGlzLl9sb2Nrc0NvbGxlY3Rpb24ucmVtb3ZlKFxuICAgICAgICB7XG4gICAgICAgICAgICBoZWxkVG86IHtcbiAgICAgICAgICAgICAgICAkbHQ6IG5vd1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICB7IHc6IHRoaXMuX3cudyB9XG4gICAgKTtcbn0pO1xuXG4vLyBTVEFURVxuXG5Nb25nb0RCUGVyc2lzdGVuY2UucHJvdG90eXBlLmlzUnVubmluZyA9IGFzeW5jKGZ1bmN0aW9uKiAod29ya2Zsb3dOYW1lLCBpbnN0YW5jZUlkKSB7XG4gICAgeWllbGQgdGhpcy5fY29ubmVjdEFuZEluaXQoKTtcblxuICAgIGluc3RhbmNlSWQgPSBpbnN0YW5jZUlkLnRvU3RyaW5nKCk7XG4gICAgbGV0IHIgPSB5aWVsZCB0aGlzLl9zdGF0ZUNvbGxlY3Rpb24uZmluZE9uZShcbiAgICAgICAgeyBfaWQ6IHsgd29ya2Zsb3dOYW1lOiB3b3JrZmxvd05hbWUsIGluc3RhbmNlSWQ6IGluc3RhbmNlSWQgfSB9LFxuICAgICAgICB7XG4gICAgICAgICAgICB3OiB0aGlzLl93LncsXG4gICAgICAgICAgICBmaWVsZHM6IHsgX2lkOiAxIH1cbiAgICAgICAgfVxuICAgICk7XG5cbiAgICByZXR1cm4gISFyO1xufSk7XG5cbk1vbmdvREJQZXJzaXN0ZW5jZS5wcm90b3R5cGUucGVyc2lzdFN0YXRlID0gYXN5bmMoZnVuY3Rpb24qIChzdGF0ZSkge1xuICAgIGxldCBzZWxmID0gdGhpcztcbiAgICB5aWVsZCBzZWxmLl9jb25uZWN0QW5kSW5pdCgpO1xuXG4gICAgbGV0IGluc3RhbmNlSWQgPSBzdGF0ZS5pbnN0YW5jZUlkLnRvU3RyaW5nKCk7XG5cbiAgICBmdW5jdGlvbiBwZXJzaXN0U3RhdGUoKSB7XG4gICAgICAgIHJldHVybiBzZWxmLl9zdGF0ZUNvbGxlY3Rpb24udXBkYXRlKFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIF9pZDoge1xuICAgICAgICAgICAgICAgICAgICB3b3JrZmxvd05hbWU6IHN0YXRlLndvcmtmbG93TmFtZSxcbiAgICAgICAgICAgICAgICAgICAgaW5zdGFuY2VJZDogaW5zdGFuY2VJZFxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgd29ya2Zsb3dWZXJzaW9uOiBzdGF0ZS53b3JrZmxvd1ZlcnNpb24sXG4gICAgICAgICAgICAgICAgY3JlYXRlZE9uOiBzdGF0ZS5jcmVhdGVkT24sXG4gICAgICAgICAgICAgICAgdXBkYXRlZE9uOiBzdGF0ZS51cGRhdGVkT24sXG4gICAgICAgICAgICAgICAgYWN0aXZlRGVsYXlzOiBzdGF0ZS5hY3RpdmVEZWxheXMgfHwgbnVsbCxcbiAgICAgICAgICAgICAgICBzdGF0ZTogc2VsZi5vcHRpb25zLnN0cmluZ2lmeVN0YXRlID8gSlNPTi5zdHJpbmdpZnkoc3RhdGUuc3RhdGUpIDogc3RhdGUuc3RhdGVcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgdzogc2VsZi5fdy53LFxuICAgICAgICAgICAgICAgIHVwc2VydDogdHJ1ZVxuICAgICAgICAgICAgfVxuICAgICAgICApO1xuICAgIH1cblxuICAgIGlmIChzdGF0ZS5wcm9tb3RlZFByb3BlcnRpZXMgJiYgc2VsZi5vcHRpb25zLmVuYWJsZVByb21vdGlvbnMpIHtcbiAgICAgICAgeWllbGQgQmx1ZWJpcmQuYWxsKFtcbiAgICAgICAgICAgIHBlcnNpc3RTdGF0ZSgpLFxuICAgICAgICAgICAgc2VsZi5fcHJvbW90ZWRQcm9wZXJ0aWVzQ29sbGVjdGlvbi51cGRhdGUoXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICBfaWQ6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHdvcmtmbG93TmFtZTogc3RhdGUud29ya2Zsb3dOYW1lLFxuICAgICAgICAgICAgICAgICAgICAgICAgaW5zdGFuY2VJZDogaW5zdGFuY2VJZFxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIHdvcmtmbG93VmVyc2lvbjogc3RhdGUud29ya2Zsb3dWZXJzaW9uLFxuICAgICAgICAgICAgICAgICAgICBjcmVhdGVkT246IHN0YXRlLmNyZWF0ZWRPbixcbiAgICAgICAgICAgICAgICAgICAgdXBkYXRlZE9uOiBzdGF0ZS51cGRhdGVkT24sXG4gICAgICAgICAgICAgICAgICAgIHByb3BlcnRpZXM6IHN0YXRlLnByb21vdGVkUHJvcGVydGllc1xuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICB3OiBzZWxmLl93LncsXG4gICAgICAgICAgICAgICAgICAgIHVwc2VydDogdHJ1ZVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIClcbiAgICAgICAgXSk7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgICB5aWVsZCBwZXJzaXN0U3RhdGUoKTtcbiAgICB9XG59KTtcblxuTW9uZ29EQlBlcnNpc3RlbmNlLnByb3RvdHlwZS5nZXRSdW5uaW5nSW5zdGFuY2VJZEhlYWRlciA9IGFzeW5jKGZ1bmN0aW9uKiAod29ya2Zsb3dOYW1lLCBpbnN0YW5jZUlkKSB7XG4gICAgeWllbGQgdGhpcy5fY29ubmVjdEFuZEluaXQoKTtcblxuICAgIGluc3RhbmNlSWQgPSBpbnN0YW5jZUlkLnRvU3RyaW5nKCk7XG5cbiAgICBsZXQgcmVzdWx0ID0geWllbGQgdGhpcy5fc3RhdGVDb2xsZWN0aW9uLmZpbmRPbmUoXG4gICAgICAgIHtcbiAgICAgICAgICAgIF9pZDoge1xuICAgICAgICAgICAgICAgIHdvcmtmbG93TmFtZTogd29ya2Zsb3dOYW1lLFxuICAgICAgICAgICAgICAgIGluc3RhbmNlSWQ6IGluc3RhbmNlSWRcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgICAgdzogdGhpcy5fdy53LFxuICAgICAgICAgICAgZmllbGRzOiB7XG4gICAgICAgICAgICAgICAgX2lkOiAwLFxuICAgICAgICAgICAgICAgIHVwZGF0ZWRPbjogMSxcbiAgICAgICAgICAgICAgICB3b3JrZmxvd1ZlcnNpb246IDFcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICk7XG5cbiAgICBpZiAoIXJlc3VsdCkge1xuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG5cbiAgICByZXR1cm4ge1xuICAgICAgICB3b3JrZmxvd05hbWU6IHdvcmtmbG93TmFtZSxcbiAgICAgICAgaW5zdGFuY2VJZDogaW5zdGFuY2VJZCxcbiAgICAgICAgdXBkYXRlZE9uOiByZXN1bHQudXBkYXRlZE9uLFxuICAgICAgICB3b3JrZmxvd1ZlcnNpb246IHJlc3VsdC53b3JrZmxvd1ZlcnNpb25cbiAgICB9O1xufSk7XG5cbk1vbmdvREJQZXJzaXN0ZW5jZS5wcm90b3R5cGUubG9hZFN0YXRlID0gYXN5bmMoZnVuY3Rpb24qICh3b3JrZmxvd05hbWUsIGluc3RhbmNlSWQpIHtcbiAgICB5aWVsZCB0aGlzLl9jb25uZWN0QW5kSW5pdCgpO1xuXG4gICAgaW5zdGFuY2VJZCA9IGluc3RhbmNlSWQudG9TdHJpbmcoKTtcblxuICAgIGxldCByID0geWllbGQgdGhpcy5fc3RhdGVDb2xsZWN0aW9uLmZpbmRPbmUoXG4gICAgICAgIHtcbiAgICAgICAgICAgIF9pZDoge1xuICAgICAgICAgICAgICAgIHdvcmtmbG93TmFtZTogd29ya2Zsb3dOYW1lLFxuICAgICAgICAgICAgICAgIGluc3RhbmNlSWQ6IGluc3RhbmNlSWRcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgICAgdzogdGhpcy5fdy53LFxuICAgICAgICAgICAgZmllbGRzOiB7XG4gICAgICAgICAgICAgICAgX2lkOiAwXG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICApO1xuXG4gICAgaWYgKHRoaXMub3B0aW9ucy5zdHJpbmdpZnlTdGF0ZSkge1xuICAgICAgICByLnN0YXRlID0gSlNPTi5wYXJzZShyLnN0YXRlKTtcbiAgICB9XG4gICAgci53b3JrZmxvd05hbWUgPSB3b3JrZmxvd05hbWU7XG4gICAgci5pbnN0YW5jZUlkID0gaW5zdGFuY2VJZDtcbiAgICByZXR1cm4gcjtcbn0pO1xuXG5Nb25nb0RCUGVyc2lzdGVuY2UucHJvdG90eXBlLnJlbW92ZVN0YXRlID0gYXN5bmMoZnVuY3Rpb24qICh3b3JrZmxvd05hbWUsIGluc3RhbmNlSWQpIHtcbiAgICBsZXQgc2VsZiA9IHRoaXM7XG4gICAgeWllbGQgc2VsZi5fY29ubmVjdEFuZEluaXQoKTtcblxuICAgIGluc3RhbmNlSWQgPSBpbnN0YW5jZUlkLnRvU3RyaW5nKCk7XG5cbiAgICBmdW5jdGlvbiByZW1vdmUoKSB7XG4gICAgICAgIHJldHVybiBzZWxmLl9zdGF0ZUNvbGxlY3Rpb24ucmVtb3ZlKFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIF9pZDoge1xuICAgICAgICAgICAgICAgICAgICB3b3JrZmxvd05hbWU6IHdvcmtmbG93TmFtZSxcbiAgICAgICAgICAgICAgICAgICAgaW5zdGFuY2VJZDogaW5zdGFuY2VJZFxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7IHc6IHNlbGYuX3cudyB9XG4gICAgICAgICk7XG4gICAgfVxuXG4gICAgaWYgKHNlbGYub3B0aW9ucy5lbmFibGVQcm9tb3Rpb25zKSB7XG4gICAgICAgIHlpZWxkIEJsdWViaXJkLmFsbChbXG4gICAgICAgICAgICByZW1vdmUoKSxcbiAgICAgICAgICAgIHNlbGYuX3Byb21vdGVkUHJvcGVydGllc0NvbGxlY3Rpb24ucmVtb3ZlKFxuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgX2lkOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICB3b3JrZmxvd05hbWU6IHdvcmtmbG93TmFtZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGluc3RhbmNlSWQ6IGluc3RhbmNlSWRcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgeyB3OiBzZWxmLl93LncgfVxuICAgICAgICAgICAgKVxuICAgICAgICBdKTtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICAgIHlpZWxkIHJlbW92ZSgpO1xuICAgIH1cbn0pO1xuXG5Nb25nb0RCUGVyc2lzdGVuY2UucHJvdG90eXBlLmxvYWRQcm9tb3RlZFByb3BlcnRpZXMgPSBhc3luYyhmdW5jdGlvbiogKHdvcmtmbG93TmFtZSwgaW5zdGFuY2VJZCkge1xuICAgIGlmICghdGhpcy5vcHRpb25zLmVuYWJsZVByb21vdGlvbnMpIHtcbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuXG4gICAgeWllbGQgdGhpcy5fY29ubmVjdEFuZEluaXQoKTtcblxuICAgIGluc3RhbmNlSWQgPSBpbnN0YW5jZUlkLnRvU3RyaW5nKCk7XG5cbiAgICBsZXQgcHAgPSB5aWVsZCB0aGlzLl9wcm9tb3RlZFByb3BlcnRpZXNDb2xsZWN0aW9uLmZpbmRPbmUoXG4gICAgICAgIHtcbiAgICAgICAgICAgIF9pZDoge1xuICAgICAgICAgICAgICAgIHdvcmtmbG93TmFtZTogd29ya2Zsb3dOYW1lLFxuICAgICAgICAgICAgICAgIGluc3RhbmNlSWQ6IGluc3RhbmNlSWRcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgICAgdzogdGhpcy5fdy53LFxuICAgICAgICAgICAgZmllbGRzOiB7XG4gICAgICAgICAgICAgICAgcHJvcGVydGllczogMVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgKTtcblxuICAgIHJldHVybiBwcCA/IHBwLnByb3BlcnRpZXMgOiBudWxsO1xufSk7XG5cbk1vbmdvREJQZXJzaXN0ZW5jZS5wcm90b3R5cGUuZ2V0TmV4dFdha2V1cGFibGVzID0gYXN5bmMoZnVuY3Rpb24qIChjb3VudCkge1xuICAgIHlpZWxkIHRoaXMuX2Nvbm5lY3RBbmRJbml0KCk7XG5cbiAgICBsZXQgcmVzdWx0ID0geWllbGQgdGhpcy5fc3RhdGVDb2xsZWN0aW9uXG4gICAgICAgIC5hZ2dyZWdhdGUoW1xuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICRtYXRjaDoge1xuICAgICAgICAgICAgICAgICAgICBhY3RpdmVEZWxheXM6IHsgJG5lOiBudWxsIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICRwcm9qZWN0OiB7XG4gICAgICAgICAgICAgICAgICAgIGFjdGl2ZURlbGF5czogMVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7ICR1bndpbmQ6IFwiJGFjdGl2ZURlbGF5c1wiIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgJHNvcnQ6IHtcbiAgICAgICAgICAgICAgICAgICAgdXBkYXRlZE9uOiAxLFxuICAgICAgICAgICAgICAgICAgICBcImFjdGl2ZURlbGF5cy5kZWxheVRvXCI6IDFcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgeyAkbGltaXQ6IGNvdW50IH1cbiAgICAgICAgXSlcbiAgICAgICAgLnRvQXJyYXkoKTtcblxuICAgIHJldHVybiByZXN1bHQubWFwKGZ1bmN0aW9uKHIpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIGluc3RhbmNlSWQ6IHIuX2lkLmluc3RhbmNlSWQsXG4gICAgICAgICAgICB3b3JrZmxvd05hbWU6IHIuX2lkLndvcmtmbG93TmFtZSxcbiAgICAgICAgICAgIGFjdGl2ZURlbGF5OiB7XG4gICAgICAgICAgICAgICAgbWV0aG9kTmFtZTogci5hY3RpdmVEZWxheXMubWV0aG9kTmFtZSxcbiAgICAgICAgICAgICAgICBkZWxheVRvOiByLmFjdGl2ZURlbGF5cy5kZWxheVRvXG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgfSk7XG59KTtcblxuTW9uZ29EQlBlcnNpc3RlbmNlLnByb3RvdHlwZS5nZXRSdW5uaW5nSW5zdGFuY2VIZWFkZXJzRm9yT3RoZXJWZXJzaW9uID0gYXN5bmMoZnVuY3Rpb24qKHdvcmtmbG93TmFtZSwgdmVyc2lvbikge1xuICAgIHlpZWxkIHRoaXMuX2Nvbm5lY3RBbmRJbml0KCk7XG5cbiAgICBsZXQgbGlzdCA9IHlpZWxkIHRoaXMuX3N0YXRlQ29sbGVjdGlvbi5maW5kKHtcbiAgICAgICAgXCJfaWQud29ya2Zsb3dOYW1lXCI6IHtcbiAgICAgICAgICAgICRlcTogd29ya2Zsb3dOYW1lXG4gICAgICAgIH0sXG4gICAgICAgIHdvcmtmbG93VmVyc2lvbjoge1xuICAgICAgICAgICAgJG5lOiB2ZXJzaW9uXG4gICAgICAgIH1cbiAgICB9LCB7IGZpZWxkczoge3dvcmtmbG93VmVyc2lvbjogMX19KS50b0FycmF5KCk7XG5cbiAgICByZXR1cm4gbGlzdC5tYXAoZnVuY3Rpb24ocikge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgaW5zdGFuY2VJZDogci5faWQuaW5zdGFuY2VJZCxcbiAgICAgICAgICAgIHdvcmtmbG93TmFtZTogci5faWQud29ya2Zsb3dOYW1lLFxuICAgICAgICAgICAgd29ya2Zsb3dWZXJzaW9uOiByLndvcmtmbG93VmVyc2lvblxuICAgICAgICB9O1xuICAgIH0pO1xufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gTW9uZ29EQlBlcnNpc3RlbmNlO1xuIl19
