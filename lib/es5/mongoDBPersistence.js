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
module.exports = MongoDBPersistence;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1vbmdvREJQZXJzaXN0ZW5jZS5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUVBLEFBQUksRUFBQSxDQUFBLFFBQU8sRUFBSSxDQUFBLE9BQU0sQUFBQyxDQUFDLFVBQVMsQ0FBQyxDQUFDO0FBQ2xDLEFBQUksRUFBQSxDQUFBLENBQUEsRUFBSSxDQUFBLE9BQU0sQUFBQyxDQUFDLFFBQU8sQ0FBQyxDQUFDO0FBQ3pCLEFBQUksRUFBQSxDQUFBLE9BQU0sRUFBSSxDQUFBLE9BQU0sQUFBQyxDQUFDLFNBQVEsQ0FBQyxDQUFDO0FBQ2hDLEFBQUksRUFBQSxDQUFBLFdBQVUsRUFBSSxDQUFBLE9BQU0sWUFBWSxDQUFDO0FBQ3JDLEFBQUksRUFBQSxDQUFBLE1BQUssRUFBSSxDQUFBLE9BQU0sQUFBQyxDQUFDLGlCQUFnQixDQUFDLE9BQU8sQ0FBQztBQUM5QyxBQUFJLEVBQUEsQ0FBQSxLQUFJLEVBQUksQ0FBQSxNQUFLLGFBQWEsTUFBTSxDQUFDO0FBQ3JDLEFBQUksRUFBQSxDQUFBLE1BQUssRUFBSSxDQUFBLE1BQUssT0FBTyxDQUFDO0FBRTFCLE9BQVMsbUJBQWlCLENBQUUsT0FBTSxDQUFHO0FBQ2pDLEtBQUksQ0FBQyxDQUFBLFNBQVMsQUFBQyxDQUFDLE9BQU0sQ0FBQyxDQUFHO0FBQ3RCLFFBQU0sSUFBSSxVQUFRLEFBQUMsQ0FBQyxxQ0FBb0MsQ0FBQyxDQUFDO0VBQzlEO0FBQUEsQUFDQSxLQUFJLENBQUMsQ0FBQSxTQUFTLEFBQUMsQ0FBQyxPQUFNLFdBQVcsQ0FBQyxDQUFHO0FBQ2pDLFFBQU0sSUFBSSxNQUFJLEFBQUMsQ0FBQyxxQ0FBb0MsQ0FBQyxDQUFDO0VBQzFEO0FBQUEsQUFDQSxLQUFHLFNBQVMsRUFBSSxDQUFBLENBQUEsT0FBTyxBQUFDLENBQ3BCO0FBQ0ksb0JBQWdCLENBQUcsRUFBRSxFQUFDLENBQUcsRUFBRSxhQUFZLENBQUcsTUFBSSxDQUFFLENBQUU7QUFDbEQsc0JBQWtCLENBQUcsVUFBUTtBQUM3Qixt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LENBQUcsRUFBQSxDQUNsQixDQUNKLENBQ0EsRUFBRSxPQUFNLENBQUcsZ0JBQWMsQ0FBRSxDQUMzQixFQUNJLEtBQUksQ0FBRztBQUNILHNCQUFRLENBQUcsRUFBQTtBQUNYLG1DQUFxQixDQUFHLEVBQUE7QUFBQSxZQUM1QixDQUNKLENBQ0EsRUFBRSxNQUFLLENBQUcsTUFBSSxDQUFFLENBQ3BCLENBQUMsUUFDTSxBQUFDLEVBQUM7O2lCQTdZakIsQ0FBQSxJQUFHLEtBQUs7Ozs7QUFBUixhQUFHLFlBQVksRUErWUosQ0FBQSxNQUFLLElBQUksQUFBQyxDQUFDLFNBQVMsQ0FBQSxDQUFHO0FBQzFCLGlCQUFPO0FBQ0gsdUJBQVMsQ0FBRyxDQUFBLENBQUEsSUFBSSxXQUFXO0FBQzNCLHlCQUFXLENBQUcsQ0FBQSxDQUFBLElBQUksYUFBYTtBQUMvQix3QkFBVSxDQUFHO0FBQ1QseUJBQVMsQ0FBRyxDQUFBLENBQUEsYUFBYSxXQUFXO0FBQ3BDLHNCQUFNLENBQUcsQ0FBQSxDQUFBLGFBQWEsUUFBUTtBQUFBLGNBQ2xDO0FBQUEsWUFDSixDQUFDO1VBQ0wsQ0FBQyxBQXhaOEIsQ0FBQTs7OztBQUFuQyxlQUFPLENBQUEsSUFBRyxJQUFJLEFBQUMsRUFBQyxDQUFBOztBQUNtQixFQUMvQixRQUE2QixLQUFHLENBQUMsQ0FBQztBQXVadEMsQ0F6WnVELENBeVp0RCxDQUFDO0FBRUYsS0FBSyxRQUFRLEVBQUksbUJBQWlCLENBQUM7QUFDbkMiLCJmaWxlIjoibW9uZ29EQlBlcnNpc3RlbmNlLmpzIiwic291cmNlUm9vdCI6ImxpYi9lczYiLCJzb3VyY2VzQ29udGVudCI6WyJcInVzZSBzdHJpY3RcIjtcblxubGV0IEJsdWViaXJkID0gcmVxdWlyZShcImJsdWViaXJkXCIpO1xubGV0IF8gPSByZXF1aXJlKFwibG9kYXNoXCIpO1xubGV0IG1vbmdvZGIgPSByZXF1aXJlKFwibW9uZ29kYlwiKTtcbmxldCBNb25nb0NsaWVudCA9IG1vbmdvZGIuTW9uZ29DbGllbnQ7XG5sZXQgY29tbW9uID0gcmVxdWlyZShcIndvcmtmbG93LTQtbm9kZVwiKS5jb21tb247XG5sZXQgYXN5bmMgPSBjb21tb24uYXN5bmNIZWxwZXJzLmFzeW5jO1xubGV0IGVycm9ycyA9IGNvbW1vbi5lcnJvcnM7XG5cbmZ1bmN0aW9uIE1vbmdvREJQZXJzaXN0ZW5jZShvcHRpb25zKSB7XG4gICAgaWYgKCFfLmlzT2JqZWN0KG9wdGlvbnMpKSB7XG4gICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXCJPYmplY3QgYXJndW1lbnQgJ29wdGlvbnMnIGV4cGVjdGVkLlwiKTtcbiAgICB9XG4gICAgaWYgKCFfLmlzU3RyaW5nKG9wdGlvbnMuY29ubmVjdGlvbikpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiQ29ubmVjdGlvbiBleHBlY3RlZCBpbiB0aGUgb3B0aW9ucy5cIik7XG4gICAgfVxuICAgIHRoaXMuX29wdGlvbnMgPSBfLmV4dGVuZChcbiAgICAgICAge1xuICAgICAgICAgICAgY29ubmVjdGlvbk9wdGlvbnM6IHsgZGI6IHsgbmF0aXZlX3BhcnNlcjogZmFsc2UgfSB9LFxuICAgICAgICAgICAgc3RhdGVDb2xsZWN0aW9uTmFtZTogXCJXRlN0YXRlXCIsXG4gICAgICAgICAgICBwcm9tb3RlZFByb3BlcnRpZXNDb2xsZWN0aW9uTmFtZTogXCJXRlByb21vdGVkUHJvcGVydGllc1wiLFxuICAgICAgICAgICAgbG9ja3NDb2xsZWN0aW9uTmFtZTogXCJXRkxvY2tzXCIsXG4gICAgICAgICAgICBzdHJpbmdpZnlTdGF0ZTogdHJ1ZSxcbiAgICAgICAgICAgIGVuYWJsZVByb21vdGlvbnM6IHRydWUsXG4gICAgICAgICAgICB3OiBcIm1ham9yaXR5XCJcbiAgICAgICAgfSxcbiAgICAgICAgb3B0aW9ucyk7XG4gICAgdGhpcy5fZGIgPSBudWxsO1xuICAgIHRoaXMuX3N0YXRlQ29sbGVjdGlvbiA9IG51bGw7XG4gICAgdGhpcy5fcHJvbW90ZWRQcm9wZXJ0aWVzQ29sbGVjdGlvbiA9IG51bGw7XG4gICAgdGhpcy5fbG9ja3NDb2xsZWN0aW9uID0gbnVsbDtcbiAgICB0aGlzLl9jb25uZWN0ZWRBbmRJbml0aWFsaXplZCA9IGZhbHNlO1xuICAgIHRoaXMuX3cgPSB7IHc6IHRoaXMuX29wdGlvbnMudyB9O1xufVxuXG5PYmplY3QuZGVmaW5lUHJvcGVydGllcyhcbiAgICBNb25nb0RCUGVyc2lzdGVuY2UucHJvdG90eXBlLFxuICAgIHtcbiAgICAgICAgb3B0aW9uczoge1xuICAgICAgICAgICAgZ2V0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuX29wdGlvbnM7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9KTtcblxuTW9uZ29EQlBlcnNpc3RlbmNlLnByb3RvdHlwZS5fY29ubmVjdEFuZEluaXQgPSBhc3luYyhmdW5jdGlvbiogKCkge1xuICAgIGlmICghdGhpcy5fY29ubmVjdGVkQW5kSW5pdGlhbGl6ZWQpIHtcbiAgICAgICAgbGV0IGRiID0geWllbGQgTW9uZ29DbGllbnQuY29ubmVjdCh0aGlzLm9wdGlvbnMuY29ubmVjdGlvbiwgdGhpcy5vcHRpb25zLmNvbm5lY3Rpb25PcHRpb25zKTtcbiAgICAgICAgdGhpcy5fc3RhdGVDb2xsZWN0aW9uID0geWllbGQgZGIuY3JlYXRlQ29sbGVjdGlvbih0aGlzLm9wdGlvbnMuc3RhdGVDb2xsZWN0aW9uTmFtZSwgdGhpcy5fdyk7XG4gICAgICAgIHRoaXMuX2xvY2tzQ29sbGVjdGlvbiA9IHlpZWxkIGRiLmNyZWF0ZUNvbGxlY3Rpb24odGhpcy5vcHRpb25zLmxvY2tzQ29sbGVjdGlvbk5hbWUsIHRoaXMuX3cpO1xuICAgICAgICB0aGlzLl9wcm9tb3RlZFByb3BlcnRpZXNDb2xsZWN0aW9uID0geWllbGQgZGIuY3JlYXRlQ29sbGVjdGlvbih0aGlzLm9wdGlvbnMucHJvbW90ZWRQcm9wZXJ0aWVzQ29sbGVjdGlvbk5hbWUsIHRoaXMuX3cpO1xuXG4gICAgICAgIHlpZWxkIHRoaXMuX2Vuc3VyZUluZGV4ZXMoKTtcbiAgICAgICAgdGhpcy5fZGIgPSBkYjtcbiAgICAgICAgdGhpcy5fY29ubmVjdGVkQW5kSW5pdGlhbGl6ZWQgPSB0cnVlO1xuICAgIH1cbn0pO1xuXG5Nb25nb0RCUGVyc2lzdGVuY2UucHJvdG90eXBlLl9lbnN1cmVJbmRleGVzID0gZnVuY3Rpb24gKCkge1xuICAgIGxldCBzZWxmID0gdGhpcztcblxuICAgIHJldHVybiBCbHVlYmlyZC5hbGwoW1xuICAgICAgICBzZWxmLl9sb2Nrc0NvbGxlY3Rpb24uZW5zdXJlSW5kZXgoeyBuYW1lOiAxIH0sIHsgdzogdGhpcy5fdy53LCB1bmlxdWU6IHRydWUgfSksXG4gICAgICAgIHNlbGYuX2xvY2tzQ29sbGVjdGlvbi5lbnN1cmVJbmRleCh7IGhlbGRUbzogMSB9LCB7IHc6IHRoaXMuX3cudywgdW5pcXVlOiBmYWxzZSB9KSxcbiAgICAgICAgc2VsZi5fbG9ja3NDb2xsZWN0aW9uLmVuc3VyZUluZGV4KHsgYWN0aXZlRGVsYXlzOiAxIH0sIHsgdzogdGhpcy5fdy53LCB1bmlxdWU6IGZhbHNlIH0pLFxuICAgICAgICBzZWxmLl9zdGF0ZUNvbGxlY3Rpb24uZW5zdXJlSW5kZXgoXG4gICAgICAgICAgICB7IFwiYWN0aXZlRGVsYXlzLm1ldGhvZE5hbWVcIjogMSB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIHc6IHRoaXMuX3cudyxcbiAgICAgICAgICAgICAgICB1bmlxdWU6IGZhbHNlXG4gICAgICAgICAgICB9XG4gICAgICAgICksXG4gICAgICAgIHNlbGYuX3N0YXRlQ29sbGVjdGlvbi5lbnN1cmVJbmRleChcbiAgICAgICAgICAgIHsgXCJhY3RpdmVEZWxheXMuZGVsYXlUb1wiOiAxIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgdzogdGhpcy5fdy53LFxuICAgICAgICAgICAgICAgIHVuaXF1ZTogZmFsc2VcbiAgICAgICAgICAgIH1cbiAgICAgICAgKVxuICAgIF0pO1xufTtcblxuTW9uZ29EQlBlcnNpc3RlbmNlLnByb3RvdHlwZS5jbG9zZSA9IGFzeW5jKGZ1bmN0aW9uKiAoKSB7XG4gICAgaWYgKHRoaXMuX2Nvbm5lY3RlZEFuZEluaXRpYWxpemVkKSB7XG4gICAgICAgIHlpZWxkIHRoaXMuX2RiLmNsb3NlKCk7XG4gICAgICAgIHRoaXMuX2Nvbm5lY3RlZEFuZEluaXRpYWxpemVkID0gZmFsc2U7XG4gICAgICAgIHRoaXMuX2RiID0gdGhpcy5fc3RhdGVDb2xsZWN0aW9uID0gdGhpcy5fbG9ja3NDb2xsZWN0aW9uID0gdGhpcy5fcHJvbW90ZWRQcm9wZXJ0aWVzQ29sbGVjdGlvbiA9IG51bGw7XG4gICAgfVxufSk7XG5cbi8vIEludGVybmFsXG5Nb25nb0RCUGVyc2lzdGVuY2UucHJvdG90eXBlLl9fY2xlYXIgPSBmdW5jdGlvbiAoKSB7XG4gICAgbGV0IHNlbGYgPSB0aGlzO1xuICAgIHJldHVybiBzZWxmLl9jb25uZWN0QW5kSW5pdCgpXG4gICAgICAgIC50aGVuKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiBCbHVlYmlyZC5hbGwoW1xuICAgICAgICAgICAgICAgIHNlbGYuX2xvY2tzQ29sbGVjdGlvbi5kZWxldGVNYW55KHt9LCB7IHc6IHNlbGYuX3cudyB9KSxcbiAgICAgICAgICAgICAgICBzZWxmLl9zdGF0ZUNvbGxlY3Rpb24uZGVsZXRlTWFueSh7fSwgeyB3OiBzZWxmLl93LncgfSksXG4gICAgICAgICAgICAgICAgc2VsZi5fcHJvbW90ZWRQcm9wZXJ0aWVzQ29sbGVjdGlvbi5kZWxldGVNYW55KHt9LCB7IHc6IHNlbGYuX3cudyB9KV0pO1xuICAgICAgICB9KTtcbn07XG5cbi8vIExPQ0tJTkdcbk1vbmdvREJQZXJzaXN0ZW5jZS5wcm90b3R5cGUuZW50ZXJMb2NrID0gYXN5bmMoZnVuY3Rpb24qIChsb2NrTmFtZSwgaW5Mb2NrVGltZW91dE1zKSB7XG4gICAgeWllbGQgdGhpcy5fY29ubmVjdEFuZEluaXQoKTtcbiAgICB5aWVsZCB0aGlzLl9yZW1vdmVPbGRMb2NrcygpO1xuICAgIHRyeSB7XG4gICAgICAgIGxldCBub3cgPSBuZXcgRGF0ZSgpO1xuICAgICAgICBsZXQgcmVzdWx0ID0geWllbGQgdGhpcy5fbG9ja3NDb2xsZWN0aW9uLmluc2VydE9uZShcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBuYW1lOiBsb2NrTmFtZSxcbiAgICAgICAgICAgICAgICBoZWxkVG86IG5vdy5hZGRNaWxsaXNlY29uZHMoaW5Mb2NrVGltZW91dE1zKVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHsgdzogdGhpcy5fdy53IH1cbiAgICAgICAgKTtcblxuICAgICAgICBpZiAocmVzdWx0Lmluc2VydGVkQ291bnQgPT09IDApIHtcbiAgICAgICAgICAgIHJldHVybiBudWxsOyAvLyBJdCdzIGhlbGQuXG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgaWQ6IHJlc3VsdC5vcHNbMF0uX2lkLFxuICAgICAgICAgICAgbmFtZTogcmVzdWx0Lm9wc1swXS5uYW1lLFxuICAgICAgICAgICAgaGVsZFRvOiByZXN1bHQub3BzWzBdLmhlbGRUb1xuICAgICAgICB9O1xuICAgIH1cbiAgICBjYXRjaCAoZSkge1xuICAgICAgICBpZiAoZS5jb2RlID09PSAxMTAwMCkge1xuICAgICAgICAgICAgcmV0dXJuIG51bGw7IC8vIEl0J3MgaGVsZC5cbiAgICAgICAgfVxuICAgICAgICB0aHJvdyBlOyAvLyBTb21lIE1vbmdvREIgZXJyb3JcbiAgICB9XG59KTtcblxuTW9uZ29EQlBlcnNpc3RlbmNlLnByb3RvdHlwZS5yZW5ld0xvY2sgPSBhc3luYyhmdW5jdGlvbiogKGxvY2tJZCwgaW5Mb2NrVGltZW91dE1zKSB7XG4gICAgeWllbGQgc2VsZi5fY29ubmVjdEFuZEluaXQoKTtcbiAgICBsZXQgbm93ID0gbmV3IERhdGUoKTtcbiAgICBsZXQgciA9IHlpZWxkIHRoaXMuX2xvY2tzQ29sbGVjdGlvbi51cGRhdGUoXG4gICAgICAgIHtcbiAgICAgICAgICAgIF9pZDogbG9ja0lkLFxuICAgICAgICAgICAgaGVsZFRvOiB7ICRsdGU6IG5vdyB9XG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICAgICRzZXQ6IHsgaGVsZFRvOiBub3cuYWRkTWlsbGlzZWNvbmRzKGluTG9ja1RpbWVvdXRNcykgfVxuICAgICAgICB9LFxuICAgICAgICB7IHc6IHRoaXMuX3cudyB9XG4gICAgKTtcbiAgICBpZiAoci5uTW9kaWZpZWQgPT09IDApIHtcbiAgICAgICAgdGhyb3cgbmV3IGVycm9ycy5BY3Rpdml0eVJ1bnRpbWVFcnJvcihcIkxvY2sgYnkgaWQgJ1wiICsgbG9ja0lkICsgXCInIGRvZXNuJ3QgZXhpc3RzIG9yIG5vdCBoZWxkLlwiKTtcbiAgICB9XG59KTtcblxuTW9uZ29EQlBlcnNpc3RlbmNlLnByb3RvdHlwZS5leGl0TG9jayA9IGFzeW5jKGZ1bmN0aW9uKiAobG9ja0lkKSB7XG4gICAgeWllbGQgdGhpcy5fY29ubmVjdEFuZEluaXQoKTtcbiAgICB5aWVsZCB0aGlzLl9sb2Nrc0NvbGxlY3Rpb24uZGVsZXRlT25lKFxuICAgICAgICB7IF9pZDogbG9ja0lkIH0sXG4gICAgICAgIHsgdzogdGhpcy5fdy53IH1cbiAgICApO1xufSk7XG5cbk1vbmdvREJQZXJzaXN0ZW5jZS5wcm90b3R5cGUuX3JlbW92ZU9sZExvY2tzID0gYXN5bmMoZnVuY3Rpb24qICgpIHtcbiAgICBsZXQgbm93ID0gbmV3IERhdGUoKTtcbiAgICB5aWVsZCB0aGlzLl9jb25uZWN0QW5kSW5pdCgpO1xuICAgIHlpZWxkIHRoaXMuX2xvY2tzQ29sbGVjdGlvbi5yZW1vdmUoXG4gICAgICAgIHtcbiAgICAgICAgICAgIGhlbGRUbzoge1xuICAgICAgICAgICAgICAgICRsdDogbm93XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIHsgdzogdGhpcy5fdy53IH1cbiAgICApO1xufSk7XG5cbi8vIFNUQVRFXG5cbk1vbmdvREJQZXJzaXN0ZW5jZS5wcm90b3R5cGUuaXNSdW5uaW5nID0gYXN5bmMoZnVuY3Rpb24qICh3b3JrZmxvd05hbWUsIGluc3RhbmNlSWQpIHtcbiAgICB5aWVsZCB0aGlzLl9jb25uZWN0QW5kSW5pdCgpO1xuXG4gICAgaW5zdGFuY2VJZCA9IGluc3RhbmNlSWQudG9TdHJpbmcoKTtcbiAgICBsZXQgciA9IHlpZWxkIHRoaXMuX3N0YXRlQ29sbGVjdGlvbi5maW5kT25lKFxuICAgICAgICB7IF9pZDogeyB3b3JrZmxvd05hbWU6IHdvcmtmbG93TmFtZSwgaW5zdGFuY2VJZDogaW5zdGFuY2VJZCB9IH0sXG4gICAgICAgIHtcbiAgICAgICAgICAgIHc6IHRoaXMuX3cudyxcbiAgICAgICAgICAgIGZpZWxkczogeyBfaWQ6IDEgfVxuICAgICAgICB9XG4gICAgKTtcblxuICAgIHJldHVybiAhIXI7XG59KTtcblxuTW9uZ29EQlBlcnNpc3RlbmNlLnByb3RvdHlwZS5wZXJzaXN0U3RhdGUgPSBhc3luYyhmdW5jdGlvbiogKHN0YXRlKSB7XG4gICAgbGV0IHNlbGYgPSB0aGlzO1xuICAgIHlpZWxkIHNlbGYuX2Nvbm5lY3RBbmRJbml0KCk7XG5cbiAgICBsZXQgaW5zdGFuY2VJZCA9IHN0YXRlLmluc3RhbmNlSWQudG9TdHJpbmcoKTtcblxuICAgIGZ1bmN0aW9uIHBlcnNpc3RTdGF0ZSgpIHtcbiAgICAgICAgcmV0dXJuIHNlbGYuX3N0YXRlQ29sbGVjdGlvbi51cGRhdGUoXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgX2lkOiB7XG4gICAgICAgICAgICAgICAgICAgIHdvcmtmbG93TmFtZTogc3RhdGUud29ya2Zsb3dOYW1lLFxuICAgICAgICAgICAgICAgICAgICBpbnN0YW5jZUlkOiBpbnN0YW5jZUlkXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICB3b3JrZmxvd1ZlcnNpb246IHN0YXRlLndvcmtmbG93VmVyc2lvbixcbiAgICAgICAgICAgICAgICBjcmVhdGVkT246IHN0YXRlLmNyZWF0ZWRPbixcbiAgICAgICAgICAgICAgICB1cGRhdGVkT246IHN0YXRlLnVwZGF0ZWRPbixcbiAgICAgICAgICAgICAgICBhY3RpdmVEZWxheXM6IHN0YXRlLmFjdGl2ZURlbGF5cyB8fCBudWxsLFxuICAgICAgICAgICAgICAgIHN0YXRlOiBzZWxmLm9wdGlvbnMuc3RyaW5naWZ5U3RhdGUgPyBKU09OLnN0cmluZ2lmeShzdGF0ZS5zdGF0ZSkgOiBzdGF0ZS5zdGF0ZVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICB3OiBzZWxmLl93LncsXG4gICAgICAgICAgICAgICAgdXBzZXJ0OiB0cnVlXG4gICAgICAgICAgICB9XG4gICAgICAgICk7XG4gICAgfVxuXG4gICAgaWYgKHN0YXRlLnByb21vdGVkUHJvcGVydGllcyAmJiBzZWxmLm9wdGlvbnMuZW5hYmxlUHJvbW90aW9ucykge1xuICAgICAgICB5aWVsZCBCbHVlYmlyZC5hbGwoW1xuICAgICAgICAgICAgcGVyc2lzdFN0YXRlKCksXG4gICAgICAgICAgICBzZWxmLl9wcm9tb3RlZFByb3BlcnRpZXNDb2xsZWN0aW9uLnVwZGF0ZShcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIF9pZDoge1xuICAgICAgICAgICAgICAgICAgICAgICAgd29ya2Zsb3dOYW1lOiBzdGF0ZS53b3JrZmxvd05hbWUsXG4gICAgICAgICAgICAgICAgICAgICAgICBpbnN0YW5jZUlkOiBpbnN0YW5jZUlkXG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgd29ya2Zsb3dWZXJzaW9uOiBzdGF0ZS53b3JrZmxvd1ZlcnNpb24sXG4gICAgICAgICAgICAgICAgICAgIGNyZWF0ZWRPbjogc3RhdGUuY3JlYXRlZE9uLFxuICAgICAgICAgICAgICAgICAgICB1cGRhdGVkT246IHN0YXRlLnVwZGF0ZWRPbixcbiAgICAgICAgICAgICAgICAgICAgcHJvcGVydGllczogc3RhdGUucHJvbW90ZWRQcm9wZXJ0aWVzXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIHc6IHNlbGYuX3cudyxcbiAgICAgICAgICAgICAgICAgICAgdXBzZXJ0OiB0cnVlXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgKVxuICAgICAgICBdKTtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICAgIHlpZWxkIHBlcnNpc3RTdGF0ZSgpO1xuICAgIH1cbn0pO1xuXG5Nb25nb0RCUGVyc2lzdGVuY2UucHJvdG90eXBlLmdldFJ1bm5pbmdJbnN0YW5jZUlkSGVhZGVyID0gYXN5bmMoZnVuY3Rpb24qICh3b3JrZmxvd05hbWUsIGluc3RhbmNlSWQpIHtcbiAgICB5aWVsZCB0aGlzLl9jb25uZWN0QW5kSW5pdCgpO1xuXG4gICAgaW5zdGFuY2VJZCA9IGluc3RhbmNlSWQudG9TdHJpbmcoKTtcblxuICAgIGxldCByZXN1bHQgPSB5aWVsZCB0aGlzLl9zdGF0ZUNvbGxlY3Rpb24uZmluZE9uZShcbiAgICAgICAge1xuICAgICAgICAgICAgX2lkOiB7XG4gICAgICAgICAgICAgICAgd29ya2Zsb3dOYW1lOiB3b3JrZmxvd05hbWUsXG4gICAgICAgICAgICAgICAgaW5zdGFuY2VJZDogaW5zdGFuY2VJZFxuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICB7XG4gICAgICAgICAgICB3OiB0aGlzLl93LncsXG4gICAgICAgICAgICBmaWVsZHM6IHtcbiAgICAgICAgICAgICAgICBfaWQ6IDAsXG4gICAgICAgICAgICAgICAgdXBkYXRlZE9uOiAxLFxuICAgICAgICAgICAgICAgIHdvcmtmbG93VmVyc2lvbjogMVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgKTtcblxuICAgIGlmICghcmVzdWx0KSB7XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgIH1cblxuICAgIHJldHVybiB7XG4gICAgICAgIHdvcmtmbG93TmFtZTogd29ya2Zsb3dOYW1lLFxuICAgICAgICBpbnN0YW5jZUlkOiBpbnN0YW5jZUlkLFxuICAgICAgICB1cGRhdGVkT246IHJlc3VsdC51cGRhdGVkT24sXG4gICAgICAgIHdvcmtmbG93VmVyc2lvbjogcmVzdWx0LndvcmtmbG93VmVyc2lvblxuICAgIH07XG59KTtcblxuTW9uZ29EQlBlcnNpc3RlbmNlLnByb3RvdHlwZS5sb2FkU3RhdGUgPSBhc3luYyhmdW5jdGlvbiogKHdvcmtmbG93TmFtZSwgaW5zdGFuY2VJZCkge1xuICAgIHlpZWxkIHRoaXMuX2Nvbm5lY3RBbmRJbml0KCk7XG5cbiAgICBpbnN0YW5jZUlkID0gaW5zdGFuY2VJZC50b1N0cmluZygpO1xuXG4gICAgbGV0IHIgPSB5aWVsZCB0aGlzLl9zdGF0ZUNvbGxlY3Rpb24uZmluZE9uZShcbiAgICAgICAge1xuICAgICAgICAgICAgX2lkOiB7XG4gICAgICAgICAgICAgICAgd29ya2Zsb3dOYW1lOiB3b3JrZmxvd05hbWUsXG4gICAgICAgICAgICAgICAgaW5zdGFuY2VJZDogaW5zdGFuY2VJZFxuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICB7XG4gICAgICAgICAgICB3OiB0aGlzLl93LncsXG4gICAgICAgICAgICBmaWVsZHM6IHtcbiAgICAgICAgICAgICAgICBfaWQ6IDBcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICk7XG5cbiAgICBpZiAodGhpcy5vcHRpb25zLnN0cmluZ2lmeVN0YXRlKSB7XG4gICAgICAgIHIuc3RhdGUgPSBKU09OLnBhcnNlKHIuc3RhdGUpO1xuICAgIH1cbiAgICByLndvcmtmbG93TmFtZSA9IHdvcmtmbG93TmFtZTtcbiAgICByLmluc3RhbmNlSWQgPSBpbnN0YW5jZUlkO1xuICAgIHJldHVybiByO1xufSk7XG5cbk1vbmdvREJQZXJzaXN0ZW5jZS5wcm90b3R5cGUucmVtb3ZlU3RhdGUgPSBhc3luYyhmdW5jdGlvbiogKHdvcmtmbG93TmFtZSwgaW5zdGFuY2VJZCkge1xuICAgIGxldCBzZWxmID0gdGhpcztcbiAgICB5aWVsZCBzZWxmLl9jb25uZWN0QW5kSW5pdCgpO1xuXG4gICAgaW5zdGFuY2VJZCA9IGluc3RhbmNlSWQudG9TdHJpbmcoKTtcblxuICAgIGZ1bmN0aW9uIHJlbW92ZSgpIHtcbiAgICAgICAgcmV0dXJuIHNlbGYuX3N0YXRlQ29sbGVjdGlvbi5yZW1vdmUoXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgX2lkOiB7XG4gICAgICAgICAgICAgICAgICAgIHdvcmtmbG93TmFtZTogd29ya2Zsb3dOYW1lLFxuICAgICAgICAgICAgICAgICAgICBpbnN0YW5jZUlkOiBpbnN0YW5jZUlkXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHsgdzogc2VsZi5fdy53IH1cbiAgICAgICAgKTtcbiAgICB9XG5cbiAgICBpZiAoc2VsZi5vcHRpb25zLmVuYWJsZVByb21vdGlvbnMpIHtcbiAgICAgICAgeWllbGQgQmx1ZWJpcmQuYWxsKFtcbiAgICAgICAgICAgIHJlbW92ZSgpLFxuICAgICAgICAgICAgc2VsZi5fcHJvbW90ZWRQcm9wZXJ0aWVzQ29sbGVjdGlvbi5yZW1vdmUoXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICBfaWQ6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHdvcmtmbG93TmFtZTogd29ya2Zsb3dOYW1lLFxuICAgICAgICAgICAgICAgICAgICAgICAgaW5zdGFuY2VJZDogaW5zdGFuY2VJZFxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICB7IHc6IHNlbGYuX3cudyB9XG4gICAgICAgICAgICApXG4gICAgICAgIF0pO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgICAgeWllbGQgcmVtb3ZlKCk7XG4gICAgfVxufSk7XG5cbk1vbmdvREJQZXJzaXN0ZW5jZS5wcm90b3R5cGUubG9hZFByb21vdGVkUHJvcGVydGllcyA9IGFzeW5jKGZ1bmN0aW9uKiAod29ya2Zsb3dOYW1lLCBpbnN0YW5jZUlkKSB7XG4gICAgaWYgKCF0aGlzLm9wdGlvbnMuZW5hYmxlUHJvbW90aW9ucykge1xuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG5cbiAgICB5aWVsZCB0aGlzLl9jb25uZWN0QW5kSW5pdCgpO1xuXG4gICAgaW5zdGFuY2VJZCA9IGluc3RhbmNlSWQudG9TdHJpbmcoKTtcblxuICAgIGxldCBwcCA9IHlpZWxkIHRoaXMuX3Byb21vdGVkUHJvcGVydGllc0NvbGxlY3Rpb24uZmluZE9uZShcbiAgICAgICAge1xuICAgICAgICAgICAgX2lkOiB7XG4gICAgICAgICAgICAgICAgd29ya2Zsb3dOYW1lOiB3b3JrZmxvd05hbWUsXG4gICAgICAgICAgICAgICAgaW5zdGFuY2VJZDogaW5zdGFuY2VJZFxuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICB7XG4gICAgICAgICAgICB3OiB0aGlzLl93LncsXG4gICAgICAgICAgICBmaWVsZHM6IHtcbiAgICAgICAgICAgICAgICBwcm9wZXJ0aWVzOiAxXG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICApO1xuXG4gICAgcmV0dXJuIHBwID8gcHAucHJvcGVydGllcyA6IG51bGw7XG59KTtcblxuTW9uZ29EQlBlcnNpc3RlbmNlLnByb3RvdHlwZS5nZXROZXh0V2FrZXVwYWJsZXMgPSBhc3luYyhmdW5jdGlvbiogKGNvdW50KSB7XG4gICAgeWllbGQgdGhpcy5fY29ubmVjdEFuZEluaXQoKTtcblxuICAgIGxldCByZXN1bHQgPSB5aWVsZCB0aGlzLl9zdGF0ZUNvbGxlY3Rpb25cbiAgICAgICAgLmFnZ3JlZ2F0ZShbXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgJG1hdGNoOiB7XG4gICAgICAgICAgICAgICAgICAgIGFjdGl2ZURlbGF5czogeyAkbmU6IG51bGwgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgJHByb2plY3Q6IHtcbiAgICAgICAgICAgICAgICAgICAgYWN0aXZlRGVsYXlzOiAxXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHsgJHVud2luZDogXCIkYWN0aXZlRGVsYXlzXCIgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAkc29ydDoge1xuICAgICAgICAgICAgICAgICAgICB1cGRhdGVkT246IDEsXG4gICAgICAgICAgICAgICAgICAgIFwiYWN0aXZlRGVsYXlzLmRlbGF5VG9cIjogMVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7ICRsaW1pdDogY291bnQgfVxuICAgICAgICBdKVxuICAgICAgICAudG9BcnJheSgpO1xuXG4gICAgcmV0dXJuIHJlc3VsdC5tYXAoZnVuY3Rpb24ocikge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgaW5zdGFuY2VJZDogci5faWQuaW5zdGFuY2VJZCxcbiAgICAgICAgICAgIHdvcmtmbG93TmFtZTogci5faWQud29ya2Zsb3dOYW1lLFxuICAgICAgICAgICAgYWN0aXZlRGVsYXk6IHtcbiAgICAgICAgICAgICAgICBtZXRob2ROYW1lOiByLmFjdGl2ZURlbGF5cy5tZXRob2ROYW1lLFxuICAgICAgICAgICAgICAgIGRlbGF5VG86IHIuYWN0aXZlRGVsYXlzLmRlbGF5VG9cbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICB9KTtcbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IE1vbmdvREJQZXJzaXN0ZW5jZTtcbiJdfQ==
