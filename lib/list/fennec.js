/*
 * Created by Martin Giger
 * Licensed under MPL 2.0
 *
 *
 * Android Listview adapter
 */

"use strict";

const { HomePanel, Section, Types } = require("jetpack-homepanel"),
      _                             = require('sdk/l10n').get,
      { prefs }                     = require("sdk/simple-prefs");

const { Home: { panels: { ItemHandler }}} = require("resource://gre/modules/Home.jsm");

// setup event handling
var { emit } = require("sdk/event/core");
var { EventTarget } = require("sdk/event/target");

PanelList.prototype.section = null;
PanelList.prototype.panel   = null;
PanelList.prototype.liveChannels = [];
PanelList.prototype.thumbnails = false;
function PanelList(live, style) {
    let that = this;

    this.thumbnails = style == 2;
    this.liveChannels = [];
    this.createSection();

    this.panel = new HomePanel({
        title: _("live_widget_label"),
        sections: [ that.section ]
    });
}
PanelList.prototype = Object.create(EventTarget.prototype);
PanelList.prototype.constructor = PanelList;

PanelList.prototype.createSection = function() {
    this.section = new Section({
        type: this.thumbnails ? Types.GRID : Types.LIST,
        data: this.liveChannels.map(this.getItemFromChannel.bind(this)),
        empty: {
            text: _("live_widget_label_offline")
        },
        itemHandler: prefs.android_intents ? ItemHandler.INTENT : ItemHandler.BROWSER
    });
    this.section.on("refresh", () => {
        emit(this, "refresh");
        /** @todo make sure something sets data at some point */
    });
    emit(this, "ready");
};

PanelList.prototype.setLiveState = function() {};

PanelList.prototype.setStyle = function(style) {
    this.thumbnails = 2 == style;
    this.createSection();
    this.panel.sections = [ this.section ];
};

PanelList.prototype.setExtras = function(extras) {};
PanelList.prototype.setNonLiveDisplay = function(style) {
    //should actually do something
};

PanelList.prototype.addChannels = function(channels) {
    channels.forEach(function(channel) {
        if(channel.live.isLive) {
            this.liveChannels.push(channel);
            this.section.addData(this.getItemFromChannel(channel));
        }
    }, this);
};

PanelList.prototype.getItemFromChannel = function(channel) {
    var url = channel.url[0];
    var that = this;
    if(prefs.android_intents && channel.intent)
        url = channel.intent;
    return {
        url: url,
        title: channel.uname,
        description: channel.title,
        image_url: that.thumbnails ? channel.thumbnail : channel.getBestImageForSize(95)
    };
};

PanelList.prototype.setSectionData = function() {
    this.section.data = this.liveChannels.map(this.getItemFromChannel.bind(this));
};

PanelList.prototype.removeChannel = function(channelId) {
    this.liveChannels.splice(this.liveChannels.findIndex((ch) => ch.id == channelId), 1);
    if(this.liveChannels.length === 0) {
        this.section.clear();
        emit(this, "offline");
    }
    else {
        this.setSectionData();
    }
};

PanelList.prototype.setOnline = function(channel) {
    let index;
    if((index = this.liveChannels.findIndex((ch) => ch.id == channel.id))) {
        this.liveChannels[index] = channel;
        this.setSectionData();
    }
    else {
        this.addChannels([channel]);
    }
};

PanelList.prototype.setOffline = function(channel) {
    this.removeChannel(channel.id);
};
PanelList.prototype.setDistinct = function(channel) {
    this.removeChannel(channel.id);
};

PanelList.prototype.addExploreProviders = function() {};
PanelList.prototype.setFeatured = function() {};
PanelList.prototype.setQueueStatus = function() {};
PanelList.prototype.setQueuePaused = function() {};


exports.ListView = function(live, style) {
    return new PanelList(live, style);
};

