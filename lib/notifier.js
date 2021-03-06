/**
 * Model for the Notifications
 *
 * @author Martin Giger
 * @license MPL-2.0
 * @module notifier
 */

const tabs = require('sdk/tabs'),
      Notifications = require('sdk/notifications'),
      { get: _ } = require('sdk/l10n'),
      { prefs } = require("sdk/simple-prefs");
const { LiveState } = require("./channel/live-state");

/**
 * Size of the image shown in the notification.
 * @const {number}
 * @default 100
 */
const NOTIFICATION_ICON_SIZE = 100;

/**
 * @constructs module:notifier.Notifier
 * @argument {Object} options - Event listeners, namely onClick listener as
 *                              property of the object.
 */
function Notifier(options) {
    this.channelTitles = new Map();
    this.channelStates = new Map();
    this._onClick = options.onClick;
}

/** @alias module:notifier.Notifier.prototype */
Notifier.prototype = {
    _onClick: null,
    /**
     * The last title of each channel by id the notifier last saw.
     * @type {Map.<number, string>}
     */
    channelTitles: null,
    /**
     * Proprietary thing I'm too tired to explain, but it stores the relevant
     * info about a channel's current state.
     * @type {Map.<number, object>}
     */
    channelStates: null,
    /**
     * If online notifications should be shown.
     * @type {boolean}
     * @readonly
     */
    get onlineNotifications() {
        return prefs.onlineNotification;
    },
    /**
     * If title change notifications should be shown.
     * @type {boolean}
     * @readonly
     */
    get titleNotifications() {
        return prefs.titleChangeNotification;
    },
    /**
     * If offline notifications should be shown.
     * @type {boolean}
     * @readonly
     */
    get offlineNotifications() {
        return prefs.offlineNotification;
    },
    /**
     * If non-live types are handled like a non-binary state, they get custom
     * notifications when this is set.
     * @type {boolean}
     * @readonly
     */
    get nonliveNotifications() {
        return prefs.nonliveNotification;
    },
    /**
     * If any notifications are to be shown
     * @type {boolean}
     * @readonly
     */
    get showNotifications() {
        return this.onlineNotifications || this.titleNotifications ||
               this.offlineNotifications || this.nonliveNotifications;
    },
    /**
     * Store a channel's state.
     * @argument {module:channel/core.Channel} channel - The channel to store
     */
    _setChannelState(channel) {
        this.channelStates.set(channel.id, {
            state: channel.live.state,
            user: channel.live.alternateUsername
        });
    },
    /**
     * Determine if the state of a channel has changed.
     * @argument {moduel:channel/core.Channel} channel - The channel that might
     *                                                   have changed.
     * @return {boolean}
     */
    _channelStateChanged(channel) {
        const oldState = this.channelStates.get(channel.id);
        return oldState === undefined || oldState.state != channel.live.state || oldState.user != channel.live.alternateUsername;
    },
    /**
     * Show a notification to the user, if the channel isn't in the currently
     * active tab, the channel changed accordingly and the respective
     * notification is activated.
     * This also manages the {@link module:notifier.Notifier~channelTitles} Map.
     * @argument {module:channel/core.Channel} channel - The channel to show a
     *                                                  notification for.
     */
    sendNotification(channel) {
        // Mute notifications for the current tab
        if(this.showNotifications && !channel.url.some((url) => url === tabs.activeTab.url)) {
            let title = null;
            if(channel.live.isLive(LiveState.TOWARD_OFFLINE) && this.onlineNotifications && !this.channelTitles.has(channel.id)) {
                title = _("onlineNotification", channel.toString());
            }
            else if(channel.live.isLive() && (channel.live.state === LiveState.LIVE || (this.nonliveNotifications && !this._channelStateChanged(channel))) && this.titleNotifications && this.channelTitles.get(channel.id) != channel.title) {
                title = _("updateNotification", channel.toString());
            }
            else if(!channel.live.isLive() && this.offlineNotifications && this.channelTitles.has(channel.id)) {
                title = _("offlineNotification", channel.toString());
            }
            else if(channel.live.state > LiveState.LIVE && this.nonliveNotifications && (!this.channelTitles.has(channel.id) || this.channelTitles.get(channel.id) == channel.title) && this._channelStateChanged(channel)) {
                const stateName = LiveState.REDIRECT === channel.live.state ? "redirect" : "rebroadcast";
                title = _("nonliveNotification", channel.toString(), _("nonliveNotification_state_"+stateName, channel.live.alternateUsername));
            }

            if(title !== null) {
                Notifications.notify({
                    title: title,
                    text: channel.title,
                    iconURL: channel.getBestImageForSize(NOTIFICATION_ICON_SIZE),
                    onClick: () => this._onClick(channel)
                });
            }
        }

        if(channel.live.isLive())
            this.channelTitles.set(channel.id, channel.title);
        else
            this.channelTitles.delete(channel.id);

        this._setChannelState(channel);
    },
    /**
     * Callback to call, whenever an event gets removed. This removes the
     * channel from the internal map.
     * @argument {number} channelId - ID of the channel that was removed.
     */
    onChannelRemoved(channelId) {
        if(this.channelTitles.has(channelId))
            this.channelTitles.delete(channelId);
        if(this.channelStates.has(channelId))
            this.channelStates.delete(channelId);
    }
};

exports.Notifier = Notifier;
