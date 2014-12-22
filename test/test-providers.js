/*
 * Created by Martin Giger
 * Licensed under LGPLv3
 */
const providers = require("../lib/providers"),
       { isValidURI } = require("sdk/url");      

exports.testProviders = function(assert) {
    var provider;
    for(var p in providers) {
        provider = providers[p];
        assert.equal(typeof(provider.name), "string", "Name is a string");
        assert.equal(provider.name, provider.toString(), "toString and name return the same");
        assert.ok(isValidURI(provider.authURL), "Auth URL is an URI");
        assert.equal(typeof(provider.getUserFavorites), "function", "getUserFavorites is implemented");
        assert.equal(typeof(provider.getChannelDetails), "function", "getChannelDetails is implemented");
        assert.equal(typeof(provider.updateRequest), "function", "updateRequest is implemented");
        assert.equal(typeof(provider.removeRequest), "function", "removeRequest is implemented");
        assert.equal(typeof(provider.updateChannel), "function", "updateChannel is implemented");
        assert.equal(typeof(provider.updateChannels), "function", "updateChannels is implemented");
    }
};

require("sdk/test").run(exports);

