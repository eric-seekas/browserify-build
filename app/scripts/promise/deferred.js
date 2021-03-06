// ;(function ($) {
    var $ = require('jquery');
    var Callback = require('./callback');
    var slice = Array.prototype.slice;

    function Deferred(func) {
        var tuples = [
            // action, add listener, listerer list, final state
            ['resolve', 'done', Callback({once: 1, memory: 1}), 'resolved'],
            ['reject', 'fail', Callback({once: 1, memory: 1}), 'rejected'],
            ['notify', 'progress', Callback({memory: 1})]
        ],
        state = 'pending',
        promise = {
            state: function () {
                return state
            },
            always: function () {
                deferred.done(arguments).fail(arguments)
                return this;
            },
            then: function (/* fnDone [, fnFailed, fnProgress] */) {
                var fns = arguments
                return Deferred(function (defer) {
                    $.each(tuples, function(i, tuple) {
                        var fn = $.isFunction(fns[i]) && fns[i]
                        deferred[tuple[1]](function () {
                            var returned = fn && fn.apply(this, arguments)
                            if (returned && $.isFunction(returned.promise)){
                                returned.promise()
                                    .done(defer.resolve)
                                    .fail(defer.reject)
                                    .progress(defer.notify)
                            } else {
                                var context = this === promise ? defer.promise() : this,
                                    value = fn ? [returned] : arguments
                                defer[tuple[0] + 'with'](context, value)
                            }
                        })
                    })
                    fns = null
                }).promise();
            },

            promise: function (obj) {
                return obj != null ? $.extend(obj, promise) : promise
            }
        },
        deferred = {};

        $.each(tuples, function (i, tuple) {
            var list = tuple[2],
                stateString = tuple[3]

            promise[tuple[1]] = list.add

            if (stateString) {
                list.add(function () {
                    state = stateString
                }, tuples[i^1][2].disable, tuples[2][2].lock)
            }

            deferred[tuple[0]] = function () {
                deferred[tuple[0] + 'With'](this === deferred ? promise: this, arguments)
                return this;
            }
            deferred[tuple[0] + 'With'] = list.fireWith
        });
        promise.promise(deferred);

        if (func) {
            func.call(deferred, deferred);
        }
        return deferred;
    }

    $.when = function (sub) {
        var resolveValues = slice.call(arguments),
            len = resolveValues.length,
            i = 0,
            remain = len !== 1 || (sub && $.isFunction(sub.promise))
            deferred = remain === 1 ? sub : Deferred(),
            progressValue,
            progressContexts,
            resolveContexts;

        var updateFn = function (i, ctx, val) {
            return function(value) {
                ctx[i] = this;
                val[i] = arguments.length > 1 ? slice.call(arguments) : value
                if (val === progressValue) {
                    deferred.notifyWith(ctx, val)
                } else if (!(--remain)) {
                    deferred.resolveWith(ctx, val)
                }
            }
        }
        if (len > 1) {
            progressValue = new Array(len);
            progressContexts = new Array(len);
            resolveContexts = new Array(len);

            for (; i < len; ++i) {
                if (resolveValues[i] && $.isFunction(resolveValues[i].promise)) {
                    resolveValues[i].promise()
                        .done(updateFn(i, resolveContexts, resolveValues))
                        .fail(deferred.reject)
                        .progress(updateFn(i, progressContexts, progressValues))
                } else {
                    --remain
                }
            }
        }

        if (!remain) {
            deferred.resolveWith(resolveContexts, resolveValues)
        } 
        return deferred.promise()
    }
    $.Deferred = Deferred
    module.exports = Deferred;
// })