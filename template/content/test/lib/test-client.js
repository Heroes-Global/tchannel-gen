'use strict';

var TChannel = require('tchannel');
var HyperbahnClient = require('tchannel/hyperbahn');
var fs = require('fs');
var path = require('path');

var thriftFile = fs.readFileSync(path.join(
    __dirname, '..', '..', 'thrift', 'service.thrift'
), 'utf8');

var SERVICE_NAME = 'my-service';

module.exports = TestClient;

function TestClient(options) {
    if (!(this instanceof TestClient)) {
        return new TestClient(options);
    }

    var self = this;

    self.tchannel = TChannel({
        logger: options.logger
    });
    self.hyperbahnClient = HyperbahnClient({
        tchannel: self.tchannel,
        serviceName: SERVICE_NAME + '-test',
        hostPortList: options.peers,
        logger: options.logger,
        reportTracing: false
    });

    self.tchannelThrift = self.tchannel.TChannelThrift({
        source: thriftFile,
        channel: self.hyperbahnClient.getClientChannel({
            serviceName: SERVICE_NAME
        })
    });
}

TestClient.prototype.health = function health(cb) {
    var self = this;

    self.tchannelThrift.request({
        serviceName: 'logger'
    }).send('MyService::health_v1', null, null, cb);
};

TestClient.prototype.destroy = function destroy() {
    var self = this;

    self.hyperbahnClient.destroy();
    self.tchannel.close();
};
