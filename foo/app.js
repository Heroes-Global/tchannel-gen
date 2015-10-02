'use strict';

var fetchConfig = require('zero-config');

var ApplicationClients = require('./clients.js');

module.exports = Application;

function Application(options) {
    if (!(this instanceof Application)) {
        return new Application(options);
    }

    var self = this;
    options = options || {};

    self.config = fetchConfig(__dirname, {
        dcValue: 'todo',
        seed: options.seedConfig,
        loose: false
    });

    self.clients = ApplicationClients(self.config, {
        logger: options.logger,
        statsd: options.statsd
    });
    self.hostPort = null;
    self.serviceName = null;

    var thrift = self.clients.appThrift;

    // TODO remove example endpoints
    thrift.register('MyService::get_v1', self, Application.get);
    thrift.register('MyService::put_v1', self, Application.put);

    // Example data structure on application
    self.exampleDb = {};
}

Application.prototype.bootstrap = function bootstrap(cb) {
    var self = this;

    self.clients.bootstrap(onBootstrap);

    function onBootstrap(err) {
        /*istanbul ignore if: should never happen in prod*/
        if (err) {
            return cb(err);
        }

        self.hostPort = self.clients.rootChannel.hostPort;
        self.serviceName = self.clients.serviceName;
        cb(null);
    }
};

Application.prototype.destroy = function destroy() {
    var self = this;

    self.clients.destroy();
};

// TODO remove me
Application.get = function get(app, req, head, body, cb) {
    if (!(body.key in app.exampleDb)) {
        return cb(null, {
            ok: false,
            body: new Error('no such key ' + body.key),
            typeName: 'noKey'
        });
    }

    var value = app.exampleDb[body.key];

    cb(null, {
        ok: true,
        body: value
    });
};

// TODO remove me
Application.put = function put(app, req, head, body, cb) {
    app.exampleDb[body.key] = body.value;

    cb(null, {
        ok: true,
        body: null
    });
};
