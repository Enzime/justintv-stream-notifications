/*
 * Created by Martin Giger
 * Licensed under LGPLv3
 *
 * Hitbox provider
 */

//TODO it's not possible to get followers via hitbox API as of yet.
 
"use strict";
var _ = require("sdk/l10n").get;
var { Channel, User } = require('../channeluser');

var type = "hitbox",
    archiveURL = "/videos",
    chatURL = "http://hitbox.tv/embedchat/",
    headers = {},
    baseURL = "http://api.hitbox.tv",
    cdnURL = "http://edge.sf.hitbox.tv";

var qs = require("../queueservice").getServiceForProvider(type);

function requeue(data) {
    return data.status > 499;
}

function getChannelFromJson(json) {
    var cho = new Channel();
    cho.login = json.channel.user_name;
    cho.uname = json.media_display_name;
    cho.url.push(json.channel.channel_link);
    cho.archiveUrl = json.channel.channel_link + archiveURL;
    cho.chatUrl = chatURL + json.channel.user_name;
    cho.type = type;
    cho.image = { "200": cdnURL+json.channel.user_logo,
                  "50": cdnURL+json.channel.user_logo_small };
    cho.title = json.media_status;
    cho.category = json.category_name;
    cho.viewers = json.media_views;
    cho.thumbnail = cdnURL+json.media_thumbnail;
    cho.live = json.media_is_live != "0";
    return cho;
}

const getHitboxChannelDetails = function(channelname, callback) {
    qs.queueRequest(baseURL+'/media/live/'+channelname, headers, requeue, function(data) {
        if(data.status == 200 && data.json && data.json.livestream )
            callback(getChannelFromJson(data.json.livestream[0]));
    });
};

const Hitbox = {
    name: _("provider_"+type),
    toString: function() { return this.name; },
    authURL: ["http://www.hitbox.tv"],
    supports:  { favorites: false, credentials: false },
    getUserFavorites: function(username, userCallback, channelsCallback) {
        //TODO
        qs.queueRequest(baseURL+''+username, headers, requeue, function(data) {
            userCallback(Object.assign(new User(), data.user));
            var channels = [];
            data.follows.forEach(function(channel) {
                channels.push(Object.assign(new Channel(), channel));
            });
            channelsCallback(channels);
        });
    },
    getChannelDetails: getHitboxChannelDetails,
    updateFavsRequest: function(users, userCallback, channelsCallback) {
        //TODO
        qs.queueUpdateRequest(channels, headers, qs.LOW_PRIORITY, requeue, function(data) {
            callback(data);
        });
    },
    removeFavsRequest: function() {
        qs.unqueueUpdateRequest(qs.LOW_PRIORITY);
    },
    updateRequest: function(channels, callback) {
        var urls = channels.map((channel) => { return baseURL+'/media/live/'+channel.login; });
        qs.queueUpdateRequest(urls, headers, qs.HIGH_PRIORITY, requeue, function(data) {
            if(data.status == 200 && data.json && data.json.livestream)
                callback(getChannelFromJson(data.json.livestream[0]));
        });
    },
    removeRequest: function() {
        qs.unqueueUpdateRequest(qs.HIGH_PRIORITY);
    },
    updateChannel: getHitboxChannelDetails,
    updateChannels: function(channels, callback) {
        channels.forEach(function(channel) {
            this.updateChannel(channel.login, callback);
        }, this);
    }
};

module.exports = Hitbox;


